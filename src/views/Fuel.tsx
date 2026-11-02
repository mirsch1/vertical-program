import { COLORS } from "../program";
import { Card, Label, Pill } from "../ui";

const MEALS = [
  { when: "Breakfast", now: "Porridge, berries, nuts", verdict: "Keep it, add protein", color: COLORS.orange,
    why: "Great carbs for the day, but it is only ~12g protein. At 100kg you want 35-45g per meal.",
    change: "Add 200g skyr or Greek yoghurt stirred in, or 3 eggs on the side, or a scoop of whey in the porridge. Keep the berries and nuts." },
  { when: "Lunch", now: "Lamb wrap or a bowl", verdict: "Good", color: COLORS.accent,
    why: "Protein plus carbs in the middle of the day. Lamb is fine, the fat is not a problem at your size.",
    change: "On gym days pick the bowl with rice or potatoes over the wrap. Add a piece of fruit if the afternoon session feels flat." },
  { when: "Pre-workout", now: "Banana with almond butter", verdict: "Good", color: COLORS.accent,
    why: "Fast carbs plus a little fat, 45-60 min before. Exactly right for a sub-hour high-intensity session.",
    change: "On Thursday (jump day) add 15g collagen or gelatin with some orange juice 45-60 min before. It is the one supplement with decent evidence for tendon health, and your knees are the limiting factor in this program." },
  { when: "Dinner", now: "Greek salad with chicken, beef or lamb", verdict: "Too low in carbs on training days", color: COLORS.red,
    why: "Volleyball finishes at 10pm after 30 min cycling each way, judo is 60-90 min of grappling. A salad and protein does not refill the legs for the next day. Under-fuelled dinners are the most common reason heavy-training athletes stall.",
    change: "Keep the salad and protein. On Sunday, Monday, Thursday and Saturday add 150-250g cooked rice, potatoes, pasta or bread. On Tuesday, Wednesday (no match) and Friday the salad as it is, is fine." },
  { when: "Post-training", now: "Nothing listed", verdict: "Add it", color: COLORS.red,
    why: "After Sunday volleyball you get home around 10:45pm. Going to bed without protein wastes the session.",
    change: "250ml milk or a skyr pot, or a whey shake, within an hour of finishing. Same after judo if dinner is more than 2 hours away." },
];

const TARGETS = [
  ["Protein", "180-200g per day", "About 2g per kg. Four feedings of 40-50g is easier than three of 60g. Tick 'protein hit' in the daily check-in when you get there."],
  ["Carbs", "Scale with the day", "High on Sun, Mon, Thu, Sat. Moderate on Tue. Lower on Wed (no match) and Fri. Carbs are what make the sessions explosive."],
  ["Bodyweight", "Hold 98-101kg", "You are lean and tall. Power to weight improves faster by adding power than by cutting weight. Weigh in Monday mornings and log it."],
  ["Creatine", "5g daily, any time", "Monohydrate. The best-evidenced supplement for jump and sprint power. Takes 2-3 weeks to load, so start now. Expect about 1kg of water weight, that is fine."],
  ["Collagen + vitamin C", "15g, 45-60 min before Thursday", "Gelatin or hydrolysed collagen with orange juice before plyo days. Supports tendon remodelling. Cheap, low risk."],
  ["Sauna hydration", "750ml water + salt after", "You sauna after nearly every session. Add a pinch of salt or an electrolyte tab to the first bottle, especially before the cycle home."],
  ["Sleep", "8-9 hours, 9 after volleyball", "Sunday night finishes late. Move Monday gym to the evening if mornings are short on sleep. Sleep is where the tendons adapt."],
  ["Caffeine", "Optional, 100-200mg pre-gym", "Coffee 45 min before a Monday or Thursday session works. Not after 2pm or sleep suffers."],
];

export default function Fuel() {
  return (
    <div>
      <Label>Your current diet, meal by meal</Label>
      {MEALS.map(m => (
        <Card key={m.when} accent={m.color}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{m.when}</div>
            <Pill color={m.color}>{m.verdict}</Pill>
          </div>
          <div style={{ fontSize: 11, color: COLORS.mutedLight, marginBottom: 6 }}>Now: {m.now}</div>
          <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.55, marginBottom: 6 }}>{m.why}</div>
          <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.55 }}><span style={{ color: m.color }}>Change: </span>{m.change}</div>
        </Card>
      ))}

      <Label style={{ marginTop: 18 }}>Daily targets</Label>
      {TARGETS.map(([t, v, d]) => (
        <Card key={t}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
            <div style={{ fontSize: 12, color: COLORS.accent, textAlign: "right" }}>{v}</div>
          </div>
          <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.55 }}>{d}</div>
        </Card>
      ))}

      <Label style={{ marginTop: 18 }}>A training day, start to finish</Label>
      <Card>
        {[
          ["07:30", "Porridge, berries, nuts + skyr or eggs"],
          ["12:30", "Lamb bowl with rice, fruit"],
          ["16:30", "Banana + almond butter (+ collagen on Thursday)"],
          ["17:30", "Gym, under an hour, sauna, 750ml water with salt"],
          ["19:30", "Greek salad + protein + rice or potatoes"],
          ["22:30", "Lights out"],
        ].map(([t, d]) => (
          <div key={t} style={{ display: "flex", gap: 12, padding: "5px 0", borderBottom: `1px solid ${COLORS.border}`, fontSize: 12 }}>
            <span style={{ color: COLORS.accent, width: 44, flexShrink: 0 }}>{t}</span><span style={{ color: COLORS.mutedLight }}>{d}</span>
          </div>
        ))}
      </Card>
      <Card>
        <div style={{ fontSize: 12, color: COLORS.muted, lineHeight: 1.6 }}>
          Sunday variation: eat dinner with carbs at 6pm before cycling to volleyball, bring a banana for half-time, skyr or milk when you get home at 10:45pm, lights out by 11:30. Take the e-bike home in heavy weeks.
        </div>
      </Card>
    </div>
  );
}
