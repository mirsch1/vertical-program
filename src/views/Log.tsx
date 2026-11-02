import { useState } from "react";
import { COLORS, TEMPLATES, SessionKind } from "../program";
import { Store, Session, JumpTest, Checkin, ActivityType, KneeSide, uid, todayISO, fmtFull, sortByDate, sessionLoad, weekOf, newDraft, bestE1rm, cmToIn, kneeLabel } from "../store";
import { Card, Label, Pill, Btn, NumInput, Field, Row, Scale, Toggle, Input, DISPLAY } from "../ui";

/** Which knee, shown only once a pain score above 0 is entered. */
export function KneeSidePick({ knee, value, onChange }: { knee: number | null; value?: KneeSide; onChange: (s: KneeSide | undefined) => void }) {
  if (knee == null || knee <= 0) return null;
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: -4, marginBottom: 10 }}>
      <span style={{ fontSize: 10, color: COLORS.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Which knee</span>
      {(["L", "R", "both"] as KneeSide[]).map(s => (
        <button key={s} onClick={() => onChange(value === s ? undefined : s)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontFamily: "inherit", cursor: "pointer", border: `1px solid ${value === s ? COLORS.red : COLORS.border}`, background: value === s ? `${COLORS.red}22` : "transparent", color: value === s ? COLORS.red : COLORS.mutedLight }}>{s === "both" ? "Both" : s === "L" ? "Left" : "Right"}</button>
      ))}
    </div>
  );
}

export type JumpValues = { standing: number | null; approach: number | null };

/** Standing / approach entry, either straight in inches or via wall touch heights in cm. */
export function JumpInputs({ value, onChange, reachCm, setReachCm }: { value: JumpValues; onChange: (v: JumpValues) => void; reachCm: number | null; setReachCm: (v: number | null) => void }) {
  const [mode, setMode] = useState<"wall" | "in">("wall");
  const [touch, setTouch] = useState<{ s: number | null; a: number | null }>({ s: null, a: null });
  const calc = (t: number | null, reach: number | null) => (t != null && reach != null && t > reach ? cmToIn(t - reach) : null);
  const setT = (patch: Partial<{ s: number | null; a: number | null }>) => {
    const nt = { ...touch, ...patch }; setTouch(nt);
    onChange({ standing: calc(nt.s, reachCm), approach: calc(nt.a, reachCm) });
  };
  const setReach = (v: number | null) => { setReachCm(v); onChange({ standing: calc(touch.s, v), approach: calc(touch.a, v) }); };
  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        {(["wall", "in"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 11, fontFamily: "inherit", cursor: "pointer", border: `1px solid ${mode === m ? COLORS.accent : COLORS.border}`, background: mode === m ? `${COLORS.accent}22` : "transparent", color: mode === m ? COLORS.accent : COLORS.mutedLight }}>{m === "wall" ? "Wall touch (cm)" : "Inches"}</button>
        ))}
      </div>
      {mode === "wall" ? (
        <div>
          <Row>
            <Field label="Standing reach cm"><NumInput value={reachCm} onChange={setReach} step="0.5" placeholder="245" /></Field>
            <Field label="Standing touch cm"><NumInput value={touch.s} onChange={v => setT({ s: v })} step="0.5" placeholder="330" /></Field>
            <Field label="Approach touch cm"><NumInput value={touch.a} onChange={v => setT({ a: v })} step="0.5" placeholder="335" /></Field>
          </Row>
          <div style={{ fontSize: 11, color: COLORS.mutedLight, marginBottom: 8 }}>
            {reachCm == null ? "Enter your standing reach once. It is saved." : `= standing ${value.standing != null ? value.standing + '"' : "–"} · approach ${value.approach != null ? value.approach + '"' : "–"}`}
          </div>
        </div>
      ) : (
        <Row>
          <Field label="Standing (in)"><NumInput value={value.standing} onChange={v => onChange({ ...value, standing: v })} step="0.5" placeholder="30" /></Field>
          <Field label="Approach (in)"><NumInput value={value.approach} onChange={v => onChange({ ...value, approach: v })} step="0.5" placeholder="34" /></Field>
        </Row>
      )}
    </div>
  );
}

