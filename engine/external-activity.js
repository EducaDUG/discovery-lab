/* ==========================================================================
   DISCOVERY LAB — EXTERNAL SIMULATION ACTIVITY   (engine/external-activity.js)

   Built once, shared by every "external simulation" activity — a Discovery
   Lab page that wraps a third-party simulation (PhET and similar) so a
   student can practise on the real thing AND still produce marking-ready
   evidence, unlike a plain "Also recommended" link (CLAUDE.md §12, which
   deliberately produces no evidence). See CLAUDE.md §16 for the standing
   rule this implements.

   Contract — activity.html does only this:

     import { mountExternalActivity } from "../../.../engine/external-activity.js?v=1";
     mountExternalActivity();

   config.json (fetched from ./config.json) supplies everything: the source
   simulation's URL and credit, what to do, the learning focus, and a
   Knowledge Check (mc/multi only — every question here must be objectively
   auto-markable, since there is no teacher-marking step for this activity
   type). Answer keys live in config.json same as the rest of the site
   (CLAUDE.md's existing honesty-about-security note applies here too — this
   is formative, not a secure exam).
   ========================================================================== */

import { speak, stopSpeaking, ttsEnabled, speakerButton } from "./accessibility.js?v=6";
import { t, getLang, localizeConfig } from "./i18n.js?v=10";

const ENGINE_URL = new URL(".", import.meta.url);

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

const sanitize = s => String(s || "").trim().replace(/[^\w\d]+/g, "-").replace(/^-+|-+$/g, "") || "x";
const dateStamp = () => new Date().toISOString().slice(0, 10);

