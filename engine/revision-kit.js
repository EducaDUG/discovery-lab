/* ==========================================================================
   DISCOVERY LAB — REVISION KIT  (engine/revision-kit.js)

   Shared building blocks for every exam revision website (CLAUDE.md §17):
   helpers, progress badges, the interactive activity builders (sorter, match,
   ordering, answer builder), the practice-exam quiz, the real-photo tap-the-part
   widget, a small orbit-able Three.js stage, and the English/Spanish layer.

   Spanish: every English string a student can see goes through T() or the DOM
   pass translateDom(). A site supplies a dictionary { "English string": "Español" }
   with setDict(). Unknown strings are collected in window.__dlMissing so a site can
   be proven complete: it is not finished until that list is empty in Spanish mode.
   ========================================================================== */
import { getLang } from "./i18n.js?v=9";

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const rnd = (a, b) => a + Math.random() * (b - a);
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
export const reduced = () => {
  const a = document.documentElement.getAttribute("data-reduced-motion");
  return a === "on" || (a !== "off" && window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
};
export function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
export const shake = e => { e.classList.remove("shake"); void e.offsetWidth; e.classList.add("shake"); };
export const popIt = e => { e.classList.remove("pop"); void e.offsetWidth; e.classList.add("pop"); };

/* ---------------------------------------------------------------- language */
export const lang = () => getLang();
export const isES = () => getLang() === "es";
let DICT = {};
window.__dlMissing = window.__dlMissing || new Set();
window.__dlKeys = window.__dlKeys || new Set();
let VALS = new Set(); let quiet = false;
export function setDict(d) { DICT = d || {}; VALS = new Set(Object.values(DICT).map(v => v.replace(/\s+/g, " ").trim())); window.__dlMissing.clear(); }
/* initLang: in Spanish mode load the shared dictionary (engine/revision-es.js, built by tools/build-es.py) before anything renders */
export async function initLang() { if (getLang() === "es") { try { const m = await import("./revision-es.js?v=5"); setDict(m.ES); } catch (e) { console.warn("Spanish dictionary missing", e); } } }
/* T: translate one English string (exact match). English mode returns the input untouched. */
export function T(s) {
  if (s == null || s === "") return s;
  window.__dlKeys.add(s);
  if (getLang() !== "es") return s;
  const v = DICT[s];
  if (v !== undefined) return v;
  if (/[A-Za-z]{3}/.test(s) && !VALS.has(s)) window.__dlMissing.add(s);
  return s;
}
/* L: inline pair, for the odd string that is built from parts */
export const L = (en, es) => (getLang() === "es" ? es : en);
const norm = s => s.replace(/\s+/g, " ").trim();
const INLINE = new Set(["B", "EM", "I", "A", "SPAN", "SUP", "SUB", "KBD", "BR", "SMALL", "CODE", "STRONG", "U", "ABBR", "IMG"]);
const SKIP = new Set(["SCRIPT", "STYLE", "SVG", "CANVAS", "NOSCRIPT", "SELECT"]);
/* parts of the page built by JS (already translated through T) or by other engine modules (own dictionaries) are skipped by the DOM pass */
const SKIP_SEL = ".sorter,.pmatch,.order,.ans,.hz,.phscale,.mrs,.a11y,.a11y-panel,[id^=a11y],.lang-switch,#pBadges,#pHow,.stage3d,.hs__marks,.codes,.lab__hud,.hs__q,.hs__fb,.gx-credit,.quiz__opts,#qText,#qFb,.gg,.bz,.rn,.chips,.s3dbar,.sp__bar";
const SPLIT_SEL = ".gx-cta,.gx-nav,.gx-links,.crumbs__list,.site-foot__inner,.gx-progress__top,.site-head__inner,.gx-row,.gx-two,.lab__btns";
function isBlock(n) { return !n.matches(SPLIT_SEL) && [...n.children].every(c => INLINE.has(c.tagName)) && !!n.textContent.trim(); }
function textNodes(n, deep = true, out = []) { n.childNodes.forEach(c => { if (c.nodeType === 3) out.push(c); else if (deep && c.nodeType === 1 && !SKIP.has(c.tagName) && !c.matches(SKIP_SEL)) textNodes(c, true, out); }); return out; }
/* translateDom: walk the page. A "text block" (only inline children) is looked up by its normalised innerHTML; if that fails,
   each text node is looked up on its own, so blocks holding live numbers or ids still translate. */
export function translateDom(root = document.body) {
  const es = getLang() === "es", keys = window.__dlKeys, hasText = t => /[A-Za-z]{3}/.test(t);
  (function walk(n) {
    if (n.nodeType !== 1 || SKIP.has(n.tagName) || n.matches(SKIP_SEL) || n.closest(SKIP_SEL) || n.hasAttribute("data-no-t")) return;
    if (isBlock(n)) {
      const k = norm(n.innerHTML); keys.add(k);
      const v = es ? DICT[k] : undefined;
      if (v !== undefined) { n.innerHTML = v; return; }
      if (!es) { /* fragments are only a Spanish-mode fallback; they are not source strings */ return; }
      let bad = false;
      textNodes(n).forEach(tn => { const raw = tn.nodeValue, t = norm(raw); if (!hasText(t)) return; const tv = DICT[t]; if (tv !== undefined) tn.nodeValue = raw.replace(t, tv); else if (!VALS.has(t) && !/\d/.test(t)) bad = true; });
      if (bad && !quiet) window.__dlMissing.add(k);
      return;
    }
    textNodes(n, false).forEach(tn => { const raw = tn.nodeValue, t = norm(raw); if (!hasText(t)) return; keys.add(t); if (!es) return; const tv = DICT[t]; if (tv !== undefined) tn.nodeValue = raw.replace(t, tv); else if (!VALS.has(t) && !quiet) window.__dlMissing.add(t); });
    [...n.children].forEach(walk);
  })(root);
  const attrs = ["alt", "aria-label", "title", "placeholder"];
  $$("*", root).forEach(n => { if (n.matches(SKIP_SEL) || n.closest(SKIP_SEL)) return; attrs.forEach(a => { const v = n.getAttribute?.(a); if (v && hasText(v)) { keys.add(v); if (es) { const t = DICT[v]; if (t !== undefined) n.setAttribute(a, t); else if (!VALS.has(v) && !quiet) window.__dlMissing.add(v); } } }); });
  $$("option", root).forEach(o => { const t = norm(o.textContent); if (hasText(t)) { keys.add(t); if (es && DICT[t] !== undefined) o.textContent = DICT[t]; else if (es && !VALS.has(t) && !quiet) window.__dlMissing.add(t); } });
  if (es) { document.documentElement.lang = "es"; const t = DICT[document.title]; if (t) document.title = t; const m = $('meta[name="description"]'); if (m && DICT[m.content]) m.content = DICT[m.content]; }
  keys.add(document.title);
  const m = $('meta[name="description"]'); if (m) keys.add(m.content);
}


/* observeDom: dynamic text written by a lab (textContent / innerHTML) is translated after the fact; in English mode it only harvests keys */
export function observeDom() {
  if (window.__dlObs) return; const es = getLang() === "es"; const keys = window.__dlKeys;
  const tr = tn => { if (!tn.parentNode || tn.parentNode.closest?.(SKIP_SEL) || SKIP.has(tn.parentNode.tagName)) return; const raw = tn.nodeValue, t = norm(raw); if (!/[A-Za-z]{3}/.test(t)) return; keys.add(t); if (!es) return; const v = DICT[t]; if (v !== undefined) tn.nodeValue = raw.replace(t, v); };
  window.__dlObs = new MutationObserver(ms => { for (const m of ms) { if (m.type === "characterData") tr(m.target); else m.addedNodes.forEach(n => { if (n.nodeType === 3) tr(n); else if (n.nodeType === 1) { quiet = true; try { translateDom(n); } finally { quiet = false; } } }); } });
  window.__dlObs.observe(document.body, { childList: true, subtree: true, characterData: true });
}

/* ---------------------------------------------------------------- feedback bits */
export function burstAt(host, x, y, color = "#3fd9a0") {
  if (reduced() || !host.animate) return;
  if (getComputedStyle(host).position === "static") host.style.position = "relative";
  for (let i = 0; i < 10; i++) {
    const d = el("span"); const a = (i / 10) * Math.PI * 2, r = rnd(24, 48);
    d.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:7px;height:7px;border-radius:50%;background:${color};pointer-events:none;z-index:5`;
    host.appendChild(d);
    d.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r}px) scale(.2)`, opacity: 0 }], { duration: 600, easing: "ease-out" }).onfinish = () => d.remove();
  }
}
export function burstOn(node, color) { const h = node.offsetParent || node.parentElement; const r = node.getBoundingClientRect(), hr = h.getBoundingClientRect(); burstAt(h, r.left - hr.left + r.width / 2, r.top - hr.top + r.height / 2, color); }
export function toast(text) { const t = el("div", "dl-toast", text); t.setAttribute("role", "status"); document.body.appendChild(t); setTimeout(() => t.remove(), 2600); }

