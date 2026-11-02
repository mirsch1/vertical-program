import { useMemo, useRef, useState } from "react";
import { CHART } from "./program";

export interface Pt { x: number; y: number; label?: string }
export interface Series { name: string; color: string; points: Pt[]; dashed?: boolean; noMarkers?: boolean }
export interface RefLine { y: number; label: string }

const FONT = "'DM Mono','Courier New',monospace";

function niceTicks(min: number, max: number, n = 4) {
  if (!(max > min)) { max = min + 1; }
  const span = max - min;
  const raw = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 1000) / 1000);
  return ticks;
}

/**
 * Line chart with crosshair + tooltip. X is a timestamp (ms). One y axis.
 */
export function LineChart({ series, refLines = [], height = 200, yFmt = (v: number) => String(v), xFmt, yMin, yMax, xMin, xMax }: {
  series: Series[]; refLines?: RefLine[]; height?: number; yFmt?: (v: number) => string; xFmt: (x: number) => string;
  yMin?: number; yMax?: number; xMin?: number; xMax?: number;
}) {
  const W = 360, H = height, padL = 36, padR = 12, padT = 12, padB = 26;
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const all = series.flatMap(s => s.points);
  const xs = all.map(p => p.x), ys = all.map(p => p.y).concat(refLines.map(r => r.y));
  const x0 = xMin ?? (xs.length ? Math.min(...xs) : 0), x1 = xMax ?? (xs.length ? Math.max(...xs) : 1);
  const yLo = yMin ?? (ys.length ? Math.min(...ys) : 0), yHi = yMax ?? (ys.length ? Math.max(...ys) : 1);
  const ticks = niceTicks(yLo, yHi);
  const ty0 = Math.min(ticks[0], yLo), ty1 = Math.max(ticks[ticks.length - 1], yHi);
  const sx = (x: number) => padL + (x1 === x0 ? 0.5 : (x - x0) / (x1 - x0)) * (W - padL - padR);
  const sy = (y: number) => padT + (1 - (y - ty0) / (ty1 - ty0 || 1)) * (H - padT - padB);

  // Distinct x positions for crosshair snapping (data points only, not projections).
  const xPositions = useMemo(() => Array.from(new Set(series.filter(s => !s.noMarkers).flatMap(s => s.points.map(p => p.x)))).sort((a, b) => a - b), [series]);

  const onMove = (e: React.PointerEvent) => {
    const svg = ref.current; if (!svg || !xPositions.length) return;
    const rect = svg.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = xPositions[0], bd = Infinity;
    for (const x of xPositions) { const d = Math.abs(sx(x) - px); if (d < bd) { bd = d; best = x; } }
    setHover(best);
  };

  const xTicks = useMemo(() => {
    if (x1 <= x0) return [x0];
    const n = 4; const out: number[] = [];
    for (let i = 0; i <= n; i++) out.push(x0 + ((x1 - x0) * i) / n);
    return out;
  }, [x0, x1]);

  if (!all.length) return <div style={{ color: CHART.muted, fontSize: 12, padding: "24px 0", textAlign: "center" }}>No data yet. Log a few entries and the chart appears here.</div>;

  const hoverRows = hover == null ? [] : series.filter(s => !s.noMarkers).map(s => ({ s, p: s.points.find(p => p.x === hover) })).filter(r => r.p);
  const tipX = hover == null ? 0 : sx(hover);
  const tipLeft = tipX > W / 2;

  return (
    <div style={{ position: "relative" }}>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", touchAction: "pan-y", fontFamily: FONT }}
        onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={sy(t)} y2={sy(t)} stroke={CHART.grid} strokeWidth={1} />
            <text x={padL - 6} y={sy(t) + 3} fontSize={9} fill={CHART.muted} textAnchor="end" style={{ fontVariantNumeric: "tabular-nums" }}>{yFmt(t)}</text>
          </g>
        ))}
        <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} stroke={CHART.axis} strokeWidth={1} />
        {xTicks.map((t, i) => (
          <text key={i} x={sx(t)} y={H - padB + 14} fontSize={9} fill={CHART.muted} textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"}>{xFmt(t)}</text>
        ))}
        {refLines.map(r => (
          <g key={r.label}>
            <line x1={padL} x2={W - padR} y1={sy(r.y)} y2={sy(r.y)} stroke={CHART.ink2} strokeWidth={1} strokeDasharray="4 4" opacity={0.7} />
            <text x={W - padR} y={sy(r.y) - 4} fontSize={9} fill={CHART.ink2} textAnchor="end">{r.label}</text>
          </g>
        ))}
        {series.map(s => {
          const pts = [...s.points].sort((a, b) => a.x - b.x);
          const d = pts.map((p, i) => `${i ? "L" : "M"}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(" ");
          return (
            <g key={s.name}>
              <path d={d} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? "5 4" : undefined} opacity={s.dashed ? 0.8 : 1} />
              {!s.noMarkers && pts.map((p, i) => (
                <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={hover === p.x ? 5 : 4} fill={s.color} stroke="#111118" strokeWidth={2} />
              ))}
            </g>
          );
        })}
        {hover != null && <line x1={tipX} x2={tipX} y1={padT} y2={H - padB} stroke={CHART.ink2} strokeWidth={1} opacity={0.5} />}
      </svg>
      {hover != null && hoverRows.length > 0 && (
        <div style={{ position: "absolute", top: 4, [tipLeft ? "right" : "left"]: `${tipLeft ? 100 - (tipX / W) * 100 + 2 : (tipX / W) * 100 + 2}%`, background: "#16161f", border: `1px solid ${CHART.axis}`, borderRadius: 6, padding: "6px 8px", fontSize: 11, pointerEvents: "none", whiteSpace: "nowrap", zIndex: 2 }}>
          <div style={{ color: CHART.muted, marginBottom: 2 }}>{xFmt(hover)}</div>
          {hoverRows.map(r => (
            <div key={r.s.name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 12, height: 2, background: r.s.color, display: "inline-block" }} />
              <span style={{ color: CHART.ink, fontWeight: 500 }}>{yFmt(r.p!.y)}</span>
              <span style={{ color: CHART.ink2 }}>{r.s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Legend({ series }: { series: { name: string; color: string; dashed?: boolean }[] }) {
  if (series.length < 2) return null;
  return (
    <div style={{ display: "flex", gap: 14, flexWrap: "wrap", fontSize: 10, color: CHART.ink2, marginTop: 6 }}>
      {series.map(s => (
        <span key={s.name} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 14, height: 0, borderTop: `2px ${s.dashed ? "dashed" : "solid"} ${s.color}`, display: "inline-block" }} />{s.name}
        </span>
      ))}
    </div>
  );
}

export interface Bar { label: string; value: number; sub?: string; color?: string }

/** Column chart, one series, per-bar tooltip. */
export function BarChart({ bars, height = 160, yFmt = (v: number) => String(v), color = CHART.s1, highlightLast = true }: { bars: Bar[]; height?: number; yFmt?: (v: number) => string; color?: string; highlightLast?: boolean }) {
  const W = 360, H = height, padL = 32, padR = 8, padT = 10, padB = 24;
  const [hover, setHover] = useState<number | null>(null);
  if (!bars.length) return <div style={{ color: CHART.muted, fontSize: 12, padding: "24px 0", textAlign: "center" }}>No data yet.</div>;
  const max = Math.max(...bars.map(b => b.value), 1);
  const ticks = niceTicks(0, max, 3);
  const top = Math.max(ticks[ticks.length - 1], max);
  const slot = (W - padL - padR) / bars.length;
  const bw = Math.min(24, slot - 4);
  const sy = (v: number) => padT + (1 - v / top) * (H - padT - padB);
  const labelEvery = Math.ceil(bars.length / 8);
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", fontFamily: FONT }} onPointerLeave={() => setHover(null)}>
        {ticks.map(t => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={sy(t)} y2={sy(t)} stroke={CHART.grid} strokeWidth={1} />
            <text x={padL - 6} y={sy(t) + 3} fontSize={9} fill={CHART.muted} textAnchor="end" style={{ fontVariantNumeric: "tabular-nums" }}>{yFmt(t)}</text>
          </g>
        ))}
        <line x1={padL} x2={W - padR} y1={H - padB} y2={H - padB} stroke={CHART.axis} strokeWidth={1} />
        {bars.map((b, i) => {
          const cx = padL + slot * i + slot / 2;
          const y = sy(b.value), h = Math.max(0, H - padB - y);
          const r = Math.min(4, h);
          const c = b.color ?? color;
          const dim = highlightLast && i !== bars.length - 1 && hover !== i;
          return (
            <g key={i} onPointerEnter={() => setHover(i)} onPointerMove={() => setHover(i)}>
              <rect x={padL + slot * i} y={padT} width={slot} height={H - padT - padB} fill="transparent" />
              {h > 0 && (
                <path d={`M${cx - bw / 2},${H - padB} V${y + r} Q${cx - bw / 2},${y} ${cx - bw / 2 + r},${y} H${cx + bw / 2 - r} Q${cx + bw / 2},${y} ${cx + bw / 2},${y + r} V${H - padB} Z`} fill={c} opacity={dim ? 0.55 : 1} />
              )}
              {i % labelEvery === 0 && <text x={cx} y={H - padB + 14} fontSize={9} fill={CHART.muted} textAnchor="middle">{b.label}</text>}
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div style={{ position: "absolute", top: 0, left: `${((padL + slot * hover + slot / 2) / W) * 100}%`, transform: hover > bars.length / 2 ? "translateX(-100%)" : "none", background: "#16161f", border: `1px solid ${CHART.axis}`, borderRadius: 6, padding: "6px 8px", fontSize: 11, pointerEvents: "none", whiteSpace: "nowrap", zIndex: 2 }}>
          <div style={{ color: CHART.muted }}>{bars[hover].label}{bars[hover].sub ? ` · ${bars[hover].sub}` : ""}</div>
          <div style={{ color: CHART.ink, fontWeight: 500 }}>{yFmt(bars[hover].value)}</div>
        </div>
      )}
    </div>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: (string | number | null)[][] }) {
  return (
    <div style={{ overflowX: "auto", marginTop: 8 }}>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 11, fontVariantNumeric: "tabular-nums" }}>
        <thead><tr>{head.map(h => <th key={h} style={{ textAlign: "left", color: CHART.muted, fontWeight: 400, padding: "4px 6px", borderBottom: `1px solid ${CHART.axis}` }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j} style={{ padding: "4px 6px", borderBottom: `1px solid ${CHART.grid}`, color: CHART.ink }}>{c ?? ""}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}
