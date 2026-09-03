/* ==========================================================================
   DISCOVERY LAB — ACTIVITY ENGINE   (engine/engine.js)

   Built once, shared by every activity. Given an activity's config.json and a
   simulation module, this renders the whole Interactive Learning Package:

     Orient → Predict → Investigate → Record → Explain → Apply → Check → Evidence

   The engine owns the scaffolding — the progress rail, the stages, the standard
   question types and their auto-marking, autosave, the tamper-evident checksum,
   and the PDF + JSON "Learning Evidence" export. The ACTIVITY owns only its own
   content: the config, and two custom visuals it draws itself (the Orient
   diagram and the Investigate simulation). No activity edits this file.

   Contract — activity.html does only this:

     import { mountActivity } from "../../.../engine/engine.js?v=1";
     mountActivity({
       simulation: {
         orient(host, sim)      { ... draw the teaching diagram ... },
         investigate(host, sim) { ... draw the lab; call sim.recordTrial(...) },
       }
     });

   config.json (fetched from ./config.json) supplies mission, questions, rubric
   and marking. Answer keys and expected points live ONLY there / in the JSON
   export — never in the visible page. These are formative activities; a curious
   student can read the source, and the spec never pretends otherwise.
   ========================================================================== */

import { speak, stopSpeaking, ttsEnabled, speakerButton } from "./accessibility.js?v=2";

const ENGINE_URL = new URL(".", import.meta.url);
const SCHEMA = 3;                                   // bump discards incompatible saves

/* --- tiny DOM helpers ---------------------------------------------------- */
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const frag = (...kids) => { const f = document.createDocumentFragment(); kids.forEach(k => k && f.append(k)); return f; };