/* ---------------------------------------------------------------- progress badges */
export function initProgress({ store, badges, lessonKeys }) {
  const P = { prog: { lessons: {}, labs: {}, quiz: false } };
  try { const s = JSON.parse(localStorage.getItem(store) || "null"); if (s) Object.assign(P.prog, s); } catch (e) { /* storage may be blocked */ }
  const list = badges(P.prog);
  const save = () => { try { localStorage.setItem(store, JSON.stringify(P.prog)); } catch (e) { /* ignore */ } };
  P.render = () => {
    const on = list.filter(b => b[1]()).length, pct = Math.round(on / list.length * 100);
    $("#pPct").textContent = pct + "%"; $("#pBar").style.width = pct + "%";
    $("#pBadges").innerHTML = list.map(b => `<span class="${b[1]() ? "on" : ""}">${T(b[0])}</span>`).join("");
    $("#pHow").innerHTML = list.map(b => `<li class="${b[1]() ? "on" : ""}"><b>${T(b[0])}:</b> ${T(b[2])}</li>`).join("");
  };
  P.award = key => { if (!P.prog.labs[key]) { P.prog.labs[key] = true; save(); P.render(); toast(T("Badge earned!") + " " + T("Mastery is now") + " " + $("#pPct").textContent); } };
  P.save = save;
  $$(".gx-done").forEach(b => {
    const n = b.dataset.lesson;
    const sync = () => { b.setAttribute("aria-pressed", P.prog.lessons[n] ? "true" : "false"); b.textContent = P.prog.lessons[n] ? T("Lesson complete") : T("Mark lesson complete"); };
    sync();
    b.addEventListener("click", () => { P.prog.lessons[n] = !P.prog.lessons[n]; save(); sync(); P.render(); if (P.prog.lessons[n]) { popIt(b); toast(T("Lesson") + " " + n + " " + T("complete!")); } });
  });
  return P;
}

