import { CSSProperties, ReactNode } from "react";
import { COLORS } from "./program";

export const MONO = "'DM Mono','Courier New',monospace";
export const DISPLAY = "'Bebas Neue',sans-serif";

export const Card = ({ children, style, onClick, accent }: { children: ReactNode; style?: CSSProperties; onClick?: () => void; accent?: string }) => (
  <div onClick={onClick} style={{ background: COLORS.card, border: `1px solid ${accent ? accent + "55" : COLORS.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10, cursor: onClick ? "pointer" : "default", ...style }}>{children}</div>
);

export const Label = ({ children, color = COLORS.muted, style }: { children: ReactNode; color?: string; style?: CSSProperties }) => (
  <div style={{ fontSize: 10, color, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6, ...style }}>{children}</div>
);

export const Pill = ({ children, color = COLORS.muted }: { children: ReactNode; color?: string }) => (
  <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: `${color}22`, color, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{children}</span>
);

export const Btn = ({ children, onClick, color = COLORS.accent, ghost, small, style, disabled }: { children: ReactNode; onClick?: () => void; color?: string; ghost?: boolean; small?: boolean; style?: CSSProperties; disabled?: boolean }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: small ? "6px 10px" : "10px 14px", borderRadius: 8, border: `1px solid ${ghost ? color + "66" : color}`,
    background: ghost ? "transparent" : color, color: ghost ? color : COLORS.bg, fontFamily: MONO, fontSize: small ? 11 : 12,
    letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1, ...style,
  }}>{children}</button>
);

export const Input = ({ value, onChange, type = "text", placeholder, style, step, inputMode }: { value: any; onChange: (v: string) => void; type?: string; placeholder?: string; style?: CSSProperties; step?: string; inputMode?: any }) => (
  <input type={type} value={value ?? ""} step={step} inputMode={inputMode} placeholder={placeholder} onChange={e => onChange(e.target.value)}
    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.bg, color: COLORS.text, fontFamily: MONO, fontSize: 14, ...style }} />
);

export const NumInput = ({ value, onChange, placeholder, style, step = "any" }: { value: number | null; onChange: (v: number | null) => void; placeholder?: string; style?: CSSProperties; step?: string }) => (
  <Input type="number" inputMode="decimal" step={step} value={value ?? ""} placeholder={placeholder} style={style}
    onChange={v => onChange(v === "" ? null : Number(v))} />
);

export const Field = ({ label, children, style }: { label: string; children: ReactNode; style?: CSSProperties }) => (
  <div style={{ flex: 1, minWidth: 0, ...style }}>
    <div style={{ fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{label}</div>
    {children}
  </div>
);

export const Row = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 8, ...style }}>{children}</div>
);

/** 0..max scale picker rendered as tappable chips. */
export const Scale = ({ value, onChange, max = 10, min = 0, color = COLORS.accent }: { value: number | null; onChange: (v: number | null) => void; max?: number; min?: number; color?: string }) => (
  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
    {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(n => (
      <button key={n} onClick={() => onChange(value === n ? null : n)} style={{ minWidth: 28, height: 28, borderRadius: 6, border: `1px solid ${value === n ? color : COLORS.border}`, background: value === n ? color : "transparent", color: value === n ? COLORS.bg : COLORS.mutedLight, fontFamily: MONO, fontSize: 12, cursor: "pointer", padding: "0 6px" }}>{n}</button>
    ))}
  </div>
);

export const Toggle = ({ value, onChange, label, color = COLORS.accent }: { value: boolean; onChange: (v: boolean) => void; label: string; color?: string }) => (
  <button onClick={() => onChange(!value)} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, border: `1px solid ${value ? color : COLORS.border}`, background: value ? `${color}18` : "transparent", color: value ? color : COLORS.mutedLight, fontFamily: MONO, fontSize: 11, cursor: "pointer" }}>
    <span style={{ width: 14, height: 14, borderRadius: 4, border: `1px solid ${value ? color : COLORS.muted}`, background: value ? color : "transparent", display: "inline-flex", alignItems: "center", justifyContent: "center", color: COLORS.bg, fontSize: 10 }}>{value ? "✓" : ""}</span>{label}
  </button>
);

export const Stat = ({ value, label, color = COLORS.accent, sub }: { value: ReactNode; label: string; color?: string; sub?: ReactNode }) => (
  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 10px", flex: 1, minWidth: 0 }}>
    <div style={{ fontFamily: DISPLAY, fontSize: 22, color, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 9, color: COLORS.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3 }}>{label}</div>
    {sub && <div style={{ fontSize: 10, color: COLORS.mutedLight, marginTop: 2 }}>{sub}</div>}
  </div>
);

export const Tabs = ({ tabs, value, onChange, color = COLORS.accent }: { tabs: { id: string; label: string }[]; value: string; onChange: (t: any) => void; color?: string }) => (
  <div style={{ display: "flex", gap: 4, marginBottom: 14, background: COLORS.card, padding: 4, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{ flex: 1, padding: "7px 4px", borderRadius: 6, border: "none", background: value === t.id ? color : "transparent", color: value === t.id ? COLORS.bg : COLORS.muted, fontSize: 11, fontFamily: MONO, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 500, cursor: "pointer" }}>{t.label}</button>
    ))}
  </div>
);

export const TAG_COLORS: Record<string, string> = {
  Strength: COLORS.accent, Isometric: COLORS.orange, Plyos: COLORS.purple, Reactive: COLORS.purple, Test: COLORS.accent,
  "Injury Prev.": COLORS.red, Rehab: COLORS.red, Mobility: COLORS.mutedLight, Recovery: COLORS.teal, Power: COLORS.pink, Sport: COLORS.blue,
};
