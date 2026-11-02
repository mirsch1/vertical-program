import { useState } from "react";
import { BLOCKS, COLORS, PROGRAM_END, PROGRAM_START, TEMPLATES, blockOfWeek, dayPlan, isDeloadWeek } from "../program";
import { Store, ActivityType, Session, JumpTest, Checkin, todayISO, weekOf, dowOf, daysBetween, fmtFull, fmtShort, isMatchWeek, sortByDate, newDraft, mondayOf, addDays, kneeLabel, touchCm } from "../store";
import { Card, Label, Pill, Btn, Stat, Toggle, DISPLAY } from "../ui";
import { ActivityForm, JumpForm, CheckinForm } from "./Log";
import SessionDetail from "./SessionDetail";

export default function Today({ store, setStore, onStartGym, goPlan }: { store: Store; setStore: (f: (s: Store) => Store) => void; onStartGym: () => void; goPlan: () => void }) {
  const today = todayISO();
  const week = weekOf(today);
  const dow = dowOf(today);
  const match = isMatchWeek(store.settings, week);
  const plan = dayPlan(dow, match, week);
  const block = BLOCKS[blockOfWeek(week)];
  const [form, setForm] = useState<null | ActivityType | "jump" | "checkin" | "detail">(null);

  const jumps = sortByDate(store.jumps.filter(j => j.standing != null));
  const latest = jumps[jumps.length - 1];
  const baseline = jumps[0];
  const goal = store.settings.goalIn;
  const daysLeft = Math.max(0, daysBetween(today, PROGRAM_END));
  const started = today >= PROGRAM_START;
  const gap = latest ? goal - latest.standing! : goal - store.settings.baselineIn;
  const perWeekNeeded = daysLeft > 0 ? (gap / (daysLeft / 7)) : 0;

  const appJumps = sortByDate(store.jumps.filter(j => j.approach != null));
  const latestApp = appJumps[appJumps.length - 1];
  const touch = touchCm(store.settings, latestApp?.approach);
  const monday = mondayOf(today);
  const weekSessions = store.sessions.filter(s => s.date >= monday && s.date <= addDays(monday, 6));
  const gymThisWeek = weekSessions.filter(s => s.type === "gym").length;
  const checkin = store.checkins.find(c => c.date === today);

  const saveSession = (s: Session) => { setStore(st => ({ ...st, sessions: [...st.sessions, s] })); setForm(null); };
  const saveJump = (j: JumpTest) => { setStore(st => ({ ...st, jumps: [...st.jumps, j] })); setForm(null); };
  const saveCheckin = (c: Checkin) => { setStore(st => ({ ...st, checkins: [...st.checkins.filter(x => x.date !== c.date), c] })); setForm(null); };
  const setReach = (v: number | null) => setStore(st => ({ ...st, settings: { ...st.settings, reachCm: v } }));
  const startGym = () => { setStore(s => ({ ...s, draft: newDraft(plan.kind!, week, s) })); onStartGym(); };

  if (form === "detail" && plan.kind) return <SessionDetail kind={plan.kind} week={week} onBack={() => setForm(null)} onStart={startGym} />;

  const loggedToday = weekSessions.filter(s => s.date === today);
  const typeFor = plan.type === "volley" ? "volley" : plan.type === "match" ? "match" : plan.type === "judo" ? "judo" : null;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <Stat value={latest ? `${latest.standing}"` : `${store.settings.baselineIn}"`} label={latest ? `standing · ${fmtShort(latest.date)}` : "standing (assumed)"} />
        <Stat value={`${goal}"`} label="goal · 28 Feb" color={COLORS.text} />
        <Stat value={daysLeft} label="days left" color={COLORS.text} sub={gap > 0 ? `+${perWeekNeeded.toFixed(2)}"/wk needed` : "goal reached"} />
      </div>
      {(touch != null || store.settings.reachCm == null) && (
        <div style={{ fontSize: 11, color: COLORS.mutedLight, marginBottom: 8 }}>
          {touch != null
            ? <>Approach touch: <span style={{ color: touch >= store.settings.touchGoalCm ? COLORS.accent : COLORS.text }}>{touch}cm</span> · goal {store.settings.touchGoalCm}cm · {touch >= store.settings.touchGoalCm ? "reached" : `${store.settings.touchGoalCm - touch}cm to go`}</>
            : <>Save your standing reach in the jump form to track your spike touch against {store.settings.touchGoalCm}cm.</>}
        </div>
      )}
      {latest && baseline && latest.id !== baseline.id && (
        <div style={{ fontSize: 11, color: COLORS.mutedLight, marginBottom: 12 }}>
          Since first test ({fmtShort(baseline.date)}): <span style={{ color: latest.standing! >= baseline.standing! ? COLORS.accent : COLORS.red }}>{latest.standing! - baseline.standing! >= 0 ? "+" : ""}{(latest.standing! - baseline.standing!).toFixed(1)}"</span>
        </div>
      )}

      <Label>{fmtFull(today)} · {week <= 0 ? "baseline week" : week > 17 ? "program complete" : `week ${week} · ${block.name}${isDeloadWeek(week) ? " · deload" : ""}`}</Label>

      {store.draft && (
        <Card accent={TEMPLATES[store.draft.kind].color} onClick={onStartGym}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Session in progress: {TEMPLATES[store.draft.kind].name}</div>
              <div style={{ fontSize: 11, color: COLORS.muted }}>Started {Math.round((Date.now() - store.draft.startedAt) / 60000)} min ago. Tap to resume.</div>
            </div>
            <span style={{ color: COLORS.border, fontSize: 18 }}>›</span>
          </div>
        </Card>
      )}

      <Card accent={plan.color}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8 }}>
          <div style={{ width: 52, height: 52, borderRadius: 10, background: `${plan.color}18`, border: `1px solid ${plan.color}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: DISPLAY, fontSize: 16, color: plan.color }}>
            {plan.kind ? TEMPLATES[plan.kind].short : plan.type === "rest" ? "OFF" : plan.type === "judo" ? "JUDO" : plan.type === "match" ? "GAME" : "VB"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 500 }}>{plan.label}</div>
            <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.5 }}>{plan.detail}{plan.kind ? ` ${TEMPLATES[plan.kind].minutes}.` : ""}</div>
          </div>
        </div>
        {plan.kind && !store.draft && (
          <div style={{ display: "flex", gap: 8 }}>
            <Btn ghost color={plan.color} onClick={() => setForm("detail")}>View session</Btn>
            <Btn color={plan.color} style={{ flex: 1 }} onClick={startGym}>Start and log</Btn>
          </div>
        )}
        {typeFor && !loggedToday.some(s => s.type === typeFor) && <Btn color={plan.color} style={{ width: "100%" }} onClick={() => setForm(typeFor)}>Log {plan.type === "volley" ? "volleyball" : plan.type}</Btn>}
        {loggedToday.length > 0 && <div style={{ fontSize: 11, color: COLORS.accent, marginTop: 6 }}>Logged today: {loggedToday.map(s => s.title).join(", ")}</div>}
      </Card>

      {form && form !== "detail" && form !== "jump" && form !== "checkin" && <ActivityForm type={form} onSave={saveSession} onCancel={() => setForm(null)} />}
      {form === "jump" && <JumpForm reachCm={store.settings.reachCm} setReachCm={setReach} onSave={saveJump} onCancel={() => setForm(null)} />}
      {form === "checkin" && <CheckinForm date={today} existing={checkin} onSave={saveCheckin} onCancel={() => setForm(null)} compact />}

      {(dow === 1 || dow === 2) && (
        <div style={{ marginBottom: 10 }}>
          <Toggle value={match} color={COLORS.orange} label={match ? "Match this Wednesday (Tue = recovery)" : "No match this Wednesday (Tue = lift)"}
            onChange={v => setStore(s => ({ ...s, settings: { ...s.settings, matchWeeks: { ...s.settings.matchWeeks, [String(week)]: v } } }))} />
        </div>
      )}

      {!form && (
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <Btn ghost color={COLORS.teal} style={{ flex: 1 }} onClick={() => setForm("checkin")}>{checkin ? "Edit check-in" : "Daily check-in"}</Btn>
          <Btn ghost color={COLORS.accent} style={{ flex: 1 }} onClick={() => setForm("jump")}>Log jump test</Btn>
        </div>
      )}
      {checkin && !form && (
        <div style={{ fontSize: 11, color: COLORS.mutedLight, marginBottom: 12 }}>
          Today: {[checkin.weight != null && `${Math.round(checkin.weight * 10) / 10}kg`, checkin.sleep != null && `${checkin.sleep}h`, checkin.knee != null && kneeLabel(checkin.knee, checkin.kneeSide), checkin.energy != null && `energy ${checkin.energy}/5`, checkin.protein && "protein ✓", checkin.creatine && "creatine ✓"].filter(Boolean).join(" · ") || "check-in saved"}
        </div>
      )}

      <Card onClick={goPlan}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <Label style={{ marginBottom: 0 }}>This week</Label>
          <span style={{ fontSize: 11, color: gymThisWeek >= 3 ? COLORS.accent : COLORS.mutedLight }}>{gymThisWeek}/3 gym</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[1, 2, 3, 4, 5, 6, 0].map(d => {
            const p = dayPlan(d, match, week);
            const date = addDays(monday, d === 0 ? 6 : d - 1);
            const done = store.sessions.some(s => s.date === date && (p.type === "gym" ? s.type === "gym" : p.type === "rest" ? false : s.type === p.type || (p.type === "volley" && s.type === "volley")));
            const isT = date === today;
            return (
              <div key={d} style={{ flex: 1, textAlign: "center", padding: "6px 0", borderRadius: 6, border: `1px solid ${isT ? COLORS.accent + "88" : COLORS.border}`, background: done ? `${p.color}22` : "transparent" }}>
                <div style={{ fontSize: 8, color: COLORS.muted }}>{["S","M","T","W","T","F","S"][d]}</div>
                <div style={{ fontSize: 10, color: done ? p.color : p.type === "rest" ? COLORS.border : COLORS.mutedLight }}>{p.kind ? TEMPLATES[p.kind].short : p.type === "rest" ? "–" : p.type === "judo" ? "JD" : p.type === "match" ? "GM" : "VB"}</div>
              </div>
            );
          })}
        </div>
        {!started && <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 8 }}>Program starts Mon 2 Nov. This week: Thursday, measure your standing reach and test the jump with the wall method (Plan › Method explains it). Weights start from your Smith squat and trap bar numbers.</div>}
      </Card>

      {week > 0 && week <= 17 && (
        <Card accent={block.color} style={{ background: `${block.color}0a` }}>
          <div style={{ fontSize: 12, color: block.color, fontWeight: 500, marginBottom: 4 }}>{block.name} block focus</div>
          {block.focus.map((f, i) => <div key={i} style={{ fontSize: 11, color: COLORS.mutedLight, padding: "2px 0" }}>→ {f}</div>)}
        </Card>
      )}
    </div>
  );
}
