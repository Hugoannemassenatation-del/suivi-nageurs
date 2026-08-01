import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

export function LoginScreen() {
  const [mode, setMode] = useState("checking"); // checking | signin | signup-admin | magic | magic-sent | confirm-sent
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.rpc("admin_exists").then(({ data }) => setMode(data ? "signin" : "signup-admin"));
  }, []);

  const signIn = async () => {
    setError("");
    if (!email.trim() || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setError("Email ou mot de passe incorrect.");
  };

  const signUpAdmin = async () => {
    setError("");
    if (!email.trim() || password.length < 6) { setError("Le mot de passe doit faire au moins 6 caractères."); return; }
    if (password !== password2) { setError("Les deux mots de passe ne correspondent pas."); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
    setLoading(false);
    if (error) { setError("Une erreur est survenue : " + error.message); return; }
    if (!data.session) setMode("confirm-sent");
    // si une session est retournée immédiatement, l'app détecte la connexion toute seule
  };

  const sendMagicLink = async () => {
    setError("");
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: false, emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) setError("Une erreur est survenue.");
    else setMode("magic-sent");
  };

  if (mode === "checking") {
    return <div className="login-screen"><div style={{ color: "#fff" }}>Chargement…</div></div>;
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand"><img src="/logo.png" alt="Annemasse Natation" className="login-logo" /><div className="brand-title" style={{ color: "var(--chrono)" }}>SUIVI NAGEURS</div></div>

        {mode === "signin" && (
          <>
            <p className="login-intro">Connexion</p>
            <label>Adresse email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.com" type="email" />
            <label>Mot de passe</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
            {error && <div className="login-error">{error}</div>}
            <button className="btn-primary full" disabled={loading} onClick={signIn}>{loading ? "Connexion…" : "Se connecter"}</button>
            <button className="link-btn" style={{ marginTop: 14 }} onClick={() => { setMode("magic"); setError(""); }}>
              Mot de passe oublié / première connexion ?
            </button>
          </>
        )}

        {mode === "magic" && (
          <>
            <p className="login-intro">Recevoir un lien de connexion</p>
            <p className="login-hint">Utile si vous n'avez pas encore de mot de passe, ou si vous l'avez oublié.</p>
            <label>Adresse email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.com" type="email" />
            {error && <div className="login-error">{error}</div>}
            <button className="btn-primary full" disabled={loading} onClick={sendMagicLink}>{loading ? "Envoi…" : "Recevoir mon lien de connexion"}</button>
            <button className="link-btn" style={{ marginTop: 14 }} onClick={() => { setMode("signin"); setError(""); }}>Retour à la connexion</button>
          </>
        )}

        {mode === "magic-sent" && (
          <div className="login-sent">
            <p>Un lien de connexion vient d'être envoyé à <strong>{email}</strong>.</p>
            <p className="login-hint">Ouvrez votre boîte mail et cliquez sur le lien. Vous pourrez ensuite créer votre mot de passe.</p>
          </div>
        )}

        {mode === "signup-admin" && (
          <>
            <p className="login-intro">Premier accès — compte administrateur</p>
            <p className="login-hint">Aucun administrateur n'existe encore pour ce club. Créez le premier compte.</p>
            <label>Adresse email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.com" type="email" />
            <label>Mot de passe (6 caractères minimum)</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" />
            <label>Confirmer le mot de passe</label>
            <input value={password2} onChange={(e) => setPassword2(e.target.value)} type="password" placeholder="••••••••" />
            {error && <div className="login-error">{error}</div>}
            <button className="btn-primary full" disabled={loading} onClick={signUpAdmin}>{loading ? "Création…" : "Créer le compte administrateur"}</button>
          </>
        )}

        {mode === "confirm-sent" && (
          <div className="login-sent">
            <p>Un email de confirmation vient d'être envoyé à <strong>{email}</strong>.</p>
            <p className="login-hint">Cliquez sur le lien qu'il contient pour activer votre compte administrateur.</p>
          </div>
        )}

        <p className="login-note">Les codes protègent l'accès à l'usage courant.</p>
      </div>
    </div>
  );
}

