// ORDIORA — admin Edge Function
//
// Every /admin action goes through here. The function holds the service_role
// key (auto-injected by Supabase), so the browser never gets it. Access:
//
//   POST { action: "login", password }          → { token, expiresAt }
//   POST { action: "<anything else>", ... }      + header x-admin-token: <token>
//   POST { action: "redeem_impersonation", token } (called by the app itself,
//        no admin token — the one-time impersonation token is the credential)
//
// Required secret: ADMIN_PASSWORD (Dashboard → Edge Functions → Secrets).
// The session-token signing key is derived from the service_role key + the
// admin password, so changing the password invalidates every admin session.

import { createClient } from "jsr:@supabase/supabase-js@2";

const ADMIN_PASSWORD = Deno.env.get("ADMIN_PASSWORD") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const SESSION_HOURS = 12;
const IMPERSONATION_SECONDS = 120;
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-admin-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

/* ------------------------------------------------------------------ */
/*  Crypto helpers                                                     */
/* ------------------------------------------------------------------ */

const enc = new TextEncoder();

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): Uint8Array {
  const pad = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(pad);
  return Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
}

let hmacKey: Promise<CryptoKey> | null = null;
function signingKey(): Promise<CryptoKey> {
  hmacKey ??= crypto.subtle
    .digest("SHA-256", enc.encode(`ordiora-admin|${SERVICE_KEY}|${ADMIN_PASSWORD}`))
    .then((raw) => crypto.subtle.importKey("raw", raw, { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]));
  return hmacKey;
}

async function signToken(payload: Record<string, unknown>): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await signingKey(), enc.encode(body));
  return `${body}.${b64url(sig)}`;
}

async function verifyToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  try {
    const ok = await crypto.subtle.verify("HMAC", await signingKey(), b64urlDecode(sig), enc.encode(body));
    if (!ok) return false;
    const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(body)));
    return payload.typ === "admin" && typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

// Compare SHA-256 digests byte by byte without early exit, so response time
// doesn't reveal how much of the password matched.
async function passwordMatches(input: string): Promise<boolean> {
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(input)),
    crypto.subtle.digest("SHA-256", enc.encode(ADMIN_PASSWORD)),
  ]);
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

/* ------------------------------------------------------------------ */
/*  Data helpers                                                       */
/* ------------------------------------------------------------------ */

const REGISTRY_KEY = "restaurantos:registry";
const SLUG_RE = /^[a-z0-9-]{1,60}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function requireSlug(slug: unknown): string {
  if (typeof slug !== "string" || !SLUG_RE.test(slug)) throw new HttpError(400, "Neispravan slug restorana.");
  return slug;
}
function requireKey(key: unknown): string {
  if (typeof key !== "string" || !key.startsWith("restaurantos:") || key.length > 200) {
    throw new HttpError(400, "Neispravan ključ.");
  }
  return key;
}
function slugOfKey(key: string): string | null {
  const parts = key.split(":");
  return parts.length >= 3 ? parts[1] : null;
}

function check<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new HttpError(500, res.error.message);
  return res.data;
}

async function getKey(key: string): Promise<unknown | null> {
  const row = check(await db.from("kv_store").select("value").eq("key", key).maybeSingle());
  return row ? (row as { value: unknown }).value : null;
}

// null deletes the key — mirrors saveKey() in the app.
async function putKey(key: string, value: unknown): Promise<void> {
  if (value === null || value === undefined) {
    check(await db.from("kv_store").delete().eq("key", key));
  } else {
    check(await db.from("kv_store").upsert({ key, value }, { onConflict: "key" }));
  }
}

async function logHistory(row: {
  slug?: string | null; key?: string | null; action: string;
  old_value?: unknown; new_value?: unknown; note?: string | null;
}) {
  check(await db.from("admin_history").insert({
    slug: row.slug ?? null, key: row.key ?? null, action: row.action,
    old_value: row.old_value ?? null, new_value: row.new_value ?? null, note: row.note ?? null,
  }));
}

/* Writes a key and records the previous value so it can be restored. */
async function setKeyWithHistory(key: string, value: unknown, action: string, note?: string) {
  const old = await getKey(key);
  await logHistory({ slug: slugOfKey(key), key, action, old_value: old, new_value: value, note });
  await putKey(key, value);
}

