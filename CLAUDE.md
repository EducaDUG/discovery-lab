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

---

## 5. Evidence export — the assessment engine

Every activity produces two files when the student clicks **Generate Learning Evidence**, via a real client-side PDF generation function (not `window.print()` — that opens a manual print dialog and breaks the filename/layout consistency we need):

**Filename convention**: `Student_Course_Module_Activity_Date.pdf` and `.json`

**PDF (the official submission)**: human-readable, includes the mission, results, all answers, auto-marked score, rubric, and the **direct URL to the simulation** — so a parent or the head of department can open the live activity itself, not just read a static record. This is the file the student uploads to the school's LMS.

**JSON (the AI-marking companion file)** — this is the file I'll upload to ChatGPT/Claude to mark in seconds. It must be self-sufficient: I should never need to explain the activity or provide a rubric separately. Structure:

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
  "ai_marking_instructions": "Mark the constructed responses using the rubric and expected points above. Accept scientifically valid alternative wording. Do not penalise spelling unless meaning is unclear. Return: total score, score by criterion, one strength, one correction, one next step. Keep feedback under 80 words."
}
```

**Visible rubric**: display the rubric criteria (not the hidden `expected_points`) at the bottom of the activity page itself, so the student can see how they're assessed before submitting. Keep `expected_points` and any auto-marked answer keys out of the visible interface — they exist only in the JSON/underlying code for AI marking.

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
5. Build the activity in its own folder: `activity.html` + `config.json`. Start from
   `_template/`. Write its `learningFocus` (skills + one strong paragraph) — it is required.
   **Never edit the shared engine for a content change.**
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
   and `aiMarkingInstructions` English-only — they are never shown to the student. `_template/config.json`
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
