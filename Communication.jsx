import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { ViewHeader, EmptyState } from "../lib/ui";
import { createMessage, deleteMessage } from "../lib/db";

export default function Communication({ messages, readOnly, defaultAuteur, reload }) {
  const [texte, setTexte] = useState("");
  const [auteur, setAuteur] = useState(defaultAuteur || "Coach");

  const post = async () => {
    if (!texte.trim()) return;
    await createMessage({ auteur, texte });
    setTexte("");
    reload();
  };
  const remove = async (id) => { await deleteMessage(id); reload(); };

  return (
    <div className="view">
      <ViewHeader eyebrow={`${messages.length} annonce${messages.length > 1 ? "s" : ""}`} title="Communication" />
      {!readOnly && (
        <div className="panel">
          <label>Signature</label>
          <input value={auteur} onChange={(e) => setAuteur(e.target.value)} style={{ maxWidth: 220 }} />
          <label style={{ marginTop: 10 }}>Message</label>
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