export const TYPE_META: Record<ActivityType, { label: string; short: string; color: string; minutes: number }> = {
  gym: { label: "Gym", short: "GYM", color: COLORS.accent, minutes: 55 },
  volley: { label: "Volleyball training", short: "VB", color: COLORS.orange, minutes: 120 },
  match: { label: "Volleyball match", short: "GAME", color: COLORS.orange, minutes: 90 },
  judo: { label: "Judo", short: "JUDO", color: COLORS.pink, minutes: 90 },
  class: { label: "Pilates / yoga", short: "CLASS", color: COLORS.teal, minutes: 50 },
  cycle: { label: "Cycling", short: "BIKE", color: COLORS.blue, minutes: 30 },
  other: { label: "Other", short: "OTHER", color: COLORS.muted, minutes: 45 },
};

export function ActivityForm({ type, initialDate, onSave, onCancel }: { type: ActivityType; initialDate?: string; onSave: (s: Session) => void; onCancel: () => void }) {
  const m = TYPE_META[type];
  const [date, setDate] = useState(initialDate ?? todayISO());
  const [minutes, setMinutes] = useState<number | null>(m.minutes);
  const [rpe, setRpe] = useState<number | null>(null);
  const [knee, setKnee] = useState<number | null>(null);
  const [kneeSide, setKneeSide] = useState<KneeSide | undefined>(undefined);
  const [sauna, setSauna] = useState(false);
  const [title, setTitle] = useState(m.label);
  const [notes, setNotes] = useState("");
  return (
    <Card accent={m.color}>
      <Label color={m.color}>Log {m.label.toLowerCase()}</Label>
      {type === "other" && <Field label="What" style={{ marginBottom: 8 }}><Input value={title} onChange={setTitle} /></Field>}
      <Row><Field label="Date"><Input type="date" value={date} onChange={setDate} /></Field><Field label="Minutes"><NumInput value={minutes} onChange={setMinutes} step="1" /></Field></Row>
      <Field label="RPE (1 easy, 10 all-out)" style={{ marginBottom: 10 }}><Scale value={rpe} onChange={setRpe} min={1} max={10} color={m.color} /></Field>
      <Field label="Knee / tendon pain (0 to 10)" style={{ marginBottom: 10 }}><Scale value={knee} onChange={setKnee} min={0} max={10} color={COLORS.red} /></Field>
      <KneeSidePick knee={knee} value={kneeSide} onChange={setKneeSide} />
      <div style={{ marginBottom: 10 }}><Toggle value={sauna} onChange={setSauna} label="Sauna after" /></div>
      <Field label="Notes" style={{ marginBottom: 12 }}><Input value={notes} onChange={setNotes} placeholder={type === "volley" ? "How the legs felt, e-bike home?" : "Anything worth remembering"} /></Field>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn ghost color={COLORS.muted} onClick={onCancel}>Cancel</Btn>
        <Btn color={m.color} style={{ flex: 1 }} onClick={() => onSave({ id: uid(), date, type, title, minutes, rpe, knee, kneeSide: knee && knee > 0 ? kneeSide : undefined, sauna, notes, exercises: [], createdAt: Date.now() })}>Save</Btn>
      </div>
    </Card>
  );
}

export function JumpForm({ initialDate, reachCm, setReachCm, onSave, onCancel }: { initialDate?: string; reachCm: number | null; setReachCm: (v: number | null) => void; onSave: (j: JumpTest) => void; onCancel: () => void }) {
  const [date, setDate] = useState(initialDate ?? todayISO());
  const [v, setV] = useState<JumpValues>({ standing: null, approach: null });
  const [broad, setBroad] = useState<number | null>(null);
  const [notes, setNotes] = useState("");
  return (
    <Card accent={COLORS.accent}>
      <Label color={COLORS.accent}>Jump test · best of 3</Label>
      <Row><Field label="Date"><Input type="date" value={date} onChange={setDate} /></Field><Field label="Broad jump cm"><NumInput value={broad} onChange={setBroad} step="1" placeholder="opt." /></Field></Row>
      <JumpInputs value={v} onChange={setV} reachCm={reachCm} setReachCm={setReachCm} />
      <Field label="Notes" style={{ marginBottom: 12 }}><Input value={notes} onChange={setNotes} placeholder="Fresh or fatigued, which wall" /></Field>
      <div style={{ display: "flex", gap: 8 }}>
        <Btn ghost color={COLORS.muted} onClick={onCancel}>Cancel</Btn>
        <Btn style={{ flex: 1 }} disabled={v.standing == null && v.approach == null} onClick={() => onSave({ id: uid(), date, standing: v.standing, approach: v.approach, broad, notes })}>Save</Btn>
      </div>
    </Card>
  );
}