/* Stable pseudo-random from a string — keeps shuffled options in the same order
   across reloads so a restored answer still lines up. */
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function shuffle(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* djb2 → base36, formatted XXXX-XXXX. Tamper-EVIDENT, not tamper-proof. */
function checksum(obj) {
  const s = JSON.stringify(obj);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  let h2 = 52711;
  for (let i = s.length - 1; i >= 0; i--) h2 = ((h2 << 5) + h2 + s.charCodeAt(i)) >>> 0;
  const raw = (h.toString(36) + h2.toString(36)).toUpperCase().replace(/[^A-Z0-9]/g, "").padEnd(8, "0").slice(0, 8);
  return raw.slice(0, 4) + "-" + raw.slice(4, 8);
}

const sanitize = s => String(s || "").trim().replace(/[^\w\d]+/g, "-").replace(/^-+|-+$/g, "") || "x";
const todayISO = () => new Date().toISOString();
const dateStamp = () => new Date().toISOString().slice(0, 10);

/* ========================================================================
   QUESTION TYPES — each returns a small controller
   { node, get(), set(v), mark(), clearMark(), answered(), score(), max }
   ======================================================================== */

function qShell(q, index) {
  const wrap = el("div", "q anim-pop");
  wrap.dataset.qid = q.id || `q${index}`;
  const head = el("div");
  head.style.display = "flex"; head.style.gap = "var(--sp-3)";
  head.style.justifyContent = "space-between"; head.style.alignItems = "baseline";
  const promptWrap = el("div");
  const prompt = el("p", "q__prompt", q.prompt);
  promptWrap.append(prompt);
  head.append(promptWrap);
  if (q.marks) head.append(el("span", "q__marks", q.marks === 1 ? "1 mark" : `${q.marks} marks`));
  wrap.append(head);
  if (ttsEnabled) promptWrap.prepend(speakerBtn(() => q.prompt));
  if (q.hint) wrap.append(el("p", "q__hint", q.hint));
  return { wrap, prompt };
}

function speakerBtn(getText) {
  const b = speakerButton(getText);
  b.style.marginRight = "var(--sp-2)";
  return b;
}

function makeMC(q, index, multi) {
  const { wrap } = qShell(q, index);
  const list = el("div", "options");
  list.setAttribute("role", multi ? "group" : "radiogroup");
  list.setAttribute("aria-label", q.prompt);
  const name = `${q.id}-${index}`;
  const inputs = [];
  q.options.forEach(opt => {
    const row = el("label", "option");
    row.dataset.optid = opt.id;
    const input = el("input");
    input.type = multi ? "checkbox" : "radio";
    input.name = name; input.value = opt.id;
    const txt = el("span", null, opt.label);
    row.append(input, txt);
    list.append(row);
    inputs.push(input);
  });
  wrap.append(list);
  const feedback = el("p", "q__hint");
  feedback.style.marginTop = "var(--sp-3)"; feedback.hidden = true;
  wrap.append(feedback);

  const ctl = {
    node: wrap, max: q.marks || 1,
    get: () => multi ? inputs.filter(i => i.checked).map(i => i.value) : (inputs.find(i => i.checked)?.value ?? null),
    set: v => {
      const vals = multi ? (v || []) : (v == null ? [] : [v]);
      inputs.forEach(i => { i.checked = vals.includes(i.value); });
    },
    answered: () => multi ? inputs.some(i => i.checked) : inputs.some(i => i.checked),
    score() {
      if (multi) {
        const pick = new Set(this.get()); const key = new Set(q.answer || []);
        if (pick.size !== key.size) return 0;
        for (const k of key) if (!pick.has(k)) return 0;
        return this.max;
      }
      return this.get() === q.answer ? this.max : 0;
    },
    clearMark() { list.querySelectorAll(".option").forEach(o => o.removeAttribute("data-mark")); feedback.hidden = true; },
    mark() {
      const keys = new Set(multi ? (q.answer || []) : [q.answer]);
      list.querySelectorAll(".option").forEach(o => {
        const id = o.dataset.optid;
        const checked = o.querySelector("input").checked;
        if (keys.has(id)) o.dataset.mark = "correct";
        else if (checked) o.dataset.mark = "incorrect";
        else o.removeAttribute("data-mark");
      });
      if (q.explain) { feedback.textContent = q.explain; feedback.hidden = false; }
      inputs.forEach(i => { i.disabled = true; });
    },
    lock() { inputs.forEach(i => { i.disabled = true; }); },
    unlock() { inputs.forEach(i => { i.disabled = false; }); },
    onChange(cb) { inputs.forEach(i => i.addEventListener("change", cb)); },
  };
  return ctl;
}

function makeNumeric(q, index) {
  const { wrap } = qShell(q, index);
  const field = el("div", "field");
  const row = el("div", "cluster");
  const input = el("input", "input");
  input.type = "number"; input.inputMode = "decimal";
  input.style.maxWidth = "10rem";
  if (q.min != null) input.min = q.min; if (q.max != null) input.max = q.max;
  if (q.step != null) input.step = q.step;
  input.setAttribute("aria-label", q.prompt);
  row.append(input);
  if (q.unit) row.append(el("span", "readout__unit", q.unit));
  field.append(row);
  wrap.append(field);
  const feedback = el("p", "q__hint"); feedback.style.marginTop = "var(--sp-3)"; feedback.hidden = true;
  wrap.append(feedback);

  const ctl = {
    node: wrap, max: q.marks || 1,
    get: () => input.value === "" ? null : Number(input.value),
    set: v => { if (v != null) input.value = v; },
    answered: () => input.value !== "",
    score() { const v = this.get(); return v != null && Math.abs(v - q.answer) <= (q.tolerance || 0) ? this.max : 0; },
    clearMark() { input.removeAttribute("data-mark"); feedback.hidden = true; },
    mark() {
      const ok = this.score() > 0;
      input.style.borderColor = ok ? "var(--positive)" : "var(--negative)";
      feedback.textContent = (ok ? "Correct. " : `Answer: ${q.answer}${q.unit || ""}. `) + (q.explain || "");
      feedback.hidden = false; input.disabled = true;
    },
    lock() { input.disabled = true; }, unlock() { input.disabled = false; },
    onChange(cb) { input.addEventListener("input", cb); },
  };
  return ctl;
}

function makeMatch(q, index) {
  const { wrap } = qShell(q, index);
  const rights = q.pairs.map(p => p.right).concat(q.distractors || []);
  const order = shuffle(rights, seeded((q.id || "m") + "|rights"));
  const table = el("div", "match");
  table.style.display = "grid"; table.style.gap = "var(--sp-3)"; table.style.marginTop = "var(--sp-4)";
  const selects = [];
  const leftOrder = shuffle(q.pairs, seeded((q.id || "m") + "|lefts"));
  leftOrder.forEach(pair => {
    const rowEl = el("div", "match__row");
    rowEl.style.display = "grid";
    rowEl.style.gridTemplateColumns = "minmax(6rem,1fr) minmax(9rem,1.4fr)";
    rowEl.style.gap = "var(--sp-3)"; rowEl.style.alignItems = "center";
    rowEl.dataset.left = pair.left;
    const label = el("span", null, pair.left); label.style.fontWeight = "600";
    const sel = el("select", "select");
    sel.setAttribute("aria-label", `Match: ${pair.left}`);
    sel.append(new Option("Choose…", ""));
    order.forEach(r => sel.append(new Option(r, r)));
    rowEl.append(label, sel);
    table.append(rowEl);
    selects.push({ sel, correct: pair.right, left: pair.left, rowEl });
  });
  wrap.append(table);
  const feedback = el("p", "q__hint"); feedback.style.marginTop = "var(--sp-3)"; feedback.hidden = true;
  wrap.append(feedback);

  const ctl = {
    node: wrap, max: q.marks || q.pairs.length,
    get: () => selects.map(s => ({ left: s.left, value: s.sel.value })),
    set: v => { (v || []).forEach(item => { const s = selects.find(x => x.left === item.left); if (s) s.sel.value = item.value; }); },
    answered: () => selects.some(s => s.sel.value !== ""),
    score() { const per = this.max / q.pairs.length; return selects.reduce((n, s) => n + (s.sel.value === s.correct ? per : 0), 0); },
    clearMark() { selects.forEach(s => { s.rowEl.style.borderLeft = ""; s.sel.style.borderColor = ""; }); feedback.hidden = true; },
    mark() {
      let right = 0;
      selects.forEach(s => {
        const ok = s.sel.value === s.correct;
        if (ok) right++;
        s.sel.style.borderColor = ok ? "var(--positive)" : "var(--negative)";
        s.rowEl.style.borderLeft = `3px solid ${ok ? "var(--positive)" : "var(--negative)"}`;
        s.rowEl.style.paddingLeft = "var(--sp-3)";
        s.sel.disabled = true;
        if (!ok) { const hint = el("span", "q__hint", `→ ${s.correct}`); hint.style.gridColumn = "2"; s.rowEl.after(hint); }
      });
      feedback.textContent = `${right} of ${q.pairs.length} matched correctly. ` + (q.explain || "");
      feedback.hidden = false;
    },
    lock() { selects.forEach(s => { s.sel.disabled = true; }); },
    unlock() { selects.forEach(s => { s.sel.disabled = false; }); },
    onChange(cb) { selects.forEach(s => s.sel.addEventListener("change", cb)); },
  };
  return ctl;
}

function makeSlider(q, index) {
  const { wrap } = qShell(q, index);
  const field = el("div", "field");
  const readoutRow = el("div", "cluster");
  const read = el("span", "readout");
  const unit = el("span", "readout__unit", q.unit || "");
  read.append(unit);
  const val = document.createTextNode(String(q.default ?? q.min ?? 0));
  read.prepend(val);
  readoutRow.append(read);
  const input = el("input");
  input.type = "range";
  input.min = q.min ?? 0; input.max = q.max ?? 100; input.step = q.step ?? 1;
  input.value = q.default ?? q.min ?? 0;
  input.style.width = "100%"; input.style.accentColor = "var(--accent)";
  input.setAttribute("aria-label", q.prompt);
  input.addEventListener("input", () => { val.textContent = input.value; });
  field.append(readoutRow, input);
  wrap.append(field);
  return {
    node: wrap, max: 0,               // predictions are never scored
    get: () => Number(input.value),
    set: v => { if (v != null) { input.value = v; val.textContent = v; } },
    answered: () => true,
    score: () => 0, mark() {}, clearMark() {}, lock() { input.disabled = true; }, unlock() { input.disabled = false; },
    onChange(cb) { input.addEventListener("input", cb); },
  };
}

function makeQuestion(q, index) {
  switch (q.type) {
    case "mc": return makeMC(q, index, false);
    case "multi": return makeMC(q, index, true);
    case "numeric": return makeNumeric(q, index);
    case "match": return makeMatch(q, index);
    case "slider": return makeSlider(q, index);
    default: { const c = makeMC({ ...q, options: q.options || [] }, index, false); return c; }
  }
}

/* ========================================================================
   THE ENGINE
   ======================================================================== */

const STAGES = [
  ["orient", "Orient"], ["predict", "Predict"], ["investigate", "Investigate"],
  ["record", "Record"], ["explain", "Explain"], ["apply", "Apply"],
  ["check", "Check"], ["evidence", "Evidence"],
];

export async function mountActivity({ simulation = {} } = {}) {
  const root = document.getElementById("lab-root");
  if (!root) { console.error("Discovery Lab: no #lab-root on the page."); return; }

  let config;
  try {
    const res = await fetch("./config.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status);
    config = await res.json();
  } catch (e) {
    root.append(el("p", "nav-empty", "Could not load this activity (config.json)."));
    return;
  }

  document.title = `${config.title} — Discovery Lab`;
  if (config.ageBand) document.documentElement.setAttribute("data-age-band", config.ageBand);
  if (config.theme) document.documentElement.setAttribute("data-theme", config.theme);

  const STORE_KEY = `dl-activity:${config.activityId}:${config.version}`;
  const simURL = window.location.href.split("#")[0].split("?")[0];

  /* --- state ------------------------------------------------------------ */
  const fresh = () => ({
    schema: SCHEMA, activityId: config.activityId, version: config.version,
    startedAt: todayISO(), stage: 0,
    predict: null, predictInitial: null,
    trials: [], simResults: {}, custom: {},
    evidence: { prediction_recorded_before_testing: false, prediction_revised: false },
    explain: "", apply: "",
    kc: {}, kcMarked: false,
    badges: [], student: "",
  });
  let state = load() || fresh();
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (!raw || raw.schema !== SCHEMA) return null;         // discard old schema gracefully
      return raw;
    } catch { return null; }
  }
  let saveTimer = null;
  function save() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {} }, 150);
  }

  /* --- header + rail ---------------------------------------------------- */
  const header = el("header", "nav-title");
  header.append(el("p", "eyebrow", `${config.module || ""}`.trim() || config.course || "Discovery Lab"));
  header.append(el("h1", null, config.title));
  if (config.subtitle) header.append(el("p", "nav-title__blurb", config.subtitle));
  const meta = el("p", "tile__meta");
  meta.textContent = [config.activityId, config.estimatedMinutes ? `~${config.estimatedMinutes} min` : null,
    `v${config.version}`].filter(Boolean).join("  ·  ");
  header.append(meta);
  root.append(header);

  const rail = el("nav", "rail"); rail.setAttribute("aria-label", "Activity progress");
  const railSteps = STAGES.map(([id, label], i) => {
    const step = el("button", "rail__step");
    step.type = "button";
    step.dataset.stage = id;
    step.setAttribute("aria-label", `Go to ${label} (step ${i + 1} of ${STAGES.length})`);
    const dot = el("span", "rail__dot", String(i + 1));
    const lab = el("span", "rail__label", label);
    step.append(dot, lab);
    step.addEventListener("click", () => goto(i));
    rail.append(step);
    return step;
  });
  root.append(rail);

  const stagesWrap = el("div", "stages");
  root.append(stagesWrap);

  /* --- build stages ----------------------------------------------------- */
  const stageEls = {};
  STAGES.forEach(([id]) => {
    const s = el("section", "stage"); s.id = `stage-${id}`; s.hidden = true;
    s.setAttribute("aria-label", id);
    stagesWrap.append(s);
    stageEls[id] = s;
  });

  const controllers = {};   // question controllers by area

  /* --------- sim API handed to the activity (declared before the stage
     builders run, because buildOrient/buildInvestigate hand it to the sim) -- */
  const sim = {
    config,
    get trials() { return state.trials; },
    get state() { return state.custom; },
    recordTrial(row) {
      state.trials.push({ ...row });
      save(); refreshRecord();
      return state.trials.length;
    },
    setResult(k, v) { state.simResults[k] = v; save(); },
    mark(k, v = true) { state.evidence[k] = v; save(); },
    saveState() { save(); },
    award(id, label) {
      if (state.badges.find(b => b.id === id)) return false;
      state.badges.push({ id, label }); save(); renderBadges();
      toast(`Badge unlocked: ${label}`, "correct");
      return true;
    },
    hasBadge(id) { return !!state.badges.find(b => b.id === id); },
    speak, ttsEnabled, speaker: getText => speakerBtn(getText),
    toast,
  };

  buildOrient(stageEls.orient);
  buildPredict(stageEls.predict);
  buildInvestigate(stageEls.investigate);
  buildRecord(stageEls.record);
  buildExplain(stageEls.explain);
  buildApply(stageEls.apply);
  buildCheck(stageEls.check);
  buildEvidence(stageEls.evidence);

  /* --- nav bar ---------------------------------------------------------- */
  const navBar = el("div", "lab-nav no-print");
  const back = el("button", "btn btn--ghost", "← Back");
  const next = el("button", "btn", "Next →");
  const spacer = el("span"); spacer.style.flex = "1";
  navBar.append(back, spacer, next);
  root.append(navBar);
  injectEngineStyles();

  back.addEventListener("click", () => goto(state.stage - 1));
  next.addEventListener("click", () => {
    const gate = gateFor(state.stage);
    if (gate) { toast(gate, "info"); return; }
    goto(state.stage + 1);
  });

  function gateFor(i) {
    const id = STAGES[i][0];
    if (id === "predict" && !controllers.predict?.answered())
      return "Make a prediction first — you can always change it once you have run some trials.";
    if (id === "investigate" && state.trials.length === 0)
      return "Run at least one trial in the chamber before moving on — the Investigation Record needs your data.";
    return null;
  }

  function goto(i) {
    i = Math.max(0, Math.min(STAGES.length - 1, i));
    state.stage = i; save();
    STAGES.forEach(([id], idx) => {
      const s = stageEls[id];
      s.hidden = idx !== i;
      if (idx === i) { s.classList.remove("stage__enter"); void s.offsetWidth; s.classList.add("stage__enter"); }
      railSteps[idx].dataset.state = idx < i ? "done" : idx === i ? "current" : "";
      railSteps[idx].querySelector(".rail__dot").textContent = idx < i ? "✓" : String(idx + 1);
    });
    if (STAGES[i][0] === "record") refreshRecord();
    if (STAGES[i][0] === "investigate") state._investigateSeen = true;
    back.disabled = i === 0;
    next.style.visibility = i === STAGES.length - 1 ? "hidden" : "";
    stopSpeaking();
    root.scrollIntoView({ behavior: document.documentElement.getAttribute("data-reduced-motion") === "on" ? "auto" : "smooth", block: "start" });
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  /* ---------------- stage builders ------------------------------------- */
  function stageHead(host, kicker, title, lede) {
    const h = el("div", "stage__head");
    h.append(el("p", "eyebrow", kicker));
    const titleRow = el("div"); titleRow.style.display = "flex"; titleRow.style.gap = "var(--sp-2)"; titleRow.style.alignItems = "center";
    titleRow.append(el("h2", null, title));
    h.append(titleRow);
    if (lede) { const p = el("p", "nav-title__blurb", lede); if (ttsEnabled) { const row = el("div","cluster"); row.append(speakerBtn(()=>`${title}. ${lede}`), p); h.append(row);} else h.append(p); }
    host.append(h);
    return h;
  }

  function buildOrient(host) {
    const o = config.orient || {};
    stageHead(host, "Mission", config.title, o.mission);

    /* CGA Da Vinci policy: every activity states a clear learning objective and
       visible success criteria up front, and names how it connects to the course.
       See CLAUDE.md Section 13. All three are optional in config but strongly
       expected — the panel simply omits whatever an activity has not supplied. */
    if (o.objective || (o.successCriteria && o.successCriteria.length) || o.courseLink) {
      const brief = el("div", "card lesson-brief");
      if (o.objective) {
        brief.append(el("p", "eyebrow", "What you are learning"));
        brief.append(el("p", "lesson-brief__obj", o.objective));
      }
      if (o.courseLink) {
        const cl = el("p", "lesson-brief__course");
        cl.append(el("span", "lesson-brief__tag", "Course link"), document.createTextNode(o.courseLink));
        brief.append(cl);
      }
      if (o.successCriteria && o.successCriteria.length) {
        brief.append(el("p", "eyebrow", "By the end you will be able to"));
        const ul = el("ul", "success-list");
        o.successCriteria.forEach(sc => {
          const li = el("li");
          li.append(el("span", "success-list__tick", "✓"), el("span", null, sc));
          ul.append(li);
        });
        brief.append(ul);
      }
      host.append(brief);
    }

    const grid = el("div", "orient-grid");
    // teaching diagram (custom) on one side, sequenced steps on the other
    const visual = el("div", "orient-visual panel");
    if (simulation.orient) simulation.orient(visual, sim);
    grid.append(visual);

    const side = el("div", "stack");
    if (o.steps?.length) {
      const card = el("div", "card");
      card.append(el("p", "eyebrow", "How this works"));
      const ol = el("ol", "steps-list");
      o.steps.forEach((stp, i) => { const li = el("li"); li.append(el("span", "steps-list__n", String(i + 1)), el("span", null, stp)); ol.append(li); });
      card.append(ol);
      side.append(card);
    }
    if (o.realLife) {
      const rc = el("div", "card real-life");
      rc.append(el("p", "eyebrow", "Where you meet this in real life"));
      const p = el("p", null, o.realLife);
      if (ttsEnabled) { const row = el("div", "cluster"); row.append(speakerBtn(() => o.realLife), p); rc.append(row); } else rc.append(p);
      side.append(rc);
    }
    grid.append(side);
    host.append(grid);
  }

  function buildPredict(host) {
    const p = config.predict || {};
    stageHead(host, "Predict", "Before you touch anything", p.lede || "Science starts with a good guess. Record what you think now — you will be able to change it after you have run some trials.");
    const ctl = makeQuestion({ ...p, id: "predict" }, 0);
    controllers.predict = ctl;
    if (state.predict != null) ctl.set(state.predict);
    ctl.onChange(() => {
      state.predict = ctl.get();
      if (state.predictInitial == null && ctl.answered()) {
        state.predictInitial = JSON.stringify(state.predict);
        if (!state._investigateSeen) state.evidence.prediction_recorded_before_testing = true;
      }
      if (state._investigateSeen && state.predictInitial != null && JSON.stringify(state.predict) !== state.predictInitial)
        state.evidence.prediction_revised = true;
      save();
    });
    host.append(ctl.node);
    const note = el("p", "q__hint"); note.style.marginTop = "var(--sp-4)";
    note.textContent = "A prediction is never marked right or wrong — good scientists change their minds when the evidence tells them to.";
    host.append(note);
  }

  function buildInvestigate(host) {
    stageHead(host, "Investigate", config.investigate?.title || "The Laboratory", config.investigate?.lede);
    const badgeShelf = el("div", "badge-shelf"); badgeShelf.id = "badge-shelf";
    host.append(badgeShelf);
    renderBadges();
    const simHost = el("div", "sim-host");
    host.append(simHost);
    if (simulation.investigate) simulation.investigate(simHost, sim);
    else simHost.append(el("p", "nav-empty", "This activity has no simulation wired up yet."));
  }

  function buildRecord(host) {
    const r = config.record || {};
    stageHead(host, "Record", "Investigation Record", r.intro || "Every trial you run in the chamber is logged here automatically — no copying by hand.");
    const scroll = el("div", "table-scroll");
    const table = el("table", "data-table"); table.id = "record-table";
    scroll.append(table);
    host.append(scroll);
    const empty = el("p", "nav-empty"); empty.id = "record-empty";
    empty.textContent = r.emptyText || "No trials yet. Go back to the chamber and run one.";
    host.append(empty);
  }

  function refreshRecord() {
    const r = config.record || {}; const cols = r.columns || [];
    const table = document.getElementById("record-table");
    const empty = document.getElementById("record-empty");
    if (!table) return;
    table.textContent = "";
    if (!state.trials.length) { empty.hidden = false; table.hidden = true; return; }
    empty.hidden = true; table.hidden = false;
    const thead = el("thead"); const htr = el("tr");
    htr.append(el("th", null, "#"));
    cols.forEach(c => htr.append(el("th", null, c.unit ? `${c.label} (${c.unit})` : c.label)));
    thead.append(htr); table.append(thead);
    const tb = el("tbody");
    state.trials.forEach((row, i) => {
      const tr = el("tr");
      tr.append(el("td", null, String(i + 1)));
      cols.forEach(c => tr.append(el("td", null, row[c.key] == null ? "—" : String(row[c.key]))));
      tb.append(tr);
    });
    table.append(tb);
  }

  function buildWritten(host, cfg, key, kicker, title) {
    stageHead(host, kicker, title, cfg.lede);
    const ctl = qShell({ ...cfg, id: key, marks: cfg.maxMarks }, 0);
    host.append(ctl.wrap);
    const field = el("div", "field");
    const ta = el("textarea", "textarea");
    ta.setAttribute("aria-label", cfg.prompt);
    ta.value = state[key] || "";
    ta.placeholder = cfg.placeholder || "Write your answer in full sentences…";
    const counter = el("p", "counter");
    const min = cfg.minChars || 0;
    const upd = () => { const n = ta.value.trim().length; counter.textContent = min ? `${n} characters (aim for ${min}+)` : `${n} characters`; counter.style.color = min && n < min ? "var(--caution)" : "var(--ink-3)"; };
    ta.addEventListener("input", () => { state[key] = ta.value; save(); upd(); });
    upd();
    field.append(ta, counter);
    ctl.wrap.append(field);
    if (cfg.frame) { const fr = el("p", "q__hint"); fr.textContent = cfg.frame; fr.style.marginTop = "var(--sp-2)"; ctl.wrap.append(fr); }
  }
  function buildExplain(host) { buildWritten(host, config.explain || {}, "explain", "Explain", "Explain what you found"); }
  function buildApply(host)   { buildWritten(host, config.apply   || {}, "apply",   "Apply", "Use it somewhere new"); }

  function buildCheck(host) {
    stageHead(host, "Knowledge Check", "Show what you know", "A few quick questions. These are marked automatically.");
    const list = el("div", "stack"); list.style.setProperty("--flow", "var(--sp-5)");
    controllers.kc = [];
    (config.knowledgeCheck || []).forEach((q, i) => {
      const ctl = makeQuestion(q, i);
      controllers.kc.push({ ctl, q });
      if (state.kc[q.id] != null) ctl.set(state.kc[q.id]);
      ctl.onChange(() => { state.kc[q.id] = ctl.get(); save(); });
      list.append(ctl.node);
    });
    host.append(list);

    const bar = el("div", "cluster no-print"); bar.style.marginTop = "var(--sp-5)";
    const checkBtn = el("button", "btn", "Check my answers");
    const result = el("div"); result.id = "kc-result";
    bar.append(checkBtn);
    host.append(bar, result);

    function doMark() {
      let got = 0, max = 0;
      controllers.kc.forEach(({ ctl }) => { ctl.mark(); got += ctl.score(); max += ctl.max; });
      state.kcMarked = true; state.kcScore = { got: round1(got), max }; save();
      renderKCResult(result, round1(got), max);
      checkBtn.textContent = "Answers checked ✓"; checkBtn.disabled = true;
      celebrate(got / max);
    }
    checkBtn.addEventListener("click", doMark);
    if (state.kcMarked) {
      controllers.kc.forEach(({ ctl }) => ctl.mark());
      renderKCResult(result, state.kcScore.got, state.kcScore.max);
      checkBtn.textContent = "Answers checked ✓"; checkBtn.disabled = true;
    }
  }

  function renderKCResult(host, got, max) {
    host.textContent = "";
    const pct = Math.round((got / max) * 100);
    const card = el("div", "toast toast--info anim-pop"); card.style.marginTop = "var(--sp-4)";
    const chip = el("span", "score-chip"); chip.append(document.createTextNode(`${got}`), el("span", "readout__unit", `/ ${max}`));
    const msg = el("span", null, pct >= 80 ? "  Excellent — strong understanding." : pct >= 50 ? "  Good — read the notes on any you missed." : "  Review the diagram and try the trials again.");
    card.append(chip, msg);
    host.append(card);
  }

  function buildEvidence(host) {
    stageHead(host, "Generate Learning Evidence", "Finish and hand it in", "Type your name, then download your evidence. Two files are made — a PDF to upload, and a data file that helps your teacher mark it quickly.");

    // Visible rubric — criteria and weights only. No answer keys, no expected points.
    const rb = config.rubric || {}; const crit = rb.criteria || [];
    const total = crit.reduce((n, c) => n + (c.max || 0), 0);
    const rubricCard = el("div", "card");
    rubricCard.append(el("p", "eyebrow", "How this is marked"));
    if (rb.note) rubricCard.append(el("p", "q__hint", rb.note));
    const scroll = el("div", "table-scroll");
    const t = el("table", "rubric");
    const thead = el("thead"); const htr = el("tr");
    ["Criterion", "What good work shows", "Marks"].forEach(h => htr.append(el("th", null, h)));
    thead.append(htr); t.append(thead);
    const tb = el("tbody");
    crit.forEach(c => {
      const tr = el("tr");
      tr.append(el("td", null, c.label + (c.auto ? "  (auto)" : "")));
      tr.append(el("td", null, c.descriptor || ""));
      tr.append(el("td", null, `${c.max}  (${Math.round((c.max / total) * 100)}%)`));
      tb.append(tr);
    });
    const trTot = el("tr");
    const tdTot = el("td", null, "Total"); tdTot.style.fontWeight = "700"; tdTot.colSpan = 2;
    const tdTotN = el("td", null, `${total}  (100%)`); tdTotN.style.fontWeight = "700";
    trTot.append(tdTot, tdTotN); tb.append(trTot);
    t.append(tb); scroll.append(t); rubricCard.append(scroll);
    rubricCard.append(el("p", "q__hint", "Your grade is the marks you earn out of " + total + ", shown as a percentage. The auto-marked part is filled in for you; your teacher marks the written answers."));
    host.append(rubricCard);

    // Name + generate
    const gen = el("div", "card"); gen.style.marginTop = "var(--sp-5)";
    const field = el("div", "field");
    field.append(Object.assign(el("label", "field__label", "Your full name"), { htmlFor: "student-name" }));
    const nameInput = el("input", "input"); nameInput.id = "student-name"; nameInput.autocomplete = "off";
    nameInput.placeholder = "e.g. Alex Rivera"; nameInput.value = state.student || "";
    nameInput.addEventListener("input", () => { state.student = nameInput.value; save(); });
    field.append(nameInput);
    gen.append(field);

    const upload = el("p", "toast toast--info"); upload.style.marginTop = "var(--sp-4)";
    upload.append(el("strong", null, "Important: "), document.createTextNode("upload the PDF to Learning Lab as evidence of your work. The data file goes to your teacher for fast marking."));
    gen.append(upload);

    const btnRow = el("div", "cluster no-print"); btnRow.style.marginTop = "var(--sp-4)";
    const genBtn = el("button", "btn btn--lg btn--signal", "Generate Learning Evidence");
    btnRow.append(genBtn);
    gen.append(btnRow);
    const status = el("div"); status.id = "gen-status"; gen.append(status);

    genBtn.addEventListener("click", async () => {
      if (!state.student.trim()) { toast("Type your name first so your teacher knows whose work this is.", "info"); nameInput.focus(); return; }
      if (!state.kcMarked) { toast("Go to the Check step and press “Check my answers” first.", "info"); return; }
      genBtn.disabled = true; genBtn.textContent = "Building your files…";
      try {
        await generateEvidence(status);
        genBtn.textContent = "Generate again";
        genBtn.disabled = false;
      } catch (e) {
        console.error(e);
        toast("Something went wrong building the PDF. Your work is safe — try again.", "info");
        genBtn.disabled = false; genBtn.textContent = "Generate Learning Evidence";
      }
    });

    const clearRow = el("div", "cluster no-print"); clearRow.style.marginTop = "var(--sp-6)";
    const clearBtn = el("button", "btn btn--ghost", "Clear saved work on this device");
    clearBtn.addEventListener("click", () => {
      if (confirm("This erases your answers and trials saved in this browser. Do this only after you have downloaded and uploaded your evidence. Continue?")) {
        try { localStorage.removeItem(STORE_KEY); } catch {}
        state = fresh(); location.reload();
      }
    });
    clearRow.append(clearBtn);
    gen.append(clearRow);
    host.append(gen);
  }

  /* --------- evidence payload + export --------------------------------- */
  function buildPayload() {
    const completed = todayISO();
    const autoScore = state.kcScore ? state.kcScore.got : 0;
    const autoMax = state.kcScore ? state.kcScore.max : (config.knowledgeCheck || []).reduce((n, q) => n + (q.marks || 1), 0);

    const autoMarked = (config.knowledgeCheck || []).map(q => {
      const ctl = controllers.kc.find(k => k.q.id === q.id)?.ctl;
      const ans = state.kc[q.id];
      return {
        id: q.id, question: q.prompt, type: q.type,
        student_answer: ans, correct_answer: q.answer,
        marks_available: q.marks || 1,
        marks_awarded: ctl ? round1(ctl.score()) : 0,
      };
    });

    const predictCfg = config.predict || {};
    const prediction = {
      question: predictCfg.prompt,
      student_prediction: state.predict,
      recorded_before_testing: !!state.evidence.prediction_recorded_before_testing,
      revised_after_testing: !!state.evidence.prediction_revised,
    };

    const constructed = [
      wrapConstructed(config.explain, state.explain),
      wrapConstructed(config.apply, state.apply),
    ].filter(Boolean);

    const rb = config.rubric || {}; const crit = (rb.criteria || []);
    const rubricOut = {};
    crit.forEach(c => { rubricOut[c.key] = { max: c.max, auto: !!c.auto, awarded: c.auto ? autoScore : null }; });
    const rubricTotal = crit.reduce((n, c) => n + (c.max || 0), 0);
    const autoPct = autoMax ? Math.round((autoScore / autoMax) * 100) : 0;

    const core = {
      activity_id: config.activityId, activity_version: config.version,
      student: state.student.trim(), course: config.course, pathway: config.pathway,
      module: config.module, activity_name: config.title,
      simulation_url: simURL,
      learning_objective: (config.orient && config.orient.objective) || null,
      success_criteria: (config.orient && config.orient.successCriteria) || [],
      learning_focus: config.learningFocus || null,
      started: state.startedAt, completed,
      record_columns: (config.record && config.record.columns) || [],
      simulation_results: { trials_run: state.trials.length, ...state.simResults, trials: state.trials },
      interaction_evidence: {
        trials_run: state.trials.length,
        ...state.evidence,
        badges_earned: state.badges,
      },
      prediction,
      auto_marked: autoMarked,
      auto_marked_score: `${autoScore}/${autoMax}`,
      auto_marked_percent: autoPct,
      constructed_responses: constructed,
      rubric: { ...rubricOut, total_marks: rubricTotal, grade_is: "marks ÷ total × 100 = percentage" },
      ai_marking_instructions: config.aiMarkingInstructions || "Mark the constructed responses against the rubric and expected points. Accept scientifically valid alternative wording. Do not penalise spelling unless meaning is unclear.",
    };
    const sum = checksum({ ...core, checksum: undefined });
    return { ...core, integrity_checksum: sum, integrity_note: "Tamper-EVIDENT, not tamper-proof: the PDF and this file share this checksum. If either was edited after download, the two will no longer match. A determined student could still recompute it — treat as a low-stakes formative check." };
  }
  function wrapConstructed(cfg, answer) {
    if (!cfg) return null;
    return {
      question: cfg.prompt, response: (answer || "").trim(),
      marking_context: { max_marks: cfg.maxMarks || 3, expected_points: cfg.expectedPoints || [] },
    };
  }

  async function generateEvidence(statusHost) {
    const payload = buildPayload();
    const base = [sanitize(payload.student), sanitize(config.course), sanitize(config.module), sanitize(config.title), dateStamp()].join("_");

    const jsPDF = await loadJsPDF();
    const pdfBlob = buildPDF(jsPDF, payload);
    downloadBlob(pdfBlob, `${base}.pdf`);
    const jsonBlob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    setTimeout(() => downloadBlob(jsonBlob, `${base}.json`), 400);   // stagger so both save

    statusHost.textContent = "";
    const done = el("div", "toast toast--correct anim-pop"); done.style.marginTop = "var(--sp-4)";
    done.append(el("strong", null, "Done. "), document.createTextNode(`Two files downloaded: ${base}.pdf and ${base}.json. Upload the PDF to Learning Lab. Checksum ${payload.integrity_checksum}.`));
    statusHost.append(done);
    celebrate(1);
  }

  function renderBadges() {
    const shelf = document.getElementById("badge-shelf");
    if (!shelf) return;
    shelf.textContent = "";
    if (!state.badges.length) { shelf.hidden = true; return; }
    shelf.hidden = false;
    shelf.append(el("span", "eyebrow", "Discoveries"));
    state.badges.forEach(b => shelf.append(el("span", "badge badge--correct", b.label)));
  }

  /* --------- little shared UI ------------------------------------------ */
  function toast(msg, kind = "info") {
    let host = document.getElementById("dl-toast");
    if (!host) { host = el("div"); host.id = "dl-toast"; host.className = "dl-toast-host no-print"; document.body.append(host); }
    const t = el("div", `toast toast--${kind} anim-pop`, msg);
    host.append(t);
    while (host.children.length > 4) host.firstChild.remove();   // cap the stack
    if (sim && ttsEnabled()) speak(msg);
    // each toast schedules its OWN removal — never a shared timer, or a fast
    // burst of toasts would cancel each other's removal and linger forever.
    setTimeout(() => { t.style.opacity = "0"; setTimeout(() => t.remove(), 300); }, 4200);
  }
  function celebrate(ratio) {
    if (document.documentElement.getAttribute("data-reduced-motion") === "on") return;
    if (ratio < 0.5) return;
    const host = el("div", "confetti no-print"); document.body.append(host);
    const colors = ["var(--accent)", "var(--signal)", "var(--positive)", "var(--caution)"];
    for (let i = 0; i < 28; i++) {
      const c = el("i"); c.style.left = Math.random() * 100 + "vw";
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = (Math.random() * 0.3) + "s";
      c.style.transform = `translateY(0) rotate(${Math.random() * 360}deg)`;
      host.append(c);
    }
    setTimeout(() => host.remove(), 2200);
  }

  /* --------- boot ------------------------------------------------------- */
  goto(state.stage || 0);
  refreshRecord();
  if (state.badges.length) renderBadges();
}

