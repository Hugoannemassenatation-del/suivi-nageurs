import React, { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, ClipboardList, CheckCircle2, Settings } from "lucide-react";
import { ViewHeader, EmptyState, Modal } from "../lib/ui";
import { supabase } from "../lib/supabase";
import {
  listFormulaires, createFormulaire, updateFormulaire, deleteFormulaire,
  listQuestions, createQuestion, deleteQuestion,
  listReponses, upsertReponse,
} from "../lib/db";

const TYPES_QUESTION = [
  { v: "texte_court", label: "Réponse courte" },
  { v: "texte_long", label: "Réponse longue" },
  { v: "choix_unique", label: "Choix unique" },
  { v: "choix_multiple", label: "Choix multiple" },
];

export default function Formulaires({ swimmers, isStaff, mySwimmerId }) {
  const [formulaires, setFormulaires] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [reponses, setReponses] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [manageId, setManageId] = useState(null);
  const [fillId, setFillId] = useState(null);
  const [respondentsId, setRespondentsId] = useState(null);

  const loadAll = useCallback(async () => {
    const [{ data: f }, { data: q }, { data: r }] = await Promise.all([listFormulaires(), listQuestions(), listReponses()]);
    setFormulaires(f || []);
    setQuestions(q || []);
    setReponses(r || []);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const questionsDe = (formId) => questions.filter((q) => q.formulaire_id === formId).sort((a, b) => a.ordre - b.ordre);
  const reponseDe = (formId, swimmerId) => reponses.find((r) => r.formulaire_id === formId && r.swimmer_id === swimmerId);
  const countReponses = (formId) => reponses.filter((r) => r.formulaire_id === formId).length;

  return (
    <div className="view">
      <ViewHeader
        eyebrow="Objectifs, bilans et questionnaires"
        title="Formulaires"
        action={isStaff && <button className="btn-primary" onClick={() => setOpenCreate(true)}><Plus size={16} /> Nouveau formulaire</button>}
      />

      {formulaires.length === 0 ? <EmptyState text="Aucun formulaire créé pour le moment." /> : (
        <div className="session-list">
          {formulaires.map((f) => {
            const mine = !isStaff ? reponseDe(f.id, mySwimmerId) : null;
            return (
              <div className="session-item" key={f.id}>
                <div>
                  <div className="session-card-top">
                    <span className={"pill" + (f.actif ? "" : " pill-ghost")}>{f.actif ? "Actif" : "Fermé"}</span>
                    <span className="session-date">{questionsDe(f.id).length} question{questionsDe(f.id).length > 1 ? "s" : ""}</span>
                  </div>
                  <div className="session-title">{f.titre}</div>
                  {f.description && <div className="session-vol">{f.description}</div>}
                  {isStaff && <div className="session-meta"><span>{countReponses(f.id)}/{swimmers.length} réponses reçues</span></div>}
                  {!isStaff && mine && <div className="session-meta" style={{ color: "#1E8A5F" }}><CheckCircle2 size={13} /> Déjà répondu</div>}
                </div>
                <div className="session-item-actions">
                  {isStaff ? (
                    <>
                      <button className="btn-secondary" onClick={() => setManageId(f.id)}><Settings size={14} style={{ marginRight: 4 }} />Questions</button>
                      <button className="btn-secondary" onClick={() => setRespondentsId(f.id)}><ClipboardList size={14} style={{ marginRight: 4 }} />Réponses</button>
                      <button className="icon-btn" onClick={async () => { await deleteFormulaire(f.id); loadAll(); }}><Trash2 size={15} /></button>
                    </>
                  ) : (
                    f.actif && <button className="btn-primary" onClick={() => setFillId(f.id)}>{mine ? "Modifier ma réponse" : "Répondre"}</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {openCreate && <CreateFormulaireModal onClose={() => setOpenCreate(false)} onCreated={loadAll} />}
      {manageId && (
        <ManageQuestionsModal
          formulaire={formulaires.find((f) => f.id === manageId)}
          questions={questionsDe(manageId)}
          onClose={() => setManageId(null)}
          onChanged={loadAll}
        />
      )}
      {respondentsId && (
        <RespondentsModal
          formulaire={formulaires.find((f) => f.id === respondentsId)}
          questions={questionsDe(respondentsId)}
          swimmers={swimmers}
          reponses={reponses.filter((r) => r.formulaire_id === respondentsId)}
          onClose={() => setRespondentsId(null)}
        />
      )}
      {fillId && (
        <FillFormModal
          formulaire={formulaires.find((f) => f.id === fillId)}
          questions={questionsDe(fillId)}
          existing={reponseDe(fillId, mySwimmerId)}
          swimmerId={mySwimmerId}
          onClose={() => setFillId(null)}
          onSaved={loadAll}
        />
      )}
    </div>
  );
}

function CreateFormulaireModal({ onClose, onCreated }) {
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");

  const create = async () => {
    if (!titre.trim()) return;
    await createFormulaire({ titre: titre.trim(), description, actif: true });
    onCreated();
    onClose();
  };

  return (
    <Modal title="Nouveau formulaire" onClose={onClose}>
      <label>Titre</label>
      <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Ex. Objectifs de saison 2026-2027" />
      <label>Description (optionnel)</label>
      <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex. À remplir avant le 15 septembre." />
      <button className="btn-primary full" onClick={create}>Créer — vous ajouterez les questions ensuite</button>
    </Modal>
  );
}

function ManageQuestionsModal({ formulaire, questions, onClose, onChanged }) {
  const [q, setQ] = useState({ question: "", type: "texte_long", options: "" });
  const [actif, setActif] = useState(formulaire?.actif ?? true);

  const addQuestion = async () => {
    if (!q.question.trim()) return;
    const payload = {
      formulaire_id: formulaire.id,
      ordre: questions.length,
      question: q.question.trim(),
      type: q.type,
      options: (q.type === "choix_unique" || q.type === "choix_multiple")
        ? q.options.split(",").map((o) => o.trim()).filter(Boolean)
        : null,
    };
    await createQuestion(payload);
    setQ({ question: "", type: "texte_long", options: "" });
    onChanged();
  };
  const removeQuestion = async (id) => { await deleteQuestion(id); onChanged(); };
  const toggleActif = async () => {
    const next = !actif;
    setActif(next);
    await updateFormulaire(formulaire.id, { actif: next });
    onChanged();
  };

  if (!formulaire) return null;

  return (
    <Modal title={`Questions — ${formulaire.titre}`} onClose={onClose} wide>
      <div className="panel note" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>Statut : {actif ? "Actif (visible et modifiable par les familles)" : "Fermé (lecture seule)"}</span>
        <button className="btn-secondary" onClick={toggleActif}>{actif ? "Fermer" : "Réactiver"}</button>
      </div>

      {questions.length === 0 ? <EmptyState text="Aucune question pour l'instant." /> : (
        <div className="table" style={{ marginBottom: 16 }}>
          <div className="table-row comptes-swim-row table-head"><span>Question</span><span>Type</span><span></span><span></span></div>
          {questions.map((qu) => (
            <div className="table-row comptes-swim-row" key={qu.id}>
              <span>{qu.question}</span>
              <span>{TYPES_QUESTION.find((t) => t.v === qu.type)?.label}</span>
              <span>{qu.options ? qu.options.join(" / ") : ""}</span>
              <span><button className="icon-btn" onClick={() => removeQuestion(qu.id)}><Trash2 size={15} /></button></span>
            </div>
          ))}
        </div>
      )}

      <label>Nouvelle question</label>
      <input value={q.question} onChange={(e) => setQ({ ...q, question: e.target.value })} placeholder="Ex. Quel est ton objectif chrono principal cette saison ?" />
      <div className="form-grid-2">
        <div>
          <label>Type de réponse</label>
          <select value={q.type} onChange={(e) => setQ({ ...q, type: e.target.value })}>
            {TYPES_QUESTION.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
          </select>
        </div>
        {(q.type === "choix_unique" || q.type === "choix_multiple") && (
          <div>
            <label>Options (séparées par des virgules)</label>
            <input value={q.options} onChange={(e) => setQ({ ...q, options: e.target.value })} placeholder="Ex. Débutant, Confirmé, Compétition" />
          </div>
        )}
      </div>
      <button className="btn-primary full" onClick={addQuestion}>Ajouter la question</button>
    </Modal>
  );
}

function RespondentsModal({ formulaire, questions, swimmers, reponses, onClose }) {
  const [openSwimmer, setOpenSwimmer] = useState(null);

  if (!formulaire) return null;
  const reponseDe = (swimmerId) => reponses.find((r) => r.swimmer_id === swimmerId);

  return (
    <Modal title={`Réponses — ${formulaire.titre}`} onClose={onClose} wide>
      <div className="table">
        <div className="table-row comptes-swim-row table-head"><span>Nageur</span><span>Statut</span><span>Date</span><span></span></div>
        {swimmers.map((s) => {
          const r = reponseDe(s.id);
          return (
            <div className="table-row comptes-swim-row" key={s.id}>
              <span>{s.nom}</span>
              <span style={{ color: r ? "#1E8A5F" : "var(--ink-soft)" }}>{r ? "Répondu" : "En attente"}</span>
              <span>{r ? r.submitted_at?.slice(0, 10) : "—"}</span>
              <span>{r && <button className="btn-secondary" onClick={() => setOpenSwimmer(s.id)}>Voir</button>}</span>
            </div>
          );
        })}
      </div>

      {openSwimmer && (
        <div className="panel" style={{ marginTop: 16 }}>
          <div className="panel-head"><h4>Réponses de {swimmers.find((s) => s.id === openSwimmer)?.nom}</h4></div>
          {questions.map((qu) => (
            <div key={qu.id} style={{ marginBottom: 12 }}>
              <div className="strong" style={{ fontSize: 13, marginBottom: 4 }}>{qu.question}</div>
              <div className="forme-detail">
                {(() => {
                  const val = reponseDe(openSwimmer)?.reponses?.[qu.id];
                  if (val == null || val === "") return "—";
                  return Array.isArray(val) ? val.join(", ") : String(val);
                })()}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

function FillFormModal({ formulaire, questions, existing, swimmerId, onClose, onSaved }) {
  const [answers, setAnswers] = useState(existing?.reponses || {});
  const [error, setError] = useState("");

  const setAnswer = (qid, val) => setAnswers((a) => ({ ...a, [qid]: val }));
  const toggleMulti = (qid, opt) => {
    setAnswers((a) => {
      const cur = Array.isArray(a[qid]) ? a[qid] : [];
      const next = cur.includes(opt) ? cur.filter((o) => o !== opt) : [...cur, opt];
      return { ...a, [qid]: next };
    });
  };

  const submit = async () => {
    setError("");
    if (!swimmerId) { setError("Aucun nageur associé à ce compte."); return; }
    const { error: e } = await upsertReponse({ formulaire_id: formulaire.id, swimmer_id: swimmerId, reponses: answers, submitted_at: new Date().toISOString() });
    if (e) { setError("Erreur lors de l'enregistrement."); return; }
    onSaved();
    onClose();
  };

  if (!formulaire) return null;

  return (
    <Modal title={formulaire.titre} onClose={onClose} wide>
      {formulaire.description && <p className="login-hint" style={{ marginBottom: 14 }}>{formulaire.description}</p>}
      {questions.length === 0 ? <EmptyState text="Ce formulaire n'a pas encore de questions." /> : (
        <>
          {questions.map((qu) => (
            <div key={qu.id} style={{ marginBottom: 14 }}>
              <label>{qu.question}</label>
              {qu.type === "texte_court" && (
                <input value={answers[qu.id] || ""} onChange={(e) => setAnswer(qu.id, e.target.value)} />
              )}
              {qu.type === "texte_long" && (
                <textarea rows={3} value={answers[qu.id] || ""} onChange={(e) => setAnswer(qu.id, e.target.value)} />
              )}
              {qu.type === "choix_unique" && (
                <select value={answers[qu.id] || ""} onChange={(e) => setAnswer(qu.id, e.target.value)}>
                  <option value="">—</option>
                  {(qu.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              )}
              {qu.type === "choix_multiple" && (
                <div className="forme-grid" style={{ gridTemplateColumns: "1fr" }}>
                  {(qu.options || []).map((o) => {
                    const checked = Array.isArray(answers[qu.id]) && answers[qu.id].includes(o);
                    return (
                      <label key={o} style={{ display: "flex", alignItems: "center", gap: 8, textTransform: "none", fontWeight: 400, fontSize: 13.5, color: "var(--ink)", margin: "4px 0" }}>
                        <input type="checkbox" style={{ width: "auto" }} checked={checked} onChange={() => toggleMulti(qu.id, o)} />
                        {o}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {error && <div className="login-error">{error}</div>}
          <button className="btn-primary full" onClick={submit}>Envoyer mes réponses</button>
        </>
      )}
    </Modal>
  );
}
