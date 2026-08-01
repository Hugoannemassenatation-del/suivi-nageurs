import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabase";

export function LoginScreen() {
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
        <div className="login-brand"><img src="/logo.png" alt="Annemasse Natation" className="login-logo" /><div className="brand-title" style={{ color: "var(--chrono)" }}>SUIVI NAGEURS</div></div>
        {sent ? (
          <div className="login-sent">
            <p>Un lien de connexion vient d'être envoyé à <strong>{email}</strong>.</p>
            <p className="login-hint">Ouvrez votre boîte mail et cliquez sur le lien — aucun mot de passe à retenir.</p>
          </div>
        ) : (
          <>
            <p className="login-intro">Connexion par email</p>
            <label>Adresse email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@email.com" type="email" />
            {error && <div className="login-error">{error}</div>}
            <button className="btn-primary full" disabled={loading} onClick={sendLink}>{loading ? "Envoi…" : "Recevoir mon lien de connexion"}</button>
            <p className="login-hint" style={{ marginTop: 14 }}>Si votre email n'a pas encore été invité par l'administrateur du club, le lien ne fonctionnera pas.</p>
          </>
        )}
      </div>
    </div>
  );
}

export function BootstrapAdmin({ user, onDone }) {
  const [nom, setNom] = useState("");
  const [error, setError] = useState("");

  const become = async () => {
    if (!nom.trim()) { setError("Entrez votre nom."); return; }
    const { error } = await supabase.from("profiles").insert({ id: user.id, role: "admin", nom: nom.trim() });
    if (error) setError("Impossible de créer le compte administrateur.");
    else onDone();
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand"><img src="/logo.png" alt="Annemasse Natation" className="login-logo" /><div className="brand-title" style={{ color: "var(--chrono)" }}>SUIVI NAGEURS</div></div>
        <p className="login-intro">Bienvenue — premier accès</p>
        <p className="login-hint">Aucun administrateur n'existe encore pour ce club. Devenez l'administrateur pour créer les comptes coachs et nageurs.</p>
        <label>Votre nom</label>
        <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Hugo" />
        {error && <div className="login-error">{error}</div>}
        <button className="btn-primary full" onClick={become}>Devenir administrateur</button>
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
  const email = session.user.email;

  const check = useCallback(async () => {
    setChecked(false);
    const { data: anyAdmin } = await supabase.from("profiles").select("id").eq("role", "admin").limit(1);
    if (!anyAdmin || anyAdmin.length === 0) { setNeedBootstrap(true); setChecked(true); return; }
    const { data: invite } = await supabase.from("invites").select("*").eq("email", email).maybeSingle();
    if (invite) {
      const { data: newProfile, error } = await supabase
        .from("profiles")
        .insert({ id: session.user.id, role: invite.role, swimmer_id: invite.swimmer_id, nom: invite.nom })
        .select().single();
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