/* ========================================================================
   PDF — hand-laid with jsPDF (never window.print)
   ======================================================================== */
function loadJsPDF() {
  if (window.jspdf?.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = new URL("vendor/jspdf.umd.min.js", ENGINE_URL).href;
    s.onload = () => window.jspdf?.jsPDF ? resolve(window.jspdf.jsPDF) : reject(new Error("jsPDF missing"));
    s.onerror = () => reject(new Error("jsPDF failed to load"));
    document.head.appendChild(s);
  });
}

function buildPDF(jsPDF, p) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 54; const RIGHT = W - M; const CW = W - M * 2;
  let y = M;

  const ink = [29, 33, 28], mut = [110, 118, 112], accent = [22, 116, 79], line = [200, 205, 198];
  const setColor = c => doc.setTextColor(c[0], c[1], c[2]);

  function ensure(space) { if (y + space > H - M) { footer(); doc.addPage(); y = M; } }
  function rule(c = line) { doc.setDrawColor(c[0], c[1], c[2]); doc.setLineWidth(0.75); doc.line(M, y, RIGHT, y); y += 12; }
  function h(text, size = 13) { ensure(size + 12); doc.setFont("helvetica", "bold"); doc.setFontSize(size); setColor(accent); doc.text(pdfSafe(text).toUpperCase(), M, y); y += size + 4; setColor(ink); }
  function para(text, size = 10, style = "normal", color = ink, gap = 5) {
    doc.setFont("helvetica", style); doc.setFontSize(size); setColor(color);
    const lines = doc.splitTextToSize(pdfSafe(text), CW);
    lines.forEach(ln => { ensure(size + 3); doc.text(ln, M, y); y += size + 3; });
    y += gap;
  }
  function kv(label, value) {
    doc.setFont("helvetica", "bold"); doc.setFontSize(10); setColor(mut);
    ensure(14); doc.text(pdfSafe(label), M, y);
    doc.setFont("helvetica", "normal"); setColor(ink);
    const lines = doc.splitTextToSize(pdfSafe(value || "-"), CW - 130);
    doc.text(lines, M + 130, y); y += Math.max(14, lines.length * 13);
  }
  function footer() {
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); setColor(mut);
    doc.text(pdfSafe(p.activity_name + "  -  " + (p.integrity_checksum || "")), M, H - 28);
    doc.text("Discovery Lab", RIGHT, H - 28, { align: "right" });
    doc.setDrawColor(line[0], line[1], line[2]); doc.setLineWidth(0.5); doc.line(M, H - 40, RIGHT, H - 40);
  }

  // Masthead
  doc.setFont("helvetica", "bold"); doc.setFontSize(9); setColor(accent);
  doc.text("DISCOVERY LAB - LEARNING EVIDENCE", M, y); y += 6;
  rule(accent);
  doc.setFont("helvetica", "bold"); doc.setFontSize(20); setColor(ink);
  doc.text(doc.splitTextToSize(pdfSafe(p.activity_name), CW), M, y + 8); y += 30;
  para(`${p.course}  -  ${p.module}`, 10, "normal", mut, 8);

  kv("Student", p.student);
  kv("Course", `${p.course}  (${p.pathway})`);
  kv("Completed", new Date(p.completed).toLocaleString());
  kv("Activity ID", `${p.activity_id}   v${p.activity_version}`);
  y += 2;

  // Upload banner — with a real clickable link to the live activity
  ensure(46);
  doc.setFillColor(235, 245, 239); doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.roundedRect(M, y, CW, 40, 4, 4, "FD");
  doc.setFont("helvetica", "bold"); doc.setFontSize(10.5); setColor(accent);
  doc.text("Upload this PDF to Learning Lab as evidence of your work.", M + 12, y + 15);
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); setColor(mut);
  doc.text("Open the live activity yourself:", M + 12, y + 30);
  doc.setFont("helvetica", "bold"); setColor(accent);
  doc.textWithLink("Open the live activity ->", M + 12 + doc.getTextWidth("Open the live activity yourself:  "), y + 30, { url: p.simulation_url });
  y += 52;

  // About this activity — the skills and curriculum content it develops.
  // One high-quality paragraph for parents, teachers and school leadership.
  const lf = p.learning_focus;
  if (lf && (lf.summary || (lf.skills && lf.skills.length))) {
    h("About this activity");
    if (lf.skills && lf.skills.length) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); setColor(mut);
      ensure(14); doc.text("Skills practised", M, y);
      doc.setFont("helvetica", "normal"); setColor(accent);
      const skillLines = doc.splitTextToSize(pdfSafe(lf.skills.join("  -  ")), CW - 110);
      doc.text(skillLines, M + 110, y); y += Math.max(14, skillLines.length * 12) + 2;
      setColor(ink);
    }
    if (lf.summary) para(lf.summary, 9.5, "normal", ink, 8);
  }

  // Score summary
  h("Result");
  const autoPct = p.auto_marked_percent;
  para(`Auto-marked Knowledge Check: ${p.auto_marked_score}  (${autoPct}%).  Written answers below are marked by your teacher against the rubric.`, 10);

  // Mission / prediction
  h("Prediction");
  para(p.prediction.question, 10, "italic", mut, 3);
  para("Your prediction: " + fmt(p.prediction.student_prediction), 10);
  para(`Recorded before testing: ${p.prediction.recorded_before_testing ? "yes" : "no"}      Revised after evidence: ${p.prediction.revised_after_testing ? "yes" : "no"}`, 9, "normal", mut, 6);

  // Investigation record
  h("Investigation Record");
  drawTrials(doc, p, { M, RIGHT, CW, H, footer, get y(){return y;}, set y(v){y=v;} });
  y = tableCursor.y;

  // Auto-marked detail
  h("Knowledge Check (auto-marked)");
  p.auto_marked.forEach((a, i) => {
    ensure(34);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); setColor(ink);
    const q = doc.splitTextToSize(pdfSafe(`${i + 1}. ${a.question}`), CW - 40); doc.text(q, M, y); y += q.length * 12;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); setColor(mut);
    const ansLines = doc.splitTextToSize(pdfSafe(`Your answer: ${fmt(a.student_answer)}`), CW - 40);
    doc.text(ansLines, M + 10, y); y += ansLines.length * 12;
    const ok = a.marks_awarded >= a.marks_available;
    setColor(ok ? accent : [163, 44, 30]);
    doc.setFont("helvetica", "bold");
    doc.text(pdfSafe(`${ok ? "[correct]" : "[review]"}  ${a.marks_awarded} / ${a.marks_available}`), M + 10, y); y += 16; setColor(ink);
  });

  // Constructed responses
  h("Written Answers (teacher-marked)");
  p.constructed_responses.forEach((c, i) => {
    ensure(48);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); setColor(ink);
    const qLines = doc.splitTextToSize(pdfSafe(`${i + 1}. ${c.question}`), CW);
    doc.text(qLines, M, y); y += qLines.length * 12 + 4;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10); setColor(ink);
    const ansLines = doc.splitTextToSize(pdfSafe(c.response ? c.response : "(left blank)"), CW);
    doc.text(ansLines, M + 10, y); y += ansLines.length * 13 + 4;
    doc.setFont("helvetica", "italic"); doc.setFontSize(8.5); setColor(mut);
    doc.text(pdfSafe(`Teacher: ____ / ${c.marking_context.max_marks} marks`), M + 10, y); y += 18; setColor(ink);
  });

  // Rubric
  h("Marking Rubric (grade as a percentage)");
  drawRubric(doc, p, { M, RIGHT, CW, H, footer, get y(){return y;}, set y(v){y=v;} });
  y = rubricCursor.y;

  // Integrity + link
  ensure(60);
  rule();
  // Clickable link to the live simulation, so staff or parents can open it directly.
  doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); setColor(mut);
  ensure(12); doc.text("Simulation link:", M, y);
  doc.setFont("helvetica", "normal"); setColor(accent);
  const urlX = M + doc.getTextWidth("Simulation link:  ");
  const urlLines = doc.splitTextToSize(pdfSafe(p.simulation_url), CW - (urlX - M));
  doc.textWithLink(urlLines[0], urlX, y, { url: p.simulation_url });
  for (let i = 1; i < urlLines.length; i++) { y += 11; doc.textWithLink(urlLines[i], M, y, { url: p.simulation_url }); }
  y += 15; setColor(ink);
  para(`Integrity checksum: ${p.integrity_checksum}. ${p.integrity_note}`, 8, "normal", mut, 0);

  footer();
  return doc.output("blob");
}

