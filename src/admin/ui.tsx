import React, { createContext, useContext, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { PALETTE, fontStack } from "../RestaurantOS";

/* ------------------------------------------------------------------ */
/*  Admin design system                                                */
/* ------------------------------------------------------------------ */
/*  Same monochrome palette as the app, plus three status colours the app
    deliberately doesn't use (admin needs "broken / fine / attention" to
    read at a glance). Inline styles throughout, like the app. */

const STATUS = {
  light: { danger: "#B42318", dangerBg: "#FEE4E2", ok: "#067647", okBg: "#DCFAE6", warn: "#B54708", warnBg: "#FEF0C7" },
  dark: { danger: "#F97066", dangerBg: "rgba(240,68,56,0.16)", ok: "#47CD89", okBg: "rgba(23,178,106,0.16)", warn: "#FDB022", warnBg: "rgba(247,144,9,0.16)" },
};

export type Colors = typeof PALETTE.light & typeof STATUS.light;
export const font = fontStack();
export const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export function colorsFor(isDark: boolean): Colors {
  return { ...PALETTE[isDark ? "dark" : "light"], ...STATUS[isDark ? "dark" : "light"] };
}

/* ------------------------------------------------------------------ */
/*  Breakpoints: mobile < 640 ≤ tablet < 1024 ≤ desktop                */
/* ------------------------------------------------------------------ */

export type Bp = "mobile" | "tablet" | "desktop";
function readBp(): Bp {
  if (window.matchMedia("(min-width: 1024px)").matches) return "desktop";
  if (window.matchMedia("(min-width: 640px)").matches) return "tablet";
  return "mobile";
}
export function useAdminBp(): Bp {
  const [bp, setBp] = useState<Bp>(readBp);
  useEffect(() => {
    const mqls = [window.matchMedia("(min-width: 1024px)"), window.matchMedia("(min-width: 640px)")];
    const on = () => setBp(readBp());
    mqls.forEach((m) => m.addEventListener("change", on));
    return () => mqls.forEach((m) => m.removeEventListener("change", on));
  }, []);
  return bp;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

type Ctx = {
  c: Colors; bp: Bp; isDark: boolean;
  navigate: (path: string) => void;
  toast: (msg: string, kind?: "ok" | "error") => void;
  refreshBadge: () => void;
};
export const AdminContext = createContext<Ctx>(null as any);
export const useAdmin = () => useContext(AdminContext);

/* ------------------------------------------------------------------ */
/*  Primitives                                                         */
/* ------------------------------------------------------------------ */

export function Card({ children, style, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  const { c } = useAdmin();
  return (
    <div onClick={onClick} style={{
      background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: 18,
      boxShadow: c.shadow, minWidth: 0, cursor: onClick ? "pointer" : undefined, ...style,
    }}>{children}</div>
  );
}

type BtnVariant = "primary" | "ghost" | "danger" | "subtle";
export function Button({ children, onClick, variant = "ghost", disabled, full, small, style, title, type }: {
  children: React.ReactNode; onClick?: (e: React.MouseEvent) => void; variant?: BtnVariant; disabled?: boolean;
  full?: boolean; small?: boolean; style?: React.CSSProperties; title?: string; type?: "button" | "submit";
}) {
  const { c } = useAdmin();
  const look: Record<BtnVariant, React.CSSProperties> = {
    primary: { background: c.cta, color: c.ctaText, border: "none" },
    ghost: { background: "transparent", color: c.text, border: `1px solid ${c.borderStrong}` },
    danger: { background: c.danger, color: "#FFFFFF", border: "none" },
    subtle: { background: c.surfaceAlt, color: c.text, border: `1px solid ${c.border}` },
  };
  return (
    <button type={type || "button"} title={title} disabled={disabled} onClick={onClick} style={{
      ...look[variant], display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
      borderRadius: 12, padding: small ? "7px 12px" : "11px 16px", minHeight: small ? 36 : 44,
      fontSize: small ? 13 : 14.5, fontWeight: 600, fontFamily: font.body, cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.5 : 1, width: full ? "100%" : undefined, whiteSpace: "nowrap", flexShrink: 0, ...style,
    }}>{children}</button>
  );
}

const fieldStyle = (c: Colors): React.CSSProperties => ({
  width: "100%", background: c.inputBg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 12,
  padding: "11px 13px", fontSize: 16, fontFamily: font.body, outline: "none", minHeight: 44,
});

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { c } = useAdmin();
  return <input {...props} style={{ ...fieldStyle(c), ...props.style }} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { c } = useAdmin();
  return <textarea {...props} style={{ ...fieldStyle(c), resize: "vertical", lineHeight: 1.5, ...props.style }} />;
}
export function Select({ value, onChange, options, style }: {
  value: string; onChange: (v: string) => void; options: [string, string][]; style?: React.CSSProperties;
}) {
  const { c } = useAdmin();
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={{
      ...fieldStyle(c), width: "auto", paddingRight: 30, cursor: "pointer",
      backgroundImage: `linear-gradient(45deg, transparent 50%, ${c.textSub} 50%), linear-gradient(135deg, ${c.textSub} 50%, transparent 50%)`,
      backgroundPosition: "calc(100% - 16px) 50%, calc(100% - 11px) 50%", backgroundSize: "5px 5px", backgroundRepeat: "no-repeat",
      WebkitAppearance: "none", appearance: "none", ...style,
    }}>
      {options.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
    </select>
  );
}

export type Tone = "neutral" | "danger" | "ok" | "warn";
export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: Tone }) {
  const { c } = useAdmin();
  const map: Record<Tone, [string, string]> = {
    neutral: [c.textSub, c.surfaceAlt], danger: [c.danger, c.dangerBg], ok: [c.ok, c.okBg], warn: [c.warn, c.warnBg],
  };
  const [fg, bg] = map[tone];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, color: fg, background: bg, borderRadius: 999,
      padding: "3px 9px", fontSize: 11.5, fontWeight: 700, whiteSpace: "nowrap", lineHeight: 1.4,
    }}>{children}</span>
  );
}

