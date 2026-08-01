import React from "react";
import { ViewHeader, EmptyState, StatTile } from "../lib/ui";
import { daysAgo } from "../lib/format";

export default function Dashboard({ swimmers, sessions, messages, events, setView }) {
  const weekSessions = sessions.filter((s) => daysAgo(s.date) <= 7 && daysAgo(s.date) >= 0);
  const weekVolume = weekSessions.reduce((sum, s) => sum + (Number(s.volume_m) || 0), 0);
  const lastSession = [...sessions].sort((a, b) => b.date.localeCompare(a.date))[0];
  const recentMessages = [...messages].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 3);
  const nextEvent = [...events].filter((e) => daysAgo(e.date_debut) <= 0).sort((a, b) => a.date_debut.localeCompare(b.date_debut))[0];

  return (
    <div className="view">
      <ViewHeader eyebrow="Vue d'ensemble" title="Tableau de bord" />
      <div className="stat-row">
        <StatTile label="Nageurs" value={swimmers.length} />
        <StatTile label="Séances (7j)" value={weekSessions.length} />
        <StatTile label="Volume (7j)" value={weekVolume.toLocaleString("fr-FR")} unit="m" accent />
        <StatTile label="Messages" value={messages.length} />
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <h4>Dernière séance</h4>
            <button className="link-btn" onClick={() => setView("seances")}>Voir tout</button>
          </div>
          {lastSession ? (
            <div>
              <div className="session-card-top">
                <span className="pill">{lastSession.groupe}</span>
                <span className="session-date">{lastSession.date}</span>
              </div>
              <div className="session-title">{lastSession.titre}</div>
              <div className="session-vol">{Number(lastSession.volume_m || 0).toLocaleString("fr-FR")} m · {lastSession.bassin}</div>
            </div>
          ) : <EmptyState text="Aucune séance enregistrée pour le moment." />}
        </div>

        <div className="panel">
          <div className="panel-head">
            <h4>Prochaine échéance</h4>
            <button className="link-btn" onClick={() => setView("calendrier")}>Voir tout</button>
          </div>
          {nextEvent ? (
            <div>
              <div className="session-card-top">
                <span className={"pill" + (nextEvent.type === "Stage" ? " pill-alt" : "")}>{nextEvent.type}</span>
                <span className="session-date">{nextEvent.date_debut}{nextEvent.date_fin ? ` → ${nextEvent.date_fin}` : ""}</span>
              </div>
              <div className="session-title">{nextEvent.nom}</div>
              <div className="session-vol">{nextEvent.lieu}</div>
            </div>
          ) : <EmptyState text="Aucun événement programmé." />}
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h4>Derniers messages</h4>
          <button className="link-btn" onClick={() => setView("communication")}>Voir tout</button>
        </div>
        {recentMessages.length ? (
          <ul className="msg-list">
            {recentMessages.map((m) => (
              <li key={m.id}>
                <span className="msg-date">{m.created_at.slice(0, 10)}</span>
                <span>{m.texte}</span>
              </li>
            ))}
          </ul>
        ) : <EmptyState text="Aucune annonce pour l'instant." />}
      </div>
    </div>
  );
}
