import React, { useEffect, useMemo, useState } from "react";
import { Gauge, Plus, Trash2, Settings, Upload, Pencil, ChevronLeft, ChevronRight, MailWarning } from "lucide-react";
import { ViewHeader, EmptyState, Modal } from "../lib/ui";
import { GROUPES, todayISO, formatDateFR, monthLabel, addMonths, toISODate, buildMonthGrid, JOURS_FR } from "../lib/format";
import { upsertPresence, createJour, createJoursBulk, updateJour, deleteJour, sendNotification } from "../lib/db";

function getRow(presences, date, swimmerId) {
  return presences.find((p) => p.date === date && p.swimmer_id === swimmerId) || { present: false, rpe: null };
}

export default function Presences({ swimmers, presences, jours, jourRpes, staffName, reload }) {
  const [jourId, setJourId] = useState("");
  const [manageOpen, setManageOpen] = useState(false);
  const [notifiedIds, setNotifiedIds] = useState([]);

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

  const notifyAbsence = async (swimmerId) => {
    if (!currentJour) return;
    await sendNotification({ type: "absence_notice", swimmerId, auteur: staffName, jourInfo: formatDateFR(currentJour.date) });
    setNotifiedIds((ids) => [...ids, jourId + "|" + swimmerId]);
  };

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
          <PresenceMonthCalendar jours={sortedJours} selectedJourId={jourId} onSelectJour={setJourId} />

          {currentJour && (
            <div className="panel">
              <div className="session-meta">
                <span className="strong">{formatDateFR(currentJour.date)}</span>
                {currentJour.heure && <><span>·</span><span>{currentJour.heure}</span></>}
                {currentJour.label && <><span>·</span><span>{currentJour.label}</span></>}
                {currentJour.groupe && <><span>·</span><span className="pill pill-ghost">{currentJour.groupe}</span></>}
              </div>
              <div className="session-meta" style={{ marginTop: 8 }}>
                <span className="strong">{presentCount}</span>/{swimmers.length} présents ce jour-là
              </div>
            </div>
          )}

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
                    {!p.present && !p.motif && (
                      <div className="rpe-row">
                        {notifiedIds.includes(jourId + "|" + sw.id) ? (
                          <span className="forme-detail" style={{ color: "#1E8A5F" }}>Famille prévenue ✓</span>
                        ) : (
                          <button className="btn-secondary" style={{ fontSize: 12, padding: "4px 8px" }} onClick={() => notifyAbsence(sw.id)}>
                            <MailWarning size={13} style={{ marginRight: 4, verticalAlign: "middle" }} />Absence non prévenue — notifier la famille
                          </button>
                        )}
                      </div>
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

function PresenceMonthCalendar({ jours, selectedJourId, onSelectJour }) {
  const selected = jours.find((j) => j.id === selectedJourId);
  const [cursor, setCursor] = useState(() => {
    const base = selected ? new Date(selected.date + "T00:00:00") : new Date();
    base.setDate(1);
    return base;
  });
  const days = buildMonthGrid(cursor);
  const todayStr = todayISO();

  const joursOnDay = (d) => {
    const iso = toISODate(d);
    return jours.filter((j) => j.date === iso);
  };

  return (
    <div className="panel">
      <div className="cal-nav">
        <button className="icon-btn" onClick={() => setCursor(addMonths(cursor, -1))}><ChevronLeft size={18} /></button>
        <div className="cal-month-label">{monthLabel(cursor)}</div>
        <button className="icon-btn" onClick={() => setCursor(addMonths(cursor, 1))}><ChevronRight size={18} /></button>
        <button className="btn-secondary" style={{ marginLeft: "auto" }} onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }}>Aujourd'hui</button>
      </div>
      <div className="cal-weekdays">
        {JOURS_FR.map((w) => <div key={w}>{w}</div>)}
      </div>
      <div className="cal-grid">
        {days.map((d, i) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const iso = toISODate(d);
          const dayJours = joursOnDay(d);
          return (
            <div key={i} className={"cal-cell" + (inMonth ? "" : " cal-cell-out") + (iso === todayStr ? " cal-cell-today" : "")}>
              <div className="cal-daynum">{d.getDate()}</div>
              {dayJours.map((j) => (
                <button
                  key={j.id}
                  className={"cal-chip cal-chip-btn" + (j.id === selectedJourId ? " cal-chip-selected" : "")}
                  onClick={() => onSelectJour(j.id)}
                  title={[j.heure, j.label, j.groupe].filter(Boolean).join(" · ")}
                >
                  {j.heure || j.label || "Entraînement"}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ManageJoursModal({ jours, onClose, onChanged }) {
  const [form, setForm] = useState({ date: todayISO(), groupe: "", label: "", heure: "" });
  const [bulkText, setBulkText] = useState("");
  const [bulkMsg, setBulkMsg] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ date: "", groupe: "", label: "", heure: "" });

  const add = async () => {
    await createJour({ date: form.date, groupe: form.groupe || null, label: form.label || null, heure: form.heure || null });
    setForm({ date: todayISO(), groupe: "", label: "", heure: "" });
    onChanged();
  };
  const remove = async (id) => { await deleteJour(id); onChanged(); };

  const startEdit = (j) => { setEditingId(j.id); setEditForm({ date: j.date, groupe: j.groupe || "", label: j.label || "", heure: j.heure || "" }); };
  const saveEdit = async () => {
    await updateJour(editingId, { date: editForm.date, groupe: editForm.groupe || null, label: editForm.label || null, heure: editForm.heure || null });
    setEditingId(null);
    onChanged();
  };

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
          <div className="table-row jours-row-edit table-head"><span>Date</span><span>Groupe</span><span>Label</span><span>Heure</span><span></span></div>
          {jours.map((j) => (
            editingId === j.id ? (
              <div className="table-row jours-row-edit" key={j.id} style={{ background: "var(--foam)" }}>
                <input type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
                <select value={editForm.groupe} onChange={(e) => setEditForm({ ...editForm, groupe: e.target.value })}>
                  <option value="">Tous</option>
                  {GROUPES.map((g) => <option key={g}>{g}</option>)}
                </select>
                <input placeholder="Label" value={editForm.label} onChange={(e) => setEditForm({ ...editForm, label: e.target.value })} />
                <input placeholder="Heure" value={editForm.heure} onChange={(e) => setEditForm({ ...editForm, heure: e.target.value })} />
                <span className="table-actions">
                  <button className="btn-primary" onClick={saveEdit}>OK</button>
                  <button className="icon-btn" onClick={() => setEditingId(null)}>✕</button>
                </span>
              </div>
            ) : (
              <div className="table-row jours-row-edit" key={j.id}>
                <span>{formatDateFR(j.date)}</span>
                <span>{j.groupe || "Tous"}</span>
                <span>{j.label || "—"}</span>
                <span>{j.heure || "—"}</span>
                <span className="table-actions">
                  <button className="icon-btn" onClick={() => startEdit(j)}><Pencil size={15} /></button>
                  <button className="icon-btn" onClick={() => remove(j.id)}><Trash2 size={15} /></button>
                </span>
              </div>
            )
          ))}
        </div>
      )}
    </Modal>
  );
}
