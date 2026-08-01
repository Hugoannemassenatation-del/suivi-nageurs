import React, { useMemo, useState } from "react";
import { Gauge } from "lucide-react";
import { ViewHeader, EmptyState } from "../lib/ui";
import { RPE_ECHELLE, todayISO } from "../lib/format";
import { upsertPresence } from "../lib/db";

function getRow(presences, date, swimmerId) {
  return presences.find((p) => p.date === date && p.swimmer_id === swimmerId) || { present: false, rpe: null };
}

export default function Presences({ swimmers, presences, reload }) {
  const [date, setDate] = useState(todayISO());

  const dayEntries = useMemo(() => presences.filter((p) => p.date === date), [presences, date]);
  const presentCount = dayEntries.filter((p) => p.present).length;

  const update = async (swimmerId, patch) => {
    const prev = getRow(presences, date, swimmerId);
    await upsertPresence({ date, swimmer_id: swimmerId, present: prev.present, rpe: prev.rpe, ...patch });
    reload();
  };
  const togglePresent = (swimmerId) => {
    const p = getRow(presences, date, swimmerId);
    update(swimmerId, { present: !p.present });
  };

  return (
    <div className="view">
      <ViewHeader eyebrow="Appel du jour" title="Présences" />

      <div className="panel">
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ maxWidth: 220 }} />
        <div className="session-meta" style={{ marginTop: 10 }}>
          <span className="strong">{presentCount}</span>/{swimmers.length} présents ce jour-là
        </div>
      </div>

      <div className="panel note">
        <Gauge size={15} />
        <span>RPE (Ressenti de l'Effort, échelle 0-10) : demandez au nageur son ressenti et notez-le si besoin.</span>
      </div>

      {swimmers.length === 0 ? (
        <EmptyState text="Aucun nageur." />
      ) : (
        <div className="presence-grid">
          {swimmers.map((sw) => {
            const p = getRow(presences, date, sw.id);
            return (
              <div key={sw.id} className={"presence-tile" + (p.present ? " present" : "")}>
                <button className="presence-main" onClick={() => togglePresent(sw.id)}>
                  <span className="presence-check">{p.present ? "✓" : ""}</span>
                  <span className="presence-name">{sw.nom}</span>
                  <span className="pill pill-ghost">{sw.groupe}</span>
                </button>
                {p.present && (
                  <div className="rpe-row">
                    <span className="rpe-label">RPE</span>
                    <select value={p.rpe ?? ""} onChange={(e) => update(sw.id, { rpe: e.target.value ? Number(e.target.value) : null })}>
                      <option value="">—</option>
                      {RPE_ECHELLE.map((r) => <option key={r.v} value={r.v}>{r.v} · {r.label}</option>)}
                    </select>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
