import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { api, type ErrorRow } from "./api";
import { Badge, Card, Empty, ErrorBox, Loading, SectionTitle, useAdmin, useLoad, fmtAgo, KIND_LABEL, STATUS_LABEL, STATUS_TONE, Button } from "./ui";
import { ErrorDetailModal } from "./Errors";

type OverviewData = {
  restaurants: number; suspended: number; errors24h: number; errors7d: number;
  newErrors: number; openErrors: number; recentErrors: ErrorRow[];
  topRestaurants: { slug: string; name: string; open: number }[];
};

export default function Overview() {
  const { c, bp, navigate } = useAdmin();
  const { data, error, loading, reload } = useLoad(() => api<OverviewData>("overview"), []);
  const [open, setOpen] = useState<ErrorRow | null>(null);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;

  const stats: { label: string; value: number; tone?: "danger" | "warn"; go?: string }[] = [
    { label: "Restorana", value: data.restaurants, go: "/admin/restorani" },
    { label: "Suspendirano", value: data.suspended, tone: data.suspended ? "warn" : undefined, go: "/admin/restorani" },
    { label: "Nove greške", value: data.newErrors, tone: data.newErrors ? "danger" : undefined, go: "/admin/greske" },
    { label: "Greške (24 h)", value: data.errors24h, go: "/admin/greske" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: bp === "mobile" ? "1fr 1fr" : "repeat(4, 1fr)", gap: bp === "mobile" ? 10 : 14 }}>
        {stats.map((s) => (
          <Card key={s.label} onClick={s.go ? () => navigate(s.go!) : undefined} style={{ padding: bp === "mobile" ? 14 : 18 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: c.textSub, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: bp === "mobile" ? 26 : 32, fontWeight: 700, color: s.tone === "danger" ? c.danger : s.tone === "warn" ? c.warn : c.text, lineHeight: 1 }}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: bp === "desktop" ? "minmax(0, 2fr) minmax(0, 1fr)" : "minmax(0, 1fr)", gap: 20 }}>
        <Card>
          <SectionTitle right={<Button small variant="subtle" onClick={() => navigate("/admin/greske")}>Sve greške</Button>}>Zadnje greške</SectionTitle>
          {data.recentErrors.length === 0
            ? <Empty title="Nema prijavljenih grešaka" hint="Kad aplikacija zabilježi grešku, pojavit će se ovdje." />
            : data.recentErrors.map((e) => (
              <button key={e.id} className="adm-row" onClick={() => setOpen(e)} style={{
                display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", background: "none",
                border: "none", borderTop: `1px solid ${c.border}`, padding: "11px 6px", cursor: "pointer", color: c.text, minHeight: 52,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.message}</div>
                  <div style={{ fontSize: 12.5, color: c.textSub, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {KIND_LABEL[e.kind] || e.kind} · {e.slug || "bez restorana"} · {fmtAgo(e.created_at)}
                  </div>
                </div>
                <Badge tone={STATUS_TONE[e.status]}>{STATUS_LABEL[e.status]}</Badge>
              </button>
            ))}
        </Card>

        <Card>
          <SectionTitle>Najviše otvorenih grešaka</SectionTitle>
          {data.topRestaurants.length === 0
            ? <Empty title="Sve je mirno" hint="Nijedan restoran nema otvorenih grešaka." />
            : data.topRestaurants.map((r) => (
              <button key={r.slug} className="adm-row" onClick={() => navigate(`/admin/restorani/${encodeURIComponent(r.slug)}/greske`)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%", background: "none", border: "none",
                borderTop: `1px solid ${c.border}`, padding: "11px 6px", cursor: "pointer", color: c.text, minHeight: 48, textAlign: "left",
              }}>
                <span style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                <Badge tone="danger">{r.open}</Badge>
                <ChevronRight size={16} color={c.textFaint} />
              </button>
            ))}
          <div style={{ fontSize: 12.5, color: c.textFaint, marginTop: 12 }}>
            Otvoreno ukupno: {data.openErrors} · zadnjih 7 dana: {data.errors7d}
          </div>
        </Card>
      </div>

      {open && <ErrorDetailModal row={open} onClose={() => setOpen(null)} onChanged={() => { setOpen(null); reload(); }} />}
    </div>
  );
}
