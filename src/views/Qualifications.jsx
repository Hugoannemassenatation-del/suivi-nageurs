import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Trash2, ArrowLeft, Upload, CheckCircle2, XCircle } from "lucide-react";
import { ViewHeader, EmptyState, Modal } from "../lib/ui";
import { EPREUVES, BASSINS, formatSeconds, parseTimeToSeconds, normalizeEpreuve } from "../lib/format";
import {
  listGrilles, createGrille, updateGrille, deleteGrille,
  listGrilleTemps, createGrilleTemps, createGrilleTempsBulk, deleteGrilleTemps,
} from "../lib/db";

export default function Qualifications({ swimmers, performances }) {
  const [grilles, setGrilles] = useState([]);
  const [temps, setTemps] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    const [{ data: g }, { data: t }] = await Promise.all([listGrilles(), listGrilleTemps()]);
    setGrilles(g || []);
    setTemps(t || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const bestBySwimmer = useMemo(() => {
    const map = {};
    performances.forEach((p) => {
      const key = p.swimmer_id + "|" + normalizeEpreuve(p.epreuve) + "|" + p.bassin;
      if (!map[key] || p.secondes < map[key].secondes) map[key] = p;
    });
    return map;
  }, [performances]);

  const removeGrille = async (id) => { await deleteGrille(id); load(); };

  if (selectedId) {
    return (
      <GrilleDetail
        grille={grilles.find((g) => g.id === selectedId)}
        temps={temps.filter((t) => t.grille_id === selectedId)}
        swimmers={swimmers}
        bestBySwimmer={bestBySwimmer}
        onBack={() => setSelectedId(null)}
        reload={load}
      />
    );
  }

  return (
    <div className="view">
      <ViewHeader
        eyebrow="Réservé à l'administrateur"
        title="Grilles de qualification"
        action={<button className="btn-primary" onClick={() => setOpenCreate(true)}><Plus size={16} /> Nouvelle grille</button>}
      />
      <div className="panel note">Importez les temps limites d'une compétition (par épreuve, bassin, sexe et année de naissance), et le site vous dira automatiquement quels nageurs sont qualifiés.</div>

      {grilles.length === 0 ? <EmptyState text="Aucune grille créée." /> : (
        <div className="session-list">
          {grilles.map((g) => (
            <div className="session-item" key={g.id}>
              <div>
                <div className="session-card-top">
                  <span className={"pill" + (g.actif ? "" : " pill-ghost")}>{g.actif ? "Active" : "Archivée"}</span>
                  <span className="session-date">{temps.filter((t) => t.grille_id === g.id).length} temps limites</span>
                </div>
                <div className="session-title">{g.nom}</div>
                {g.description && <div className="session-vol">{g.description}</div>}
              </div>
              <div className="session-item-actions">
                <button className="btn-secondary" onClick={() => setSelectedId(g.id)}>Ouvrir</button>
                <button className="icon-btn" onClick={() => removeGrille(g.id)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {openCreate && (
        <Modal title="Nouvelle grille de qualification" onClose={() => setOpenCreate(false)}>
          <CreateGrilleForm onCreated={(id) => { setOpenCreate(false); load(); setSelectedId(id); }} />
        </Modal>
      )}
    </div>
  );
}

function CreateGrilleForm({ onCreated }) {
  const [nom, setNom] = useState("");
  const [description, setDescription] = useState("");
  const create = async () => {
    if (!nom.trim()) return;
    const { data } = await createGrille({ nom: nom.trim(), description, actif: true });
    if (data?.id) onCreated(data.id);
  };
  return (
    <>
      <label>Nom de la compétition</label>
      <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Championnats de France Avenirs 2026" />
      <label>Description (optionnel)</label>
      <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      <button className="btn-primary full" onClick={create}>Créer — vous importerez les temps ensuite</button>
    </>
  );
}

function GrilleDetail({ grille, temps, swimmers, bestBySwimmer, onBack, reload }) {
  const [tab, setTab] = useState("import");
  const [row, setRow] = useState({ epreuve: EPREUVES[0], bassin: "25m", sexe: "", anneeMin: "", anneeMax: "", temps: "" });
  const [bulkText, setBulkText] = useState("");
  const [bulkMsg, setBulkMsg] = useState("");

  if (!grille) return null;

  const addRow = async () => {
    const secs = parseTimeToSeconds(row.temps);
    if (secs == null) return;
    await createGrilleTemps({
      grille_id: grille.id, epreuve: normalizeEpreuve(row.epreuve), bassin: row.bassin, sexe: row.sexe || null,
      annee_naissance_min: row.anneeMin ? Number(row.anneeMin) : null,
      annee_naissance_max: row.anneeMax ? Number(row.anneeMax) : null,
      temps_limite_secondes: secs,
    });
    setRow({ epreuve: EPREUVES[0], bassin: "25m", sexe: "", anneeMin: "", anneeMax: "", temps: "" });
    reload();
  };
  const removeRow = async (id) => { await deleteGrilleTemps(id); reload(); };

  const importBulk = async () => {
    setBulkMsg("");
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    const rows = [];
    const erreurs = [];
    lines.forEach((line, i) => {
      const parts = line.split(";").map((p) => p.trim());
      const [epreuve, bassin, sexe, anneeMin, anneeMax, tempsStr] = parts;
      const epreuveNorm = normalizeEpreuve(epreuve);
      const secs = parseTimeToSeconds(tempsStr);
      if (!epreuveNorm || !bassin || secs == null) { erreurs.push(i + 1); return; }
      rows.push({
        grille_id: grille.id, epreuve: epreuveNorm, bassin, sexe: sexe || null,
        annee_naissance_min: anneeMin ? Number(anneeMin) : null,
        annee_naissance_max: anneeMax ? Number(anneeMax) : null,
        temps_limite_secondes: secs,
      });
    });
    if (rows.length === 0) { setBulkMsg("Aucune ligne valide détectée."); return; }
    const { error } = await createGrilleTempsBulk(rows);
    if (error) { setBulkMsg("Erreur : " + error.message); return; }
    setBulkMsg(`${rows.length} ligne(s) importée(s)${erreurs.length ? `, ${erreurs.length} ligne(s) ignorée(s) (format incorrect)` : ""} ✓`);
    setBulkText("");
    reload();
  };

  const swimmerAge = (s) => (s.naissance && !isNaN(Number(s.naissance))) ? Number(s.naissance) : null;
  const matchRows = (s) => {
    const annee = swimmerAge(s);
    return temps.filter((t) => {
      if (t.sexe && t.sexe !== s.sexe) return false;
      if (annee == null) return t.annee_naissance_min == null && t.annee_naissance_max == null;
      if (t.annee_naissance_min != null && annee < t.annee_naissance_min) return false;
      if (t.annee_naissance_max != null && annee > t.annee_naissance_max) return false;
      return true;
    });
  };

  const qualifs = [];
  swimmers.forEach((s) => {
    matchRows(s).forEach((t) => {
      const best = bestBySwimmer[s.id + "|" + normalizeEpreuve(t.epreuve) + "|" + t.bassin];
      qualifs.push({ swimmer: s, row: t, best, ok: best ? best.secondes <= t.temps_limite_secondes : false });
    });
  });

  return (
    <div className="view">
      <button className="link-btn" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }} onClick={onBack}>
        <ArrowLeft size={15} /> Retour aux grilles
      </button>
      <ViewHeader
        eyebrow={grille.actif ? "Active" : "Archivée"}
        title={grille.nom}
        action={
          <button className="btn-secondary" onClick={async () => { await updateGrille(grille.id, { actif: !grille.actif }); reload(); }}>
            {grille.actif ? "Archiver" : "Réactiver"}
          </button>
        }
      />

      <div className="role-switch" style={{ maxWidth: 340, marginBottom: 16 }}>
        <button className={tab === "import" ? "role-on" : ""} onClick={() => setTab("import")}>Importer les temps</button>
        <button className={tab === "qualifs" ? "role-on" : ""} onClick={() => setTab("qualifs")}>Qui est qualifié ?</button>
      </div>

      {tab === "import" && (
        <>
          <div className="panel">
            <div className="panel-head"><h4><Upload size={15} style={{ verticalAlign: "middle", marginRight: 6 }} />Import en masse</h4></div>
            <p className="login-hint" style={{ marginTop: -6, marginBottom: 10 }}>
              Une ligne par temps limite, séparée par des points-virgules :<br />
              <code>Épreuve;Bassin;Sexe(F/M ou vide);AnnéeMin;AnnéeMax;Temps</code><br />
              Exemple : <code>100 NL;25m;F;2012;2013;1:05.30</code>
            </p>
            <textarea rows={6} value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder={"100 NL;25m;F;2012;2013;1:05.30\n100 NL;25m;M;2011;2012;0:58.20"} />
            <button className="btn-primary" style={{ marginTop: 10 }} onClick={importBulk}>Importer ces lignes</button>
            {bulkMsg && <div className="login-hint" style={{ marginTop: 8 }}>{bulkMsg}</div>}
          </div>

          <div className="panel">
            <div className="panel-head"><h4>Ajouter une ligne manuellement</h4></div>
            <div className="form-row">
              <select value={row.epreuve} onChange={(e) => setRow({ ...row, epreuve: e.target.value })}>
                {EPREUVES.map((ep) => <option key={ep}>{ep}</option>)}
              </select>
              <select value={row.bassin} onChange={(e) => setRow({ ...row, bassin: e.target.value })}>
                {BASSINS.map((b) => <option key={b}>{b}</option>)}
              </select>
              <select value={row.sexe} onChange={(e) => setRow({ ...row, sexe: e.target.value })}>
                <option value="">Tous</option>
                <option value="F">Filles</option>
                <option value="M">Garçons</option>
              </select>
            </div>
            <div className="form-row">
              <input type="number" placeholder="Année naissance min" value={row.anneeMin} onChange={(e) => setRow({ ...row, anneeMin: e.target.value })} />
              <input type="number" placeholder="Année naissance max" value={row.anneeMax} onChange={(e) => setRow({ ...row, anneeMax: e.target.value })} />
              <input placeholder="Temps limite (mm:ss.cc)" value={row.temps} onChange={(e) => setRow({ ...row, temps: e.target.value })} />
              <button className="btn-primary" onClick={addRow}><Plus size={14} /> Ajouter</button>
            </div>
          </div>

          <div className="table">
            <div className="table-row quali-row table-head"><span>Épreuve</span><span>Bassin</span><span>Sexe</span><span>Années</span><span>Temps limite</span><span></span></div>
            {temps.length === 0 ? <div style={{ padding: 16 }}><EmptyState text="Aucun temps importé." /></div> : temps.map((t) => (
              <div className="table-row quali-row" key={t.id}>
                <span>{normalizeEpreuve(t.epreuve)}</span>
                <span>{t.bassin}</span>
                <span>{t.sexe || "Tous"}</span>
                <span>{t.annee_naissance_min || "—"}–{t.annee_naissance_max || "—"}</span>
                <span className="chrono-best">{formatSeconds(t.temps_limite_secondes)}</span>
                <span><button className="icon-btn" onClick={() => removeRow(t.id)}><Trash2 size={15} /></button></span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "qualifs" && (
        qualifs.length === 0 ? <EmptyState text="Aucun temps limite ne correspond encore à vos nageurs (vérifiez sexe / année de naissance renseignés sur leur fiche)." /> : (
          <div className="table">
            <div className="table-row quali-result-row table-head"><span>Nageur</span><span>Épreuve</span><span>Bassin</span><span>Meilleur temps</span><span>Temps limite</span><span>Statut</span></div>
            {qualifs.sort((a, b) => (b.ok - a.ok)).map((q, i) => (
              <div className="table-row quali-result-row" key={i}>
                <span className="strong">{q.swimmer.nom}</span>
                <span>{normalizeEpreuve(q.row.epreuve)}</span>
                <span>{q.row.bassin}</span>
                <span>{q.best ? formatSeconds(q.best.secondes) : "—"}</span>
                <span>{formatSeconds(q.row.temps_limite_secondes)}</span>
                <span style={{ color: q.ok ? "#1E8A5F" : "var(--ink-soft)", display: "flex", alignItems: "center", gap: 4 }}>
                  {q.ok ? <><CheckCircle2 size={15} /> Qualifié(e)</> : <><XCircle size={15} /> Pas encore</>}
                </span>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
