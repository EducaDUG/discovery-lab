# Project Brief: Interactive Learning Simulation Hub

**Save this file as `CLAUDE.md` in the root of the GitHub repository.** Claude Code reads `CLAUDE.md` automatically at the start of every session in that repo, so this becomes the persistent project memory — you won't need to re-explain the architecture each time.

---

## 0. GitHub access

I have full access to my GitHub account and am giving you full access to build and push to the repository for this project.

Before doing anything else, check what you actually have access to (git configured, repo cloned or created, push permissions, GitHub Pages enabled). If anything is missing — repo doesn't exist yet, no push access, no GitHub CLI/git auth configured — **stop and tell me exactly what you need from me** (e.g. "create an empty repo called X and give me the URL," "run `gh auth login`," "add me as a collaborator"). Don't guess or work around missing access silently.

**Standing authorization — always commit and push (confirmed 2026-09-07).** Once I give you an instruction — a new simulation, an amendment, a fix — design it, build it, verify it, commit it, and push it to `main` yourself. Do not stop to ask whether you should push; that permission is already given, for every session, not just this one. I'd rather have a live MVP than a polished thing sitting uncommitted. The only reason to stop before pushing is a genuine access problem (see above) or a destructive/irreversible action outside normal content work (e.g. force-push, rewriting history, deleting a branch) — those still need to be flagged.

---

## 1. What this is

A free, GitHub Pages–hosted website of interactive learning simulations for my students (1:1 online tutoring, primary through secondary, covering Biology, Spanish, and other subjects/pathways over time — including A Level/Edexcel IAL and US Diploma pathways).

Each simulation is a self-contained, gamified, visually polished interactive activity that turns a slide or a topic into hands-on practice, paired with a short built-in assessment that produces marking-ready evidence for me. Students navigate the site by subject → module → simulation. I will keep adding simulations over time, one at a time, usually starting from a PowerPoint slide or a short instruction I give you.

---

## 2. Site architecture

```
repo-root/
├── CLAUDE.md                     ← this file
├── index.html                    ← pathway/subject tiles (home)
├── engine/                       ← shared code, touched rarely
│   ├── style.css                 ← shared design system (see Section 4)
│   ├── engine.js                 ← question-type renderer, auto-marking, evidence export
│   ├── accessibility.js          ← accessibility panel (see Section 6)
│   └── pdf-lib/                  ← client-side PDF generation library (vendored or CDN)
├── data/
│   └── subjects.json             ← single source of truth for site navigation (see below)
├── us-pathway/
│   └── environmental-science/
│       ├── index.html            ← module tiles
│       └── module-1-introduction/
│           ├── index.html        ← simulation tiles (incl. "coming soon" placeholders)
│           ├── sim-1-ph-investigation/
│           │   ├── activity.html     ← the simulation + Investigation Record page
│           │   └── config.json       ← this activity's questions, rubric, marking instructions
│           └── ...
├── a-level/
│   ├── biology/
│   └── ...
└── spanish/
    └── ...
```

**Content vs. engine — this is the core architectural rule.** The engine (shared CSS/JS: rendering question types, auto-marking, generating the PDF/JSON evidence, the accessibility panel) is built once and rarely touched again. Every activity's actual content — its questions, rubric, marking instructions, simulation-specific logic — lives in that activity's own folder. When I ask for a change to one simulation, only that simulation's files should need editing. This keeps changes fast and low-risk as the library grows to dozens of activities.

**`data/subjects.json`** drives all navigation (home page, subject pages, module pages). It lists every pathway/subject/module/simulation with a status of `live` or `coming-soon`. Adding a new simulation to the site means adding one entry here plus the activity's own folder — the navigation UI never needs manual edits.

---

## 3. The Interactive Learning Package — the standard every activity must meet

Every simulation is not a standalone game — it's a full package. This is the fixed sequence every activity follows:

**Orient → Predict → Investigate → Record → Explain → Apply → Knowledge Check → Generate Learning Evidence**

- **Orient**: a short mission statement, not a wall of instructions ("Your task is to identify unknown substances using their pH.")
- **Predict**: one prediction question before the student touches the simulation.
- **Investigate**: the actual interactive simulation/game.
- **Record**: results from the simulation auto-populate into an "Investigation Record" (never call it a "worksheet") — the student doesn't retype data the simulation already generated.
- **Explain**: 1 short-answer question interpreting the pattern observed.
- **Apply**: 1 question applying the concept to a new/unfamiliar context.
- **Knowledge Check**: 3–5 auto-marked questions (multiple choice, numeric, classification, matching, ordering — whatever objectively grades itself).
- **Generate Learning Evidence**: one button that produces both exports (see Section 5).

**Question limits**: no more than 5–7 questions total per activity. No more than 2 constructed-response (written) questions requiring judgement — everything else must be auto-markable. The goal: most of my post-lesson processing per activity takes under a minute.

**Real-life connection**: every activity must connect the concept to something in the student's everyday life or surroundings — not just abstract content. Build this into the mission framing or the Apply question.

**Always different**: don't reuse the same simulation mechanic repeatedly within a subject/module. Track what mechanic types have already been used (quadrat sampling, dichotomous key, titration, population graphing, timeline builder, matching/sorting, branching scenario, mini physics-engine game, etc.) and vary them. If I don't specify a mechanic when I send you a new topic, pick one that hasn't been used yet in that module.

**Built from minimal input**: I'll typically give you a PowerPoint slide (screenshot or file), a topic name, or a short instruction. From that alone, design the mission, the mechanic, the questions, and the real-life hook — don't wait for me to spec every detail.

---

## 4. Visual and interaction design — this must look world-class

This is not optional polish — it's core to the brief. The bar: **someone should be visibly impressed within 5 seconds of seeing it.**

Explicitly avoid the "generic AI-generated web app" look: no default Bootstrap cards, no cliché purple-to-blue gradient hero sections, no emoji standing in for real icons, no generic centered-card-on-white-background layouts, no overuse of one default font (e.g. Inter) with no personality.

Instead:
- Build a genuine **design system** in `engine/style.css`: a deliberate color palette and typography pairing per subject area (e.g. Biology: organic greens/earth tones; Chemistry: vivid lab-glass colors; Physics: deep technical blues; Spanish: warm Mediterranean tones). Subjects should feel visually distinct from each other while sharing the same underlying UI patterns (buttons, cards, progress indicators) for consistency.
- Use **real custom graphics** — SVG illustrations, canvas drawing, or CSS/3D — not stock icon sets alone.
- Use **3D elements where they add value**: CSS 3D transforms or a lightweight library (e.g. Three.js via CDN) for things like rotating molecules, a 3D lab bench, a terrain/ecosystem you can orbit, or physics objects that actually move. Not every activity needs 3D — use judgement: some topics call for a "serious virtual lab" feel (precise, clean, instrument-like), others call for a "video game" feel (playful, kinetic, reward-driven). Match the tone to the content and the age group.
- Use **motion and feedback**: micro-animations on correct/incorrect answers, satisfying transitions between stages, visible progress (e.g. a progress bar across Orient→...→Evidence), not static form-fill silence.
- **Adjust tone by age band**: primary-age activities should read as playful and colorful with simpler language and shorter text; secondary/A-Level/Diploma activities can be more visually "serious instrument" in style with denser content, while still avoiding a dull, form-like feel.
- **Gamification**: points, streaks, a sense of progress/completion, small celebratory moments on finishing — appropriate to age group, never so heavy it distracts from the learning goal.

**Amendment — interactivity density, not prose density (confirmed 2026-09-07).** Diego flagged that an activity had "more text than interactive activities" and that Investigate's clicks silently did nothing on real input. Two standing rules from this:

- **Every stage should be doing, not reading.** Where a stage would otherwise be a block of text, turn it into an interactive moment instead — a tap-to-reveal hotspot diagram rather than a definitions list, a click-to-match labelling game rather than a paragraph of facts, a 2-option quick-check rather than a passive fact toast. Spread labelling, matching, and small quizzes *throughout* the simulation (Orient and Investigate both), not concentrated only in the Knowledge Check at the end. A wall of prose anywhere in the activity is a design miss, not a style choice.
- **Real images, not just text, for anything meant to be learned visually.** Used as actual teaching/labelling images — hotspots on a diagram, tap-to-match against a picture — not a bullet list of names and definitions.

  **Amendment — prefer a real photo over an SVG illustration (confirmed 2026-09-07).** When the subject is a real, photographable object (a computer, a plant, a rock sample), source an actual photo rather than drawing one — Diego's words: "to make the experience more real." Search Wikimedia Commons for a CC0 or CC-BY/CC-BY-SA licensed photo, **open the file's own page and verify the license yourself** before using it, download and vendor it into the activity's own folder (`photos/`, resized to a few hundred KB, same treatment as thumbnails — never hotlinked, per the no-CDN rule), and show a visible on-page credit line crediting the photographer with a link to the license (required by CC-BY/CC-BY-SA). If a real photo can't clearly show a part (e.g. a CPU is always hidden under its cooler once installed), don't fake it — place the hotspot on what's actually visible in the photo and say so honestly in the reveal text; that honesty is itself a good teaching moment. SVG illustration remains the right tool for anything that isn't a photographable real object — an abstract concept, a cutaway/cross-section, a process diagram.
- **Test click/tap interactions with real single clicks, not just synthetic events, before calling an Investigate stage done.** A pointer-vs-camera-drag heuristic that trips on the first sub-pixel of movement will pass a scripted zero-movement test and then fail for every real user, since a genuine tap or trackpad click always carries a little jitter. Any canvas that both orbits on drag *and* picks on click needs: touch-action:none on the canvas, a cumulative-travel threshold (not a boolean flagged by the first pointermove) to tell a tap from a drag, and the actual pick done off the native "click" event rather than hand-rolled off pointerup.

**Amendment — every simulation needs at least one real-photo labelling activity, image-first over text-first, and feedback must be visible without scrolling (confirmed 2026-09-08).** Diego, after the fixes above shipped: "have one of these labeling activities at some point using a real image" in every simulation going forward — not just this one — "so that we can relate the content more to real life." He also said images should aid *explanations* generally, not only labelling, and repeated that there is still too much text. Two more things surfaced by testing:

- **Every simulation gets at least one real-photo-based labelling/hotspot activity**, sourced and credited per the rule above. Beyond labelling, prefer a real photo over a paragraph anywhere a photo would make an explanation concrete — a close-up next to a definition, a real specimen/object next to a question — not just in Orient/Investigate.
- **A click that does the "wrong" thing must still visibly react, immediately, inside the current viewport — not just via a caption or toast that may render below the fold.** What Diego reported as "the Investigate functionality is not activated, nothing happens" was tapping a numbered hotspot before selecting a part first: the click *was* registering, but the only feedback was a quiet caption below the picture — invisible without scrolling, so it read as completely broken. Every click path (not just the success path) needs an in-place reaction at the point of interaction — a shake/pulse on the thing tapped, not only a message elsewhere on the page.
- **Verify hotspot coordinates by rendering a debug overlay and looking at it, not just by trusting the fraction math.** Diego flagged the "case" hotspot on the ATX photo landed on an arbitrary, unrecognisable patch of interior case wall. Pixel-accurate isn't the same as pedagogically clear: a hotspot must land on something a student would actually recognise as that labelled part (an edge, a screw, a distinctive feature) — for a whole-object label like "case" on a photo of its open interior, that means the visible outer frame/rim, not a random unobstructed patch.

