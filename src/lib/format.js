export const GROUPES = ["Junior Bleu", "Junior Jaune"];
export const BASSINS = ["25m", "50m"];
const STROKE_ALIASES = [
  { canon: "NL", re: /^(nl|n\.?l\.?|nage\s*libre)\.?$/i },
  { canon: "Dos", re: /^(dos|do)\.?$/i },
  { canon: "Brasse", re: /^(brasse|bra|br)\.?$/i },
  { canon: "Pap", re: /^(pap(illon)?)\.?$/i },
  { canon: "4N", re: /^(4\s*n(ages)?)\.?$/i },
];

// Ramène toute variante d'écriture d'une épreuve ("100 Bra.", "50 Papillon"…) vers
// la forme canonique utilisée partout dans l'app ("100 Brasse", "50 Pap"…), pour que
// le tri et le rapprochement avec les grilles de qualification fonctionnent toujours,
// quelle que soit la façon dont l'épreuve a été saisie ou importée.
export function normalizeEpreuve(raw) {
  if (!raw) return raw;
  const s = raw.trim().replace(/\s+/g, " ");
  const m = s.match(/^(\d+)\s+(.+)$/);
  if (!m) return s;
  const distance = m[1];
  const strokeRaw = m[2].trim();
  const found = STROKE_ALIASES.find((x) => x.re.test(strokeRaw));
  return `${distance} ${found ? found.canon : strokeRaw}`;
}

export const EPREUVES = [
  "50 NL", "100 NL", "200 NL", "400 NL", "800 NL", "1500 NL",
  "50 Dos", "100 Dos", "200 Dos",
  "50 Brasse", "100 Brasse", "200 Brasse",
  "50 Pap", "100 Pap", "200 Pap",
  "100 4N", "200 4N", "400 4N",
];
export const METHODES_VMA = ["Test 30 min", "Test 400m", "Test 2x200m paliers", "Autre"];
export const POURCENTAGES_VMA = [60, 70, 80, 85, 90, 95, 100, 105, 110];
export const TYPES_EVENT = ["Compétition", "Stage"];
export const RPE_ECHELLE = [
  { v: 0, label: "Repos total" },
  { v: 1, label: "Très très facile" },
  { v: 2, label: "Facile" },
  { v: 3, label: "Modéré" },
  { v: 4, label: "Un peu difficile" },
  { v: 5, label: "Difficile" },
  { v: 6, label: "Difficile +" },
  { v: 7, label: "Très difficile" },
  { v: 8, label: "Très difficile +" },
  { v: 9, label: "Quasi maximal" },
  { v: 10, label: "Effort maximal" },
];
export const FORME_ITEMS = [
  { key: "sommeil", label: "Sommeil", echelle: ["Très mauvais", "Mauvais", "Moyen", "Bon", "Excellent"] },
  { key: "energie", label: "Niveau d'énergie", echelle: ["Épuisé", "Fatigué", "Moyen", "En forme", "Plein d'énergie"] },
  { key: "courbatures", label: "Muscles / courbatures", echelle: ["Très courbaturé", "Courbaturé", "Un peu", "Léger", "Aucune gêne"] },
  { key: "motivation", label: "Motivation du jour", echelle: ["Aucune envie", "Faible", "Moyenne", "Bonne", "Très motivé"] },
];

export const todayISO = () => new Date().toISOString().slice(0, 10);

export function parseTimeToSeconds(t) {
  if (!t) return null;
  const m = t.trim().match(/^(?:(\d+):)?(\d{1,2})(?:[.,](\d{1,2}))?$/);
  if (!m) return null;
  const min = m[1] ? parseInt(m[1], 10) : 0;
  const sec = parseInt(m[2], 10);
  const cs = m[3] ? parseInt(m[3].padEnd(2, "0"), 10) : 0;
  return min * 60 + sec + cs / 100;
}
export function formatSeconds(s) {
  if (s == null || isNaN(s)) return "—";
  const m = Math.floor(s / 60);
  const rest = (s - m * 60).toFixed(2).padStart(5, "0");
  return m > 0 ? `${m}:${rest}` : `${rest}`;
}
export function daysAgo(iso) {
  return (Date.now() - new Date(iso).getTime()) / 86400000;
}
export function isThisWeek(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // 0 = lundi
  const monday = new Date(now); monday.setDate(now.getDate() - day); monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday); sunday.setDate(monday.getDate() + 6); sunday.setHours(23, 59, 59, 999);
  return d >= monday && d <= sunday;
}
export function isThisMonth(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}
export function isOlderYear(dateStr) {
  return new Date(dateStr + "T00:00:00").getFullYear() < new Date().getFullYear();
}
export function paceFor100(vmaMmin, pct) {
  const speed = vmaMmin * (pct / 100);
  if (!speed) return null;
  return 6000 / speed;
}
export function formeScore(entry) {
  const vals = FORME_ITEMS.map((it) => Number(entry[it.key])).filter((v) => v > 0);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}
export function formeColor(score) {
  if (score == null) return "var(--ink-soft)";
  if (score >= 4) return "#1E8A5F";
  if (score >= 2.5) return "#C98A12";
  return "var(--chrono)";
}
