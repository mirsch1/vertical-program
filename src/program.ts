// Program definition: 17 weeks, Mon 2 Nov 2026 -> Sun 28 Feb 2027.
// Goal: standing vertical 30in -> 40in by end of February, while staying healthy
// around volleyball (Sun training, Wed matches), judo (Sat) and ~3 gym sessions/week.

export const PROGRAM_START = "2026-11-02"; // Monday of week 1
export const PROGRAM_END = "2027-02-28";   // Sunday of week 17
export const WEEKS = 17;
export const GOAL_IN = 40;
export const BASELINE_IN = 30;

export const COLORS = {
  bg: "#0a0a0f",
  card: "#111118",
  cardHover: "#16161f",
  border: "#1e1e2e",
  accent: "#c8f135",
  accentDim: "#8aaa22",
  accentSoft: "rgba(200,241,53,0.08)",
  blue: "#3b82f6",
  red: "#f43f5e",
  orange: "#f97316",
  purple: "#a855f7",
  pink: "#ec4899",
  teal: "#14b8a6",
  text: "#e8e8f0",
  muted: "#6b7280",
  mutedLight: "#9ca3af",
};

// Chart series colours (validated for dark surface #111118, CVD-safe adjacent pairs).
export const CHART = {
  s1: "#3987e5", // blue
  s2: "#d95926", // orange
  s3: "#199e70", // aqua
  s4: "#c98500", // yellow
  grid: "#1e1e2e",
  axis: "#2c2c3a",
  ink: "#e8e8f0",
  ink2: "#9ca3af",
  muted: "#6b7280",
};

export type BlockId = 0 | 1 | 2 | 3 | 4;

export const BLOCKS: { id: BlockId; name: string; weeks: [number, number]; color: string; short: string; desc: string; focus: string[] }[] = [
  { id: 0, name: "Foundation", short: "B1", weeks: [1, 4], color: COLORS.blue,
    desc: "Groove the lifts, load the tendons, learn to land. Jump volume modest because volleyball already gives you plenty of contacts.",
    focus: ["Working weights set on trap bar, leg press, split squat", "Stick landings before any depth jumps", "Isometrics every week for the knees", "Weekly jump test starts: same method every Thursday"] },
  { id: 1, name: "Strength", short: "B2", weeks: [5, 8], color: COLORS.orange,
    desc: "Heaviest block. Low reps, long rests, bar speed matters. Depth jumps come in. Week 8 is the Christmas deload.",
    focus: ["Trap bar 2x3 near 85%, leg press 2x5", "Depth jumps from 30cm, minimal ground contact", "Trap bar jumps for triple extension, sets of 3", "Protein and sleep carry this block"] },
  { id: 2, name: "Power", short: "B3", weeks: [9, 12], color: COLORS.purple,
    desc: "Convert strength to speed. Contrast sets (heavy then jump), taller boxes, faster contacts. Weights drop slightly, intent goes up.",
    focus: ["Contrast: heavy set then 3 max jumps", "Depth jumps from 40cm", "Hurdle hops with short contacts", "Approach jump technique every Thursday"] },
  { id: 3, name: "Reactive", short: "B4", weeks: [13, 16], color: COLORS.accent,
    desc: "Most specific block. Low volume, maximum intent, every jump counts. Strength is maintained with a few heavy doubles.",
    focus: ["Heavy doubles only, then jump", "Depth jumps from 45-50cm into a max jump", "Full approach jumps at game speed", "Cut anything that does not feel explosive"] },
  { id: 4, name: "Taper & Test", short: "TEST", weeks: [17, 17], color: COLORS.pink,
    desc: "Volume halved, intensity kept, then test fresh on Thursday 25 Feb. This is the week the work shows up.",
    focus: ["Monday: one crisp double per lift, done", "Tuesday: recovery only", "Thursday: full warm-up, 5 standing + 5 approach jumps, log the best", "Sleep 9 hours"] },
];

export const blockOfWeek = (w: number): BlockId => {
  if (w <= 0) return 0;
  const b = BLOCKS.find(b => w >= b.weeks[0] && w <= b.weeks[1]);
  return (b ? b.id : 4) as BlockId;
};
export const isDeloadWeek = (w: number) => w > 0 && w % 4 === 0 && w <= 16;

export type SessionKind = "A" | "B" | "R" | "C";

