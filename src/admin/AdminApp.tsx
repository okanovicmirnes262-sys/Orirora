import React, { useCallback, useEffect, useState } from "react";
import { LayoutDashboard, Store, Bug, History as HistoryIcon, LogOut, Sun, Moon, Lock, ExternalLink } from "lucide-react";
import { OrdioraMark } from "../RestaurantOS";
import { setErrorContext } from "../errorReporter";
import { api, getSession, login, onSignedOut, signOut } from "./api";
import { AdminContext, Button, Input, colorsFor, font, useAdminBp, errMsg, type Colors } from "./ui";
import Overview from "./Overview";
import Restaurants from "./Restaurants";
import RestaurantDetail from "./RestaurantDetail";
import Errors from "./Errors";
import History from "./History";

/* ------------------------------------------------------------------ */
/*  ORDIORA admin — /admin                                             */
/* ------------------------------------------------------------------ */
/*  Routes (History API; vercel.json rewrites everything to index.html):
      /admin                          Pregled
      /admin/restorani                Restorani
      /admin/restorani/:slug[/:tab]   Detalj restorana
      /admin/greske                   Greške
      /admin/povijest                 Povijest izmjena                   */

const THEME_KEY = "ordiora-admin:theme";

function initialDark() {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved) return saved === "dark";
  } catch (e) { /* ignore */ }
  return window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)").matches : true;
}

type Route =
  | { name: "overview" }
  | { name: "restaurants" }
  | { name: "restaurant"; slug: string; tab?: string }
  | { name: "errors" }
  | { name: "history" };

