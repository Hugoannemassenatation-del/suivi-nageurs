import React, { useMemo, useState } from "react";
import { Plus, Trash2, Gauge } from "lucide-react";
import { ViewHeader, EmptyState, Modal } from "../lib/ui";
import { METHODES_VMA, POURCENTAGES_VMA, RPE_ECHELLE, todayISO, formatSeconds, paceFor100 } from "../lib/format";
import { createVma, deleteVma } from "../lib/db";

export default function VmaAllures({ swimmers, vma, readOnly, reload }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ swimmer_id: "", date: todayISO(), valeur: "", methode: METHODES_VMA[0] });
  const [selSwimmer, setSelSwimmer] = useState("");

  const add = async () => {
    if (!form.swimmer_id || !Number(form.valeur)) return;
    await createVma({ ...form, valeur: Number(form.valeur) });
    setForm({ swimmer_id: "", date: todayISO(), valeur: "", methode: METHODES_VMA[0] });
    setOpen(false);
    reload();
  };
  const remove = async (id) => { await deleteVma(id); reload(); };

  const latestBySwimmer = useMemo(() => {
    const map = {};
    [...vma].sort((a, b) => a.date.localeCompare(b.date)).forEach((v) => { map[v.swimmer_id] = v; });
    return map;
  }, [vma]);

  const nameOf = (id) => swimmers.find((s) => s.id === id)?.nom || "—";
  const currentVma = selSwimmer ? latestBySwimmer[selSwimmer] : null;

  return (
    <div className="view">
      <ViewHeader
        eyebrow="Tests, allures d'entraînement et ressenti d'effort"
        title="VMA, Allures & RPE"
        action={!readOnly && <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Nouveau test</button>}
      />

      <div className="panel note">
        <Gauge size={15} />
        <span>La VMA (en m/min) sert de référence pour calculer les allures d'entraînement en % de VMA.</span>
      </div>

      <div className="panel">
        <div className="panel-head"><h4>C'est quoi le RPE ?</h4></div>
        <p className="rpe-intro">
          Le RPE (Rating of Perceived Exertion) est une note que le nageur donne lui-même juste après une séance,
          pour dire à quel point l'entraînement lui a paru dur. Le coach l'utilise pour adapter la charge d'entraînement.
        </p>
        <div className="table">
          <div className="table-row rpe-scale-row table-head"><span>Note</span><span>Ressenti</span></div>
          {RPE_ECHELLE.map((r) => (
            <div className="table-row rpe-scale-row" key={r.v}><span className="strong">{r.v}</span><span>{r.label}</span></div>
          ))}
        </div>
      </div>

      {swimmers.length === 0 ? (
        <EmptyState text="Aucun nageur." />
      ) : (
        <>
          <div className="panel">
            <div className="panel-head"><h4>Calculateur d'allures</h4></div>
            <label>Nageur</label>
            <select value={selSwimmer} onChange={(e) => setSelSwimmer(e.target.value)} style={{ maxWidth: 280 }}>
              <option value="">Sélectionner…</option>
              {swimmers.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>

            {selSwimmer && !currentVma && <div style={{ marginTop: 12 }}><EmptyState text="Aucun test VMA enregistré pour ce nageur." /></div>}
            {currentVma && (
              <>
                <div className="vma-summary">
                  Dernier test : <span className="strong">{currentVma.valeur} m/min</span> — {currentVma.methode} du {currentVma.date}
                </div>
                <div className="table" style={{ marginTop: 10 }}>
                  <div className="table-row allure-row table-head"><span>% VMA</span><span>Vitesse</span><span>Allure /100m</span><span>Allure /50m</span></div>
                  {POURCENTAGES_VMA.map((pct) => {
                    const sec100 = paceFor100(currentVma.valeur, pct);
                    return (
                      <div className="table-row allure-row" key={pct}>
                        <span className={pct === 100 ? "chrono-best" : ""}>{pct}%</span>
                        <span>{(currentVma.valeur * pct / 100).toFixed(0)} m/min</span>
                        <span>{formatSeconds(sec100)}</span>
                        <span>{formatSeconds(sec100 / 2)}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div className="table" style={{ marginTop: 16 }}>
            <div className="table-row table-head"><span>Nageur</span><span>VMA</span><span>Méthode</span><span>Date</span>{!readOnly && <span></span>}</div>
            {[...vma].sort((a, b) => b.date.localeCompare(a.date)).map((v) => (
              <div className="table-row" key={v.id}>
                <span className="strong">{nameOf(v.swimmer_id)}</span>
                <span>{v.valeur} m/min</span>
                <span>{v.methode}</span>
                <span>{v.date}</span>
                {!readOnly && <span><button className="icon-btn" onClick={() => remove(v.id)}><Trash2 size={15} /></button></span>}
              </div>
            ))}
          </div>
        </>
      )}

      {open && !readOnly && (
        <Modal title="Nouveau test VMA" onClose={() => setOpen(false)}>
          <label>Nageur</label>
          <select value={form.swimmer_id} onChange={(e) => setForm({ ...form, swimmer_id: e.target.value })}>
            <option value="">Sélectionner…</option>
            {swimmers.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
          <div className="form-grid-2">
            <div><label>VMA (m/min)</label><input type="number" value={form.valeur} onChange={(e) => setForm({ ...form, valeur: e.target.value })} placeholder="Ex. 62" /></div>
            <div><label>Date du test</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          </div>
          <label>Méthode</label>
          <select value={form.methode} onChange={(e) => setForm({ ...form, methode: e.target.value })}>
            {METHODES_VMA.map((m) => <option key={m}>{m}</option>)}
          </select>
          <button className="btn-primary full" onClick={add}>Enregistrer</button>
        </Modal>
      )}
    </div>
  );
}