export function CheckinForm({ existing, date, onSave, onCancel, compact }: { existing?: Checkin; date: string; onSave: (c: Checkin) => void; onCancel?: () => void; compact?: boolean }) {
  const [c, setC] = useState<Checkin>(existing ?? { date, weight: null, sleep: null, soreness: null, knee: null, energy: null, protein: false, creatine: false, notes: "" });
  const p = (patch: Partial<Checkin>) => setC(x => ({ ...x, ...patch }));
  return (
    <Card accent={COLORS.teal}>
      <Label color={COLORS.teal}>Daily check-in · {fmtFull(c.date)}</Label>
      <Row>
        <Field label="Weight kg"><NumInput value={c.weight} onChange={v => p({ weight: v })} step="0.1" placeholder="100" /></Field>
        <Field label="Sleep h"><NumInput value={c.sleep} onChange={v => p({ sleep: v })} step="0.5" placeholder="8" /></Field>
        {!compact && <Field label="Date"><Input type="date" value={c.date} onChange={v => p({ date: v })} /></Field>}
      </Row>
      <Field label="Soreness (0 to 10)" style={{ marginBottom: 8 }}><Scale value={c.soreness} onChange={v => p({ soreness: v })} color={COLORS.orange} /></Field>
      <Field label="Knee pain (0 to 10)" style={{ marginBottom: 8 }}><Scale value={c.knee} onChange={v => p({ knee: v, kneeSide: v && v > 0 ? c.kneeSide : undefined })} color={COLORS.red} /></Field>
      <KneeSidePick knee={c.knee} value={c.kneeSide} onChange={s => p({ kneeSide: s })} />
      <Field label="Energy (1 flat, 5 fired up)" style={{ marginBottom: 8 }}><Scale value={c.energy} onChange={v => p({ energy: v })} min={1} max={5} color={COLORS.teal} /></Field>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <Toggle value={c.protein} onChange={v => p({ protein: v })} label="Protein hit (180g+)" color={COLORS.teal} />
        <Toggle value={c.creatine} onChange={v => p({ creatine: v })} label="Creatine" color={COLORS.teal} />
      </div>
      <Field label="Notes" style={{ marginBottom: 12 }}><Input value={c.notes} onChange={v => p({ notes: v })} placeholder="Optional" /></Field>
      <div style={{ display: "flex", gap: 8 }}>
        {onCancel && <Btn ghost color={COLORS.muted} onClick={onCancel}>Cancel</Btn>}
        <Btn color={COLORS.teal} style={{ flex: 1 }} onClick={() => onSave(c)}>Save check-in</Btn>
      </div>
    </Card>
  );
}

