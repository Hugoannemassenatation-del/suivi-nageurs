import React, { useMemo } from "react";
import { ViewHeader, EmptyState } from "../lib/ui";
import { isThisWeek, isThisMonth } from "../lib/format";

export default function Statistiques({ swimmers, sessions, presences }) {
  const volumeByDate = useMemo(() => {
    const map = {};
    sessions.forEach((s) => { map[s.date] = (map[s.date] || 0) + (Number(s.volume_m) || 0); });
    return map;
  }, [sessions]);

  const rows = useMemo(() => {
    return swimmers.map((s) => {
      const mine = presences.filter((p) => p.swimmer_id === s.id && p.present);
      const compute = (filterFn) => {
        const list = mine.filter((p) => filterFn(p.date));
        return { nb: list.length, volume: list.reduce((sum, p) => sum + (volumeByDate[p.date] || 0), 0) };
      };
      return {
        swimmer: s,
        semaine: compute(isThisWeek),
        mois: compute(isThisMonth),
        saison: compute(() => true),
      };
    });
  }, [swimmers, presences, volumeByDate]);

  return (
    <div className="view">
      <ViewHeader eyebrow="Récapitulatif par nageur" title="Statistiques" />
      {swimmers.length === 0 ? <EmptyState text="Aucun nageur." /> : (
        <div className="table">
          <div className="table-row stats-row table-head">
            <span>Nageur</span>
            <span>Cette semaine</span>
            <span>Ce mois-ci</span>
            <span>Saison complète</span>
          </div>
          {rows.map((r) => (
            <div className="table-row stats-row" key={r.swimmer.id}>
              <span className="strong">{r.swimmer.nom} <span className="pill pill-ghost">{r.swimmer.groupe}</span></span>
              <span>{r.semaine.nb} entr. · {r.semaine.volume.toLocaleString("fr-FR")} m</span>
              <span>{r.mois.nb} entr. · {r.mois.volume.toLocaleString("fr-FR")} m</span>
              <span>{r.saison.nb} entr. · {r.saison.volume.toLocaleString("fr-FR")} m</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
