import React, { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, Copy, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import { GROUPES } from "../lib/format";
import { EmptyState } from "../lib/ui";

function copyToClipboard(text) {
  try { navigator.clipboard.writeText(text); return true; } catch { return false; }
}

export default function ComptesAdmin({ swimmers, reload }) {
  const [coachProfiles, setCoachProfiles] = useState([]);
  const [invites, setInvites] = useState([]);
  const [swimForm, setSwimForm] = useState({ prenom: "", nomFamille: "", groupe: GROUPES[0], naissance: "", email: "" });
  const [coachForm, setCoachForm] = useState({ nom: "", email: "" });
  const [msg, setMsg] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const loadAdmin = useCallback(async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").eq("role", "coach");
    const { data: inv } = await supabase.from("invites").select("*").order("created_at", { ascending: false });
    setCoachProfiles(profiles || []);
    setInvites(inv || []);
  }, []);

  useEffect(() => { loadAdmin(); }, [loadAdmin]);

  const createSwimmerAndInvite = async () => {
    setMsg("");
    if (!swimForm.prenom.trim() || !swimForm.nomFamille.trim() || !swimForm.email.trim()) {
      setMsg("Prénom, nom et email sont obligatoires.");
      return;
    }
    const nom = `${swimForm.prenom.trim()} ${swimForm.nomFamille.trim()}`;
    const { data: swimmer, error: e1 } = await supabase
      .from("swimmers")
      .insert({ prenom: swimForm.prenom.trim(), nom_famille: swimForm.nomFamille.trim(), nom, groupe: swimForm.groupe, naissance: swimForm.naissance, email: swimForm.email.trim() })
      .select().single();
    if (e1) { setMsg("Erreur lors de la création du nageur : " + e1.message); return; }
    const { error: e2 } = await supabase.from("invites").insert({ email: swimForm.email.trim(), role: "famille", swimmer_id: swimmer.id, nom });
    setMsg(e2 ? "Nageur créé, mais l'invitation a échoué." : `"${nom}" créé. Invitez maintenant ${swimForm.email} depuis Supabase → Authentication → Users → Invite user.`);
    setSwimForm({ prenom: "", nomFamille: "", groupe: GROUPES[0], naissance: "", email: "" });
    reload();
    loadAdmin();
  };

  const createCoachInvite = async () => {
    setMsg("");
    if (!coachForm.nom.trim() || !coachForm.email.trim()) { setMsg("Nom et email sont obligatoires."); return; }
    const { error } = await supabase.from("invites").insert({ email: coachForm.email.trim(), role: "coach", nom: coachForm.nom.trim() });
    setMsg(error ? "Erreur lors de la création de l'invitation." : `Invitation préparée pour ${coachForm.nom}. Invitez maintenant ${coachForm.email} depuis Supabase → Authentication → Users → Invite user.`);
    setCoachForm({ nom: "", email: "" });
    loadAdmin();
  };

  const removeSwimmer = async (id) => { await supabase.from("swimmers").delete().eq("id", id); reload(); };
  const removeCoach = async (id) => { await supabase.from("profiles").delete().eq("id", id); loadAdmin(); };
  const removeInvite = async (email) => { await supabase.from("invites").delete().eq("email", email); loadAdmin(); };

  const inviteText = (s) =>
    `Bonjour,\n\nVoici votre accès à l'espace suivi du club pour ${s.nom} :\n1. Ouvrez le lien de l'application.\n2. Entrez votre email : ${s.email}\n3. Cliquez sur le lien reçu par email pour vous connecter.\n\nVous pourrez y consulter les séances, les performances et faire le check de forme du matin.\n\nSportivement,\nLe club`;

  const copyInvite = (s) => {
    const ok = copyToClipboard(inviteText(s));
    setCopiedId(ok ? s.id : null);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="view">
      <div className="view-head"><div><div className="eyebrow">Réservé à l'administrateur</div><h2>Comptes & accès</h2></div></div>

      <div className="panel note">
        <ShieldCheck size={15} />
        <span>
          Vous seul(e) pouvez créer des comptes coach et des fiches nageur. Pas d'envoi d'email automatique par ce
          bouton — une fois préparé ici, allez dans Supabase → Authentication → Users → Invite user avec le même
          email : c'est cet envoi-là qui déclenche le vrai email.
        </span>
      </div>

      <div className="panel">
        <div className="panel-head"><h4>Inviter un coach</h4></div>
        <div className="form-row">
          <input placeholder="Nom du coach" value={coachForm.nom} onChange={(e) => setCoachForm({ ...coachForm, nom: e.target.value })} />
          <input placeholder="Email" type="email" value={coachForm.email} onChange={(e) => setCoachForm({ ...coachForm, email: e.target.value })} />
          <button className="btn-primary" onClick={createCoachInvite}><Plus size={14} /> Préparer</button>
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
          <input placeholder="Email de la famille" type="email" value={swimForm.email} onChange={(e) => setSwimForm({ ...swimForm, email: e.target.value })} />
          <button className="btn-primary" onClick={createSwimmerAndInvite}><Plus size={14} /> Créer & préparer</button>
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
        <div className="panel-head"><h4>Nageurs ({swimmers.length})</h4></div>
        {swimmers.length === 0 ? <EmptyState text="Aucun nageur créé." /> : (
          swimmers.map((s) => (
            <div key={s.id} className="row-line" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
              <span>{s.nom} — {s.groupe} — {s.email}</span>
              <span className="table-actions">
                <button className="icon-btn" title="Copier le message d'invitation" onClick={() => copyInvite(s)}><Copy size={15} /></button>
                <button className="icon-btn" onClick={() => removeSwimmer(s.id)}><Trash2 size={15} /></button>
              </span>
              {copiedId === s.id && <span style={{ position: "absolute", right: 40, top: -6, background: "#1E8A5F", color: "#fff", fontSize: 10.5, fontWeight: 600, padding: "2px 8px", borderRadius: 12 }}>Copié ✓</span>}
            </div>
          ))
        )}
      </div>

      <div className="panel">
        <div className="panel-head"><h4>Invitations en attente de première connexion ({invites.length})</h4></div>
        {invites.length === 0 ? <EmptyState text="Aucune invitation en attente." /> : (
          invites.map((i) => (
            <div key={i.email} className="row-line" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>{i.nom} — {i.role} — {i.email}</span>
              <button className="icon-btn" onClick={() => removeInvite(i.email)}><Trash2 size={15} /></button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
