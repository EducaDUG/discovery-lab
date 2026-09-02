/* ==========================================================================
   DISCOVERY LAB — ACCESSIBILITY PANEL   (engine/accessibility.js)

   Built once, shared by every activity. A small floating control that lets a
   student tune the page to themselves ONCE PER DEVICE (settings persist in
   localStorage): text size, a dyslexia-friendly typeface, a comfortable
   background tint, reduced motion, and read-aloud (browser speech synthesis).

   It only ever writes the three design-system switches the stylesheet already
   understands — data-text-size, data-tint, data-dyslexia, data-reduced-motion —
   plus behavioural read-aloud. No activity ever touches this file.

   To avoid a flash of the default theme, pages may pre-apply saved settings
   with a tiny inline <head> script; this module re-applies them and builds the
   panel. Import it as a module:  <script type="module" src=".../accessibility.js">
   ========================================================================== */

const STORE = "dl-a11y-v1";
const ENGINE_URL = new URL(".", import.meta.url);           // .../engine/
const DYSLEXIA_CSS = new URL("vendor/fonts/dyslexia-font.css", ENGINE_URL).href;

const DEFAULTS = { textSize: "m", dyslexia: false, tint: "paper", motion: "auto", tts: false };

const TEXT_SIZES = [
  ["s", "Small", "A"], ["m", "Medium", "A"], ["l", "Large", "A"], ["xl", "Largest", "A"],
];
const TINTS = [
  ["paper", "Paper"], ["warm", "Warm"], ["cool", "Cool"], ["dusk", "Dusk"], ["dark", "Dark"],
];
const MOTIONS = [
  ["auto", "Match my device"], ["off", "Full motion"], ["on", "Reduce motion"],
];

/* --- storage ------------------------------------------------------------- */
function load() {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORE) || "{}") }; }
  catch { return { ...DEFAULTS }; }
}
function save(prefs) {
  try { localStorage.setItem(STORE, JSON.stringify(prefs)); } catch { /* private mode: ignore */ }
}

/* --- apply to the document root ----------------------------------------- */
let dyslexiaLinkAdded = false;
function ensureDyslexiaFont() {
  if (dyslexiaLinkAdded) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = DYSLEXIA_CSS;
  document.head.appendChild(link);
  dyslexiaLinkAdded = true;
}

export function applyPrefs(prefs) {
  const root = document.documentElement;
  root.setAttribute("data-text-size", prefs.textSize);
  root.setAttribute("data-tint", prefs.tint);

  if (prefs.dyslexia) { ensureDyslexiaFont(); root.setAttribute("data-dyslexia", "on"); }
  else root.removeAttribute("data-dyslexia");

  if (prefs.motion === "on") root.setAttribute("data-reduced-motion", "on");
  else if (prefs.motion === "off") root.setAttribute("data-reduced-motion", "off");
  else root.removeAttribute("data-reduced-motion");        // auto → OS decides
}

/* --- speech synthesis (read-aloud) -------------------------------------- */
const speech = window.speechSynthesis || null;
let ttsOn = false;

export function ttsEnabled() { return ttsOn && !!speech; }

export function speak(text) {
  if (!speech || !text) return;
  speech.cancel();
  const u = new SpeechSynthesisUtterance(String(text));
  u.rate = 0.96; u.pitch = 1; u.lang = document.documentElement.lang || "en";
  speech.speak(u);
}
export function stopSpeaking() { if (speech) speech.cancel(); }

/* A speaker button the engine can attach beside any block of text. It is inert
   (hidden) unless read-aloud is switched on, so it never clutters the page for
   students who do not use it. */
export function speakerButton(getText, label = "Read aloud") {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "a11y-speak";
  b.hidden = !ttsEnabled();
  b.setAttribute("aria-label", label);
  b.title = label;
  b.innerHTML = svgSpeaker();
  b.addEventListener("click", () => speak(typeof getText === "function" ? getText() : getText));
  speakerButtons.push(b);
  return b;
}
const speakerButtons = [];
function refreshSpeakers() { speakerButtons.forEach(b => { b.hidden = !ttsEnabled(); }); }