export function SetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError("");
    if (password.length < 6) { setError("Le mot de passe doit faire au moins 6 caractères."); return; }
    if (password !== password2) { setError("Les deux mots de passe ne correspondent pas."); return; }
    setLoading(true);
    const { error: e1 } = await supabase.auth.updateUser({ password });
    if (e1) { setLoading(false); setError("Impossible d'enregistrer le mot de passe."); return; }
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("profiles").update({ password_set: true }).eq("id", user.id);
    setLoading(false);
    onDone();
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand"><img src="/logo.png" alt="Annemasse Natation" className="login-logo" /><div className="brand-title" style={{ color: "var(--chrono)" }}>SUIVI NAGEURS</div></div>
        <p className="login-intro">Créez votre mot de passe</p>
        <p className="login-hint">Vous n'aurez besoin que de votre email et ce mot de passe pour vous connecter la prochaine fois.</p>
        <label>Mot de passe (6 caractères minimum)</label>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" autoFocus />
        <label>Confirmer le mot de passe</label>
        <input value={password2} onChange={(e) => setPassword2(e.target.value)} type="password" placeholder="••••••••" />
        {error && <div className="login-error">{error}</div>}
        <button className="btn-primary full" disabled={loading} onClick={submit}>{loading ? "Enregistrement…" : "Enregistrer mon mot de passe"}</button>
      </div>
    </div>
  );
}

export function BootstrapAdmin({ user, onDone }) {
  const [nom, setNom] = useState("");
  const [error, setError] = useState("");

  const become = async () => {
    if (!nom.trim()) { setError("Entrez votre nom."); return; }
    const { error } = await supabase.from("profiles").insert({ id: user.id, role: "admin", nom: nom.trim(), password_set: true });
    if (error) setError("Impossible de créer le compte administrateur.");
    else onDone();
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand"><img src="/logo.png" alt="Annemasse Natation" className="login-logo" /><div className="brand-title" style={{ color: "var(--chrono)" }}>SUIVI NAGEURS</div></div>
        <p className="login-intro">Bienvenue</p>
        <p className="login-hint">Dernière étape : indiquez votre nom pour finaliser votre compte administrateur.</p>
        <label>Votre nom</label>
        <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Hugo" autoFocus />
        {error && <div className="login-error">{error}</div>}
        <button className="btn-primary full" onClick={become}>Terminer</button>
      </div>
    </div>
  );
}

export function PendingProfile({ email, onRetry }) {
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand"><img src="/logo.png" alt="Annemasse Natation" className="login-logo" /><div className="brand-title" style={{ color: "var(--chrono)" }}>SUIVI NAGEURS</div></div>
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

export function FirstLoginResolver({ session, onProfile }) {
  const [checked, setChecked] = useState(false);
  const [needBootstrap, setNeedBootstrap] = useState(false);
  const [claimedProfile, setClaimedProfile] = useState(null);
  const email = session.user.email;

  const check = useCallback(async () => {
    setChecked(false);
    const { data: hasAdmin } = await supabase.rpc("admin_exists");
    if (!hasAdmin) { setNeedBootstrap(true); setChecked(true); return; }
    const { data: invite } = await supabase.from("invites").select("*").eq("email", email).maybeSingle();
    if (invite) {
      const { data: newProfile, error } = await supabase
        .from("profiles")
        .insert({ id: session.user.id, role: invite.role, swimmer_id: invite.swimmer_id, nom: invite.nom })
        .select().single();
      if (!error) {
        await supabase.from("invites").delete().eq("email", email);
        setClaimedProfile(newProfile);
        setChecked(true);
        return;
      }
    }
    setNeedBootstrap(false);
    setChecked(true);
  }, [email, session.user.id]);

  useEffect(() => { check(); }, [check]);

  if (!checked) return <div style={{ padding: 40 }}>Vérification de votre accès…</div>;
  if (needBootstrap) return <BootstrapAdmin user={session.user} onDone={() => window.location.reload()} />;
  if (claimedProfile) {
    if (claimedProfile.password_set) { onProfile(claimedProfile); return null; }
    return <SetPasswordScreen onDone={() => onProfile({ ...claimedProfile, password_set: true })} />;
  }
  return <PendingProfile email={email} onRetry={check} />;
}