const tableCursor = { y: 0 };
function drawTrials(doc, p, ctx) {
  const trials = p.simulation_results.trials || [];
  let y = ctx.y;
  if (!trials.length) { doc.setFont("helvetica", "italic"); doc.setFontSize(9); doc.setTextColor(110,118,112); doc.text("No trials recorded.", ctx.M, y); tableCursor.y = y + 16; return; }
  const columns = (p.record_columns && p.record_columns.length)
    ? p.record_columns
    : Object.keys(trials[0]).map(k => ({ key: k, label: k }));
  const colW = ctx.CW / (columns.length + 0.6);
  const x0 = ctx.M + colW * 0.6;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold"); doc.setTextColor(110, 118, 112);
  doc.text("#", ctx.M, y);
  columns.forEach((c, i) => doc.text(pdfSafe(c.unit ? `${c.label} (${c.unit})` : c.label).slice(0, 16), x0 + colW * i, y));
  y += 4; doc.setDrawColor(200,205,198); doc.line(ctx.M, y, ctx.RIGHT, y); y += 11;
  doc.setFont("helvetica", "normal"); doc.setTextColor(29, 33, 28);
  trials.forEach((t, r) => {
    if (y > ctx.H - 70) { ctx.footer(); doc.addPage(); y = 54; }
    doc.text(String(r + 1), ctx.M, y);
    columns.forEach((c, i) => doc.text(pdfSafe(t[c.key] == null ? "-" : String(t[c.key])).slice(0, 18), x0 + colW * i, y));
    y += 13;
  });
  tableCursor.y = y + 8;
}