/* ---------------------------------------------------------------- flip cards */
export function flipCards(host, cards, cols) {
  host.innerHTML = cards.map(m => `<button class="mcard" style="--c:${m[3]}" aria-pressed="false" aria-label="${T(m[1])}: ${T("tap to flip")}"><span class="mcard__in"><span class="mcard__f"><i>${m[0]}</i><span>${T(m[1])}</span></span><span class="mcard__b"><b>${T(m[1])}</b>${T(m[2])}</span></span></button>`).join("");
  $$(".mcard", host).forEach(c => c.addEventListener("click", () => { const o = c.classList.toggle("is-open"); c.setAttribute("aria-pressed", o); }));
  if (cols) host.style.setProperty("--cols", cols);
}

/* ---------------------------------------------------------------- activity builders */
export function makeSorter(host, items, opts, perfect) {
  items = items.map(it => [T(it[0]), it[1], T(it[2])]); opts = opts.map(T);
  let order, i, score, answered;
  function start() { order = shuffle(items); i = 0; score = 0; render(); }
  function render() {
    host.innerHTML = "";
    if (i >= order.length) {
      host.append(el("div", "sorter__card", `${T("Done! You scored")} ${score} / ${order.length}.`), el("div", "sorter__fb", score === order.length ? T("Perfect round!") : T("Have another go to lock it in.")));
      const b = el("button", "btn", T("Play again")); b.addEventListener("click", start); host.append(b);
      if (score === order.length && perfect) perfect();
      return;
    }
    answered = false;
    const it = order[i];
    host.append(el("div", "sorter__meta", `<span>${T("Item")} ${i + 1} ${T("of")} ${order.length}</span><span>${T("Score")} ${score}</span>`));
    const card = el("div", "sorter__card", it[0]); host.append(card);
    const row = el("div", "sorter__btns");
    const fb = el("div", "sorter__fb"); fb.setAttribute("aria-live", "polite");
    opts.forEach((o, k) => {
      const b = el("button", "btn btn--ghost", o);
      b.addEventListener("click", () => {
        if (answered) return; answered = true;
        const ok = k === it[1];
        if (ok) { score++; popIt(card); burstOn(card, "#3fd9a0"); } else shake(card);
        $$("button", row).forEach((x, j) => { x.disabled = true; if (j === it[1]) x.classList.add("ok"); });
        fb.innerHTML = (ok ? `<b>${T("Correct!")}</b> ` : `<b>${T("Not quite.")}</b> ${T("The answer is")} <b>${opts[it[1]]}</b>. `) + it[2];
        const nx = el("button", "btn", i + 1 >= order.length ? T("See score") : T("Next")); nx.addEventListener("click", () => { i++; render(); });
        const w = el("div"); w.append(nx); fb.append(w); nx.focus();
      });
      row.append(b);
    });
    host.append(row, fb);
  }
  start();
}

