import { useEffect, useState } from "react";
import { BLOCKS, COLORS, TEMPLATES, blockOfWeek, isDeloadWeek, DELOAD_RULE, VOLUME_RULE } from "../program";
import { Store, Session, JumpTest, SetEntry, KneeSide, uid, bestE1rm, lastSetsFor } from "../store";
import { Card, Label, Pill, Btn, NumInput, Field, Row, Scale, Toggle, Input, TAG_COLORS, DISPLAY } from "../ui";
import { JumpInputs, JumpValues, KneeSidePick } from "./Log";

export default function SessionRunner({ store, setStore, onDone }: { store: Store; setStore: (f: (s: Store) => Store) => void; onDone: () => void }) {
  const draft = store.draft!;
  const t = TEMPLATES[draft.kind];
  const b = blockOfWeek(draft.week);
  const deload = isDeloadWeek(draft.week);
  const [finishing, setFinishing] = useState(false);
  const [rpe, setRpe] = useState<number | null>(null);
  const [knee, setKnee] = useState<number | null>(null);
  const [kneeSide, setKneeSide] = useState<KneeSide | undefined>(undefined);
  const [sauna, setSauna] = useState(true);
  const [notes, setNotes] = useState("");
  const [minutes, setMinutes] = useState<number | null>(null);
  const [jump, setJump] = useState<JumpValues>({ standing: null, approach: null });
  const setReach = (v: number | null) => setStore(s => ({ ...s, settings: { ...s.settings, reachCm: v } }));
  const [, tick] = useState(0);
  useEffect(() => { const i = setInterval(() => tick(x => x + 1), 30000); return () => clearInterval(i); }, []);
  const elapsed = Math.round((Date.now() - draft.startedAt) / 60000);

  const update = (f: (d: typeof draft) => typeof draft) => setStore(s => ({ ...s, draft: f(s.draft!) }));
  const setSet = (ei: number, si: number, patch: Partial<SetEntry>) => update(d => ({ ...d, exercises: d.exercises.map((e, i) => i !== ei ? e : { ...e, sets: e.sets.map((s, j) => j !== si ? s : { ...s, ...patch }) }) }));
  const addSet = (ei: number) => update(d => ({ ...d, exercises: d.exercises.map((e, i) => i !== ei ? e : { ...e, sets: [...e.sets, { ...(e.sets[e.sets.length - 1] || { w: null, r: null }) }] }) }));
  const removeSet = (ei: number, si: number) => update(d => ({ ...d, exercises: d.exercises.map((e, i) => i !== ei ? e : { ...e, sets: e.sets.filter((_, j) => j !== si) }) }));

  const finish = () => {
    const session: Session = {
      id: uid(), date: draft.date, type: "gym", kind: draft.kind, title: t.name,
      minutes: minutes ?? elapsed, rpe, sauna, knee, kneeSide: knee && knee > 0 ? kneeSide : undefined, notes, createdAt: Date.now(),
      // A kg set counts once reps are entered (weights are prefilled from last time); other units count once a value is entered.
      exercises: draft.exercises.map(e => ({ ...e, sets: e.sets.filter(s => (e.unit === "kg" ? s.r != null && s.w != null : s.w != null)) })).filter(e => e.sets.length),
    };
    const jumps: JumpTest[] = (jump.standing != null || jump.approach != null)
      ? [{ id: uid(), date: draft.date, standing: jump.standing, approach: jump.approach, broad: null, notes: "Thursday test" }] : [];
    setStore(s => ({ ...s, draft: null, sessions: [...s.sessions, session], jumps: [...s.jumps, ...jumps] }));
    onDone();
  };
  const discard = () => { if (confirm("Discard this session? Nothing will be saved.")) { setStore(s => ({ ...s, draft: null })); onDone(); } };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: COLORS.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>Logging · week {draft.week} · {BLOCKS[b].name}{deload ? " · deload" : ""}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 22, color: t.color, letterSpacing: "0.04em" }}>{t.name}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 22, color: elapsed > 60 ? COLORS.red : COLORS.text, lineHeight: 1 }}>{elapsed}<span style={{ fontSize: 12 }}> min</span></div>
          <div style={{ fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>target &lt; 60</div>
        </div>
      </div>
      {deload && <Card accent={COLORS.muted}><div style={{ fontSize: 11, color: COLORS.mutedLight }}>{DELOAD_RULE}</div></Card>}
      {t.warning && <Card accent={COLORS.red}><div style={{ fontSize: 11, color: "#fda4af" }}>{t.warning}</div></Card>}
      {draft.kind !== "R" && <div style={{ fontSize: 10, color: COLORS.muted, lineHeight: 1.5, margin: "-2px 2px 10px" }}>{VOLUME_RULE}</div>}

      {draft.kind === "C" && (
        <Card accent={COLORS.accent}>
          <Label color={COLORS.accent}>Jump test · best of 3</Label>
          <JumpInputs value={jump} onChange={setJump} reachCm={store.settings.reachCm} setReachCm={setReach} />
          <div style={{ fontSize: 11, color: COLORS.muted }}>{t.exercises[0].rx[b].note}</div>
        </Card>
      )}

      {draft.exercises.map((ex, ei) => {
        const def = t.exercises.find(e => e.key === ex.key)!;
        const rx = def.rx[b];
        const last = lastSetsFor(store, ex.key);
        const best = ex.unit === "kg" ? bestE1rm(ex) : null;
        return (
          <Card key={ex.key}>
            <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{ex.key}</span>
              <Pill color={TAG_COLORS[def.tag] || COLORS.muted}>{def.tag}</Pill>
            </div>
            <div style={{ fontSize: 11, color: t.color, marginBottom: 2 }}>{deload ? (def.plyo ? "half of " : "1 of ") : ""}{rx.sets} × {rx.reps}{rx.load ? ` @ ${rx.load}` : ""}{def.plyo ? "" : " working"}</div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginBottom: 8, lineHeight: 1.5 }}>{rx.note}</div>
            {def.start && !last && <div style={{ fontSize: 10, color: COLORS.accent, marginBottom: 6, lineHeight: 1.5 }}>{def.start}</div>}
            {last && <div style={{ fontSize: 10, color: COLORS.mutedLight, marginBottom: 6 }}>Last time: {last.filter(s => s.w != null).map(s => `${s.w}${ex.unit === "kg" ? "" : ex.unit}${s.r != null ? "×" + s.r : ""}`).join(", ")}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 28px", gap: 6, alignItems: "center", fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>
              <span>#</span><span>{ex.unit === "kg" ? "kg" : ex.unit === "sec" ? "seconds" : ex.unit === "cm" ? "box cm" : ex.unit}</span><span>{ex.unit === "reps" || ex.unit === "sec" ? "" : "reps"}</span><span />
            </div>
            {ex.sets.map((s, si) => (
              <div key={si} style={{ display: "grid", gridTemplateColumns: "24px 1fr 1fr 28px", gap: 6, alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: COLORS.muted }}>{si + 1}</span>
                <NumInput value={s.w} onChange={v => setSet(ei, si, { w: v })} placeholder={ex.unit === "kg" ? "kg" : ex.unit} step={ex.unit === "kg" ? "0.5" : "1"} />
                {ex.unit === "reps" || ex.unit === "sec" ? <span /> : <NumInput value={s.r} onChange={v => setSet(ei, si, { r: v })} placeholder="reps" step="1" />}
                <button onClick={() => removeSet(ei, si)} style={{ background: "none", border: "none", color: COLORS.muted, fontSize: 16, cursor: "pointer" }}>×</button>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
              <Btn small ghost color={t.color} onClick={() => addSet(ei)}>+ set</Btn>
              {best != null && <span style={{ fontSize: 10, color: COLORS.mutedLight }}>est. 1RM {Math.round(best)}kg</span>}
            </div>
          </Card>
        );
      })}

      <Card accent={t.color} style={{ background: `${t.color}0d` }}>
        <Label color={t.color}>Finisher</Label>
        <div style={{ fontSize: 12 }}>{t.finisher}</div>
      </Card>

      {!finishing ? (
        <div style={{ display: "flex", gap: 8 }}>
          <Btn ghost color={COLORS.red} onClick={discard}>Discard</Btn>
          <Btn color={t.color} style={{ flex: 1 }} onClick={() => { setMinutes(elapsed); setFinishing(true); }}>Finish session</Btn>
        </div>
      ) : (
        <Card accent={t.color}>
          <Label>How did it go?</Label>
          <Row><Field label="Minutes"><NumInput value={minutes} onChange={setMinutes} step="1" /></Field><Field label="Date"><Input type="date" value={draft.date} onChange={v => update(d => ({ ...d, date: v }))} /></Field></Row>
          <Field label="Session RPE (1 easy, 10 all-out)" style={{ marginBottom: 10 }}><Scale value={rpe} onChange={setRpe} min={1} max={10} color={t.color} /></Field>
          <Field label="Knee / tendon pain (0 none, 10 worst)" style={{ marginBottom: 10 }}><Scale value={knee} onChange={setKnee} min={0} max={10} color={COLORS.red} /></Field>
          <KneeSidePick knee={knee} value={kneeSide} onChange={setKneeSide} />
          <div style={{ marginBottom: 10 }}><Toggle value={sauna} onChange={setSauna} label="Sauna after" /></div>
          <Field label="Notes" style={{ marginBottom: 12 }}><Input value={notes} onChange={setNotes} placeholder="How it felt, PRs, anything off" /></Field>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn ghost color={COLORS.muted} onClick={() => setFinishing(false)}>Back</Btn>
            <Btn color={t.color} style={{ flex: 1 }} onClick={finish}>Save session</Btn>
          </div>
        </Card>
      )}
    </div>
  );
}
