import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { ViewHeader, EmptyState } from "../lib/ui";
import { createMessage, deleteMessage } from "../lib/db";

export default function Communication({ messages, swimmers, readOnly, defaultAuteur, reload }) {
  const [texte, setTexte] = useState("");
  const [auteur, setAuteur] = useState(defaultAuteur || "Coach");
  const [cible, setCible] = useState("");

  const post = async () => {
    if (!texte.trim()) return;
    await createMessage({ auteur, texte, swimmer_id: cible || null });
    setTexte("");
    reload();
  };
  const remove = async (id) => { await deleteMessage(id); reload(); };
  const nomOf = (id) => swimmers.find((s) => s.id === id)?.nom;

  return (
    <div className="view">
      <ViewHeader eyebrow={`${messages.length} annonce${messages.length > 1 ? "s" : ""}`} title="Communication" />
      {!readOnly && (
        <div className="panel">
          <div className="form-grid-2">
            <div>
              <label>Signature</label>
              <input value={auteur} onChange={(e) => setAuteur(e.target.value)} />
            </div>
            <div>
              <label>Destinataire</label>
              <select value={cible} onChange={(e) => setCible(e.target.value)}>
                <option value="">Tout le monde</option>
                {swimmers.map((s) => <option key={s.id} value={s.id}>{s.nom} uniquement</option>)}
              </select>
            </div>
          </div>
          <label>Message</label>
          <textarea rows={3} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Ex. Séance de demain déplacée à 18h30 — bassin extérieur." />
          <button className="btn-primary" style={{ marginTop: 10 }} onClick={post}>Publier</button>
        </div>
      )}
      {messages.length === 0 ? (
        <div style={{ marginTop: 16 }}><EmptyState text="Aucune annonce publiée." /></div>
      ) : (
        <div className="feed">
          {[...messages].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((m) => (
            <div className="feed-item" key={m.id}>
              <div className="feed-top">
                <span className="strong">{m.auteur}</span>
                {m.swimmer_id && <span className="pill pill-alt">Pour {nomOf(m.swimmer_id) || "un nageur"}</span>}
                <span className="session-date">{m.created_at.slice(0, 10)}</span>
                {!readOnly && <button className="icon-btn feed-del" onClick={() => remove(m.id)}><Trash2 size={14} /></button>}
              </div>
              <div>{m.texte}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
