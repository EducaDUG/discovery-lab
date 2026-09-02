# Project Brief: Interactive Learning Simulation Hub

**Save this file as `CLAUDE.md` in the root of the GitHub repository.** Claude Code reads `CLAUDE.md` automatically at the start of every session in that repo, so this becomes the persistent project memory — you won't need to re-explain the architecture each time.

---

## 0. GitHub access

I have full access to my GitHub account and am giving you full access to build and push to the repository for this project.

Before doing anything else, check what you actually have access to (git configured, repo cloned or created, push permissions, GitHub Pages enabled). If anything is missing — repo doesn't exist yet, no push access, no GitHub CLI/git auth configured — **stop and tell me exactly what you need from me** (e.g. "create an empty repo called X and give me the URL," "run `gh auth login`," "add me as a collaborator"). Don't guess or work around missing access silently.

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
   `version`, `questionCount`, `minutes`, and `status: "coming-soon"`.
5. Build the activity in its own folder: `activity.html` + `config.json`. Start from
   `_template/`. **Never edit the shared engine for a content change.**
6. Flip that simulation's `status` to `"live"` only once `activity.html` actually works.
7. Run `python tools/build-nav.py`.
8. Commit, push, verify the live URL, and give him the direct link to the activity.

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
