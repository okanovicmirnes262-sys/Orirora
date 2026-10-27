import { callEdgeFunction } from "../supabaseClient";

/* ------------------------------------------------------------------ */
/*  Admin API — thin client for the `admin` Edge Function              */
/* ------------------------------------------------------------------ */
/*  The session token lives in sessionStorage, so closing the tab signs out.
    A 401 from any call clears it and notifies AdminApp to show the login. */

const TOKEN_KEY = "ordiora-admin:token";

type Session = { token: string; expiresAt: number };

export function getSession(): Session | null {
  try {
    const raw = window.sessionStorage.getItem(TOKEN_KEY);
    const s = raw ? (JSON.parse(raw) as Session) : null;
    return s && s.expiresAt > Date.now() ? s : null;
  } catch (e) {
    return null;
  }
}

function setSession(s: Session | null) {
  try {
    if (s) window.sessionStorage.setItem(TOKEN_KEY, JSON.stringify(s));
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch (e) { /* private mode — session lasts until reload */ }
}

const listeners = new Set<() => void>();
export function onSignedOut(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function signOut() {
  setSession(null);
  listeners.forEach((fn) => fn());
}

export async function login(password: string) {
  const s = await callEdgeFunction("admin", { action: "login", password });
  setSession(s);
  return s;
}

export async function api<T = any>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const s = getSession();
  if (!s) { signOut(); throw new Error("Sesija je istekla. Prijavi se ponovno."); }
  try {
    return await callEdgeFunction("admin", { action, ...payload }, { "x-admin-token": s.token });
  } catch (e: any) {
    if (e && e.status === 401) signOut();
    throw e;
  }
}

/* ------------------------------------------------------------------ */
/*  Shared types                                                       */
/* ------------------------------------------------------------------ */

export type RestaurantRow = {
  slug: string; name: string; inRegistry: boolean;
  ownerName: string | null; ownerEmail: string | null;
  staffCount: number; reservationCount: number; tableCount: number;
  lastUpdate: string | null; suspended: boolean; suspendMessage: string | null; openErrors: number;
};

export type ErrorRow = {
  id: string; created_at: string; kind: string; message: string;
  slug: string | null; user_email: string | null; user_role: string | null;
  view: string | null; action: string | null; user_note: string | null;
  status: "new" | "seen" | "resolved";
};

export type HistoryRow = {
  id: string; created_at: string; slug: string | null; key: string | null;
  action: string; old_value: unknown; new_value: unknown; note: string | null;
};

export type KeyRow = { key: string; value: any; updated_at: string };

export type RestaurantDetail = {
  slug: string;
  registryEntry: { slug: string; name: string } | null;
  keys: KeyRow[];
  status: { slug: string; suspended: boolean; message: string | null };
  note: { slug: string; notes: string; updated_at: string | null };
};
