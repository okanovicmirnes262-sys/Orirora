import React, { useMemo, useState } from "react";
import { ArrowLeft, Copy, Download, Eye, EyeOff, KeyRound, LogIn, Pencil, Save, ShieldAlert, ShieldCheck, Trash2 } from "lucide-react";
import { copyToClipboard, generatePassword, generateRecoveryCode, hashPassword } from "../RestaurantOS";
import { api, type KeyRow, type RestaurantDetail as Detail } from "./api";
import {
  Badge, Button, Card, Chips, Empty, ErrorBox, Field, Input, Loading, Modal, SectionTitle, Textarea,
  useAdmin, useLoad, downloadJson, errMsg, fmtAgo, fmtDate, font, mono,
} from "./ui";
import { EditJsonModal } from "./JsonEditor";
import { ErrorList } from "./Errors";
import { HistoryList } from "./History";

/* ------------------------------------------------------------------ */
/*  One restaurant: /admin/restorani/:slug/:tab                        */
/* ------------------------------------------------------------------ */

const TABS = [
  { value: "info", label: "Info" },
  { value: "nalozi", label: "Nalozi" },
  { value: "podaci", label: "Podaci" },
  { value: "json", label: "Sirovi JSON" },
  { value: "greske", label: "Greške" },
  { value: "povijest", label: "Povijest" },
  { value: "biljeske", label: "Bilješke" },
  { value: "akcije", label: "Akcije" },
] as const;
type Tab = typeof TABS[number]["value"];

const keyFor = (slug: string, part: string) => `restaurantos:${slug}:${part}`;
const partOf = (key: string) => key.split(":").slice(2).join(":");

