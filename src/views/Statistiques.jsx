import React, { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { ViewHeader, EmptyState } from "../lib/ui";
import { isThisWeek, isThisMonth, toISODate } from "../lib/format";

const NB_SEMAINES = 10;

function lundiDe(date) {
  const d = new Date(date);
  const jour = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - jour);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function Statistiques({ swimmers, sessions, presences, jours, jourRpes }) {
  const [tab, setTab] = useState("recap");
  const [selSwimmer, setSelSwimmer] = useState("");

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

  // RPE moyen par nageur et par date (une date peut avoir plusieurs jours/créneaux)
  const rpeByDateBySwimmer = useMemo(() => {
    const jourDateMap = {};
    jours.forEach((j) => { jourDateMap[j.id] = j.date; });
    const map = {}; // swimmer_id -> date -> [rpe,...]
    jourRpes.forEach((r) => {
      const date = jourDateMap[r.jour_id];
      if (!date) return;
      (map[r.swimmer_id] ||= {});
      (map[r.swimmer_id][date] ||= []).push(r.rpe);
    });
    return map;
  }, [jours, jourRpes]);

  const chargeData = useMemo(() => {
    if (!selSwimmer) return [];
    const mesPresences = presences.filter((p) => p.swimmer_id === selSwimmer && p.present);
    const mesRpe = rpeByDateBySwimmer[selSwimmer] || {};

    const semaines = [];
    const aujourdHui = lundiDe(new Date());
    for (let i = NB_SEMAINES - 1; i >= 0; i--) {
      const lundi = new Date(aujourdHui);
      lundi.setDate(lundi.getDate() - i * 7);
      const dimanche = new Date(lundi);
      dimanche.setDate(dimanche.getDate() + 6);
      semaines.push({ lundi, dimanche, charge: 0 });
    }

    mesPresences.forEach((p) => {
      const rpeListe = mesRpe[p.date];
      if (!rpeListe || rpeListe.length === 0) return;
      const rpeMoyen = rpeListe.reduce((a, b) => a + b, 0) / rpeListe.length;
      const volume = volumeByDate[p.date] || 0;
      const charge = rpeMoyen * (volume / 1000);
      const dateObj = new Date(p.date + "T00:00:00");
      const semaine = semaines.find((s) => dateObj >= s.lundi && dateObj <= s.dimanche);
      if (semaine) semaine.charge += charge;
    });

    return semaines.map((s) => ({
      label: `${String(s.lundi.getDate()).padStart(2, "0")}/${String(s.lundi.getMonth() + 1).padStart(2, "0")}`,
      charge: Number(s.charge.toFixed(1)),
    }));
  }, [selSwimmer, presences, rpeByDateBySwimmer, volumeByDate]);

  const acwr = useMemo(() => {
    if (chargeData.length < NB_SEMAINES) return null;
    const aigue = chargeData[chargeData.length - 1].charge;
    const dernieres4 = chargeData.slice(-5, -1);
    const chronique = dernieres4.reduce((a, b) => a + b.charge, 0) / dernieres4.length;
    if (chronique === 0) return null;
    return { aigue, chronique, ratio: aigue / chronique };
  }, [chargeData]);

  return (
    <div className="view">
      <ViewHeader eyebrow="Suivi par nageur" title="Statistiques" />

      <div className="role-switch" style={{ maxWidth: 360, marginBottom: 16 }}>
        <button className={tab === "recap" ? "role-on" : ""} onClick={() => setTab("recap")}>Récapitulatif</button>
        <button className={tab === "charge" ? "role-on" : ""} onClick={() => setTab("charge")}>Charge d'entraînement</button>
      </div>

      {tab === "recap" && (
        swimmers.length === 0 ? <EmptyState text="Aucun nageur." /> : (
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
        )
      )}

      {tab === "charge" && (
        <>
          <div className="panel note">
            Charge hebdomadaire = somme, sur la semaine, de (RPE du jour × volume nagé ce jour-là en km). C'est un indicateur simplifié inspiré de la méthode Foster, pas une mesure médicale — il aide à repérer les hausses brutales de charge, facteur de risque de blessure.
          </div>
          <div className="panel">
            <label>Nageur</label>
            <select value={selSwimmer} onChange={(e) => setSelSwimmer(e.target.value)} style={{ maxWidth: 320 }}>
              <option value="">Sélectionner…</option>
              {swimmers.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>

            {selSwimmer && (
              chargeData.every((c) => c.charge === 0) ? (
                <div style={{ marginTop: 12 }}><EmptyState text="Pas assez de données (présences + RPE) pour ce nageur sur les 10 dernières semaines." /></div>
              ) : (
                <>
                  {acwr && (
                    <div className={"panel note" + (acwr.ratio > 1.5 ? "" : "")} style={{ marginTop: 12, background: acwr.ratio > 1.5 ? "#FDECEC" : "var(--foam)", borderColor: acwr.ratio > 1.5 ? "#D64545" : undefined }}>
                      {acwr.ratio > 1.5 && <AlertTriangle size={15} color="#D64545" />}
                      <span>
                        Charge de la semaine : <strong>{acwr.aigue.toFixed(1)}</strong> · Moyenne des 4 semaines précédentes : <strong>{acwr.chronique.toFixed(1)}</strong> · Ratio : <strong>{acwr.ratio.toFixed(2)}</strong>
                        {acwr.ratio > 1.5 ? " — hausse marquée, zone de vigilance." : " — dans une zone habituelle."}
                      </span>
                    </div>
                  )}
                  <div style={{ width: "100%", height: 260, marginTop: 16 }}>
                    <ResponsiveContainer>
                      <BarChart data={chargeData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--line-faint)" />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--ink-soft)" }} />
                        <YAxis tick={{ fontSize: 11, fill: "var(--ink-soft)" }} />
                        <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--line-faint)", fontSize: 12 }} />
                        <Bar dataKey="charge" fill="var(--chrono)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )
            )}
          </div>
        </>
      )}
    </div>
  );
}