const rubricCursor = { y: 0 };
function drawRubric(doc, p, ctx) {
  let y = ctx.y;
  const r = p.rubric;
  const keys = Object.keys(r).filter(k => typeof r[k] === "object" && r[k] && "max" in r[k]);
  const total = r.total_marks;
  doc.setFontSize(9); doc.setFont("helvetica", "bold"); doc.setTextColor(110,118,112);
  doc.text("Criterion", ctx.M, y); doc.text("Marks", ctx.RIGHT - 120, y); doc.text("Awarded", ctx.RIGHT - 50, y);
  y += 4; doc.setDrawColor(200,205,198); doc.line(ctx.M, y, ctx.RIGHT, y); y += 12;
  doc.setFont("helvetica", "normal"); doc.setTextColor(29,33,28);
  const labels = { knowledge_accuracy: "Knowledge & understanding", use_of_evidence: "Use of evidence", reasoning: "Scientific reasoning", communication: "Communication" };
  keys.forEach(k => {
    if (y > ctx.H - 90) { ctx.footer(); doc.addPage(); y = 54; }
    const c = r[k];
    doc.text((labels[k] || k) + (c.auto ? "  (auto)" : ""), ctx.M, y);
    doc.text(`${c.max}  (${Math.round((c.max / total) * 100)}%)`, ctx.RIGHT - 120, y);
    doc.text(c.awarded != null ? String(c.awarded) : "____", ctx.RIGHT - 50, y);
    y += 14;
  });
  doc.setDrawColor(200,205,198); doc.line(ctx.M, y, ctx.RIGHT, y); y += 12;
  doc.setFont("helvetica", "bold");
  doc.text("Total", ctx.M, y); doc.text(`${total}  (100%)`, ctx.RIGHT - 120, y);
  doc.text("____ %", ctx.RIGHT - 50, y);
  y += 16;
  doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(110,118,112);
  doc.text("Percentage = total marks earned / " + total + " x 100.", ctx.M, y);
  y += 14;
  rubricCursor.y = y;
}