export default function Log({ store, setStore, onStartGym }: { store: Store; setStore: (f: (s: Store) => Store) => void; onStartGym: () => void }) {
  const [adding, setAdding] = useState<null | "menu" | "gym" | ActivityType | "jump" | "checkin">(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const saveSession = (s: Session) => { setStore(st => ({ ...st, sessions: [...st.sessions, s] })); setAdding(null); };
  const saveJump = (j: JumpTest) => { setStore(st => ({ ...st, jumps: [...st.jumps, j] })); setAdding(null); };
  const saveCheckin = (c: Checkin) => { setStore(st => ({ ...st, checkins: [...st.checkins.filter(x => x.date !== c.date), c] })); setAdding(null); };
  const setReach = (v: number | null) => setStore(st => ({ ...st, settings: { ...st.settings, reachCm: v } }));
  const del = (kind: "s" | "j" | "c", id: string) => {
    if (!confirm("Delete this entry?")) return;
    setStore(st => kind === "s" ? { ...st, sessions: st.sessions.filter(x => x.id !== id) } : kind === "j" ? { ...st, jumps: st.jumps.filter(x => x.id !== id) } : { ...st, checkins: st.checkins.filter(x => x.date !== id) });
  };

  type Entry = { date: string; sort: number; kind: "s"; s: Session } | { date: string; sort: number; kind: "j"; j: JumpTest } | { date: string; sort: number; kind: "c"; c: Checkin };
  const entries: Entry[] = [
    ...store.sessions.map(s => ({ date: s.date, sort: 1, kind: "s" as const, s })),
    ...store.jumps.map(j => ({ date: j.date, sort: 0, kind: "j" as const, j })),
    ...store.checkins.map(c => ({ date: c.date, sort: 2, kind: "c" as const, c })),
  ].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.sort - b.sort));

  const groups: { date: string; items: Entry[] }[] = [];
  for (const e of entries) { const g = groups[groups.length - 1]; if (g && g.date === e.date) g.items.push(e); else groups.push({ date: e.date, items: [e] }); }

  return (
    <div>
      {adding === null && (
        <Btn style={{ width: "100%", marginBottom: 12 }} onClick={() => setAdding("menu")}>+ Add entry</Btn>
      )}
      {adding === "menu" && (
        <Card>
          <Label>What are you logging?</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            <Btn ghost color={COLORS.accent} onClick={() => setAdding("gym")}>Gym session</Btn>
            <Btn ghost color={COLORS.accent} onClick={() => setAdding("jump")}>Jump test</Btn>
            <Btn ghost color={COLORS.orange} onClick={() => setAdding("volley")}>Volleyball training</Btn>
            <Btn ghost color={COLORS.orange} onClick={() => setAdding("match")}>Match</Btn>
            <Btn ghost color={COLORS.pink} onClick={() => setAdding("judo")}>Judo</Btn>
            <Btn ghost color={COLORS.teal} onClick={() => setAdding("class")}>Pilates / yoga</Btn>
            <Btn ghost color={COLORS.teal} onClick={() => setAdding("checkin")}>Daily check-in</Btn>
            <Btn ghost color={COLORS.muted} onClick={() => setAdding("other")}>Other</Btn>
          </div>
          <div style={{ marginTop: 8 }}><Btn small ghost color={COLORS.muted} onClick={() => setAdding(null)}>Cancel</Btn></div>
        </Card>
      )}
      {adding === "gym" && (
        <Card accent={COLORS.accent}>
          <Label color={COLORS.accent}>Which session?</Label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
            {(Object.keys(TEMPLATES) as SessionKind[]).map(k => (
              <Btn key={k} ghost color={TEMPLATES[k].color} onClick={() => { setStore(s => ({ ...s, draft: newDraft(k, weekOf(todayISO()), s) })); setAdding(null); onStartGym(); }}>{TEMPLATES[k].name}</Btn>
            ))}
          </div>
          <div style={{ marginTop: 8 }}><Btn small ghost color={COLORS.muted} onClick={() => setAdding("menu")}>Back</Btn></div>
        </Card>
      )}
      {adding === "jump" && <JumpForm reachCm={store.settings.reachCm} setReachCm={setReach} onSave={saveJump} onCancel={() => setAdding(null)} />}
      {adding === "checkin" && <CheckinForm date={todayISO()} existing={store.checkins.find(c => c.date === todayISO())} onSave={saveCheckin} onCancel={() => setAdding(null)} />}
      {adding && adding !== "menu" && adding !== "gym" && adding !== "jump" && adding !== "checkin" && <ActivityForm type={adding} onSave={saveSession} onCancel={() => setAdding(null)} />}

      {groups.length === 0 && <div style={{ color: COLORS.muted, fontSize: 12, textAlign: "center", padding: 30 }}>Nothing logged yet. Start with a jump test so there is a baseline to beat.</div>}
      {groups.map(g => (
        <div key={g.date} style={{ marginBottom: 14 }}>
          <Label>{fmtFull(g.date)} · week {weekOf(g.date)}</Label>
          {g.items.map(e => {
            if (e.kind === "j") return (
              <Card key={e.j.id} accent={COLORS.accent} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 24, color: COLORS.accent, lineHeight: 1 }}>{e.j.standing ?? "–"}<span style={{ fontSize: 11 }}>in</span></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12 }}>Jump test{e.j.approach != null ? ` · approach ${e.j.approach}in` : ""}{e.j.broad != null ? ` · broad ${e.j.broad}cm` : ""}</div>
                  {e.j.notes && <div style={{ fontSize: 11, color: COLORS.muted }}>{e.j.notes}</div>}
                </div>
                <button onClick={() => del("j", e.j.id)} style={{ background: "none", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 16 }}>×</button>
              </Card>
            );
            if (e.kind === "c") return (
              <Card key={e.c.date} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Pill color={COLORS.teal}>check-in</Pill>
                <div style={{ flex: 1, fontSize: 11, color: COLORS.mutedLight }}>
                  {[e.c.weight != null && `${Math.round(e.c.weight * 10) / 10}kg`, e.c.sleep != null && `${e.c.sleep}h sleep`, e.c.soreness != null && `sore ${e.c.soreness}`, e.c.knee != null && kneeLabel(e.c.knee, e.c.kneeSide), e.c.energy != null && `energy ${e.c.energy}/5`, e.c.protein && "protein ✓", e.c.creatine && "creatine ✓"].filter(Boolean).join(" · ")}
                  {e.c.notes && <div style={{ color: COLORS.muted }}>{e.c.notes}</div>}
                </div>
                <button onClick={() => del("c", e.c.date)} style={{ background: "none", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 16 }}>×</button>
              </Card>
            );
            const s = e.s; const m = TYPE_META[s.type]; const color = s.kind ? TEMPLATES[s.kind].color : m.color;
            const isOpen = expanded === s.id;
            return (
              <Card key={s.id} accent={color} onClick={() => setExpanded(isOpen ? null : s.id)}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <Pill color={color}>{s.kind ? TEMPLATES[s.kind].short : m.short}</Pill>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: COLORS.muted }}>{[s.minutes != null && `${s.minutes} min`, s.rpe != null && `RPE ${s.rpe}`, s.rpe != null && s.minutes != null && `load ${sessionLoad(s)}`, s.knee != null && s.knee > 0 && kneeLabel(s.knee, s.kneeSide), s.sauna && "sauna"].filter(Boolean).join(" · ")}</div>
                  </div>
                  <button onClick={ev => { ev.stopPropagation(); del("s", s.id); }} style={{ background: "none", border: "none", color: COLORS.muted, cursor: "pointer", fontSize: 16 }}>×</button>
                </div>
                {isOpen && (
                  <div style={{ marginTop: 8, borderTop: `1px solid ${COLORS.border}`, paddingTop: 8 }}>
                    {s.exercises.map(ex => (
                      <div key={ex.key} style={{ fontSize: 11, marginBottom: 4, display: "flex", gap: 8 }}>
                        <span style={{ color: COLORS.text, minWidth: 120 }}>{ex.key}</span>
                        <span style={{ color: COLORS.mutedLight, flex: 1 }}>{ex.sets.map(st => `${st.w ?? "–"}${ex.unit === "kg" ? "" : ex.unit}${st.r != null ? "×" + st.r : ""}`).join("  ")}</span>
                        {ex.unit === "kg" && bestE1rm(ex) != null && <span style={{ color: COLORS.muted }}>e1RM {Math.round(bestE1rm(ex)!)}</span>}
                      </div>
                    ))}
                    {s.notes && <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>{s.notes}</div>}
                    {!s.exercises.length && !s.notes && <div style={{ fontSize: 11, color: COLORS.muted }}>No details.</div>}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      ))}
    </div>
  );
}
