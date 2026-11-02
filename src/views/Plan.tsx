import { useState } from "react";
import { BLOCKS, COLORS, DELOAD_RULE, MEASURE_METHOD, PRINCIPLES, TEMPLATES, SessionKind, blockOfWeek, dayPlan, isDeloadWeek } from "../program";
import { Store, WEEKS, fmtShort, isMatchWeek, todayISO, weekOf, weekStart, addDays } from "../store";
import { Card, Label, Pill, Tabs, TAG_COLORS, DISPLAY, Toggle } from "../ui";
import SessionDetail from "./SessionDetail";

export default function Plan({ store, setStore, week, setWeek }: { store: Store; setStore: (f: (s: Store) => Store) => void; week: number; setWeek: (w: number) => void }) {
  const [tab, setTab] = useState<"week" | "blocks" | "method">("week");
  const [open, setOpen] = useState<SessionKind | null>(null);
  const curWeek = weekOf(todayISO());
  const b = blockOfWeek(week);
  const block = BLOCKS[b];
  const deload = isDeloadWeek(week);
  const match = isMatchWeek(store.settings, week);
  const monday = week <= 0 ? addDays(weekStart(1), -7) : weekStart(week);

  if (open) return <SessionDetail kind={open} week={week} onBack={() => setOpen(null)} />;

  return (
    <div>
      <Tabs tabs={[{ id: "week", label: "Week" }, { id: "blocks", label: "Blocks" }, { id: "method", label: "Method" }]} value={tab} onChange={setTab} />

      {tab === "week" && (
        <div>
          <Label>Training week</Label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 5, marginBottom: 10 }}>
            {Array.from({ length: WEEKS + 1 }, (_, i) => i).map(w => {
              const bb = BLOCKS[blockOfWeek(w)];
              const sel = w === week;
              const c = w === 0 ? COLORS.muted : bb.color;
              return (
                <button key={w} onClick={() => setWeek(w)} style={{ position: "relative", padding: "6px 2px", borderRadius: 8, border: `1px solid ${sel ? c : COLORS.border}`, background: sel ? `${c}18` : "transparent", cursor: "pointer", textAlign: "center" }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: sel ? c : COLORS.text }}>{w === 0 ? "W0" : `W${w}`}</div>
                  <div style={{ fontSize: 8, color: sel ? c : COLORS.muted }}>{w === 0 ? "base" : isDeloadWeek(w) ? "deload" : bb.short}</div>
                  {w === curWeek && <div style={{ position: "absolute", top: 3, right: 3, width: 5, height: 5, borderRadius: "50%", background: COLORS.accent }} />}
                </button>
              );
            })}
          </div>
          <Card accent={block.color} style={{ background: `${block.color}0d` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div style={{ fontSize: 12, color: block.color, fontWeight: 500 }}>{week === 0 ? "Baseline week" : `${block.name} · week ${week}`}{deload ? " · DELOAD" : ""}</div>
              <div style={{ fontSize: 10, color: COLORS.muted }}>{fmtShort(monday)} to {fmtShort(addDays(monday, 6))}</div>
            </div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4, lineHeight: 1.5 }}>{week === 0 ? "Test your standing and approach vertical on Thursday and set working weights. Nothing heavy." : deload ? DELOAD_RULE : block.desc}</div>
          </Card>
          <div style={{ marginBottom: 10 }}>
            <Toggle value={match} label={match ? "Match this Wednesday: Tuesday is recovery" : "No match this Wednesday: Tuesday is a lift"} color={COLORS.orange}
              onChange={v => setStore(s => ({ ...s, settings: { ...s.settings, matchWeeks: { ...s.settings.matchWeeks, [String(week)]: v } } }))} />
          </div>
          {[1, 2, 3, 4, 5, 6, 0].map(dow => {
            const p = dayPlan(dow, match, week);
            const date = addDays(monday, dow === 0 ? 6 : dow - 1);
            const isToday = date === todayISO();
            const t = p.kind ? TEMPLATES[p.kind] : null;
            return (
              <Card key={dow} accent={isToday ? COLORS.accent : undefined} onClick={p.kind ? () => setOpen(p.kind!) : undefined} style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: 10, background: `${p.color}18`, border: `1px solid ${p.color}44`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 9, color: p.color, letterSpacing: "0.08em" }}>{["SUN","MON","TUE","WED","THU","FRI","SAT"][dow]}</div>
                  <div style={{ fontFamily: DISPLAY, fontSize: 14, color: p.color }}>{t ? t.short : p.type === "rest" ? "OFF" : p.type === "judo" ? "JUDO" : p.type === "match" ? "GAME" : "VB"}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, display: "flex", gap: 6, alignItems: "center" }}>{p.label}{isToday && <Pill color={COLORS.accent}>today</Pill>}</div>
                  <div style={{ fontSize: 11, color: COLORS.muted }}>{fmtShort(date)} · {p.detail}{t ? ` · ${t.minutes}` : ""}</div>
                </div>
                {t && <div style={{ color: COLORS.border, fontSize: 18 }}>›</div>}
              </Card>
            );
          })}
        </div>
      )}

      {tab === "blocks" && (
        <div>
          {BLOCKS.map(bl => (
            <Card key={bl.id} accent={bl.color}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontFamily: DISPLAY, fontSize: 18, color: bl.color }}>{bl.name}</span>
                <Pill color={bl.color}>wk {bl.weeks[0]}{bl.weeks[1] !== bl.weeks[0] ? `-${bl.weeks[1]}` : ""}</Pill>
                <span style={{ fontSize: 10, color: COLORS.muted }}>{fmtShort(weekStart(bl.weeks[0]))} to {fmtShort(addDays(weekStart(bl.weeks[1]), 6))}</span>
              </div>
              <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.55, marginBottom: 8 }}>{bl.desc}</div>
              {bl.focus.map((f, i) => <div key={i} style={{ fontSize: 12, color: COLORS.mutedLight, padding: "3px 0", display: "flex", gap: 8 }}><span style={{ color: bl.color }}>→</span>{f}</div>)}
            </Card>
          ))}
          <Card>
            <Label>Deload rule</Label>
            <div style={{ fontSize: 12, color: COLORS.mutedLight, lineHeight: 1.6 }}>{DELOAD_RULE}</div>
          </Card>
          <Card>
            <Label>Sessions in the week</Label>
            {(Object.keys(TEMPLATES) as SessionKind[]).map(k => {
              const t = TEMPLATES[k];
              return (
                <div key={k} onClick={() => setOpen(k)} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${COLORS.border}`, cursor: "pointer" }}>
                  <Pill color={t.color}>{t.short}</Pill>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>{t.name}</div>
                    <div style={{ fontSize: 10, color: COLORS.muted }}>{t.minutes} · {t.exercises.map(e => e.key).slice(0, 3).join(", ")}…</div>
                  </div>
                  <span style={{ color: COLORS.border }}>›</span>
                </div>
              );
            })}
          </Card>
        </div>
      )}

      {tab === "method" && (
        <div>
          {PRINCIPLES.map((p, i) => (
            <Card key={i} style={{ display: "flex", gap: 12 }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>{p.icon}</div>
              <div>
                <div style={{ fontSize: 13, color: COLORS.accent, marginBottom: 4, fontWeight: 500 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.6 }}>{p.desc}</div>
              </div>
            </Card>
          ))}
          <Card accent={COLORS.accent}>
            <Label color={COLORS.accent}>How to measure the vertical</Label>
            {MEASURE_METHOD.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10, fontSize: 12, color: COLORS.mutedLight, lineHeight: 1.55, padding: "4px 0" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: `${COLORS.accent}22`, color: COLORS.accent, fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                <span>{m}</span>
              </div>
            ))}
            <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 6 }}>Your reach is saved in the jump form, so on Thursdays you only type the two touch heights.</div>
          </Card>
          <Card>
            <Label>Exercise tags</Label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>{Object.entries(TAG_COLORS).map(([t, c]) => <Pill key={t} color={c}>{t}</Pill>)}</div>
          </Card>
        </div>
      )}
    </div>
  );
}
