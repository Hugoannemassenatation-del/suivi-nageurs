import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ViewHeader, EmptyState, Modal } from "../lib/ui";
import { GROUPES, BASSINS, todayISO } from "../lib/format";
import { createSession, deleteSession } from "../lib/db";

export default function Seances({ swimmers, sessions, presences, readOnly, reload }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: todayISO(), groupe: GROUPES[0], titre: "", bassin: "25m", volume_m: "", contenu: "" });

  const add = async () => {
    if (!form.titre.trim()) return;
    await createSession({ ...form, volume_m: Number(form.volume_m) || 0 });
    setForm({ date: todayISO(), groupe: GROUPES[0], titre: "", bassin: "25m", volume_m: "", contenu: "" });
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
      {sorted.length === 0 ? (
        <EmptyState text="Aucune séance déposée." />
      ) : (
        <div className="session-list">
          {sorted.map((s) => {
            const rows = presences.filter((p) => p.date === s.date);
            const presentCount = rows.filter((p) => p.present).length;
            const rpeVals = rows.filter((p) => p.present).map((p) => p.rpe).filter((v) => v != null);
            const avgRpe = rpeVals.length ? (rpeVals.reduce((a, b) => a + b, 0) / rpeVals.length).toFixed(1) : null;
            return (
              <div className="session-item" key={s.id}>
                <div>
                  <div className="session-card-top">
                    <span className="pill">{s.groupe}</span>
                    <span className="session-date">{s.date}</span>
                    <span className="pill pill-ghost">{s.bassin}</span>
                  </div>
                  <div className="session-title">{s.titre}</div>
                  {s.contenu && <div className="session-content">{s.contenu}</div>}
                  <div className="session-meta">
                    <span>{Number(s.volume_m).toLocaleString("fr-FR")} m</span>
                    {!readOnly && <><span>·</span><span>{presentCount}/{swimmers.length} présents ce jour</span></>}
                    {!readOnly && avgRpe && <><span>·</span><span>RPE moy. {avgRpe}/10</span></>}
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
              <label>Bassin</label>
              <select value={form.bassin} onChange={(e) => setForm({ ...form, bassin: e.target.value })}>
                {BASSINS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div><label>Volume total (m)</label><input type="number" value={form.volume_m} onChange={(e) => setForm({ ...form, volume_m: e.target.value })} placeholder="Ex. 3200" /></div>
          </div>
          <label>Contenu de la séance</label>
          <textarea rows={5} value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })} placeholder={"Ex.\n400 échauffement\n8x50 technique\n2000 corps de séance\n300 retour au calme"} />
          <button className="btn-primary full" onClick={add}>Déposer la séance</button>
        </Modal>
      )}
    </div>
  );
}
