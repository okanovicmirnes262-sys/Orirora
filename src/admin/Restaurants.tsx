import React, { useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { api, type RestaurantRow } from "./api";
import { Badge, Card, Chips, Empty, ErrorBox, Input, Loading, useAdmin, useLoad, fmtAgo } from "./ui";

type Filter = "all" | "active" | "suspended" | "errors";

export default function Restaurants() {
  const { c, bp, navigate } = useAdmin();
  const { data, error, loading, reload } = useLoad(() => api<RestaurantRow[]>("list_restaurants"), []);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (data || []).filter((r) => {
      if (filter === "active" && r.suspended) return false;
      if (filter === "suspended" && !r.suspended) return false;
      if (filter === "errors" && !r.openErrors) return false;
      if (!needle) return true;
      return [r.name, r.slug, r.ownerName, r.ownerEmail].some((v) => (v || "").toLowerCase().includes(needle));
    });
  }, [data, q, filter]);

  const counts = useMemo(() => ({
    all: data?.length ?? 0,
    suspended: data?.filter((r) => r.suspended).length ?? 0,
    errors: data?.filter((r) => r.openErrors).length ?? 0,
  }), [data]);

  const open = (r: RestaurantRow) => navigate(`/admin/restorani/${encodeURIComponent(r.slug)}`);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ position: "relative" }}>
        <Search size={17} color={c.textFaint} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
        <Input placeholder="Traži po imenu, slugu ili vlasniku…" value={q} onChange={(e) => setQ(e.target.value)} style={{ paddingLeft: 40 }} />
      </div>
      <Chips<Filter> value={filter} onChange={setFilter} options={[
        { value: "all", label: `Svi (${counts.all})` },
        { value: "active", label: "Aktivni" },
        { value: "suspended", label: "Suspendirani", count: counts.suspended },
        { value: "errors", label: "S greškama", count: counts.errors },
      ]} />

      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : rows.length === 0 ? (
        <Card><Empty title={data && data.length ? "Nema rezultata" : "Još nema restorana"} hint={data && data.length ? "Promijeni pretragu ili filter." : undefined} /></Card>
      ) : bp === "desktop" ? (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, color: c.text }}>
              <thead>
                <tr style={{ textAlign: "left", color: c.textFaint, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {["Restoran", "Vlasnik", "Tim", "Rezervacije", "Zadnja aktivnost", "Greške", "Status"].map((h) => (
                    <th key={h} style={{ padding: "12px 16px", fontWeight: 700, borderBottom: `1px solid ${c.border}`, whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.slug} className="adm-row" onClick={() => open(r)} style={{ cursor: "pointer", borderBottom: `1px solid ${c.border}` }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 600 }}>{r.name}</div>
                      <div style={{ fontSize: 12.5, color: c.textFaint }}>{r.slug}{!r.inRegistry && " · nije u registru"}</div>
                    </td>
                    <td style={{ padding: "12px 16px", maxWidth: 260 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.ownerName || "—"}</div>
                      <div style={{ fontSize: 12.5, color: c.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.ownerEmail || ""}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>{r.staffCount}</td>
                    <td style={{ padding: "12px 16px" }}>{r.reservationCount}</td>
                    <td style={{ padding: "12px 16px", whiteSpace: "nowrap", color: c.textSub }}>{fmtAgo(r.lastUpdate)}</td>
                    <td style={{ padding: "12px 16px" }}>{r.openErrors ? <Badge tone="danger">{r.openErrors}</Badge> : <span style={{ color: c.textFaint }}>0</span>}</td>
                    <td style={{ padding: "12px 16px" }}><StatusBadge r={r} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: bp === "tablet" ? "1fr 1fr" : "1fr", gap: 10 }}>
          {rows.map((r) => (
            <Card key={r.slug} onClick={() => open(r)} style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15.5, color: c.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</div>
                  <div style={{ fontSize: 12.5, color: c.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.ownerEmail || r.slug}</div>
                </div>
                <ChevronRight size={18} color={c.textFaint} style={{ flexShrink: 0, marginTop: 2 }} />
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10, alignItems: "center" }}>
                <StatusBadge r={r} />
                {r.openErrors > 0 && <Badge tone="danger">{r.openErrors} grešaka</Badge>}
                <span style={{ fontSize: 12.5, color: c.textSub }}>{r.staffCount} u timu · {r.reservationCount} rez. · {fmtAgo(r.lastUpdate)}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ r }: { r: RestaurantRow }) {
  return r.suspended ? <Badge tone="warn">Suspendiran</Badge> : <Badge tone="ok">Aktivan</Badge>;
}
