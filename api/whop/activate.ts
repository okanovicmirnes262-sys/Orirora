/* Vercel Serverless Function — validate a Whop license key server-side.
 *
 * The ORDIORA app calls this when an owner pastes their license key. The Whop
 * API key stays here (server env) and NEVER reaches the browser. Clients never
 * log in with Whop — this is a background check only.
 *
 * Env vars (set in the Vercel project):
 *   WHOP_API_KEY       — your Whop API key (Whop dashboard → Developer/API).
 *   WHOP_PLAN_ID       — plan_NwB6iHkwaNvEM (optional: also enforce the plan).
 *   WHOP_VALIDATE_URL  — optional override if your Whop API path differs from
 *                        the v2 default below (confirm in Whop's docs).
 *
 * Response: { valid: boolean, status: string|null, entitledUntil: number|null }
 */

const DEFAULT_VALIDATE_URL = "https://api.whop.com/api/v2/memberships/validate_license";

function cors(res: any) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/* Ask Whop whether this license key is real and its membership is active.
 * Parses defensively across Whop response shapes; adjust here if your account's
 * API returns different field names. */
async function validateLicense(license: string): Promise<{ valid: boolean; status: string | null; entitledUntil: number | null; error?: string }> {
  const apiKey = process.env.WHOP_API_KEY;
  const planId = process.env.WHOP_PLAN_ID;
  const url = process.env.WHOP_VALIDATE_URL || DEFAULT_VALIDATE_URL;
  if (!apiKey) return { valid: false, status: null, entitledUntil: null, error: "server-misconfigured" };

  let resp: Response;
  try {
    resp = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ license_key: license, metadata: {} }),
    });
  } catch {
    return { valid: false, status: null, entitledUntil: null, error: "whop-unreachable" };
  }

  let data: any = {};
  try { data = await resp.json(); } catch { /* non-JSON */ }
  if (!resp.ok) return { valid: false, status: null, entitledUntil: null, error: "invalid-key" };

  const m = data && (data.membership || data);
  const status = String((m && m.status) || "").toLowerCase();
  const okStatus = ["active", "trialing", "trial", "completed"].includes(status);
  const valid0 = data?.valid === true || m?.valid === true || okStatus;

  // Optional: ensure this membership is for our plan/product.
  let valid = valid0;
  if (valid && planId) {
    const plan = m?.plan_id || m?.plan || m?.product_id || m?.product;
    if (plan && String(plan) !== String(planId)) valid = false;
  }

  // Prefer Whop's period end for entitledUntil; else the app applies a re-check window.
  let entitledUntil: number | null = null;
  const endRaw = m?.renewal_period_end ?? m?.expires_at ?? m?.valid_until;
  if (endRaw != null) {
    const n = typeof endRaw === "number" ? (endRaw < 1e12 ? endRaw * 1000 : endRaw) : Date.parse(endRaw);
    if (!Number.isNaN(n)) entitledUntil = n;
  }

  return { valid, status: status || null, entitledUntil };
}

export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ valid: false, error: "method" });

  let body: any = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const license = String((body && body.license) || "").trim();
  if (!license) return res.status(400).json({ valid: false, error: "missing-license" });

  const result = await validateLicense(license);
  return res.status(200).json({
    valid: !!result.valid,
    status: result.status,
    entitledUntil: result.valid ? result.entitledUntil : null,
    error: result.error || null,
  });
}
