import React, { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { ViewHeader, EmptyState, Modal } from "../lib/ui";
import { TYPES_EVENT, todayISO, daysAgo } from "../lib/format";
import { createEvent, deleteEvent } from "../lib/db";

export default function Calendrier({ events, readOnly, reload }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: TYPES_EVENT[0], nom: "", lieu: "", date_debut: todayISO(), date_fin: "", notes: "" });

  const add = async () => {
    if (!form.nom.trim()) return;
    await createEvent({ ...form, date_fin: form.date_fin || null });
    setForm({ type: TYPES_EVENT[0], nom: "", lieu: "", date_debut: todayISO(), date_fin: "", notes: "" });
    setOpen(false);
    reload();
  };
  const remove = async (id) => { await deleteEvent(id); reload(); };

  const sorted = [...events].sort((a, b) => a.date_debut.localeCompare(b.date_debut));
  const upcoming = sorted.filter((e) => daysAgo(e.date_debut) <= 0);
  const past = sorted.filter((e) => daysAgo(e.date_debut) > 0).reverse();

  const EventCard = ({ e }) => (
    <div className="session-item" key={e.id}>
      <div>
        <div className="session-card-top">
          <span className={"pill" + (e.type === "Stage" ? " pill-alt" : "")}>{e.type}</span>
          <span className="session-date">{e.date_debut}{e.date_fin ? ` → ${e.date_fin}` : ""}</span>
        </div>
        <div className="session-title">{e.nom}</div>
        {e.lieu && <div className="session-vol">{e.lieu}</div>}
        {e.notes && <div className="session-content">{e.notes}</div>}
      </div>
      {!readOnly && <div className="session-item-actions"><button className="icon-btn" onClick={() => remove(e.id)}><Trash2 size={15} /></button></div>}
    </div>
  );

  return (
    <div className="view">
      <ViewHeader
        eyebrow={`${events.length} événement${events.length > 1 ? "s" : ""}`}
        title="Calendrier"
        action={!readOnly && <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Ajouter</button>}
      />
      <div className="panel-head" style={{ marginBottom: 8 }}><h4>À venir</h4></div>
      {upcoming.length === 0 ? <EmptyState text="Aucun événement à venir." /> : (
        <div className="session-list" style={{ marginBottom: 20 }}>{upcoming.map((e) => <EventCard e={e} key={e.id} />)}</div>
      )}
      {past.length > 0 && (
        <>
          <div className="panel-head" style={{ marginBottom: 8 }}><h4>Passés</h4></div>
          <div className="session-list">{past.map((e) => <EventCard e={e} key={e.id} />)}</div>
        </>
      )}
      {open && !readOnly && (
        <Modal title="Ajouter un événement" onClose={() => setOpen(false)}>
          <label>Type</label>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES_EVENT.map((t) => <option key={t}>{t}</option>)}
          </select>
          <label>Nom</label>
          <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Ex. Meeting régional / Stage de Pâques" />
          <label>Lieu</label>
          <input value={form.lieu} onChange={(e) => setForm({ ...form, lieu: e.target.value })} placeholder="Ex. Annemasse" />
          <div className="form-grid-2">
            <div><label>Date de début</label><input type="date" value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })} /></div>
            <div><label>Date de fin (optionnel)</label><input type="date" value={form.date_fin} onChange={(e) => setForm({ ...form, date_fin: e.target.value })} /></div>
          </div>
          <label>Notes</label>
          <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Ex. Convocation 1h avant, prévoir 2 maillots" />
          <button className="btn-primary full" onClick={add}>Enregistrer</button>
        </Modal>
      )}
    </div>
  );
}
