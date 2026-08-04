import React, { useCallback, useEffect, useState } from "react";
import {
  LayoutGrid, Users, CalendarDays, CheckSquare, Sunrise, Gauge, Timer, Flag,
  MessageSquare, ShieldCheck, LogOut, ClipboardList, BarChart3, Menu, X, Award,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import AppStyles from "./lib/AppStyles";
import { LoginScreen, FirstLoginResolver, SetPasswordScreen } from "./lib/Auth";
import {
  listSwimmers, listSessions, listPresences, listPerformances,
  listVma, listEvents, listMessages, listWellness, listJours, listJourRpe, listPerformanceSplits,
} from "./lib/db";

import Dashboard from "./views/Dashboard";
import Nageurs from "./views/Nageurs";
import Seances from "./views/Seances";
import Presences from "./views/Presences";
import Statistiques from "./views/Statistiques";
import VmaAllures from "./views/VmaAllures";
import Performances from "./views/Performances";
import Calendrier from "./views/Calendrier";
import Communication from "./views/Communication";
import FormeDuReveil from "./views/FormeDuReveil";
import FicheNageur from "./views/FicheNageur";
import ComptesAdmin from "./views/ComptesAdmin";
import Formulaires from "./views/Formulaires";
import Qualifications from "./views/Qualifications";

const NAV_ITEMS = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutGrid, roles: ["coach", "admin"] },
  { id: "nageurs", label: "Nageurs", icon: Users, roles: ["coach", "admin"] },
  { id: "seances", label: "Séances", icon: CalendarDays, roles: ["coach", "admin", "famille"] },
  { id: "presences", label: "Présences", icon: CheckSquare, roles: ["coach", "admin"] },
  { id: "statistiques", label: "Statistiques", icon: BarChart3, roles: ["coach", "admin"] },
  { id: "forme", label: "Forme du matin", icon: Sunrise, roles: ["coach", "admin", "famille"] },
  { id: "vma", label: "VMA, Allures & RPE", icon: Gauge, roles: ["coach", "admin", "famille"] },
  { id: "performances", label: "Performances", icon: Timer, roles: ["coach", "admin", "famille"] },
  { id: "calendrier", label: "Calendrier", icon: Flag, roles: ["coach", "admin", "famille"] },
  { id: "formulaires", label: "Formulaires", icon: ClipboardList, roles: ["coach", "admin", "famille"] },
  { id: "communication", label: "Communication", icon: MessageSquare, roles: ["coach", "admin", "famille"] },
  { id: "comptes", label: "Comptes & accès", icon: ShieldCheck, roles: ["admin"] },
  { id: "qualifications", label: "Grilles de qualification", icon: Award, roles: ["admin"] },
];

