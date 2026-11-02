import { useEffect, useState } from "react";
import { COLORS } from "./program";
import { useStore, loadStore, weekOf, todayISO, Store } from "./store";
import { MONO, DISPLAY } from "./ui";
import Today from "./views/Today";
import Plan from "./views/Plan";
import Log from "./views/Log";
import Analyse from "./views/Analyse";
import Fuel from "./views/Fuel";
import SessionRunner from "./views/SessionRunner";

type View = "today" | "plan" | "log" | "analyse" | "fuel";
const NAV: { id: View; label: string; icon: string }[] = [
  { id: "today", label: "Today", icon: "◉" },
  { id: "plan", label: "Plan", icon: "▦" },
  { id: "log", label: "Log", icon: "✎" },
  { id: "analyse", label: "Analyse", icon: "⌁" },
  { id: "fuel", label: "Fuel", icon: "◐" },
];

export default function App() {
  const [store, setStoreRaw] = useStore();
  const setStore = (f: (s: Store) => Store) => setStoreRaw(f);
  const [view, setView] = useState<View>(() => (localStorage.getItem("vt.view") as View) || "today");
  const [running, setRunning] = useState(() => !!loadStore().draft);
  const [week, setWeek] = useState(() => Math.min(17, Math.max(0, weekOf(todayISO()))));
  useEffect(() => { localStorage.setItem("vt.view", view); window.scrollTo(0, 0); }, [view]);

  const content = running && store.draft
    ? <SessionRunner store={store} setStore={setStore} onDone={() => { setRunning(false); setView("log"); }} />
    : view === "today" ? <Today store={store} setStore={setStore} onStartGym={() => setRunning(true)} goPlan={() => setView("plan")} />
    : view === "plan" ? <Plan store={store} setStore={setStore} week={week} setWeek={setWeek} />
    : view === "log" ? <Log store={store} setStore={setStore} onStartGym={() => setRunning(true)} />
    : view === "analyse" ? <Analyse store={store} setStore={setStore} />
    : <Fuel />;

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", color: COLORS.text, fontFamily: MONO }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        html{-webkit-text-size-adjust:100%}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        input[type=date]{color-scheme:dark}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:${COLORS.bg}}::-webkit-scrollbar-thumb{background:${COLORS.border}}
        button{-webkit-tap-highlight-color:transparent}
      `}</style>
      <div style={{ padding: "calc(14px + env(safe-area-inset-top)) 16px 10px", background: `linear-gradient(180deg,#0f0f1a 0%,${COLORS.bg} 100%)`, borderBottom: `1px solid ${COLORS.border}`, position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 24, color: COLORS.accent, letterSpacing: "0.04em", lineHeight: 1 }}>VERTICAL <span style={{ color: COLORS.text }}>TRACKER</span></div>
          <div style={{ fontSize: 9, color: COLORS.muted, letterSpacing: "0.15em", textTransform: "uppercase" }}>30" → 40" · 28 Feb</div>
        </div>
      </div>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "14px 16px calc(80px + env(safe-area-inset-bottom))" }}>{content}</div>
      {!(running && store.draft) && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: COLORS.card, borderTop: `1px solid ${COLORS.border}`, padding: "6px 0 calc(6px + env(safe-area-inset-bottom))", zIndex: 10 }}>
          <div style={{ maxWidth: 600, margin: "0 auto", display: "flex" }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setView(n.id)} style={{ flex: 1, background: "none", border: "none", color: view === n.id ? COLORS.accent : COLORS.muted, fontFamily: MONO, cursor: "pointer", padding: "4px 0" }}>
                <div style={{ fontSize: 16, lineHeight: 1.2 }}>{n.icon}</div>
                <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase" }}>{n.label}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
