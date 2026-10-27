import React from "react";
import { PALETTE, fontStack, tr, ReportProblemModal } from "./RestaurantOS";
import { reportError } from "./errorReporter";

/* ------------------------------------------------------------------ */
/*  ErrorBoundary — replaces the white screen after a render crash     */
/* ------------------------------------------------------------------ */
/*  The crash is reported automatically; the user can add a description
    ("Report a problem") or reload. Theme follows the saved preference. */

type Props = { children: React.ReactNode; area?: string };
type State = { error: Error | null; reporting: boolean };

function savedIsDark() {
  try {
    const raw = window.localStorage.getItem("restaurantos:theme");
    return raw ? Boolean(JSON.parse(raw).isDark) : true;
  } catch (e) {
    return true;
  }
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null, reporting: false };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    const where = (info.componentStack || "").trim().split("\n")[0] || "";
    reportError("crash", error && error.message ? error.message : String(error), {
      action: [this.props.area, where.replace(/^at\s+/, "")].filter(Boolean).join(" · "),
    });
  }

  render() {
    if (!this.state.error) return this.props.children;
    const c = PALETTE[savedIsDark() ? "dark" : "light"];
    const btn = (primary: boolean): React.CSSProperties => ({
      background: primary ? c.cta : "transparent", color: primary ? c.ctaText : c.text,
      border: primary ? "none" : `1px solid ${c.border}`, borderRadius: 14, padding: "13px 20px",
      fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: fontStack().body, minHeight: 44,
    });
    return (
      <div style={{ minHeight: "100dvh", background: c.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 24, fontFamily: fontStack().body }}>
        <div style={{ fontFamily: fontStack().display, fontSize: 28, fontWeight: 600, color: c.text, textAlign: "center" }}>{tr("Something went wrong")}</div>
        <div style={{ color: c.textSub, fontSize: 14.5, textAlign: "center", maxWidth: 340, lineHeight: 1.5 }}>
          {tr("The app hit an unexpected error. It has been reported automatically.")}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center", marginTop: 6 }}>
          <button style={btn(true)} onClick={() => window.location.reload()}>{tr("Reload")}</button>
          <button style={btn(false)} onClick={() => this.setState({ reporting: true })}>{tr("Report a problem")}</button>
        </div>
        {this.state.reporting && (
          <ReportProblemModal c={c} onClose={() => this.setState({ reporting: false })}
            defaultNote={`${tr("Something went wrong")}: ${this.state.error.message}\n\n`} />
        )}
      </div>
    );
  }
}
