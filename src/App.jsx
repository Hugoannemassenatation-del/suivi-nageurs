import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "./lib/supabase";

const GROUPES = ["Junior Bleu", "Junior Jaune"];

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sendLink = async () => {
    setError("");
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) setError("Une erreur est survenue. Réessayez.");
    else setSent(true);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-title">SUIVI NAGEURS</div>
        </div>
        {sent ? (
          <div className="login-sent">
            <p>Un lien de connexion vient d'être envoyé à <strong>{email}</strong>.</p>
            <p className="login-hint">Ouvrez votre boîte mail et cliquez sur le lien pour vous connecter — aucun mot de passe à retenir.</p>
          </div>
        ) : (
          <>
            <p className="login-intro">Connexion par email</p>
            <label>Adresse email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.com" type="email" />
            {error && <div className="login-error">{error}</div>}
            <button className="btn-primary full" disabled={loading} onClick={sendLink}>
              {loading ? "Envoi…" : "Recevoir mon lien de connexion"}
            </button>
            <p className="login-hint" style={{ marginTop: 14 }}>
              Si votre email n'a pas encore été invité par l'administrateur du club, le lien ne fonctionnera pas.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function BootstrapAdmin({ user, onDone }) {
  const [nom, setNom] = useState("");
  const [error, setError] = useState("");

  const become = async () => {
    if (!nom.trim()) { setError("Entrez votre nom."); return; }
    const { error } = await supabase.from("profiles").insert({ id: user.id, role: "admin", nom: nom.trim() });
    if (error) setError("Impossible de créer le compte administrateur (peut-être déjà pris).");
    else onDone();
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand"><div className="brand-title">SUIVI NAGEURS</div></div>
        <p className="login-intro">Bienvenue — premier accès</p>
        <p className="login-hint">Aucun administrateur n'existe encore pour ce club. Devenez l'administrateur pour pouvoir créer les comptes coachs et nageurs.</p>
        <label>Votre nom</label>
        <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Hugo" />
        {error && <div className="login-error">{error}</div>}
        <button className="btn-primary full" onClick={become}>Devenir administrateur</button>
      </div>
    </div>
  );
}

function PendingProfile({ email, onRetry }) {
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand"><div className="brand-title">SUIVI NAGEURS</div></div>
        <p className="login-intro">En attente d'activation</p>
        <p className="login-hint">
          Votre email (<strong>{email}</strong>) est connecté, mais aucun rôle ne vous a encore été attribué.
          Demandez à l'administrateur du club de vous ajouter, puis reconnectez-vous.
        </p>
        <button className="btn-secondary full" onClick={onRetry}>Réessayer</button>
        <button className="link-btn" style={{ marginTop: 10 }} onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
      </div>
    </div>
  );
}

function AdminInvites({ profile }) {
  const [swimmers, setSwimmers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [swimForm, setSwimForm] = useState({ prenom: "", nomFamille: "", groupe: GROUPES[0], naissance: "", email: "" });
  const [coachForm, setCoachForm] = useState({ nom: "", email: "" });
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { data: sw } = await supabase.from("swimmers").select("*").order("nom");
    const { data: inv } = await supabase.from("invites").select("*").order("created_at", { ascending: false });
    setSwimmers(sw || []);
    setInvites(inv || []);
  }, []);

  useEffect(() => { load(); }, [load]);

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
      .select()
      .single();
    if (e1) { setMsg("Erreur lors de la création du nageur."); return; }
    const { error: e2 } = await supabase.from("invites").insert({ email: swimForm.email.trim(), role: "famille", swimmer_id: swimmer.id, nom });
    if (e2) { setMsg("Nageur créé, mais l'invitation a échoué."); }
    else setMsg(`"${nom}" créé. Invitez maintenant ${swimForm.email} depuis Supabase → Authentication → Users → Invite user.`);
    setSwimForm({ prenom: "", nomFamille: "", groupe: GROUPES[0], naissance: "", email: "" });
    load();
  };

  const createCoachInvite = async () => {
    setMsg("");
    if (!coachForm.nom.trim() || !coachForm.email.trim()) { setMsg("Nom et email sont obligatoires."); return; }
    const { error } = await supabase.from("invites").insert({ email: coachForm.email.trim(), role: "coach", nom: coachForm.nom.trim() });
    if (error) setMsg("Erreur lors de la création de l'invitation.");
    else setMsg(`Invitation préparée pour ${coachForm.nom}. Invitez maintenant ${coachForm.email} depuis Supabase → Authentication → Users → Invite user.`);
    setCoachForm({ nom: "", email: "" });
    load();
  };

  return (
    <div className="panel-stack">
      <div className="panel note">
        Étape 1 sur cette page : préparez le rôle (ci-dessous). Étape 2, obligatoire : allez dans votre tableau de bord Supabase →
        <strong> Authentication → Users → Invite user</strong>, et entrez le même email. C'est cet envoi-là qui déclenche le vrai email automatique.
      </div>

      <div className="panel">
        <h4>Inviter un coach</h4>
        <div className="form-row">
          <input placeholder="Nom du coach" value={coachForm.nom} onChange={(e) => setCoachForm({ ...coachForm, nom: e.target.value })} />
          <input placeholder="Email" type="email" value={coachForm.email} onChange={(e) => setCoachForm({ ...coachForm, email: e.target.value })} />
          <button className="btn-primary" onClick={createCoachInvite}>Préparer</button>
        </div>
      </div>

      <div className="panel">
        <h4>Créer un nageur & inviter la famille</h4>
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
          <button className="btn-primary" onClick={createSwimmerAndInvite}>Créer & préparer</button>
        </div>
      </div>

      {msg && <div className="panel note">{msg}</div>}

      <div className="panel">
        <h4>Nageurs ({swimmers.length})</h4>
        {swimmers.map((s) => (
          <div key={s.id} className="row-line">{s.nom} — {s.groupe} — {s.email}</div>
        ))}
      </div>

      <div className="panel">
        <h4>Invitations préparées, en attente de première connexion ({invites.length})</h4>
        {invites.map((i) => (
          <div key={i.email} className="row-line">{i.nom} — {i.role} — {i.email}</div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(undefined);

  const loadProfile = useCallback(async (uid) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    setProfile(data || null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session) loadProfile(data.session.user.id);
      else setProfile(null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess) loadProfile(sess.user.id);
      else setProfile(null);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  if (session === undefined) return <div className="app"><LoginStyles /><div style={{ padding: 40 }}>Chargement…</div></div>;

  if (!session) {
    return <div className="app"><LoginStyles /><LoginScreen /></div>;
  }

  if (profile === undefined) return <div className="app"><LoginStyles /><div style={{ padding: 40 }}>Chargement…</div></div>;

  if (profile === null) {
    return (
      <div className="app">
        <LoginStyles />
        <FirstLoginResolver session={session} onProfile={setProfile} />
      </div>
    );
  }

  return (
    <div className="app">
      <LoginStyles />
      <div className="shell">
        <div className="topbar">
          <div className="brand-title">SUIVI NAGEURS</div>
          <div className="topbar-user">
            {profile.nom} · {profile.role}
            <button className="link-btn" onClick={() => supabase.auth.signOut()} style={{ marginLeft: 12 }}>Se déconnecter</button>
          </div>
        </div>
        <div className="content">
          {profile.role === "admin" && <AdminInvites profile={profile} />}
          {profile.role !== "admin" && (
            <div className="panel note">
              Connecté en tant que <strong>{profile.role}</strong>. Les écrans séances, présences, performances, VMA,
              forme du matin, calendrier et communication arrivent à l'étape 2 de la migration.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FirstLoginResolver({ session, onProfile }) {
  const [checked, setChecked] = useState(false);
  const [needBootstrap, setNeedBootstrap] = useState(false);
  const [email] = useState(session.user.email);

  const check = useCallback(async () => {
    setChecked(false);
    const { data: anyAdmin } = await supabase.from("profiles").select("id").eq("role", "admin").limit(1);
    if (!anyAdmin || anyAdmin.length === 0) {
      setNeedBootstrap(true);
      setChecked(true);
      return;
    }
    const { data: invite } = await supabase.from("invites").select("*").eq("email", email).maybeSingle();
    if (invite) {
      const { data: newProfile, error } = await supabase
        .from("profiles")
        .insert({ id: session.user.id, role: invite.role, swimmer_id: invite.swimmer_id, nom: invite.nom })
        .select()
        .single();
      if (!error) {
        await supabase.from("invites").delete().eq("email", email);
        onProfile(newProfile);
        return;
      }
    }
    setNeedBootstrap(false);
    setChecked(true);
  }, [email, session.user.id, onProfile]);

  useEffect(() => { check(); }, [check]);

  if (!checked) return <div style={{ padding: 40 }}>Vérification de votre accès…</div>;
  if (needBootstrap) return <BootstrapAdmin user={session.user} onDone={() => window.location.reload()} />;
  return <PendingProfile email={email} onRetry={check} />;
}

function LoginStyles() {
  return (
    <style>{`
      :root{
        --pool-deep:#0B2A63; --pool-mid:#1E52C8; --chrono:#D1272B; --foam:#F3F6FB;
        --panel:#FFFFFF; --ink:#0B1E3D; --ink-soft:#55647A; --line-faint:#DCE3F0; --radius:10px;
      }
      *{box-sizing:border-box;}
      body{margin:0;}
      .app{ min-height:100vh; background:var(--foam); font-family:'Inter',sans-serif; color:var(--ink); }
      .brand-title{ font-family:'Space Grotesk',sans-serif; font-size:15px; font-weight:700; letter-spacing:0.04em; }
      .login-screen{ min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px;
        background: radial-gradient(circle at 20% 15%, #1B3F8F 0%, var(--pool-deep) 55%, #061640 100%); }
      .login-card{ background:#fff; border-radius:16px; padding:28px 26px; width:100%; max-width:380px; box-shadow:0 20px 50px rgba(5,25,32,0.35); }
      .login-brand{ color:var(--chrono); margin-bottom:18px; }
      .login-intro{ font-size:13px; font-weight:600; color:var(--ink-soft); margin:0 0 12px; text-transform:uppercase; letter-spacing:0.04em; }
      .login-hint{ font-size:12px; color:var(--ink-soft); line-height:1.5; }
      .login-error{ color:var(--chrono); font-size:12.5px; margin:8px 0; }
      .login-sent{ font-size:13.5px; line-height:1.6; }
      label{ display:block; font-size:11.5px; font-weight:600; color:var(--ink-soft); margin:10px 0 4px; text-transform:uppercase; }
      input, select{ width:100%; border:1px solid var(--line-faint); border-radius:7px; padding:9px 10px; font-size:13.5px; font-family:'Inter',sans-serif; }
      .btn-primary{ display:inline-flex; align-items:center; justify-content:center; gap:6px; background:var(--chrono); color:#fff; border:none; padding:10px 16px; border-radius:8px; font-weight:600; font-size:13px; cursor:pointer; }
      .btn-primary.full{ width:100%; margin-top:14px; }
      .btn-secondary{ background:var(--foam); border:1px solid var(--line-faint); padding:9px 16px; border-radius:8px; font-weight:600; font-size:13px; cursor:pointer; }
      .btn-secondary.full{ width:100%; }
      .link-btn{ background:none; border:none; color:var(--pool-mid); font-size:12.5px; font-weight:600; cursor:pointer; }
      .shell{ max-width:1000px; margin:0 auto; }
      .topbar{ display:flex; justify-content:space-between; align-items:center; padding:20px 24px; }
      .topbar-user{ font-size:13px; color:var(--ink-soft); }
      .content{ padding:0 24px 40px; }
      .panel-stack{ display:flex; flex-direction:column; gap:16px; }
      .panel{ background:var(--panel); border:1px solid var(--line-faint); border-radius:var(--radius); padding:18px; }
      .panel.note{ background:#EAF1FB; border-color:#C7D9F5; font-size:13px; color:var(--pool-deep); }
      .panel h4{ margin:0 0 12px; font-family:'Space Grotesk',sans-serif; font-size:14px; }
      .form-row{ display:flex; gap:8px; margin-bottom:8px; flex-wrap:wrap; }
      .form-row input, .form-row select{ flex:1; min-width:140px; }
      .row-line{ font-size:13px; padding:6px 0; border-bottom:1px solid var(--line-faint); }
      .row-line:last-child{ border-bottom:none; }
    `}</style>
  );
}
