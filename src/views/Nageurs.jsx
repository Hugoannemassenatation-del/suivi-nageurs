import React from "react";
import { Trash2, ShieldCheck } from "lucide-react";
import { ViewHeader, EmptyState } from "../lib/ui";
import { deleteSwimmer } from "../lib/db";

export default function Nageurs({ swimmers, onOpenFiche, isAdmin, reload }) {
  const remove = async (id) => {
    await deleteSwimmer(id);
    reload();
  };

  return (
    <div className="view">
      <ViewHeader eyebrow={`${swimmers.length} nageur${swimmers.length > 1 ? "s" : ""}`} title="Nageurs" />
      {!isAdmin && (
        <div className="panel note">
          <ShieldCheck size={15} />
          <span>Les fiches nageurs sont créées par l'administrateur du club, depuis l'onglet Comptes &amp; accès.</span>
        </div>
      )}
      {swimmers.length === 0 ? (
        <EmptyState text="Aucun nageur n'a encore été ajouté." />
      ) : (
        <div className="table">
          <div className="table-row table-head">
            <span>Nom</span><span>Groupe</span><span>Année de naissance</span><span></span>
          </div>
          {swimmers.map((s) => (
            <div className="table-row" key={s.id}>
              <span className="strong">{s.nom}</span>
              <span><span className="pill">{s.groupe}</span></span>
              <span>{s.naissance || "—"}</span>
              <span className="table-actions">
                <button className="btn-secondary" onClick={() => onOpenFiche(s.id)}>Fiche</button>
                {isAdmin && <button className="icon-btn" onClick={() => remove(s.id)}><Trash2 size={15} /></button>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
