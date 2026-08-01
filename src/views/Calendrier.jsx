import React, { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Settings } from "lucide-react";
import { ViewHeader, EmptyState, Modal } from "../lib/ui";
import { TYPES_EVENT, todayISO, daysAgo } from "../lib/format";
import {
  createEvent, deleteEvent, listCalendriers, createCalendrier, deleteCalendrier,
  listCalendrierMembres, setCalendrierMembres,
} from "../lib/db";

export default function Calendrier({ events, swimmers, readOnly, isStaff, reload }) {
  const [calendriers, setCalendriers] = useState([]);
  const [membres, setMembres] = useState([]);
  const [open, setOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [form, setForm] = useState({ type: TYPES_EVENT[0], nom: "", lieu: "", date_debut: todayISO(), date_fin: "", notes: "", calendrier_id: "" });

  const loadCalendriers = useCallback(async () => {
    const [{ data: cals }, { data: mem }] = await Promise.all([listCalendriers(), listCalendrierMembres()]);
    setCalendriers(cals || []);
    setMembres(mem || []);
  }, []);

  useEffect(() => { loadCalendriers(); }, [loadCalendriers]);

  const nomCalendrier = (id) => calendriers.find((c) => c.id === id)?.nom || "—";

  const add = async () => {
    if (!form.nom.trim() || !form.calendrier_id) return;
    await createEvent({ ...form, date_fin: form.date_fin || null });
    setForm({ type: TYPES_EVENT[0], nom: "", lieu: "", date_debut: todayISO(), date_fin: "", notes: "", calendrier_id: calendriers[0]?.id || "" });
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
          <span className="pill pill-ghost">{nomCalendrier(e.calendrier_id)}</span>
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
        action={!readOnly && (
          <div style={{ display: "flex", gap: 8 }}>
            {isStaff && <button className="btn-secondary" onClick={() => setManageOpen(true)}><Settings size={14} style={{ marginRight: 4 }} />Gérer les calendriers</button>}
            <button className="btn-primary" onClick={() => { setForm({ ...form, calendrier_id: calendriers[0]?.id || "" }); setOpen(true); }}><Plus size={16} /> Ajouter</button>
          </div>
        )}
      />

      {isStaff && calendriers.length === 0 && (
        <div className="panel note">Créez d'abord un calendrier (bouton "Gérer les calendriers") avant d'ajouter un événement.</div>
      )}

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
          <label>Calendrier concerné</label>
          <select value={form.calendrier_id} onChange={(e) => setForm({ ...form, calendrier_id: e.target.value })}>
            <option value="">Sélectionner…</option>
            {calendriers.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
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

      {manageOpen && (
        <ManageCalendriers
          calendriers={calendriers}
          membres={membres}
          swimmers={swimmers}
          onClose={() => setManageOpen(false)}
          onChanged={loadCalendriers}
        />
      )}
    </div>
  );
}

function ManageCalendriers({ calendriers, membres, swimmers, onClose, onChanged }) {
  const [nouveauNom, setNouveauNom] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [selection, setSelection] = useState([]);

  const membresDe = useCallback((calId) => membres.filter((m) => m.calendrier_id === calId).map((m) => m.swimmer_id), [membres]);

  const create = async () => {
    if (!nouveauNom.trim()) return;
    await createCalendrier(nouveauNom.trim());
    setNouveauNom("");
    onChanged();
  };
  const remove = async (id) => { await deleteCalendrier(id); onChanged(); };

  const startEdit = (cal) => { setEditingId(cal.id); setSelection(membresDe(cal.id)); };
  const toggleSwimmer = (id) => setSelection((sel) => sel.includes(id) ? sel.filter((s) => s !== id) : [...sel, id]);
  const saveMembres = async () => {
    await setCalendrierMembres(editingId, selection);
    setEditingId(null);
    onChanged();
  };

  return (
    <Modal title="Gérer les calendriers" onClose={onClose} wide>
      <div className="form-row">
        <input placeholder="Nom du nouveau calendrier (ex. Groupe Élite)" value={nouveauNom} onChange={(e) => setNouveauNom(e.target.value)} />
        <button className="btn-primary" onClick={create}><Plus size={14} /> Créer</button>
      </div>

      {calendriers.length === 0 ? <EmptyState text="Aucun calendrier créé." /> : (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          {calendriers.map((cal) => (
            <div key={cal.id} className="panel" style={{ margin: 0 }}>
              <div className="panel-head">
                <h4>{cal.nom} <span className="fiche-detail">({membresDe(cal.id).length} nageur{membresDe(cal.id).length > 1 ? "s" : ""})</span></h4>
                <span className="table-actions">
                  {editingId !== cal.id && <button className="btn-secondary" onClick={() => startEdit(cal)}>Modifier les nageurs</button>}
                  <button className="icon-btn" onClick={() => remove(cal.id)}><Trash2 size={15} /></button>
                </span>
              </div>
              {editingId === cal.id && (
                <>
                  <div className="presence-grid" style={{ marginBottom: 10 }}>
                    {swimmers.map((s) => (
                      <button key={s.id} className={"presence-tile" + (selection.includes(s.id) ? " present" : "")} onClick={() => toggleSwimmer(s.id)} style={{ padding: 0 }}>
                        <span className="presence-main">
                          <span className="presence-check">{selection.includes(s.id) ? "✓" : ""}</span>
                          <span className="presence-name">{s.nom}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <button className="btn-primary" onClick={saveMembres}>Enregistrer les nageurs concernés</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
