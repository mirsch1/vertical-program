// Rule-based read of the log: what is working, what is missing, what to do next.
import { PROGRAM_END, PROGRAM_START } from "./program";
import { Store, sortByDate, addDays, todayISO, daysBetween, bestE1rm, sessionLoad, mondayOf, linreg, fromISO, weekOf } from "./store";

export type Level = "good" | "warn" | "bad" | "info";
export interface Insight { level: Level; title: string; detail: string }

const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

export function insights(store: Store): Insight[] {
  const out: Insight[] = [];
  const today = todayISO();
  const d14 = addDays(today, -14), d28 = addDays(today, -28);
  const sessions = sortByDate(store.sessions);
  const jumps = sortByDate(store.jumps.filter(j => j.standing != null));
  const checkins = sortByDate(store.checkins);
  const started = today >= PROGRAM_START;
  const week = weekOf(today);

  if (!sessions.length && !jumps.length && !checkins.length) {
    return [{ level: "info", title: "Nothing logged yet", detail: "Start with a jump test on Thursday and a daily check-in. The analysis needs about two weeks of entries before it can tell you anything useful." }];
  }

  // 1. Jump test cadence
  const lastJump = jumps[jumps.length - 1];
  const sinceJump = lastJump ? daysBetween(lastJump.date, today) : null;
  if (!lastJump) out.push({ level: "bad", title: "No jump test yet", detail: "Without a baseline nothing else can be judged. Thursday, wall and chalk, best of 3." });
  else if (sinceJump! > 10) out.push({ level: "warn", title: `No jump test for ${sinceJump} days`, detail: "The weekly number is the whole point. Test first thing on Thursday, before any heavy work." });

  // 2. Pace vs goal
  const goal = store.settings.goalIn;
  if (jumps.length >= 3 && lastJump) {
    const reg = linreg(jumps.map(j => ({ x: fromISO(j.date).getTime(), y: j.standing! })));
    const daysLeft = Math.max(1, daysBetween(today, PROGRAM_END));
    const needed = (goal - lastJump.standing!) / (daysLeft / 7);
    const trend = reg ? reg.slope * 7 * 86400000 : 0;
    const projected = reg ? reg.intercept + reg.slope * fromISO(PROGRAM_END).getTime() : null;
    if (lastJump.standing! >= goal) out.push({ level: "good", title: "Goal reached", detail: `Latest standing ${lastJump.standing}" is at or above ${goal}". Keep testing so it is not a one-off.` });
    else if (trend >= needed) out.push({ level: "good", title: `On pace: +${trend.toFixed(2)}"/wk`, detail: `You need +${needed.toFixed(2)}"/wk to reach ${goal}" by 28 Feb. Projection ${projected!.toFixed(1)}". Do not add volume, keep doing exactly this.` });
    else if (trend > 0) out.push({ level: "warn", title: `Behind pace: +${trend.toFixed(2)}"/wk, need +${needed.toFixed(2)}"`, detail: `Projection ${projected!.toFixed(1)}" on 28 Feb. Gains at this stage come from intent on Thursdays and strength on Mondays, not more sets. Check the items below for what is slipping.` });
    else out.push({ level: "bad", title: "Vertical is flat or falling", detail: `Trend ${trend.toFixed(2)}"/wk over ${jumps.length} tests. Usual causes, in order: fatigue (load, sleep), missed Thursdays, testing tired. See below.` });
  } else if (jumps.length > 0 && jumps.length < 3) out.push({ level: "info", title: `${jumps.length} of 3 tests for a trend`, detail: "After 3 Thursday tests the app projects where you land on 28 Feb." });

  // 2b. Spike reach
  const appJ = sortByDate(store.jumps.filter(j => j.approach != null));
  const lastApp = appJ[appJ.length - 1];
  if (store.settings.reachCm != null && lastApp) {
    const touch = store.settings.reachCm + Math.round(lastApp.approach! * 2.54);
    const g = store.settings.touchGoalCm;
    if (touch >= g) out.push({ level: "good", title: `Spike touch ${touch}cm, goal ${g} reached`, detail: "Log it on a fresh day again to confirm, then raise the goal." });
    else out.push({ level: touch >= g - 10 ? "info" : "warn", title: `Spike touch ${touch}cm, ${g - touch}cm short of ${g}`, detail: touch >= g - 10 ? "Within reach. Approach technique on Thursdays (penultimate step, double arm swing) is the cheapest 5cm there is." : "The approach jump, not the standing jump, closes this gap. Film the approach every 2 weeks and keep the 5x3 with full rest." });
  }

  // 3. Gym frequency (last 14 days) once the program has started
  const gym14 = sessions.filter(s => s.type === "gym" && s.date > d14);
  if (started) {
    if (gym14.length < 5) out.push({ level: gym14.length <= 2 ? "bad" : "warn", title: `${gym14.length} gym sessions in 14 days, plan is 6`, detail: "Consistency beats everything else in this program. Missed Mondays cost strength, missed Thursdays cost the jump itself." });
    else out.push({ level: "good", title: `${gym14.length} gym sessions in 14 days`, detail: "Frequency is where it should be." });
    const a28 = sessions.filter(s => s.kind === "A" && s.date > d28).length, c28 = sessions.filter(s => s.kind === "C" && s.date > d28).length;
    if (a28 >= 2 && c28 < a28 - 1) out.push({ level: "warn", title: "Thursday jump days are being skipped", detail: `${a28} strength sessions vs ${c28} power sessions in 4 weeks. Thursday is the session that converts strength into inches.` });
  }

  // 4. Strength stall on the main lifts
  for (const key of ["Trap Bar Deadlift", "Leg Press", "Bench Press"]) {
    const pts = sessions.filter(s => s.date > d28).map(s => { const e = s.exercises.find(x => x.key === key); return e ? { date: s.date, v: bestE1rm(e) } : null; }).filter((p): p is { date: string; v: number | null } => !!p && p.v != null) as { date: string; v: number }[];
    if (pts.length < 4) continue;
    const half = Math.floor(pts.length / 2);
    const early = Math.max(...pts.slice(0, half).map(p => p.v)), late = Math.max(...pts.slice(half).map(p => p.v));
    if (late <= early) out.push({ level: "warn", title: `${key} stalled (e1RM ${Math.round(late)}kg)`, detail: "No new best in 4 weeks. Add 2.5kg to set one, take the second set to RPE 9, and check sleep and protein below. If both are fine, the deload will reset it." });
    else out.push({ level: "good", title: `${key} e1RM up ${Math.round(late - early)}kg in 4 weeks`, detail: `${Math.round(early)} → ${Math.round(late)}kg. Strength is moving.` });
  }

  // 5. Knee
  const kneeVals = [...checkins.filter(c => c.date > d14 && c.knee != null).map(c => ({ k: c.knee!, side: c.kneeSide })), ...sessions.filter(s => s.date > d14 && s.knee != null).map(s => ({ k: s.knee!, side: s.kneeSide }))];
  const kneeAvg = avg(kneeVals.map(k => k.k));
  if (kneeAvg != null && kneeVals.length >= 3) {
    const sides = kneeVals.filter(k => k.k > 0 && k.side && k.side !== "both");
    const L = sides.filter(k => k.side === "L").length, R = sides.filter(k => k.side === "R").length;
    const sideNote = sides.length >= 3 && (L >= 3 * Math.max(1, R) || R >= 3 * Math.max(1, L)) ? ` Almost always the ${L > R ? "left" : "right"} knee: film a landing and an approach from the front, that is usually an asymmetry.` : "";
    if (kneeAvg > 3) out.push({ level: "bad", title: `Knee averaging ${kneeAvg.toFixed(1)}/10`, detail: `Cut depth jumps and box jumps until it averages under 2, double the Spanish squat sets, keep the isometrics daily.${sideNote}` });
    else if (kneeAvg > 1.5) out.push({ level: "warn", title: `Knee averaging ${kneeAvg.toFixed(1)}/10`, detail: `Manageable, but watch the trend. Isometrics every session, collagen before Thursdays.${sideNote}` });
    else out.push({ level: "good", title: `Knee quiet (${kneeAvg.toFixed(1)}/10)`, detail: `Tendons are coping with the load.${sideNote}` });
  }

  // 6. Sleep
  const sleep = avg(checkins.filter(c => c.date > d14 && c.sleep != null).map(c => c.sleep!));
  if (sleep != null) {
    if (sleep < 7.5) out.push({ level: sleep < 7 ? "bad" : "warn", title: `Sleep averaging ${sleep.toFixed(1)}h`, detail: "Target 8-9h. Under 7.5h is the most common reason the vertical stalls while the lifts still climb. Sunday volleyball ends at 10pm: eat on the ride, lights out by 11:30." });
    else out.push({ level: "good", title: `Sleep averaging ${sleep.toFixed(1)}h`, detail: "Recovery is covered." });
  }

  // 7. Protein and creatine adherence
  const c14 = checkins.filter(c => c.date > d14);
  if (c14.length >= 5) {
    const p = c14.filter(c => c.protein).length / c14.length, cr = c14.filter(c => c.creatine).length / c14.length;
    if (p < 0.6) out.push({ level: "warn", title: `Protein hit on ${Math.round(p * 100)}% of days`, detail: "180g+ is the floor at 100kg. Breakfast is the easy fix: skyr or eggs with the porridge." });
    if (cr < 0.6) out.push({ level: "warn", title: `Creatine on ${Math.round(cr * 100)}% of days`, detail: "It only works when it is saturated. 5g every day, including rest days." });
  }

  // 8. Bodyweight drift
  const w = checkins.filter(c => c.weight != null);
  if (w.length >= 4) {
    const firstW = avg(w.slice(0, 2).map(c => c.weight!))!, lastW = avg(w.slice(-2).map(c => c.weight!))!;
    if (Math.abs(lastW - firstW) >= 2) out.push({ level: "warn", title: `Bodyweight ${lastW > firstW ? "up" : "down"} ${Math.abs(lastW - firstW).toFixed(1)}kg`, detail: lastW > firstW ? "Every extra kg has to be jumped. Trim dinner carbs on rest days only, keep protein." : "Losing weight while chasing a vertical usually means losing power. Add carbs back on training days." });
  }

  // 9. Load spike this week vs previous 3
  const byWeek = new Map<string, number>();
  for (const s of sessions) byWeek.set(mondayOf(s.date), (byWeek.get(mondayOf(s.date)) || 0) + sessionLoad(s));
  const thisMon = mondayOf(today);
  const prev = [1, 2, 3].map(i => byWeek.get(addDays(thisMon, -7 * i)) ?? 0).filter(x => x > 0);
  const cur = byWeek.get(thisMon) ?? 0;
  if (prev.length >= 2 && cur > 1.5 * avg(prev)!) out.push({ level: "warn", title: "Load spike this week", detail: `${Math.round(cur)} vs a ${Math.round(avg(prev)!)} average. Spikes are when tendons complain. Nothing extra this week, e-bike home on Sunday.` });

  // 10. Tests done tired
  if (lastJump) {
    const dayBefore = addDays(lastJump.date, -1);
    const tired = sessions.some(s => s.date === dayBefore && (s.type === "volley" || s.type === "match" || s.type === "judo") && (s.rpe ?? 0) >= 7);
    if (tired) out.push({ level: "info", title: "Last test was the day after a hard session", detail: "Fine, but note it. A test after a hard volleyball night reads 1-2 inches low and will look like a stall." });
  }

  if (started && week > 0 && !out.some(i => i.level === "bad" || i.level === "warn")) out.push({ level: "good", title: "Nothing missing", detail: "Every signal is where it should be. The only lever left is intent on Thursdays." });
  return out;
}
