import React, { useMemo, useState } from "react";
import { Plus, Trash2, TrendingUp, ClipboardEdit, ArrowLeft, Upload } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ViewHeader, EmptyState, Modal } from "../lib/ui";
import { EPREUVES, BASSINS, todayISO, formatSeconds, parseTimeToSeconds, isOlderYear, normalizeEpreuve } from "../lib/format";
import { createPerformance, updatePerformance, deletePerformance, createPerformanceSplit, deletePerformanceSplit, createPerformancesBulk } from "../lib/db";

const epreuveIndex = (epreuve) => {
  const i = EPREUVES.indexOf(normalizeEpreuve(epreuve));
  return i === -1 ? 999 : i;
};

export default function Performances({ swimmers, performances, splits, readOnly, reload }) {
  const [open, setOpen] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [ficheSwimmerId, setFicheSwimmerId] = useState(null);
  const [form, setForm] = useState({ swimmer_id: "", date: todayISO(), epreuve: EPREUVES[0], bassin: "25m", temps: "" });
  const [selSwimmer, setSelSwimmer] = useState("");
  const [selEpreuve, setSelEpreuve] = useState(EPREUVES[0]);
  const [selBassin, setSelBassin] = useState("25m");
  const [bulkText, setBulkText] = useState("");
  const [bulkMsg, setBulkMsg] = useState("");

  const importBulk = async () => {
    setBulkMsg("");
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    const rows = [];
    const ignorees = [];
    lines.forEach((line, i) => {
      const parts = line.split(";").map((p) => p.trim());
      const [nomNageur, epreuve, bassin, date, tempsStr] = parts;
      const swimmer = swimmers.find((s) => s.nom.toLowerCase() === (nomNageur || "").toLowerCase());
      const epreuveNorm = normalizeEpreuve(epreuve);
      const secs = tempsStr ? parseTimeToSeconds(tempsStr) : null;
      if (!swimmer || !epreuveNorm || !bassin || !date || secs == null) { ignorees.push(i + 1); return; }
      rows.push({ swimmer_id: swimmer.id, epreuve: epreuveNorm, bassin, date, secondes: secs });
    });
    if (rows.length === 0) { setBulkMsg("Aucune ligne valide détectée. Vérifiez l'orthographe exacte des noms de nageurs."); return; }
    const { error } = await createPerformancesBulk(rows);
    if (error) { setBulkMsg("Erreur : " + error.message); return; }
    setBulkMsg(`${rows.length} chrono(s) importé(s)${ignorees.length ? `, ligne(s) ${ignorees.join(", ")} ignorée(s) (format incorrect ou nageur introuvable)` : ""} ✓`);
    setBulkText("");
    reload();
  };

  const add = async () => {
    const secs = parseTimeToSeconds(form.temps);
    if (!form.swimmer_id || secs == null) return;
    const { data } = await createPerformance({ swimmer_id: form.swimmer_id, date: form.date, epreuve: normalizeEpreuve(form.epreuve), bassin: form.bassin, secondes: secs });
    setForm({ swimmer_id: "", date: todayISO(), epreuve: EPREUVES[0], bassin: "25m", temps: "" });
    setOpen(false);
    await reload();
    if (data?.id) setDetailId(data.id);
  };
  const remove = async (id) => { await deletePerformance(id); reload(); };

  const chartData = useMemo(() => {
    if (!selSwimmer) return [];
    return performances
      .filter((p) => p.swimmer_id === selSwimmer && normalizeEpreuve(p.epreuve) === selEpreuve && p.bassin === selBassin)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((p) => ({ date: p.date, temps: Number(Number(p.secondes).toFixed(2)) }));
  }, [performances, selSwimmer, selEpreuve, selBassin]);

  const bestBySwimmer = useMemo(() => {
    const map = {};
    performances.forEach((p) => {
      const key = p.swimmer_id + "|" + normalizeEpreuve(p.epreuve) + "|" + p.bassin;
      if (!map[key] || p.secondes < map[key].secondes) map[key] = p;
    });
    return map;
  }, [performances]);

  const nameOf = (id) => swimmers.find((s) => s.id === id)?.nom || "—";

  const epreuvesPourBassin = (bassin) => EPREUVES.filter((ep) => !(bassin === "50m" && ep === "100 4N"));

  if (ficheSwimmerId) {
    return (
      <SwimmerFiche
        swimmer={swimmers.find((s) => s.id === ficheSwimmerId)}
        performances={performances.filter((p) => p.swimmer_id === ficheSwimmerId)}
        bestBySwimmer={bestBySwimmer}
        onBack={() => setFicheSwimmerId(null)}
        onOpenDetail={setDetailId}
        onRemove={remove}
        readOnly={readOnly}
      />
    );
  }

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
            <div className="panel-head"><h4>Fiches nageurs</h4></div>
            <div className="presence-grid">
              {swimmers.map((s) => (
                <button key={s.id} className="presence-tile" style={{ padding: 0 }} onClick={() => setFicheSwimmerId(s.id)}>
                  <span className="presence-main">
                    <span className="presence-name">{s.nom}</span>
                    <span className="pill pill-ghost">{performances.filter((p) => p.swimmer_id === s.id).length} chrono{performances.filter((p) => p.swimmer_id === s.id).length > 1 ? "s" : ""}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          {!readOnly && (
            <div className="panel">
              <div className="panel-head"><h4><Upload size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />Import en masse</h4></div>
              <p className="login-hint" style={{ marginTop: -6, marginBottom: 10 }}>
                Une ligne par chrono, séparée par des points-virgules :<br />
                <code>Nageur;Épreuve;Bassin;Date;Temps</code><br />
                Exemple : <code>Camille Dubois;100 NL;25m;2026-08-03;1:05.30</code><br />
                Le nom du nageur doit correspondre exactement à celui enregistré dans l'onglet Nageurs. La date au format AAAA-MM-JJ.
              </p>
              <textarea rows={6} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder={"Camille Dubois;100 NL;25m;2026-08-03;1:05.30\nHugo Lardeux;50 Dos;50m;2026-08-03;0:33.05"} />
              <button className="btn-primary" style={{ marginTop: 10 }} onClick={importBulk}>Importer ces lignes</button>
              {bulkMsg && <div className="login-hint" style={{ marginTop: 8 }}>{bulkMsg}</div>}
            </div>
          )}

          <div className="panel">
            <div className="panel-head"><h4>Progression</h4></div>
            <p className="login-hint" style={{ marginTop: -6, marginBottom: 10 }}>Les bassins de 25m et 50m ne sont pas comparables — la progression est affichée séparément pour chacun.</p>
            <div className="form-row">
              <select value={selSwimmer} onChange={(e) => setSelSwimmer(e.target.value)}>
                <option value="">Nageur…</option>
                {swimmers.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </select>
              <select value={selEpreuve} onChange={(e) => setSelEpreuve(e.target.value)}>
                {EPREUVES.map((ep) => <option key={ep}>{ep}</option>)}
              </select>
              <select value={selBassin} onChange={(e) => setSelBassin(e.target.value)}>
                {BASSINS.map((b) => <option key={b} value={b}>Bassin {b}</option>)}
              </select>
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
            <div className="table-row perf-row table-head"><span>Nageur</span><span>Épreuve</span><span>Temps</span><span>Date</span><span>Bassin</span><span></span></div>
            {[...performances].sort((a, b) => b.date.localeCompare(a.date)).map((p) => {
              const key = p.swimmer_id + "|" + normalizeEpreuve(p.epreuve) + "|" + p.bassin;
              const isBest = bestBySwimmer[key]?.id === p.id;
              return (
                <div className="table-row perf-row" key={p.id}>
                  <button className="link-btn" style={{ textAlign: "left" }} onClick={() => setFicheSwimmerId(p.swimmer_id)}>{nameOf(p.swimmer_id)}</button>
                  <span>{normalizeEpreuve(p.epreuve)}</span>
                  <span className={(isBest ? "chrono-best " : "") + (isOlderYear(p.date) ? "chrono-old" : "")}>{formatSeconds(p.secondes)}{isBest && " ★"}</span>
                  <span>{p.date}</span>
                  <span>{p.bassin}</span>
                  <span className="table-actions">
                    <button className="icon-btn" title="Détails de la course" onClick={() => setDetailId(p.id)}><ClipboardEdit size={15} /></button>
                    {!readOnly && <button className="icon-btn" onClick={() => remove(p.id)}><Trash2 size={15} /></button>}
                  </span>
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
              <label>Bassin</label>
              <select value={form.bassin} onChange={(e) => {
                const bassin = e.target.value;
                const epreuve = epreuvesPourBassin(bassin).includes(form.epreuve) ? form.epreuve : epreuvesPourBassin(bassin)[0];
                setForm({ ...form, bassin, epreuve });
              }}>
                {BASSINS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label>Épreuve</label>
              <select value={form.epreuve} onChange={(e) => setForm({ ...form, epreuve: e.target.value })}>
                {epreuvesPourBassin(form.bassin).map((ep) => <option key={ep}>{ep}</option>)}
              </select>
            </div>
          </div>
          <div className="form-grid-2">
            <div><label>Temps (mm:ss.cc)</label><input value={form.temps} onChange={(e) => setForm({ ...form, temps: e.target.value })} placeholder="Ex. 1:02.35" /></div>
            <div><label>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          </div>
          <button className="btn-primary full" onClick={add}>Enregistrer — vous pourrez ajouter l'analyse de course ensuite</button>
        </Modal>
      )}

      {detailId && (
        <DetailModal
          performance={performances.find((p) => p.id === detailId)}
          splits={splits.filter((s) => s.performance_id === detailId)}
          nom={nameOf(performances.find((p) => p.id === detailId)?.swimmer_id)}
          readOnly={readOnly}
          onClose={() => setDetailId(null)}
          reload={reload}
        />
      )}
    </div>
  );
}

function SwimmerFiche({ swimmer, performances, bestBySwimmer, onBack, onOpenDetail, onRemove, readOnly }) {
  if (!swimmer) return null;

  const groupes = ["25m", "50m"].map((bassin) => {
    const perfsDuBassin = performances.filter((p) => p.bassin === bassin);
    const parEpreuve = {};
    perfsDuBassin.forEach((p) => { (parEpreuve[normalizeEpreuve(p.epreuve)] ||= []).push(p); });
    const epreuves = Object.keys(parEpreuve).sort((a, b) => epreuveIndex(a) - epreuveIndex(b));
    return { bassin, epreuves, parEpreuve };
  }).filter((g) => g.epreuves.length > 0);

  return (
    <div className="view">
      <button className="link-btn" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }} onClick={onBack}>
        <ArrowLeft size={15} /> Retour à toutes les performances
      </button>
      <ViewHeader eyebrow={`${performances.length} chrono${performances.length > 1 ? "s" : ""}`} title={`${swimmer.nom} — Fiche performances`} />
      <p className="login-hint" style={{ marginBottom: 14 }}>Les temps <span className="chrono-old">soulignés</span> datent d'une saison antérieure à celle en cours.</p>

      {groupes.length === 0 ? <EmptyState text="Aucun chrono enregistré pour ce nageur." /> : (
        groupes.map((g) => (
          <div className="panel" key={g.bassin}>
            <div className="panel-head"><h4>Bassin {g.bassin}</h4></div>
            {g.epreuves.map((epreuve) => {
              const list = [...g.parEpreuve[epreuve]].sort((a, b) => b.date.localeCompare(a.date));
              return (
                <div key={epreuve} style={{ marginBottom: 14 }}>
                  <div className="strong" style={{ fontSize: 13, marginBottom: 6 }}>{epreuve}</div>
                  <div className="table">
                    <div className="table-row fiche-perf-row table-head"><span>Temps</span><span>Date</span><span></span><span></span></div>
                    {list.map((p) => {
                      const key = p.swimmer_id + "|" + normalizeEpreuve(p.epreuve) + "|" + p.bassin;
                      const isBest = bestBySwimmer[key]?.id === p.id;
                      return (
                        <div className="table-row fiche-perf-row" key={p.id}>
                          <span className={(isBest ? "chrono-best " : "") + (isOlderYear(p.date) ? "chrono-old" : "")}>{formatSeconds(p.secondes)}{isBest && " ★"}</span>
                          <span>{p.date}</span>
                          <span><button className="icon-btn" title="Détails de la course" onClick={() => onOpenDetail(p.id)}><ClipboardEdit size={15} /></button></span>
                          <span>{!readOnly && <button className="icon-btn" onClick={() => onRemove(p.id)}><Trash2 size={15} /></button>}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}

function DetailModal({ performance, splits, nom, readOnly, onClose, reload }) {
  const [retour, setRetour] = useState(performance?.retour || "");
  const [videoUrl, setVideoUrl] = useState(performance?.video_url || "");
  const [savedMsg, setSavedMsg] = useState("");
  const [splitForm, setSplitForm] = useState({ distance_m: "", temps: "", coups_bras: "", frequence: "" });

  if (!performance) return null;

  const saveRetourVideo = async () => {
    await updatePerformance(performance.id, { retour: retour || null, video_url: videoUrl || null });
    setSavedMsg("Enregistré ✓");
    setTimeout(() => setSavedMsg(""), 2000);
    reload();
  };

  const addSplit = async () => {
    if (!splitForm.distance_m) return;
    const temps_secondes = splitForm.temps ? parseTimeToSeconds(splitForm.temps) : null;
    await createPerformanceSplit({
      performance_id: performance.id,
      distance_m: Number(splitForm.distance_m),
      temps_secondes,
      coups_bras: splitForm.coups_bras ? Number(splitForm.coups_bras) : null,
      frequence: splitForm.frequence ? Number(splitForm.frequence) : null,
    });
    setSplitForm({ distance_m: "", temps: "", coups_bras: "", frequence: "" });
    reload();
  };
  const removeSplit = async (id) => { await deletePerformanceSplit(id); reload(); };

  const sortedSplits = [...splits].sort((a, b) => a.distance_m - b.distance_m);

  return (
    <Modal title={`${nom} — ${performance.epreuve} (${formatSeconds(performance.secondes)})`} onClose={onClose} wide>
      <h4 className="fiche-section-title" style={{ marginTop: 0 }}>Retour sur la nage</h4>
      {readOnly ? (
        performance.retour ? <p className="forme-detail" style={{ whiteSpace: "pre-wrap" }}>{performance.retour}</p> : <EmptyState text="Aucun retour du coach pour cette course." />
      ) : (
        <>
          <textarea rows={4} value={retour} onChange={(e) => setRetour(e.target.value)} placeholder="Ex. Bon départ, respiration à travailler sur le retour, bonne fin de course…" />
        </>
      )}

      <h4 className="fiche-section-title">Vidéo</h4>
      {readOnly ? (
        performance.video_url ? <a href={performance.video_url} target="_blank" rel="noreferrer" className="link-btn">Voir la vidéo</a> : <EmptyState text="Aucune vidéo ajoutée." />
      ) : (
        <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Lien vidéo (YouTube, Google Drive, WeTransfer…)" />
      )}
      {!readOnly && (
        <>
          <button className="btn-secondary" style={{ marginTop: 10 }} onClick={saveRetourVideo}>Enregistrer le retour & la vidéo</button>
          {savedMsg && <span className="login-hint" style={{ marginLeft: 10, color: "#1E8A5F" }}>{savedMsg}</span>}
        </>
      )}

      <h4 className="fiche-section-title">Temps de passage, coups de bras & fréquence</h4>
      <p className="login-hint" style={{ marginTop: -6, marginBottom: 10 }}>Ajoutez un point à chaque distance utile (25m pour un 50m, tous les 50m pour un 100/200/400/800/1500m).</p>
      {sortedSplits.length === 0 ? <EmptyState text="Aucun point de course enregistré." /> : (
        <div className="table" style={{ marginBottom: 14 }}>
          <div className="table-row splits-row table-head"><span>Distance</span><span>Temps</span><span>Coups de bras</span><span>Fréquence (s)</span>{!readOnly && <span></span>}</div>
          {sortedSplits.map((s) => (
            <div className="table-row splits-row" key={s.id}>
              <span className="strong">{s.distance_m} m</span>
              <span>{s.temps_secondes != null ? formatSeconds(s.temps_secondes) : "—"}</span>
              <span>{s.coups_bras ?? "—"}</span>
              <span>{s.frequence ?? "—"}</span>
              {!readOnly && <span><button className="icon-btn" onClick={() => removeSplit(s.id)}><Trash2 size={15} /></button></span>}
            </div>
          ))}
        </div>
      )}
      {!readOnly && (
        <div className="form-row">
          <input type="number" placeholder="Distance (m)" value={splitForm.distance_m} onChange={(e) => setSplitForm({ ...splitForm, distance_m: e.target.value })} />
          <input placeholder="Temps (mm:ss.cc)" value={splitForm.temps} onChange={(e) => setSplitForm({ ...splitForm, temps: e.target.value })} />
          <input type="number" placeholder="Coups de bras" value={splitForm.coups_bras} onChange={(e) => setSplitForm({ ...splitForm, coups_bras: e.target.value })} />
          <input type="number" step="0.01" placeholder="Fréquence (s)" value={splitForm.frequence} onChange={(e) => setSplitForm({ ...splitForm, frequence: e.target.value })} />
          <button className="btn-primary" onClick={addSplit}><Plus size={14} /> Ajouter ce point</button>
        </div>
      )}
    </Modal>
  );
}