function fmt(v) {
  if (v == null || v === "") return "(no answer)";
  if (Array.isArray(v)) return v.map(x => typeof x === "object" ? `${x.left} -> ${x.value || "-"}` : x).join(", ");
  return String(v);
}
function round1(n) { return Math.round(n * 10) / 10; }

/* jsPDF's core Helvetica is Latin-1 (WinAnsi) only. Keep printable Latin-1,
   swap the few glyphs we use that fall outside it, drop anything else. */
function pdfSafe(s) {
  return String(s == null ? "" : s)
    .replace(/[✓✔]/g, "[correct]")
    .replace(/[✗✘✕×]/g, "x")
    .replace(/[→➔➤]/g, "->")
    .replace(/[–—]/g, "-")
    .replace(/[‘’′]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/[•]/g, "-")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.style.display = "none";
  document.body.append(a); a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1500);
}

/* ========================================================================
   Engine-owned styles (things the shared stylesheet does not carry)
   ======================================================================== */
function injectEngineStyles() {
  if (document.getElementById("engine-styles")) return;
  const css = `
  .stages{margin-top:var(--sp-5);}
  .lab-nav{display:flex;align-items:center;gap:var(--sp-4);margin-top:var(--sp-7);
    padding-top:var(--sp-5);border-top:1px solid var(--line);}
  .orient-grid{display:grid;gap:var(--sp-5);grid-template-columns:1fr;}
  @media(min-width:52rem){.orient-grid{grid-template-columns:1.15fr .85fr;align-items:start;}}
  .orient-visual{min-height:18rem;display:flex;flex-direction:column;}
  .steps-list{display:flex;flex-direction:column;gap:var(--sp-3);counter-reset:s;margin-top:var(--sp-3);}
  .steps-list li{display:flex;gap:var(--sp-3);align-items:flex-start;}
  .steps-list__n{flex:none;width:1.7rem;height:1.7rem;border-radius:50%;display:grid;place-items:center;
    background:var(--accent);color:var(--accent-ink);font-family:var(--font-data);font-size:var(--step--1);font-weight:700;}
  .real-life{border-left:3px solid var(--signal);}
  .lesson-brief{border-left:3px solid var(--accent);margin-bottom:var(--sp-5);}
  .lesson-brief__obj{font-size:var(--step-1);color:var(--ink);max-width:var(--measure);margin-top:var(--sp-2);}
  .lesson-brief__course{font-size:var(--step--1);color:var(--ink-2);margin-top:var(--sp-3);}
  .lesson-brief__tag{display:inline-block;font-family:var(--font-data);font-size:0.68rem;letter-spacing:.1em;
    text-transform:uppercase;color:var(--accent);border:1px solid var(--accent);border-radius:999px;
    padding:.1em .55em;margin-right:var(--sp-2);}
  .success-list{display:flex;flex-direction:column;gap:var(--sp-2);margin-top:var(--sp-3);}
  .success-list li{display:flex;gap:var(--sp-3);align-items:flex-start;color:var(--ink);}
  .success-list__tick{flex:none;width:1.4rem;height:1.4rem;border-radius:50%;display:grid;place-items:center;
    background:var(--positive);color:#fff;font-size:.8rem;font-weight:700;margin-top:.1em;}
  .badge-shelf{display:flex;flex-wrap:wrap;gap:var(--sp-2);align-items:center;margin-bottom:var(--sp-4);}
  .sim-host{margin-top:var(--sp-2);}
  .dl-toast-host{position:fixed;left:50%;bottom:1.5rem;transform:translateX(-50%);z-index:300;
    display:flex;flex-direction:column;gap:var(--sp-2);width:min(28rem,calc(100vw - 2rem));}
  .dl-toast-host .toast{background:var(--surface);box-shadow:var(--shadow-2);transition:opacity .3s;}
  .confetti{position:fixed;inset:0;pointer-events:none;z-index:400;overflow:hidden;}
  .confetti i{position:absolute;top:-12px;width:9px;height:14px;border-radius:2px;opacity:.9;
    animation:confetti-fall 1.9s var(--ease) forwards;}
  @keyframes confetti-fall{to{transform:translateY(104vh) rotate(540deg);opacity:0;}}
  .rail__step{cursor:pointer;background:none;}
  @media print{.lab-nav,.rail,.badge-shelf{display:none !important;}.stage[hidden]{display:block !important;}}`;
  const style = el("style"); style.id = "engine-styles"; style.textContent = css;
  document.head.appendChild(style);
}
