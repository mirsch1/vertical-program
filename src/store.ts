import { useEffect, useState } from "react";
import { PROGRAM_START, WEEKS, GOAL_IN, BASELINE_IN, SessionKind, TEMPLATES, blockOfWeek } from "./program";

// ---------- Types ----------
export type ActivityType = "gym" | "volley" | "match" | "judo" | "class" | "cycle" | "other";

export type KneeSide = "L" | "R" | "both";

export interface SetEntry { w: number | null; r: number | null }
export interface ExerciseLog { key: string; unit: string; sets: SetEntry[]; note?: string }

export interface Session {
  id: string;
  date: string;           // YYYY-MM-DD
  type: ActivityType;
  kind?: SessionKind;     // for gym sessions
  title: string;
  minutes: number | null;
  rpe: number | null;     // 1-10 session RPE
  sauna: boolean;
  knee: number | null;    // 0-10 patellar pain during/after
  kneeSide?: KneeSide;    // which knee, when knee > 0
  notes: string;
  exercises: ExerciseLog[];
  createdAt: number;
}

export interface JumpTest {
  id: string;
  date: string;
  standing: number | null; // inches
  approach: number | null; // inches
  broad: number | null;    // cm, optional
  notes: string;
}

export interface Checkin {
  date: string;            // one per day
  weight: number | null;   // kg
  sleep: number | null;    // hours
  soreness: number | null; // 0-10
  knee: number | null;     // 0-10
  kneeSide?: KneeSide;
  energy: number | null;   // 1-5
  protein: boolean;
  creatine: boolean;
  notes: string;
}

export interface Settings {
  matchWeeks: Record<string, boolean>; // week number -> match on Wednesday
  goalIn: number;
  baselineIn: number;
  reachCm: number | null;              // standing reach for the wall method
  touchGoalCm: number;                 // spike reach target (approach touch height)
}

export interface Draft {
  startedAt: number;
  date: string;
  kind: SessionKind;
  week: number;
  exercises: ExerciseLog[];
}

export interface Store {
  v: 2;
  sessions: Session[];
  jumps: JumpTest[];
  checkins: Checkin[];
  settings: Settings;
  draft: Draft | null;
}

export const EMPTY: Store = {
  v: 2, sessions: [], jumps: [], checkins: [],
  settings: { matchWeeks: {}, goalIn: GOAL_IN, baselineIn: BASELINE_IN, reachCm: null, touchGoalCm: 350 },
  draft: null,
};

const KEY = "vt.v2";

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return { ...EMPTY, ...parsed, settings: { ...EMPTY.settings, ...(parsed.settings || {}) } };
  } catch { return EMPTY; }
}

