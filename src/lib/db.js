import { supabase } from "./supabase";

// ---- swimmers ----
export const listSwimmers = () => supabase.from("swimmers").select("*").order("nom");
export const deleteSwimmer = (id) => supabase.from("swimmers").delete().eq("id", id);

// ---- trainings_sessions + attendance ----
export const listSessions = () => supabase.from("trainings_sessions").select("*").order("date", { ascending: false });
export const createSession = (payload) => supabase.from("trainings_sessions").insert(payload).select().single();
export const deleteSession = (id) => supabase.from("trainings_sessions").delete().eq("id", id);
export const listAttendanceForSession = (sessionId) =>
  supabase.from("attendance").select("*").eq("session_id", sessionId);
export const listAllAttendance = () => supabase.from("attendance").select("*");
export const upsertAttendance = (row) =>
  supabase.from("attendance").upsert(row, { onConflict: "session_id,swimmer_id" }).select().single();

// ---- performances ----
export const listPerformances = () => supabase.from("performances").select("*").order("date", { ascending: false });
export const createPerformance = (payload) => supabase.from("performances").insert(payload);
export const deletePerformance = (id) => supabase.from("performances").delete().eq("id", id);

// ---- vma_tests ----
export const listVma = () => supabase.from("vma_tests").select("*").order("date", { ascending: false });
export const createVma = (payload) => supabase.from("vma_tests").insert(payload);
export const deleteVma = (id) => supabase.from("vma_tests").delete().eq("id", id);

// ---- events (calendrier) ----
export const listEvents = () => supabase.from("events").select("*").order("date_debut");
export const createEvent = (payload) => supabase.from("events").insert(payload);
export const deleteEvent = (id) => supabase.from("events").delete().eq("id", id);

// ---- calendriers (multi-calendriers par nageurs concernés) ----
export const listCalendriers = () => supabase.from("calendriers").select("*").order("nom");
export const createCalendrier = (nom) => supabase.from("calendriers").insert({ nom }).select().single();
export const deleteCalendrier = (id) => supabase.from("calendriers").delete().eq("id", id);
export const listCalendrierMembres = () => supabase.from("calendrier_membres").select("*");
export const setCalendrierMembres = async (calendrierId, swimmerIds) => {
  await supabase.from("calendrier_membres").delete().eq("calendrier_id", calendrierId);
  if (swimmerIds.length === 0) return;
  await supabase.from("calendrier_membres").insert(swimmerIds.map((swimmer_id) => ({ calendrier_id: calendrierId, swimmer_id })));
};

// ---- messages ----
export const listMessages = () => supabase.from("messages").select("*").order("created_at", { ascending: false });
export const createMessage = (payload) => supabase.from("messages").insert(payload);
export const deleteMessage = (id) => supabase.from("messages").delete().eq("id", id);

// ---- wellness_checks (forme du matin) ----
export const listWellness = () => supabase.from("wellness_checks").select("*").order("date", { ascending: false });
export const createWellness = (payload) => supabase.from("wellness_checks").insert(payload);
export const deleteWellness = (id) => supabase.from("wellness_checks").delete().eq("id", id);
