import React, { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, ShieldCheck, Mail } from "lucide-react";
import { supabase } from "../lib/supabase";
import { GROUPES } from "../lib/format";
import { EmptyState } from "../lib/ui";

async function sendInvite(email) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { ok: false, error: "Session expirée, reconnectez-vous." };
  try {
    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ email, redirectTo: window.location.origin }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || "Erreur lors de l'envoi." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Impossible de contacter le serveur d'envoi." };
  }
}

export default function ComptesAdmin({ swimmers, reload }) {
  const [coachProfiles, setCoachProfiles] = useState([]);
  const [familyProfiles, setFamilyProfiles] = useState([]);
  const [invites, setInvites] = useState([]);
  const [swimForm, setSwimForm] = useState({ prenom: "", nomFamille: "", groupe: GROUPES[0], naissance: "", sexe: "", familleRole: "parent", email: "" });
  const [coachForm, setCoachForm] = useState({ nom: "", email: "" });
  const [extraForm, setExtraForm] = useState({ swimmerId: "", nom: "", familleRole: "parent", email: "" });
  const [msg, setMsg] = useState("");
  const [sending, setSending] = useState(false);

  const loadAdmin = useCallback(async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").eq("role", "coach");
    const { data: fam } = await supabase.from("profiles").select("*").eq("role", "famille");
    const { data: inv } = await supabase.from("invites").select("*").order("created_at", { ascending: false });
    setCoachProfiles(profiles || []);
    setFamilyProfiles(fam || []);
    setInvites(inv || []);
  }, []);

  useEffect(() => { loadAdmin(); }, [loadAdmin]);

  const createSwimmerAndInvite = async () => {
    setMsg(""); setSending(true);
    if (!swimForm.prenom.trim() || !swimForm.nomFamille.trim() || !swimForm.email.trim()) {
      setMsg("Prénom, nom et email sont obligatoires."); setSending(false); return;
    }
    const nom = `${swimForm.prenom.trim()} ${swimForm.nomFamille.trim()}`;
    const email = swimForm.email.trim();
    const { data: swimmer, error: e1 } = await supabase
      .from("swimmers")
      .insert({ prenom: swimForm.prenom.trim(), nom_famille: swimForm.nomFamille.trim(), nom, groupe: swimForm.groupe, naissance: swimForm.naissance, sexe: swimForm.sexe || null, email })
      .select().single();
    if (e1) { setMsg("Erreur lors de la création du nageur : " + e1.message); setSending(false); return; }
    await supabase.from("invites").insert({ email, role: "famille", famille_role: swimForm.familleRole, swimmer_id: swimmer.id, nom });

    const result = await sendInvite(email);
    setMsg(result.ok ? `"${nom}" créé — email d'invitation envoyé à ${email} ✓` : `"${nom}" créé, mais l'envoi a échoué : ${result.error}`);
    setSwimForm({ prenom: "", nomFamille: "", groupe: GROUPES[0], naissance: "", sexe: "", familleRole: "parent", email: "" });
    setSending(false);
    reload();
    loadAdmin();
  };

  const createCoachInvite = async () => {
    setMsg(""); setSending(true);
    if (!coachForm.nom.trim() || !coachForm.email.trim()) { setMsg("Nom et email sont obligatoires."); setSending(false); return; }
    const email = coachForm.email.trim();
    const { error } = await supabase.from("invites").insert({ email, role: "coach", nom: coachForm.nom.trim() });
    if (error) { setMsg("Erreur lors de la préparation de l'invitation."); setSending(false); return; }

    const result = await sendInvite(email);
    setMsg(result.ok ? `Invitation envoyée à ${coachForm.nom} (${email}) ✓` : `Invitation préparée, mais l'envoi a échoué : ${result.error}`);
    setCoachForm({ nom: "", email: "" });
    setSending(false);
    loadAdmin();
  };

  const createExtraFamilyInvite = async () => {
    setMsg(""); setSending(true);
    if (!extraForm.swimmerId || !extraForm.nom.trim() || !extraForm.email.trim()) {
      setMsg("Nageur, nom et email sont obligatoires."); setSending(false); return;
    }
    const email = extraForm.email.trim();
    const { error } = await supabase.from("invites").insert({
      email, role: "famille", famille_role: extraForm.familleRole, swimmer_id: extraForm.swimmerId, nom: extraForm.nom.trim(),
    });
    if (error) { setMsg("Erreur lors de la préparation de l'invitation."); setSending(false); return; }
    const result = await sendInvite(email);
    setMsg(result.ok ? `Invitation envoyée à ${extraForm.nom} (${email}) ✓` : `Invitation préparée, mais l'envoi a échoué : ${result.error}`);
    setExtraForm({ swimmerId: "", nom: "", familleRole: "parent", email: "" });
    setSending(false);
    loadAdmin();
  };

  const resendInvite = async (email, label) => {
    setMsg("");
    const result = await sendInvite(email);
    setMsg(result.ok ? `Email renvoyé à ${label} ✓` : `Échec de l'envoi : ${result.error}`);
  };

  const removeSwimmer = async (id) => { await supabase.from("swimmers").delete().eq("id", id); reload(); };
  const removeCoach = async (id) => { await supabase.from("profiles").delete().eq("id", id); loadAdmin(); };
  const removeInvite = async (email) => { await supabase.from("invites").delete().eq("email", email); loadAdmin(); };

  return (
    <div className="view">
      <div className="view-head"><div><div className="eyebrow">Réservé à l'administrateur</div><h2>Comptes & accès</h2></div></div>

      <div className="panel note">
        <ShieldCheck size={15} />
        <span>Vous seul(e) pouvez créer des comptes coach et des fiches nageur. Les emails d'invitation partent automatiquement dès que vous cliquez sur "Créer" ou "Préparer".</span>
      </div>

      <div className="panel">
        <div className="panel-head"><h4>Inviter un coach</h4></div>
        <div className="form-row">
          <input placeholder="Nom du coach" value={coachForm.nom} onChange={(e) => setCoachForm({ ...coachForm, nom: e.target.value })} />
          <input placeholder="Email" type="email" value={coachForm.email} onChange={(e) => setCoachForm({ ...coachForm, email: e.target.value })} />
          <button className="btn-primary" disabled={sending} onClick={createCoachInvite}><Plus size={14} /> {sending ? "Envoi…" : "Préparer et envoyer"}</button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h4>Créer un nageur & inviter la famille</h4></div>
        <div className="form-row">
          <input placeholder="Prénom" value={swimForm.prenom} onChange={(e) => setSwimForm({ ...swimForm, prenom: e.target.value })} />
          <input placeholder="Nom" value={swimForm.nomFamille} onChange={(e) => setSwimForm({ ...swimForm, nomFamille: e.target.value })} />
          <select value={swimForm.groupe} onChange={(e) => setSwimForm({ ...swimForm, groupe: e.target.value })}>
            {GROUPES.map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div className="form-row">
          <input placeholder="Année de naissance" value={swimForm.naissance} onChange={(e) => setSwimForm({ ...swimForm, naissance: e.target.value })} />
          <select value={swimForm.sexe} onChange={(e) => setSwimForm({ ...swimForm, sexe: e.target.value })}>
            <option value="">Sexe (optionnel)</option>
            <option value="F">Fille</option>
            <option value="M">Garçon</option>
          </select>
        </div>
        <div className="form-row">
          <select value={swimForm.familleRole} onChange={(e) => setSwimForm({ ...swimForm, familleRole: e.target.value })}>
            <option value="parent">Compte pour : Parent</option>
            <option value="nageur">Compte pour : Nageur</option>
          </select>
          <input placeholder="Email du 1er accès" type="email" value={swimForm.email} onChange={(e) => setSwimForm({ ...swimForm, email: e.target.value })} />
          <button className="btn-primary" disabled={sending} onClick={createSwimmerAndInvite}><Plus size={14} /> {sending ? "Envoi…" : "Créer et envoyer"}</button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h4>Ajouter un accès supplémentaire (parent ou nageur)</h4></div>
        <p className="login-hint" style={{ marginTop: -6, marginBottom: 10 }}>Pour donner un accès autonome au parent ET au nageur d'une même famille — chacun avec son propre email et mot de passe.</p>
        <div className="form-row">
          <select value={extraForm.swimmerId} onChange={(e) => setExtraForm({ ...extraForm, swimmerId: e.target.value })}>
            <option value="">Nageur concerné…</option>
            {swimmers.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
          </select>
          <select value={extraForm.familleRole} onChange={(e) => setExtraForm({ ...extraForm, familleRole: e.target.value })}>
            <option value="parent">Compte pour : Parent</option>
            <option value="nageur">Compte pour : Nageur</option>
          </select>
        </div>
        <div className="form-row">
          <input placeholder="Nom de la personne" value={extraForm.nom} onChange={(e) => setExtraForm({ ...extraForm, nom: e.target.value })} />
          <input placeholder="Email" type="email" value={extraForm.email} onChange={(e) => setExtraForm({ ...extraForm, email: e.target.value })} />
          <button className="btn-primary" disabled={sending} onClick={createExtraFamilyInvite}><Plus size={14} /> {sending ? "Envoi…" : "Préparer et envoyer"}</button>
        </div>
      </div>

      {msg && <div className="panel note">{msg}</div>}

      <div className="panel">
        <div className="panel-head"><h4>Coachs actifs ({coachProfiles.length})</h4></div>
        {coachProfiles.length === 0 ? <EmptyState text="Aucun coach n'a encore rejoint l'application." /> : (
          coachProfiles.map((c) => (
            <div key={c.id} className="row-line" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{c.nom}</span>
              <button className="icon-btn" onClick={() => removeCoach(c.id)}><Trash2 size={15} /></button>
            </div>
          ))
        )}
      </div>

      <div className="panel">
        <div className="panel-head"><h4>Comptes famille actifs ({familyProfiles.length})</h4></div>
        {familyProfiles.length === 0 ? <EmptyState text="Aucun parent/nageur n'a encore rejoint l'application." /> : (
          familyProfiles.map((p) => (
            <div key={p.id} className="row-line" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{p.nom} — {p.famille_role === "nageur" ? "Nageur" : "Parent"} de {swimmers.find((s) => s.id === p.swimmer_id)?.nom || "—"}</span>
              <button className="icon-btn" onClick={async () => { await supabase.from("profiles").delete().eq("id", p.id); loadAdmin(); }}><Trash2 size={15} /></button>
            </div>
          ))
        )}
      </div>

      <div className="panel">
        <div className="panel-head"><h4>Nageurs ({swimmers.length})</h4></div>
        {swimmers.length === 0 ? <EmptyState text="Aucun nageur créé." /> : (
          swimmers.map((s) => (
            <div key={s.id} className="row-line" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{s.nom} — {s.groupe} — {s.email}</span>
              <button className="icon-btn" onClick={() => removeSwimmer(s.id)}><Trash2 size={15} /></button>
            </div>
          ))
        )}
      </div>

      <div className="panel">
        <div className="panel-head"><h4>Invitations en attente de première connexion ({invites.length})</h4></div>
        {invites.length === 0 ? <EmptyState text="Aucune invitation en attente." /> : (
          invites.map((i) => (
            <div key={i.email} className="row-line" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{i.nom} — {i.role} — {i.email}</span>
              <span className="table-actions">
                <button className="icon-btn" title="Renvoyer l'email" onClick={() => resendInvite(i.email, i.nom)}><Mail size={15} /></button>
                <button className="icon-btn" onClick={() => removeInvite(i.email)}><Trash2 size={15} /></button>
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