export function useStore() {
  const [store, setStore] = useState<Store>(loadStore);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* ignore */ }
  }, [store]);
  return [store, setStore] as const;
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// ---------- Dates ----------
export const pad = (n: number) => (n < 10 ? "0" + n : "" + n);
export const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromISO = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
export const todayISO = () => toISO(new Date());
export const addDays = (iso: string, n: number) => { const d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
export const dowOf = (iso: string) => fromISO(iso).getDay(); // 0 Sun .. 6 Sat
export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
export const fmtShort = (iso: string) => { const d = fromISO(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
export const fmtFull = (iso: string) => { const d = fromISO(iso); return `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
export const daysBetween = (a: string, b: string) => Math.round((fromISO(b).getTime() - fromISO(a).getTime()) / 86400000);

/** Program week for a date: 0 before start (baseline), 1..17, 18+ after. */
export const weekOf = (iso: string) => {
  const d = daysBetween(PROGRAM_START, iso);
  if (d < 0) return 0;
  return Math.floor(d / 7) + 1;
};
export const weekStart = (w: number) => addDays(PROGRAM_START, (w - 1) * 7); // Monday
export const mondayOf = (iso: string) => { const dow = dowOf(iso); return addDays(iso, dow === 0 ? -6 : 1 - dow); };
export const isMatchWeek = (s: Settings, w: number) => s.matchWeeks[String(w)] ?? true;

// ---------- Analysis helpers ----------
export const e1rm = (w: number, r: number) => (r <= 0 ? 0 : r === 1 ? w : w * (1 + r / 30));

export function bestE1rm(ex: ExerciseLog): number | null {
  let best: number | null = null;
  for (const s of ex.sets) {
    if (s.w == null || s.r == null || s.r <= 0) continue;
    const v = e1rm(s.w, s.r);
    if (best == null || v > best) best = v;
  }
  return best;
}
export function bestValue(ex: ExerciseLog): number | null {
  // for non-kg units: best "weight" field (sec / cm / reps)
  let best: number | null = null;
  for (const s of ex.sets) { if (s.w != null && (best == null || s.w > best)) best = s.w; }
  return best;
}

export const inToCm = (inch: number) => Math.round(inch * 2.54);
/** Approach touch height in cm from saved reach + latest approach jump, or null. */
export const touchCm = (s: Settings, approachIn: number | null | undefined) => (s.reachCm != null && approachIn != null ? s.reachCm + inToCm(approachIn) : null);
export const cmToIn = (cm: number) => Math.round((cm / 2.54) * 2) / 2;
export const kneeLabel = (knee: number | null | undefined, side?: KneeSide) => knee == null ? "" : `knee ${knee}${knee > 0 && side ? " " + (side === "both" ? "L+R" : side) : ""}`;

export const sessionLoad = (s: Session) => (s.rpe ?? 0) * (s.minutes ?? 0);

export const plannedGymPerWeek = 3;

export function sortByDate<T extends { date: string }>(arr: T[], desc = false) {
  return [...arr].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0) * (desc ? -1 : 1));
}

/** Last logged sets for an exercise key, for prefill. */
export function lastSetsFor(store: Store, key: string): SetEntry[] | null {
  const sessions = sortByDate(store.sessions, true);
  for (const s of sessions) {
    const ex = s.exercises.find(e => e.key === key && e.sets.some(x => x.w != null));
    if (ex) return ex.sets;
  }
  return null;
}

export function newDraft(kind: SessionKind, week: number, store: Store): Draft {
  const t = TEMPLATES[kind];
  const b = blockOfWeek(week);
  return {
    startedAt: Date.now(), date: todayISO(), kind, week,
    exercises: t.exercises.filter(e => e.track && e.rx[b].sets !== "0").map(e => {
      const n = Math.max(1, parseInt(e.rx[b].sets, 10) || 2);
      const last = lastSetsFor(store, e.key);
      return { key: e.key, unit: e.unit, sets: Array.from({ length: n }, (_, i) => ({ w: last?.[Math.min(i, last.length - 1)]?.w ?? null, r: null })) };
    }),
  };
}

// ---------- Linear regression / projection ----------
export function linreg(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 2) return null;
  const mx = points.reduce((a, p) => a + p.x, 0) / n, my = points.reduce((a, p) => a + p.y, 0) / n;
  let sxy = 0, sxx = 0;
  for (const p of points) { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) ** 2; }
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  return { slope, intercept: my - slope * mx };
}

// ---------- Export / import ----------
const csvCell = (v: any) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const csv = (rows: any[][]) => rows.map(r => r.map(csvCell).join(",")).join("\n");

export function exportSetsCSV(store: Store) {
  const rows: any[][] = [["date","week","session_type","session_kind","exercise","unit","set_no","value","reps","e1rm","session_rpe","session_minutes","knee","knee_side","sauna"]];
  for (const s of sortByDate(store.sessions)) {
    for (const ex of s.exercises) ex.sets.forEach((st, i) => {
      rows.push([s.date, weekOf(s.date), s.type, s.kind ?? "", ex.key, ex.unit, i + 1, st.w, st.r, ex.unit === "kg" && st.w != null && st.r ? Math.round(e1rm(st.w, st.r) * 10) / 10 : "", s.rpe, s.minutes, s.knee, s.kneeSide ?? "", s.sauna ? 1 : 0]);
    });
  }
  return csv(rows);
}
export function exportSessionsCSV(store: Store) {
  const rows: any[][] = [["date","week","type","kind","title","minutes","rpe","load","sauna","knee","knee_side","notes"]];
  for (const s of sortByDate(store.sessions)) rows.push([s.date, weekOf(s.date), s.type, s.kind ?? "", s.title, s.minutes, s.rpe, sessionLoad(s), s.sauna ? 1 : 0, s.knee, s.kneeSide ?? "", s.notes]);
  return csv(rows);
}
export function exportJumpsCSV(store: Store) {
  const rows: any[][] = [["date","week","standing_in","approach_in","broad_cm","notes"]];
  for (const j of sortByDate(store.jumps)) rows.push([j.date, weekOf(j.date), j.standing, j.approach, j.broad, j.notes]);
  return csv(rows);
}
export function exportCheckinsCSV(store: Store) {
  const rows: any[][] = [["date","week","weight_kg","sleep_h","soreness","knee","knee_side","energy","protein_hit","creatine","notes"]];
  for (const c of sortByDate(store.checkins)) rows.push([c.date, weekOf(c.date), c.weight, c.sleep, c.soreness, c.knee, c.kneeSide ?? "", c.energy, c.protein ? 1 : 0, c.creatine ? 1 : 0, c.notes]);
  return csv(rows);
}

export function download(name: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
}

export { WEEKS };
