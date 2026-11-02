import { useState } from "react";
import { BLOCKS, COLORS, DELOAD_RULE, VOLUME_RULE, TEMPLATES, SessionKind, blockOfWeek, isDeloadWeek } from "../program";
import { Card, Label, Pill, Tabs, TAG_COLORS, DISPLAY } from "../ui";

/** Read-only view of a session template for a given week (block-specific prescription). */
export default function SessionDetail({ kind, week, onBack, onStart }: { kind: SessionKind; week: number; onBack: () => void; onStart?: () => void }) {
  const t = TEMPLATES[kind];
  const b = blockOfWeek(week);
  const block = BLOCKS[b];
  const deload = isDeloadWeek(week);
  const [tab, setTab] = useState<"work" | "warmup">("work");
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: t.color, fontSize: 24, cursor: "pointer", padding: "4px 10px 4px 0" }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: COLORS.muted, letterSpacing: "0.12em", textTransform: "uppercase" }}>{t.minutes} · {t.tagline}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 22, color: t.color, letterSpacing: "0.04em" }}>{t.name}</div>
        </div>
        <Pill color={block.color}>{week === 0 ? "W0 base" : `W${week} ${block.short}`}</Pill>
      </div>
      {deload && <Card accent={COLORS.muted}><div style={{ fontSize: 12, color: COLORS.mutedLight }}>{DELOAD_RULE}</div></Card>}
      {t.warning && <Card accent={COLORS.red}><div style={{ fontSize: 12, color: "#fda4af" }}>{t.warning}</div></Card>}
      <Tabs tabs={[{ id: "work", label: "Session" }, { id: "warmup", label: "Warm-up" }]} value={tab} onChange={setTab} color={t.color} />
      {tab === "warmup" && (t.warmup.length === 0 ? <div style={{ color: COLORS.muted, fontSize: 12 }}>No formal warm-up. Start with the mobility flow.</div> : t.warmup.map((w, i) => (
        <Card key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 14px" }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${t.color}22`, color: t.color, fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
          <span style={{ fontSize: 13 }}>{w}</span>
        </Card>
      )))}
      {tab === "work" && (
        <div>
          {kind !== "R" && <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.5, margin: "0 2px 10px" }}>{VOLUME_RULE}</div>}
          {t.exercises.map(ex => {
            const rx = ex.rx[b];
            return (
              <Card key={ex.key}>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{ex.key}</span>
                  <Pill color={TAG_COLORS[ex.tag] || COLORS.muted}>{ex.tag}</Pill>
                </div>
                <div style={{ display: "flex", gap: 16, marginBottom: 6, flexWrap: "wrap" }}>
                  {[[ex.plyo ? "Sets" : "Working", deload ? (ex.plyo ? `${rx.sets} → half` : "1") : rx.sets], ["Reps", rx.reps], ...(rx.load ? [["Load", rx.load]] : [])].map(([l, v]) => (
                    <div key={l}><div style={{ fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em" }}>{l}</div><div style={{ fontSize: 15, color: t.color, fontFamily: DISPLAY, letterSpacing: "0.05em" }}>{v}</div></div>
                  ))}
                </div>
                {rx.note && <div style={{ fontSize: 12, color: COLORS.mutedLight, lineHeight: 1.5, marginBottom: ex.cue ? 4 : 0 }}>{rx.note}</div>}
                {ex.cue && <div style={{ fontSize: 11, color: COLORS.muted, lineHeight: 1.5 }}>{ex.cue}</div>}
                {ex.start && b === 0 && <div style={{ fontSize: 11, color: COLORS.accent, lineHeight: 1.5, marginTop: 4 }}>{ex.start}</div>}
              </Card>
            );
          })}
          <Card accent={t.color} style={{ background: `${t.color}0d` }}>
            <Label color={t.color}>Finisher</Label>
            <div style={{ fontSize: 12 }}>{t.finisher}</div>
          </Card>
          {onStart && <button onClick={onStart} style={{ width: "100%", padding: 14, borderRadius: 10, border: "none", background: t.color, color: COLORS.bg, fontFamily: "inherit", fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500, cursor: "pointer", marginTop: 6 }}>Start and log this session</button>}
        </div>
      )}
    </div>
  );
}