export function Spinner({ size = 20 }: { size?: number }) {
  const { c } = useAdmin();
  return <Loader2 size={size} color={c.textFaint} className="adm-spin" />;
}

export function Loading() {
  return <div style={{ display: "flex", justifyContent: "center", padding: 48 }}><Spinner size={26} /></div>;
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { c } = useAdmin();
  return (
    <div style={{ background: c.dangerBg, color: c.danger, borderRadius: 12, padding: "12px 14px", fontSize: 14, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <span style={{ flex: 1, minWidth: 180 }}>{message}</span>
      {onRetry && <Button small variant="ghost" onClick={onRetry}>Pokušaj ponovno</Button>}
    </div>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  const { c } = useAdmin();
  return (
    <div style={{ textAlign: "center", padding: "40px 16px", color: c.textSub }}>
      <div style={{ fontWeight: 600, color: c.text, marginBottom: 4 }}>{title}</div>
      {hint && <div style={{ fontSize: 13.5 }}>{hint}</div>}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  const { c } = useAdmin();
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, margin: "4px 0 12px", flexWrap: "wrap" }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: c.text }}>{children}</div>
      {right}
    </div>
  );
}

/* Horizontally scrollable chip bar — tabs on mobile never wrap or overflow the page. */
export function Chips<T extends string>({ value, onChange, options }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[];
}) {
  const { c } = useAdmin();
  return (
    <div className="adm-noscrollbar" style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, maxWidth: "100%" }}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange(o.value)} style={{
            flexShrink: 0, background: on ? c.cta : c.surface, color: on ? c.ctaText : c.text,
            border: `1px solid ${on ? c.cta : c.border}`, borderRadius: 999, padding: "8px 14px", minHeight: 38,
            fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: font.body, display: "inline-flex", gap: 6, alignItems: "center",
          }}>
            {o.label}
            {o.count != null && o.count > 0 && (
              <span style={{ background: on ? c.ctaText : c.danger, color: on ? c.cta : "#FFF", borderRadius: 999, fontSize: 11, padding: "0 6px", minWidth: 18, textAlign: "center" }}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* Centered dialog on tablet/desktop, full-screen sheet on mobile. */
export function Modal({ title, onClose, children, footer, wide }: {
  title: React.ReactNode; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean;
}) {
  const { c, bp } = useAdmin();
  const mobile = bp === "mobile";
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: mobile ? "stretch" : "center", justifyContent: "center", padding: mobile ? 0 : 24,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: c.surface, width: "100%", maxWidth: mobile ? "100%" : wide ? 920 : 520,
        height: mobile ? "100dvh" : undefined, maxHeight: mobile ? "100dvh" : "88dvh",
        borderRadius: mobile ? 0 : 20, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: font.body,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid ${c.border}`,
          padding: mobile ? "calc(12px + env(safe-area-inset-top, 0px)) 16px 12px" : "16px 20px",
        }}>
          <div style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: 16.5, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
          <button aria-label="Zatvori" onClick={onClose} style={{ background: "none", border: "none", color: c.textSub, cursor: "pointer", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", marginRight: -10 }}>
            <X size={22} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: mobile ? 16 : 20, minHeight: 0 }}>{children}</div>
        {footer && (
          <div className={mobile ? "adm-modal-footer" : undefined} style={{
            borderTop: `1px solid ${c.border}`, display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap",
            padding: mobile ? "12px 16px calc(12px + env(safe-area-inset-bottom, 0px))" : "14px 20px",
          }}>{footer}</div>
        )}
      </div>
    </div>
  );
}

/* Label + value rows; stacks on narrow screens. */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const { c } = useAdmin();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", padding: "9px 0", borderBottom: `1px solid ${c.border}` }}>
      <div style={{ width: 150, flexShrink: 0, fontSize: 12.5, fontWeight: 600, color: c.textFaint, textTransform: "uppercase", letterSpacing: "0.04em", paddingTop: 2 }}>{label}</div>
      <div style={{ flex: 1, minWidth: 180, fontSize: 14, color: c.text, overflowWrap: "anywhere" }}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Formatting                                                         */
/* ------------------------------------------------------------------ */

export function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("hr-HR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function fmtAgo(iso: string | null | undefined) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "upravo";
  if (min < 60) return `prije ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `prije ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `prije ${d} d`;
  return fmtDate(iso);
}

export const KIND_LABEL: Record<string, string> = {
  js_error: "JS greška", promise: "Promise greška", crash: "Pad aplikacije",
  save_failed: "Spremanje nije uspjelo", load_failed: "Učitavanje nije uspjelo", user_report: "Prijava korisnika",
};
export const STATUS_LABEL: Record<string, string> = { new: "Novo", seen: "Viđeno", resolved: "Riješeno" };
export const STATUS_TONE: Record<string, Tone> = { new: "danger", seen: "warn", resolved: "ok" };
export const ACTION_LABEL: Record<string, string> = {
  set_key: "Izmjena podataka", restore: "Vraćanje", delete_restaurant: "Brisanje restorana",
  impersonate: "Ulaz kao vlasnik", suspend: "Suspendiranje", unsuspend: "Aktiviranje",
};
export const VIEW_LABEL: Record<string, string> = {
  dashboard: "Početna", reservations: "Rezervacije", chat: "Chat", analytics: "Analitika", more: "Više",
  shifts: "Smjene", staff: "Tim", settings: "Postavke", followups: "Praćenje gostiju", login: "Prijava", setup: "Postavljanje", admin: "Admin",
};

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function errMsg(e: unknown) {
  return (e && (e as Error).message) || "Nešto nije u redu.";
}

/* Small async-data hook: { data, error, loading, reload }. */
export function useLoad<T>(fn: () => Promise<T>, deps: React.DependencyList) {
  const [state, setState] = useState<{ data: T | null; error: string; loading: boolean }>({ data: null, error: "", loading: true });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: "" }));
    fn().then(
      (data) => { if (alive) setState({ data, error: "", loading: false }); },
      (e) => { if (alive) setState((s) => ({ ...s, error: errMsg(e), loading: false })); },
    );
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}
