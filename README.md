# Vertical Tracker

Personal vertical jump training tracker. 17-week program (Mon 2 Nov 2026 to Sun 28 Feb 2027), goal 30" to 40" standing vertical, built around volleyball (Sun training, Wed matches), judo (Sat) and three sub-hour gym sessions (Mon, Tue, Thu). Installable PWA, one user, own iPhone.

## Screens

| Tab | What it does |
|---|---|
| Today | Today's planned session, start/log it, daily check-in, days left and pace needed |
| Plan | Week-by-week schedule (17 weeks + baseline week), block overview, method. Toggle per week whether there is a Wednesday match (decides whether Tuesday is a lift or a recovery session) |
| Log | Every entry by date: gym sessions with sets, volleyball, matches, judo, classes, jump tests, check-ins. Tap a gym session to expand sets. Delete with × |
| Analyse | Vertical vs goal with target path and linear projection, weekly load (RPE × minutes), gym adherence, estimated 1RM per lift, knee pain, bodyweight, sleep, load by activity. Table view toggle. JSON backup / import and CSV exports |
| Fuel | Current diet reviewed meal by meal with changes, daily targets, example training day |

## Program structure (src/program.ts)

- B1 Foundation (wk 1-4), B2 Strength (wk 5-8), B3 Power (wk 9-12), B4 Reactive (wk 13-16), Taper & Test (wk 17)
- Volume: 1-2 warm-up sets then 1-2 working sets per lift (listed sets are working sets). Plyo sets are contacts, stopped when height drops
- Deload on weeks 4, 8, 12, 16: one working set per lift, same weights, half the plyos, no depth jumps
- Sessions: A Lower Strength (Mon), B Upper + Hinge (Tue, non-match week), R Recovery (Tue, match week), C Power + Jump (Thu, includes the weekly jump test; wall-touch method, reach saved in settings, converted to inches)
- Every exercise has a prescription per block (`rx[0..4]`); `track: true` exercises get set logging

## Data (src/store.ts)

Single localStorage key `vt.v2`:

```
sessions[]  { date, type (gym|volley|match|judo|class|cycle|other), kind (A|B|R|C), minutes, rpe, sauna, knee, kneeSide (L|R|both), notes, exercises[{ key, unit, sets[{ w, r }] }] }
jumps[]     { date, standing (in), approach (in), broad (cm), notes }
checkins[]  { date, weight, sleep, soreness, knee, energy, protein, creatine, notes }   (one per date)
settings    { matchWeeks{ week: bool }, goalIn, baselineIn, reachCm, touchGoalCm (spike reach target, default 350) }
draft       in-progress gym session (survives reloads)
```

Estimated 1RM uses Epley (w × (1 + r/30)). Session load is RPE × minutes. The projection on the vertical chart is a least-squares line through every standing test, needs 3+ tests.

Export: JSON backup (full store), CSVs for sets, sessions, jumps and check-ins. Import replaces the store with a JSON backup.

## Deploy (GitHub Pages)

`npm run deploy` builds with `BASE_PATH=/vertical-program/` and force-pushes `dist/` to the `gh-pages` branch. Live at https://mirsch1.github.io/vertical-program/ a minute later. On the iPhone: open the URL in Safari, Share, Add to Home Screen.

## Commands

```bash
export PATH="/opt/homebrew/bin:$PATH"   # Node via Homebrew
npm install
npm run dev      # localhost:5173, LAN-accessible for iPhone
npm run build    # tsc -b && vite build -> dist/
npm run preview
```

## Install on iPhone

PWA install needs HTTPS. Deploy `dist/` (Vercel `npx vercel`, Netlify drop, Cloudflare Pages), open the URL in Safari, Share, Add to Home Screen. Data stays on the phone, so export a JSON backup from the Analyse tab now and then.

Note: ~/Desktop is iCloud-synced; after idle weeks files turn into cloud placeholders and builds hang. Fix: `find . -type f -flags +dataless -print0 | xargs -0 cat > /dev/null`.
