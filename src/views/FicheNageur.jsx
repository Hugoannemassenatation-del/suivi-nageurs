import React from "react";
import { X } from "lucide-react";
import { StatTile, EmptyState } from "../lib/ui";
import { formatSeconds, formeScore, formeColor, FORME_ITEMS, daysAgo } from "../lib/format";

export default function FicheNageur({ swimmer, sessions, presences, jours, jourRpes, performances, vma, wellness, onClose }) {
  if (!swimmer) return null;

  const myPresences = presences.filter((p) => p.swimmer_id === swimmer.id && p.present).sort((a, b) => b.date.localeCompare(a.date));
  const sessionsByDate = {};
  sessions.forEach((s) => { (sessionsByDate[s.date] ||= []).push(s); });
  const joursByDate = {};
  jours.forEach((j) => { (joursByDate[j.date] ||= []).push(j); });

  const volume30j = myPresences
    .filter((p) => daysAgo(p.date) <= 30 && daysAgo(p.date) >= 0)
    .reduce((sum, p) => sum + (sessionsByDate[p.date] || []).reduce((s2, se) => s2 + (Number(se.volume_m) || 0), 0), 0);

  const swPerfs = performances.filter((p) => p.swimmer_id === swimmer.id).sort((a, b) => b.date.localeCompare(a.date));
  const swVma = vma.filter((v) => v.swimmer_id === swimmer.id).sort((a, b) => b.date.localeCompare(a.date));
  const swForme = wellness.filter((f) => f.swimmer_id === swimmer.id).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal fiche-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <h3>{swimmer.nom}</h3>
            <div className="fiche-sub">
              <span className="pill">{swimmer.groupe}</span>
              {swimmer.naissance && <span className="session-date">Né(e) en {swimmer.naissance}</span>}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body fiche-body">
          <div className="stat-row" style={{ marginBottom: 18 }}>
            <StatTile label="Jours de présence" value={myPresences.length} />
            <StatTile label="Volume (30j)" value={volume30j.toLocaleString("fr-FR")} unit="m" accent />
            <StatTile label="Chronos enregistrés" value={swPerfs.length} />
            <StatTile label="Checks forme" value={swForme.length} />
          </div>

          <h4 className="fiche-section-title">Forme du matin — historique complet</h4>
          {swForme.length === 0 ? <EmptyState text="Aucun check de forme enregistré." /> : (
            <div className="table" style={{ marginBottom: 20 }}>
              <div className="table-row forme-row table-head"><span>Date</span><span>Score</span><span>Détail</span><span></span></div>
              {swForme.map((f) => {
                const score = formeScore(f);
                return (
                  <div className="table-row forme-row" key={f.id}>
                    <span>{f.date}</span>
                    <span style={{ color: formeColor(score), fontWeight: 600 }}>{score?.toFixed(1)}/5</span>
                    <span className="forme-detail">
                      {FORME_ITEMS.map((it) => `${it.label.split(" ")[0]} ${f[it.key]}`).join(" · ")}
                      {f.cycle && ` · Règles: ${f.cycle === "oui" ? "oui" : f.cycle === "non" ? "non" : "NSP"}`}
                      {f.note && <span className="fiche-note"> — « {f.note} »</span>}
                    </span>
                    <span></span>
                  </div>
                );
              })}
            </div>
          )}

          <h4 className="fiche-section-title">Présences récentes</h4>
          {myPresences.length === 0 ? <EmptyState text="Aucune présence enregistrée." /> : (
            <div className="table" style={{ marginBottom: 20 }}>
              <div className="table-row fiche-attend-row table-head"><span>Date</span><span>Séance(s) du jour</span><span>Volume</span><span>RPE</span></div>
              {myPresences.slice(0, 15).map((p) => {
                const daySessions = sessionsByDate[p.date] || [];
                const vol = daySessions.reduce((s, se) => s + (Number(se.volume_m) || 0), 0);
                const rpeTexte = (joursByDate[p.date] || [])
                  .map((j) => {
                    const r = jourRpes.find((x) => x.jour_id === j.id && x.swimmer_id === swimmer.id);
                    return r ? `${j.label || j.date}: ${r.rpe}/10` : null;
                  })
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <div className="table-row fiche-attend-row" key={p.id}>
                    <span>{p.date}</span>
                    <span>{daySessions.map((s) => s.titre).join(", ") || "—"}</span>
                    <span>{vol.toLocaleString("fr-FR")} m</span>
                    <span>{rpeTexte || "—"}</span>
                  </div>
                );
              })}
            </div>
          )}

          <h4 className="fiche-section-title">Performances</h4>
          {swPerfs.length === 0 ? <EmptyState text="Aucun chrono enregistré." /> : (
            <div className="table" style={{ marginBottom: 20 }}>
              <div className="table-row fiche-perf-row table-head"><span>Épreuve</span><span>Temps</span><span>Date</span><span>Bassin</span></div>
              {swPerfs.map((p) => (
                <div className="table-row fiche-perf-row" key={p.id}>
                  <span>{p.epreuve}</span>
                  <span className="chrono-best">{formatSeconds(p.secondes)}</span>
                  <span>{p.date}</span>
                  <span>{p.bassin}</span>
                </div>
              ))}
            </div>
          )}

          <h4 className="fiche-section-title">Tests VMA</h4>
          {swVma.length === 0 ? <EmptyState text="Aucun test VMA enregistré." /> : (
            <div className="table">
              <div className="table-row fiche-perf-row table-head"><span>VMA</span><span>Méthode</span><span>Date</span><span></span></div>
              {swVma.map((v) => (
                <div className="table-row fiche-perf-row" key={v.id}>
                  <span>{v.valeur} m/min</span><span>{v.methode}</span><span>{v.date}</span><span></span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
