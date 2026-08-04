import React, { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import { ViewHeader, EmptyState, Modal } from "../lib/ui";
import { TYPES_EVENT, todayISO, daysAgo, monthLabel, addMonths, toISODate, buildMonthGrid, JOURS_FR, formatDateFR } from "../lib/format";
import {
  createEvent, deleteEvent, listCalendriers, createCalendrier, deleteCalendrier,
  listCalendrierMembres, setCalendrierMembres, listEventCalendriers, setEventCalendriers,
} from "../lib/db";

export default function Calendrier({ events, swimmers, readOnly, isStaff, reload }) {
  const [calendriers, setCalendriers] = useState([]);
  const [membres, setMembres] = useState([]);
  const [eventCalendriers, setEventCalendriersState] = useState([]);
  const [open, setOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [form, setForm] = useState({ type: TYPES_EVENT[0], nom: "", lieu: "", date_debut: todayISO(), date_fin: "", notes: "", calendrierIds: [] });

  const loadCalendriers = useCallback(async () => {
    const [{ data: cals }, { data: mem }, { data: ec }] = await Promise.all([listCalendriers(), listCalendrierMembres(), listEventCalendriers()]);
    setCalendriers(cals || []);
    setMembres(mem || []);
    setEventCalendriersState(ec || []);
  }, []);

  useEffect(() => { loadCalendriers(); }, [loadCalendriers]);

  const groupesDe = (event) => {
    const ids = eventCalendriers.filter((ec) => ec.event_id === event.id).map((ec) => ec.calendrier_id);
    const noms = ids.map((id) => calendriers.find((c) => c.id === id)?.nom).filter(Boolean);
    if (noms.length === 0 && event.calendrier_id) {
      const n = calendriers.find((c) => c.id === event.calendrier_id)?.nom;
      if (n) return [n];
    }
    return noms;
  };

  const add = async () => {
    if (!form.nom.trim() || form.calendrierIds.length === 0) return;
    const { data } = await createEvent({ type: form.type, nom: form.nom, lieu: form.lieu, date_debut: form.date_debut, date_fin: form.date_fin || null, notes: form.notes });
    if (data?.id) await setEventCalendriers(data.id, form.calendrierIds);
    setForm({ type: TYPES_EVENT[0], nom: "", lieu: "", date_debut: todayISO(), date_fin: "", notes: "", calendrierIds: [] });
    setOpen(false);
    reload();
    loadCalendriers();
  };
  const remove = async (id) => { await deleteEvent(id); reload(); loadCalendriers(); };
  const toggleFormCalendrier = (id) => setForm((f) => ({ ...f, calendrierIds: f.calendrierIds.includes(id) ? f.calendrierIds.filter((x) => x !== id) : [...f.calendrierIds, id] }));

  const sorted = [...events].sort((a, b) => a.date_debut.localeCompare(b.date_debut));
  const upcoming = sorted.filter((e) => daysAgo(e.date_debut) <= 0);
  const past = sorted.filter((e) => daysAgo(e.date_debut) > 0).reverse();

  const EventCard = ({ e }) => (
    <div className="session-item" key={e.id}>
      <div>
        <div className="session-card-top">
          <span className={"pill" + (e.type === "Stage" ? " pill-alt" : "")}>{e.type}</span>
          {groupesDe(e).map((n) => <span className="pill pill-ghost" key={n}>{n}</span>)}
          <span className="session-date">{formatDateFR(e.date_debut)}{e.date_fin ? ` → ${formatDateFR(e.date_fin)}` : ""}</span>
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
            <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Ajouter</button>
          </div>
        )}
      />

      {isStaff && calendriers.length === 0 && (
        <div className="panel note">Créez d'abord un calendrier (bouton "Gérer les calendriers") avant d'ajouter un événement.</div>
      )}

      <CalendarMonth events={events} onSelectDay={(iso, evts) => setSelectedDay({ iso, evts })} />

      <div className="panel-head" style={{ marginBottom: 8, marginTop: 20 }}><h4>À venir</h4></div>
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
          <label>Groupe(s) concerné(s)</label>
          {calendriers.length === 0 ? <EmptyState text="Créez d'abord un calendrier." /> : (
            <div className="presence-grid" style={{ marginBottom: 12 }}>
              {calendriers.map((c) => (
                <button key={c.id} className={"presence-tile" + (form.calendrierIds.includes(c.id) ? " present" : "")} style={{ padding: 0 }} onClick={() => toggleFormCalendrier(c.id)}>
                  <span className="presence-main">
                    <span className="presence-check">{form.calendrierIds.includes(c.id) ? "✓" : ""}</span>
                    <span className="presence-name">{c.nom}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
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

      {selectedDay && (
        <Modal title={formatDateFR(selectedDay.iso)} onClose={() => setSelectedDay(null)}>
          <div className="session-list">{selectedDay.evts.map((e) => <EventCard e={e} key={e.id} />)}</div>
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

function CalendarMonth({ events, onSelectDay }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const days = buildMonthGrid(cursor);
  const todayStr = todayISO();

  const eventsOnDay = (d) => {
    const iso = toISODate(d);
    return events.filter((e) => iso >= e.date_debut && iso <= (e.date_fin || e.date_debut));
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
          const dayEvents = eventsOnDay(d);
          return (
            <div
              key={i}
              className={"cal-cell" + (inMonth ? "" : " cal-cell-out") + (iso === todayStr ? " cal-cell-today" : "") + (dayEvents.length ? " cal-cell-clickable" : "")}
              onClick={() => dayEvents.length && onSelectDay(iso, dayEvents)}
            >
              <div className="cal-daynum">{d.getDate()}</div>
              {dayEvents.slice(0, 2).map((e) => (
                <div key={e.id} className={"cal-chip" + (e.type === "Stage" ? " cal-chip-alt" : "")}>{e.nom}</div>
              ))}
              {dayEvents.length > 2 && <div className="cal-chip-more">+{dayEvents.length - 2} autre{dayEvents.length - 2 > 1 ? "s" : ""}</div>}
            </div>
          );
        })}
      </div>
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