/* --- panel UI ------------------------------------------------------------ */
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function segmented(legend, items, current, onPick) {
  const group = el("div", "a11y-field");
  const lg = el("p", "a11y-field__label", legend);
  const row = el("div", "a11y-seg");
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", legend);
  const buttons = [];
  items.forEach(([value, label, glyph]) => {
    const b = el("button", "a11y-seg__btn");
    b.type = "button";
    b.dataset.value = value;
    if (glyph) { const g = el("span", "a11y-seg__glyph", glyph); b.append(g); }
    b.append(el("span", glyph ? "sr-only" : null, label));
    b.setAttribute("aria-pressed", String(value === current));
    if (value === current) b.classList.add("is-on");
    b.addEventListener("click", () => {
      buttons.forEach(x => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-pressed", String(x === b)); });
      onPick(value);
    });
    buttons.push(b); row.append(b);
  });
  group.append(lg, row);
  return group;
}

function toggleRow(label, hint, on, onChange) {
  const wrap = el("label", "a11y-toggle");
  const box = el("input");
  box.type = "checkbox"; box.checked = on; box.className = "a11y-toggle__box";
  const body = el("span", "a11y-toggle__body");
  body.append(el("span", "a11y-toggle__label", label));
  if (hint) body.append(el("span", "a11y-toggle__hint", hint));
  wrap.append(box, body);
  box.addEventListener("change", () => onChange(box.checked));
  return wrap;
}

function buildPanel(prefs, update) {
  const panel = el("section", "a11y-panel");
  panel.id = "a11y-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Reading and accessibility settings");
  panel.hidden = true;

  const head = el("div", "a11y-panel__head");
  head.append(el("h2", "a11y-panel__title", "Make it comfortable"));
  const close = el("button", "a11y-panel__close");
  close.type = "button"; close.setAttribute("aria-label", "Close settings"); close.innerHTML = "&times;";
  head.append(close);
  panel.append(head);

  panel.append(el("p", "a11y-panel__lede",
    "Set these once — this device remembers them for every activity."));

  panel.append(segmented("Text size", TEXT_SIZES, prefs.textSize, v => update({ textSize: v })));
  panel.append(segmented("Background", TINTS, prefs.tint, v => update({ tint: v })));
  panel.append(segmented("Motion", MOTIONS, prefs.motion, v => update({ motion: v })));

  panel.append(toggleRow(
    "Dyslexia-friendly font",
    "Switches to Atkinson Hyperlegible with looser spacing.",
    prefs.dyslexia, on => update({ dyslexia: on })));

  const ttsRow = toggleRow(
    "Read aloud",
    speech ? "Adds a speaker button to instructions and questions."
           : "Your browser does not offer speech — try Chrome or Edge.",
    prefs.tts, on => update({ tts: on }));
  if (!speech) ttsRow.querySelector(".a11y-toggle__box").disabled = true;
  panel.append(ttsRow);

  const foot = el("div", "a11y-panel__foot");
  const reset = el("button", "a11y-panel__reset", "Reset to defaults");
  reset.type = "button";
  reset.addEventListener("click", () => update({ ...DEFAULTS }, true));
  foot.append(reset);
  panel.append(foot);

  return { panel, close };
}

function svgGear() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7">
    <circle cx="12" cy="12" r="3.2"/>
    <path d="M12 2.5v2.2M12 19.3v2.2M21.5 12h-2.2M4.7 12H2.5M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6M18.7 18.7l-1.6-1.6M6.9 6.9L5.3 5.3"/>
  </svg>`;
}
function svgSpeaker() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7">
    <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" stroke-linejoin="round"/>
    <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8 8 0 0 1 0 12" stroke-linecap="round"/>
  </svg>`;
}

