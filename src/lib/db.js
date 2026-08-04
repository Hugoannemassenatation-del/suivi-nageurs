import { supabase } from "./supabase";

// Supabase/PostgREST limite chaque requête à 1000 lignes par défaut. Pour un club qui
// accumule beaucoup de données (chronos, présences, forme du matin...), cette limite finit
// par être atteinte. fetchAll récupère donc toutes les pages nécessaires automatiquement.
async function fetchAll(table, { order, ascending = true, select = "*" } = {}) {
  const pageSize = 1000;
  let from = 0;
  let all = [];
  while (true) {
    let query = supabase.from(table).select(select).range(from, from + pageSize - 1);
    if (order) query = query.order(order, { ascending });
    const { data, error } = await query;
    if (error) return { data: null, error };
    all = all.concat(data || []);
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  return { data: all, error: null };
}

// ---- swimmers ----
export const listSwimmers = () => supabase.from("swimmers").select("*").order("nom");
export const deleteSwimmer = (id) => supabase.from("swimmers").delete().eq("id", id);

// ---- trainings_sessions + attendance ----
export const listSessions = () => fetchAll("trainings_sessions", { order: "date", ascending: false });
export const createSession = (payload) => supabase.from("trainings_sessions").insert(payload).select().single();
export const deleteSession = (id) => supabase.from("trainings_sessions").delete().eq("id", id);
export const uploadSeancePhoto = async (file) => {
  const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
  const { error } = await supabase.storage.from("seances-photos").upload(path, file);
  if (error) return { error };
  const { data } = supabase.storage.from("seances-photos").getPublicUrl(path);
  return { url: data.publicUrl };
};

// ---- RPE par jour d'entraînement planifié ----
export const listJourRpe = () => fetchAll("jour_rpe");
export const upsertJourRpe = (row) =>
  supabase.from("jour_rpe").upsert(row, { onConflict: "jour_id,swimmer_id" }).select().single();
export const listAttendanceForSession = (sessionId) =>
  supabase.from("attendance").select("*").eq("session_id", sessionId);
export const listAllAttendance = () => fetchAll("attendance");
export const upsertAttendance = (row) =>
  supabase.from("attendance").upsert(row, { onConflict: "session_id,swimmer_id" }).select().single();

// ---- performances ----
export const listPerformances = () => fetchAll("performances", { order: "date", ascending: false });
export const createPerformance = (payload) => supabase.from("performances").insert(payload).select().single();
export const createPerformancesBulk = (rows) => supabase.from("performances").insert(rows);
export const updatePerformance = (id, payload) => supabase.from("performances").update(payload).eq("id", id);
export const deletePerformance = (id) => supabase.from("performances").delete().eq("id", id);
export const deleteAllPerformances = () => supabase.from("performances").delete().not("id", "is", null);

// ---- temps de passage, coups de bras, fréquence (analyse de course) ----
export const listPerformanceSplits = () => fetchAll("performance_splits", { order: "distance_m" });
export const createPerformanceSplit = (payload) => supabase.from("performance_splits").insert(payload);
export const deletePerformanceSplit = (id) => supabase.from("performance_splits").delete().eq("id", id);

// ---- vma_tests ----
export const listVma = () => fetchAll("vma_tests", { order: "date", ascending: false });
export const createVma = (payload) => supabase.from("vma_tests").insert(payload);
export const deleteVma = (id) => supabase.from("vma_tests").delete().eq("id", id);

// ---- events (calendrier) ----
export const listEvents = () => fetchAll("events", { order: "date_debut" });
export const createEvent = (payload) => supabase.from("events").insert(payload).select().single();
export const deleteEvent = (id) => supabase.from("events").delete().eq("id", id);

export const listEventCalendriers = () => fetchAll("event_calendriers");
export const setEventCalendriers = async (eventId, calendrierIds) => {
  await supabase.from("event_calendriers").delete().eq("event_id", eventId);
  if (calendrierIds.length === 0) return;
  await supabase.from("event_calendriers").insert(calendrierIds.map((calendrier_id) => ({ event_id: eventId, calendrier_id })));
};

// ---- grilles de qualification (admin uniquement) ----
export const listGrilles = () => supabase.from("grilles_qualification").select("*").order("created_at", { ascending: false });
export const createGrille = (payload) => supabase.from("grilles_qualification").insert(payload).select().single();
export const updateGrille = (id, payload) => supabase.from("grilles_qualification").update(payload).eq("id", id);
export const deleteGrille = (id) => supabase.from("grilles_qualification").delete().eq("id", id);

export const listGrilleTemps = () => fetchAll("grille_temps");
export const createGrilleTemps = (payload) => supabase.from("grille_temps").insert(payload);
export const createGrilleTempsBulk = (rows) => supabase.from("grille_temps").insert(rows);
export const deleteGrilleTemps = (id) => supabase.from("grille_temps").delete().eq("id", id);
export const listJours = () => fetchAll("jours_entrainement", { order: "date" });
export const createJour = (payload) => supabase.from("jours_entrainement").insert(payload);
export const deleteJour = (id) => supabase.from("jours_entrainement").delete().eq("id", id);

// ---- presences (autonomes, indépendantes des séances) ----
export const listPresences = () => fetchAll("presences", { order: "date", ascending: false });
export const upsertPresence = (row) =>
  supabase.from("presences").upsert(row, { onConflict: "date,swimmer_id" }).select().single();
export const deletePresence = (id) => supabase.from("presences").delete().eq("id", id);

// ---- formulaires ----
export const listFormulaires = () => supabase.from("formulaires").select("*").order("created_at", { ascending: false });
export const createFormulaire = (payload) => supabase.from("formulaires").insert(payload).select().single();
export const updateFormulaire = (id, payload) => supabase.from("formulaires").update(payload).eq("id", id);
export const deleteFormulaire = (id) => supabase.from("formulaires").delete().eq("id", id);

export const listQuestions = () => supabase.from("formulaire_questions").select("*").order("ordre");
export const createQuestion = (payload) => supabase.from("formulaire_questions").insert(payload);
export const createQuestionsBulk = (rows) => supabase.from("formulaire_questions").insert(rows);
export const deleteQuestion = (id) => supabase.from("formulaire_questions").delete().eq("id", id);

export const listReponses = () => fetchAll("formulaire_reponses");
export const upsertReponse = (row) =>
  supabase.from("formulaire_reponses").upsert(row, { onConflict: "formulaire_id,swimmer_id" }).select().single();
export const listCalendriers = () => supabase.from("calendriers").select("*").order("nom");
export const createCalendrier = (nom) => supabase.from("calendriers").insert({ nom }).select().single();
export const deleteCalendrier = (id) => supabase.from("calendriers").delete().eq("id", id);
export const listCalendrierMembres = () => fetchAll("calendrier_membres");
export const setCalendrierMembres = async (calendrierId, swimmerIds) => {
  await supabase.from("calendrier_membres").delete().eq("calendrier_id", calendrierId);
  if (swimmerIds.length === 0) return;
  await supabase.from("calendrier_membres").insert(swimmerIds.map((swimmer_id) => ({ calendrier_id: calendrierId, swimmer_id })));
};

// ---- messages ----
export const listMessages = () => fetchAll("messages", { order: "created_at", ascending: false });
export const createMessage = (payload) => supabase.from("messages").insert(payload);
export const deleteMessage = (id) => supabase.from("messages").delete().eq("id", id);

// ---- wellness_checks (forme du matin) ----
export const listWellness = () => fetchAll("wellness_checks", { order: "date", ascending: false });
export const createWellness = (payload) => supabase.from("wellness_checks").insert(payload);
export const deleteWellness = (id) => supabase.from("wellness_checks").delete().eq("id", id);
