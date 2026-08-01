import React, { useEffect, useState } from "react";
import { ViewHeader, EmptyState } from "../lib/ui";
import { RPE_ECHELLE } from "../lib/format";
import { upsertAttendance } from "../lib/db";
import { Gauge } from "lucide-react";

function getRow(attendance, sessionId, swimmerId) {
  return attendance.find((a) => a.session_id === sessionId && a.swimmer_id === swimmerId) || { present: false, rpe: null };
}

export default function Presences({ swimmers, sessions, attendance, activeSession, setActiveSession, reload }) {
  const sorted = [...sessions].sort((a, b) => b.date.localeCompare(a.date));
  const current = sessions.find((s) => s.id === activeSession) || sorted[0];

  useEffect(() => {
    if (!activeSession && sorted[0]) setActiveSession(sorted[0].id);
  }, [activeSession]); // eslint-disable-line

  const update = async (swimmerId, patch) => {
    if (!current) return;
    const prev = getRow(attendance, current.id, swimmerId);
    await upsertAttendance({ session_id: current.id, swimmer_id: swimmerId, present: prev.present, rpe: prev.rpe, ...patch });
    reload();
  };
  const togglePresent = (swimmerId) => {
    const p = getRow(attendance, current.id, swimmerId);
    update(swimmerId, { present: !p.present });
  };

  return (
    <div className="view">
      <ViewHeader eyebrow="Appel" title="Présences" />
      {sessions.length === 0 ? (
        <EmptyState text="Créez d'abord une séance dans l'onglet Séances." />
      ) : (
        <>
          <div className="session-picker">
            <label>Séance</label>
            <select value={current?.id || ""} onChange={(e) => setActiveSession(e.target.value)}>
              {sorted.map((s) => <option key={s.id} value={s.id}>{s.date} — {s.titre} ({s.groupe})</option>)}
            </select>
          </div>

          <div className="panel note">
            <Gauge size={15} />
            <span>RPE (Ressenti de l'Effort, échelle 0-10) : demandez au nageur son ressenti juste après la séance et notez-le.</span>
          </div>

          {swimmers.length === 0 ? (
            <EmptyState text="Aucun nageur." />
          ) : (
            <div className="presence-grid">
              {swimmers.map((sw) => {
                const p = getRow(attendance, current.id, sw.id);
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
        </>
      )}
    </div>
  );
}
