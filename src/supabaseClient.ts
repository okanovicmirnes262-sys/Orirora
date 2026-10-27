import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/* ------------------------------------------------------------------ */
/*  Supabase client                                                    */
/* ------------------------------------------------------------------ */
/*  Configuration is read from Vite env vars at build time. Copy
    `.env.example` to `.env` and fill in the two values from your
    Supabase project (Settings → API):

      VITE_SUPABASE_URL       = https://<project-ref>.supabase.co
      VITE_SUPABASE_ANON_KEY  = <the public anon key>

    Only the PUBLIC anon key belongs here — never the service_role key. */

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: false },
    })
  : null;

/* Name of the key/value table that backs all shared (cloud-synced) data.
   See supabase/schema.sql for the table definition. */
export const KV_TABLE = "kv_store";

/* POST to a Supabase Edge Function. Plain fetch (not functions.invoke) so a
   non-2xx response still gives us its JSON `error` message. Throws an Error
   carrying `status` on failure. */
export async function callEdgeFunction(name: string, body: unknown, headers: Record<string, string> = {}) {
  if (!url || !anonKey) throw Object.assign(new Error("Supabase nije konfiguriran."), { status: 0 });
  let res: Response;
  try {
    res = await fetch(`${url}/functions/v1/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: anonKey, Authorization: `Bearer ${anonKey}`, ...headers },
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw Object.assign(new Error("Nema veze sa serverom."), { status: 0 });
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `Greška ${res.status}`;
    throw Object.assign(new Error(msg), { status: res.status });
  }
  return data;
}
