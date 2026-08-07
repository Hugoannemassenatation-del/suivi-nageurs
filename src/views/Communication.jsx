import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { ViewHeader, EmptyState } from "../lib/ui";
import { createMessage, deleteMessage, sendNotification } from "../lib/db";

export default function Communication({ messages, swimmers, isStaff, defaultAuteur, mySwimmerId, mySession, reload }) {
  const [texte, setTexte] = useState("");
  const [auteur, setAuteur] = useState(defaultAuteur || "Coach");
  const [cible, setCible] = useState("");

  const post = async () => {
    if (!texte.trim()) return;
    const swimmer_id = isStaff ? (cible || null) : mySwimmerId;
    const auteurFinal = isStaff ? auteur : defaultAuteur;
    await createMessage({ auteur: auteurFinal, texte, swimmer_id });
    sendNotification({ type: "message", swimmerId: swimmer_id, auteur: auteurFinal, texte, notifyStaff: !isStaff });
    setTexte("");
    reload();
  };
  const remove = async (id) => { await deleteMessage(id); reload(); };
  const nomOf = (id) => swimmers.find((s) => s.id === id)?.nom;
  const peutSupprimer = (m) => isStaff || m.created_by === mySession?.user?.id;

  return (
    <div className="view">
      <ViewHeader eyebrow={`${messages.length} message${messages.length > 1 ? "s" : ""}`} title="Communication" />

      <div className="panel">
        {isStaff ? (
          <>
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
          </>
        ) : (
          <>
            <label>Écrire au coach</label>
            <textarea rows={3} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Ex. Bonjour, je souhaitais signaler que…" />
            <button className="btn-primary" style={{ marginTop: 10 }} onClick={post}>Envoyer</button>
            <p className="login-hint" style={{ marginTop: 8 }}>Votre message n'est visible que par vous et l'équipe encadrante.</p>
          </>
        )}
      </div>

      {messages.length === 0 ? (
        <div style={{ marginTop: 16 }}><EmptyState text="Aucun message." /></div>
      ) : (
        <div className="feed">
          {[...messages].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((m) => (
            <div className="feed-item" key={m.id}>
              <div className="feed-top">
                <span className="strong">{m.auteur}</span>
                {m.swimmer_id && <span className="pill pill-alt">{isStaff ? `Pour ${nomOf(m.swimmer_id) || "un nageur"}` : "Privé"}</span>}
                <span className="session-date">{m.created_at.slice(0, 10)}</span>
                {peutSupprimer(m) && <button className="icon-btn feed-del" onClick={() => remove(m.id)}><Trash2 size={14} /></button>}
              </div>
              <div>{m.texte}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