export interface Rx { sets: string; reps: string; load?: string; note: string; skip?: boolean }
export interface Exercise {
  key: string;            // canonical name used in logs / analysis
  tag: string;
  unit: "kg" | "sec" | "reps" | "cm" | "in" | "min";
  track: boolean;         // show set logging
  plyo?: boolean;         // sets are contacts, not working sets (no warm-up sets, stop when height drops)
  rx: [Rx, Rx, Rx, Rx, Rx]; // per block (B1..B4, taper)
  cue?: string;
  start?: string;         // suggested starting load, from Mikhail's current numbers
}
export interface SessionTemplate {
  kind: SessionKind;
  name: string;
  short: string;
  color: string;
  minutes: string;
  tagline: string;
  warmup: string[];
  exercises: Exercise[];
  finisher: string;
  warning?: string;
}

const SAUNA = "Sauna 10-15 min, then 500ml water with a pinch of salt before cycling home.";

// Volume rule (Huberman / Galpin style): sets listed are WORKING sets only.
export const VOLUME_RULE = "Sets shown are working sets. Before each lift do 1-2 warm-up sets (lighter, fewer reps, 2 if the weight is heavy). A working set stops with 1-2 reps left; the second one can be all-out. Plyo sets are different: they are contacts, not fatigue. Full rest, stop the exercise the moment jump height drops.";