function pdfSafe(s) {
  return String(s == null ? "" : s)
    .replace(/[✓✔]/g, "[correct]")
    .replace(/[✗✘✕×]/g, "x")
    .replace(/[→➔➤↗]/g, "->")
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

function speakerBtn(getText) {
  const b = speakerButton(getText);
  b.style.marginRight = "var(--sp-2)";
  return b;
}

/* --- the two question types this activity type allows: mc and multi
   (select-all-that-apply) — always objectively, automatically markable,
   since there is no teacher-marking stage here. --------------------------- */
function makeQuestion(q, index) {
  const multi = q.type === "multi";
  const wrap = el("div", "q anim-pop");
  wrap.dataset.qid = q.id || `q${index}`;
  const head = el("div");
  head.style.display = "flex"; head.style.gap = "var(--sp-3)";
  head.style.justifyContent = "space-between"; head.style.alignItems = "baseline";
  const promptWrap = el("div");
  const prompt = el("p", "q__prompt", q.prompt);
  promptWrap.append(prompt);
  head.append(promptWrap);
  head.append(el("span", "q__marks", q.marks === 1 ? t("mark") : t("marks", { n: q.marks || 1 })));
  wrap.append(head);
  if (ttsEnabled) promptWrap.prepend(speakerBtn(() => q.prompt));

  const list = el("div", "options");
  list.setAttribute("role", multi ? "group" : "radiogroup");
  list.setAttribute("aria-label", q.prompt);
  const name = `${q.id || "q"}-${index}`;
  const inputs = [];
  (q.options || []).forEach(opt => {
    const row = el("label", "option");
    row.dataset.optid = opt.id;
    const input = el("input");
    input.type = multi ? "checkbox" : "radio";
    input.name = name; input.value = opt.id;
    row.append(input, el("span", null, opt.label));
    list.append(row);
    inputs.push(input);
  });
  wrap.append(list);
  const feedback = el("p", "q__hint");
  feedback.style.marginTop = "var(--sp-3)"; feedback.hidden = true;
  wrap.append(feedback);

  const ctl = {
    node: wrap, max: q.marks || 1, prompt: q.prompt, options: q.options || [],
    get: () => multi ? inputs.filter(i => i.checked).map(i => i.value) : (inputs.find(i => i.checked)?.value ?? null),
    set: v => { const vals = multi ? (v || []) : (v == null ? [] : [v]); inputs.forEach(i => { i.checked = vals.includes(i.value); }); },
    answered: () => inputs.some(i => i.checked),
    score() {
      if (multi) {
        const pick = new Set(this.get()); const key = new Set(q.answer || []);
        if (pick.size !== key.size) return 0;
        for (const k of key) if (!pick.has(k)) return 0;
        return this.max;
      }
      return this.get() === q.answer ? this.max : 0;
    },
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
    onChange(cb) { inputs.forEach(i => i.addEventListener("change", cb)); },
  };
  return ctl;
}

/* A small "leaving Discovery Lab" rocket-through-a-portal icon — fun, and
   unambiguous that the student is about to go to someone else's site. Pure
   inline SVG using currentColor/CSS vars, same as the rest of the site's
   hand-drawn graphics (CLAUDE.md §4's "real custom graphics" rule). */
const PORTAL_SVG = `<svg viewBox="0 0 64 64" aria-hidden="true">
  <circle cx="32" cy="32" r="27" fill="none" stroke="var(--signal)" stroke-width="2.5" stroke-dasharray="5 6"/>
  <circle cx="32" cy="32" r="16" fill="none" stroke="var(--signal)" stroke-width="1.5" opacity="0.35"/>
  <g transform="rotate(-38 32 32)">
    <path d="M32 12c4.5 0 8 6.4 8 14 0 5.4-2.9 9.7-8 12-5.1-2.3-8-6.6-8-12 0-7.6 3.5-14 8-14z" fill="#fff"/>
    <circle cx="32" cy="23" r="3.1" fill="var(--signal)"/>
    <path d="M24 27l-8 6 9-2z" fill="var(--accent)"/>
    <path d="M40 27l8 6-9-2z" fill="var(--accent)"/>
    <path d="M28.5 36l-2 10 5.5-7z" fill="#ffb347"/>
    <path d="M35.5 36l2 10-5.5-7z" fill="#ff8a3d"/>
  </g>
  <circle cx="14" cy="18" r="1.4" fill="var(--signal)" opacity="0.7"/>
  <circle cx="50" cy="46" r="1.2" fill="var(--signal)" opacity="0.6"/>
  <circle cx="50" cy="16" r="1" fill="var(--signal)" opacity="0.5"/>
</svg>`;

/* Engine-owned styles for this module — mirrors engine.js's own
   injectEngineStyles() pattern (CLAUDE.md: content lives per-activity, the
   engine is built once). engine.js's equivalent classes (.steps-list,
   .lesson-brief, .dl-toast-host…) are NOT reusable here — they only exist
   inside engine.js's own injector, which this lighter module never loads —
   so this file carries its own small, "ext"-prefixed set. */
function injectExternalStyles() {
  if (document.getElementById("ext-styles")) return;
  const css = `
  .ext-portal{border:2px dashed var(--signal);border-radius:18px;
    background:linear-gradient(135deg,color-mix(in srgb,var(--signal) 9%,var(--surface)) 0%,var(--surface) 65%);}
  .ext-portal__head{display:flex;gap:var(--sp-4);align-items:center;flex-wrap:wrap;}
  .ext-portal__icon{flex:none;width:60px;height:60px;}
  .ext-portal__icon svg{width:100%;height:100%;display:block;}
  .ext-portal__badge{display:inline-block;font-family:var(--font-data);font-size:.68rem;letter-spacing:.1em;
    text-transform:uppercase;color:var(--signal);border:1px solid var(--signal);border-radius:999px;
    padding:.22em .85em;margin-bottom:.5em;}
  .ext-portal__title{margin:0;}

  .ext-steps{display:flex;flex-direction:column;gap:var(--sp-3);margin-top:var(--sp-4);list-style:none;padding:0;}
  .ext-steps li{display:flex;gap:var(--sp-3);align-items:flex-start;}
  .ext-steps__n{flex:none;width:1.8rem;height:1.8rem;border-radius:50%;display:grid;place-items:center;
    background:var(--accent);color:#fff;font-family:var(--font-data);font-weight:700;font-size:.85rem;}
  .ext-steps__text{padding-top:.2rem;}

  .ext-about{border-radius:18px;border:1px solid var(--accent);
    background:linear-gradient(135deg,color-mix(in srgb,var(--accent) 13%,var(--surface)) 0%,var(--surface) 72%);}
  .ext-about__head{display:flex;align-items:center;gap:var(--sp-3);}
  .ext-about__icon{flex:none;width:30px;height:30px;color:var(--accent);}
  .ext-about__chips{display:flex;flex-wrap:wrap;gap:var(--sp-2);margin-top:var(--sp-4);}
  .ext-chip{background:var(--accent);color:#fff;padding:.4em 1.05em;border-radius:999px;font-weight:700;
    font-size:.78rem;letter-spacing:.02em;box-shadow:var(--shadow-1);}
  .ext-about__summary{margin-top:var(--sp-4);font-size:var(--step-0);color:var(--ink-2);max-width:var(--measure);}

  .dl-toast-host{position:fixed;left:50%;bottom:1.5rem;transform:translateX(-50%);z-index:300;
    display:flex;flex-direction:column;gap:var(--sp-2);width:min(28rem,calc(100vw - 2rem));}
  .dl-toast-host .toast{background:var(--surface);box-shadow:var(--shadow-2);transition:opacity .3s;}
  @media print{.no-print{display:none !important;}}`;
  const style = el("style"); style.id = "ext-styles"; style.textContent = css;
  document.head.appendChild(style);
}

function toastHost() {
  let host = document.querySelector(".dl-toast-host");
  if (!host) { host = el("div", "dl-toast-host"); document.body.append(host); }
  return host;
}
function toast(msg, kind = "info") {
  const host = toastHost();
  const card = el("div", `toast toast--${kind} anim-pop`, msg);
  host.append(card);
  setTimeout(() => { card.style.opacity = "0"; setTimeout(() => card.remove(), 300); }, 3400);
}

export async function mountExternalActivity() {
  const root = document.getElementById("lab-root");
  if (!root) { console.error("Discovery Lab: no #lab-root on the page."); return; }

  let config;
  try {
    const res = await fetch("./config.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(res.status);
    config = localizeConfig(await res.json(), getLang());
  } catch (e) {
    root.append(el("p", "nav-empty", t("activity-load-error")));
    return;
  }

  document.title = `${config.title} — Discovery Lab`;
  if (config.ageBand) document.documentElement.setAttribute("data-age-band", config.ageBand);
  if (config.theme) document.documentElement.setAttribute("data-theme", config.theme);
  injectExternalStyles();

  const STORE_KEY = `dl-ext:${config.activityId}:${config.version}`;
  const simURL = window.location.href.split("#")[0].split("?")[0];
  let state = load() || { kc: {}, kcMarked: false, kcScore: null, student: "" };
  function load() { try { return JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch { return null; } }
  let saveTimer = null;
  function save() { clearTimeout(saveTimer); saveTimer = setTimeout(() => { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {} }, 150); }

  /* --- header ------------------------------------------------------------ */
  const header = el("header", "nav-title");
  header.append(el("p", "eyebrow", `${config.module || ""}`.trim() || config.course || "Discovery Lab"));
  header.append(el("h1", null, config.title));
  if (config.subtitle) header.append(el("p", "nav-title__blurb", config.subtitle));
  const meta = el("p", "tile__meta");
  meta.textContent = [config.activityId, config.estimatedMinutes ? `~${config.estimatedMinutes} min` : null, `v${config.version}`]
    .filter(Boolean).join("  ·  ");
  header.append(meta);
  root.append(header);

  const wrap = el("div", "stack"); wrap.style.setProperty("--flow", "var(--sp-7)");
  root.append(wrap);

  /* --- 1. the "leaving Discovery Lab" portal card -------------------------- */
  const simCard = el("div", "card ext-portal");
  const head = el("div", "ext-portal__head");
  const iconWrap = el("div", "ext-portal__icon");
  iconWrap.innerHTML = PORTAL_SVG;
  head.append(iconWrap);
  const headText = el("div");
  headText.append(el("span", "ext-portal__badge", t("ext.badge")));
  headText.append(el("h2", "ext-portal__title", config.title));
  head.append(headText);
  simCard.append(head);
  if (config.description) {
    const p = el("p", "nav-title__blurb", config.description);
    p.style.marginTop = "var(--sp-4)";
    if (ttsEnabled) { const row = el("div", "cluster"); row.append(speakerBtn(() => config.description), p); simCard.append(row); }
    else simCard.append(p);
  }
  if (config.source) {
    const credit = el("p", "q__hint");
    credit.textContent = `${t("ext.credit-lede")} ${config.source}.`;
    simCard.append(credit);
  }
  const openRow = el("div", "cluster"); openRow.style.marginTop = "var(--sp-4)";
  const openBtn = el("a", "btn btn--lg btn--signal", t("ext.open"));
  openBtn.href = config.externalUrl; openBtn.target = "_blank"; openBtn.rel = "noopener";
  openRow.append(openBtn);
  simCard.append(openRow);
  simCard.append(el("p", "q__hint", t("ext.open-note")));
  wrap.append(simCard);

  /* --- 2. what to do ------------------------------------------------------ */
  if (config.whatToDo?.length) {
    const card = el("div", "card");
    card.append(el("p", "eyebrow", t("ext.what-to-do")));
    const ol = el("ol", "ext-steps");
    config.whatToDo.forEach((stp, i) => {
      const li = el("li");
      li.append(el("span", "ext-steps__n", String(i + 1)), el("span", "ext-steps__text", stp));
      ol.append(li);
    });
    card.append(ol);
    wrap.append(card);
  }

  /* --- 3. learning focus --------------------------------------------------- */
  const lf = config.learningFocus;
  if (lf && (lf.summary || lf.skills?.length)) {
    const card = el("div", "card ext-about");
    const aHead = el("div", "ext-about__head");
    const bulb = el("div", "ext-about__icon");
    bulb.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.7 10.7c.6.5 1 1.2 1.1 2h5.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    aHead.append(bulb, el("p", "eyebrow", t("ext.about")));
    card.append(aHead);
    if (lf.skills?.length) {
      const chipRow = el("div", "ext-about__chips");
      lf.skills.forEach(s => chipRow.append(el("span", "ext-chip", s)));
      card.append(chipRow);
    }
    if (lf.summary) card.append(el("p", "ext-about__summary", lf.summary));
    wrap.append(card);
  }

  /* --- 4. knowledge check --------------------------------------------------- */
  const checkCard = el("div", "card");
  checkCard.append(el("p", "eyebrow", t("knowledge-check")));
  checkCard.append(el("h2", null, t("show-what-know")));
  checkCard.append(el("p", "nav-title__blurb", t("ext.check-lede")));
  const list = el("div", "stack"); list.style.setProperty("--flow", "var(--sp-5)"); list.style.marginTop = "var(--sp-5)";
  const controllers = [];
  (config.knowledgeCheck || []).forEach((q, i) => {
    const ctl = makeQuestion(q, i);
    controllers.push({ ctl, q });
    if (state.kc[q.id] != null) ctl.set(state.kc[q.id]);
    ctl.onChange(() => { state.kc[q.id] = ctl.get(); save(); });
    list.append(ctl.node);
  });
  checkCard.append(list);

  const bar = el("div", "cluster no-print"); bar.style.marginTop = "var(--sp-5)";
  const checkBtn = el("button", "btn", t("check-answers"));
  const result = el("div"); result.id = "kc-result";
  bar.append(checkBtn);
  checkCard.append(bar, result);

  function renderKCResult(host, got, max) {
    host.textContent = "";
    const pct = Math.round((got / max) * 100);
    const card = el("div", "toast toast--info anim-pop"); card.style.marginTop = "var(--sp-4)";
    const chip = el("span", "score-chip"); chip.append(document.createTextNode(`${got}`), el("span", "readout__unit", `/ ${max}`));
    const msg = el("span", null, pct >= 80 ? t("kc.excellent") : pct >= 50 ? t("kc.good") : t("kc.review"));
    card.append(chip, msg);
    host.append(card);
  }
  function doMark() {
    let got = 0, max = 0;
    controllers.forEach(({ ctl }) => { ctl.mark(); got += ctl.score(); max += ctl.max; });
    state.kcMarked = true; state.kcScore = { got, max }; save();
    renderKCResult(result, got, max);
    checkBtn.textContent = t("answers-checked"); checkBtn.disabled = true;
  }
  checkBtn.addEventListener("click", doMark);
  if (state.kcMarked && state.kcScore) {
    controllers.forEach(({ ctl }) => ctl.mark());
    renderKCResult(result, state.kcScore.got, state.kcScore.max);
    checkBtn.textContent = t("answers-checked"); checkBtn.disabled = true;
  }
  wrap.append(checkCard);

  /* --- 5. generate evidence ------------------------------------------------- */
  const genCard = el("div", "card");
  genCard.append(el("p", "eyebrow", t("generate-evidence")));
  genCard.append(el("h2", null, t("finish-hand-in")));
  genCard.append(el("p", "nav-title__blurb", t("ext.evidence-lede")));

  const field = el("div", "field"); field.style.marginTop = "var(--sp-4)";
  field.append(Object.assign(el("label", "field__label", t("your-name")), { htmlFor: "student-name" }));
  const nameInput = el("input", "input"); nameInput.id = "student-name"; nameInput.autocomplete = "off";
  nameInput.placeholder = t("name-placeholder"); nameInput.value = state.student || "";
  nameInput.addEventListener("input", () => { state.student = nameInput.value; save(); });
  field.append(nameInput);
  genCard.append(field);

  const upload = el("p", "toast toast--info"); upload.style.marginTop = "var(--sp-4)";
  upload.append(el("strong", null, t("upload-important")), document.createTextNode(t("upload-note")));
  genCard.append(upload);

  const btnRow = el("div", "cluster no-print"); btnRow.style.marginTop = "var(--sp-4)";
  const genBtn = el("button", "btn btn--lg btn--signal", t("ext.generate"));
  btnRow.append(genBtn);
  const status = el("div");
  genCard.append(btnRow, status);

  genBtn.addEventListener("click", async () => {
    if (!state.student.trim()) { toast(t("type-name-first"), "info"); nameInput.focus(); return; }
    if (!state.kcMarked) { toast(t("ext.check-first"), "info"); return; }
    genBtn.disabled = true; genBtn.textContent = t("ext.building");
    try {
      const jsPDF = await loadJsPDF();
      const blob = buildExternalPDF(jsPDF, {
        config, simURL, student: state.student,
        controllers, kcScore: state.kcScore,
      });
      const base = [sanitize(state.student), sanitize(config.course), sanitize(config.module), sanitize(config.title), dateStamp()].join("_");
      downloadBlob(blob, `${base}.pdf`);
      status.textContent = `${t("done")}${base}.pdf`;
      genBtn.textContent = t("ext.generate-again");
    } catch (e) {
      console.error(e);
      toast(t("pdf-error"), "info");
      genBtn.textContent = t("ext.generate");
    } finally {
      genBtn.disabled = false;
    }
  });

  wrap.append(genCard);
}

function fmtAnswer(ctl, ids) {
  if (ids == null) return t("pdf.no-answer");
  const list = Array.isArray(ids) ? ids : [ids];
  if (!list.length) return t("pdf.no-answer");
  return list.map(id => ctl.options.find(o => o.id === id)?.label || id).join(", ");
}

/* PDF — hand-laid with jsPDF (never window.print), same visual language as
   the full Interactive Learning Package report (CLAUDE.md §5), but a
   shorter, distinct document type: an external-practice evidence sheet.
   There is no teacher-marking section because every question here is
   auto-marked — that is the whole point of this activity type. */
/* Word-wraps a URL to a max width. jsPDF's own splitTextToSize only breaks on
   spaces, so a long space-free URL just overflows instead of wrapping — this
   breaks after "/" (and other safe URL characters) first, falling back to a
   hard character break only if a single segment is still too wide. */
function wrapUrl(doc, url, maxWidth) {
  const parts = String(url).split(/(?<=[/&?=_.-])/);
  const rough = [];
  let cur = "";
  parts.forEach(part => {
    const test = cur + part;
    if (cur && doc.getTextWidth(test) > maxWidth) { rough.push(cur); cur = part; }
    else cur = test;
  });
  if (cur) rough.push(cur);
  const lines = [];
  rough.forEach(line => {
    if (doc.getTextWidth(line) <= maxWidth) { lines.push(line); return; }
    let chunk = "";
    for (const ch of line) {
      const test = chunk + ch;
      if (chunk && doc.getTextWidth(test) > maxWidth) { lines.push(chunk); chunk = ch; }
      else chunk = test;
    }
    if (chunk) lines.push(chunk);
  });
  return lines.length ? lines : [""];
}

function buildExternalPDF(jsPDF, p) {
  const { config, simURL, student, controllers, kcScore } = p;
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
    doc.text(pdfSafe(config.title), M, H - 28);
    doc.text("Discovery Lab", RIGHT, H - 28, { align: "right" });
    doc.setDrawColor(line[0], line[1], line[2]); doc.setLineWidth(0.5); doc.line(M, H - 40, RIGHT, H - 40);
  }

  doc.setFont("helvetica", "bold"); doc.setFontSize(9); setColor(accent);
  doc.text(t("pdf.ext-masthead"), M, y); y += 6;
  rule(accent);
  doc.setFont("helvetica", "bold"); doc.setFontSize(20); setColor(ink);
  doc.text(doc.splitTextToSize(pdfSafe(config.title), CW), M, y + 8); y += 30;
  para(`${config.course || ""}  -  ${config.module || ""}`, 10, "normal", mut, 8);

  kv(t("pdf.student"), student);
  kv(t("pdf.course"), `${config.course || ""}  (${config.pathway || ""})`);
  kv(t("pdf.completed"), new Date().toLocaleString());
  kv(t("pdf.activityId"), `${config.activityId}   v${config.version}`);
  y += 2;

  // Source simulation banner — link + credit. Box height and every wrapped
  // line are computed up front so a long URL never overflows the box (a URL
  // has no spaces for jsPDF's own word-wrap to break on — see wrapUrl above).
  const pad = 12, availW = CW - pad * 2, lineH = 11;
  // Measure labels in the (normal) font they're drawn in, but measure the
  // URLs themselves in "helvetica bold" — the font they're actually drawn
  // in below — since bold glyphs are wider and a wrap computed against the
  // narrower normal-weight metrics still overflows once rendered bold.
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5);
  const simLabel = pdfSafe(t("pdf.ext-link")) + "  ";
  const simLabelW = doc.getTextWidth(simLabel);
  doc.setFont("helvetica", "bold");
  const simUrlLines = wrapUrl(doc, config.externalUrl, availW - simLabelW);

  doc.setFont("helvetica", "normal"); doc.setFontSize(8);
  const daLabel = pdfSafe(t("pdf.sim-link")) + "  ";
  const daLabelW = doc.getTextWidth(daLabel);
  doc.setFont("helvetica", "bold");
  const daUrlLines = wrapUrl(doc, simURL, availW - daLabelW);

  const sourceLineH = 15;
  const boxH = 6 + sourceLineH + 6 + simUrlLines.length * lineH + 5 + daUrlLines.length * lineH + 8;
  ensure(boxH + 14);
  doc.setFillColor(235, 245, 239); doc.setDrawColor(accent[0], accent[1], accent[2]);
  doc.roundedRect(M, y, CW, boxH, 4, 4, "FD");

  let by = y + 6 + sourceLineH;
  doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); setColor(accent);
  doc.text(pdfSafe(`${t("pdf.ext-source")} ${config.source || "-"}`), M + pad, by);

  by += lineH + 6;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); setColor(mut);
  doc.text(simLabel, M + pad, by);
  doc.setFont("helvetica", "bold"); setColor(accent);
  simUrlLines.forEach((ln, i) => {
    doc.textWithLink(ln, i === 0 ? M + pad + simLabelW : M + pad, by + i * lineH, { url: config.externalUrl });
  });
  by += simUrlLines.length * lineH + 5;

  doc.setFont("helvetica", "normal"); doc.setFontSize(8); setColor(mut);
  doc.text(daLabel, M + pad, by);
  doc.setFont("helvetica", "bold"); setColor(accent);
  daUrlLines.forEach((ln, i) => {
    doc.textWithLink(ln, i === 0 ? M + pad + daLabelW : M + pad, by + i * lineH, { url: simURL });
  });

  y += boxH + 14; setColor(ink);

  // What this practises — skills + curriculum content, and what to do
  const lf = config.learningFocus;
  if (config.description || (lf && (lf.summary || lf.skills?.length))) {
    h(t("pdf.ext-about"));
    if (config.description) para(config.description, 9.5, "normal", ink, 4);
    if (lf?.skills?.length) {
      doc.setFont("helvetica", "bold"); doc.setFontSize(9); setColor(mut);
      ensure(14); doc.text(t("pdf.skills-practised"), M, y);
      doc.setFont("helvetica", "normal"); setColor(accent);
      const skillLines = doc.splitTextToSize(pdfSafe(lf.skills.join("  -  ")), CW - 110);
      doc.text(skillLines, M + 110, y); y += Math.max(14, skillLines.length * 12) + 2;
      setColor(ink);
    }
    if (lf?.summary) para(lf.summary, 9.5, "normal", ink, 8);
  }

  // Score summary
  h(t("pdf.result"));
  const pct = kcScore.max ? Math.round((kcScore.got / kcScore.max) * 100) : 0;
  para(`${t("pdf.ext-score")}: ${kcScore.got} / ${kcScore.max}  (${pct}%)`, 10.5, "bold", accent, 8);

  // Every question, the student's answer, correct/incorrect, and marks
  h(t("pdf.kc-auto"));
  controllers.forEach(({ ctl, q }, i) => {
    ensure(34);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9.5); setColor(ink);
    const qLines = doc.splitTextToSize(pdfSafe(`${i + 1}. ${q.prompt}`), CW - 40); doc.text(qLines, M, y); y += qLines.length * 12;
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); setColor(mut);
    const ansLines = doc.splitTextToSize(pdfSafe(t("pdf.your-answer") + fmtAnswer(ctl, ctl.get())), CW - 40);
    doc.text(ansLines, M + 10, y); y += ansLines.length * 12;
    const marks = ctl.score(); const ok = marks >= ctl.max;
    if (!ok) {
      doc.setFont("helvetica", "italic"); doc.setFontSize(8.5); setColor(mut);
      const correctLines = doc.splitTextToSize(pdfSafe(t("answer-was", { answer: fmtAnswer(ctl, q.answer), unit: "" })), CW - 40);
      doc.text(correctLines, M + 10, y); y += correctLines.length * 11;
    }
    setColor(ok ? accent : [163, 44, 30]);
    doc.setFont("helvetica", "bold");
    doc.text(pdfSafe(`${ok ? t("pdf.correct-tag") : t("pdf.review-tag")}  ${marks} / ${ctl.max}`), M + 10, y); y += 16; setColor(ink);
  });

  ensure(40);
  rule();
  para(t("upload-note"), 9, "italic", mut, 0);

  footer();

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); setColor(mut);
    doc.text(pdfSafe(t("pdf.page", { n: i, total: totalPages })), W / 2, H - 28, { align: "center" });
  }

  return doc.output("blob");
}
