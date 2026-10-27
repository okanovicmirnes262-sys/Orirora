import { supabase } from "./supabaseClient";

/* ------------------------------------------------------------------ */
/*  Error reporter                                                     */
/* ------------------------------------------------------------------ */
/*  Sends app errors to the `error_logs` table (anon may only INSERT there),
    where the /admin panel reads them. Context — restaurant, signed-in user,
    current screen — is kept up to date by the app via setErrorContext().

    Reporting is strictly best-effort: it never throws, never blocks the UI,
    and is throttled so a failing loop can't flood the table (the same error
    at most once a minute, at most 20 automatic reports per page load). */

type Kind = "js_error" | "promise" | "crash" | "save_failed" | "load_failed" | "user_report";
type Context = { slug?: string | null; email?: string | null; role?: string | null; view?: string | null };

const DEDUPE_MS = 60_000;
const MAX_AUTO_REPORTS = 20;
const MAX_USER_REPORTS = 5;

let context: Context = {};
const lastSent = new Map<string, number>();
let autoSent = 0;
let userSent = 0;

export function setErrorContext(next: Context) {
  context = { ...context, ...next };
}

const clip = (s: unknown, n: number) => (s == null || s === "" ? null : String(s).slice(0, n));

/* Resolves true when the report was stored. */
export async function reportError(kind: Kind, message: unknown, extra: { action?: string; note?: string } = {}): Promise<boolean> {
  if (!supabase) return false;
  const msg = clip(message, 2000) || "Unknown error";
  if (kind === "user_report") {
    if (userSent >= MAX_USER_REPORTS) return false;
    userSent += 1;
  } else {
    const sig = `${kind}|${msg}|${extra.action || ""}`;
    const prev = lastSent.get(sig);
    if (prev && Date.now() - prev < DEDUPE_MS) return false;
    if (autoSent >= MAX_AUTO_REPORTS) return false;
    lastSent.set(sig, Date.now());
    autoSent += 1;
  }
  try {
    const { error } = await supabase.from("error_logs").insert({
      kind,
      message: msg,
      slug: clip(context.slug, 100),
      user_email: clip(context.email, 200),
      user_role: clip(context.role, 40),
      view: clip(context.view, 60),
      action: clip(extra.action, 300),
      user_note: clip(extra.note, 4000),
    });
    return !error;
  } catch (e) {
    return false;
  }
}

// Browser noise that isn't an app bug.
const IGNORED = [/ResizeObserver loop/i, /^Script error\.?$/i];

export function installGlobalErrorHandlers() {
  if (typeof window === "undefined") return;
  window.addEventListener("error", (e) => {
    const msg = e.message || (e.error && e.error.message) || "";
    if (!msg || IGNORED.some((re) => re.test(msg))) return;
    reportError("js_error", msg);
  });
  window.addEventListener("unhandledrejection", (e) => {
    const r = e.reason;
    const msg = (r && (r.message || (typeof r === "string" ? r : ""))) || "Unhandled promise rejection";
    if (IGNORED.some((re) => re.test(msg))) return;
    reportError("promise", msg);
  });
}