export const TEMPLATES: Record<SessionKind, SessionTemplate> = {
  A: {
    kind: "A", name: "Lower Strength", short: "STR", color: COLORS.accent, minutes: "45-55 min", tagline: "Build the engine",
    warmup: ["Bike 3 min easy (you just cycled in, keep it short)", "90/90 hip switches x8 each side", "Leg swings x10 each", "Goblet squat x8, slow and deep", "Pogo hops 2x10", "Countermovement jumps 2x3 at 80%"],
    exercises: [
      { key: "Trap Bar Deadlift", tag: "Strength", unit: "kg", track: true, start: "Start 110kg. Your Smith squat (100x10) puts your squat e1RM around 130kg, and the trap bar usually goes heavier. Add 5kg a week while the bar is fast.",
        cue: "Fast off the floor, hips and shoulders rise together. Stop the set if bar speed visibly drops. Use straps on every working set from block 2: your forearms gave out on heavy deadlifts before and grip is not what we are training here.",
        rx: [
          { sets: "2", reps: "5", load: "RPE 7-8", note: "Week 1 is for finding the working weight. 1-2 warm-ups (60kg x5, 90kg x3), then 2 working sets with 2 reps in the tank. 3 min rest." },
          { sets: "2", reps: "3", load: "~85%, RPE 8-9", note: "Heaviest block. 2 warm-ups, then 2 heavy triples with 3-4 min rest. The second set can be all-out. This is where the base for 40in gets built." },
          { sets: "2", reps: "3 + 3 jumps", load: "~80%", note: "Contrast: after each set, 20 sec rest, then 3 max countermovement jumps. Rest 3 min." },
          { sets: "2", reps: "2 + 3 jumps", load: "~88%", note: "Heavy doubles with max intent, then 3 max jumps. Rest 4 min. Quality over everything." },
          { sets: "1", reps: "2", load: "~80%", note: "Taper: one crisp double and done. No grinding." },
        ] },
      { key: "Leg Press", tag: "Strength", unit: "kg", track: true, start: "Start 200kg (your 5 plates a side) x8. Log plates x 20kg, ignore the sled. Add a plate a side when both sets hit the reps.",
        cue: "Knee-dominant lift without the back and knee cost of a heavy barbell squat (which hurts you even foam-rolled). Feet mid-platform, full depth only if the knee stays quiet, never lock out. Smith squat at 80-100kg is a fine swap if the press is busy.",
        rx: [
          { sets: "2", reps: "8", load: "RPE 8", note: "Second lift. 1 warm-up set (3 plates x6) then 2 working sets. 2-3 min rest." },
          { sets: "2", reps: "5", load: "RPE 8-9", note: "Heavier. 1-2 warm-ups then 2 hard sets of 5." },
          { sets: "2", reps: "4", load: "~85%", note: "Fast up. If the sled slows, the set is over." },
          { sets: "1", reps: "4", load: "~85%", note: "One heavy set to maintain. Save the legs for jumping." },
          { sets: "1", reps: "5", load: "~70%", note: "Taper: light, smooth." },
        ] },
      { key: "Bulgarian Split Squat", tag: "Strength", unit: "kg", track: true, start: "Start 16-20kg dumbbells each hand.",
        cue: "Front shin vertical, drive through the whole foot. Log the dumbbell weight (each hand).",
        rx: [
          { sets: "2", reps: "6 / leg", note: "No warm-up needed after the squats. Single-leg strength transfers straight to the volleyball approach." },
          { sets: "2", reps: "5 / leg", note: "Heavier. 90 sec rest. Control down, fast up." },
          { sets: "2", reps: "5 / leg", note: "Explosive concentric. Think jump off the front leg." },
          { sets: "2", reps: "4 / leg", note: "Heavy and fast. Rest 2 min." },
          { sets: "1", reps: "5 / leg", note: "Taper: moderate load." },
        ] },
      { key: "Nordic Hamstring Curl", tag: "Injury Prev.", unit: "reps", track: true, cue: "Your hamstring curl, since Virgin Active has no curl machine. Hook feet under a loaded bar or the lat pulldown pad, slow 3-4 sec descent, band assistance is fine. If you ever find a lying curl machine, 2x8 of that is an equal swap.",
        rx: [
          { sets: "2", reps: "4-5", note: "Assisted. Learn the eccentric." },
          { sets: "2", reps: "5", note: "Less assistance." },
          { sets: "2", reps: "5-6", note: "Full eccentrics if you can." },
          { sets: "2", reps: "5", note: "Maintain." },
          { sets: "1", reps: "4", note: "Taper: one easy set." },
        ] },
      { key: "Spanish Squat Isometric", tag: "Isometric", unit: "sec", track: true, cue: "Band or rope behind the knees, lean back, hold at ~70 degrees. Patellar tendon treatment. Superset with calf raises. These are therapy, not working sets: never skip them.",
        rx: [
          { sets: "3", reps: "45 sec", note: "Light discomfort is fine, sharp pain is not. If the left knee is talking, make it 5 x 45 sec and drop one set of squats." },
          { sets: "3", reps: "60 sec", note: "Max quad tension. Push knees out." },
          { sets: "3", reps: "45 sec", note: "Keep tendon stiffness high while plyo intensity rises." },
          { sets: "3", reps: "45 sec", note: "Non-negotiable in the reactive block." },
          { sets: "2", reps: "30 sec", note: "Taper: therapeutic dose." },
        ] },
      { key: "Seated Calf Raise", tag: "Rehab", unit: "kg", track: true, cue: "Soleus and Achilles. Full stretch at the bottom, 3 sec hold at the top.",
        rx: [
          { sets: "2", reps: "12 slow", note: "Moderate weight." },
          { sets: "2", reps: "10 slow", note: "Add weight, keep the hold." },
          { sets: "2", reps: "10 slow", note: "Same." },
          { sets: "2", reps: "10 slow", note: "Same. Achilles health through the peak." },
          { sets: "1", reps: "10", note: "Taper." },
        ] },
    ],
    finisher: SAUNA,
  },
  B: {
    kind: "B", name: "Upper + Hinge", short: "UPR", color: COLORS.blue, minutes: "45-50 min", tagline: "Bench, pull, hinge",
    warmup: ["Band pull-aparts x15", "Arm circles x20", "Cat-cow x10", "Scap pull-ups x8", "Couch stretch 60 sec each side"],
    exercises: [
      { key: "Bench Press", tag: "Strength", unit: "kg", track: true, start: "Start 90kg x5 (you did 100 x4, e1RM about 113). Warm-ups: bar x10, 60 x5, 80 x3. Add 2.5kg when both sets hit the reps.",
        cue: "Feet planted, shoulder blades pinned, bar to lower chest, press fast. Bench also lives on Thursdays after the jumps, so you get two exposures most weeks. 140kg is a 2027 goal: 120 by February is the honest checkpoint.",
        rx: [
          { sets: "2", reps: "5", load: "RPE 8", note: "2-3 warm-ups then 2 working sets of 5. 3 min rest." },
          { sets: "2", reps: "3", load: "RPE 8-9", note: "Heavy triples. Second set can be all-out." },
          { sets: "2", reps: "4", load: "~85%", note: "Fast bar. Pause the first rep on the chest." },
          { sets: "2", reps: "2", load: "~90%", note: "Heavy doubles. Rest 4 min." },
          { sets: "1", reps: "3", load: "~80%", note: "Taper." },
        ] },
      { key: "Weighted Pull-Up", tag: "Strength", unit: "kg", track: true, cue: "Log added weight (0 = bodyweight). Pull fast, lower under control. Lats power the arm swing.",
        rx: [
          { sets: "2", reps: "6", note: "1 warm-up set of 4 bodyweight, then 2 working sets at bodyweight or +5kg." },
          { sets: "2", reps: "5", note: "Add load." },
          { sets: "2", reps: "4", note: "Heavier, explosive pull." },
          { sets: "2", reps: "4", note: "Maintain." },
          { sets: "1", reps: "5", note: "Taper: bodyweight." },
        ] },
      { key: "Romanian Deadlift", tag: "Strength", unit: "kg", track: true, start: "Start 80kg x8. Straps on.",
        cue: "3 sec down, hard up. Hamstrings and glutes, not lower back. The hinge half of the jump.",
        rx: [
          { sets: "2", reps: "8", note: "1 warm-up set, then 2 working sets. Squeeze glutes at the top." },
          { sets: "2", reps: "6", note: "Add 5kg from block 1." },
          { sets: "2", reps: "6", note: "Hold the weight, keep the speed." },
          { sets: "1", reps: "6", note: "Maintenance only." },
          { sets: "1", reps: "6", note: "Taper: light, smooth." },
        ] },
      { key: "Weighted Dip", tag: "Strength", unit: "kg", track: true, cue: "Log added weight (0 = bodyweight). Slight forward lean, elbows to 90, drive up. The best assistance lift for a bigger bench.",
        rx: [
          { sets: "2", reps: "8", note: "Bodyweight or +5kg." },
          { sets: "2", reps: "6", note: "Add load." },
          { sets: "2", reps: "5", note: "Heavier." },
          { sets: "2", reps: "5", note: "Maintain." },
          { sets: "1", reps: "6", note: "Taper: bodyweight." },
        ] },
      { key: "Face Pull + Lateral Raise", tag: "Rehab", unit: "kg", track: true, cue: "Superset: 15 face pulls then 12 dumbbell lateral raises, log the dumbbell. Shoulder health for spiking and benching.",
        rx: [
          { sets: "2", reps: "15 + 12", note: "Light. Every week, every block." },
          { sets: "2", reps: "15 + 12", note: "Same." },
          { sets: "2", reps: "15 + 12", note: "Same." },
          { sets: "2", reps: "15 + 12", note: "Same." },
          { sets: "1", reps: "15 + 12", note: "Same." },
        ] },
      { key: "Tricep Pushdown + Couch Stretch", tag: "Mobility", unit: "kg", track: true, cue: "2 sets of 12 pushdowns (log the stack), then 2 min couch stretch each side. Hip flexor length directly adds jump height.",
        rx: [
          { sets: "2", reps: "12 + 2 min/side", note: "Lockout strength for the bench, then stretch." },
          { sets: "2", reps: "12 + 2 min/side", note: "Same." },
          { sets: "2", reps: "12 + 2 min/side", note: "Same." },
          { sets: "2", reps: "12 + 2 min/side", note: "Same." },
          { sets: "1", reps: "12 + 2 min/side", note: "Same." },
        ] },
    ],
    finisher: SAUNA,
  },
  R: {
    kind: "R", name: "Recovery (pre-match)", short: "REC", color: COLORS.teal, minutes: "40-45 min", tagline: "Arrive at Wednesday fresh",
    warmup: [],
    exercises: [
      { key: "Mobility Flow or Class", tag: "Mobility", unit: "min", track: false, cue: "Pilates or yoga class at Virgin Active counts. Otherwise: 90/90, pigeon, couch stretch, ankle rockers, t-spine rotations.",
        rx: [
          { sets: "1", reps: "25 min", note: "Low effort. This is not a workout." },
          { sets: "1", reps: "25 min", note: "Same." },
          { sets: "1", reps: "25 min", note: "Same." },
          { sets: "1", reps: "25 min", note: "Same." },
          { sets: "1", reps: "25 min", note: "Same." },
        ] },
      { key: "Easy Bike", tag: "Recovery", unit: "min", track: false, cue: "Zone 1, conversational. Flush the legs.",
        rx: [
          { sets: "1", reps: "10 min", note: "" }, { sets: "1", reps: "10 min", note: "" }, { sets: "1", reps: "10 min", note: "" }, { sets: "1", reps: "10 min", note: "" }, { sets: "1", reps: "10 min", note: "" },
        ] },
      { key: "Wall Sit Isometric", tag: "Isometric", unit: "sec", track: true, cue: "90 degrees, push the back hard into the wall. Tendon maintenance without fatigue.",
        rx: [
          { sets: "3", reps: "45 sec", note: "" }, { sets: "3", reps: "45 sec", note: "" }, { sets: "3", reps: "45 sec", note: "" }, { sets: "3", reps: "45 sec", note: "" }, { sets: "2", reps: "30 sec", note: "" },
        ] },
      { key: "Isometric Calf Hold", tag: "Rehab", unit: "sec", track: false, cue: "Wall lean, up on the toes, hold.",
        rx: [
          { sets: "3", reps: "30 sec", note: "" }, { sets: "3", reps: "30 sec", note: "" }, { sets: "3", reps: "30 sec", note: "" }, { sets: "3", reps: "30 sec", note: "" }, { sets: "2", reps: "30 sec", note: "" },
        ] },
      { key: "Foam Roll", tag: "Recovery", unit: "min", track: false, cue: "Quads, calves, glutes, upper back.",
        rx: [
          { sets: "1", reps: "8 min", note: "" }, { sets: "1", reps: "8 min", note: "" }, { sets: "1", reps: "8 min", note: "" }, { sets: "1", reps: "8 min", note: "" }, { sets: "1", reps: "8 min", note: "" },
        ] },
    ],
    finisher: "Sauna 15 min. Drink 750ml with electrolytes. Early night.",
  },
  C: {
    kind: "C", name: "Power + Jump", short: "JMP", color: COLORS.purple, minutes: "50-60 min", tagline: "Teach the body to explode, then bench",
    warning: "Knee rule: patellar tendon pain above 4/10 means no depth jumps or box jumps today. Do the isometrics and go home. Pain 1-3: train, but skip the depth jumps if the warm-up pogos hurt.",
    warmup: ["A-skips 2x20m", "Pogo hops 2x15", "Ankle rockers x10 each", "Walking lunges with twist x6 each", "Submax countermovement jumps x5, building to 90%"],
    exercises: [
      { key: "Jump Test", tag: "Test", unit: "in", track: false, cue: "Log in the Jump Test card below. Same method every week: wall and chalk, after the warm-up, fresh. 3 standing, 3 approach, best of each. This is your progression data.",
        rx: [
          { sets: "3 + 3", reps: "max", note: "Baseline block. Film one standing jump from the side for form." },
          { sets: "3 + 3", reps: "max", note: "Expect small dips in heavy weeks. That is normal." },
          { sets: "3 + 3", reps: "max", note: "Should start climbing now." },
          { sets: "3 + 3", reps: "max", note: "Every rep is a max attempt." },
          { sets: "5 + 5", reps: "max", note: "TEST DAY. Full rest between jumps. Log the best." },
        ] },
      { key: "Trap Bar Jump", tag: "Power", unit: "kg", track: true, plyo: true, start: "Start at bar + 5kg a side (what you already use, about 30kg). That is roughly 30% of bodyweight, the top of the useful range, so progress by jumping higher, not by adding plates.",
        cue: "Log total bar weight. Triple extension: ankles, knees, hips together, land soft. Sets of 3-4, not 10: by the sixth jump of a long set you are training endurance, not power.",
        rx: [
          { sets: "4", reps: "3", load: "~30kg", note: "Max height every rep, 2 min rest between sets. Trap bar jumps replace hang cleans: same triple extension, no technique tax." },
          { sets: "4", reps: "3", load: "30-35kg", note: "Add 2.5kg a side only if every jump still looks the same height." },
          { sets: "5", reps: "3", load: "25-30kg", note: "Lighter and faster. Rate of force development is the whole point." },
          { sets: "3", reps: "3", load: "20-25kg", note: "Less volume, more speed." },
          { sets: "2", reps: "2", load: "bar only", note: "Taper: keep the pattern fresh." },
        ] },
      { key: "Depth Drop / Depth Jump", tag: "Reactive", unit: "cm", track: true, plyo: true, cue: "Log the box height. Step off, never jump off. Block 1 is drop and stick (land soft, hold 2 sec). From block 2: land and immediately jump as high as possible, shortest possible ground contact.",
        rx: [
          { sets: "3", reps: "5 stick", load: "30cm", note: "Drop and stick only. Teach the landing before the rebound." },
          { sets: "3", reps: "4 jump", load: "30cm", note: "Depth jumps start. Short contact, max height." },
          { sets: "4", reps: "4 jump", load: "40cm", note: "Taller box. If contact time gets long, lower the box." },
          { sets: "3", reps: "3 jump", load: "45-50cm", note: "Max intensity, minimal volume." },
          { sets: "2", reps: "3 jump", load: "30cm", note: "Taper: a few to stay sharp." },
        ] },
      { key: "Hurdle Hops / Pogos", tag: "Reactive", unit: "reps", track: false, plyo: true, cue: "Your usual bodyweight pogos. Stiff ankles, knees mostly straight, bounce. Ground contact as short as possible.",
        rx: [
          { sets: "3", reps: "10-20 pogos", note: "Achilles spring. What you already do, kept." },
          { sets: "3", reps: "6 hurdle hops", note: "Low hurdles or cones, continuous." },
          { sets: "4", reps: "6 hurdle hops", note: "Higher hurdles." },
          { sets: "3", reps: "5 hurdle hops", note: "Max height, still fast contacts." },
          { sets: "2", reps: "6 hurdle hops", note: "Taper." },
        ] },
      { key: "Box Jump (step down)", tag: "Plyos", unit: "cm", track: true, plyo: true, cue: "Log box height. Full arm swing, land soft on top, step down every rep.",
        rx: [
          { sets: "3", reps: "4", load: "~60cm", note: "Max height per jump, 2 min rest." },
          { sets: "3", reps: "4", load: "taller", note: "Raise the box when landings are easy." },
          { sets: "4", reps: "3", load: "taller", note: "Explode." },
          { sets: "3", reps: "3", load: "max", note: "Highest box you can land softly on." },
          { sets: "2", reps: "3", load: "moderate", note: "Taper." },
        ] },
      { key: "Approach Jump Practice", tag: "Sport", unit: "reps", track: false, plyo: true, cue: "Volleyball approach: long and low penultimate step, arms back as you plant, both arms drive up. You do 5x3 with little rest: keep the 5x3, but rest 90 sec between sets. Short rest turns max jumps into conditioning and volleyball gives you enough of that. Film one every 2 weeks.",
        rx: [
          { sets: "5", reps: "3", note: "Technique focus, 80-90% effort. 90 sec rest." },
          { sets: "5", reps: "3", note: "Full speed. 90 sec rest." },
          { sets: "5", reps: "3", note: "Full speed, max height. Touch a target, 2 min rest." },
          { sets: "4", reps: "3", note: "Game speed. Every rep. 2 min rest." },
          { sets: "2", reps: "3", note: "Taper: feel it, done." },
        ] },
      { key: "Bench Press", tag: "Strength", unit: "kg", track: true, cue: "Second bench exposure of the week, after the jumps. Upper work does not cost the legs anything. Same warm-ups as Tuesday, slightly lighter.",
        rx: [
          { sets: "1", reps: "6", load: "RPE 8", note: "2 quick warm-ups, then one hard set. Skip if the session is already past 50 min." },
          { sets: "1", reps: "5", load: "RPE 8", note: "Same rule." },
          { sets: "1", reps: "4", load: "RPE 8", note: "Fast bar." },
          { sets: "1", reps: "4", load: "RPE 8", note: "One set to maintain." },
          { sets: "0", reps: "none", note: "Taper: no bench this week." },
        ] },
      { key: "Pull-Up + Dip Superset", tag: "Strength", unit: "reps", track: true, cue: "Bodyweight. 6 pull-ups then 8 dips, log total reps. Lats and triceps keep growing without fatiguing the legs.",
        rx: [
          { sets: "2", reps: "6 + 8", note: "Easy, done, sauna." },
          { sets: "2", reps: "6 + 8", note: "Same." },
          { sets: "2", reps: "8 + 10", note: "Same." },
          { sets: "1", reps: "8 + 10", note: "One round." },
          { sets: "0", reps: "none", note: "Taper: skip." },
        ] },
    ],
    finisher: "5 min walk, then sauna 10-15 min. Fluids before the ride home.",
  },
};

