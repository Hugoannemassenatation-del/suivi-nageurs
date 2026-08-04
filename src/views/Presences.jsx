import React, { useEffect, useMemo, useState } from "react";
import { Gauge, Plus, Trash2, Settings, Upload } from "lucide-react";
import { ViewHeader, EmptyState, Modal } from "../lib/ui";
import { GROUPES, todayISO } from "../lib/format";
import { upsertPresence, createJour, createJoursBulk, deleteJour } from "../lib/db";

function getRow(presences, date, swimmerId) {
  return presences.find((p) => p.date === date && p.swimmer_id === swimmerId) || { present: false, rpe: null };
}

export default function Presences({ swimmers, presences, jours, jourRpes, reload }) {
  const [jourId, setJourId] = useState("");
  const [manageOpen, setManageOpen] = useState(false);

  const sortedJours = useMemo(() => [...jours].sort((a, b) => b.date.localeCompare(a.date)), [jours]);
  const currentJour = jours.find((j) => j.id === jourId);
  const date = currentJour?.date || "";

  useEffect(() => {
    if (!jourId && sortedJours.length) {
      const today = todayISO();
      setJourId(sortedJours.find((j) => j.date === today)?.id || sortedJours[0].id);
    }
  }, [sortedJours, jourId]);

  const dayEntries = useMemo(() => presences.filter((p) => p.date === date), [presences, date]);
  const presentCount = dayEntries.filter((p) => p.present).length;

  const update = async (swimmerId, patch) => {
    const prev = getRow(presences, date, swimmerId);
    await upsertPresence({ date, swimmer_id: swimmerId, present: prev.present, ...patch });
    reload();
  };
  const togglePresent = (swimmerId) => {
    const p = getRow(presences, date, swimmerId);
    update(swimmerId, { present: !p.present });
  };
  const rpeDe = (swimmerId) => jourRpes.find((r) => r.jour_id === jourId && r.swimmer_id === swimmerId)?.rpe;

  return (
    <div className="view">
      <ViewHeader
        eyebrow="Appel du jour"
        title="Présences"
        action={<button className="btn-secondary" onClick={() => setManageOpen(true)}><Settings size={14} style={{ marginRight: 4 }} />Gérer les jours prévus</button>}
      />

      {jours.length === 0 ? (
        <EmptyState text="Aucun jour d'entraînement planifié. Cliquez « Gérer les jours prévus » pour en ajouter." />
      ) : (
        <>
          <div className="panel">
            <label>Jour d'entraînement</label>
            <select value={jourId} onChange={(e) => setJourId(e.target.value)} style={{ maxWidth: 420 }}>
              {sortedJours.map((j) => (
                <option key={j.id} value={j.id}>{j.date}{j.heure ? ` · ${j.heure}` : ""}{j.label ? ` — ${j.label}` : ""}{j.groupe ? ` (${j.groupe})` : ""}</option>
              ))}
            </select>
            <div className="session-meta" style={{ marginTop: 10 }}>
              <span className="strong">{presentCount}</span>/{swimmers.length} présents ce jour-là
            </div>
          </div>

          <div className="panel note">
            <Gauge size={15} />
            <span>Le RPE (ressenti d'effort) affiché ci-dessous est celui renseigné directement par chaque nageur/famille pour ce jour.</span>
          </div>

          {swimmers.length === 0 ? (
            <EmptyState text="Aucun nageur." />
          ) : (
            <div className="presence-grid">
              {swimmers.map((sw) => {
                const p = getRow(presences, date, sw.id);
                const rpe = rpeDe(sw.id);
                return (
                  <div key={sw.id} className={"presence-tile" + (p.present ? " present" : "")}>
                    <button className="presence-main" onClick={() => togglePresent(sw.id)}>
                      <span className="presence-check">{p.present ? "✓" : ""}</span>
                      <span className="presence-name">{sw.nom}</span>
                      <span className="pill pill-ghost">{sw.groupe}</span>
                    </button>
                    {!p.present && p.motif && (
                      <div className="rpe-row"><span className="forme-detail" style={{ fontStyle: "italic" }}>Absence signalée : « {p.motif} »</span></div>
                    )}
                    {p.present && rpe != null && (
                      <div className="rpe-row"><span className="rpe-label">RPE</span><span className="strong">{rpe}/10</span></div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {manageOpen && <ManageJoursModal jours={sortedJours} onClose={() => setManageOpen(false)} onChanged={reload} />}
    </div>
  );
}

function ManageJoursModal({ jours, onClose, onChanged }) {
  const [form, setForm] = useState({ date: todayISO(), groupe: "", label: "", heure: "" });
  const [bulkText, setBulkText] = useState("");
  const [bulkMsg, setBulkMsg] = useState("");

  const add = async () => {
    await createJour({ date: form.date, groupe: form.groupe || null, label: form.label || null, heure: form.heure || null });
    setForm({ date: todayISO(), groupe: "", label: "", heure: "" });
    onChanged();
  };
  const remove = async (id) => { await deleteJour(id); onChanged(); };

  const importBulk = async () => {
    setBulkMsg("");
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    const rows = [];
    const ignorees = [];
    lines.forEach((line, i) => {
      const parts = line.split(";").map((p) => p.trim());
      const [date, groupe, label, heure] = parts;
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { ignorees.push(i + 1); return; }
      rows.push({ date, groupe: groupe || null, label: label || null, heure: heure || null });
    });
    if (rows.length === 0) { setBulkMsg("Aucune ligne valide détectée."); return; }
    const { error } = await createJoursBulk(rows);
    if (error) { setBulkMsg("Erreur : " + error.message); return; }
    setBulkMsg(`${rows.length} jour(s) importé(s)${ignorees.length ? `, ligne(s) ${ignorees.join(", ")} ignorée(s)` : ""} ✓`);
    setBulkText("");
    onChanged();
  };

  return (
    <Modal title="Jours d'entraînement planifiés" onClose={onClose} wide>
      <p className="login-hint" style={{ marginTop: -4, marginBottom: 10 }}>Vous pouvez ajouter plusieurs entraînements à la même date (ex. matin / soir) — utilisez le label pour les différencier.</p>

      <div className="panel" style={{ margin: "0 0 14px" }}>
        <div className="panel-head"><h4><Upload size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />Import en masse</h4></div>
        <p className="login-hint" style={{ marginTop: -6, marginBottom: 10 }}>
          Une ligne par jour, séparée par des points-virgules : <code>Date (AAAA-MM-JJ);Groupe (optionnel);Label (optionnel);Heure (optionnel)</code><br />
          Exemple : <code>2026-09-02;Junior Bleu;Reprise;18h00-19h30</code> ou <code>2026-09-03;;;</code> pour tous les groupes sans label ni heure.
        </p>
        <textarea rows={5} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder={"2026-09-01;;;18h00-19h30\n2026-09-03;;;18h00-19h30\n2026-09-05;Junior Bleu;Matin;7h00-8h15"} />
        <button className="btn-primary" style={{ marginTop: 10 }} onClick={importBulk}>Importer ces lignes</button>
        {bulkMsg && <div className="login-hint" style={{ marginTop: 8 }}>{bulkMsg}</div>}
      </div>

      <div className="form-row">
        <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <select value={form.groupe} onChange={(e) => setForm({ ...form, groupe: e.target.value })}>
          <option value="">Tous les groupes</option>
          {GROUPES.map((g) => <option key={g}>{g}</option>)}
        </select>
        <input placeholder="Label (ex. Matin, Soir…)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        <input placeholder="Heure (ex. 18h00-19h30)" value={form.heure} onChange={(e) => setForm({ ...form, heure: e.target.value })} />
        <button className="btn-primary" onClick={add}><Plus size={14} /> Ajouter</button>
      </div>

      {jours.length === 0 ? <EmptyState text="Aucun jour planifié." /> : (
        <div className="table" style={{ marginTop: 12 }}>
          <div className="table-row jours-row table-head"><span>Date</span><span>Groupe</span><span>Label</span><span>Heure</span><span></span></div>
          {jours.map((j) => (
            <div className="table-row jours-row" key={j.id}>
              <span>{j.date}</span>
              <span>{j.groupe || "Tous"}</span>
              <span>{j.label || "—"}</span>
              <span>{j.heure || "—"}</span>
              <span><button className="icon-btn" onClick={() => remove(j.id)}><Trash2 size={15} /></button></span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