export function makeMatch(host, pairs, done) {
  pairs = pairs.map(p => [T(p[0]), T(p[1])]);
  const rights = shuffle(pairs.map((p, k) => [p[1], k]));
  let selL = null, matched = 0;
  const msg = el("p", "pmatch__msg"); msg.setAttribute("aria-live", "polite");
  const Ls = [];
  pairs.forEach((p, k) => {
    const l = el("button", "", p[0]); l.dataset.k = k; Ls.push(l);
    const r = el("button", "", rights[k][0]); r.dataset.k = rights[k][1];
    host.append(l, r);
    l.addEventListener("click", () => { if (l.classList.contains("ok")) return; Ls.forEach(x => x.classList.remove("sel")); selL = l; l.classList.add("sel"); msg.textContent = T("Now tap its match on the right."); });
    r.addEventListener("click", () => {
      if (r.classList.contains("ok")) return;
      if (!selL) { msg.textContent = T("Tap an item on the left first."); shake(r); return; }
      if (selL.dataset.k === r.dataset.k) {
        selL.classList.remove("sel"); selL.classList.add("ok"); r.classList.add("ok"); popIt(r); burstOn(r, "#3fd9a0"); matched++; selL = null;
        msg.textContent = matched === pairs.length ? T("All matched! Well done.") : T("Correct match!");
        if (matched === pairs.length && done) done();
      } else { shake(r); shake(selL); msg.textContent = T("Not that one. Think about what each does and try again."); }
    });
  });
  host.append(msg);
}

