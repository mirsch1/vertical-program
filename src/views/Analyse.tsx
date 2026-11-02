import { useMemo, useState } from "react";
import { CHART, COLORS, PROGRAM_END, PROGRAM_START } from "../program";
import { Store, sortByDate, fromISO, toISO, fmtShort, weekOf, sessionLoad, mondayOf, bestE1rm, bestValue, linreg, addDays, exportSetsCSV, exportSessionsCSV, exportJumpsCSV, exportCheckinsCSV, download, todayISO, EMPTY, touchCm } from "../store";
import { LineChart, BarChart, Legend, DataTable, Series } from "../charts";
import { Card, Label, Btn, Stat, Tabs, Toggle, DISPLAY } from "../ui";
import { TYPE_META } from "./Log";
import { insights, Level } from "../insights";

const LEVEL_COLOR: Record<Level, string> = { good: COLORS.accent, warn: COLORS.orange, bad: COLORS.red, info: COLORS.blue };

type Range = "4w" | "8w" | "all";

export default function Analyse({ store, setStore }: { store: Store; setStore: (f: (s: Store) => Store) => void }) {
  const [range, setRange] = useState<Range>("all");
  const [tables, setTables] = useState(false);
  const [lift, setLift] = useState<string | null>(null);
  const today = todayISO();
  const since = range === "all" ? "0000-00-00" : addDays(today, range === "4w" ? -28 : -56);
  const inRange = <T extends { date: string }>(a: T[]) => a.filter(x => x.date >= since);
  const ms = (iso: string) => fromISO(iso).getTime();
  const xFmt = (x: number) => fmtShort(toISO(new Date(x)));

  // ---- Vertical ----
  const jumps = inRange(sortByDate(store.jumps));
  const allJumps = sortByDate(store.jumps.filter(j => j.standing != null));
  const standing = jumps.filter(j => j.standing != null).map(j => ({ x: ms(j.date), y: j.standing! }));
  const approach = jumps.filter(j => j.approach != null).map(j => ({ x: ms(j.date), y: j.approach! }));
  const goal = store.settings.goalIn;
  const reg = linreg(allJumps.map(j => ({ x: ms(j.date), y: j.standing! })));
  const projected = reg && allJumps.length >= 3 ? reg.intercept + reg.slope * ms(PROGRAM_END) : null;
  const latest = allJumps[allJumps.length - 1];
  const first = allJumps[0];
  const appJumps = sortByDate(store.jumps.filter(j => j.approach != null));
  const latestApp = appJumps[appJumps.length - 1];
  const touch = touchCm(store.settings, latestApp?.approach);
  const touchGoal = store.settings.touchGoalCm;
  const perWeek = reg ? reg.slope * 7 * 86400000 : null;

  const vertSeries: Series[] = [
    { name: "Standing", color: CHART.s1, points: standing },
    { name: "Approach", color: CHART.s2, points: approach },
    { name: "Target path", color: CHART.s3, dashed: true, noMarkers: true, points: [{ x: ms(PROGRAM_START), y: store.settings.baselineIn }, { x: ms(PROGRAM_END), y: goal }] },
  ];
  if (projected != null && latest) vertSeries.push({ name: "Projection", color: CHART.s1, dashed: true, noMarkers: true, points: [{ x: ms(latest.date), y: latest.standing! }, { x: ms(PROGRAM_END), y: projected }] });
  const vertX0 = Math.min(ms(PROGRAM_START), ...standing.map(p => p.x), ms(today));
  const vertYs = [...standing, ...approach].map(p => p.y).concat([store.settings.baselineIn, goal, projected ?? goal]);

  // ---- Weekly load ----
  const weeks = useMemo(() => {
    const m = new Map<string, { load: number; n: number; gym: number }>();
    for (const s of inRange(store.sessions)) {
      const k = mondayOf(s.date);
      const e = m.get(k) || { load: 0, n: 0, gym: 0 };
      e.load += sessionLoad(s); e.n += 1; if (s.type === "gym") e.gym += 1;
      m.set(k, e);
    }
    return [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [store.sessions, since]);
  const wkLabel = (k: string) => { const w = weekOf(k); return w <= 0 ? fmtShort(k) : `W${w}`; };

  // ---- Lifts ----
  const liftKeys = useMemo(() => {
    const set = new Map<string, string>();
    for (const s of store.sessions) for (const e of s.exercises) if (e.sets.some(x => x.w != null)) set.set(e.key, e.unit);
    return [...set.entries()];
  }, [store.sessions]);
  const liftKey = lift ?? liftKeys[0]?.[0] ?? null;
  const liftUnit = liftKeys.find(k => k[0] === liftKey)?.[1] ?? "kg";
  const liftPts = useMemo(() => {
    if (!liftKey) return [];
    const out: { x: number; y: number }[] = [];
    for (const s of inRange(sortByDate(store.sessions))) {
      const e = s.exercises.find(x => x.key === liftKey); if (!e) continue;
      const v = liftUnit === "kg" ? bestE1rm(e) : bestValue(e);
      if (v != null) out.push({ x: ms(s.date), y: Math.round(v * 10) / 10 });
    }
    return out;
  }, [store.sessions, liftKey, since]);

  // ---- Body / recovery ----
  const checkins = inRange(sortByDate(store.checkins));
  const weight = checkins.filter(c => c.weight != null).map(c => ({ x: ms(c.date), y: c.weight! }));
  const sleep = checkins.filter(c => c.sleep != null).map(c => ({ x: ms(c.date), y: c.sleep! }));
  const kneeC = checkins.filter(c => c.knee != null).map(c => ({ x: ms(c.date), y: c.knee! }));
  const kneeS = inRange(sortByDate(store.sessions)).filter(s => s.knee != null).map(s => ({ x: ms(s.date), y: s.knee! }));

  // ---- Type split ----
  const byType = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of inRange(store.sessions)) m.set(s.type, (m.get(s.type) || 0) + sessionLoad(s));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [store.sessions, since]);

  const importJSON = () => {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = "application/json";
    inp.onchange = () => {
      const f = inp.files?.[0]; if (!f) return;
      f.text().then(txt => {
        try {
          const data = JSON.parse(txt);
          if (!data || !Array.isArray(data.sessions)) throw new Error("bad");
          if (confirm("Replace all current data with this backup?")) setStore(() => ({ ...EMPTY, ...data, draft: null }));
        } catch { alert("That file is not a valid backup."); }
      });
    };
    inp.click();
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <Tabs tabs={[{ id: "4w", label: "4 wks" }, { id: "8w", label: "8 wks" }, { id: "all", label: "All" }]} value={range} onChange={setRange} />
      </div>
      <div style={{ marginTop: -6, marginBottom: 12 }}><Toggle value={tables} onChange={setTables} label="Show tables" color={COLORS.mutedLight} /></div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Stat value={latest ? `${latest.standing}"` : "–"} label="latest standing" />
        <Stat value={first && latest && first.id !== latest.id ? `${latest.standing! - first.standing! >= 0 ? "+" : ""}${(latest.standing! - first.standing!).toFixed(1)}"` : "–"} label="since first test" color={COLORS.text} />
        <Stat value={projected != null ? `${projected.toFixed(1)}"` : "–"} label="projected 28 Feb" color={projected != null && projected >= goal ? COLORS.accent : COLORS.orange} sub={perWeek != null && allJumps.length >= 3 ? `${perWeek >= 0 ? "+" : ""}${perWeek.toFixed(2)}"/wk trend` : "needs 3+ tests"} />
      </div>

      <Card accent={COLORS.orange} style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>Spike reach · goal {touchGoal}cm</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 26, color: touch != null && touch >= touchGoal ? COLORS.accent : COLORS.orange, lineHeight: 1.1 }}>{touch != null ? `${touch}cm` : "–"}</div>
        </div>
        <div style={{ flex: 1, fontSize: 11, color: COLORS.mutedLight, lineHeight: 1.5 }}>
          {touch == null ? "Needs your standing reach (jump form) and one approach jump." : touch >= touchGoal ? `Reached. Next line is ${touchGoal + 10}cm.` : `${touchGoal - touch}cm to go, about ${Math.ceil((touchGoal - touch) / 2.54 * 2) / 2}in more on the approach jump (latest ${latestApp!.approach}in, reach ${store.settings.reachCm}cm).`}
        </div>
      </Card>

      <Card>
        <Label>What the log says</Label>
        {insights(store).map((i, n) => (
          <div key={n} style={{ display: "flex", gap: 10, padding: "6px 0", borderTop: n ? `1px solid ${COLORS.border}` : "none" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: LEVEL_COLOR[i.level], marginTop: 5, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12, color: LEVEL_COLOR[i.level], fontWeight: 500 }}>{i.title}</div>
              <div style={{ fontSize: 11, color: COLORS.mutedLight, lineHeight: 1.5 }}>{i.detail}</div>
            </div>
          </div>
        ))}
        <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 6 }}>Rules over the last 2-4 weeks: test cadence, pace vs goal, gym frequency, main-lift stalls, knee, sleep, protein, creatine, bodyweight, load spikes.</div>
      </Card>

      <Card>
        <Label>Vertical jump (inches) vs the 40" goal</Label>
        <LineChart series={vertSeries} refLines={[{ y: goal, label: `goal ${goal}"` }]} xFmt={xFmt} yFmt={v => `${v}`} xMin={vertX0} xMax={ms(PROGRAM_END)} yMin={Math.min(...vertYs) - 2} yMax={Math.max(...vertYs) + 2} height={220} />
        <Legend series={vertSeries} />
        <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 8, lineHeight: 1.5 }}>
          Target path is the straight line from {store.settings.baselineIn}" at the start to {goal}" on 28 Feb. Projection is a linear fit through every standing test. Expect the line to dip in heavy weeks and jump after deloads, so judge it over 3 to 4 weeks, not test to test.
        </div>
        {tables && <DataTable head={["Date", "Wk", "Standing", "Approach", "Broad", "Notes"]} rows={sortByDate(jumps, true).map(j => [fmtShort(j.date), weekOf(j.date), j.standing, j.approach, j.broad, j.notes])} />}
      </Card>

      <Card>
        <Label>Weekly training load (session RPE × minutes)</Label>
        <BarChart bars={weeks.map(([k, v]) => ({ label: wkLabel(k), value: v.load, sub: `${v.n} sessions, ${v.gym} gym` }))} yFmt={v => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : `${v}`} />
        <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 8, lineHeight: 1.5 }}>Includes volleyball, judo and classes. A sudden week-on-week jump above ~30% is when tendons complain. Deload weeks should be visibly lower.</div>
        {tables && <DataTable head={["Week", "Load", "Sessions", "Gym"]} rows={[...weeks].reverse().map(([k, v]) => [wkLabel(k) + " · " + fmtShort(k), v.load, v.n, v.gym])} />}
      </Card>

      <Card>
        <Label>Gym sessions per week (target 3)</Label>
        <BarChart bars={weeks.map(([k, v]) => ({ label: wkLabel(k), value: v.gym, color: v.gym >= 3 ? CHART.s3 : CHART.s4 }))} yFmt={v => `${v}`} height={120} highlightLast={false} />
      </Card>

      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Label style={{ marginBottom: 0 }}>Lift progression{liftUnit === "kg" ? " (estimated 1RM, kg)" : ` (best ${liftUnit})`}</Label>
        </div>
        {liftKeys.length === 0 ? <div style={{ fontSize: 12, color: COLORS.muted, padding: "16px 0", textAlign: "center" }}>Log a gym session with weights to see progression.</div> : (
          <>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {liftKeys.map(([k]) => <Btn key={k} small ghost={k !== liftKey} color={COLORS.accent} onClick={() => setLift(k)} style={{ textTransform: "none", letterSpacing: 0 }}>{k}</Btn>)}
            </div>
            <LineChart series={[{ name: liftKey!, color: CHART.s1, points: liftPts }]} xFmt={xFmt} yFmt={v => `${v}`} height={170} />
            {tables && <DataTable head={["Date", liftUnit === "kg" ? "e1RM" : "Best"]} rows={[...liftPts].reverse().map(p => [xFmt(p.x), p.y])} />}
          </>
        )}
      </Card>

      <Card>
        <Label>Knee / tendon pain (0 to 10)</Label>
        <LineChart series={[{ name: "Check-in", color: CHART.s2, points: kneeC }, { name: "During session", color: CHART.s1, points: kneeS }]} refLines={[{ y: 4, label: "plyo cut-off" }]} xFmt={xFmt} yFmt={v => `${v}`} yMin={0} yMax={10} height={150} />
        <Legend series={[{ name: "Check-in", color: CHART.s2 }, { name: "During session", color: CHART.s1 }]} />
      </Card>

      <Card>
        <Label>Bodyweight (kg)</Label>
        <LineChart series={[{ name: "Weight", color: CHART.s1, points: weight }]} xFmt={xFmt} yFmt={v => `${v}`} height={150} />
        {tables && <DataTable head={["Date", "kg", "Sleep", "Sore", "Knee", "Energy", "Protein", "Creatine"]} rows={[...checkins].reverse().map(c => [fmtShort(c.date), c.weight, c.sleep, c.soreness, c.knee != null ? `${c.knee}${c.knee > 0 && c.kneeSide ? " " + c.kneeSide : ""}` : null, c.energy, c.protein ? "✓" : "", c.creatine ? "✓" : ""])} />}
      </Card>

      <Card>
        <Label>Sleep (hours)</Label>
        <LineChart series={[{ name: "Sleep", color: CHART.s1, points: sleep }]} refLines={[{ y: 8, label: "8h" }]} xFmt={xFmt} yFmt={v => `${v}`} yMin={4} yMax={10} height={140} />
      </Card>

      <Card>
        <Label>Load by activity</Label>
        {byType.length === 0 ? <div style={{ fontSize: 12, color: COLORS.muted }}>No sessions yet.</div> : byType.map(([t, v]) => {
          const max = byType[0][1] || 1;
          return (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 11 }}>
              <span style={{ width: 110, color: COLORS.mutedLight }}>{TYPE_META[t as keyof typeof TYPE_META]?.label ?? t}</span>
              <div style={{ flex: 1, height: 10, background: COLORS.border, borderRadius: 3, overflow: "hidden" }}><div style={{ width: `${(v / max) * 100}%`, height: "100%", background: CHART.s1, borderRadius: 3 }} /></div>
              <span style={{ width: 44, textAlign: "right", color: COLORS.text, fontVariantNumeric: "tabular-nums" }}>{v}</span>
            </div>
          );
        })}
      </Card>

      <Card>
        <Label>Export / backup</Label>
        <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 8, lineHeight: 1.5 }}>Data lives only in this browser. Export a JSON backup regularly. The CSVs open in Excel, Numbers or Python for your own analysis.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          <Btn small ghost onClick={() => download(`vertical-backup-${today}.json`, JSON.stringify({ ...store, draft: null }, null, 2), "application/json")}>JSON backup</Btn>
          <Btn small ghost color={COLORS.mutedLight} onClick={importJSON}>Import JSON</Btn>
          <Btn small ghost color={COLORS.blue} onClick={() => download(`sets-${today}.csv`, exportSetsCSV(store), "text/csv")}>Sets CSV</Btn>
          <Btn small ghost color={COLORS.blue} onClick={() => download(`sessions-${today}.csv`, exportSessionsCSV(store), "text/csv")}>Sessions CSV</Btn>
          <Btn small ghost color={COLORS.blue} onClick={() => download(`jumps-${today}.csv`, exportJumpsCSV(store), "text/csv")}>Jumps CSV</Btn>
          <Btn small ghost color={COLORS.blue} onClick={() => download(`checkins-${today}.csv`, exportCheckinsCSV(store), "text/csv")}>Check-ins CSV</Btn>
        </div>
      </Card>
    </div>
  );
}
