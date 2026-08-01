import React, { useMemo, useState } from "react";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ViewHeader, EmptyState, Modal } from "../lib/ui";
import { EPREUVES, BASSINS, todayISO, formatSeconds, parseTimeToSeconds } from "../lib/format";
import { createPerformance, deletePerformance } from "../lib/db";

export default function Performances({ swimmers, performances, readOnly, reload }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ swimmer_id: "", date: todayISO(), epreuve: EPREUVES[0], bassin: "25m", temps: "" });
  const [selSwimmer, setSelSwimmer] = useState("");
  const [selEpreuve, setSelEpreuve] = useState(EPREUVES[0]);

  const add = async () => {
    const secs = parseTimeToSeconds(form.temps);
    if (!form.swimmer_id || secs == null) return;
    await createPerformance({ swimmer_id: form.swimmer_id, date: form.date, epreuve: form.epreuve, bassin: form.bassin, secondes: secs });
    setForm({ swimmer_id: "", date: todayISO(), epreuve: EPREUVES[0], bassin: "25m", temps: "" });
    setOpen(false);
    reload();
  };
  const remove = async (id) => { await deletePerformance(id); reload(); };

  const chartData = useMemo(() => {
    if (!selSwimmer) return [];
    return performances
      .filter((p) => p.swimmer_id === selSwimmer && p.epreuve === selEpreuve)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((p) => ({ date: p.date, temps: Number(Number(p.secondes).toFixed(2)) }));
  }, [performances, selSwimmer, selEpreuve]);

  const bestBySwimmer = useMemo(() => {
    const map = {};
    performances.forEach((p) => {
      const key = p.swimmer_id + "|" + p.epreuve + "|" + p.bassin;
      if (!map[key] || p.secondes < map[key].secondes) map[key] = p;
    });
    return map;
  }, [performances]);

  const nameOf = (id) => swimmers.find((s) => s.id === id)?.nom || "—";

  return (
    <div className="view">
      <ViewHeader
        eyebrow={`${performances.length} chrono${performances.length > 1 ? "s" : ""}`}
        title="Performances"
        action={!readOnly && <button className="btn-primary" onClick={() => setOpen(true)}><Plus size={16} /> Ajouter un chrono</button>}
      />
      {!readOnly && (
        <div className="panel note">
          <TrendingUp size={15} />
          <span>Pas d'API publique côté FFN Extranat : saisissez les temps manuellement, ou copiez-les depuis <a href="https://ffn.extranat.fr" target="_blank" rel="noreferrer">ffn.extranat.fr</a>.</span>
        </div>
      )}

      {swimmers.length === 0 ? <EmptyState text="Aucun nageur." /> : (
        <>
          <div className="panel">
            <div className="panel-head"><h4>Progression</h4></div>
            <div className="form-grid-2">
              <div>
                <label>Nageur</label>
                <select value={selSwimmer} onChange={(e) => setSelSwimmer(e.target.value)}>
                  <option value="">Sélectionner…</option>
                  {swimmers.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
                </select>
              </div>
              <div>
                <label>Épreuve</label>
                <select value={selEpreuve} onChange={(e) => setSelEpreuve(e.target.value)}>
                  {EPREUVES.map((ep) => <option key={ep}>{ep}</option>)}
                </select>
              </div>
            </div>
            {chartData.length > 1 ? (
              <div style={{ width: "100%", height: 220, marginTop: 12 }}>
                <ResponsiveContainer>
                  <LineChart data={chartData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--line-faint)" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--ink-soft)" }} reversed domain={["dataMin - 1", "dataMax + 1"]} tickFormatter={formatSeconds} />
                    <Tooltip formatter={(v) => formatSeconds(v)} contentStyle={{ borderRadius: 8, border: "1px solid var(--line-faint)", fontSize: 12 }} />
                    <Line type="monotone" dataKey="temps" stroke="var(--chrono)" strokeWidth={2.5} dot={{ r: 3.5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : <div style={{ marginTop: 8 }}><EmptyState text="Au moins 2 chronos sont nécessaires pour tracer une progression." /></div>}
          </div>

          <div className="table" style={{ marginTop: 16 }}>
            <div className="table-row table-head"><span>Nageur</span><span>Épreuve</span><span>Temps</span><span>Date</span><span>Bassin</span>{!readOnly && <span></span>}</div>
            {[...performances].sort((a, b) => b.date.localeCompare(a.date)).map((p) => {
              const key = p.swimmer_id + "|" + p.epreuve + "|" + p.bassin;
              const isBest = bestBySwimmer[key]?.id === p.id;
              return (
                <div className="table-row" key={p.id}>
                  <span className="strong">{nameOf(p.swimmer_id)}</span>
                  <span>{p.epreuve}</span>
                  <span className={isBest ? "chrono-best" : ""}>{formatSeconds(p.secondes)}{isBest && " ★"}</span>
                  <span>{p.date}</span>
                  <span>{p.bassin}</span>
                  {!readOnly && <span><button className="icon-btn" onClick={() => remove(p.id)}><Trash2 size={15} /></button></span>}
                </div>
              );
            })}
          </div>
        </>
      )}

      {open && !readOnly && (
        <Modal title="Ajouter un chrono" onClose={() => setOpen(false)}>
          <label>Nageur</label>
          <select value={form.swimmer_id} onChange={(e) => setForm({ ...form, swimmer_id: e.target.value })}>
            <option value="">Sélectionner…</option>
            {swimmers.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
          <div className="form-grid-2">
            <div>
              <label>Épreuve</label>
              <select value={form.epreuve} onChange={(e) => setForm({ ...form, epreuve: e.target.value })}>
                {EPREUVES.map((ep) => <option key={ep}>{ep}</option>)}
              </select>
            </div>
            <div>
              <label>Bassin</label>
              <select value={form.bassin} onChange={(e) => setForm({ ...form, bassin: e.target.value })}>
                {BASSINS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid-2">
            <div><label>Temps (mm:ss.cc)</label><input value={form.temps} onChange={(e) => setForm({ ...form, temps: e.target.value })} placeholder="Ex. 1:02.35" /></div>
            <div><label>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          </div>
          <button className="btn-primary full" onClick={add}>Enregistrer</button>
        </Modal>
      )}
    </div>
  );
}