**Amendment — every simulation needs a genuine bonus arcade round with real 3D dynamic effects (agreed 2026-09-16).** Diego: the site was missing "a bit of a video game to play," calling for "3D dynamic effects, a bit of an arcade or modern videogame" as **a norm in all simulations**, not a one-off. This is additive — it never replaces or gates the Interactive Learning Package in Section 3; it sits alongside it.

- **Shared implementation: `engine/arcade.js`.** Built once, like `accessibility.js`/`i18n.js`, so a new activity plugs in its own items/lanes instead of hand-rolling a 3D game each time. It exports `renderArcadeLaunch()` (an optional, always-skippable launch card) and `mountArcadeRush()` (the game: real items — reuse the activity's own real photos where it has them — fly down a 3D tunnel toward a strike ring; the student taps one of up to five colour-coded lane buttons, or presses number keys 1-9, before it arrives). See `sim-five-kingdoms-sorter` for the reference integration (a "Kingdom Rush" bonus round using the same eight specimen photos as the main sort).
- **Bonus, never mandatory.** No lives, no fail state, no hard gate — CLAUDE.md §6 already requires no interaction that penalises a student for taking their time, and a twitch-reflex game would violate that outright. A late or wrong answer just resets the streak and moves to the next item; the round always ends in a score/accuracy/best-streak recap, never a "you failed." The launch card always offers "Play" and "Skip" side by side, and the round contributes no marks — it exists for delight and reinforcement, not assessment (the careful diagnostic Investigate stage is what's graded).
- **Real 3D via vendored Three.js, with an automatic non-WebGL fallback.** `mountArcadeRush` loads `engine/vendor/three.min.js` itself; if that fails or WebGL is unavailable it falls back to a calm DOM/CSS version of the same scored, timed game — the bonus round is never a dead end on a locked-down school device.
- **A full round runs close to two minutes of real play, always (amendment, agreed 2026-09-17).** Diego, after playtesting: "there is no videogame to play... a 3D videogame, arcade videogame or similar, for 2 minutes whilst practising content. Always, in this one and in others too." A round that a confident student blitzes through in seconds reads as no game at all. `mountArcadeRush` therefore always waits out an item's scheduled flight time before spawning the next one — tapping the answer instantly still triggers the reaction (particle burst, lane flash, streak) immediately, but the item's remaining scheduled flight is what actually gates the next spawn, so the round can never be sped up by fast, confident answers. Pass `rounds: 24` (the engine default) unless a specific activity has a good reason to differ — that count, at the engine's tuned flight-time ramp, is what yields ~2 minutes. Never shorten the round to "get through it faster"; if a round feels short, the fix is the timing constants in `engine/arcade.js`, not a smaller `rounds` value.
- **Answers are real `<button>` elements, never 3D hit-picking.** This sidesteps the whole class of pointer-vs-drag bug this project already hit once (the hotspot amendment above) — the canvas only *displays* the flying item; tapping/clicking or pressing 1-9 on the lane buttons is what the student actually operates, so it is fully keyboard-operable for free.
- **Respects reduced motion and the rest of the accessibility panel already.** Camera sway, screen-shake and particle bursts are skipped under `data-reduced-motion=on`; the pacing (item flight time) ramps gently and is never so fast it becomes a reflex test.
- Where a falling-item lane game genuinely doesn't fit an activity's content, build an equivalent activity-specific 3D bonus moment instead (matching the "serious lab instrument" vs "video game" tone call already in this section) — but every simulation must have *something* genuinely game-like and dynamically 3D, not just static UI.

**Amendment — two game genres, always alternated, never the same one twice in a row (agreed
2026-09-17).** Diego: "I want more videogames. At least one in each simulation, to have
gamification, alternate it between arcade games, but also 3D realistic ones, like PlayStation games."
Two things follow: every simulation needs its bonus round (the rule above already said that), and the
*genre* must vary from one simulation to the next rather than every activity getting the same tunnel-
rush every time.

- **Genre 1 — arcade** (`engine/arcade.js`, `mountArcadeRush`): the fast, scored tunnel-rush described
  above. Reference: `sim-five-kingdoms-sorter`, `sim-fraction-bakery`, `sim-seed-germination-lab`
  ("Seed Species Rush").
- **Genre 2 — realistic 3D** (`engine/quest3d.js`, `mountQuest3D`): a calmer, third-person
  exploration/collection game — the student drives a small rover around a lit, shadowed arena for a
  fixed real-time session (`durationMs`, default 2 minutes), hunting for items matching a category
  banner that cycles as they collect. "Realistic" here means the actual realism levers a vendored,
  addon-free Three.js core provides — ACES filmic tone mapping, soft PCF shadow maps,
  `MeshPhysicalMaterial`, fog, a damped third-person chase camera — not literal console fidelity,
  which this stack cannot produce. Movement is keyboard-first (arrow keys/WASD, fully
  keyboard-operable for free) with a touch/mouse virtual joystick layered on top. Reference:
  `sim-vertebrate-sorting-lab` ("Backbone Quest").
- **The round is time-boxed, not item-count-paced.** `mountQuest3D` runs for a fixed wall-clock
  duration and ends automatically — this sidesteps the whole "a confident student blitzes through it"
  problem the arcade genre had to be fixed for (see the ~2-minute amendment above), by construction,
  rather than by tuning flight-time constants. Prefer this when adding a new genre or fixing pacing
  issues in either module.
- **Game-state deadlines (a round timer, an end-of-round trigger) must run on `setInterval`/elapsed
  wall-clock time, never on `requestAnimationFrame` alone** — `requestAnimationFrame` is for the
  cosmetic render/physics loop only. `mountQuest3D`'s countdown originally used a `requestAnimationFrame`
  loop for both drawing and the finish trigger and could stall under paint throttling; see
  [[discovery-lab-raf-throttling-pitfall]] and `engine/quest3d.js`'s `hudTimer`.
- **When you build a new simulation:** check which genre the simulations in the *same course* used
  last (same lookup discipline as the `mechanic` field — CLAUDE.md §10/§11) and use the other one. Two
  arcade rounds or two quest rounds back to back in the same course is the failure mode this amendment
  exists to prevent.
- **When a simulation's own gamification (rank/XP/streak on the main Investigate stage, not the bonus
  round) never actually ends, add a clear finish card once the investigation is fully done** — a short
  "Investigation complete!" summary (final rank, total XP, best streak), not just a quiet toast. Diego:
  "the game in the Investigate tab never finishes… it should have a clear end at some point." Keep the
  scoring itself addictive (XP, streak, rank-ups) — this only adds the missing finish line. See the
  `.invdone` card in `sim-vertebrate-sorting-lab` for the pattern.
- **Vary the specific mechanic *inside* a genre too, not just the arcade-vs-realistic-3D pick (agreed
  2026-09-18).** Diego: "please ensure this style of videogame is not always the same, ok? Vary them,
  never the same." `mountQuest3D`'s drive-a-rover-and-collect is a *reference implementation of one
  mechanic*, not the only shape "realistic 3D" is allowed to take. A course that already has a
  drive-and-collect quest round needs a genuinely different realistic-3D interaction next time it's
  this genre's turn — e.g. aim-and-launch at a target, assemble/place parts onto a 3D model, sort items
  off a moving conveyor, a first-person hidden-object hunt in a static scene. Same discipline as the
  `mechanic` field (CLAUDE.md §10/§11): check what the other simulations in the course already used —
  both the genre (arcade/quest) and, within quest, the specific interaction — before building a new
  one.
- **Chase-camera bug, fixed 2026-09-18 — worth re-deriving if you touch camera-follow code.**
  `mountQuest3D`'s third-person camera originally sat in *front* of the avatar's direction of travel
  instead of behind it, so pressing "forward" visually read as driving in reverse. The avatar's nose
  (the visor mesh) is modelled at local +Z, and `rotation.y = atan2(vel.x, vel.z)` is set so local +Z
  always points along the direction of travel — which means "behind the avatar" is local **-Z**, not
  +Z. The chase-camera offset must use `new THREE.Vector3(0, 0, -1)`, not `(0, 0, 1)`. If a future
  realistic-3D mechanic adds its own chase or follow camera, re-derive this from the model's actual
  forward axis rather than assuming a sign — this is exactly the kind of thing that looks fine in code
  review and only shows up as "backwards" when someone actually plays it.

**Amendment — at least THREE hands-on, things-move moments in every Investigate, on top of the
bonus round, hard rule going forward (agreed 2026-09-18).** Diego, after seeing Mission: Blue
Planet's first cut (a slider plus a static-looking floating egg): "this looks quite static... there
is only one thing you are playing with in each simulation... I want the student to have at least one
video game moment and then at least three moments when they are managing things and things are
moving and it's dynamic." His comparison point is explicit: it should feel like "playing a Mario
Nintendo video game" — pressing keys or using the mouse and *something visibly, exaggeratedly
moves* — not a form with a live-updating number next to it. This is additive to, not a replacement
for, every existing gamification rule above (arcade/quest bonus round, badges, streaks, XP) — it is
about the core Investigate/Experiment stage itself, which was still reading as one static control
even in simulations that already had a bonus round bolted on.

- **The floor is now four distinct moments per simulation**, not one: **(1)** at least one bonus
  arcade/quest round (already mandatory, see above) that plays like a real video game, **plus (2), (3)
  and (4)** — at least three separate hands-on interactions inside Investigate itself where the
  student actively manages something and watches it move/grow/shrink/fall/rise, each with its own
  clear moment of feedback (a splash, a burst, a camera punch, a pop), not just a number changing in
  a corner. A single slider driving a single visual is a policy miss now, regardless of how correct
  the underlying model is.
- **Real 3D wherever the topic can carry it, not just in the bonus round.** The core Investigate
  scene itself should default to an orbitable Three.js scene (drag to orbit, scroll to zoom, exactly
  the pattern already used in `sim-seed-germination-lab`/`sim-cuvier-deep-dive`) with continuous idle
  motion — bobbing, drifting, a slow auto-orbit — so the scene is never perfectly still even before
  the student touches anything. Reference implementation: `sim-mission-blue-planet`'s Salinity &
  Buoyancy Station, rebuilt 2026-09-18 around three explicit moments — (1) **Mix the Brine**: tap a
  shaker to add salt pinch by pinch, each tap spawning a falling/dissolving particle burst, not a bare
  slider; (2) **Drop Test**: a button that sends a 3D object falling with a splash, ripple ring and a
  camera "punch" (brief dolly-in) on impact, then continuous bobbing at rest; (3) **Catch the
  Reading**: a sweeping needle the student must time a click against to "lock in" a result — a real
  timing mini-game, generous and never punishing (unlimited retries, no score penalty, see the
  no-penalise-time rule in §6), but still a skill moment, not a passive readout.
  Keep the exact slider/preset controls too where they help precision or accessibility — the fix is
  to make them one option alongside the game-like ones, never the *only* option.
  **Vet camera-orbit fixes before trusting them:** a perfectly rotationally-symmetric scene (a plain
  cylinder tank, say) can make an orbit that works correctly in code look "broken" in a screenshot
  because nothing on-axis changes — put at least one off-axis landmark (a dock, a prop, a label) in
  every 3D scene specifically so orbiting is visibly rewarding, and verify with a drag that actually
  moves an off-axis object across the frame, not just by eyeballing a symmetric object from two angles.
- **Every one of the three moments needs its own juice.** Reuse the shared burst-particle pattern (a
  small DOM/Canvas particle pop layered over the 3D or 2D stage — see `burst()` in
  `sim-mission-blue-planet`) for taps, drops and catches alike, plus at least one camera or scale
  "punch" on the biggest moment (typically the drop/impact). No interaction should ever resolve
  silently.
- **This is a floor for every future simulation, science or otherwise (Spanish, primary, A-Level,
  everything)** — Diego was explicit that this applies "moving forward" to all subjects, not just
  science, and is not a one-off fix to Mission: Blue Planet. When designing a new activity's
  Investigate stage, explicitly plan out what the three-plus hands-on moments will be *before* writing
  any code, the same way `learningFocus` and the rubric are planned up front.
- **This does not relax anything in §6 (accessibility).** No-penalise-pacing, keyboard operability,
  reduced-motion fallbacks and a non-3D/non-drag alternative path all still apply to every one of these
  moments — "exciting" and "accessible" are not in tension here, they are both required.

---

## 5. Evidence export — the assessment engine

Every activity produces **one file** when the student clicks **Generate Learning Evidence**, via a real client-side PDF generation function (not `window.print()` — that opens a manual print dialog and breaks the filename/layout consistency we need):

**Filename convention**: `Student_Course_Module_Activity_Date.pdf`

**PDF (the only download, and the official submission)**: human-readable, includes the mission, results, all answers, auto-marked score, the full rubric with level descriptors, and the **direct URL to the simulation** — so a parent or the head of department can open the live activity itself, not just read a static record. This is the only file the student ever has, and the only one they upload to the school's LMS.

**Hard rule — the PDF must qualify as a "lab report," not just informal "evidence" (agreed 2026-09-18,
non-negotiable).** Diego: this PDF has to satisfy an online school's requirement for a submittable lab
report — the same standing a physical, in-person school's paper lab report has — not read as a casual
activity summary. Two concrete, permanent requirements follow from this:

- **The wording "Discovery Lab Report" must appear on the document.** The masthead (top of page 1,
  `t("pdf.masthead")` in `engine/i18n.js`) reads `"DISCOVERY LAB REPORT - LEARNING EVIDENCE"` in
  English and `"DISCOVERY LAB REPORT - EVIDENCIA DE APRENDIZAJE"` in Spanish — note "Discovery Lab
  Report" stays in English in both, as the product's formal document-type name, exactly like a school
  wouldn't translate "IB Diploma" mid-sentence. Never revert this back to a generic "Learning
  Evidence"-only masthead, and never drop the phrase when touching the PDF layout.
- **Every page is numbered** ("Page N of TOTAL", stamped once at the end of `buildPDF()` after every
  page exists, via `doc.internal.getNumberOfPages()` — see `engine/engine.js`). A multi-page formal
  report needs this regardless of subject matter.

Judge every future PDF change against the question "would this hold up next to a lab report from a
physical school, if an online-school principal or registrar looked at it?" — student name, course,
completion date, activity ID, a stated objective, a real scientific-method structure (hypothesis,
variables, results, analysis, conclusion), raw data (the Investigation Record table), objectively
graded and teacher-graded sections with a visible rubric, and now explicit "lab report" labelling and
page numbers are the bar. If a change would weaken any of those, don't make it without flagging it
first.

**Amendment — the PDF must be a reproducible marking specification, not just a scoring summary
(agreed 2026-09-17, non-negotiable).** Diego: a rubric row that only states a mark ceiling ("Scientific
reasoning: 3 marks") doesn't tell the marker what evidence earns each mark — the marker should never
have to invent the mark scheme from the wording of the question. This applies to every constructed
response (Explain, Apply) on every activity, current and future.

- **Every constructed response's `config` needs a `markingScheme` array, not a flat `expectedPoints`
  list.** One entry per available mark: `marks` (usually 1), `criterion` (the specific, assessable
  thing that earns it — not a vague theme), `accept` (acceptable alternative/equivalent wording, so a
  marker never requires exact keywords when the scientific meaning is clear), `insufficient` (a common
  response that looks right but doesn't earn the mark, where useful), and `dependsOn` (the 0-based
  index of another point in the same array that must also be met, or omit it if the point is
  independent). `maxMarks` must equal the sum of `markingScheme[].marks`. `expectedPoints` still works
  as a fallback for activities not yet migrated (`wrapConstructed()` in `engine/engine.js`) — this is
  backlog, not a blocker, for anything built before this amendment, same status as the bilingual
  `config.es` backlog above — but every new activity gets `markingScheme` from the start, no
  exceptions. See `_template/config.json`'s `explain`/`apply` for the pattern, and
  `sim-mission-blue-planet` for the reference activity (rebuilt against this amendment).
- **Every non-auto rubric criterion needs an explicit `source` string**, stating in plain English
  exactly which question's marks it equals (e.g. `"= the Explain question's 3-point marking scheme
  above, one-to-one. Do not award these marks a second time here."`) or, if scored holistically across
  more than one answer, saying so explicitly and stating that it never overlaps with other criteria's
  marks. This is what stops the exact failure Diego flagged: a written question given, say, 6 available
  marks while separate rubric criteria simultaneously total 8, with no stated relationship between the
  two systems. Every mark in the final total must have one clear, named source — auto-marked, a named
  question's marking scheme, or an explicitly-scoped holistic criterion — never an unexplained
  duplicate or an orphaned total that doesn't add up. `engine.js` renders `source` both in the on-page
  "How this is marked" card and in the PDF's rubric table (`buildEvidence`/`drawRubric`).
  `markingInstructions` must also spell out this relationship in prose (see `_template/config.json`'s
  and `sim-mission-blue-planet`'s for the wording pattern), not just rely on the reader inferring it
  from the two structures matching.
  **PDF layout**: the constructed-responses section (`buildPDF`'s written-answers block) prints, per
  question: the student's actual response (labelled distinctly as evidence, never blended with marking
  rules), then every marking-scheme point with its mark value, criterion, accept/insufficient wording
  and any dependency, then a blank "Marks awarded: ____ / max" line — never just a bare "Teacher: ___ /
  max marks" line with no guidance, which is the old behaviour this amendment replaces.
- **Raw evidence, not a reduced label.** Where a simulation can observe something continuously or with
  more granularity than a simple pass/fail (an egg floating progressively higher, not just "Floats" —
  Diego's own example), log and export the graded reading (e.g. a percentage, a measurement) as its own
  Investigation Record column, in addition to or instead of any binary summary, so a marker can verify
  a specific claim in the student's writing against real per-trial data — not just trust the student's
  prose description of what they saw. `sim-mission-blue-planet`'s `buoyancy` column (percentage of the
  egg's own height above the surface, or "resting on the tank floor") is the reference pattern; find and
  fix any other activity that reduces a genuinely continuous observation to a bare label like this when
  next touching that activity.
- **Judge every future written-question or rubric change against this question:** could a teacher or an
  AI marker, reading only the PDF and never opening the simulation, award the same mark as another
  marker doing the same, using only the evidence and rules on the page? If the rule is "use your
  judgement" where a specific, assessable point could instead be named, that is a policy miss.

**Amendment — analytic mark scheme vs. performance rubric are two different tools; never blur them,
and this whole spec is subject-agnostic (extended 2026-09-18, whole-library audit, still
non-negotiable).** Diego, after the Mission: Blue Planet fix: apply the same standard to every
existing simulation, not just the one that prompted it, and make it permanent for every future one.
This extends the amendment above — same schema, same engine — with the parts that were still implicit:

- **Mark scheme vs. rubric are not interchangeable labels.** Use an **analytic mark scheme**
  (`markingScheme`, point-by-point) for anything with specific knowledge/reasoning/evidence points that
  can be individually identified and awarded — this is what Explain/Apply questions need. Use a
  **performance rubric** (`levels`, one descriptor per mark value) only for genuinely holistic
  qualities — communication, evaluation, quality of argument, practical technique — where the
  performance can't be cleanly split into independent named points. Never call a bare list of ceiling
  descriptions ("3 marks: good reasoning") a "rubric" — that is neither tool, just an unmarked total.
- **A holistic criterion's `levels` array must be complete, every time — 0 through max, no gaps, no
  exceptions.** A 0-2 criterion defines 0, 1 and 2; a 0-3 criterion defines 0, 1, 2 and 3. This was
  already the rule from the 2026-09-08 level-descriptors amendment above; treat any existing criterion
  missing a level as being in the same non-compliant state as one missing `levels` entirely.
  Communication-type descriptors should read like: *0 — too unclear/incomplete for the reasoning to be
  followed reliably; 1 — main meaning understandable, but organisation/precision/vocabulary has
  problems; 2 — clear and logical, appropriate subject vocabulary, precise enough to follow easily.*
  Spelling/grammar should only cost a communication mark when it actually harms clarity or meaning —
  never penalise minor language slips on their own when the scientific/academic communication is still
  clear. Adapt the same three-tier shape to whatever the criterion actually measures in each subject.
- **Auto-marked and teacher-marked stay visibly separate everywhere** — this was already true
  (`pdf.kc-auto` vs `pdf.written-answers` are already distinct PDF sections with the auto section
  showing awarded/available marks inline and the written section showing the full marking scheme) —
  treat any future PDF change that blurs this distinction as a regression, not a redesign.
- **This whole structure is deliberately subject-agnostic, not a Marine Science special case.** Every
  field (`markingScheme[].marks/criterion/accept/insufficient/dependsOn`, rubric `criteria[].source`,
  `levels`) is generic data the shared engine renders the same way regardless of subject — a Spanish
  vocabulary activity's "two distinct reasons" question and a Biology activity's causal-chain question
  use the exact same schema, just different words in `criterion`/`accept`. Never special-case rendering
  logic in `engine.js` for a specific subject or activity; if a new kind of assessed question doesn't
  fit the schema, extend the schema (and this section), not the PDF code for one activity.
- **Never truncate assessment evidence in the PDF.** `drawTrials()` in `engine/engine.js` used to
  `.slice(0, 16)`/`.slice(0, 18)` header and cell text — a genuine bug against this standard, fixed
  2026-09-18 to wrap every header and cell with `splitTextToSize` and grow row height to fit, with the
  header re-drawn on a fresh page when a table breaks across pages. If a future change to `drawTrials`
  or any other PDF table reintroduces a fixed-character cutoff on evidence text, that is a regression a
  reviewer should catch on sight.
- **Question wording and marking scheme must assess the literal same thing.** If a question asks for
  "two reasons," the marking scheme must state what counts as two *genuinely distinct* reasons, not
  silently split one causal chain (fact → mechanism → conclusion) into two "reasons" plus a bolted-on
  third point. Prefer scoring a causal chain as points along the chain (e.g. 1 mark comparison, 1 mark
  mechanism, 1 mark application of the mechanism to the specific question asked) over forcing an
  artificial two-reasons frame onto content that is really one chain — see
  `sim-mission-blue-planet`'s Apply question for the corrected pattern.
- **Prefer marks that require the student's own investigation evidence over recall-only marks** where
  the question is investigative — phrase the relevant `markingScheme` point so a generic, sim-free
  answer can't earn it (e.g. "quotes at least two of the student's own logged trials," not just "states
  the trend"). This is what makes the exported evidence prove the activity was actually done, not just
  that the student already knew the fact.
- **Authoring requirement, going forward — an activity is not complete without these fields defined at
  design time, not bolted on after.** When building a new teacher-marked question (Explain, Apply, or
  any future constructed-response stage), design the `markingScheme` alongside the question itself,
  the same discipline already required for `learningFocus` and `orient.successCriteria`: what is being
  assessed, how many marks, what earns each one, acceptable equivalents, an insufficient-response
  example where it helps, any dependency between points, which rubric criterion the marks feed into
  (`source`), and what raw simulation evidence (trial data, not just a summary) needs to be exported to
  verify it. Do not build the activity first and patch in a rubric afterward.
- **Pre-publish QC test, added to the existing "flip status to live only once activity.html actually
  works" step in Section 11:** before flipping a simulation to `"live"`, generate its PDF (as done for
  every other QA pass) and ask: *could a competent teacher who has never seen this simulation mark the
  student's work accurately and consistently using only this PDF?* If the answer is no — a question's
  intent is inferable but not stated, a total doesn't add up, evidence needed for marking was reduced to
  a label, or a table cut off a value — the marking spec or evidence export is incomplete, not just
  imperfect, and blocks going live the same way a missing `learningFocus` would.
- **Whole-library audit status (2026-09-18):** every existing simulation was migrated to this schema in
  one pass — `markingScheme` replacing `expectedPoints`, `source` added to every non-auto rubric
  criterion, question/scheme alignment checked, and any reduced-to-a-label evidence field promoted to a
  real Investigation Record column — see each activity's own `config.json`/`activity.html` and bumped
  `activity_version` for the specifics. Any activity still showing `expectedPoints` in its `config.json`
  after this date has regressed or was added incorrectly; treat it as a bug, not a style choice.
  **Superseded by the split below (2026-09-18, same day):** `markingScheme` itself has since moved out
  of `config.json` entirely into a new marker-only `marking.json` — see the amendment immediately below.
  Anything here about `markingScheme` living in `config.json` is history, not current state.

**Amendment — split config.json (public) from marking.json (marker-only); Formative vs. Assessed Mode;
client-side best-effort, not real security (agreed 2026-09-18, whole-library migration, non-negotiable).**
Diego: every simulation PDF must work as a complete marking document for the teacher, while a student
must never be able to access the analytic marking scheme, acceptable alternatives, insufficient-response
examples, mark dependencies or content-specific rubric descriptors before they submit — and this must
not rely on merely not-rendering that data, since anything shipped to the browser (config.json, network
traffic, JS, localStorage) must be assumed readable by a technically curious student. This was discussed
in depth: **true** non-delivery before submission needs a real server that only releases marker-only data
after recording an authentic submission — a server this project deliberately does not have (Section 7's
"nothing ever leaves the browser" is a foundational, disclosed design choice, with Primary Enrichment as
the one existing exception). Diego chose the client-side best-effort path for now, real backend-enforced
security deferred as a separate future decision. **This is documented honestly here — never describe
anything below as securely preventing a determined student from finding marker-only data.**

- **Two files per activity, from now on: `config.json` (public, student-facing) and `marking.json`
  (marker-only).** `config.json` may NEVER contain `markingScheme`, `expectedPoints`, `accept`,
  `insufficient`, `dependsOn`, rubric `levels`, rubric `source`, or `markingInstructions` — full stop,
  for every activity, formative or assessed. Those fields live ONLY in the sibling `marking.json`, which
  `engine/engine.js`'s `fetchMarking()` fetches lazily — **never on page load, only at the moment a
  teacher/marker PDF is actually built** (`generateTeacherPDF()`). `marking.json` is English-only, never
  translated (same standing as the old `markingInstructions`/`expectedPoints` rule), and is matched back
  to `config.json` by `activityId`/rubric criterion `key`. See `_template/config.json` +
  `_template/marking.json` for the canonical pattern, and `sim-mission-blue-planet` for the reference
  migration.
- **Student-facing rubric is now generic by construction, not by data hygiene alone.** Every non-auto
  rubric criterion in `config.json` needs a `studentHint` — a short, generic, non-content-revealing
  statement of the assessed skill (e.g. *"Use evidence clearly from your own investigation to support
  your answer,"* never *"identify higher salinity, explain increased density, link this to buoyant
  force..."* — that sentence belongs only in `marking.json`'s `levels`). `engine.js`'s on-page "How this
  is marked" card (`buildEvidence`) and the safe rendering path deliberately **never read `levels` or
  `source` at all**, even if a config accidentally still carried them — this is a code-level refusal, not
  just a documentation rule, precisely so a future mistake in a `config.json` can't leak content through
  the UI. Constructed-response questions (Explain/Apply) get an analogous `skillFocus` field — a short,
  safe line like *"Apply what you found to a new situation and give clear, well-explained reasons"* —
  shown right under the question, never the per-point `markingScheme`.
- **Formative Mode (default — omit `assessmentMode`, or set it to `"formative"`).** Practice work, this
  project's normal 1:1-tutoring case. Behaviour is otherwise unchanged from before this amendment: the
  student clicks one "Generate Learning Evidence" button and gets ONE combined PDF (their evidence +
  the full marking specification), because this project has no separate teacher portal — the tutor marks
  from the exact file the student uploads to Learning Lab. What changed is only *where the marking data
  comes from* (a lazy fetch of `marking.json` at generate-time, not `config.json` at page-load) and that
  the on-page rubric card was never leaking content anyway. No locking, no split PDFs, no `?teacher=1` —
  none of that machinery applies here, by design, since a single tutoring student generating their own
  complete evidence file the moment they finish is not the scenario this amendment is defending against.
- **Assessed Mode (`"assessmentMode": "assessed"` in `config.json`) — for graded homework, tests, or any
  activity where several students might complete the same assessment at different times.** The sequence:
  student finishes → clicks **Final Submit** (a confirm dialog states answers will be locked) →
  `state.locked = true` and `state.submittedAt` are recorded → `sim.recordTrial`/`clearTrials`/
  `resetInvestigation`/`setResult`/`setScienceMethod`/`mark` all become no-ops (the one central
  enforcement point every activity's own Investigate code gets for free, no per-activity change needed)
  → Predict/Explain/Apply/Check inputs are disabled and a "submitted, locked" banner is shown on those
  stages → the student automatically gets ONLY a **submission receipt** PDF (`buildStudentPDF` —
  their own answers/evidence + a confirmation + timestamp, explicitly masthead'd "SUBMISSION RECEIPT",
  never "REPORT", and never fetches `marking.json` at all). The complete **teacher marking PDF**
  (`buildPDF`, unchanged full format) is a SEPARATE action, only shown when the page is opened with
  `?teacher=1` in the URL — a convenience gate for Diego's own use during or after a 1:1 session (e.g. he
  clicks it himself, screen-sharing or reviewing the device afterward), explicitly **not security**: the
  file is still a plain fetchable static file, `?teacher=1` just keeps it out of the default flow so a
  student doesn't casually stumble into generating and forwarding the full mark scheme to classmates who
  haven't submitted yet. This directly addresses Diego's "one student shares the answer key with the
  class" concern for the common case, without pretending to stop a determined student.
- **What this does NOT achieve, stated plainly for anyone reading this later:** a technically curious
  student can still fetch `marking.json` directly by URL at any time (before, during or after the
  activity) since GitHub Pages has no server logic to gate it by submission status; `?teacher=1` is a
  discoverable URL parameter, not an authentication check; and `state.locked` lives in the student's own
  `localStorage`, so clearing site data resets it. None of this is exam-grade security. If Discovery Lab
  is ever used for a genuine, must-be-secure examination, that requires the real-backend approach
  (marker-only data held server-side, released only after an authenticated, server-recorded submission)
  discussed and explicitly deferred in this amendment — do not build ad hoc client-side workarounds
  toward that goal; escalate it as its own decision when it's actually needed.
- **Existing-activity default:** no currently-live activity sets `assessmentMode: "assessed"` — every one
  of the 15 migrated stays on Formative Mode (matching real current usage: 1:1 tutoring practice, not
  graded tests). The toggle exists and is fully wired in the engine for whenever Diego actually wants to
  run something as graded.
- **Whole-library migration status (2026-09-18):** every activity's `config.json` had `markingScheme`/
  `accept`/`insufficient`/`dependsOn`/rubric `levels`/rubric `source`/`markingInstructions` moved into a
  new sibling `marking.json`, and every non-auto rubric criterion gained a safe `studentHint`. Any
  activity whose `config.json` still contains any of those marker-only fields after this date has
  regressed; treat it as a bug on sight, the same status as a missing `learningFocus`.

**Amendment — SUPER-CRITICAL, RELEASE-BLOCKING: question, analytic mark scheme, rubric descriptors and
final scoring structure must all describe the literal same assessment (agreed 2026-09-18, whole-library
audit, permanent standing rule).** Diego found the Marine Science Apply question asking for "TWO
reasons" while the `markingScheme` actually rewarded three linked scientific steps (compare salinity →
density mechanism → buoyancy/effort consequence) — a real mismatch between what the student was asked
to do and what was marked. This is now a permanent, super-critical rule, not a one-off fix, and it never
needs to be re-explained in a future chat.

- **The question shown to the student must directly match what the mark scheme rewards.** Never reward
  content the question did not reasonably ask for, and never ask for one kind of thinking (e.g. "give two
  reasons") while marking a different one (e.g. three linked steps of a single causal chain). If the mark
  scheme rewards *explanation*, the question must ask the student to explain. If it rewards *evaluation*,
  the question must ask for a judgement supported by evidence. If it rewards *comparison*, the question
  must clearly ask for a comparison. If full marks genuinely need three linked steps, the question's
  wording should make that expectation reasonable and clear — **without revealing the answer** (state the
  required moves — e.g. "compare X, then explain the effect of Y on Z" — never the specific content that
  earns each mark; that stays in `marking.json`).
  **Reference fix:** `sim-mission-blue-planet`'s Apply question was rewritten from "give TWO reasons" to
  *"Explain why a tourist floats much more easily in the Dead Sea than in ordinary ocean water. In your
  answer, compare salinity and explain the effect of density on buoyancy,"* with a matching 3-point
  `markingScheme` (1: compares salinity of the two seas; 1: explains higher salinity → higher density;
  1: explains higher density → greater buoyant force → less swimming effort). Use this as the template
  for any similar chain-forced-into-two-reasons mismatch found elsewhere.
- **Rubric level descriptors must always restate the exact same analytic points as the mark scheme —
  never a different route to the same score, never an extra requirement introduced only in the rubric,
  never an analytic point silently dropped from the summary.** If the 3-point `markingScheme` for a
  question is (1) evidence, (2) mechanism, (3) judgement, the criterion's `levels` array must describe
  those same three things at every band — 0 (none achieved), 1 (any one achieved), 2 (any two achieved),
  3 (all three achieved) — not a vaguer or different-sounding holistic paraphrase that happens to land on
  the same mark values. **Reference fix:** `sim-mission-blue-planet`'s `use_of_evidence` and `reasoning`
  criteria in `marking.json` were rewritten so every level (0-3) explicitly names all three analytic
  points from the matching `markingScheme`, e.g. level 3: *"Uses relevant low- and high-salinity evidence
  from their own investigation, explains the density/buoyancy mechanism correctly, and states whether the
  hypothesis was supported using that evidence — all three analytic points present."* Mirror this
  "0/1/2/3 of N points achieved" shape for any criterion whose rubric levels were written before this
  amendment and don't already visibly restate the full mark scheme.
- **The final test, to be applied to every teacher-marked question on every simulation, existing or
  new:** *if a teacher reads only the student-facing question and then reads the marking scheme, do the
  marks reward exactly what the student was asked to do — no more, no less?* If the answer is not clearly
  yes, the assessment is not release-ready — fix the question wording, the `markingScheme`, or the rubric
  `levels` (whichever is actually wrong) before the activity goes live. This sits alongside, and is
  checked at the same time as, the existing pre-publish QC test above ("could a teacher mark this from
  the PDF alone?") — a simulation must pass both, not just one.
- **This is now a required step in the authoring workflow (Section 11), not optional polish.** When
  designing a new teacher-marked question, write the question wording, the `markingScheme`, and the
  rubric `levels` together, as one unit, and explicitly check they describe the same assessment before
  moving on — the same discipline already required for `learningFocus`/`orient.successCriteria`/
  `assessmentMode`. A simulation is not assessment-ready if its student question, analytic mark scheme,
  rubric descriptors, mark-source mapping and final scoring structure don't all describe the same
  assessment — treat a mismatch found at this stage exactly like a missing `learningFocus`: it blocks
  going live.
- **Whole-library audit status (2026-09-18):** every existing simulation's Explain/Apply question wording
  was checked against its `markingScheme` and rubric `levels` for this exact mismatch and corrected where
  found, alongside `sim-mission-blue-planet`'s reference fix above.

**Consolidated evidence-generation standard — release-blocking checklist (agreed 2026-09-18).** The
rules above and elsewhere in this section add up to one standard, established piece by piece across
several amendments. This checklist exists so a future session (or Diego) can verify compliance in one
place instead of piecing it together from prose written on different days. Every point below is
already normative elsewhere in this file — this section adds no new rule, it only indexes them. A
simulation is not release-ready, existing or new, unless **all** of the following are true:

1. **The teacher/marker PDF is self-contained enough to mark without opening the simulation.** Test:
   *"could a competent teacher who has never seen this simulation mark the student's work accurately
   and consistently using only this PDF?"* — the original pre-publish QC test, above.
2. **In Assessed Mode, the student receipt and the teacher/marker PDF stay two separate documents.**
   The receipt (`buildStudentPDF`) never carries `markingScheme`/rubric `levels`/`source`; only the
   separate, `?teacher=1`-gated teacher PDF (`buildPDF`) does — see the config.json/marking.json split
   amendment, above.
3. **Student-facing guidance never reveals detailed, answer-bearing marking criteria before
   submission.** Every non-auto rubric criterion shows only a generic `studentHint` in `config.json`;
   the analytic `markingScheme` (with its `accept`/`insufficient`/`dependsOn`) and the rubric's
   content-specific `levels`/`source` live only in `marking.json` — see the same split amendment.
4. **Every holistic criterion defines every available mark level**, 0 through its max, with no gaps —
   see the level-descriptors amendment (2026-09-08) and its 2026-09-18 reinforcement, above.
5. **Every mark has one clear, named source and is never double-counted.** Every non-auto rubric
   criterion's `source` states in plain English exactly which question's marks it equals one-to-one, or
   that it is scored holistically and never overlaps other criteria's marks — see the `source` amendment
   (2026-09-17/18), above.
6. **All evidence needed for marking is exported in full and never truncated.** No PDF table (trial
   data, evidence values, written answers) may cut text off with a fixed-character limit — wrap it
   instead, as `drawTrials()` now does — see the "never truncate" amendment, above.
7. **Minor spelling, punctuation or grammar errors only cost a Communication mark when they actually
   interfere with meaning or clarity** — never penalise a language slip on its own when the
   scientific/academic communication is still clear. Already stated in the level-descriptors
   reinforcement (2026-09-18), above; restated here because it is easy to miss inside that paragraph.
8. **The question, its `markingScheme`, and its rubric `levels` all describe the literal same
   assessment** — no extra requirement introduced only in the rubric, no analytic point dropped from
   the summary descriptor, no mark awarded for something the question didn't reasonably ask for. Test:
   *"if a teacher reads the question and then the marking scheme, do the marks reward exactly what the
   student was asked to do?"* — the alignment amendment, immediately above.
9. **This standard applies to every existing simulation and every new simulation created from now
   on** — not a one-off fix to whichever activity prompted it. Confirmed by the whole-library audits
   recorded against each amendment above; a newly built activity must be checked against every point
   in this list before its `status` flips to `"live"` (Section 11), the same standing as a missing
   `learningFocus`.

**Amendment — no JSON download (agreed 2026-09-09).** The engine builds a structured JSON payload internally (see `buildPayload()` in `engine/engine.js`) purely as the data model it renders the PDF from — it is never written to a file or offered as a second download. The reasoning: the PDF and JSON download to the student's own device (per Section 7, nothing leaves the browser), and the only file Diego actually receives back is the PDF a student chooses to upload to Learning Lab — the JSON companion file was an extra download that only ever reached the student, never the teacher, so a proper rubric with level descriptors belongs printed in the PDF itself (see the level-descriptors amendment below), not off in a file only the student can see. `generateEvidence()` calls `downloadBlob()` once, for the PDF only. The internal payload shape below is retained as documentation of what the PDF is built from — it is not a file format a student or teacher ever sees:

```json
{
  "activity_id": "ENV-M01-SIM02",
  "activity_version": "1.4",
  "attempt_id": "unique-id",
  "student": "name",
  "course": "Environmental Science",
  "pathway": "US Pathway",
  "module": 1,
  "activity_name": "pH Investigation",
  "simulation_url": "https://.../sim-1-ph-investigation/activity.html",
  "started": "2026-09-01T14:03:00",
  "completed": "2026-09-01T14:17:00",
  "simulation_results": { "samples_tested": 10, "data": ["..."] },
  "interaction_evidence": {
    "tests_performed": 13,
    "prediction_recorded_before_testing": true,
    "prediction_revised": true,
    "mystery_sample_attempted": true
  },
  "auto_marked": [
    { "question": "...", "student_answer": "...", "correct": true }
  ],
  "auto_marked_score": "4/4",
  "constructed_responses": [
    {
      "question": "Explain how your evidence supports your conclusion.",
      "response": "student's written answer",
      "marking_context": {
        "max_marks": 3,
        "expected_points": ["point one", "point two", "point three"]
      }
    }
  ],
  "rubric": { "knowledge_accuracy": 4, "use_of_evidence": 3, "reasoning": 2, "communication": 1, "total": 10 },
  "marking_instructions": "Mark the constructed responses using the rubric and expected points above. Accept scientifically valid alternative wording. Do not penalise spelling unless meaning is unclear. Return: total score, score by criterion, one strength, one correction, one next step. Keep feedback under 80 words."
}
```

**Visible rubric**: display the rubric criteria (not the hidden `expected_points`) at the bottom of the activity page itself, so the student can see how they're assessed before submitting. Keep `expected_points` and any auto-marked answer keys out of the visible interface — they exist only in the JSON/underlying code for marking.

**Amendment — level descriptors, not just a ceiling score (agreed 2026-09-08).** A rubric row that only states what full marks looks like doesn't tell the student what a 1, 2, or 3 out of 4 looks like, and doesn't tell the marker (human or AI) what to look for at each band — so every non-`auto` rubric criterion must carry a `levels` array: one entry per mark value from 0 up to `max` (`{ "marks": n, "descriptor": "..." }`), spelling out exactly what earns that score. `auto` criteria (Knowledge Check) don't need `levels` since the engine grades them directly. The engine renders these as a bulleted breakdown under each criterion, both in the on-page "How this is marked" card and in the evidence PDF's rubric section (`engine/engine.js`'s `buildEvidence` and `drawRubric`) — a criterion without `levels` still falls back to its old single `descriptor` line, so this is additive, not a breaking schema change. `_template/config.json`'s rubric is the worked example (3-4 mark bands with real descriptors); mirror the `es` block's `levels` by position, same as `rubric.criteria` itself. New activities must supply `levels` on every non-auto criterion — a single ceiling `descriptor` with no bands is now a policy miss, same status as a missing `learningFocus`.

**Honesty about security**: these are formative, low-stakes activities, not secure exams. Because everything runs client-side, a technically curious student could inspect the page source and find hidden answers. Never design around or claim that client-side answer keys are secure — that's simply not true, and the spec shouldn't pretend otherwise.

---

## 6. Accessibility and inclusive design — build into the shared engine, not per-activity

Because this is built once at the engine level, do this properly now rather than retrofitting it after dozens of activities exist. The shared engine must support:

- Full keyboard navigation (no interaction that requires only a mouse/touch)
- Labelled form controls and sufficient color contrast throughout
- No interaction or meaning that depends solely on color
- Adjustable text size and a dyslexia-friendly font toggle
- Adjustable background tint/overlay options (supports students sensitive to bright white backgrounds or visual stress)
- A "reduced motion" toggle that turns off non-essential animation
- No flashing or strobing content anywhere (hard rule — full stop)
- Optional text-to-speech for instructions and questions, using the browser's built-in speech synthesis (free, client-side, no server needed)
- Responsive layout that works on laptop, Chromebook, and tablet
- Instructions broken into short, clearly sequenced steps rather than dense paragraphs
- Adjustable pacing — no interaction that penalizes a student for taking their time, and clear visible progress so a student always knows what's next
- A non-simulation fallback or simplified path where a given interaction (e.g. fine drag-and-drop) would be hard for a student with limited motor precision

Put these controls in a small, unobtrusive settings panel (`engine/accessibility.js`) that appears identically on every activity, so a student sets their preferences once per device rather than per activity.

**Hard rule — anything that can make sound must be silenceable with a button reachable at the point
of use, not just from the accessibility panel (agreed 2026-09-18).** Diego, after finding no way to
stop a bonus game's audio mid-play: "ensure all things that make sounds can be silenced with a
button." Read-aloud (browser speech synthesis) is the only thing on this site that ever makes sound —
muting it IS muting everything. `engine/accessibility.js` exports `setTTS(on)` for exactly this: any
module that could make sound imports it and shows its own always-visible mute toggle, right in its own
UI, rather than requiring the student to find and open the separate accessibility panel. Both
`engine/arcade.js` and `engine/quest3d.js` do this (`.arcade__mute` / `.quest__mute` in each game's
foot row) — copy this pattern for any future sound-capable feature. The accessibility panel's own
"read aloud" checkbox stays in sync automatically (it rebuilds from current prefs every time it
opens), so muting from a game and muting from the panel are always the same one switch.

---

## 7. Data and privacy

Student names, answers, and results **never leave the browser** — no server, no database, no data sent to GitHub. Everything happens client-side: the simulation runs in the browser, JavaScript grades the objective questions, JavaScript generates the PDF/JSON. GitHub hosts the learning experience only; the school's LMS is the system of record for student evidence, via the PDF the student uploads there themselves.

Autosave activity progress locally (so a refresh doesn't lose work), but store the minimum needed — no email addresses, no school IDs, no unnecessary personal information. Provide a clearly visible "Clear saved work" option after the evidence has been exported.

**Amendment — Primary Enrichment class records (agreed 2026-09-07 — the one disclosed exception to "never leave the browser").** Every Primary Enrichment activity (`primary/primary-enrichment/`) already sends a first name and a live score to Firebase for the shared live leaderboard during the session (Section 3's sibling live-session format). As of this amendment, when a student reaches the activity's final "done" screen, its first name, activity, score, max score and percentage are additionally written to a permanent `enrichment-history` archive via `recordCompletion()` in `_shared/live-wall.js`, so Diego can review class results afterward at the hidden `primary/primary-enrichment/admin/` page. This is deliberate and disclosed — every Primary Enrichment activity's footer says so explicitly — and stays scoped to Primary Enrichment only; every other course on the site keeps the original "never stored anywhere" behaviour unchanged. Read access to `enrichment-history` is restricted by the database's Security Rules to Diego's own signed-in account (Firebase Auth, email/password); writes stay open so a student's browser never needs to sign in to record its own result. A new Primary Enrichment activity should call `recordCompletion(track, {...})` once when it reaches its done stage and update its footer text to match the disclosure above — see `sim-probability-dice-lab` or `sim-cause-and-effect` for the pattern.

**Amendment — automatic Google Drive sync (agreed 2026-09-08).** The admin page also mirrors `enrichment-history` into a "Discovery Lab" folder in Diego's own Google Drive, automatically, whenever he has the admin page open — see `_shared/drive-sync.js` and `_shared/google-drive-config.js` (same fill-in-the-config pattern as `firebase-config.js`). This is the **one disclosed exception to "everything vendored, no CDN"** (Section 10's engineering decisions): Google Identity Services' OAuth script (`https://accounts.google.com/gsi/client`) only works loaded live from Google's own origin — it cannot be vendored — and is loaded only on this one hidden, unlinked, `robots.txt`-disallowed admin page, never on any student-facing page. The requested scope is `drive.file` (this app can only ever see files it created itself, nothing else already in Diego's Drive).

---

## 8. Amendment workflow (how we'll keep improving this together)

After an activity is live, I'll sometimes send you its link plus feedback a student gave me (e.g. "add a mystery sample at the end," "make the graph interactive"). Because content lives in that activity's own folder, these changes should be isolated — edit that activity's files, bump its `activity_version`, commit, done. The shared engine and every other activity should be unaffected. Same applies to tweaking a rubric, renaming a module, or adjusting a question — small, targeted commits, not full rebuilds.

---

## 9. What to do first

1. Confirm what GitHub access you actually have and flag anything missing (see Section 0).
2. Scaffold the repository: the folder structure above, the shared engine (`style.css`, `engine.js`, `accessibility.js`), `data/subjects.json` with the pathways/subjects I'll confirm, and a home page with subject tiles (placeholders marked "coming soon" are fine for anything not built yet).
3. Build **one reference implementation** end-to-end against this entire spec: the pH Investigation activity (US Pathway → Environmental Science → Module 1). This is the activity that proves the architecture works before we build anything else.
4. Deploy via GitHub Pages and confirm the live URL.
5. Then stop and wait for me — I'll review the reference implementation, we'll adjust anything that isn't right, and only then start sending you new topics/slides one at a time.

Do not build additional activities beyond the one reference implementation until I've reviewed it.

---

## 10. Confirmed decisions (agreed 2026-09-02 — supersedes anything above that conflicts)

**Project name:** Discovery Lab. Repo `discovery-lab`, public, GitHub Pages.
The school's own LMS is called *Learning Lab* (CGA School). Discovery Lab is deliberately a
sibling name, not a copy: Learning Lab is where work is **submitted**, Discovery Lab is where
work is **done**. Never brand this site "Learning Lab".

**Site structure** (confirmed 2026-09-02, replacing the example structure in Section 2).
`data/subjects.json` holds ONE recursive tree. Every node has `id`, `name`, `type` and
`children`; node ids are folder names, so the URL mirrors the JSON exactly:

- **Primary** (ages 5-11) → Science · Spanish · Computer Skills
- **Secondary** (ages 11-18)
  - **US Pathway** *(US System)* → Biology · Spanish · Computer Skills
  - **A-Level Pathway** *(British System)* → Lower Secondary Stage 1 · Lower Secondary Stage 2 ·
    Pre-IG Stage 1 · Pre-IG Stage 2 · IGCSE Biology · A-Level Biology

Primary and Secondary are the two front doors on the home page; the pathway choice only
appears inside Secondary. Depth is not fixed - the renderer walks whatever tree it is given,
so a course can gain modules and simulations without any engine change.

**Environmental Science and the pH Investigation were examples in the original brief only.**
They are not part of this site. Section 9's reference implementation is superseded: the first
real activity will come from a topic Diego sends.

**Navigation is generated, never hand-written.** After editing `subjects.json`, run:

```
python tools/build-nav.py
```

That regenerates an `index.html` shell for every non-simulation node and reports folders whose
node has been removed from the tree (it never deletes anything itself, because activity folders
share those directories).

**Amendments to Section 3 — question budget.** As originally written the counts don't close:
Predict + Explain + Apply + 3–5 Knowledge Check = 6–8 against a stated cap of 5–7, and a free-text
Predict would make three constructed responses against a stated cap of two. Resolved as:

- **Predict is always a structured response** — multiple choice, rank-order, or slider. Never prose.
  It still auto-marks as `prediction_recorded_before_testing` and `prediction_revised`.
- Knowledge Check is **3–4** items. Total marked items **6–7**. Constructed responses **exactly 2**
  (Explain, Apply).

**Amendment to Section 3 — "always different" is enforced by data, not memory.** Every simulation
entry in `subjects.json` carries a `mechanic` field drawn from the `mechanics` list at the top of
that file. Before designing a new activity, query which mechanics are already used in that module
and pick an unused one. Do not rely on recall.

**Amendment to Section 5 — export integrity.** The JSON is generated client-side and is therefore
editable by the student before it reaches the tutor. Both PDF and JSON carry a short shared
checksum so an edited pair visibly disagrees. This is **tamper-evident, not tamper-proof**, and must
never be described more strongly than that — to the student, the tutor, or in any documentation.

**Engineering decisions:**

- **No build step, no npm.** Plain ES modules. Any activity is editable by opening one file.
- **Everything vendored, nothing from a CDN** (`engine/vendor/`). School wifi filters block CDNs,
  and vendored code still works years from now when a CDN path 404s.
- **PDF via jsPDF** with a hand-written layout function. Never `window.print()`.
- **`simulation_url` is computed at runtime** from `window.location` — never hardcoded, so a custom
  domain later breaks nothing.
- **Engine assets are version-stamped** (`engine.js?v=…`). GitHub Pages caches hard and would
  otherwise serve students stale code after an amendment.
- **localStorage is keyed by `activityId` + `version`**, and saved work from an older schema is
  discarded gracefully rather than crashing the page.
- **Age band is a design token** (`data-age-band="primary|lower-secondary|secondary|advanced"`),
  not per-activity styling. It retunes type scale, density, language, and motion.
- **`_template/`** holds the known-good activity skeleton. New activities start there, never by
  copy-pasting an existing activity.

**Amendment to Section 5 — every evidence PDF carries a live link and a learning-focus intro
(default, built into the engine; agreed 2026-09-03).**

- **A clickable link to the live activity.** The PDF's top banner has an "Open the live activity ->"
  hyperlink, and the foot repeats it as a clickable "Simulation link:". Both are real jsPDF
  `textWithLink` annotations pointing at the runtime `simulation_url`, so a parent, tutor or head of
  department can open the actual simulation straight from the PDF — not just read a static record.
- **An "About this activity" section** — one high-quality paragraph plus a "Skills practised" chip
  line. It names both the **skills** developed (critical thinking, creativity, mathematical, digital
  literacy, communication, analytical, research, scientific enquiry…) and the exact **curriculum
  content** practised, tied to the named course and module, so school leadership and educators can
  see at a glance why the activity is meaningful. It comes from `config.learningFocus =
  { skills:[...], summary:"one paragraph" }`, **required in every new activity** (it is in
  `_template/config.json`). Write it so it genuinely sounds impressive and is accurate — never
  generic. It also rides in the JSON export as `learning_focus`.

**Amendment to Sections 2 & 11 — navigation snapshots (default, nav-level; agreed 2026-09-03).**

- **Keyword snapshots.** Any node in `subjects.json` may carry a `keywords` array (3–5 short terms).
  They render as chips on that node's tile, so opening a course shows at a glance what each term or
  module contains. Add and extend these as a course fills out over time.
- **Simulation thumbnails.** A `simulation` node may carry `thumbnail` (a filename inside the
  activity folder, e.g. `"thumbnail.gif"`). It renders as a moving preview at the top of the tile:
  a short, **seamlessly looping** GIF of the activity's most eye-catching moment (for the Seed
  Germination Lab, the rotating 3D germination chamber). Generate it with the capture tool rather
  than by hand:

  ```
  python tools/make-thumbnail.py           # starts the capture + encode server on :8777
  # then open in any browser (the in-app browser is fine):
  # http://localhost:8777/tools/capture/<harness>.html?out=<path-to>/thumbnail.gif
  ```

  The harness renders the real 3D scene and orbits the camera a full 360° (last frame meets the
  first, no seam); Pillow encodes the loop and writes the GIF to the activity folder. Copy
  `tools/capture/germinator.html` as the pattern for a new activity's own scene. Keep thumbnails a
  few hundred KB. Only the finished GIF is committed (`tools/capture/_frames/` is git-ignored).

**Commit identity:** Diego Urrutia Guevara <duguevara@gmail.com>

**Still to confirm:** logo asset and the PDF footer line (currently placeholder).

---

## 11. How Diego requests a new simulation

**One new chat per simulation**, opened at the `discovery-lab` folder so this file loads
automatically. He will not repeat the architecture — it is all here.

What he sends is deliberately minimal: a slide screenshot, a PowerPoint file, or one line
("photosynthesis limiting factors, Pre-IG Stage 2"). **Design everything else yourself** —
the mission, the mechanic, the questions, the real-life hook, the rubric. Do not ask him to
spec it. Ask only if the course or age band is genuinely ambiguous.

**Steps for a new activity:**

1. Read `data/subjects.json`. Find the course node he named.
2. Check the `mechanic` of every existing simulation in that course. **Pick one not yet used
   there** — the `mechanics` list at the top of that file is the menu. This is the "always
   different" rule, and it is a lookup, not a memory.
3. If the course has no suitable module yet, create one. He does not need to name modules;
   infer a sensible one from the topic and tell him what you created.
4. Add the module and simulation entries to `subjects.json`, including `mechanic`, `ageBand`,
   `version`, `questionCount`, `minutes`, `thumbnail: "thumbnail.gif"`, and `status: "coming-soon"`.
   Give the term/module a `keywords` snapshot (3–5 terms) if it does not have one yet.
5. Build the activity in its own folder: `activity.html` + `config.json` + `marking.json`. Start from
   `_template/` (which now has all three). `config.json` is public/student-facing — never put
   `markingScheme`/`accept`/`insufficient`/`dependsOn`/rubric `levels`/rubric `source`/
   `markingInstructions` there. That marker-only data goes in `marking.json` instead (see Section 5's
   assessment-security amendment). Write its `learningFocus` (skills + one strong paragraph) — it is
   required. **Never edit the shared engine for a content change.** Include a bonus round — check which genre
   (arcade via `engine/arcade.js`, or realistic 3D via `engine/quest3d.js`) the other simulations in
   this same course used last and build the other one (Section 4's alternation amendment — same
   lookup discipline as `mechanic` below). Reuse the activity's own real photos as the flying/placed
   items where it has them; it is optional/skippable for the student but not optional for you to
   build. If the science-method fields apply (Section 14), set
   `orient.scientificObservation`/`scientificQuestion` in config so the method chip strip renders.
6. Generate the looping `thumbnail.gif` with `tools/make-thumbnail.py` (see Section 10) — a
   seamless orbit of the activity's most striking moment.
7. Flip that simulation's `status` to `"live"` only once `activity.html` actually works.
8. Run `python tools/build-nav.py`.
9. Commit, push, verify the live URL, and give him the direct link to the activity.

**For amendments to an existing activity** he will send its link plus feedback. Edit only that
activity's folder, bump its `activity_version`, commit, push. Nothing else should change.

---

## 12. External simulation recommendations

Any node in `subjects.json` may carry a `resources` array of third-party simulations Diego
recommends. They render below his own activities in an "Also recommended" section.

**They must stay visually and semantically distinct from Discovery Lab activities.** Dashed
border, signal colour rather than accent, `target="_blank"`, and an explicit note that they
produce no learning evidence. A student must never mistake an external link for a marked
activity.

**Entry shape:**

```json
{
  "title": "Natural Selection",
  "source": "PhET · University of Colorado",
  "url": "https://...",
  "practises": "what the student actually does — one sentence",
  "teaches": "what they take away — one sentence, aimed at the misconception",
  "added": "YYYY-MM-DD"
}
```

**When Diego sends a link:** open it in the browser and read it — PhET and similar are
JS-rendered, so WebFetch returns an empty shell. Pull the real learning goals off the page,
then write `practises` and `teaches` **pitched at that course's level**. Pre-IG Stage 1 is
roughly UK Year 9 (ages 13-14); IGCSE is 14-16; A-Level is 16-18; Primary is 5-11. The second
line should aim at the idea students usually get wrong, not restate the topic.

Never add a link without opening it first. Run `python tools/check-links.py` afterwards, and
occasionally thereafter — external links rot, and a dead link on a course page is worse than
no link at all.

---

## 13. CGA lesson policy — the Da Vinci standard (SCHOOL POLICY — mandatory for every simulation)

CGA policy for "Creating Engaging Da Vinci Lessons". This is **school policy, not a preference**:
every simulation must satisfy it. Reference image: `docs/policy/cga-da-vinci-lessons.png`.

**The eight qualities (the wheel).** Every activity must visibly deliver all eight:

- **Interactive** — the student manipulates something real, not clicks through slides.
- **Student-centered** — the student drives; the activity responds to what they do.
- **Purposeful** — every stage earns its place against the objective; no filler.
- **Responsive to student needs** — feedback adapts to the answer; accessibility panel always present.
- **Connected to course goals** — explicitly tied to the course, not free-floating content.
- **Student actively thinks** — Predict and Explain force reasoning before and after.
- **Student actively practices** — the Investigate stage is genuine practice of the skill.
- **Student actively applies skills** — the Apply stage transfers the skill to a new context.

**Clear learning objective (top banner) — REQUIRED, and it was not in the original spec.**
Every activity opens with an explicit, single learning objective. The "Orient" mission stays,
but it now sits *underneath* a stated objective — a motivating mission is not a substitute for
a clear objective.

**The Orient panel must answer all four (bottom banner):**

1. **What** they are learning (the objective, in student language)
2. **Why** it matters (the real-life hook — already required by Section 3)
3. **How** it connects to the course (name the course/module link explicitly)
4. **What success looks like** by the end — visible **success criteria**. This was NOT in the
   original spec and is now mandatory. Show 2-3 "by the end you will be able to…" statements the
   student can check themselves against before submitting.

**How this changes the fixed sequence.** The sequence is unchanged, but the opening stage is now:

**Orient (Objective · Why · Course link · Success criteria) → Predict → Investigate → Record →
Explain → Apply → Knowledge Check → Generate Learning Evidence**

The success criteria also go into the JSON export (`success_criteria` array) so the marking AI can
check the work against the same bar the student saw. Keep them plain and student-facing; they are
not the hidden `expected_points`.

**Decided 2026-09-03 — BOTH a success-criteria list AND a visible rubric.** They are not the
same thing and both are required on every activity:

- **Success criteria** = student-facing "by the end you will be able to…" statements (2-3),
  shown in the Orient panel and exported to JSON as `success_criteria`. What the student aims for.
- **Rubric** = how the marks are split, shown on the Evidence stage and exported as `rubric`.
  How the work is scored.

**Diego does NOT write the learning objective or success criteria.** Infer them from the course
level and what the content sets up for the student's later study, then write them in plain,
age-appropriate language. Config keys, all under `orient` in config.json:
`objective` (one sentence), `courseLink` (names the course/module and what it leads to),
`successCriteria` (array of 2-3 plain "you will be able to…" lines). The engine renders all three
automatically and omits any that are absent — but absent is a policy miss, so supply all three.

Pitch all four Orient answers at the activity's age band — a single sentence each for Primary,
slightly fuller for A-Level.

---

## 14. Scientific-method standard for science simulations (agreed 2026-09-07 — mandatory for every science simulation going forward)

The goal is not a simulation where students click buttons and watch outcomes. Students must
think, predict, test, record evidence, explain, evaluate and reflect — the simulation should make
the student's thinking visible. This extends the fixed sequence in Section 3 with two stages that
were missing: a hypothesis before the experiment, and evaluation/reflection after the conclusion.

**Use the scientific method as the recurring structure wherever the topic fits it:**

1. **Observation or context** — give the student something meaningful to notice first; they
   record an observation in their own words before anything is explained to them.
2. **Scientific question** — present or help the student formulate the question the investigation
   will answer.
3. **Hypothesis** — written *before* running the experiment, in "If..., then..., because..."
   form. Require a reason, not only a prediction.
4. **Prediction** — where useful, a structured (never free-text — see Section 3's Predict rule)
   forecast of what they expect to observe/measure, before interacting with the simulation.
5. **Experiment** — the student manipulates the simulation, never watches it run passively. Where
   appropriate, make explicit: independent variable, dependent variable, controlled variables,
   fair testing, repeated trials.
6. **Results** — the student collects evidence (tables, measurements, observations, graphs) —
   never handed the result automatically.
7. **Analysis** — interpret the evidence: what pattern do you see, why did this happen, what
   evidence supports your answer, how does this compare with your hypothesis, what would happen
   if a variable changed.
8. **Conclusion** — answer the original scientific question using evidence; state whether the
   evidence supported the hypothesis and why.
9. **Evaluation and reflection** — student ownership of the learning: what did you learn, how
   confident are you in your conclusion, what would make the investigation more reliable, what
   would you investigate next, what do you still find difficult.

**Updated fixed sequence for science simulations** (supersedes Section 3's sequence for science
only — other subjects keep Section 3's sequence unchanged):

**Orient (Objective · Why · Course link · Success criteria) → Observation → Question → Hypothesis
→ Prediction → Experiment → Results → Analysis → Conclusion → Evaluation/Reflection → Knowledge
Check → Generate Learning Evidence**

Do not force every topic into an artificial lab experiment. Where modelling, classification, data
interpretation, or systems thinking fits the topic better, adapt the structure but keep the same
principle: question → prediction → active investigation → evidence → analysis → conclusion →
reflection.

**Cross-cutting requirements, checked on every science simulation:**

- The student does most of the thinking and deciding — never passive clicking, scrolling, or
  watching.
- Include higher-order thinking questions, not only recall.
- Several visible checks for understanding *during* the investigation, not only at the end
  (consistent with [[discovery-lab-interactivity-density]]).
- Feedback after important responses names what was strong, what needs improvement, and what to
  think about next — not just right/wrong.
- Where practical, later questions or scaffolding adapt to the student's earlier responses.
- Age-appropriate scientific vocabulary, used consistently, so repeated use across simulations
  makes the scientific method itself familiar.

**Evidence export additions.** The PDF (Section 5) must show the student's own responses as
evidence of thinking, not a completion certificate. In addition to the existing PDF/JSON content,
include explicitly: scientific question, hypothesis, predictions, experimental choices
(independent/dependent/controlled variables where used), results/data, graphs or tables where
relevant, analysis, conclusion, and evaluation/reflection. JSON export gains a `scientific_method`
block carrying these fields (`observation`, `question`, `hypothesis`, `predictions`, `variables`,
`results`, `analysis`, `conclusion`, `reflection`) alongside the existing `success_criteria` and
`rubric`.

**Review checklist — apply this to every science simulation, existing or new:**

- Is the student investigating or merely interacting?
- Is the student producing evidence of thinking?
- Is there a clear progression from question → evidence → conclusion?
- Does the student explain *why*, not merely state *what* happened?
- Is there formative assessment throughout, not only at the end?
- Does the student finish by reflecting on their own understanding?

This is the CGA Teaching Excellence rubric's "Excellent" bar in practice: student-driven inquiry,
higher-order thinking, continuous formative feedback, and students owning their progress — it maps
directly onto Section 13's eight qualities and does not replace them.

**Amendment — the expanded 10-stage scientific-method sequence, real Observation and Question
stages, hard rule going forward (agreed 2026-09-17, corrected and finalised 2026-09-18).** Diego,
after playtesting twice: the `observation`/`question`/etc. fields above were being captured for the
evidence PDF but never actually shown to the student, then a first fix only added a decorative chip
strip alongside still-generic stage names — both rejected. **This is the final, standing structure.
It is a hard rule for every new science simulation from now on**, in every future chat, not a
one-off: "whenever I open a new chat... whenever you design new simulations, please, everything I am
saying here, keep it as part of your rules."

The stage sequence for any activity that opts in (`config.question` is present — see below) is:

**Orient → Observation → Question → Hypothesis → Experiment → Record → Explain → Apply → Check →
Evidence**

- **Orient** — unchanged, stays first.
- **Observation (new)** — a genuine activity, never a wall of text: the student explores something
  real (real photos, a diagram, a scene) and notices details for themselves, via
  `simulation.observation(host, sim)` — the same optional-hook pattern as `simulation.orient`/
  `simulation.investigate`. See `sim-vertebrate-sorting-lab` (tap-to-reveal notices on two real,
  misleading animal photos) and `sim-seed-germination-lab` (tap-to-reveal notices comparing two seed
  species) for the reference pattern: real assets the activity already has, a handful of tap-to-reveal
  "notice something" chips, no grading.
- **Question (new)** — the student actually identifies the scientific question this investigation
  answers (a multiple-choice pick among plausible and implausible questions, via `config.question` —
  engine-built generically with the same `makeQuestion` machinery as Predict, non-graded). Never a
  question the student just reads; they have to recognise/select it themselves.
- **Hypothesis** (renamed from Predict) — its own stage content is unchanged (the structured
  mc/multi/numeric/slider forecast), but **always explicitly states, at the top, that a hypothesis is
  an educated guess** (`hypothesis.lede`/`hypothesis.note` in `engine/i18n.js`, shown instead of the
  generic predict copy).
- **Experiment** (renamed from Investigate) — content unchanged; the mechanic already is the
  experiment.
- **Record, Explain, Apply, Check, Evidence — deliberately NOT renamed.** Diego was explicit: "Record
  is fine... Explain is fine. Apply is fine. Check Evidence is fine." Only Predict→Hypothesis and
  Investigate→Experiment are relabelled. (Record's own content should still surface the word
  "Result(s)" somewhere in what it shows — the auto-logged trial table already effectively is the
  results — but the stage label itself stays "Record".)

**Mechanism (`engine/engine.js`):** `BASE_STAGE_IDS` (8 stages) is the sequence every activity built
before 2026-09-18 already runs on — untouched, unchanged, forever, unless Diego asks otherwise.
`EXPANDED_STAGE_IDS` (10 stages) is the sequence above. Which one a given activity gets is decided by
`hasExpandedMethod = !!config.question` — **this is the opt-in switch**, deliberately a NEW field
distinct from the old `scientificObservation`/`scientificQuestion` presence check, precisely so
activities that already had those fields before this amendment (`sim-five-kingdoms-sorter`,
`sim-mrs-c-gren-life-scanner`, `sim-cell-structure-detective`) do **not** silently pick up the
expanded sequence — confirmed unaffected. `config.orient.scientificObservation`/`scientificQuestion`
still render visibly on the Orient stage itself regardless of which sequence is active (unchanged from
the first fix).

**For every new science simulation going forward:** set `config.question` (mc, with the real question
as one option and 2-3 plausible-but-wrong distractors) and implement `simulation.observation(host,
sim)` — both are now required, the same standing as `learningFocus` or `orient.successCriteria`. A
science simulation without them is missing a required stage, not "using the simpler version."

**Why this matters pedagogically (Diego's own framing — worth preserving):** the goal is that as
students move through many different Discovery Lab simulations over time, the same named sequence —
Observation, Question, Hypothesis, Experiment, Result, Conclusion — repeats often enough that it
"gets really integrated in their cognitive structure," so they absorb *how to think scientifically*
as a byproduct of learning each activity's actual content. This sits alongside, not in place of, the
broader skill set every simulation should build — critical thinking, creativity, digital literacy,
research and communication skills among them — and alongside Section 4's gamification, which exists
to make sure all of this happens while the student is genuinely having fun, not just being drilled.

---

## 15. Bilingual site: English/Spanish (agreed 2026-09-07 — mandatory for every simulation going forward)

The whole site — navigation, chrome, the accessibility panel, and every activity — is bilingual.
A flag switcher (🇬🇧/🇪🇸) sits in the header next to "About Mr Guevara" on every page. Choosing a
language stores it in `localStorage` (`dl-lang`, per device) and reloads. Français/中文/العربية are a
later phase (Arabic in particular needs RTL layout work first) — do not attempt them without being
asked; English/Spanish is the current standing scope.

**The mechanism — `engine/i18n.js`:**

- `t(key, vars)` — the shared UI-chrome dictionary (stage names, buttons, toasts, PDF labels,
  accessibility panel). Add new engine-level strings here in both `en` and `es`, never inline.
- `pl(node, field)` — reads `<field>_es` off a `subjects.json` node or a `resources`/`featuredGame`
  entry when Spanish is selected, falling back to the English field if the `_es` sibling is
  missing. Never required to be present — an untranslated node just renders in English.
- `localizeConfig(config, lang)` — deep-overlays an activity's `config.es` block onto its English
  `config.json` (arrays of objects with an `id` merge by id — e.g. `knowledgeCheck`, `options`;
  everything else merges by index). Engine calls this once, right after fetching `config.json`.
- Importing `i18n.js` also self-wires the flag switcher into `.site-head__inner` and shows/hides any
  `data-lang="en"`/`data-lang="es"` element to match the current choice — this is how the hand-written
  bilingual markup on `index.html` and `about/index.html` works, no extra script tag needed beyond
  the import (nav.js and engine.js already import it, so activity and nav pages get it for free).

**What this means for a NEW simulation (mandatory, not optional):**

1. In `data/subjects.json`, give the new module/simulation entry `name_es`, `blurb_es`, and
   `subtitle_es`/`keywords_es` if the node has those fields. Keep it natural, age-appropriate
   Spanish — not machine-literal.
2. In the activity's `config.json`, add a top-level `"es"` block mirroring the translatable content
   (title, subtitle, course/pathway/module labels, `learningFocus`, `orient`, `predict`,
   `investigate`, `record`, `explain`, `apply`, `knowledgeCheck`, `rubric`). Leave `expectedPoints`
   and `markingInstructions` English-only — they are never shown to the student. `_template/config.json`
   carries a stub `es` block as the pattern to copy.
3. If the activity's own JS draws custom in-canvas text (hotspot labels, quiz copy, HUD strings —
   anything the shared engine doesn't render from config), add a small local helper at the top of
   that activity's `<script>`: `import { getLang } from ".../engine/i18n.js?v=1"; const L = (en, es)
   => getLang() === "es" ? es : en;` and wrap every such string in `L("English", "Español")`. This is
   scoped per-activity — never add activity-specific strings to the shared `engine/i18n.js` dictionary.
4. If the activity's own `activity.html` hand-writes a breadcrumb (older activities do; newer ones
   should just rely on the shared header), give it the same `data-lang="en"`/`data-lang="es"` pair
   pattern used elsewhere in the file.
5. Run `python tools/build-nav.py` as usual — the generated nav shells are already bilingual.

**Reference implementation:** `primary/computer-skills/primary-2-computer-skills/sim-basic-computer-hardware/`
is fully bilingual end-to-end (config, breadcrumb, and every in-canvas string) — use it as the
worked example when translating another activity. As of 2026-09-07 it is the only *existing*
activity translated this deeply; the other live activities have bilingual site chrome (header,
footer, nav, accessibility panel) but still need their `config.json` `es` blocks and in-canvas
strings done — treat that as backlog, not a blocker for new work.

---

## 16. External Simulation Activities — the standard workflow whenever Diego sends a link (agreed 2026-09-21, standing rule)

Diego will sometimes send a link to a third-party simulation (PhET and similar — see also
Section 12's "Also recommended" links) and ask for it to be added **as a proper Discovery Lab
activity that produces evidence**, not just a no-evidence recommendation. This is a **third,
distinct content type**, alongside a full built simulation (Sections 3-5) and a plain §12
external link:

| | Built simulation | §12 "Also recommended" link | **External Simulation Activity (this section)** |
|---|---|---|---|
| Where it lives | its own folder, full engine | an entry in a node's `resources` array | its own folder, `engine/external-activity.js` |
| Produces evidence? | Yes — full Interactive Learning Package | **No — explicitly, by design** | **Yes — auto-marked quiz + PDF** |
| Has a Knowledge Check? | Yes | No | Yes (mc/multi only) |
| Nav tile | normal simulation tile | dashed, signal-colour, "External" badge | normal simulation tile (it IS a real activity) |

**When Diego sends a link and says to add it as an activity (not just a recommendation), always
do the following — this is the standard, not a one-off:**

1. **Open the simulation and actually use it first.** Read what it teaches and, where the
   interface isn't obvious from documentation alone, click through it yourself (drag the
   controls, toggle the switches) so every quiz question and every "what to do" step describes
   something that is actually true of the simulation, not an assumption. This is the same
   discipline as §12's "never add a link without opening it first," extended to writing real
   assessment content about it.
2. **Give it its own folder**, sibling to normal simulations, inside the course/module Diego
   named (create the module the same way Section 11 describes if none fits yet). Copy
   `_external-template/` (`activity.html` + `config.json`) — fix the relative-depth `../` paths
   the same way `_template/` requires.
3. **Fill in `config.json`:**
   - `title`/`title_es`, `course`, `module`, `pathway`, `ageBand`, `theme`, `estimatedMinutes`.
   - `source` — the publisher/institution credit (e.g. `"PhET Interactive Simulations ·
     University of Colorado Boulder"`) — and `externalUrl`, the direct link Diego gave you.
   - `description` — one or two plain sentences: what the student sees and controls.
   - `whatToDo` — 3-5 concrete steps ("turn X off, see what happens," "drag the Y slider") that
     guide the student through the specific interactions the quiz will then ask about. Never
     generic ("explore the simulation") — name the actual controls.
   - `learningFocus` — same shape and same bar as the built-simulation `learningFocus`
     (Section 5's amendment): real skills plus one strong paragraph naming the exact curriculum
     content practised and why it matters, tied to the named course/module.
   - `knowledgeCheck` — **10 questions, `mc` or `multi` (select-all-that-apply) only** (agreed
     2026-09-21 — this activity type's question budget is deliberately larger than a built
     simulation's 3-4 Knowledge Check items, since it has no Predict/Explain/Apply stages at
     all — the whole assessment lives here). Every question must be objectively auto-markable —
     this activity type has no teacher-marking stage, precisely so a busy 1:1 tutoring session
     can generate graded evidence from a link in minutes. Mix `mc` and `multi` across the 10.
     Write real distractors, not giveaways, and a one-sentence `explain` on every question
     (shown after marking) that teaches the correct idea, not just states it. **Every question
     must be traceable to something you actually did in the simulation** — verify each one by
     clicking through the real controls yourself (see step 1) rather than writing what you
     assume the simulation does; if a control's effect is ambiguous or you can't confirm it
     (e.g. a subtle physics effect that doesn't visibly show in the simplified view), leave it
     out rather than guess.
   - An `es` block mirroring all translatable fields, same discipline as every other activity
     (Section 15).
4. **Add a `thumbnail`** — a simple static SVG badge is fine here (unlike a built simulation's
   looping GIF of its own 3D scene, there is no in-house scene to capture) — or omit `thumbnail`
   entirely if none is made; nav.js renders the tile fine either way.

**Visual design, built once into `engine/external-activity.js` (not per-activity — no content
change needed to get these) — fixed 2026-09-21 after the first instance shipped looking broken:**

- The page opens with a **dashed-border "portal" card** (`.ext-portal`) carrying a small hand-drawn
  rocket-through-a-ring SVG icon and an uppercase "External simulation" badge — visually distinct
  from a built activity's stages at a glance, on the same design logic as §12's dashed/signal-colour
  external links, but built as a real card with a title, description, credit line and the "Open the
  simulation" button, not just a link row. Never reuse the internal `.card` plain styling for this
  box — it must read as "you are about to leave Discovery Lab," not as another built-in stage.
- The **"What to do" steps** render as a numbered list with real circular number badges
  (`.ext-steps`/`.ext-steps__n`), matching the visual weight of a built activity's own Orient
  "How this works" steps — never a bare paragraph of squished numbers and text.
- The **"About this practice" card** (`.ext-about`) gets a tinted gradient background, a small
  icon (a lightbulb by default), and skill tags rendered as solid colour pill chips
  (`.ext-chip`), not plain text — it should read as a genuine highlight card, not a footnote.
- **This module (`engine/external-activity.js`) intentionally does NOT reuse `engine.js`'s
  `.steps-list`/`.lesson-brief`/`.dl-toast-host` classes** — those only exist inside
  `engine.js`'s own `injectEngineStyles()`, which this lighter module never loads. It carries its
  own small `injectExternalStyles()` with an `ext-`-prefixed class set instead. If a future edit
  to this file uses an engine.js-only class name without adding the matching CSS here, it will
  render completely unstyled (this is exactly the bug the 2026-09-21 fix corrected) — always
  verify a new class actually has CSS backing it in this file before using it.
5. **Add the `data/subjects.json` entry** as a normal `"type": "simulation"` node (it gets a
   normal tile, normal `status: "live"`/`"coming-soon"`, normal `questionCount`/`minutes`) with
   one addition: `"kind": "external"` — a marker for future tooling/reporting, not yet used by
   nav.js. **Do not set a `mechanic` field.** The `mechanics`/"always different" rule (Section 11)
   governs the interaction Discovery Lab itself builds; the interaction here lives on someone
   else's site and isn't part of that internal-variety count.
6. Run `python tools/build-nav.py`, then QA it live in the browser exactly like any other
   simulation (CLAUDE.md's standing QA rule): click every quiz option including wrong answers,
   check the auto-mark result, generate the evidence PDF, and open it to confirm the simulation
   link, credit, description, skills, and every question/answer/mark line are all present and
   correct.
7. Commit and push, and give Diego the direct link.

**The evidence PDF this produces (`engine/external-activity.js`'s `buildExternalPDF`) is a
distinct, shorter document type from the full "Discovery Lab Report"** (Section 5's hard rule) —
masthead reads "DISCOVERY LAB — EXTERNAL PRACTICE EVIDENCE," not "DISCOVERY LAB REPORT." It still
always includes, non-negotiably: the student's name, course/module/pathway, a clickable link to
the external simulation with its source credited, a clickable link back to the Discovery Lab
activity page itself, the "what this practises" description and skills (so a teacher or an AI
marker reading only the PDF understands the pedagogical purpose without opening either site),
every knowledge-check question with the student's answer, whether it was correct, and the marks
awarded, and a total auto-marked score as a percentage — everything Diego needs to enter a grade
into Learning Lab or hand the PDF to an AI marker for feedback, without opening the simulation
itself. Because every question is auto-marked, there is no separate `marking.json` and no
teacher/student PDF split (Section 5's Assessed Mode machinery) — the one PDF a student generates
already contains nothing but their own answers and objective marking, so there is nothing to hide
from them.

**Reference implementation:** `primary/science/primary-2-science/physics/module-1-our-solar-system-and-beyond/ext-gravity-and-orbits-phet/`
(PhET's "Gravity and Orbits") — use it and `_external-template/` as the worked examples for the
next one.
