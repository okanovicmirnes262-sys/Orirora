import React, { useState } from "react";
import { RotateCcw } from "lucide-react";
import { api, type HistoryRow } from "./api";
import { Badge, Button, Card, Empty, ErrorBox, Field, Loading, Modal, useAdmin, useLoad, errMsg, fmtAgo, fmtDate, ACTION_LABEL, mono } from "./ui";
import { DiffView, JsonBlock } from "./JsonEditor";

export default function History() {
  return <HistoryList />;
}

const canRestore = (h: HistoryRow) => Boolean(h.key) || (h.action === "delete_restaurant" && h.old_value != null);

export function HistoryList({ slug, onRestored }: { slug?: string; onRestored?: () => void }) {
  const { c, bp, navigate } = useAdmin();
  const { data, error, loading, reload } = useLoad(() => api<HistoryRow[]>("history", { slug, limit: 300 }), [slug]);
  const [open, setOpen] = useState<HistoryRow | null>(null);

  if (loading && !data) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  return (
    <>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {(!data || data.length === 0) && <Empty title="Još nema admin izmjena" hint="Svaka izmjena iz panela bilježi se ovdje, sa starom vrijednošću." />}
        {(data || []).map((h) => (
          <button key={h.id} className="adm-row" onClick={() => setOpen(h)} style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", background: "none", border: "none",
            borderBottom: `1px solid ${c.border}`, padding: bp === "mobile" ? "12px 14px" : "13px 18px", cursor: "pointer", color: c.text, minHeight: 56,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{ACTION_LABEL[h.action] || h.action}</span>
                {!slug && h.slug && <Badge>{h.slug}</Badge>}
              </div>
              <div style={{ fontSize: 12.5, color: c.textSub, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {h.key ? <span style={{ fontFamily: mono }}>{h.key.split(":").slice(2).join(":") || h.key}</span> : null}
                {h.key && h.note ? " · " : ""}{h.note}
              </div>
            </div>
            <span style={{ fontSize: 12.5, color: c.textFaint, whiteSpace: "nowrap" }}>{fmtAgo(h.created_at)}</span>
          </button>
        ))}
      </Card>
      {open && (
        <HistoryModal row={open} onClose={() => setOpen(null)}
          onOpenRestaurant={!slug && open.slug ? () => { setOpen(null); navigate(`/admin/restorani/${encodeURIComponent(open.slug!)}`); } : undefined}
          onRestored={() => { setOpen(null); reload(); onRestored?.(); }} />
      )}
    </>
  );
}

function HistoryModal({ row, onClose, onRestored, onOpenRestaurant }: {
  row: HistoryRow; onClose: () => void; onRestored: () => void; onOpenRestaurant?: () => void;
}) {
  const { c, toast } = useAdmin();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const restore = async () => {
    setBusy(true);
    try { await api("restore", { id: row.id }); toast("Vraćeno"); onRestored(); }
    catch (e) { toast(errMsg(e), "error"); setBusy(false); }
  };

  const isDelete = row.action === "delete_restaurant";
  return (
    <Modal wide title={ACTION_LABEL[row.action] || row.action} onClose={onClose} footer={<>
      {onOpenRestaurant && <Button variant="ghost" onClick={onOpenRestaurant}>Otvori restoran</Button>}
      {canRestore(row) && !confirming && <Button variant="primary" onClick={() => setConfirming(true)}><RotateCcw size={16} /> Vrati</Button>}
      {confirming && <>
        <Button variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>Odustani</Button>
        <Button variant="danger" onClick={restore} disabled={busy}><RotateCcw size={16} /> {busy ? "Vraćam…" : "Da, vrati"}</Button>
      </>}
    </>}>
      {confirming && (
        <div style={{ background: c.warnBg, color: c.warn, borderRadius: 12, padding: "11px 14px", fontSize: 13.5, marginBottom: 14, lineHeight: 1.5 }}>
          {isDelete
            ? "Vratit će se svi obrisani ključevi restorana i njegov unos u registru."
            : "Ključ će se vratiti na staru vrijednost prikazanu ispod. Trenutna vrijednost sprema se u povijest, pa i ovo vraćanje možeš poništiti."}
        </div>
      )}
      <Field label="Vrijeme">{fmtDate(row.created_at)}</Field>
      <Field label="Restoran">{row.slug || "—"}</Field>
      {row.key && <Field label="Ključ"><span style={{ fontFamily: mono, fontSize: 13 }}>{row.key}</span></Field>}
      {row.note && <Field label="Bilješka">{row.note}</Field>}
      <div style={{ marginTop: 16 }}>
        {isDelete ? (
          <>
            <div style={{ fontSize: 13, fontWeight: 600, color: c.textSub, marginBottom: 8 }}>Snimka obrisanih podataka</div>
            <JsonBlock value={row.old_value} maxHeight="50dvh" />
          </>
        ) : row.key || row.new_value != null || row.old_value != null ? (
          <DiffView before={row.old_value} after={row.new_value} />
        ) : null}
      </div>
    </Modal>
  );
}