function parseRoute(pathname: string): Route {
  const parts = pathname.replace(/^\/admin\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
  if (parts[0] === "restorani" && parts[1]) return { name: "restaurant", slug: parts[1], tab: parts[2] };
  if (parts[0] === "restorani") return { name: "restaurants" };
  if (parts[0] === "greske") return { name: "errors" };
  if (parts[0] === "povijest") return { name: "history" };
  return { name: "overview" };
}

const NAV = [
  { key: "overview", path: "/admin", label: "Pregled", icon: LayoutDashboard },
  { key: "restaurants", path: "/admin/restorani", label: "Restorani", icon: Store },
  { key: "errors", path: "/admin/greske", label: "Greške", icon: Bug },
  { key: "history", path: "/admin/povijest", label: "Povijest", icon: HistoryIcon },
] as const;

const TITLES: Record<string, string> = { overview: "Pregled", restaurants: "Restorani", restaurant: "Restoran", errors: "Greške", history: "Povijest izmjena" };

export default function AdminApp() {
  const [isDark, setIsDark] = useState(initialDark);
  const [authed, setAuthed] = useState(() => Boolean(getSession()));
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.pathname));
  const [newErrors, setNewErrors] = useState(0);
  const [toastMsg, setToastMsg] = useState<{ msg: string; kind: "ok" | "error" } | null>(null);
  const bp = useAdminBp();
  const c = colorsFor(isDark);

  useEffect(() => { document.title = "ORDIORA Admin"; setErrorContext({ view: "admin", slug: null, email: null, role: "admin" }); }, []);
  useEffect(() => { try { window.localStorage.setItem(THEME_KEY, isDark ? "dark" : "light"); } catch (e) { /* ignore */ } }, [isDark]);
  useEffect(() => onSignedOut(() => setAuthed(false)), []);
  useEffect(() => {
    const onPop = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((path: string) => {
    if (path !== window.location.pathname) window.history.pushState({}, "", path);
    setRoute(parseRoute(path));
    window.scrollTo(0, 0);
    document.getElementById("adm-main")?.scrollTo(0, 0);
  }, []);

  const toast = useCallback((msg: string, kind: "ok" | "error" = "ok") => {
    setToastMsg({ msg, kind });
    window.setTimeout(() => setToastMsg((t) => (t && t.msg === msg ? null : t)), 3200);
  }, []);

  // "New errors" badge in the nav — refreshed every minute and after triage.
  const refreshBadge = useCallback(() => {
    api<{ newErrors: number }>("overview").then((o) => setNewErrors(o.newErrors), () => {});
  }, []);
  useEffect(() => {
    if (!authed) return;
    refreshBadge();
    const id = window.setInterval(refreshBadge, 60_000);
    return () => window.clearInterval(id);
  }, [authed, refreshBadge]);

  const ctx = { c, bp, isDark, navigate, toast, refreshBadge };

  return (
    <AdminContext.Provider value={ctx}>
      <GlobalStyles c={c} />
      {authed
        ? <Shell route={route} newErrors={newErrors} isDark={isDark} setIsDark={setIsDark} />
        : <Login onDone={() => setAuthed(true)} isDark={isDark} setIsDark={setIsDark} />}
      {toastMsg && (
        <div role="status" style={{
          position: "fixed", left: "50%", transform: "translateX(-50%)", zIndex: 300,
          bottom: bp === "mobile" ? "calc(84px + env(safe-area-inset-bottom, 0px))" : 24,
          background: toastMsg.kind === "error" ? c.danger : c.cta, color: toastMsg.kind === "error" ? "#FFF" : c.ctaText,
          padding: "11px 18px", borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: "0 12px 30px -10px rgba(0,0,0,.5)",
          maxWidth: "calc(100vw - 32px)", fontFamily: font.body,
        }}>{toastMsg.msg}</div>
      )}
    </AdminContext.Provider>
  );
}

function GlobalStyles({ c }: { c: Colors }) {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&display=swap');
      html, body { background: ${c.bg}; color: ${c.text}; }
      * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
      body, button, input, select, textarea { font-family: ${font.body}; }
      input, select, textarea { font-size: 16px; }
      button { touch-action: manipulation; }
      .adm-spin { animation: adm-spin 1s linear infinite; }
      @keyframes adm-spin { from { transform: rotate(0) } to { transform: rotate(360deg) } }
      .adm-noscrollbar { scrollbar-width: none; }
      .adm-noscrollbar::-webkit-scrollbar { display: none; }
      .adm-row:hover { background: ${c.surfaceAlt}; }
      .adm-modal-footer > * { flex: 1 1 140px; }
      @media (pointer: fine) {
        * { scrollbar-width: thin; scrollbar-color: rgba(140,140,140,0.55) transparent; }
      }
    `}</style>
  );
}

/* ------------------------------------------------------------------ */
/*  Login                                                              */
/* ------------------------------------------------------------------ */

function Login({ onDone, isDark, setIsDark }: { onDone: () => void; isDark: boolean; setIsDark: (v: boolean) => void }) {
  const ctx = React.useContext(AdminContext);
  const { c } = ctx;
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || loading) return;
    setLoading(true); setError("");
    try {
      await login(password);
      onDone();
    } catch (err: any) {
      setError(err && err.status === 404
        ? "Edge Function 'admin' nije deployana na Supabase projekt."
        : errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: c.bg }}>
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "calc(14px + env(safe-area-inset-top, 0px)) 16px 0" }}>
        <ThemeBtn isDark={isDark} setIsDark={setIsDark} />
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px 16px 48px" }}>
        <form onSubmit={submit} style={{ width: "100%", maxWidth: 380 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><OrdioraMark c={c} size={54} color={c.text} /></div>
          <div style={{ textAlign: "center", fontFamily: font.display, fontSize: 30, fontWeight: 600, color: c.text }}>ORDIORA Admin</div>
          <div style={{ textAlign: "center", fontSize: 14, color: c.textSub, margin: "6px 0 26px" }}>Interni panel za podršku restoranima.</div>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: c.textSub, marginBottom: 6 }}>Admin lozinka</label>
          <Input type="password" autoFocus autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <div style={{ color: c.danger, fontSize: 13.5, marginTop: 10, lineHeight: 1.45 }}>{error}</div>}
          <Button type="submit" variant="primary" full disabled={!password || loading} style={{ marginTop: 16 }}>
            <Lock size={16} /> {loading ? "Prijava…" : "Prijava"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function ThemeBtn({ isDark, setIsDark }: { isDark: boolean; setIsDark: (v: boolean) => void }) {
  const { c } = React.useContext(AdminContext);
  return (
    <button aria-label="Promijeni temu" onClick={() => setIsDark(!isDark)} style={{
      width: 44, height: 44, borderRadius: 12, border: `1px solid ${c.border}`, background: c.surface, color: c.text,
      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
    }}>{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
  );
}

/* ------------------------------------------------------------------ */
/*  Shell                                                              */
/* ------------------------------------------------------------------ */

function Shell({ route, newErrors, isDark, setIsDark }: { route: Route; newErrors: number; isDark: boolean; setIsDark: (v: boolean) => void }) {
  const { c, bp, navigate } = React.useContext(AdminContext);
  const active = route.name === "restaurant" ? "restaurants" : route.name;

  const screen =
    route.name === "overview" ? <Overview /> :
    route.name === "restaurants" ? <Restaurants /> :
    route.name === "restaurant" ? <RestaurantDetail key={route.slug} slug={route.slug} tab={route.tab} /> :
    route.name === "errors" ? <Errors /> :
    <History />;

  const badge = (n: number) => n > 0 && (
    <span style={{ background: c.danger, color: "#FFF", borderRadius: 999, fontSize: 11, fontWeight: 700, padding: "1px 6px", minWidth: 18, textAlign: "center", lineHeight: "16px" }}>
      {n > 99 ? "99+" : n}
    </span>
  );

  if (bp === "mobile") {
    return (
      <div style={{ minHeight: "100dvh", background: c.bg }}>
        <header style={{
          position: "sticky", top: 0, zIndex: 50, background: c.bg, borderBottom: `1px solid ${c.border}`,
          display: "flex", alignItems: "center", gap: 10, padding: "calc(10px + env(safe-area-inset-top, 0px)) 16px 10px",
        }}>
          <OrdioraMark c={c} size={28} color={c.text} />
          <div style={{ flex: 1, minWidth: 0, fontFamily: font.display, fontSize: 21, fontWeight: 600, color: c.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {TITLES[route.name]}
          </div>
          <ThemeBtn isDark={isDark} setIsDark={setIsDark} />
          <button aria-label="Odjava" onClick={signOut} style={{ width: 44, height: 44, borderRadius: 12, border: `1px solid ${c.border}`, background: c.surface, color: c.text, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <LogOut size={18} />
          </button>
        </header>
        <main id="adm-main" style={{ padding: "16px 16px calc(96px + env(safe-area-inset-bottom, 0px))", maxWidth: "100%" }}>{screen}</main>
        <nav style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 60, background: c.surface, borderTop: `1px solid ${c.border}`,
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", padding: "6px 4px calc(6px + env(safe-area-inset-bottom, 0px))",
        }}>
          {NAV.map((n) => {
            const on = active === n.key;
            const Icon = n.icon;
            return (
              <button key={n.key} onClick={() => navigate(n.path)} style={{
                background: "none", border: "none", cursor: "pointer", minHeight: 52, position: "relative",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                color: on ? c.text : c.textFaint, fontSize: 11.5, fontWeight: on ? 700 : 600,
              }}>
                <Icon size={21} />
                {n.label}
                {n.key === "errors" && newErrors > 0 && <span style={{ position: "absolute", top: 4, left: "calc(50% + 6px)" }}>{badge(newErrors)}</span>}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  const narrow = bp === "tablet";
  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", background: c.bg }}>
      <aside style={{
        width: narrow ? 76 : 240, flexShrink: 0, borderRight: `1px solid ${c.border}`, background: c.surface,
        display: "flex", flexDirection: "column", padding: narrow ? "18px 10px" : "22px 14px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: narrow ? "0 0 18px" : "0 8px 22px", justifyContent: narrow ? "center" : "flex-start" }}>
          <OrdioraMark c={c} size={32} color={c.text} />
          {!narrow && (
            <div>
              <div style={{ fontFamily: font.display, fontSize: 21, fontWeight: 600, color: c.text, lineHeight: 1 }}>ORDIORA</div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: c.textFaint, marginTop: 3 }}>ADMIN</div>
            </div>
          )}
        </div>
        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {NAV.map((n) => {
            const on = active === n.key;
            const Icon = n.icon;
            return (
              <button key={n.key} title={n.label} onClick={() => navigate(n.path)} style={{
                display: "flex", alignItems: "center", gap: 12, justifyContent: narrow ? "center" : "flex-start",
                background: on ? c.surfaceAlt : "transparent", color: on ? c.text : c.textSub,
                border: on ? `1px solid ${c.border}` : "1px solid transparent", borderRadius: 12,
                padding: narrow ? "12px 0" : "11px 12px", minHeight: 46, cursor: "pointer", fontSize: 14.5, fontWeight: on ? 700 : 600,
                position: "relative",
              }}>
                <Icon size={19} />
                {!narrow && <span style={{ flex: 1, textAlign: "left" }}>{n.label}</span>}
                {n.key === "errors" && (narrow
                  ? newErrors > 0 && <span style={{ position: "absolute", top: 4, right: 6 }}>{badge(newErrors)}</span>
                  : badge(newErrors))}
              </button>
            );
          })}
        </nav>
        <div style={{ display: "flex", flexDirection: narrow ? "column" : "row", gap: 8, alignItems: "center" }}>
          <ThemeBtn isDark={isDark} setIsDark={setIsDark} />
          <a href="/" target="_blank" rel="noreferrer" title="Otvori aplikaciju" style={{
            width: 44, height: 44, borderRadius: 12, border: `1px solid ${c.border}`, background: c.surface, color: c.text,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}><ExternalLink size={18} /></a>
          {narrow ? (
            <button aria-label="Odjava" title="Odjava" onClick={signOut} style={{ width: 44, height: 44, borderRadius: 12, border: `1px solid ${c.border}`, background: c.surface, color: c.text, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <LogOut size={18} />
            </button>
          ) : (
            <Button small variant="ghost" onClick={signOut} style={{ flex: 1, minHeight: 44 }}><LogOut size={16} /> Odjava</Button>
          )}
        </div>
      </aside>
      <main id="adm-main" style={{ flex: 1, minWidth: 0, overflowY: "auto" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: narrow ? "22px 20px 40px" : "28px 32px 48px" }}>
          {route.name !== "restaurant" && (
            <h1 style={{ margin: "0 0 20px", fontFamily: font.display, fontSize: 32, fontWeight: 600, color: c.text }}>{TITLES[route.name]}</h1>
          )}
          {screen}
        </div>
      </main>
    </div>
  );
}