export default function App() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(undefined);
  const [view, setView] = useState("dashboard");
  const [ficheId, setFicheId] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [swimmers, setSwimmers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [presences, setPresences] = useState([]);
  const [jourRpes, setJourRpes] = useState([]);
  const [jours, setJours] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [splits, setSplits] = useState([]);
  const [vma, setVma] = useState([]);
  const [events, setEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [wellness, setWellness] = useState([]);

  const loadProfile = useCallback(async (uid) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    setProfile(data || null);
  }, []);

  const reload = useCallback(async () => {
    const [sw, se, pr, rp, jo, pe, sp, vm, ev, ms, we] = await Promise.all([
      listSwimmers(), listSessions(), listPresences(), listJourRpe(), listJours(), listPerformances(), listPerformanceSplits(),
      listVma(), listEvents(), listMessages(), listWellness(),
    ]);
    setSwimmers(sw.data || []);
    setSessions(se.data || []);
    setPresences(pr.data || []);
    setJourRpes(rp.data || []);
    setJours(jo.data || []);
    setPerformances(pe.data || []);
    setSplits(sp.data || []);
    setVma(vm.data || []);
    setEvents(ev.data || []);
    setMessages(ms.data || []);
    setWellness(we.data || []);
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

  useEffect(() => {
    if (profile) reload();
  }, [profile, reload]);

  const role = profile?.role || "famille";
  const navItems = NAV_ITEMS.filter((it) => it.roles.includes(role));

  useEffect(() => {
    if (profile && !navItems.some((it) => it.id === view)) setView(navItems[0]?.id || "communication");
  }, [role, profile]); // eslint-disable-line

  const readOnly = role === "famille";
  const counts = {
    nageurs: swimmers.length, seances: sessions.length, performances: performances.length,
    communication: messages.length, calendrier: events.length,
  };

  if (session === undefined || (session && profile === undefined)) {
    return <div className="app"><AppStyles /><div style={{ padding: 40 }}>Chargement…</div></div>;
  }

  if (!session) return <div className="app"><AppStyles /><LoginScreen /></div>;

  if (profile === null) {
    return <div className="app"><AppStyles /><FirstLoginResolver session={session} onProfile={setProfile} /></div>;
  }

  if (!profile.password_set) {
    return (
      <div className="app">
        <AppStyles />
        <SetPasswordScreen onDone={() => setProfile({ ...profile, password_set: true })} />
      </div>
    );
  }

  return (
    <div className="app">
      <AppStyles />
      <nav className="lanenav">
        <div className="lanenav-brand">
          <img src="/logo.png" alt="Annemasse Natation" className="brand-logo" />
          <div><div className="brand-title">SUIVI NAGEURS</div><div className="brand-sub">Annemasse Natation</div></div>
        </div>
        <div className="user-badge">
          <div>
            <div className="user-badge-name">{profile.nom}</div>
            <div className="user-badge-role">{role === "admin" ? "Administrateur" : role === "coach" ? "Coach" : profile.famille_role === "nageur" ? "Nageur" : profile.famille_role === "parent" ? "Parent" : "Nageur / Parent"}</div>
          </div>
          <button className="logout-btn" onClick={() => supabase.auth.signOut()} title="Se déconnecter"><LogOut size={15} /></button>
        </div>
        <div className="lanes">
          {navItems.map((it, i) => {
            const Icon = it.icon;
            const active = view === it.id;
            const count = counts[it.id];
            return (
              <button key={it.id} className={"lane" + (active ? " lane-active" : "")} onClick={() => setView(it.id)}>
                <span className="lane-num">{String(i + 1).padStart(2, "0")}</span>
                <Icon size={17} strokeWidth={2} />
                <span className="lane-label">{it.label}</span>
                {count != null && <span className="lane-count">{count}</span>}
              </button>
            );
          })}
        </div>
      </nav>

      <MobileNav
        profile={profile} role={role} navItems={navItems} counts={counts}
        view={view} setView={(v) => { setView(v); setMobileMenuOpen(false); }}
        open={mobileMenuOpen} setOpen={setMobileMenuOpen}
        onLogout={() => supabase.auth.signOut()}
      />

      {view === "dashboard" && <Dashboard swimmers={swimmers} sessions={sessions} messages={messages} events={events} setView={setView} />}
      {view === "nageurs" && <Nageurs swimmers={swimmers} onOpenFiche={setFicheId} isAdmin={role === "admin"} reload={reload} />}
      {view === "seances" && <Seances swimmers={swimmers} sessions={sessions} presences={presences} jours={jours} jourRpes={jourRpes} readOnly={readOnly} mySwimmerId={profile.swimmer_id} reload={reload} />}
      {view === "presences" && <Presences swimmers={swimmers} presences={presences} jours={jours} jourRpes={jourRpes} reload={reload} />}
      {view === "statistiques" && <Statistiques swimmers={swimmers} sessions={sessions} presences={presences} />}
      {view === "forme" && <FormeDuReveil swimmers={swimmers} wellness={wellness} canOpenFiche={role === "coach" || role === "admin"} onOpenFiche={setFicheId} defaultSwimmerId={role === "famille" ? profile.swimmer_id : null} reload={reload} />}
      {view === "vma" && <VmaAllures swimmers={swimmers} vma={vma} readOnly={readOnly} reload={reload} />}
      {view === "performances" && <Performances swimmers={swimmers} performances={performances} splits={splits} readOnly={readOnly} reload={reload} />}
      {view === "calendrier" && <Calendrier events={events} swimmers={swimmers} readOnly={readOnly} isStaff={role === "coach" || role === "admin"} reload={reload} />}
      {view === "formulaires" && <Formulaires swimmers={swimmers} isStaff={role === "coach" || role === "admin"} mySwimmerId={profile.swimmer_id} />}
      {view === "communication" && <Communication messages={messages} swimmers={swimmers} isStaff={role === "coach" || role === "admin"} defaultAuteur={profile.nom} mySwimmerId={profile.swimmer_id} mySession={session} reload={reload} />}
      {view === "comptes" && <ComptesAdmin swimmers={swimmers} reload={reload} />}
      {view === "qualifications" && <Qualifications swimmers={swimmers} performances={performances} />}

      {ficheId && (
        <FicheNageur
          swimmer={swimmers.find((s) => s.id === ficheId)}
          sessions={sessions} presences={presences} jours={jours} jourRpes={jourRpes} performances={performances} vma={vma} wellness={wellness}
          onClose={() => setFicheId(null)}
        />
      )}
    </div>
  );
}

function MobileNav({ profile, role, navItems, counts, view, setView, open, setOpen, onLogout }) {
  const primary = navItems.slice(0, 4);
  const roleLabel = role === "admin" ? "Administrateur" : role === "coach" ? "Coach" : profile.famille_role === "nageur" ? "Nageur" : profile.famille_role === "parent" ? "Parent" : "Nageur / Parent";

  return (
    <>
      <div className="mobile-topbar">
        <img src="/logo.png" alt="" className="brand-logo" />
        <div className="mobile-topbar-title">SUIVI NAGEURS</div>
        <button className="icon-btn" onClick={onLogout} title="Se déconnecter"><LogOut size={18} /></button>
      </div>

      <div className="mobile-bottombar">
        {primary.map((it) => {
          const Icon = it.icon;
          const active = view === it.id;
          return (
            <button key={it.id} className={"mobile-tab" + (active ? " active" : "")} onClick={() => setView(it.id)}>
              <Icon size={20} strokeWidth={2} />
              <span>{it.label}</span>
            </button>
          );
        })}
        <button className={"mobile-tab" + (open ? " active" : "")} onClick={() => setOpen(true)}>
          <Menu size={20} strokeWidth={2} />
          <span>Menu</span>
        </button>
      </div>

      {open && (
        <div className="mobile-menu-overlay" onClick={() => setOpen(false)}>
          <div className="mobile-menu-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div>
                <div className="strong" style={{ fontSize: 15 }}>{profile.nom}</div>
                <div className="eyebrow" style={{ marginBottom: 0 }}>{roleLabel}</div>
              </div>
              <button className="icon-btn" onClick={() => setOpen(false)}><X size={20} /></button>
            </div>
            <div className="mobile-menu-list">
              {navItems.map((it) => {
                const Icon = it.icon;
                const active = view === it.id;
                const count = counts[it.id];
                return (
                  <button key={it.id} className={"mobile-menu-item" + (active ? " active" : "")} onClick={() => setView(it.id)}>
                    <Icon size={18} strokeWidth={2} />
                    <span>{it.label}</span>
                    {count != null && <span className="lane-count" style={{ background: "var(--foam)", color: "var(--ink-soft)" }}>{count}</span>}
                  </button>
                );
              })}
            </div>
            <button className="btn-secondary full" style={{ marginTop: 14 }} onClick={onLogout}>Se déconnecter</button>
          </div>
        </div>
      )}
    </>
  );
}
