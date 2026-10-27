import React, { useMemo, useState } from "react";
import { AlignLeft, ArrowLeft, Save } from "lucide-react";
import { Button, Modal, Input, useAdmin, errMsg, mono } from "./ui";

/* ------------------------------------------------------------------ */
/*  JSON editing with a mandatory diff step before saving              */
/* ------------------------------------------------------------------ */

export const pretty = (v: unknown) => (v === undefined ? "" : JSON.stringify(v, null, 2));

/* Line diff via LCS. Falls back to "everything changed" for very large
   inputs so the browser never freezes on a huge reservations blob. */
type DiffLine = { type: "same" | "add" | "del"; text: string };
export function lineDiff(a: string, b: string): DiffLine[] {
  const A = a ? a.split("\n") : [], B = b ? b.split("\n") : [];
  if (A.length * B.length > 4_000_000) {
    return [...A.map((text) => ({ type: "del" as const, text })), ...B.map((text) => ({ type: "add" as const, text }))];
  }
  const n = A.length, m = B.length;
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
    dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  }
  const out: DiffLine[] = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (A[i] === B[j]) { out.push({ type: "same", text: A[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) out.push({ type: "del", text: A[i++] });
    else out.push({ type: "add", text: B[j++] });
  }
  while (i < n) out.push({ type: "del", text: A[i++] });
  while (j < m) out.push({ type: "add", text: B[j++] });
  return out;
}

/* Shows changed lines with 2 lines of context; long unchanged runs collapse. */
export function DiffView({ before, after }: { before: unknown; after: unknown }) {
  const { c } = useAdmin();
  const lines = useMemo(() => lineDiff(pretty(before), pretty(after)), [before, after]);
  const changed = lines.filter((l) => l.type !== "same").length;
  if (!changed) return <div style={{ fontSize: 14, color: c.textSub }}>Nema promjena.</div>;

  const keep = new Set<number>();
  lines.forEach((l, i) => { if (l.type !== "same") for (let k = i - 2; k <= i + 2; k++) keep.add(k); });
  const rendered: React.ReactNode[] = [];
  let skipped = 0;
  lines.forEach((l, i) => {
    if (!keep.has(i)) { skipped++; return; }
    if (skipped) { rendered.push(<div key={`s${i}`} style={{ color: c.textFaint, padding: "2px 10px" }}>⋯ {skipped} nepromijenjenih redaka</div>); skipped = 0; }
    const bg = l.type === "add" ? c.okBg : l.type === "del" ? c.dangerBg : "transparent";
    const fg = l.type === "add" ? c.ok : l.type === "del" ? c.danger : c.textSub;
    rendered.push(
      <div key={i} style={{ background: bg, color: fg, padding: "1px 10px", whiteSpace: "pre" }}>
        {l.type === "add" ? "+ " : l.type === "del" ? "- " : "  "}{l.text}
      </div>,
    );
  });
  if (skipped) rendered.push(<div key="end" style={{ color: c.textFaint, padding: "2px 10px" }}>⋯ {skipped} nepromijenjenih redaka</div>);

  return (
    <div>
      <div style={{ fontSize: 13, color: c.textSub, marginBottom: 8 }}>{changed} promijenjenih redaka</div>
      <div style={{ fontFamily: mono, fontSize: 12.5, lineHeight: 1.55, border: `1px solid ${c.border}`, borderRadius: 12, overflow: "auto", maxHeight: "55dvh", padding: "6px 0", background: c.surfaceAlt }}>
        {rendered}
      </div>
    </div>
  );
}

export function JsonBlock({ value, maxHeight = 360 }: { value: unknown; maxHeight?: number | string }) {
  const { c } = useAdmin();
  return (
    <pre style={{
      margin: 0, fontFamily: mono, fontSize: 12.5, lineHeight: 1.55, background: c.surfaceAlt, color: c.text,
      border: `1px solid ${c.border}`, borderRadius: 12, padding: 12, overflow: "auto", maxHeight, whiteSpace: "pre",
    }}>{value === null || value === undefined ? "null" : pretty(value)}</pre>
  );
}

/* Edit → review diff → save. `onSave` receives the parsed value and an
   optional note for the history log; it should throw on failure. */
export function EditJsonModal({ title, value, onClose, onSave, hint }: {
  title: string; value: unknown; onClose: () => void; hint?: string;
  onSave: (next: unknown, note: string) => Promise<void>;
}) {
  const { c, bp } = useAdmin();
  const [text, setText] = useState(() => pretty(value));
  const [step, setStep] = useState<"edit" | "review">("edit");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const parsed = useMemo(() => {
    try { return { ok: true as const, value: JSON.parse(text) }; }
    catch (e) { return { ok: false as const, error: errMsg(e) }; }
  }, [text]);

  const save = async () => {
    if (!parsed.ok) return;
    setSaving(true); setSaveErr("");
    try { await onSave(parsed.value, note.trim()); }
    catch (e) { setSaveErr(errMsg(e)); setSaving(false); }
  };

  return (
    <Modal wide title={step === "edit" ? title : `Pregled izmjena · ${title}`} onClose={onClose} footer={step === "edit" ? <>
      <Button variant="ghost" onClick={() => parsed.ok && setText(pretty(parsed.value))} disabled={!parsed.ok}><AlignLeft size={16} /> Formatiraj</Button>
      <Button variant="primary" onClick={() => setStep("review")} disabled={!parsed.ok}>Pregledaj izmjene</Button>
    </> : <>
      <Button variant="ghost" onClick={() => setStep("edit")} disabled={saving}><ArrowLeft size={16} /> Natrag</Button>
      <Button variant="primary" onClick={save} disabled={saving}><Save size={16} /> {saving ? "Spremam…" : "Spremi"}</Button>
    </>}>
      {step === "edit" ? (
        <>
          {hint && <div style={{ fontSize: 13, color: c.textSub, marginBottom: 10, lineHeight: 1.5 }}>{hint}</div>}
          <textarea value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} wrap="off" style={{
            width: "100%", minHeight: bp === "mobile" ? "52dvh" : 420, fontFamily: mono, fontSize: 13.5, lineHeight: 1.55,
            background: c.inputBg, color: c.text, border: `1px solid ${parsed.ok ? c.border : c.danger}`, borderRadius: 12,
            padding: 12, outline: "none", resize: "vertical", whiteSpace: "pre", overflow: "auto",
          }} />
          <div style={{ fontSize: 12.5, marginTop: 8, color: parsed.ok ? c.ok : c.danger }}>
            {parsed.ok ? "Ispravan JSON" : `Neispravan JSON: ${parsed.error}`}
          </div>
        </>
      ) : (
        <>
          <DiffView before={value} after={parsed.ok ? parsed.value : value} />
          <div style={{ marginTop: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: c.textSub, marginBottom: 6 }}>Bilješka uz izmjenu (neobavezno)</label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="npr. Popravljena rezervacija bez datuma" maxLength={500} />
          </div>
          <div style={{ fontSize: 12.5, color: c.textFaint, marginTop: 10, lineHeight: 1.5 }}>
            Stara vrijednost se sprema u povijest i može se vratiti. Ako restoran trenutno ima otvorenu aplikaciju, zamoli ih da je osvježe — inače njihova sljedeća izmjena može prepisati ovu.
          </div>
          {saveErr && <div style={{ color: c.danger, fontSize: 13.5, marginTop: 10 }}>{saveErr}</div>}
        </>
      )}
    </Modal>
  );
}
