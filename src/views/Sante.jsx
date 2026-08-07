import React, { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, ArrowLeft, HeartPulse } from "lucide-react";
import { ViewHeader, EmptyState, Modal } from "../lib/ui";
import { formatDateFR, todayISO } from "../lib/format";
import { listSante, createSanteEntry, deleteSanteEntry } from "../lib/db";

const STATUTS = [
  { v: "apte", label: "Apte", color: "#1E8A5F" },
  { v: "apte_partiel", label: "Apte partiel", color: "#C98A1E" },
  { v: "arret", label: "Arrêt", color: "#D64545" },
];
const statutInfo = (v) => STATUTS.find((s) => s.v === v) || STATUTS[0];

export default function Sante({ swimmers, isStaff, mySwimmerId, mySession }) {
  const [entries, setEntries] = useState([]);
  const [selectedId, setSelectedId] = useState(isStaff ? null : mySwimmerId);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: todayISO(), statut: "apte", description: "" });

  const load = useCallback(async () => {
    const { data } = await listSante();
    setEntries(data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  const entriesDe = (swimmerId) => entries.filter((e) => e.swimmer_id === swimmerId).sort((a, b) => b.date.localeCompare(a.date));
  const dernierStatut = (swimmerId) => entriesDe(swimmerId)[0]?.statut;

  const add = async () => {
    if (!selectedId) return;
    await createSanteEntry({ swimmer_id: selectedId, date: form.date, statut: form.statut, description: form.description || null });
    setForm({ date: todayISO(), statut: "apte", description: "" });
    setOpen(false);
    load();
  };
  const remove = async (id) => { await deleteSanteEntry(id); load(); };
  const peutSupprimer = (e) => isStaff || e.created_by === mySession?.user?.id;

  if (!isStaff) {
    if (!mySwimmerId) return <div className="view"><EmptyState text="Aucun nageur associé à ce compte." /></div>;
    return (
      <div className="view">
        <ViewHeader eyebrow="Suivi santé" title="Santé" action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Ajouter une entrée</button>} />
        <HealthLog entries={entriesDe(mySwimmerId)} onRemove={remove} peutSupprimer={peutSupprimer} />
        {open && <EntryModal form={form} setForm={setForm} onSave={add} onClose={() => setOpen(false)} />}
      </div>
    );
  }

  if (selectedId) {
    const swimmer = swimmers.find((s) => s.id === selectedId);
    return (
      <div className="view">
        <button className="link-btn" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }} onClick={() => setSelectedId(null)}>
          <ArrowLeft size={15} /> Retour à tous les nageurs
        </button>
        <ViewHeader eyebrow="Suivi santé" title={swimmer?.nom || "Nageur"} action={<button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Ajouter une entrée</button>} />
        <HealthLog entries={entriesDe(selectedId)} onRemove={remove} peutSupprimer={peutSupprimer} />
        {open && <EntryModal form={form} setForm={setForm} onSave={add} onClose={() => setOpen(false)} />}
      </div>
    );
  }

  return (
    <div className="view">
      <ViewHeader eyebrow="Suivi santé" title="Santé" />
      {swimmers.length === 0 ? <EmptyState text="Aucun nageur." /> : (
        <div className="presence-grid">
          {swimmers.map((s) => {
            const statut = dernierStatut(s.id);
            const info = statut ? statutInfo(statut) : null;
            return (
              <button key={s.id} className="presence-tile" style={{ padding: 0 }} onClick={() => setSelectedId(s.id)}>
                <span className="presence-main">
                  <HeartPulse size={16} color={info?.color || "var(--ink-soft)"} />
                  <span className="presence-name">{s.nom}</span>
                  <span className="pill pill-ghost" style={info ? { color: info.color, borderColor: info.color } : {}}>{info?.label || "Aucune entrée"}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function HealthLog({ entries, onRemove, peutSupprimer }) {
  if (entries.length === 0) return <EmptyState text="Aucune entrée de santé enregistrée." />;
  return (
    <div className="session-list">
      {entries.map((e) => {
        const info = statutInfo(e.statut);
        return (
          <div className="session-item" key={e.id}>
            <div>
              <div className="session-card-top">
                <span className="pill" style={{ background: info.color }}>{info.label}</span>
                <span className="session-date">{formatDateFR(e.date)}</span>
              </div>
              {e.description && <div className="session-content">{e.description}</div>}
            </div>
            {peutSupprimer(e) && <div className="session-item-actions"><button className="icon-btn" onClick={() => onRemove(e.id)}><Trash2 size={15} /></button></div>}
          </div>
        );
      })}
    </div>
  );
}

function EntryModal({ form, setForm, onSave, onClose }) {
  return (
    <Modal title="Ajouter une entrée santé" onClose={onClose}>
      <div className="form-grid-2">
        <div><label>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div>
          <label>Statut</label>
          <select value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
            {STATUTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
        </div>
      </div>
      <label>Description (optionnel)</label>
      <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex. Douleur à l'épaule droite depuis la séance de mardi, kiné prévu jeudi." />
      <button className="btn-primary full" onClick={onSave}>Enregistrer</button>
    </Modal>
  );
}