/* --- styles (scoped, injected once) ------------------------------------- */
function injectStyles() {
  if (document.getElementById("a11y-styles")) return;
  const css = `
  [hidden]{display:none !important;}
  .a11y-fab{position:fixed;right:max(1rem,env(safe-area-inset-right));bottom:max(1rem,env(safe-area-inset-bottom));
    z-index:200;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;
    background:var(--surface);color:var(--ink);border:1px solid var(--line-strong);box-shadow:var(--shadow-2);
    transition:transform var(--dur-fast,120ms) var(--ease),box-shadow var(--dur-fast,120ms) var(--ease);}
  .a11y-fab:hover{transform:translateY(-2px);box-shadow:var(--shadow-3);color:var(--accent);border-color:var(--accent);}
  .a11y-fab svg{width:26px;height:26px;}
  .a11y-panel{position:fixed;right:max(1rem,env(safe-area-inset-right));bottom:calc(1rem + 62px);z-index:201;
    width:min(22rem,calc(100vw - 2rem));max-height:min(80vh,40rem);overflow:auto;
    background:var(--surface);border:1px solid var(--line-strong);border-radius:var(--radius-lg);
    box-shadow:var(--shadow-3);padding:var(--sp-5);display:flex;flex-direction:column;gap:var(--sp-4);
    animation:a11y-rise var(--dur-mid,240ms) var(--ease) both;}
  @keyframes a11y-rise{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
  .a11y-panel__head{display:flex;align-items:center;justify-content:space-between;gap:var(--sp-3);}
  .a11y-panel__title{font-family:var(--font-display);font-size:var(--step-1);margin:0;}
  .a11y-panel__close{font-size:1.6rem;line-height:1;color:var(--ink-3);width:2rem;height:2rem;border-radius:var(--radius);}
  .a11y-panel__close:hover{color:var(--ink);background:var(--surface-2);}
  .a11y-panel__lede{font-size:var(--step--1);color:var(--ink-2);margin:0;max-width:none;}
  .a11y-field{display:flex;flex-direction:column;gap:var(--sp-2);}
  .a11y-field__label{font-family:var(--font-data);font-size:var(--step--1);letter-spacing:.08em;
    text-transform:uppercase;color:var(--ink-3);margin:0;}
  .a11y-seg{display:flex;gap:4px;background:var(--surface-2);padding:4px;border-radius:var(--radius);border:1px solid var(--line);}
  .a11y-seg__btn{flex:1 1 0;min-height:40px;border-radius:calc(var(--radius) - 2px);color:var(--ink-2);
    font-size:var(--step--1);font-weight:600;display:flex;align-items:center;justify-content:center;
    transition:background-color var(--dur-fast,120ms) var(--ease),color var(--dur-fast,120ms) var(--ease);}
  .a11y-seg__btn:hover{color:var(--ink);}
  .a11y-seg__btn.is-on{background:var(--accent);color:var(--accent-ink);box-shadow:var(--shadow-1);}
  .a11y-seg__glyph[data-x]{}
  .a11y-seg__btn .a11y-seg__glyph{font-family:var(--font-display);}
  .a11y-seg__btn:nth-child(1) .a11y-seg__glyph{font-size:.8rem;}
  .a11y-seg__btn:nth-child(2) .a11y-seg__glyph{font-size:1rem;}
  .a11y-seg__btn:nth-child(3) .a11y-seg__glyph{font-size:1.2rem;}
  .a11y-seg__btn:nth-child(4) .a11y-seg__glyph{font-size:1.45rem;}
  .a11y-toggle{display:flex;align-items:flex-start;gap:var(--sp-3);cursor:pointer;padding:var(--sp-2) 0;}
  .a11y-toggle__box{width:1.2em;height:1.2em;margin-top:.15em;accent-color:var(--accent);flex:none;}
  .a11y-toggle__body{display:flex;flex-direction:column;gap:2px;}
  .a11y-toggle__label{font-weight:600;}
  .a11y-toggle__hint{font-size:var(--step--1);color:var(--ink-3);}
  .a11y-panel__foot{border-top:1px solid var(--line);padding-top:var(--sp-3);}
  .a11y-panel__reset{font-size:var(--step--1);color:var(--ink-2);text-decoration:underline;text-underline-offset:.2em;}
  .a11y-panel__reset:hover{color:var(--accent);}
  .a11y-speak{display:inline-grid;place-items:center;width:2rem;height:2rem;border-radius:50%;flex:none;
    color:var(--ink-3);border:1px solid var(--line);background:var(--surface);vertical-align:middle;}
  .a11y-speak:hover{color:var(--accent);border-color:var(--accent);}
  .a11y-speak svg{width:1.05rem;height:1.05rem;}
  @media print{.a11y-fab,.a11y-panel,.a11y-speak{display:none !important;}}`;
  const style = document.createElement("style");
  style.id = "a11y-styles";
  style.textContent = css;
  document.head.appendChild(style);
}

/* --- boot ---------------------------------------------------------------- */
let prefs = load();
applyPrefs(prefs);
ttsOn = !!prefs.tts;

function mountPanel() {
  injectStyles();

  const fab = el("button", "a11y-fab");
  fab.type = "button";
  fab.id = "a11y-fab";
  fab.setAttribute("aria-label", "Reading and accessibility settings");
  fab.setAttribute("aria-expanded", "false");
  fab.setAttribute("aria-controls", "a11y-panel");
  fab.innerHTML = svgGear();

  const update = (patch, rebuild = false) => {
    prefs = { ...prefs, ...patch };
    save(prefs);
    applyPrefs(prefs);
    ttsOn = !!prefs.tts;
    refreshSpeakers();
    if (rebuild) { // full reset needs the controls redrawn
      const open = !current.panel.hidden;
      current.panel.replaceWith(build().panel);
      if (open) openPanel();
    }
  };

  let current;
  function build() {
    current = buildPanel(prefs, update);
    current.close.addEventListener("click", closePanel);
    document.body.appendChild(current.panel);
    return current;
  }

  function openPanel() {
    current.panel.hidden = false;
    fab.setAttribute("aria-expanded", "true");
    current.panel.querySelector("button,input,select")?.focus();
  }
  function closePanel() {
    current.panel.hidden = true;
    fab.setAttribute("aria-expanded", "false");
    stopSpeaking();
    fab.focus();
  }
  function toggle() { current.panel.hidden ? openPanel() : closePanel(); }

  build();
  fab.addEventListener("click", toggle);
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !current.panel.hidden) closePanel(); });
  document.addEventListener("click", e => {
    if (current.panel.hidden) return;
    if (!current.panel.contains(e.target) && e.target !== fab && !fab.contains(e.target)) closePanel();
  });

  document.body.appendChild(fab);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountPanel, { once: true });
} else {
  mountPanel();
}

export default { applyPrefs, speak, stopSpeaking, ttsEnabled, speakerButton };