// Deload rule applied on weeks 4, 8, 12, 16.
export const DELOAD_RULE = "Deload week: one working set per lift instead of two, same weights, halve the plyo sets, replace depth jumps with drop-and-stick, keep every isometric. Still do the jump test.";

// How to measure the vertical so every Thursday number is comparable.
export const MEASURE_METHOD = [
  "Chalk your fingertips. Stand side-on to a wall or the squat rack upright, feet flat, reach up with one arm and touch. That mark is your standing reach. Measure it once in cm and the app remembers it.",
  "Standing jump: no step, countermovement and arm swing allowed, touch the wall at the top. Approach jump: your normal volleyball approach, take off on two feet, touch.",
  "Vertical = touch height minus standing reach. Three attempts each, 45 sec rest between, log the best. Type the touch heights in cm and the app converts to inches.",
  "Always after the warm-up, always before the heavy work, same wall. Fatigued tests (after judo, the night after volleyball) go in the notes so they do not confuse the trend.",
];
export type DayPlanType = "gym" | "volley" | "match" | "judo" | "rest";
export interface DayPlan { type: DayPlanType; kind?: SessionKind; label: string; detail: string; color: string }

// Weekly template. matchWeek decides what Tuesday is.
export function dayPlan(dow: number, matchWeek: boolean, week: number): DayPlan {
  switch (dow) {
    case 1: return { type: "gym", kind: "A", label: "Gym: Lower Strength", detail: "Cycle 10 min. Under an hour, then sauna.", color: COLORS.accent };
    case 2: return matchWeek
      ? { type: "gym", kind: "R", label: "Gym: Recovery", detail: "Match tomorrow. Mobility, isometrics, sauna.", color: COLORS.teal }
      : { type: "gym", kind: "B", label: "Gym: Upper + Hinge", detail: "No match this week, so lift.", color: COLORS.blue };
    case 3: return matchWeek
      ? { type: "match", label: "Volleyball match", detail: "Play. Log it after with an RPE.", color: COLORS.orange }
      : { type: "rest", label: "Rest", detail: "No match this week. Walk, eat, sleep.", color: COLORS.muted };
    case 4: return { type: "gym", kind: "C", label: week === 17 ? "Gym: TEST DAY" : "Gym: Power + Jump", detail: "Weekly jump test first, then the explosive work.", color: COLORS.purple };
    case 5: return { type: "rest", label: "Rest", detail: "Full rest before judo. Optional 20 min walk.", color: COLORS.muted };
    case 6: return { type: "judo", label: "Judo", detail: "Log it with an RPE after.", color: COLORS.pink };
    default: return { type: "volley", label: "Volleyball training 8-10pm", detail: "Cycle 30 min each way. Carbs at dinner, protein after.", color: COLORS.orange };
  }
}

