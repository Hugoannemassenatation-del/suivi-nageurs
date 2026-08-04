import React, { useState } from "react";
import { Plus, Trash2, ImagePlus, CalendarClock, Gauge } from "lucide-react";
import { ViewHeader, EmptyState, Modal } from "../lib/ui";
import { GROUPES, BASSINS, todayISO, daysAgo, RPE_ECHELLE } from "../lib/format";
import { createSession, deleteSession, uploadSeancePhoto, upsertPresence, upsertJourRpe } from "../lib/db";

export default function Seances({ swimmers, sessions, presences, jours, jourRpes, readOnly, mySwimmerId, reload }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: todayISO(), groupe: GROUPES[0], titre: "", bassin: "25m", volume_m: "", contenu: "", publication: "tous", cible_swimmer_id: "" });
  const [photoFile, setPhotoFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const add = async () => {
    if (!form.titre.trim()) return;
    setUploading(true);
    let photo_url = null;
    if (photoFile) {
      const res = await uploadSeancePhoto(photoFile);
      if (res.url) photo_url = res.url;
    }
    await createSession({
      date: form.date, groupe: form.groupe, titre: form.titre, bassin: form.bassin,
      volume_m: Number(form.volume_m) || 0, contenu: form.contenu, photo_url,
      swimmer_id: form.publication === "individuel" ? (form.cible_swimmer_id || null) : null,
    });
    setForm({ date: todayISO(), groupe: GROUPES[0], titre: "", bassin: "25m", volume_m: "", contenu: "", publication: "tous", cible_swimmer_id: "" });
    setPhotoFile(null);
    setUploading(false);
    setOpen(false);
    reload();
  };
  const remove = async (id) => { await deleteSession(id); reload(); };

  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="view">
      <ViewHeader
        eyebrow={`${sessions.length} séance${sessions.length > 1 ? "s" : ""}`}
        title="Séances"
        action={!readOnly && <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Nouvelle séance</button>}
      />

      {readOnly && <ProchainsEntrainements jours={jours} presences={presences} mySwimmerId={mySwimmerId} reload={reload} />}
      {readOnly && <MonRessenti jours={jours} jourRpes={jourRpes} mySwimmerId={mySwimmerId} reload={reload} />}

      {sorted.length === 0 ? (
        <EmptyState text="Aucune séance déposée." />
      ) : (
        <div className="session-list">
          {sorted.map((s) => {
            const rows = presences.filter((p) => p.date === s.date);
            const presentCount = rows.filter((p) => p.present).length;
            return (
              <div className="session-item" key={s.id}>
                <div>
                  <div className="session-card-top">
                    <span className="pill">{s.groupe}</span>
                    <span className="session-date">{s.date}</span>
                    <span className="pill pill-ghost">{s.bassin}</span>
                    {s.swimmer_id && <span className="pill pill-alt">{readOnly ? "Personnalisée pour toi" : `Privée — ${swimmers.find((sw) => sw.id === s.swimmer_id)?.nom || "un nageur"}`}</span>}
                  </div>
                  <div className="session-title">{s.titre}</div>
                  {s.contenu && <div className="session-content">{s.contenu}</div>}
                  {s.photo_url && <img src={s.photo_url} alt="Séance" className="session-photo" />}
                  <div className="session-meta">
                    <span>{Number(s.volume_m).toLocaleString("fr-FR")} m</span>
                    {!readOnly && <><span>·</span><span>{presentCount}/{swimmers.length} présents ce jour</span></>}
                  </div>
                </div>
                {!readOnly && (
                  <div className="session-item-actions">
                    <button className="icon-btn" onClick={() => remove(s.id)}><Trash2 size={15} /></button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {open && !readOnly && (
        <Modal title="Nouvelle séance" onClose={() => setOpen(false)}>
          <div className="form-grid-2">
            <div><label>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
            <div>
              <label>Groupe</label>
              <select value={form.groupe} onChange={(e) => setForm({ ...form, groupe: e.target.value })}>
                {GROUPES.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <label>Titre</label>
          <input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} placeholder="Ex. Séance VMA + technique dos" />
          <div className="form-grid-2">
            <div>
              <label>Publier pour</label>
              <select value={form.publication} onChange={(e) => setForm({ ...form, publication: e.target.value })}>
                <option value="tous">Tout le monde</option>
                <option value="individuel">Un nageur en particulier</option>
              </select>
            </div>
            {form.publication === "individuel" && (
              <div>
                <label>Nageur concerné</label>
                <select value={form.cible_swimmer_id} onChange={(e) => setForm({ ...form, cible_swimmer_id: e.target.value })}>
                  <option value="">Sélectionner…</option>
                  {swimmers.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="form-grid-2">
            <div>
              <label>Bassin</label>
              <select value={form.bassin} onChange={(e) => setForm({ ...form, bassin: e.target.value })}>
                {BASSINS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div><label>Volume total (m)</label><input type="number" value={form.volume_m} onChange={(e) => setForm({ ...form, volume_m: e.target.value })} placeholder="Ex. 3200" /></div>
          </div>
          <label>Contenu de la séance (optionnel si vous joignez une photo)</label>
          <textarea rows={4} value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })} placeholder={"Ex.\n400 échauffement\n8x50 technique\n2000 corps de séance\n300 retour au calme"} />
          <label>Ou joindre une photo (ex. plan de séance manuscrit)</label>
          <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
          {photoFile && <div className="login-hint" style={{ marginTop: 6 }}><ImagePlus size={13} style={{ verticalAlign: "middle", marginRight: 4 }} />{photoFile.name}</div>}
          <button className="btn-primary full" disabled={uploading} onClick={add}>{uploading ? "Envoi…" : "Déposer la séance"}</button>
        </Modal>
      )}
    </div>
  );
}

function MonRessenti({ jours, jourRpes, mySwimmerId, reload }) {
  const recent = [...jours]
    .filter((j) => daysAgo(j.date) >= 0 && daysAgo(j.date) <= 5)
    .sort((a, b) => b.date.localeCompare(a.date));

  const getMine = (jourId) => jourRpes.find((r) => r.jour_id === jourId && r.swimmer_id === mySwimmerId);

  const setRpe = async (jourId, rpe) => {
    if (!mySwimmerId || rpe == null) return;
    await upsertJourRpe({ jour_id: jourId, swimmer_id: mySwimmerId, rpe });
    reload();
  };

  if (recent.length === 0) return null;

  return (
    <div className="panel">
      <div className="panel-head"><h4><Gauge size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />Mon ressenti après l'entraînement (RPE)</h4></div>
      <p className="login-hint" style={{ marginTop: -6, marginBottom: 10 }}>Une note par entraînement — 0 = repos total, 10 = effort maximal. Tu peux répondre même si le coach n'a pas encore détaillé la séance.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {recent.map((j) => {
          const mine = getMine(j.id);
          return (
            <div key={j.id} className="row-line" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span><span className="strong">{j.date}</span>{j.label ? ` — ${j.label}` : ""}</span>
              <select value={mine?.rpe ?? ""} onChange={(e) => setRpe(j.id, e.target.value ? Number(e.target.value) : null)} style={{ maxWidth: 220 }}>
                <option value="">Choisir mon RPE…</option>
                {RPE_ECHELLE.map((r) => <option key={r.v} value={r.v}>{r.v} · {r.label}</option>)}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProchainsEntrainements({ jours, presences, mySwimmerId, reload }) {
  const upcoming = [...jours].filter((j) => daysAgo(j.date) <= 0).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 10);

  const getMine = (date) => presences.find((p) => p.date === date && p.swimmer_id === mySwimmerId);

  const declare = async (date, absent, motif) => {
    if (!mySwimmerId) return;
    const prevMotif = getMine(date)?.motif || null;
    await upsertPresence({ date, swimmer_id: mySwimmerId, present: !absent, motif: absent ? (motif !== undefined ? motif : prevMotif) : null });
    reload();
  };

  if (upcoming.length === 0) return null;

  return (
    <div className="panel">
      <div className="panel-head"><h4><CalendarClock size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />Prochains entraînements</h4></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {upcoming.map((j) => {
          const mine = getMine(j.date);
          const isAbsent = mine && mine.present === false;
          return (
            <div key={j.id} className="row-line" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span><span className="strong">{j.date}</span>{j.label ? ` — ${j.label}` : ""}{j.groupe ? ` (${j.groupe})` : ""}</span>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, textTransform: "none", fontWeight: 500 }}>
                  <input type="checkbox" style={{ width: "auto" }} checked={!!isAbsent} onChange={(e) => declare(j.date, e.target.checked)} />
                  Je serai absent(e)
                </label>
              </div>
              {isAbsent && (
                <input
                  placeholder="Motif (optionnel)"
                  defaultValue={mine?.motif || ""}
                  onBlur={(e) => declare(j.date, true, e.target.value)}
                  style={{ maxWidth: 320 }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
