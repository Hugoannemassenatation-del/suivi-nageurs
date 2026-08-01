import React, { useCallback, useEffect, useState } from "react";
import {
  LayoutGrid, Users, CalendarDays, CheckSquare, Sunrise, Gauge, Timer, Flag,
  MessageSquare, ShieldCheck, LogOut, ClipboardList,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import AppStyles from "./lib/AppStyles";
import { LoginScreen, FirstLoginResolver, SetPasswordScreen } from "./lib/Auth";
import {
  listSwimmers, listSessions, listPresences, listPerformances,
  listVma, listEvents, listMessages, listWellness,
} from "./lib/db";

import Dashboard from "./views/Dashboard";
import Nageurs from "./views/Nageurs";
import Seances from "./views/Seances";
import Presences from "./views/Presences";
import VmaAllures from "./views/VmaAllures";
import Performances from "./views/Performances";
import Calendrier from "./views/Calendrier";
import Communication from "./views/Communication";
import FormeDuReveil from "./views/FormeDuReveil";
import FicheNageur from "./views/FicheNageur";
import ComptesAdmin from "./views/ComptesAdmin";
import Formulaires from "./views/Formulaires";

const NAV_ITEMS = [
  { id: "dashboard", label: "Tableau de bord", icon: LayoutGrid, roles: ["coach", "admin"] },
  { id: "nageurs", label: "Nageurs", icon: Users, roles: ["coach", "admin"] },
  { id: "seances", label: "Séances", icon: CalendarDays, roles: ["coach", "admin", "famille"] },
  { id: "presences", label: "Présences", icon: CheckSquare, roles: ["coach", "admin"] },
  { id: "forme", label: "Forme du matin", icon: Sunrise, roles: ["coach", "admin", "famille"] },
  { id: "vma", label: "VMA, Allures & RPE", icon: Gauge, roles: ["coach", "admin", "famille"] },
  { id: "performances", label: "Performances", icon: Timer, roles: ["coach", "admin", "famille"] },
  { id: "calendrier", label: "Calendrier", icon: Flag, roles: ["coach", "admin", "famille"] },
  { id: "formulaires", label: "Formulaires", icon: ClipboardList, roles: ["coach", "admin", "famille"] },
  { id: "communication", label: "Communication", icon: MessageSquare, roles: ["coach", "admin", "famille"] },
  { id: "comptes", label: "Comptes & accès", icon: ShieldCheck, roles: ["admin"] },
];

export default function App() {
  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(undefined);
  const [view, setView] = useState("dashboard");
  const [ficheId, setFicheId] = useState(null);

  const [swimmers, setSwimmers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [presences, setPresences] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [vma, setVma] = useState([]);
  const [events, setEvents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [wellness, setWellness] = useState([]);

  const loadProfile = useCallback(async (uid) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle();
    setProfile(data || null);
  }, []);

  const reload = useCallback(async () => {
    const [sw, se, pr, pe, vm, ev, ms, we] = await Promise.all([
      listSwimmers(), listSessions(), listPresences(), listPerformances(),
      listVma(), listEvents(), listMessages(), listWellness(),
    ]);
    setSwimmers(sw.data || []);
    setSessions(se.data || []);
    setPresences(pr.data || []);
    setPerformances(pe.data || []);
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
            <div className="user-badge-role">{role === "admin" ? "Administrateur" : role === "coach" ? "Coach" : "Nageur / Parent"}</div>
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

      {view === "dashboard" && <Dashboard swimmers={swimmers} sessions={sessions} messages={messages} events={events} setView={setView} />}
      {view === "nageurs" && <Nageurs swimmers={swimmers} onOpenFiche={setFicheId} isAdmin={role === "admin"} reload={reload} />}
      {view === "seances" && <Seances swimmers={swimmers} sessions={sessions} presences={presences} readOnly={readOnly} reload={reload} />}
      {view === "presences" && <Presences swimmers={swimmers} presences={presences} reload={reload} />}
      {view === "forme" && <FormeDuReveil swimmers={swimmers} wellness={wellness} canOpenFiche={role === "coach" || role === "admin"} onOpenFiche={setFicheId} defaultSwimmerId={role === "famille" ? profile.swimmer_id : null} reload={reload} />}
      {view === "vma" && <VmaAllures swimmers={swimmers} vma={vma} readOnly={readOnly} reload={reload} />}
      {view === "performances" && <Performances swimmers={swimmers} performances={performances} readOnly={readOnly} reload={reload} />}
      {view === "calendrier" && <Calendrier events={events} swimmers={swimmers} readOnly={readOnly} isStaff={role === "coach" || role === "admin"} reload={reload} />}
      {view === "formulaires" && <Formulaires swimmers={swimmers} isStaff={role === "coach" || role === "admin"} mySwimmerId={profile.swimmer_id} />}
      {view === "communication" && <Communication messages={messages} swimmers={swimmers} readOnly={readOnly} defaultAuteur={profile.nom} reload={reload} />}
      {view === "comptes" && <ComptesAdmin swimmers={swimmers} reload={reload} />}

      {ficheId && (
        <FicheNageur
          swimmer={swimmers.find((s) => s.id === ficheId)}
          sessions={sessions} presences={presences} performances={performances} vma={vma} wellness={wellness}
          onClose={() => setFicheId(null)}
        />
      )}
    </div>
  );
}
