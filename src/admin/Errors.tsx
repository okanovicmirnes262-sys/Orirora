import React, { useMemo, useState } from "react";
import { Check, Eye, RotateCcw, Store } from "lucide-react";
import { api, type ErrorRow } from "./api";
import {
  Badge, Button, Card, Chips, Empty, ErrorBox, Field, Loading, Modal, Select, useAdmin, useLoad, errMsg,
  fmtAgo, fmtDate, KIND_LABEL, STATUS_LABEL, STATUS_TONE, VIEW_LABEL, mono,
} from "./ui";

/* ------------------------------------------------------------------ */
/*  Errors — global page and the per-restaurant tab share ErrorList    */
/* ------------------------------------------------------------------ */

export default function Errors() {
  return <ErrorList />;
}

type StatusFilter = "open" | "new" | "seen" | "resolved" | "all";

async function setStatus(ids: string[], status: ErrorRow["status"]) {
  await api("update_errors", { ids, status });
}

export function ErrorList({ slug }: { slug?: string }) {
  const { c, bp, refreshBadge, toast } = useAdmin();
  const [status, setStatusFilter] = useState<StatusFilter>("open");
  const [kind, setKind] = useState("all");
  const [days, setDays] = useState("30");
  const [restaurant, setRestaurant] = useState("all");
  const [grouped, setGrouped] = useState(true);
  const [openRow, setOpenRow] = useState<ErrorRow | null>(null);
  const [openGroup, setOpenGroup] = useState<ErrorRow[] | null>(null);

  const { data, error, loading, reload } = useLoad(
    () => api<ErrorRow[]>("list_errors", { slug, status, kind, days: days === "all" ? undefined : Number(days), limit: 1000 }),
    [slug, status, kind, days],
  );

  const rows = useMemo(() => (data || []).filter((r) => restaurant === "all" || (r.slug || "") === restaurant), [data, restaurant]);
  const slugs = useMemo(() => [...new Set((data || []).map((r) => r.slug || ""))].sort(), [data]);

  // Same kind + message = one group; most recent first.
  const groups = useMemo(() => {
    const m = new Map<string, ErrorRow[]>();
    for (const r of rows) {
      const k = `${r.kind}|${r.kind === "user_report" ? r.id : r.message}`;
      const list = m.get(k);
      if (list) list.push(r); else m.set(k, [r]);
    }
    return [...m.values()];
  }, [rows]);

  const changed = () => { setOpenRow(null); setOpenGroup(null); reload(); refreshBadge(); };

  const bulk = async (list: ErrorRow[], s: ErrorRow["status"]) => {
    try { await setStatus(list.map((r) => r.id), s); toast(`Označeno: ${STATUS_LABEL[s].toLowerCase()} (${list.length})`); changed(); }
    catch (e) { toast(errMsg(e), "error"); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <Chips<StatusFilter> value={status} onChange={setStatusFilter} options={[
        { value: "open", label: "Otvorene" }, { value: "new", label: "Nove" }, { value: "seen", label: "Viđene" },
        { value: "resolved", label: "Riješene" }, { value: "all", label: "Sve" },
      ]} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <Select value={kind} onChange={setKind} options={[["all", "Sve vrste"], ...Object.entries(KIND_LABEL)] as [string, string][]} style={{ flex: bp === "mobile" ? "1 1 45%" : undefined }} />
        <Select value={days} onChange={setDays} options={[["1", "Zadnja 24 h"], ["7", "Zadnjih 7 dana"], ["30", "Zadnjih 30 dana"], ["all", "Sve vrijeme"]]} style={{ flex: bp === "mobile" ? "1 1 45%" : undefined }} />
        {!slug && (
          <Select value={restaurant} onChange={setRestaurant} options={[["all", "Svi restorani"], ...slugs.map((s) => [s, s || "(bez restorana)"] as [string, string])]} style={{ flex: bp === "mobile" ? "1 1 100%" : undefined, maxWidth: "100%" }} />
        )}
        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: c.textSub, cursor: "pointer", minHeight: 44, marginLeft: bp === "mobile" ? 0 : "auto" }}>
          <input type="checkbox" checked={grouped} onChange={(e) => setGrouped(e.target.checked)} style={{ width: 18, height: 18 }} />
          Grupiraj iste
        </label>
      </div>

      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          {rows.length === 0 && <Empty title="Nema grešaka za ovaj filter" />}
          {grouped
            ? groups.map((g) => <GroupRow key={g[0].id} list={g} showSlug={!slug} onOpen={() => (g.length === 1 ? setOpenRow(g[0]) : setOpenGroup(g))} />)
            : rows.map((r) => <GroupRow key={r.id} list={[r]} showSlug={!slug} onOpen={() => setOpenRow(r)} />)}
        </Card>
      )}
      {data && data.length >= 1000 && <div style={{ fontSize: 12.5, color: c.textFaint }}>Prikazano prvih 1000 — suzi filter za starije zapise.</div>}

      {openRow && <ErrorDetailModal row={openRow} onClose={() => setOpenRow(null)} onChanged={changed} />}
      {openGroup && (
        <Modal wide title={`${openGroup.length}× ${openGroup[0].message}`} onClose={() => setOpenGroup(null)} footer={<>
          <Button variant="ghost" onClick={() => bulk(openGroup, "seen")}><Eye size={16} /> Sve viđeno</Button>
          <Button variant="primary" onClick={() => bulk(openGroup, "resolved")}><Check size={16} /> Sve riješeno</Button>
        </>}>
          <div style={{ fontSize: 13.5, color: c.textSub, marginBottom: 12 }}>{KIND_LABEL[openGroup[0].kind]} · klikni pojedinačni zapis za detalje.</div>
          <div style={{ border: `1px solid ${c.border}`, borderRadius: 12, overflow: "hidden" }}>
            {openGroup.map((r) => (
              <button key={r.id} className="adm-row" onClick={() => setOpenRow(r)} style={{
                display: "flex", gap: 10, alignItems: "center", width: "100%", textAlign: "left", background: "none", border: "none",
                borderTop: `1px solid ${c.border}`, padding: "10px 12px", cursor: "pointer", color: c.text, minHeight: 48, flexWrap: "wrap",
              }}>
                <span style={{ fontSize: 13.5, flex: 1, minWidth: 160 }}>
                  <b>{r.slug || "—"}</b> · {r.user_email || "nepoznat korisnik"} · {VIEW_LABEL[r.view || ""] || r.view || "—"}
                </span>
                <span style={{ fontSize: 12.5, color: c.textSub }}>{fmtDate(r.created_at)}</span>
                <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function GroupRow({ list, showSlug, onOpen }: { list: ErrorRow[]; showSlug: boolean; onOpen: () => void }) {
  const { c, bp } = useAdmin();
  const first = list[0];
  const restaurants = new Set(list.map((r) => r.slug || "—"));
  const worst = list.some((r) => r.status === "new") ? "new" : list.some((r) => r.status === "seen") ? "seen" : "resolved";
  return (
    <button className="adm-row" onClick={onOpen} style={{
      display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", background: "none", border: "none",
      borderBottom: `1px solid ${c.border}`, padding: bp === "mobile" ? "12px 14px" : "13px 18px", cursor: "pointer", color: c.text, minHeight: 58,
    }}>
      {list.length > 1 && (
        <span style={{ flexShrink: 0, minWidth: 38, textAlign: "center", fontWeight: 700, fontSize: 13, background: c.surfaceAlt, border: `1px solid ${c.border}`, borderRadius: 8, padding: "4px 6px" }}>
          {list.length}×
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: bp === "mobile" ? "normal" : "nowrap", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any }}>
          {first.message}
        </div>
        <div style={{ fontSize: 12.5, color: c.textSub, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {KIND_LABEL[first.kind] || first.kind}
          {showSlug && ` · ${restaurants.size > 1 ? `${restaurants.size} restorana` : [...restaurants][0]}`}
          {first.view && ` · ${VIEW_LABEL[first.view] || first.view}`}
          {` · ${fmtAgo(first.created_at)}`}
        </div>
      </div>
      <Badge tone={STATUS_TONE[worst]}>{STATUS_LABEL[worst]}</Badge>
    </button>
  );
}

export function ErrorDetailModal({ row, onClose, onChanged }: { row: ErrorRow; onClose: () => void; onChanged: () => void }) {
  const { c, navigate, toast, refreshBadge } = useAdmin();
  const [busy, setBusy] = useState(false);

  const set = async (s: ErrorRow["status"]) => {
    setBusy(true);
    try { await setStatus([row.id], s); toast(`Označeno: ${STATUS_LABEL[s].toLowerCase()}`); refreshBadge(); onChanged(); }
    catch (e) { toast(errMsg(e), "error"); }
    finally { setBusy(false); }
  };

  return (
    <Modal wide title={KIND_LABEL[row.kind] || row.kind} onClose={onClose} footer={<>
      {row.slug && <Button variant="ghost" onClick={() => { onClose(); navigate(`/admin/restorani/${encodeURIComponent(row.slug!)}`); }}><Store size={16} /> Otvori restoran</Button>}
      {row.status !== "new" && <Button variant="ghost" disabled={busy} onClick={() => set("new")}><RotateCcw size={16} /> Ponovno otvori</Button>}
      {row.status === "new" && <Button variant="ghost" disabled={busy} onClick={() => set("seen")}><Eye size={16} /> Viđeno</Button>}
      {row.status !== "resolved" && <Button variant="primary" disabled={busy} onClick={() => set("resolved")}><Check size={16} /> Riješeno</Button>}
    </>}>
      <div style={{ marginBottom: 14 }}><Badge tone={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge></div>
      <div style={{ fontFamily: mono, fontSize: 13.5, background: c.surfaceAlt, border: `1px solid ${c.border}`, borderRadius: 12, padding: 14, whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: c.text, marginBottom: 14 }}>
        {row.message}
      </div>
      {row.user_note && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: c.textFaint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>Opis korisnika</div>
          <div style={{ fontSize: 14.5, color: c.text, whiteSpace: "pre-wrap", lineHeight: 1.5, overflowWrap: "anywhere" }}>{row.user_note}</div>
        </div>
      )}
      <Field label="Vrijeme">{fmtDate(row.created_at)} ({fmtAgo(row.created_at)})</Field>
      <Field label="Restoran">{row.slug || "—"}</Field>
      <Field label="Korisnik">{row.user_email || "—"}{row.user_role ? ` · ${row.user_role}` : ""}</Field>
      <Field label="Ekran">{VIEW_LABEL[row.view || ""] || row.view || "—"}</Field>
      <Field label="Ključ / akcija"><span style={{ fontFamily: mono, fontSize: 13 }}>{row.action || "—"}</span></Field>
      <Field label="ID"><span style={{ fontFamily: mono, fontSize: 12, color: c.textSub }}>{row.id}</span></Field>
    </Modal>
  );
}