export function makeAnswer(host, statements, checkBtn, resetBtn, out) {
  const shuf = shuffle(statements.map(s => [T(s[0]), s[1]]));
  shuf.forEach(s => { const b = el("button", "", s[0]); b.setAttribute("aria-pressed", "false"); b._ok = s[1]; b.addEventListener("click", () => { if (b.dataset.locked) return; b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true"); }); host.append(b); });
  checkBtn.addEventListener("click", () => {
    let good = 0, bad = 0; const total = statements.filter(s => s[1]).length;
    $$("button", host).forEach(b => {
      const on = b.getAttribute("aria-pressed") === "true"; b.classList.remove("ok", "no", "miss"); b.dataset.locked = "1";
      if (on && b._ok) { good++; b.classList.add("ok"); } else if (on) { bad++; b.classList.add("no"); } else if (b._ok) b.classList.add("miss");
    });
    out.textContent = `${T("You picked")} ${good} ${T("of")} ${total} ${T("key points and")} ${bad} ${T("that do not belong (green = correct, red = wrong, dashed = missed).")} ${T("Answer score:")} ${Math.max(0, good - bad)} / ${total}.`;
  });
  resetBtn.addEventListener("click", () => { $$("button", host).forEach(b => { delete b.dataset.locked; b.setAttribute("aria-pressed", "false"); b.classList.remove("ok", "no", "miss"); }); out.textContent = ""; });
}

export function makeOrder(host, STEPS) {
  STEPS = STEPS.map(s => [T(s[0]), T(s[1])]);
  let next;
  function build() {
    host.innerHTML = ""; next = 0;
    const placed = el("div", "placed"); placed.style.gridTemplateColumns = `repeat(${Math.min(STEPS.length, 5)},1fr)`;
    STEPS.forEach((s, k) => placed.append(el("div", "slot", `<b>${k + 1}</b>${T("Step")} ${k + 1}`)));
    host.append(placed);
    const msg = el("p", "order__msg", T("Tap the steps in the right order, first step first.")); msg.setAttribute("aria-live", "polite");
    shuffle(STEPS.map((s, k) => k)).forEach(k => {
      const b = el("button", "", STEPS[k][0]);
      b.addEventListener("click", () => {
        if (k === next) {
          const slot = placed.children[next]; slot.className = "slot ok"; slot.innerHTML = `<b>${STEPS[k][0]}</b>${STEPS[k][1]}`; b.disabled = true; popIt(slot); next++;
          msg.textContent = next === STEPS.length ? T("Correct order!") : T("Good. What comes next?");
          if (next === STEPS.length) { burstOn(slot, "#3fd9a0"); const r = el("button", "btn btn--ghost", T("Shuffle again")); r.addEventListener("click", build); host.append(r); }
        } else { shake(b); msg.textContent = T("Not yet. Think about what has to happen first."); }
      });
      host.append(b);
    });
    host.append(msg);
  }
  build();
}

/* ---------------------------------------------------------------- canvas helpers */
export function rafLoop(cv, step) {
  const ctx = cv.getContext("2d"); let last = performance.now(), run = true;
  new IntersectionObserver(es => { run = es[0].isIntersecting; if (run) last = performance.now(); }).observe(cv);
  (function tick(now) { requestAnimationFrame(tick); if (!run) return; const dt = Math.min(0.05, (now - last) / 1000); last = now; step(ctx, dt); })(performance.now());
}
export function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

/* ---------------------------------------------------------------- 3D stage (vendored Three.js, orbit on drag, calm fallback) */
export function make3D(host, { cam = [0, 1.2, 6], target = [0, 0, 0], fov = 45, auto = 0.25, bg = null, onFrame, onPick, hint, real = false } = {}) {
  const THREE = window.THREE;
  let gl = null;
  try { const c = document.createElement("canvas"); gl = !!THREE && (c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { gl = null; }
  if (!gl) { host.classList.add("stage3d--none"); host.innerHTML = `<p class="stage3d__fallback">${T("3D view is not available on this device. Everything else on the page still works.")}</p>`; return null; }
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: !bg });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
  host.innerHTML = ""; host.append(renderer.domElement);
  const scene = new THREE.Scene(); if (bg) scene.background = new THREE.Color(bg);
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xdff3ff, 0x20301f, real ? 0.35 : 0.9));
  const sun = new THREE.DirectionalLight(0xffffff, real ? 1.1 : 0.9); sun.position.set(4, 8, 5); scene.add(sun);
  if (real) {
    /* hyper-real mode: ACES tone mapping, soft shadows and a procedural studio environment for glass, metal and liquid */
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.85;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
    const sc = sun.shadow.camera; sc.left = -9; sc.right = 9; sc.top = 9; sc.bottom = -9; sc.near = 1; sc.far = 40;
    try {
      const es = new THREE.Scene(); es.background = new THREE.Color(0x1a2433);
      const box = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 40), new THREE.MeshBasicMaterial({ side: THREE.BackSide, color: 0x2b3a52 })); es.add(box);
      [[0, 9, 0, 14, 0.5, 14, 0xffffff, 2.2], [-16, 4, 0, 0.5, 8, 12, 0xcfe6ff, 1.6], [16, 4, 4, 0.5, 8, 10, 0xffe3c0, 1.6], [0, 3, -16, 14, 6, 0.5, 0xffffff, 1.2]].forEach(p => { const m = new THREE.Mesh(new THREE.BoxGeometry(p[3], p[4], p[5]), new THREE.MeshBasicMaterial({ color: new THREE.Color(p[6]).multiplyScalar(p[7]) })); m.position.set(p[0], p[1], p[2]); es.add(m); });
      const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(es, 0.04).texture; pm.dispose();
    } catch (e) { /* environment is a nicety; the scene still renders without it */ }
  }
  const S = { THREE, scene, camera, renderer, host, az: 0, polar: 0, dist: 1, zoom: 1, clock: 0, spin: auto, target: new THREE.Vector3(...target), running: true, dragging: false };
  const base = new THREE.Vector3(...cam).sub(S.target); const baseLen = base.length(); const baseAz = Math.atan2(base.x, base.z), basePol = Math.asin(base.y / baseLen);
  function place() { const az = baseAz + S.az, pol = clamp(basePol + S.polar, -0.2, 1.3), d = baseLen * S.zoom; camera.position.set(S.target.x + d * Math.sin(az) * Math.cos(pol), S.target.y + d * Math.sin(pol), S.target.z + d * Math.cos(az) * Math.cos(pol)); camera.lookAt(S.target); }
  function size() { const w = host.clientWidth || 300, h = host.clientHeight || 300; renderer.setSize(w, h, false); renderer.domElement.style.width = "100%"; renderer.domElement.style.height = "100%"; camera.aspect = w / h; camera.updateProjectionMatrix(); }
  new ResizeObserver(size).observe(host); size();
  /* pointer: horizontal drag turns the model; vertical movement is left to the page so phones can still scroll */
  const cv = renderer.domElement; cv.style.touchAction = "pan-y"; cv.style.cursor = "grab";
  let px = 0, py = 0, travel = 0, down = false;
  cv.addEventListener("pointerdown", e => { down = true; travel = 0; px = e.clientX; py = e.clientY; S.dragging = true; });
  addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - px, dy = e.clientY - py; px = e.clientX; py = e.clientY; travel += Math.abs(dx) + Math.abs(dy); if (e.pointerType === "mouse") S.polar = clamp(S.polar + dy * 0.005, -0.5, 0.9); S.az -= dx * 0.008; });
  addEventListener("pointerup", () => { down = false; S.dragging = false; });
  cv.addEventListener("wheel", e => { if (!e.ctrlKey && !e.shiftKey) return; e.preventDefault(); S.zoom = clamp(S.zoom * (1 + e.deltaY * 0.001), 0.6, 1.6); }, { passive: false });
  cv.addEventListener("click", e => { if (travel > 6 || !onPick) return; const r = cv.getBoundingClientRect(); const v = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); const rc = new THREE.Raycaster(); rc.setFromCamera(v, camera); onPick(rc); });
  /* keyboard: arrow keys turn it, + and - zoom */
  host.tabIndex = 0;
  host.addEventListener("keydown", e => { if (e.key === "ArrowLeft") S.az += 0.15; else if (e.key === "ArrowRight") S.az -= 0.15; else if (e.key === "ArrowUp") S.polar = clamp(S.polar + 0.1, -0.5, 0.9); else if (e.key === "ArrowDown") S.polar = clamp(S.polar - 0.1, -0.5, 0.9); else if (e.key === "+") S.zoom = clamp(S.zoom * 0.9, 0.6, 1.6); else if (e.key === "-") S.zoom = clamp(S.zoom * 1.1, 0.6, 1.6); else return; e.preventDefault(); });
  if (hint) { const h = el("p", "stage3d__hint", T(hint)); host.after(h); }
  let last = performance.now();
  new IntersectionObserver(es => { S.running = es[0].isIntersecting; last = performance.now(); }).observe(host);
  (function loop(now) {
    requestAnimationFrame(loop); if (!S.running) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; S.clock += dt;
    if (!S.dragging && !reduced()) S.az += S.spin * dt;
    place(); if (onFrame) onFrame(dt, S.clock, S); renderer.render(scene, camera);
  })(performance.now());
  return S;
}
/* small helpers for building 3D scenes from primitives */
export function mat(THREE, color, o = {}) { return new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.5, metalness: 0.05 }, o)); }
export function glowTexture(THREE, rgb = "255,255,255") { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"); const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(1, `rgba(${rgb},0)`); x.fillStyle = g; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t; }
export function labelSprite(THREE, text, color = "#ffffff") { const c = document.createElement("canvas"); c.width = 256; c.height = 64; const x = c.getContext("2d"); x.fillStyle = "rgba(0,0,0,.65)"; x.beginPath(); x.roundRect ? x.roundRect(4, 8, 248, 48, 24) : x.rect(4, 8, 248, 48); x.fill(); x.fillStyle = color; x.font = "bold 26px sans-serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(text, 128, 33); const t = new THREE.CanvasTexture(c); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false })); s.scale.set(1.6, 0.4, 1); return s; }

/* ---------------------------------------------------------------- real-photo tap-the-part widget */
export function initHotspots(SETS, first, award) {
  Object.values(SETS).forEach(s => { T(s.name); T(s.alt); s.tasks.forEach(t => { T(t[0]); T(t[3]); T(t[4]); }); }); /* register every string for translation */
  const done = {}; let cur = first, ti = 0;
  const tabs = $("#hsTabs"), img = $("#hsImg"), marks = $("#hsMarks"), q = $("#hsQ"), fb = $("#hsFb");
  Object.keys(SETS).forEach(k => { const b = el("button", "", T(SETS[k].name)); b.setAttribute("role", "tab"); b.dataset.k = k; b.addEventListener("click", () => load(k)); tabs.append(b); });
  function load(k) { cur = k; ti = 0; marks.innerHTML = ""; fb.textContent = ""; $$("button", tabs).forEach(b => b.setAttribute("aria-selected", b.dataset.k === k)); img.src = SETS[k].img; img.alt = T(SETS[k].alt); prompt(); }
  function prompt() { const set = SETS[cur]; q.textContent = ti < set.tasks.length ? `${ti + 1} ${T("of")} ${set.tasks.length}: ${T(set.tasks[ti][0])}` : T("All found on this photo! Try another photo."); }
  img.addEventListener("click", e => {
    const set = SETS[cur]; if (ti >= set.tasks.length) return;
    const r = img.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height, t = set.tasks[ti];
    if (Math.hypot(x - t[1], (y - t[2]) * r.height / r.width) < 0.075) {
      const m = el("div", "hs__mark", `<b>${T(t[3])}</b>`); m.style.left = t[1] * 100 + "%"; m.style.top = t[2] * 100 + "%"; marks.append(m);
      fb.innerHTML = `<b>${T(t[3])}.</b> ${T(t[4])}`; ti++; prompt();
      if (ti >= set.tasks.length) { done[cur] = true; if (Object.keys(SETS).every(k => done[k])) award("photos"); }
    } else {
      const ring = el("div", "hs__ring"); ring.style.left = x * 100 + "%"; ring.style.top = y * 100 + "%"; marks.append(ring); setTimeout(() => ring.remove(), 800);
      fb.textContent = T("Not there. Look again:") + " " + T(t[0]).toLowerCase(); shake(q);
    }
  });
  load(first);
}

export function loadCredits(node) {
  fetch("photos/credits.json").then(r => r.json()).then(c => {
    node.innerHTML = T("Photo credits (all from Wikimedia Commons):") + " " + Object.keys(c).map(k => `<a href="${c[k].page}" target="_blank" rel="noopener noreferrer">${c[k].file.replace(/\.[a-z]+$/i, "")}</a> ${T("by")} ${c[k].author}, <a href="${c[k].licenseUrl}" target="_blank" rel="noopener noreferrer">${c[k].license}</a>`).join("; ") + ".";
  }).catch(() => { /* credits are a progressive enhancement */ });
}

/* ---------------------------------------------------------------- practice exam */
export function initQuiz({ BANK, labels, first, award, P }) {
  const sel = new Set(labels.map((l, k) => k + first));
  const pickHost = $("#quizPick"); pickHost.className = "gx-row qpick";
  labels.forEach((l, k) => { const b = el("button", "", `L${k + first} ${T(l)}`); b.setAttribute("aria-pressed", "true"); b.addEventListener("click", () => { const on = !sel.has(k + first); if (!on && sel.size === 1) return; on ? sel.add(k + first) : sel.delete(k + first); b.setAttribute("aria-pressed", on); }); pickHost.append(b); });
  BANK.forEach(r => r.slice(1).forEach(T)); /* register every string so a missing translation is found without playing every question */
  let qs = [], idx = 0, score = 0, streak = 0, done = 0; const quizEl = $("#quiz"), tpl = quizEl.innerHTML, N = 20;
  function build() {
    quizEl.innerHTML = tpl;
    const pool = BANK.filter(b => sel.has(b[0]));
    qs = shuffle(pool).slice(0, N).map(r => ({ lesson: r[0], q: T(r[1]), opts: shuffle([{ t: T(r[2]), ok: true }, { t: T(r[3]) }, { t: T(r[4]) }, { t: T(r[5]) }]), ex: T(r[6]), picked: -1 }));
    idx = 0; score = 0; streak = 0; done = 0;
    $("#qTot").textContent = qs.length; $("#examSub").textContent = `${qs.length} ${T("questions drawn at random from a bank of")} ${BANK.length}. ${T("Answer orders reshuffle every time.")}`;
    translateDom(quizEl);
    $("#qPrev").addEventListener("click", () => { if (idx > 0) { idx--; show(); } });
    $("#qNext").addEventListener("click", () => { if (idx < qs.length - 1) { idx++; show(); } else if (done === qs.length) finish(); else { const f = $("#qFb"); f.hidden = false; f.className = "quiz__fb no"; f.textContent = T("Answer every question first, then you can see your results."); } });
    show();
  }
  function stat() { $("#qScore").textContent = score; $("#qDone").textContent = done; $("#qStreak").textContent = streak >= 3 ? T("Streak") + " " + streak : ""; $("#qProg").style.width = (done / qs.length * 100) + "%"; }
  function show() {
    const q = qs[idx]; if (!q) return;
    $("#qNum").textContent = idx + 1; $("#qText").textContent = q.q; stat();
    const box = $("#qOpts"); box.innerHTML = ""; const fb = $("#qFb"); fb.hidden = true;
    function paint() { $$("button", box).forEach((b, k) => { b.disabled = true; if (q.opts[k].ok) b.classList.add("ok"); else if (k === q.picked) b.classList.add("no"); }); const ok = q.opts[q.picked].ok; fb.hidden = false; fb.className = "quiz__fb " + (ok ? "ok" : "no"); fb.innerHTML = (ok ? `<b>${T("Correct.")}</b> ` : `<b>${T("Not quite.")}</b> ${T("The right answer is highlighted.")} `) + q.ex; }
    q.opts.forEach((o, k) => { const b = el("button", "", o.t); b.addEventListener("click", () => { if (q.picked >= 0) return; q.picked = k; done++; if (o.ok) { score++; streak++; } else streak = 0; paint(); stat(); if (o.ok) { popIt(b); burstOn(b, "#3fd9a0"); } else shake(b); }); box.append(b); });
    if (q.picked >= 0) paint();
    $("#qPrev").disabled = idx === 0; $("#qNext").textContent = idx === qs.length - 1 ? T("See my results") : T("Next");
  }
  function finish() {
    const pct = Math.round(score / qs.length * 100), by = {};
    qs.forEach(q => { by[q.lesson] = by[q.lesson] || [0, 0]; by[q.lesson][1]++; if (q.opts[q.picked].ok) by[q.lesson][0]++; });
    const weak = Object.keys(by).filter(k => by[k][0] / by[k][1] < 0.7).map(k => `<li>${T("Lesson")} ${k}, ${T(labels[k - first])}: ${by[k][0]} / ${by[k][1]}. <a href="#l${k}">${T("Revise it")}</a></li>`);
    if (pct >= 80 && !P.prog.quiz) { P.prog.quiz = true; P.save(); P.render(); toast(T("Badge earned!") + " " + T("Exam 80%")); }
    quizEl.innerHTML = `<div class="qend"><h3>${pct}%</h3><p>${score} ${T("out of")} ${qs.length} ${T("correct.")} ${pct >= 80 ? T("Excellent work, you are exam ready on this set!") : pct >= 60 ? T("Good progress. Review the lessons below and try again.") : T("Keep going. Use the lessons and labs, then take a new exam.")}</p>${weak.length ? `<p><b>${T("Revisit these:")}</b></p><ul>${weak.join("")}</ul>` : `<p>${T("No weak spots on this set.")}</p>`}<button class="btn" id="qAgain">${T("Take a new exam")}</button></div>`;
    $("#qAgain").addEventListener("click", build);
  }
  $("#quizNew").addEventListener("click", build);
  build();
}

/* ---------------------------------------------------------------- booklet download button language */
export function wireBooklet(base) {
  $$("a[data-booklet]").forEach(a => { const f = `${base}-${isES() ? "ES" : "EN"}.pdf`; a.href = f; a.setAttribute("download", f); });
}