export const PRINCIPLES = [
  { icon: "⚡", title: "Three sessions, under an hour, all intent", desc: "Monday strength, Thursday power and jumps, Tuesday either an upper/hinge session or recovery depending on whether there is a match. Nothing else needs adding: volleyball and judo are your conditioning." },
  { icon: "🎯", title: "Low volume, hard sets", desc: VOLUME_RULE + " For strength the reps are low (2-6) and the rest is long (3 min). Two hard sets a week per lift is enough to keep the strength climbing when you also jump three days a week." },
  { icon: "📏", title: "Measure every Thursday", desc: "Wall and chalk, same warm-up, 3 standing and 3 approach jumps, log the best. Without the weekly number you cannot tell what is working. Expect dips in heavy weeks and jumps after deloads." },
  { icon: "🦵", title: "Knees first", desc: "Spanish squats, wall sits and calf isometrics every single week, deload or not. Pain above 4/10 on the patellar tendon cancels plyos for that day. Log which knee: a one-sided pattern usually means a landing or approach asymmetry worth filming." },
  { icon: "🔄", title: "Deload weeks 4, 8, 12, 16", desc: "One working set per lift, keep the weights, halve the plyos, no depth jumps. Week 8 lands on Christmas week, which is convenient." },
  { icon: "🚲", title: "The cycling is already in the plan", desc: "10 min to the gym is a warm-up. 30 min each way on Sunday is real work: use the e-bike home after volleyball when the legs are done, especially in heavy weeks." },
  { icon: "⚖️", title: "Power to weight", desc: "At 100kg and lean, do not chase weight loss. Keep bodyweight stable (log it weekly), let the strength and reactive work raise power. If you drift up 2-3kg, tighten dinner carbs on rest days only." },
];
