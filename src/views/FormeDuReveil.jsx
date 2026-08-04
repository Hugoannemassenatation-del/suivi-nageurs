import React, { useMemo, useState } from "react";
import { Trash2, Sunrise } from "lucide-react";
import { ViewHeader, EmptyState } from "../lib/ui";
import { FORME_ITEMS, todayISO, formeScore, formeColor, formatDateFR } from "../lib/format";
import { createWellness, deleteWellness } from "../lib/db";

export default function FormeDuReveil({ swimmers, wellness, canOpenFiche, onOpenFiche, defaultSwimmerId, reload }) {
  const todayStr = todayISO();
  const [form, setForm] = useState({ swimmer_id: defaultSwimmerId || "", date: todayStr, sommeil: 0, energie: 0, courbatures: 0, motivation: 0, cycle: "", note: "" });
  const [selSwimmer, setSelSwimmer] = useState("");

  const selectedSwimmer = swimmers.find((s) => s.id === form.swimmer_id);
  const showCycle = selectedSwimmer?.sexe === "F";

  const submit = async () => {
    if (!form.swimmer_id) return;
    if (FORME_ITEMS.some((it) => !form[it.key])) return;
    await createWellness({ ...form, cycle: showCycle ? (form.cycle || null) : null });
    setForm({ swimmer_id: defaultSwimmerId || "", date: todayStr, sommeil: 0, energie: 0, courbatures: 0, motivation: 0, cycle: "", note: "" });
    reload();
  };
  const remove = async (id) => { await deleteWellness(id); reload(); };

  const todayEntries = useMemo(() => {
    const map = {};
    wellness.filter((f) => f.date === todayStr).forEach((f) => {
      if (!map[f.swimmer_id] || f.id > map[f.swimmer_id].id) map[f.swimmer_id] = f;
    });
    return map;
  }, [wellness, todayStr]);

  const history = useMemo(() => {
    if (!selSwimmer) return [];
    return wellness.filter((f) => f.swimmer_id === selSwimmer).sort((a, b) => b.date.localeCompare(a.date));
  }, [wellness, selSwimmer]);

  return (
    <div className="view">
      <ViewHeader eyebrow="Auto-évaluation quotidienne" title="Forme du matin" />
      <div className="panel note">
        <Sunrise size={15} />
        <span>À remplir au réveil, avant l'entraînement. Ça prend 15 secondes et ça aide le coach à adapter la séance si besoin.</span>
      </div>

      {swimmers.length === 0 ? <EmptyState text="Aucun nageur." /> : (
        <>
          <div className="panel">
            <div className="panel-head"><h4>Faire mon check du jour</h4></div>
            <label>Nageur</label>
            <select value={form.swimmer_id} onChange={(e) => setForm({ ...form, swimmer_id: e.target.value })} style={{ maxWidth: 280 }}>
              <option value="">Sélectionner…</option>
              {swimmers.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
            <div className="forme-grid">
              {FORME_ITEMS.map((it) => (
                <div key={it.key}>
                  <label>{it.label}</label>
                  <select value={form[it.key]} onChange={(e) => setForm({ ...form, [it.key]: Number(e.target.value) })}>
                    <option value={0}>—</option>
                    {it.echelle.map((lab, i) => <option key={i} value={i + 1}>{i + 1} · {lab}</option>)}
                  </select>
                </div>
              ))}
            </div>
            {showCycle && (
              <div style={{ marginTop: 4 }}>
                <label>As-tu tes règles aujourd'hui ?</label>
                <select value={form.cycle} onChange={(e) => setForm({ ...form, cycle: e.target.value })}>
                  <option value="">—</option>
                  <option value="oui">Oui</option>
                  <option value="non">Non</option>
                  <option value="nsp">Je ne souhaite pas répondre</option>
                </select>
              </div>
            )}
            <label>Remarque (optionnel)</label>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Ex. Petit rhume, léger mal à l'épaule…" />
            <button className="btn-primary full" onClick={submit}>Enregistrer mon check du jour</button>
          </div>

          <div className="panel">
            <div className="panel-head"><h4>Aujourd'hui — le groupe</h4></div>
            <div className="forme-today-grid">
              {swimmers.map((s) => {
                const e = todayEntries[s.id];
                const score = e ? formeScore(e) : null;
                const Tag = canOpenFiche ? "button" : "div";
                return (
                  <Tag key={s.id} className={"forme-today-tile" + (canOpenFiche ? " forme-today-clickable" : "")}
                    style={{ borderColor: score != null ? formeColor(score) : undefined }}
                    onClick={canOpenFiche ? () => onOpenFiche(s.id) : undefined}>
                    <span className="forme-today-name">
                      {s.nom}
                      {e?.note && <span className="forme-note-dot" title="Remarque laissée">●</span>}
                    </span>
                    {score != null ? <span className="forme-today-score" style={{ color: formeColor(score) }}>{score.toFixed(1)}/5</span>
                      : <span className="forme-today-score forme-pending">à faire</span>}
                  </Tag>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <div className="panel-head"><h4>Historique</h4></div>
            <select value={selSwimmer} onChange={(e) => setSelSwimmer(e.target.value)} style={{ maxWidth: 280, marginBottom: 12 }}>
              <option value="">Sélectionner un nageur…</option>
              {swimmers.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
            {selSwimmer && (history.length === 0 ? <EmptyState text="Aucun check enregistré pour ce nageur." /> : (
              <div className="table">
                <div className="table-row forme-row table-head"><span>Date</span><span>Score</span><span>Détail</span><span></span></div>
                {history.map((f) => {
                  const score = formeScore(f);
                  return (
                    <div className="table-row forme-row" key={f.id}>
                      <span>{formatDateFR(f.date)}</span>
                      <span style={{ color: formeColor(score), fontWeight: 600 }}>{score?.toFixed(1)}/5</span>
                      <span className="forme-detail">
                        {FORME_ITEMS.map((it) => `${it.label.split(" ")[0]} ${f[it.key]}`).join(" · ")}
                        {f.cycle && ` · Règles: ${f.cycle === "oui" ? "oui" : f.cycle === "non" ? "non" : "NSP"}`}
                        {f.note && ` — ${f.note}`}
                      </span>
                      <span><button className="icon-btn" onClick={() => remove(f.id)}><Trash2 size={15} /></button></span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