export default function RestaurantDetail({ slug, tab }: { slug: string; tab?: string }) {
  const { c, bp, navigate, toast } = useAdmin();
  const { data, error, loading, reload } = useLoad(() => api<Detail>("get_restaurant", { slug }), [slug]);
  const active: Tab = (TABS.find((t) => t.value === tab)?.value) || "info";

  const parts = useMemo(() => {
    const m: Record<string, KeyRow> = {};
    for (const k of data?.keys || []) m[partOf(k.key)] = k;
    return m;
  }, [data]);

  // Every write goes through here: set_key logs the previous value to history.
  const saveKey = async (part: string, value: unknown, note?: string) => {
    await api("set_key", { key: keyFor(slug, part), value, note });
    toast("Spremljeno");
    reload();
  };

  const go = (t: Tab) => {
    const path = `/admin/restorani/${encodeURIComponent(slug)}${t === "info" ? "" : `/${t}`}`;
    window.history.replaceState({}, "", path);
    navigate(path);
  };

  const restaurant = parts.restaurant?.value || null;
  const name = data?.registryEntry?.name || restaurant?.name || slug;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
      <div>
        <button onClick={() => navigate("/admin/restorani")} style={{
          display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", color: c.textSub,
          fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "6px 0", minHeight: 40,
        }}><ArrowLeft size={16} /> Restorani</button>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginTop: 2 }}>
          <h1 style={{ margin: 0, fontFamily: font.display, fontSize: bp === "mobile" ? 27 : 32, fontWeight: 600, color: c.text, overflowWrap: "anywhere" }}>{name}</h1>
          {data && (data.status.suspended ? <Badge tone="warn">Suspendiran</Badge> : <Badge tone="ok">Aktivan</Badge>)}
          {data && !data.registryEntry && <Badge tone="danger">Nije u registru</Badge>}
        </div>
        <div style={{ fontSize: 13, color: c.textFaint, marginTop: 4, fontFamily: mono }}>{slug}</div>
      </div>

      <Chips<Tab> value={active} onChange={go} options={TABS.map((t) => ({ value: t.value, label: t.label }))} />

      {error && <ErrorBox message={error} onRetry={reload} />}
      {loading && !data ? <Loading /> : data && (
        <>
          {active === "info" && <InfoTab data={data} parts={parts} />}
          {active === "nalozi" && <AccountsTab slug={slug} name={name} parts={parts} saveKey={saveKey} />}
          {active === "podaci" && <DataTab parts={parts} saveKey={saveKey} />}
          {active === "json" && <JsonTab keys={data.keys} saveKey={saveKey} />}
          {active === "greske" && <ErrorList slug={slug} />}
          {active === "povijest" && <HistoryList slug={slug} onRestored={reload} />}
          {active === "biljeske" && <NotesTab slug={slug} note={data.note} onSaved={reload} />}
          {active === "akcije" && <ActionsTab slug={slug} name={name} data={data} onChanged={reload} />}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Info                                                               */
/* ------------------------------------------------------------------ */

function sizeLabel(v: unknown) {
  if (Array.isArray(v)) return `${v.length} stavki`;
  if (v && typeof v === "object") {
    const vals = Object.values(v as object);
    if (vals.every(Array.isArray)) return vals.map((a) => (a as unknown[]).length).reduce((x, y) => x + y, 0) + " stavki";
    return `${Object.keys(v as object).length} polja`;
  }
  return typeof v;
}

function InfoTab({ data, parts }: { data: Detail; parts: Record<string, KeyRow> }) {
  const { c, bp } = useAdmin();
  const [reveal, setReveal] = useState(false);
  const r = parts.restaurant?.value;
  return (
    <div style={{ display: "grid", gridTemplateColumns: bp === "desktop" ? "minmax(0, 3fr) minmax(0, 2fr)" : "minmax(0, 1fr)", gap: 16 }}>
      <Card>
        <SectionTitle>Podaci restorana</SectionTitle>
        {!r ? <Empty title="Ključ 'restaurant' ne postoji" hint="Restoran nema osnovni zapis — vjerojatno nedovršeno postavljanje." /> :
          Object.entries(r).map(([k, v]) => (
            <Field key={k} label={k}>
              {k === "recoveryCode" ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: mono }}>{reveal ? String(v) : "••••-••••"}</span>
                  <button aria-label="Prikaži" onClick={() => setReveal(!reveal)} style={{ background: "none", border: "none", cursor: "pointer", color: c.textSub, padding: 4 }}>
                    {reveal ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </span>
              ) : v !== null && typeof v === "object" ? (
                <span style={{ color: c.textSub }}>{sizeLabel(v)}</span>
              ) : String(v)}
            </Field>
          ))}
      </Card>
      <Card>
        <SectionTitle>Ključevi u bazi</SectionTitle>
        {data.keys.length === 0 && <Empty title="Nema podataka" />}
        {data.keys.map((k) => (
          <div key={k.key} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "9px 0", borderBottom: `1px solid ${c.border}`, fontSize: 13.5 }}>
            <span style={{ fontFamily: mono, color: c.text }}>{partOf(k.key)}</span>
            <span style={{ color: c.textSub, textAlign: "right" }}>{sizeLabel(k.value)} · {fmtAgo(k.updated_at)}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Accounts — password + recovery code resets                         */
/* ------------------------------------------------------------------ */

const ROLE_HR: Record<string, string> = { owner: "Vlasnik", waiter: "Konobar", chef: "Kuhar" };

function AccountsTab({ slug, name, parts, saveKey }: {
  slug: string; name: string; parts: Record<string, KeyRow>;
  saveKey: (part: string, value: unknown, note?: string) => Promise<void>;
}) {
  const { c, toast } = useAdmin();
  const accounts: any[] = Array.isArray(parts.accounts?.value) ? parts.accounts.value : [];
  const restaurant = parts.restaurant?.value;
  const [confirm, setConfirm] = useState<{ kind: "password"; account: any } | { kind: "recovery" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState<{ title: string; label: string; secret: string; login?: boolean } | null>(null);

  const resetPassword = async (account: any) => {
    setBusy(true);
    try {
      const password = generatePassword();
      const { pwSalt, pwHash } = await hashPassword(password);
      const next = accounts.map((a) => {
        if (a !== account) return a;
        const updated = { ...a, pwSalt, pwHash };
        delete updated.password;
        return updated;
      });
      await saveKey("accounts", next, `Reset lozinke: ${account.email || account.name}`);
      setConfirm(null);
      setShown({ title: `Nova lozinka · ${account.name || account.email}`, label: "LOZINKA", secret: password, login: true });
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setBusy(false);
    }
  };

  const resetRecovery = async () => {
    if (!restaurant) return;
    setBusy(true);
    try {
      const code = generateRecoveryCode();
      await saveKey("restaurant", { ...restaurant, recoveryCode: code }, "Novi kod za oporavak");
      setConfirm(null);
      setShown({ title: "Novi kod za oporavak", label: "KOD ZA OPORAVAK", secret: code });
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <SectionTitle right={<Button small variant="ghost" disabled={!restaurant} onClick={() => setConfirm({ kind: "recovery" })}><KeyRound size={15} /> Novi kod</Button>}>
          Kod za oporavak
        </SectionTitle>
        <div style={{ fontSize: 13.5, color: c.textSub, lineHeight: 1.5 }}>
          Vlasnik njime sam resetira lozinku („Zaboravljena lozinka?” na prijavi). {restaurant?.recoveryCode ? "Kod je postavljen." : "Kod NIJE postavljen."}
        </div>
      </Card>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "16px 18px 4px" }}><SectionTitle>Nalozi ({accounts.length})</SectionTitle></div>
        {accounts.length === 0 && <Empty title="Nema naloga" />}
        {accounts.map((a, i) => (
          <div key={a.id || i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", borderTop: `1px solid ${c.border}`, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 200px", minWidth: 0 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, color: c.text }}>{a.name || "(bez imena)"}</span>
                <Badge>{ROLE_HR[a.role] || a.role || "?"}</Badge>
                {!a.pwHash && <Badge tone="danger">Lozinka nije hashirana</Badge>}
              </div>
              <div style={{ fontSize: 12.5, color: c.textSub, marginTop: 2, overflowWrap: "anywhere" }}>{a.email || "—"}</div>
            </div>
            <Button small variant="ghost" onClick={() => setConfirm({ kind: "password", account: a })}><KeyRound size={15} /> Resetiraj lozinku</Button>
          </div>
        ))}
      </Card>

      {confirm && (
        <Modal title={confirm.kind === "password" ? "Resetirati lozinku?" : "Novi kod za oporavak?"} onClose={() => !busy && setConfirm(null)} footer={<>
          <Button variant="ghost" disabled={busy} onClick={() => setConfirm(null)}>Odustani</Button>
          <Button variant="primary" disabled={busy} onClick={() => (confirm.kind === "password" ? resetPassword(confirm.account) : resetRecovery())}>
            {busy ? "Spremam…" : "Da, resetiraj"}
          </Button>
        </>}>
          <div style={{ fontSize: 14.5, color: c.text, lineHeight: 1.55 }}>
            {confirm.kind === "password"
              ? <>Generirat će se nova lozinka za <b>{confirm.account.name || confirm.account.email}</b>. Stara prestaje vrijediti odmah, a uređaji s „zapamti me” morat će se ponovno prijaviti.</>
              : <>Stari kod za oporavak prestaje vrijediti. Novi kod pošalji vlasniku restorana.</>}
          </div>
        </Modal>
      )}
      {shown && <SecretModal {...shown} restaurantName={name} slug={slug} onClose={() => setShown(null)} />}
    </div>
  );
}

function SecretModal({ title, label, secret, login, restaurantName, onClose }: {
  title: string; label: string; secret: string; login?: boolean; restaurantName: string; slug: string; onClose: () => void;
}) {
  const { c } = useAdmin();
  const [copied, setCopied] = useState(false);
  const text = login
    ? `ORDIORA prijava\nRestoran: ${restaurantName}\nLozinka: ${secret}`
    : `ORDIORA kod za oporavak (${restaurantName}): ${secret}`;
  return (
    <Modal title={title} onClose={onClose} footer={<>
      <Button variant="ghost" onClick={() => copyToClipboard(text).then(() => setCopied(true), () => {})}><Copy size={16} /> {copied ? "Kopirano" : "Kopiraj"}</Button>
      <Button variant="primary" onClick={onClose}>Gotovo</Button>
    </>}>
      <div style={{ background: c.surfaceAlt, borderRadius: 14, padding: 16 }}>
        <div style={{ fontSize: 11, color: c.textFaint, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 3 }}>RESTORAN</div>
        <div style={{ fontSize: 15, color: c.text, fontWeight: 600, marginBottom: 12 }}>{restaurantName}</div>
        <div style={{ fontSize: 11, color: c.textFaint, fontWeight: 700, letterSpacing: "0.05em", marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 20, color: c.text, fontWeight: 700, fontFamily: mono, overflowWrap: "anywhere" }}>{secret}</div>
      </div>
      <div style={{ fontSize: 13, color: c.warn, marginTop: 12, lineHeight: 1.5 }}>Spremi ili pošalji sada — iz sigurnosnih razloga ovo se ne može ponovno prikazati.</div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/*  Data — readable tables over the restaurant's JSON arrays           */
/* ------------------------------------------------------------------ */

const DATASETS = [
  { value: "reservations", label: "Rezervacije" },
  { value: "tables", label: "Stolovi" },
  { value: "shifts", label: "Smjene" },
  { value: "chat", label: "Chat" },
  { value: "notifications", label: "Obavijesti" },
] as const;
type Dataset = typeof DATASETS[number]["value"];
const PAGE = 100;

/* Columns: primitive-valued fields (never `id`) — the ones that identify a
   record and its state first, then whatever else is most common. */
const PREFERRED_COLUMNS = ["name", "date", "time", "status", "table", "guests", "seats", "staffId", "start", "end", "author", "text", "type"];
function pickColumns(rows: any[], max: number) {
  const freq = new Map<string, number>();
  for (const r of rows.slice(0, 200)) {
    if (!r || typeof r !== "object") continue;
    for (const [k, v] of Object.entries(r)) {
      if (k === "id" || (v !== null && typeof v === "object")) continue;
      freq.set(k, (freq.get(k) || 0) + 1);
    }
  }
  const rank = (k: string) => { const i = PREFERRED_COLUMNS.indexOf(k); return i === -1 ? PREFERRED_COLUMNS.length : i; };
  return [...freq.entries()].sort((a, b) => rank(a[0]) - rank(b[0]) || b[1] - a[1]).slice(0, max).map(([k]) => k);
}

const cell = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));

function DataTab({ parts, saveKey }: { parts: Record<string, KeyRow>; saveKey: (part: string, value: unknown, note?: string) => Promise<void> }) {
  const { c, bp, toast } = useAdmin();
  const [dataset, setDataset] = useState<Dataset>("reservations");
  const [channel, setChannel] = useState("general");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [editing, setEditing] = useState<{ index: number; row: any } | null>(null);
  const [editAll, setEditAll] = useState(false);
  const [deleting, setDeleting] = useState<{ index: number; row: any } | null>(null);
  const [busy, setBusy] = useState(false);

  const raw = parts[dataset]?.value;
  const isChat = dataset === "chat";
  const channels = isChat && raw && typeof raw === "object" ? Object.keys(raw) : [];
  const rows: any[] = isChat ? (Array.isArray(raw?.[channel]) ? raw[channel] : []) : Array.isArray(raw) ? raw : [];

  // Show newest first; keep the original index for writes.
  const indexed = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.map((row, index) => ({ row, index }))
      .filter(({ row }) => !needle || JSON.stringify(row).toLowerCase().includes(needle))
      .reverse();
  }, [rows, q]);
  const columns = useMemo(() => pickColumns(rows, bp === "desktop" ? 6 : 4), [rows, bp]);

  const writeRows = async (nextRows: any[], note: string) => {
    const value = isChat ? { ...raw, [channel]: nextRows } : nextRows;
    await saveKey(dataset, value, note);
  };
  const label = DATASETS.find((d) => d.value === dataset)!.label;

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      await writeRows(rows.filter((_, i) => i !== deleting.index), `${label}: obrisan zapis ${deleting.row?.id ?? `#${deleting.index}`}`);
      setDeleting(null);
    } catch (e) {
      toast(errMsg(e), "error");
    } finally { setBusy(false); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <Chips<Dataset> value={dataset} onChange={(d) => { setDataset(d); setLimit(PAGE); setQ(""); }} options={DATASETS.map((d) => ({ value: d.value, label: d.label }))} />
      {isChat && channels.length > 0 && (
        <Chips value={channel} onChange={setChannel} options={channels.map((ch) => ({ value: ch, label: `#${ch}` }))} />
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Input placeholder="Pretraži zapise…" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: "1 1 220px", width: "auto" }} />
        <Button variant="ghost" onClick={() => setEditAll(true)}><Pencil size={15} /> Uredi cijeli ključ</Button>
      </div>
      <div style={{ fontSize: 12.5, color: c.textFaint }}>
        {rows.length} zapisa{parts[dataset] ? ` · ažurirano ${fmtAgo(parts[dataset].updated_at)}` : " · ključ ne postoji"}
      </div>

      {indexed.length === 0 ? <Card><Empty title="Nema zapisa" /></Card> : bp === "mobile" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {indexed.slice(0, limit).map(({ row, index }) => (
            <Card key={index} style={{ padding: 14 }}>
              {columns.map((col) => (
                <div key={col} style={{ display: "flex", gap: 10, fontSize: 13.5, padding: "2px 0" }}>
                  <span style={{ color: c.textFaint, width: 92, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{col}</span>
                  <span style={{ color: c.text, minWidth: 0, overflowWrap: "anywhere" }}>{cell(row?.[col])}</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <Button small variant="ghost" onClick={() => setEditing({ index, row })} style={{ flex: 1 }}><Pencil size={14} /> Uredi</Button>
                <Button small variant="ghost" onClick={() => setDeleting({ index, row })} style={{ flex: 1, color: c.danger }}><Trash2 size={14} /> Obriši</Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5, color: c.text }}>
              <thead>
                <tr style={{ textAlign: "left", color: c.textFaint, fontSize: 12 }}>
                  <th style={{ padding: "10px 14px", borderBottom: `1px solid ${c.border}` }}>#</th>
                  {columns.map((col) => <th key={col} style={{ padding: "10px 14px", borderBottom: `1px solid ${c.border}`, whiteSpace: "nowrap" }}>{col}</th>)}
                  <th style={{ borderBottom: `1px solid ${c.border}` }} />
                </tr>
              </thead>
              <tbody>
                {indexed.slice(0, limit).map(({ row, index }) => (
                  <tr key={index} className="adm-row" style={{ borderBottom: `1px solid ${c.border}` }}>
                    <td style={{ padding: "9px 14px", color: c.textFaint }}>{index}</td>
                    {columns.map((col) => (
                      <td key={col} style={{ padding: "9px 14px", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cell(row?.[col])}</td>
                    ))}
                    <td style={{ padding: "6px 10px", whiteSpace: "nowrap", textAlign: "right" }}>
                      <Button small variant="subtle" onClick={() => setEditing({ index, row })} title="Uredi"><Pencil size={14} /></Button>{" "}
                      <Button small variant="subtle" onClick={() => setDeleting({ index, row })} title="Obriši" style={{ color: c.danger }}><Trash2 size={14} /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
      {indexed.length > limit && <Button variant="ghost" onClick={() => setLimit(limit + PAGE)}>Prikaži još ({indexed.length - limit})</Button>}

      {editing && (
        <EditJsonModal title={`${label} · zapis #${editing.index}`} value={editing.row} onClose={() => setEditing(null)}
          onSave={async (next, note) => {
            await writeRows(rows.map((r, i) => (i === editing.index ? next : r)), note || `${label}: uređen zapis ${editing.row?.id ?? `#${editing.index}`}`);
            setEditing(null);
          }} />
      )}
      {editAll && (
        <EditJsonModal title={isChat ? "chat" : dataset} value={raw ?? (isChat ? {} : [])} onClose={() => setEditAll(false)}
          hint="Uređuješ cijeli ključ odjednom. Pazi da struktura ostane ista (polje ili objekt), inače aplikacija neće moći pročitati podatke."
          onSave={async (next, note) => { await saveKey(dataset, next, note || `${label}: uređen cijeli ključ`); setEditAll(false); }} />
      )}
      {deleting && (
        <Modal title="Obrisati zapis?" onClose={() => !busy && setDeleting(null)} footer={<>
          <Button variant="ghost" disabled={busy} onClick={() => setDeleting(null)}>Odustani</Button>
          <Button variant="danger" disabled={busy} onClick={remove}><Trash2 size={15} /> {busy ? "Brišem…" : "Obriši"}</Button>
        </>}>
          <div style={{ fontSize: 14, color: c.textSub, marginBottom: 10 }}>Zapis se može vratiti iz povijesti.</div>
          <pre style={{ margin: 0, fontFamily: mono, fontSize: 12.5, background: c.surfaceAlt, borderRadius: 12, padding: 12, overflow: "auto", maxHeight: 300, color: c.text }}>
            {JSON.stringify(deleting.row, null, 2)}
          </pre>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Raw JSON — every kv_store key of this restaurant                   */
/* ------------------------------------------------------------------ */

function JsonTab({ keys, saveKey }: { keys: KeyRow[]; saveKey: (part: string, value: unknown, note?: string) => Promise<void> }) {
  const { c } = useAdmin();
  const [open, setOpen] = useState<KeyRow | null>(null);
  return (
    <>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {keys.length === 0 && <Empty title="Nema ključeva" />}
        {keys.map((k) => (
          <button key={k.key} className="adm-row" onClick={() => setOpen(k)} style={{
            display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left", background: "none", border: "none",
            borderBottom: `1px solid ${c.border}`, padding: "13px 18px", cursor: "pointer", color: c.text, minHeight: 54, flexWrap: "wrap",
          }}>
            <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 600, flex: "1 1 160px" }}>{partOf(k.key)}</span>
            <span style={{ fontSize: 12.5, color: c.textSub }}>{sizeLabel(k.value)} · {(JSON.stringify(k.value).length / 1024).toFixed(1)} KB · {fmtDate(k.updated_at)}</span>
            <Pencil size={15} color={c.textFaint} />
          </button>
        ))}
      </Card>
      {open && (
        <EditJsonModal title={partOf(open.key)} value={open.value} onClose={() => setOpen(null)}
          onSave={async (next, note) => { await saveKey(partOf(open.key), next, note || undefined); setOpen(null); }} />
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Notes                                                              */
/* ------------------------------------------------------------------ */

function NotesTab({ slug, note, onSaved }: { slug: string; note: Detail["note"]; onSaved: () => void }) {
  const { c, toast } = useAdmin();
  const [text, setText] = useState(note.notes || "");
  const [busy, setBusy] = useState(false);
  const dirty = text !== (note.notes || "");
  const save = async () => {
    setBusy(true);
    try { await api("set_note", { slug, notes: text }); toast("Bilješke spremljene"); onSaved(); }
    catch (e) { toast(errMsg(e), "error"); }
    finally { setBusy(false); }
  };
  return (
    <Card>
      <SectionTitle>Interne bilješke</SectionTitle>
      <div style={{ fontSize: 13, color: c.textSub, marginBottom: 10 }}>Vidiš ih samo ti — kontakt, plan pretplate, poznati problemi…</div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={12} maxLength={20000} />
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        <Button variant="primary" disabled={!dirty || busy} onClick={save}><Save size={16} /> {busy ? "Spremam…" : "Spremi"}</Button>
        <span style={{ fontSize: 12.5, color: c.textFaint }}>{note.updated_at ? `Zadnja izmjena: ${fmtDate(note.updated_at)}` : "Još nije spremljeno"}</span>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

const DEFAULT_SUSPEND_MSG = "Pristup je privremeno obustavljen. Javite se ORDIORA podršci.";

function ActionsTab({ slug, name, data, onChanged }: { slug: string; name: string; data: Detail; onChanged: () => void }) {
  const { c, bp, toast, navigate } = useAdmin();
  const [msg, setMsg] = useState(data.status.message || DEFAULT_SUSPEND_MSG);
  const [busy, setBusy] = useState("");
  const [confirmName, setConfirmName] = useState("");
  const [fallbackLink, setFallbackLink] = useState("");

  const run = async (label: string, fn: () => Promise<void>) => {
    setBusy(label);
    try { await fn(); } catch (e) { toast(errMsg(e), "error"); } finally { setBusy(""); }
  };

  // Open the tab synchronously (inside the click) so popup blockers allow it,
  // then point it at the one-time link once the token arrives.
  const impersonate = () => run("imp", async () => {
    const w = window.open("about:blank", "_blank");
    try {
      const { token } = await api<{ token: string }>("impersonate", { slug });
      const link = `/?impersonate=${encodeURIComponent(token)}`;
      if (w) { w.opener = null; w.location.href = link; } else setFallbackLink(link);
    } catch (e) {
      if (w) w.close();
      throw e;
    }
  });

  const toggleSuspend = () => run("sus", async () => {
    const suspended = !data.status.suspended;
    await api("set_status", { slug, suspended, message: suspended ? msg.trim() || DEFAULT_SUSPEND_MSG : data.status.message });
    toast(suspended ? "Restoran suspendiran" : "Restoran ponovno aktivan");
    onChanged();
  });

  const exportData = () => run("exp", async () => {
    const out = await api("export", { slug });
    downloadJson(`ordiora-${slug}-${new Date().toISOString().slice(0, 10)}.json`, out);
  });

  const remove = () => run("del", async () => {
    await api("delete_restaurant", { slug, confirmName });
    toast("Restoran obrisan — može se vratiti iz Povijesti");
    navigate("/admin/restorani");
  });

  const expected = (data.registryEntry?.name || slug).trim().toLowerCase();
  const canDelete = confirmName.trim().toLowerCase() === expected;
  const cols = bp === "desktop" ? "1fr 1fr" : "1fr";

  return (
    <div style={{ display: "grid", gridTemplateColumns: cols, gap: 16 }}>
      <Card>
        <SectionTitle>Uđi kao vlasnik</SectionTitle>
        <div style={{ fontSize: 13.5, color: c.textSub, lineHeight: 1.55, marginBottom: 14 }}>
          Otvara aplikaciju u novoj kartici točno kako je vidi vlasnik. Link vrijedi 2 minute i samo jednom. <b style={{ color: c.text }}>Sve izmjene su stvarne.</b>
        </div>
        <Button variant="primary" disabled={!!busy} onClick={impersonate}><LogIn size={16} /> {busy === "imp" ? "Otvaram…" : "Uđi kao vlasnik"}</Button>
        {fallbackLink && (
          <div style={{ fontSize: 13.5, marginTop: 12 }}>
            Preglednik je blokirao novu karticu — <a href={fallbackLink} target="_blank" rel="noreferrer" style={{ color: c.text, fontWeight: 700 }}>otvori ovdje</a>.
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle>Export podataka</SectionTitle>
        <div style={{ fontSize: 13.5, color: c.textSub, lineHeight: 1.55, marginBottom: 14 }}>
          Preuzmi sve ključeve restorana, status i bilješke kao jednu JSON datoteku.
        </div>
        <Button variant="ghost" disabled={!!busy} onClick={exportData}><Download size={16} /> {busy === "exp" ? "Pripremam…" : "Preuzmi JSON"}</Button>
      </Card>

      <Card>
        <SectionTitle>{data.status.suspended ? "Restoran je suspendiran" : "Suspendiraj restoran"}</SectionTitle>
        <div style={{ fontSize: 13.5, color: c.textSub, lineHeight: 1.55, marginBottom: 10 }}>
          {data.status.suspended
            ? "Nitko iz restorana se ne može prijaviti. Vide poruku ispod."
            : "Blokira prijavu svima u restoranu i prikazuje im ovu poruku. Podaci ostaju netaknuti."}
        </div>
        {!data.status.suspended
          ? <Textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} maxLength={500} style={{ marginBottom: 12 }} />
          : <div style={{ fontSize: 14, color: c.text, background: c.surfaceAlt, borderRadius: 12, padding: 12, marginBottom: 12, whiteSpace: "pre-wrap" }}>{data.status.message || DEFAULT_SUSPEND_MSG}</div>}
        <Button variant={data.status.suspended ? "primary" : "ghost"} disabled={!!busy} onClick={toggleSuspend}>
          {data.status.suspended ? <><ShieldCheck size={16} /> Aktiviraj</> : <><ShieldAlert size={16} /> Suspendiraj</>}
        </Button>
      </Card>

      <Card style={{ borderColor: c.danger }}>
        <SectionTitle><span style={{ color: c.danger }}>Obriši restoran</span></SectionTitle>
        <div style={{ fontSize: 13.5, color: c.textSub, lineHeight: 1.55, marginBottom: 10 }}>
          Briše sve podatke restorana ({data.keys.length} ključeva) i uklanja ga iz registra. Snimka se sprema u povijest pa se brisanje može vratiti.
          Za potvrdu upiši ime: <b style={{ color: c.text }}>{data.registryEntry?.name || slug}</b>
        </div>
        <Input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} placeholder={name} style={{ marginBottom: 12 }} />
        <Button variant="danger" disabled={!canDelete || !!busy} onClick={remove}><Trash2 size={16} /> {busy === "del" ? "Brišem…" : "Trajno obriši"}</Button>
      </Card>
    </div>
  );
}