async function restaurantKeys(slug: string) {
  return check(await db.from("kv_store").select("key, value, updated_at").like("key", `restaurantos:${slug}:%`).order("key")) as
    { key: string; value: unknown; updated_at: string }[];
}

async function registry(): Promise<{ slug: string; name: string }[]> {
  const reg = await getKey(REGISTRY_KEY);
  return Array.isArray(reg) ? reg as { slug: string; name: string }[] : [];
}

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

type Body = Record<string, any>;

async function login(body: Body, ip: string) {
  if (ADMIN_PASSWORD.length < 8) {
    throw new HttpError(500, "ADMIN_PASSWORD nije postavljen (ili je kraći od 8 znakova) u Supabase secretima.");
  }
  const since = new Date(Date.now() - LOCKOUT_MINUTES * 60_000).toISOString();
  const { count } = await db.from("admin_login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip", ip).eq("success", false).gte("created_at", since);
  if ((count ?? 0) >= MAX_FAILED_LOGINS) {
    throw new HttpError(429, `Previše neuspjelih pokušaja. Pokušaj ponovno za ${LOCKOUT_MINUTES} minuta.`);
  }
  const ok = await passwordMatches(String(body.password ?? ""));
  await db.from("admin_login_attempts").insert({ ip, success: ok });
  if (!ok) throw new HttpError(401, "Pogrešna lozinka.");
  const expiresAt = Date.now() + SESSION_HOURS * 3600_000;
  return { token: await signToken({ typ: "admin", exp: expiresAt }), expiresAt };
}

async function openErrorCounts(): Promise<Record<string, number>> {
  const rows = check(await db.from("error_logs").select("slug").neq("status", "resolved").limit(10000)) as { slug: string | null }[];
  const out: Record<string, number> = {};
  for (const r of rows) { const k = r.slug ?? ""; out[k] = (out[k] ?? 0) + 1; }
  return out;
}

async function overview() {
  const day = new Date(Date.now() - 86400_000).toISOString();
  const week = new Date(Date.now() - 7 * 86400_000).toISOString();
  const countSince = async (since: string) =>
    (await db.from("error_logs").select("id", { count: "exact", head: true }).gte("created_at", since)).count ?? 0;
  const [reg, statuses, errors24h, errors7d, newErrors, recent, open] = await Promise.all([
    registry(),
    db.from("restaurant_status").select("slug").eq("suspended", true),
    countSince(day),
    countSince(week),
    db.from("error_logs").select("id", { count: "exact", head: true }).eq("status", "new"),
    db.from("error_logs").select("*").order("created_at", { ascending: false }).limit(10),
    openErrorCounts(),
  ]);
  const names = Object.fromEntries(reg.map((r) => [r.slug, r.name]));
  const top = Object.entries(open)
    .filter(([slug]) => slug)
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([slug, n]) => ({ slug, name: names[slug] ?? slug, open: n }));
  return {
    restaurants: reg.length,
    suspended: check(statuses).length,
    errors24h, errors7d,
    newErrors: newErrors.count ?? 0,
    openErrors: Object.values(open).reduce((a, b) => a + b, 0),
    recentErrors: check(recent),
    topRestaurants: top,
  };
}

