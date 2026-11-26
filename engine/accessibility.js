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

import { t } from "./i18n.js?v=8";
import { overrides, setUnits, setHemisphere, unitSystem, hemisphere } from "./locale.js?v=4";

const ES = (() => { try { return (localStorage.getItem("dl-lang") || "en") === "es"; } catch { return false; } })();
const L = (en, es) => ES ? es : en;

const STORE = "dl-a11y-v1";
const ENGINE_URL = new URL(".", import.meta.url);           // .../engine/
const DYSLEXIA_CSS = new URL("vendor/fonts/dyslexia-font.css", ENGINE_URL).href;

const DEFAULTS = { textSize: "m", dyslexia: false, tint: "paper", motion: "auto", tts: false, esRegion: "auto", esGender: "any", spacing: "normal", plain: false, ruler: false };

const TEXT_SIZES = () => [
  ["s", t("a11y.size.s"), "A"], ["m", t("a11y.size.m"), "A"], ["l", t("a11y.size.l"), "A"], ["xl", t("a11y.size.xl"), "A"],
];
const TINTS = () => [
  ["paper", t("a11y.tint.paper")], ["warm", t("a11y.tint.warm")], ["cool", t("a11y.tint.cool")],
  ["dusk", t("a11y.tint.dusk")], ["dark", t("a11y.tint.dark")],
  /* Extra colours for visual stress / Irlen-type light sensitivity: the colour that helps is personal. */
  ["rose", L("Rose", "Rosa")], ["peach", L("Peach", "Melocotón")], ["yellow", L("Yellow", "Amarillo")],
  ["mint", L("Mint", "Menta")], ["aqua", L("Aqua", "Aguamarina")], ["lilac", L("Lilac", "Lila")],
];
const SPACINGS = () => [["normal", L("Normal", "Normal")], ["roomy", L("Roomy", "Amplio")], ["xroomy", L("Extra roomy", "Muy amplio")]];

/* Styles for the extra reading supports live here (not in style.css) so one cache-busted file
   delivers them to every page at once. */
function injectReadingStyles() {
  if (document.getElementById("dl-reading-css")) return;
  const st = document.createElement("style"); st.id = "dl-reading-css";
  st.textContent = `
[data-tint="rose"]  { --paper: #F7E6EA; --surface: #FFF4F6; --surface-2: #EBD3D9; }
[data-tint="peach"] { --paper: #F8EAD9; --surface: #FFF6EC; --surface-2: #EDD9C2; }
[data-tint="yellow"]{ --paper: #F6F0C9; --surface: #FFFBE0; --surface-2: #EBE3B0; }
[data-tint="mint"]  { --paper: #E0F0E4; --surface: #F1FAF3; --surface-2: #CFE5D5; }
[data-tint="aqua"]  { --paper: #DDEFEF; --surface: #EFFAFA; --surface-2: #C9E3E3; }
[data-tint="lilac"] { --paper: #E9E4F3; --surface: #F6F3FC; --surface-2: #DAD2EA; }
[data-spacing="roomy"]  body { letter-spacing: 0.04em; word-spacing: 0.16em; line-height: 1.85; }
[data-spacing="xroomy"] body { letter-spacing: 0.08em; word-spacing: 0.3em;  line-height: 2.1; }
[data-spacing="roomy"] p, [data-spacing="roomy"] li, [data-spacing="xroomy"] p, [data-spacing="xroomy"] li { text-align: left; max-width: 68ch; }
[data-plainfont="on"] { --font-ui: Verdana, Tahoma, Arial, ui-sans-serif, sans-serif; --font-display: Verdana, Tahoma, Arial, ui-sans-serif, sans-serif; }
[data-dyslexia="on"][data-plainfont="on"] { --font-ui: "Atkinson Hyperlegible", Verdana, sans-serif; --font-display: "Atkinson Hyperlegible", Verdana, sans-serif; }
.dl-ruler { position: fixed; inset: 0; z-index: 150; pointer-events: none;
  background: linear-gradient(to bottom, rgba(0,0,0,.38) calc(var(--ry, 40%) - 30px), transparent calc(var(--ry, 40%) - 30px), transparent calc(var(--ry, 40%) + 30px), rgba(0,0,0,.38) calc(var(--ry, 40%) + 30px)); }
`;
  document.head.appendChild(st);
}