async function listRestaurants() {
  const [reg, summary, statuses, open] = await Promise.all([
    registry(),
    db.rpc("admin_restaurant_summary"),
    db.from("restaurant_status").select("*"),
    openErrorCounts(),
  ]);
  const bySlug = new Map((check(summary) as any[]).map((s) => [s.slug, s]));
  const statusBySlug = new Map((check(statuses) as any[]).map((s) => [s.slug, s]));
  const slugs = new Set([...reg.map((r) => r.slug), ...bySlug.keys()]);
  return [...slugs].map((slug) => {
    const s = bySlug.get(slug) ?? {};
    const r = reg.find((x) => x.slug === slug);
    const st = statusBySlug.get(slug);
    return {
      slug,
      name: r?.name ?? s.restaurant_name ?? slug,
      inRegistry: Boolean(r),
      ownerName: s.owner_name ?? null,
      ownerEmail: s.owner_email ?? null,
      staffCount: s.staff_count ?? 0,
      reservationCount: s.reservation_count ?? 0,
      tableCount: s.table_count ?? 0,
      lastUpdate: s.last_update ?? null,
      suspended: Boolean(st?.suspended),
      suspendMessage: st?.message ?? null,
      openErrors: open[slug] ?? 0,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

async function getRestaurant(body: Body) {
  const slug = requireSlug(body.slug);
  const [keys, reg, status, note] = await Promise.all([
    restaurantKeys(slug),
    registry(),
    db.from("restaurant_status").select("*").eq("slug", slug).maybeSingle(),
    db.from("admin_notes").select("*").eq("slug", slug).maybeSingle(),
  ]);
  return {
    slug,
    registryEntry: reg.find((r) => r.slug === slug) ?? null,
    keys,
    status: check(status) ?? { slug, suspended: false, message: null },
    note: check(note) ?? { slug, notes: "", updated_at: null },
  };
}

async function setKey(body: Body) {
  const key = requireKey(body.key);
  await setKeyWithHistory(key, body.value ?? null, "set_key", typeof body.note === "string" ? body.note.slice(0, 500) : undefined);
  return { ok: true };
}

async function restore(body: Body) {
  if (typeof body.id !== "string" || !UUID_RE.test(body.id)) throw new HttpError(400, "Neispravan ID povijesti.");
  const row = check(await db.from("admin_history").select("*").eq("id", body.id).maybeSingle()) as any;
  if (!row) throw new HttpError(404, "Zapis povijesti nije pronađen.");

  if (row.action === "delete_restaurant") {
    const snap = row.old_value as { keys: { key: string; value: unknown }[]; registryEntry: any } | null;
    if (!snap) throw new HttpError(400, "Ovaj zapis nema snimku za vraćanje.");
    for (const k of snap.keys) await putKey(k.key, k.value);
    if (snap.registryEntry) {
      const reg = await registry();
      if (!reg.some((r) => r.slug === snap.registryEntry.slug)) {
        await setKeyWithHistory(REGISTRY_KEY, [...reg, snap.registryEntry], "restore", `Vraćen restoran ${row.slug}`);
      }
    }
    await logHistory({ slug: row.slug, action: "restore", note: `Vraćen obrisani restoran (zapis ${row.id})` });
    return { ok: true };
  }

  if (!row.key) throw new HttpError(400, "Ovu radnju nije moguće vratiti.");
  await setKeyWithHistory(row.key, row.old_value, "restore", `Vraćeno na stanje prije zapisa ${row.id}`);
  return { ok: true };
}

async function listErrors(body: Body) {
  let q = db.from("error_logs").select("*").order("created_at", { ascending: false }).limit(Math.min(Number(body.limit) || 500, 2000));
  if (body.slug) q = q.eq("slug", requireSlug(body.slug));
  if (body.status && body.status !== "all") {
    q = body.status === "open" ? q.neq("status", "resolved") : q.eq("status", String(body.status));
  }
  if (body.kind && body.kind !== "all") q = q.eq("kind", String(body.kind));
  if (body.days) q = q.gte("created_at", new Date(Date.now() - Number(body.days) * 86400_000).toISOString());
  return check(await q);
}

async function updateErrors(body: Body) {
  const ids = Array.isArray(body.ids) ? body.ids.filter((x: unknown) => typeof x === "string" && UUID_RE.test(x as string)) : [];
  if (!ids.length) throw new HttpError(400, "Nema odabranih grešaka.");
  if (!["new", "seen", "resolved"].includes(body.status)) throw new HttpError(400, "Neispravan status.");
  check(await db.from("error_logs").update({ status: body.status }).in("id", ids));
  return { ok: true };
}

async function setStatus(body: Body) {
  const slug = requireSlug(body.slug);
  const suspended = Boolean(body.suspended);
  const message = typeof body.message === "string" ? body.message.slice(0, 500) : null;
  const old = check(await db.from("restaurant_status").select("*").eq("slug", slug).maybeSingle());
  check(await db.from("restaurant_status").upsert({ slug, suspended, message, updated_at: new Date().toISOString() }));
  await logHistory({ slug, action: suspended ? "suspend" : "unsuspend", old_value: old, new_value: { suspended, message } });
  return { ok: true };
}

async function setNote(body: Body) {
  const slug = requireSlug(body.slug);
  const notes = String(body.notes ?? "").slice(0, 20000);
  check(await db.from("admin_notes").upsert({ slug, notes, updated_at: new Date().toISOString() }));
  return { ok: true };
}

async function exportRestaurant(body: Body) {
  const data = await getRestaurant(body);
  return { exportedAt: new Date().toISOString(), ...data };
}

async function deleteRestaurant(body: Body) {
  const slug = requireSlug(body.slug);
  const reg = await registry();
  const entry = reg.find((r) => r.slug === slug) ?? null;
  const expected = (entry?.name ?? slug).trim().toLowerCase();
  if (String(body.confirmName ?? "").trim().toLowerCase() !== expected) {
    throw new HttpError(400, "Upisano ime se ne podudara s imenom restorana.");
  }
  const keys = await restaurantKeys(slug);
  await logHistory({
    slug, action: "delete_restaurant",
    old_value: { keys: keys.map(({ key, value }) => ({ key, value })), registryEntry: entry },
    note: `Obrisano ${keys.length} ključeva`,
  });
  if (keys.length) check(await db.from("kv_store").delete().in("key", keys.map((k) => k.key)));
  if (entry) await setKeyWithHistory(REGISTRY_KEY, reg.filter((r) => r.slug !== slug), "set_key", `Uklonjen ${slug} iz registra`);
  return { ok: true, deletedKeys: keys.length };
}

async function history(body: Body) {
  let q = db.from("admin_history").select("*").order("created_at", { ascending: false }).limit(Math.min(Number(body.limit) || 200, 1000));
  if (body.slug) q = q.eq("slug", requireSlug(body.slug));
  return check(await q);
}

async function impersonate(body: Body) {
  const slug = requireSlug(body.slug);
  const accounts = await getKey(`restaurantos:${slug}:accounts`);
  const owner = Array.isArray(accounts) ? (accounts as any[]).find((a) => a?.role === "owner") : null;
  if (!owner?.email) throw new HttpError(404, "Restoran nema vlasnički nalog.");
  const row = check(await db.from("admin_impersonations").insert({
    slug, email: owner.email, expires_at: new Date(Date.now() + IMPERSONATION_SECONDS * 1000).toISOString(),
  }).select("id").single()) as { id: string };
  await logHistory({ slug, action: "impersonate", note: `Ulaz kao ${owner.email}` });
  return { token: row.id };
}

async function redeemImpersonation(body: Body) {
  if (typeof body.token !== "string" || !UUID_RE.test(body.token)) throw new HttpError(400, "Neispravan token.");
  const now = new Date().toISOString();
  const rows = check(await db.from("admin_impersonations")
    .update({ redeemed_at: now })
    .eq("id", body.token).is("redeemed_at", null).gt("expires_at", now)
    .select("slug, email")) as { slug: string; email: string }[];
  if (!rows.length) throw new HttpError(401, "Token je istekao ili je već iskorišten.");
  const { slug, email } = rows[0];
  const [accounts, reg] = await Promise.all([getKey(`restaurantos:${slug}:accounts`), registry()]);
  const account = Array.isArray(accounts) ? (accounts as any[]).find((a) => a?.email === email) : null;
  if (!account) throw new HttpError(404, "Vlasnički nalog više ne postoji.");
  const entry = reg.find((r) => r.slug === slug) ?? { slug, name: slug };
  return { workspace: entry, account };
}

const ACTIONS: Record<string, (body: Body) => Promise<unknown>> = {
  overview: () => overview(),
  list_restaurants: () => listRestaurants(),
  get_restaurant: getRestaurant,
  set_key: setKey,
  restore,
  list_errors: listErrors,
  update_errors: updateErrors,
  set_status: setStatus,
  set_note: setNote,
  export: exportRestaurant,
  delete_restaurant: deleteRestaurant,
  history,
  impersonate,
};

/* ------------------------------------------------------------------ */
/*  Entry                                                              */
/* ------------------------------------------------------------------ */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json().catch(() => ({})) as Body;
    const action = String(body.action ?? "");
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";

    if (action === "login") return json(await login(body, ip));
    if (action === "redeem_impersonation") return json(await redeemImpersonation(body));

    if (!(await verifyToken(req.headers.get("x-admin-token")))) {
      return json({ error: "Sesija je istekla. Prijavi se ponovno." }, 401);
    }
    const handler = ACTIONS[action];
    if (!handler) return json({ error: `Nepoznata radnja: ${action}` }, 400);
    return json(await handler(body));
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status);
    console.error(e);
    return json({ error: "Greška na serveru." }, 500);
  }
});