/* Reading ruler: dims everything except a band that follows the pointer / finger / keyboard focus. */
let rulerEl = null, rulerBound = false;
function setRuler(on) {
  if (on && !rulerEl) {
    rulerEl = document.createElement("div"); rulerEl.className = "dl-ruler"; rulerEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(rulerEl);
    if (!rulerBound) {
      rulerBound = true;
      const move = y => { if (rulerEl) rulerEl.style.setProperty("--ry", Math.round(y) + "px"); };
      addEventListener("pointermove", e => move(e.clientY), { passive: true });
      addEventListener("touchmove", e => { if (e.touches[0]) move(e.touches[0].clientY); }, { passive: true });
      addEventListener("focusin", e => { const r = e.target.getBoundingClientRect && e.target.getBoundingClientRect(); if (r) move(r.top + r.height / 2); });
    }
  } else if (!on && rulerEl) { rulerEl.remove(); rulerEl = null; }
}
const MOTIONS = () => [
  ["auto", t("a11y.motion.auto")], ["off", t("a11y.motion.off")], ["on", t("a11y.motion.on")],
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

  injectReadingStyles();
  root.setAttribute("data-spacing", prefs.spacing || "normal");
  if (prefs.plain) root.setAttribute("data-plainfont", "on"); else root.removeAttribute("data-plainfont");
  if (document.body) setRuler(!!prefs.ruler); else document.addEventListener("DOMContentLoaded", () => setRuler(!!prefs.ruler));
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

/* Chrome has a long-standing bug where speak() called in the same tick as
   cancel() — or while the engine is stuck "paused" after a tab was
   backgrounded or idle for a while — silently drops the utterance: no sound,
   no error event. This is why read-aloud can work fine in one activity and
   do nothing in another with no visible cause. resume() clears the stuck
   state and the setTimeout(0) lets Chrome's internal queue settle after
   cancel() before the new utterance is queued. */
/* Spanish voices: the student picks Spain / Latin America and female / male once
   (stored in prefs, so it stays for every activity on this device). Browsers do
   not report a voice's gender, so it is guessed from well-known voice names. */
const FEMALE_RE = /(helena|laura|sabina|paulina|monica|mónica|elvira|dalia|salome|salomé|paloma|marisol|lucia|lucía|elena|camila|catalina|valentina|female|mujer|google español|google espa|jorge-no)/i;
const MALE_RE = /(pablo|raul|raúl|jorge|diego|alvaro|álvaro|juan|carlos|enrique|miguel|jaime|arnau|male|hombre|alberto|gonzalo)/i;
function voiceGender(v) { const n = v.name; if (MALE_RE.test(n) && !FEMALE_RE.test(n)) return "male"; if (FEMALE_RE.test(n)) return "female"; return "?"; }
function isSpainVoice(v) { return /^es[-_]ES/i.test(v.lang); }
export function spanishVoices() {
  if (!speech) return [];
  return speech.getVoices().filter(v => /^es([-_]|$)/i.test(v.lang));
}
/* Looks Spanish? (used when a Spanish course shows Spanish text on an English-language page) */
function looksSpanish(text) {
  const s = String(text);
  if (/[¿¡ñ]/.test(s)) return true;
  const w = s.toLowerCase().match(/[a-záéíóúü]+/g) || [];
  if (w.length < 3) return false;
  const es = new Set(["el","la","los","las","un","una","es","son","de","del","que","y","en","con","para","por","qué","cómo","yo","tú","mi","tu","se","no","muy","está","hay","soy","tengo","me","te","al","lo"]);
  const en = new Set(["the","is","are","and","of","to","in","that","you","it","for","with","this","what","how","a","an","your","i","we"]);
  let a = 0, b = 0; w.forEach(x => { if (es.has(x)) a++; if (en.has(x)) b++; });
  return a >= 2 && a > b;
}
function pickVoiceFor(lang) {
  if (!speech) return null;
  const voices = speech.getVoices();
  if (!voices.length) return null;
  const prefix = lang.split("-")[0].toLowerCase();
  if (prefix === "es") {
    let pool = voices.filter(v => /^es([-_]|$)/i.test(v.lang));
    if (!pool.length) return null;
    const p = prefs || {};
    const region = p.esRegion || "auto";
    if (region === "spain") pool = pool.filter(isSpainVoice).length ? pool.filter(isSpainVoice) : pool;
    else if (region === "latam") pool = pool.filter(v => !isSpainVoice(v)).length ? pool.filter(v => !isSpainVoice(v)) : pool;
    const g = p.esGender || "any";
    if (g !== "any") { const m = pool.filter(v => voiceGender(v) === g); if (m.length) pool = m; }
    const score = v => (/natural|neural|online/i.test(v.name) ? 3 : 0) + (/google/i.test(v.name) ? 2 : 0) + (v.localService ? 0 : 1);
    return pool.slice().sort((a, b) => score(b) - score(a))[0];
  }
  return voices.find(v => v.lang.toLowerCase() === lang.toLowerCase())
    || voices.find(v => v.lang.toLowerCase().startsWith(prefix))
    || null;
}
export function speak(text, forceLang) {
  if (!speech || !text) return;
  speech.cancel();
  speech.resume();
  let lang = forceLang || document.documentElement.lang || "en";
  if (!forceLang && lang.toLowerCase().indexOf("es") !== 0 && looksSpanish(text)) lang = "es";
  if (lang === "es") { const r = (prefs && prefs.esRegion) || "auto"; lang = r === "spain" ? "es-ES" : r === "latam" ? "es-MX" : "es"; }
  setTimeout(() => {
    const u = new SpeechSynthesisUtterance(String(text));
    u.rate = 0.96; u.pitch = 1; u.lang = lang;
    const voice = pickVoiceFor(lang);
    if (voice) { u.voice = voice; u.lang = voice.lang; }
    speech.speak(u);
  }, 0);
}
export function stopSpeaking() { if (speech) speech.cancel(); }

/* A single, importable "silence everything" switch — so any sound-making
   feature anywhere on the site (a bonus game's HUD, an activity's own
   controls) can offer its own mute button without needing to open the
   accessibility panel first. Read-aloud is the only thing on this site
   that ever makes sound, so muting it IS muting everything (see CLAUDE.md
   §6's amendment). Mirrors what the panel's own toggle does — persists the
   preference, and stops anything currently speaking immediately when
   turning off. */
export function setTTS(on) {
  prefs = { ...prefs, tts: !!on };
  save(prefs);
  ttsOn = !!prefs.tts;
  refreshSpeakers();
  if (!on) stopSpeaking();
}

/* A speaker button the engine can attach beside any block of text. It is inert
   (hidden) unless read-aloud is switched on, so it never clutters the page for
   students who do not use it. */
export function speakerButton(getText, label = t("a11y.speak")) {
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

const SWATCH = { paper:"#F3F4F2", warm:"#F6EFDF", cool:"#E7EEF2", dusk:"#DCD7CE", dark:"#1B1F23", rose:"#F7E6EA", peach:"#F8EAD9", yellow:"#F6F0C9", mint:"#E0F0E4", aqua:"#DDEFEF", lilac:"#E9E4F3" };
function swatches(legend, items, current, onPick) {
  const group = el("div", "a11y-field");
  group.append(el("p", "a11y-field__label", legend));
  const row = el("div", "a11y-sw"); row.setAttribute("role", "group"); row.setAttribute("aria-label", legend);
  const btns = [];
  items.forEach(([value, label]) => {
    const b = el("button", "a11y-sw__btn"); b.type = "button"; b.title = label;
    b.style.setProperty("--c", SWATCH[value] || "#fff");
    b.append(el("span", "a11y-sw__dot"), el("span", "a11y-sw__name", label));
    b.setAttribute("aria-label", label); b.setAttribute("aria-pressed", String(value === current));
    if (value === current) b.classList.add("is-on");
    b.addEventListener("click", () => { btns.forEach(x => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-pressed", String(x === b)); }); onPick(value); });
    btns.push(b); row.append(b);
  });
  group.append(row); return group;
}
const TILE_ICONS = {
  dys: '<text x="12" y="17" text-anchor="middle" font-size="14" font-weight="700" fill="currentColor" stroke="none">Ab</text>',
  plain: '<text x="12" y="17" text-anchor="middle" font-size="14" fill="currentColor" stroke="none" font-family="Verdana">Aa</text>',
  ruler: '<rect x="3" y="9" width="18" height="6" rx="1.5"/><path d="M3 5h18M3 19h18" opacity=".45"/>',
  tts: '<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8 8 0 0 1 0 12" stroke-linecap="round"/>',
};
function tile(icon, label, hint, on, onChange, disabled) {
  const b = el("button", "a11y-tile"); b.type = "button"; b.title = hint || label;
  b.setAttribute("role", "switch"); b.setAttribute("aria-checked", String(!!on));
  if (disabled) b.disabled = true;
  b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7">' + TILE_ICONS[icon] + '</svg>';
  const st = el("span", "a11y-tile__state", on ? L("On", "Sí") : L("Off", "No"));
  b.append(el("span", "a11y-tile__label", label), st);
  if (on) b.classList.add("is-on");
  b.addEventListener("click", () => { const v = b.getAttribute("aria-checked") !== "true"; b.setAttribute("aria-checked", String(v)); b.classList.toggle("is-on", v); st.textContent = v ? L("On", "Sí") : L("Off", "No"); onChange(v); });
  return b;
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
  panel.setAttribute("aria-label", t("a11y.settings"));
  panel.hidden = true;

  const head = el("div", "a11y-panel__head");
  head.append(el("h2", "a11y-panel__title", t("a11y.title")));
  const close = el("button", "a11y-panel__close");
  close.type = "button"; close.setAttribute("aria-label", t("a11y.close")); close.innerHTML = "&times;";
  head.append(close);
  panel.append(head);

  panel.append(segmented(t("a11y.text-size"), TEXT_SIZES(), prefs.textSize, v => update({ textSize: v })));
  panel.append(swatches(t("a11y.background"), TINTS(), prefs.tint, v => update({ tint: v })));
  panel.append(segmented(L("Reading spacing", "Espaciado de lectura"), SPACINGS(), prefs.spacing || "normal", v => update({ spacing: v })));

  const grid = el("div", "a11y-tiles");
  grid.append(
    tile("dys", t("a11y.dyslexia"), t("a11y.dyslexia-hint"), prefs.dyslexia, on => update({ dyslexia: on })),
    tile("plain", L("Plain font", "Letra sencilla"), L("Verdana-style letters that are easy to tell apart.", "Letras tipo Verdana, fáciles de distinguir."), prefs.plain, on => update({ plain: on })),
    tile("ruler", L("Reading ruler", "Regla de lectura"), L("Dims the page except a band that follows your pointer or finger.", "Oscurece la página salvo una franja que sigue tu puntero o dedo."), prefs.ruler, on => update({ ruler: on })),
    tile("tts", t("a11y.read-aloud"), speech ? t("a11y.tts-hint") : t("a11y.tts-unavailable"), prefs.tts, on => update({ tts: on }), !speech));
  panel.append(grid);

  /* Spanish read-aloud voice (shown when Spanish voices exist on this device) */
  if (speech) {
    const vox = el("div", "a11y-loc");
    vox.append(segmented(L("Spanish voice accent", "Acento de la voz en español"), [
      ["auto", "Auto"], ["spain", L("Spain", "España")], ["latam", L("Latin America", "Latinoamérica")]], prefs.esRegion || "auto", v => update({ esRegion: v })));
    vox.append(segmented(L("Spanish voice", "Voz en español"), [
      ["any", L("Any", "Cualquiera")], ["female", L("Female", "Mujer")], ["male", L("Male", "Hombre")]], prefs.esGender || "any", v => update({ esGender: v })));
    const test = el("button", "a11y-panel__reset", L("▶ Test Spanish voice", "▶ Probar la voz en español"));
    test.type = "button";
    test.addEventListener("click", () => { ttsOn = true; speak("Hola, soy tu voz en español. ¿Cómo estás hoy?", "es"); });
    vox.append(test);
    panel.append(vox);
  }

  panel.append(segmented(t("a11y.motion"), MOTIONS(), prefs.motion, v => update({ motion: v })));

  /* Where am I: units + hemisphere (auto from time zone, student can override) */
  const ov = overrides();
  const loc = el("div", "a11y-loc");
  loc.append(segmented(L("Units", "Unidades"), [
    ["auto", "Auto"],
    ["metric", L("Metric", "Métrico")], ["us", L("US", "EE. UU.")]], ov.units, v => { setUnits(v); location.reload(); }));
  loc.append(segmented(L("Hemisphere", "Hemisferio"), [
    ["auto", "Auto"],
    ["north", L("North", "Norte")], ["south", L("South", "Sur")]], ov.hemi, v => { setHemisphere(v); location.reload(); }));
  panel.append(loc);

  const foot = el("div", "a11y-panel__foot");
  const reset = el("button", "a11y-panel__reset", t("a11y.reset"));
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
  .a11y-panel{width:min(25rem,calc(100vw - 2rem));max-height:min(86vh,44rem);gap:.7rem;padding:0 0 1rem;overflow:auto;}
  .a11y-panel > *:not(.a11y-panel__head){margin-left:1.1rem;margin-right:1.1rem;}
  .a11y-panel__head{padding:.9rem 1.1rem;color:#fff;background:linear-gradient(120deg,var(--accent),var(--accent-hi,var(--accent)) 60%,var(--signal,var(--accent)));
    border-radius:var(--radius-lg) var(--radius-lg) 0 0;position:sticky;top:0;z-index:1;}
  .a11y-panel__title{color:#fff;}
  .a11y-panel__close{color:#fff;} .a11y-panel__close:hover{background:rgba(255,255,255,.22);color:#fff;}
  .a11y-field{gap:.35rem;}
  .a11y-field__label{font-size:.68rem;}
  .a11y-seg__btn{min-height:36px;font-size:.78rem;padding:0 .25rem;}
  .a11y-sw{display:grid;grid-template-columns:repeat(6,1fr);gap:.45rem .3rem;}
  .a11y-sw__btn{display:flex;flex-direction:column;align-items:center;gap:.2rem;padding:.2rem 0;border-radius:var(--radius);font-size:.62rem;color:var(--ink-3);min-height:44px;}
  .a11y-sw__dot{width:1.9rem;height:1.9rem;border-radius:50%;background:var(--c);border:2px solid var(--line-strong);box-shadow:inset 0 -3px 5px rgba(0,0,0,.08),0 1px 2px rgba(0,0,0,.15);
    transition:transform .15s var(--ease),box-shadow .15s var(--ease);position:relative;}
  .a11y-sw__btn:hover .a11y-sw__dot{transform:scale(1.12);}
  .a11y-sw__btn.is-on{color:var(--ink);font-weight:700;}
  .a11y-sw__btn.is-on .a11y-sw__dot{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-wash,rgba(0,0,0,.12)),0 0 0 5px var(--accent);transform:scale(1.05);}
  .a11y-sw__btn.is-on .a11y-sw__dot::after{content:"";position:absolute;left:50%;top:46%;width:.35rem;height:.7rem;border:solid var(--accent);border-width:0 2.5px 2.5px 0;transform:translate(-50%,-50%) rotate(45deg);}
  [data-tint="dark"] .a11y-sw__btn.is-on .a11y-sw__dot::after{border-color:#fff;}
  .a11y-tiles{display:grid;grid-template-columns:1fr 1fr;gap:.5rem;}
  .a11y-tile{display:grid;grid-template-columns:auto 1fr;grid-template-rows:auto auto;column-gap:.55rem;align-items:center;text-align:left;
    padding:.55rem .65rem;border-radius:var(--radius);background:var(--surface-2);border:1.5px solid var(--line);color:var(--ink-2);min-height:48px;
    transition:transform .15s var(--ease),background-color .15s var(--ease),border-color .15s var(--ease);}
  .a11y-tile svg{grid-row:1 / 3;width:1.6rem;height:1.6rem;}
  .a11y-tile__label{font-weight:700;font-size:.78rem;line-height:1.15;color:var(--ink);}
  .a11y-tile__state{font-size:.66rem;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-3);}
  .a11y-tile:hover:not(:disabled){transform:translateY(-1px);border-color:var(--accent);}
  .a11y-tile.is-on{background:var(--accent);border-color:var(--accent);color:var(--accent-ink);box-shadow:var(--shadow-1);}
  .a11y-tile.is-on .a11y-tile__label,.a11y-tile.is-on .a11y-tile__state{color:var(--accent-ink);}
  .a11y-tile:disabled{opacity:.5;cursor:not-allowed;}
  .a11y-loc .a11y-seg__btn{font-size:.72rem;}
  .a11y-loc{display:grid;grid-template-columns:1fr 1fr;gap:.55rem;padding-top:.6rem;border-top:1px dashed var(--line-strong);}
  @media (prefers-reduced-motion:reduce){.a11y-sw__dot,.a11y-tile{transition:none;}}
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
  fab.setAttribute("aria-label", t("a11y.settings"));
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
    /* Rebuild fresh from the current prefs every time — a game's own mute
       button (setTTS) can change prefs.tts while this panel sits closed,
       and the checkbox must reflect that next time the student opens it. */
    current.panel.replaceWith(build().panel);
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

export default { applyPrefs, speak, stopSpeaking, ttsEnabled, speakerButton, setTTS };
