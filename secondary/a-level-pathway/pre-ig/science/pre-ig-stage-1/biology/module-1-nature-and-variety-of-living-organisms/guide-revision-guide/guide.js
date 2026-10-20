/* Exam Revision Website: all interactive behaviour. Plain ES module, vendored Three.js (window.THREE), no network. */
import { BANK } from "./quiz-data.js?v=2";

const THREE = window.THREE;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rnd = (a, b) => a + Math.random() * (b - a);
const shuffle = a => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const reduced = () => {
  const a = document.documentElement.getAttribute("data-reduced-motion");
  return a === "on" || (a !== "off" && window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
};
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

/* little burst of dots at a point inside a positioned host (skipped under reduced motion) */
function burstAt(host, x, y, color = "#3fd9a0") {
  if (reduced() || !host.animate) return;
  const cs = getComputedStyle(host); if (cs.position === "static") host.style.position = "relative";
  for (let i = 0; i < 10; i++) {
    const d = el("span"); const a = (i / 10) * Math.PI * 2, r = rnd(24, 48);
    d.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:7px;height:7px;border-radius:50%;background:${color};pointer-events:none;z-index:5`;
    host.appendChild(d);
    d.animate([{ transform: "translate(-50%,-50%) scale(1)", opacity: 1 }, { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r}px) scale(.2)`, opacity: 0 }], { duration: 600, easing: "ease-out" }).onfinish = () => d.remove();
  }
}
const shake = e => { e.classList.remove("shake"); void e.offsetWidth; e.classList.add("shake"); };
const popIt = e => { e.classList.remove("pop"); void e.offsetWidth; e.classList.add("pop"); };

/* ---------------------------------------------------------------- progress */
const STORE = "dl-living-orgs-revision-v1";
let prog = { levels: { 1: false, 2: false, 3: false }, labs: { life: false, insp: false, fung: false, key: false }, quiz: false };
try { const s = JSON.parse(localStorage.getItem(STORE) || "null"); if (s) prog = Object.assign(prog, s); } catch (e) { /* storage may be blocked */ }
const BADGES = [["L1", () => prog.levels[1]], ["L2", () => prog.levels[2]], ["L3", () => prog.levels[3]],
  ["Living Cell", () => prog.labs.life], ["Inspector", () => prog.labs.insp], ["Digestion", () => prog.labs.fung], ["Detective", () => prog.labs.key], ["Exam", () => prog.quiz]];
function saveProg() { try { localStorage.setItem(STORE, JSON.stringify(prog)); } catch (e) { /* ignore */ } }
function renderProgress() {
  const on = BADGES.filter(b => b[1]()).length;
  const pct = Math.round(on / BADGES.length * 100);
  $("#pPct").textContent = pct + "%"; $("#pBar").style.width = pct + "%";
  $("#pBadges").innerHTML = BADGES.map(b => `<span class="${b[1]() ? "on" : ""}">${b[0]}</span>`).join("");
  $$(".gx-done").forEach(b => { const l = b.dataset.level; b.setAttribute("aria-pressed", prog.levels[l]); b.textContent = prog.levels[l] ? "Level complete" : "Mark level complete"; });
}
function award(lab) { if (!prog.labs[lab]) { prog.labs[lab] = true; saveProg(); renderProgress(); } }
$$(".gx-done").forEach(b => b.addEventListener("click", () => { const l = b.dataset.level; prog.levels[l] = !prog.levels[l]; saveProg(); renderProgress(); popIt(b); }));
renderProgress();

/* ---------------------------------------------------------------- LEVEL 1: flip cards */
const MRS = [
  ["M", "Movement", "#2f9e4f", "A change of position or place by the organism or a part of it.", "Animals move their whole body. Plants turn leaves toward light (tropism)."],
  ["R", "Respiration", "#2f7dd1", "Chemical reactions in cells that release energy from nutrients such as glucose.", "Glucose + oxygen &rarr; carbon dioxide + water + energy"],
  ["S", "Sensitivity", "#8a4fc0", "Detecting changes (stimuli) around or inside you and responding.", "A hand pulling away from heat; roots growing toward water."],
  ["C", "Control", "#c9791b", "Keeping internal conditions stable (homeostasis).", "Body temperature held near 37&deg;C; <i>Amoeba</i> pumping out extra water."],
  ["G", "Growth", "#12998a", "A permanent increase in size and dry mass (more cells, bigger cells, or both).", "A seedling becoming a plant; a puppy becoming a dog."],
  ["R", "Reproduction", "#c43a52", "Producing new individuals of the same species.", "Sexual (gametes fuse) or asexual (binary fission, cloning)."],
  ["E", "Excretion", "#d1641c", "Removing the toxic waste of metabolism made inside cells.", "Carbon dioxide from respiration; urea from breaking down amino acids."],
  ["N", "Nutrition", "#5b6fd6", "Taking in materials for energy, growth and development.", "Autotrophs make food (photosynthesis). Heterotrophs eat other organisms."]
];
$("#mrsGrid").innerHTML = MRS.map((m, i) => `<button class="mcard" style="--c:${m[2]}" aria-pressed="false" aria-label="${m[1]}: press to flip"><span class="mcard__in"><span class="mcard__f"><i>${m[0]}</i><span>${m[1]}</span></span><span class="mcard__b"><b>${m[1]}</b>${m[3]}<br><em>${m[4]}</em></span></span></button>`).join("");
$$(".mcard").forEach(c => c.addEventListener("click", () => { const o = c.classList.toggle("is-open"); c.setAttribute("aria-pressed", o); }));

/* excretion vs egestion sorter */
const SORT = [
  ["Carbon dioxide breathed out", "ex", "CO&#8322; is made in cells by respiration, so removing it is excretion."],
  ["Faeces", "eg", "Faeces are mostly undigested food that never entered a cell: egestion."],
  ["Urea in urine", "ex", "Urea is made when cells break down amino acids: excretion."],
  ["Undigested husks of corn", "eg", "They pass through the gut without being absorbed: egestion."],
  ["Sweat (water, salts, a little urea)", "ex", "These substances came from cells and blood: excretion."],
  ["Plant fibre (cellulose) humans cannot digest", "eg", "Never absorbed into cells, so it leaves by egestion."]
];
const sort = { order: [], i: 0, score: 0, streak: 0, answered: false };
function sortRender() {
  const h = $("#sorter");
  if (sort.i >= sort.order.length) {
    h.innerHTML = `<div class="sorter__card">You scored ${sort.score} / ${sort.order.length}</div><button class="btn" id="sortAgain">Play again</button>`;
    $("#sortAgain").onclick = sortStart; return;
  }
  const it = sort.order[sort.i];
  h.innerHTML = `<div class="sorter__meta"><span>Card ${sort.i + 1} of ${sort.order.length}</span><span>Streak ${sort.streak}</span></div>
    <div class="sorter__card" id="sCard">${it[0]}</div>
    <div class="sorter__btns"><button class="btn" data-a="ex">Excretion</button><button class="btn btn--ghost" data-a="eg">Egestion</button></div>
    <p class="sorter__fb" id="sFb"></p>`;
  sort.answered = false;
  $$(".sorter__btns button", h).forEach(b => b.onclick = () => sortAnswer(b));
}
function sortAnswer(b) {
  if (sort.answered) return; sort.answered = true;
  const it = sort.order[sort.i], ok = b.dataset.a === it[1], card = $("#sCard");
  if (ok) { sort.score++; sort.streak++; popIt(card); const r = card.getBoundingClientRect(), hr = $("#sorter").getBoundingClientRect(); burstAt($("#sorter"), r.left - hr.left + r.width / 2, r.top - hr.top + r.height / 2); }
  else { sort.streak = 0; shake(card); }
  $("#sFb").innerHTML = `<b>${ok ? "Correct." : "Not quite."}</b> ${it[2]} <button class="btn btn--ghost" id="sNext">${sort.i + 1 < sort.order.length ? "Next card" : "See score"}</button>`;
  $("#sNext").onclick = () => { sort.i++; sortRender(); };
  $("#sNext").focus({ preventScroll: true });
}
function sortStart() { sort.order = shuffle(SORT); sort.i = 0; sort.score = 0; sort.streak = 0; sortRender(); }
sortStart();

/* ---------------------------------------------------------------- LEVEL 2: pathogen matching */
const PATH = [["<i>Plasmodium</i> (protoctist)", "Malaria"], ["<i>Pneumococcus</i> (bacterium)", "Pneumonia"], ["Tobacco mosaic virus", "Mottled, stunted tobacco leaves"], ["<i>Tinea pedis</i> (fungus)", "Athlete&rsquo;s foot"]];
(function pathogenMatch() {
  const h = $("#pmatch"); let sel = null, done = 0;
  const right = shuffle(PATH.map((p, i) => [p[1], i]));
  h.innerHTML = PATH.map((p, i) => `<button data-l="${i}">${p[0]}</button>`).join("") + "";
  const lefts = $$("button", h);
  // build second column as a separate set appended after (grid fills row by row)
  const rBtns = right.map(r => { const b = el("button", "", r[0]); b.dataset.r = r[1]; return b; });
  h.innerHTML = ""; for (let i = 0; i < 4; i++) { h.appendChild(lefts[i]); h.appendChild(rBtns[i]); }
  const msg = el("p", "pmatch__msg", "Pick a pathogen, then its disease."); h.appendChild(msg);
  lefts.forEach(b => b.onclick = () => { if (b.classList.contains("ok")) return; lefts.forEach(x => x.classList.remove("sel")); b.classList.add("sel"); sel = +b.dataset.l; });
  rBtns.forEach(b => b.onclick = () => {
    if (b.classList.contains("ok")) return;
    if (sel === null) { msg.textContent = "Choose a pathogen on the left first."; shake(b); return; }
    if (+b.dataset.r === sel) { b.classList.add("ok"); const l = lefts[sel]; l.classList.remove("sel"); l.classList.add("ok"); sel = null; done++; popIt(b); msg.textContent = done === 4 ? "All matched. Note the four different groups: protoctist, bacterium, virus and fungus." : "Correct."; }
    else { shake(b); msg.textContent = "Not that one. Think about which organism causes it."; }
  });
})();

/* ---------------------------------------------------------------- LEVEL 3: contractile vacuole */
(function vacuole() {
  const body = $("#vacBody"), vac = $("#vacVac"), drops = $("#vacDrops"), msg = $("#vacMsg");
  const dil = $("#vacDil"), pump = $("#vacPump"), rate = $("#vacRate"), volT = $("#vacVol");
  let vol = 100, burst = false, ph = 0;
  const dots = []; for (let i = 0; i < 14; i++) { const c = document.createElementNS("http://www.w3.org/2000/svg", "circle"); c.setAttribute("r", 3); c.setAttribute("fill", "#2f7dd1"); drops.appendChild(c); dots.push({ c, a: rnd(0, 6.28), d: rnd(0, 1) }); }
  function reset() { vol = 100; burst = false; body.setAttribute("opacity", 1); msg.textContent = ""; }
  $("#vacReset").onclick = reset;
  setInterval(() => {
    const d = +dil.value; rate.textContent = pump.checked ? d : 0;
    if (!burst) {
      if (pump.checked) vol += (100 - vol) * 0.15; else vol += d * 0.45;
      if (vol >= 165) { burst = true; msg.textContent = "The cell has burst! Without the pump, water floods in."; }
    } else vol = Math.max(0, vol - 2);
    ph += 0.12 * (pump.checked ? d / 4 : 0);
    const s = Math.sqrt(vol / 100);
    body.setAttribute("rx", 62 * s); body.setAttribute("ry", 54 * s);
    body.setAttribute("opacity", burst ? clamp(vol / 100, 0, 1) : 1);
    vac.setAttribute("r", pump.checked && !burst ? 7 + 4 * (0.5 + 0.5 * Math.sin(ph)) : 9);
    volT.textContent = Math.round(vol) + "%";
    if (!burst && !pump.checked && vol > 130) msg.textContent = "Cell swelling: water keeps entering by osmosis."; else if (!burst) msg.textContent = pump.checked ? "Pump on: volume held steady (control)." : "";
    dots.forEach(o => { o.d += 0.03 * (d / 5); if (o.d > 1) { o.d = 0; o.a = rnd(0, 6.28); } const r = 130 - o.d * 70 * s; o.c.setAttribute("cx", 160 + Math.cos(o.a) * r * 1.2); o.c.setAttribute("cy", 110 + Math.sin(o.a) * r * 0.9); o.c.setAttribute("opacity", o.d < 0.95 ? 0.8 : 0); });
  }, 100);
})();

/* 5-mark answer builder */
(function answerBuilder() {
  const ST = [
    ["Viruses cannot respire, feed, grow or excrete on their own", 1], ["Viruses only reproduce by taking over a host cell&rsquo;s machinery", 1], ["They show no sensitivity or control of their own outside a host", 1],
    ["They have no cytoplasm, cell membrane or organelles", 1], ["They are just a protein coat (capsid) around DNA or RNA", 1],
    ["Viruses are non-living because they are too small", 0], ["Viruses contain both DNA and RNA", 0], ["Viruses have a nucleus but no cell wall", 0], ["Viruses are non-living because they cause disease", 0]];
  const h = $("#ans"), out = $("#ansOut");
  function build() { h.innerHTML = ""; out.textContent = ""; shuffle(ST).forEach(s => { const b = el("button", "", s[0]); b.setAttribute("aria-pressed", "false"); b._ok = s[1]; b.onclick = () => { if (b.dataset.locked) return; b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") !== "true"); }; h.appendChild(b); }); }
  $("#ansReset").onclick = build;
  $("#ansCheck").onclick = () => {
    let marks = 0, wrong = 0;
    $$("button", h).forEach(b => {
      const p = b.getAttribute("aria-pressed") === "true"; b.dataset.locked = 1;
      if (p && b._ok) { marks++; b.classList.add("ok"); } else if (p && !b._ok) { wrong++; b.classList.add("no"); } else if (!p && b._ok) b.classList.add("miss");
    });
    out.textContent = `${marks} of 5 marks earned.` + (wrong ? ` ${wrong} statement${wrong > 1 ? "s were" : " was"} wrong or not creditable.` : "") + (marks === 5 && !wrong ? " Full marks." : marks < 5 ? " Dashed boxes are marks you missed." : "");
  };
  build();
})();

/* ---------------------------------------------------------------- 3D helpers */
function glowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d");
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.7)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
}
let GLOW = null; const glow = () => GLOW || (GLOW = glowTexture());

function makeStage(host, o = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
  catch (e) { host.innerHTML = '<p style="padding:1rem;color:#cfe6dc">This 3D view needs WebGL, which is not available here. The buttons beside it still work.</p>'; return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.outputEncoding = THREE.sRGBEncoding;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(o.fov || 40, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xe3fff2, 0x1a2a3a, 0.95));
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(3, 4, 5); scene.add(key);
  const rim = new THREE.PointLight(0x66ffcc, 0.8, 30); rim.position.set(-4, -2, 3); scene.add(rim);
  const root = new THREE.Group(); root.rotation.order = "YXZ"; scene.add(root);
  const s = { yaw: o.yaw ?? 0.5, pitch: o.pitch ?? 0.2, dist: o.dist ?? 7, idleAt: 0 };
  const ticks = []; const ray = new THREE.Raycaster();
  let down = false, lx = 0, ly = 0, travel = 0, visible = true, raf = 0, last = performance.now();
  function size() { const w = host.clientWidth || 300, h = host.clientHeight || 300; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  new ResizeObserver(size).observe(host); size();
  const cv = renderer.domElement;
  cv.addEventListener("pointerdown", e => { down = true; travel = 0; lx = e.clientX; ly = e.clientY; try { cv.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } });
  cv.addEventListener("pointermove", e => { if (!down) return; const dx = e.clientX - lx, dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; travel += Math.abs(dx) + Math.abs(dy); s.yaw += dx * 0.01; s.pitch = clamp(s.pitch + dy * 0.008, -1.2, 1.2); s.idleAt = performance.now() + 3500; });
  const up = () => { down = false; }; cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  cv.addEventListener("click", e => { if (travel < 6 && o.onClick) o.onClick(e, api); });
  host.addEventListener("keydown", e => {
    const k = e.key; let used = true;
    if (k === "ArrowLeft") s.yaw -= 0.15; else if (k === "ArrowRight") s.yaw += 0.15; else if (k === "ArrowUp") s.pitch = clamp(s.pitch - 0.1, -1.2, 1.2); else if (k === "ArrowDown") s.pitch = clamp(s.pitch + 0.1, -1.2, 1.2);
    else if (k === "+" || k === "=") s.dist = clamp(s.dist - 0.5, 3, 14); else if (k === "-") s.dist = clamp(s.dist + 0.5, 3, 14);
    else if ((k === "Enter" || k === " ") && o.onKey) o.onKey(); else used = false;
    if (used) { e.preventDefault(); s.idleAt = performance.now() + 3500; }
  });
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!down && now > s.idleAt && !reduced()) s.yaw += dt * (o.spin ?? 0.25);
    root.rotation.y = s.yaw; root.rotation.x = s.pitch;
    camera.position.set(0, 0, s.dist); camera.lookAt(0, 0, 0);
    for (const f of ticks) f(dt, now / 1000);
    renderer.render(scene, camera);
  }
  const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  const stop = () => { cancelAnimationFrame(raf); raf = 0; };
  new IntersectionObserver(en => { visible = en[0].isIntersecting; visible ? start() : stop(); }, { threshold: 0.01 }).observe(host);
  const api = {
    scene, root, camera, renderer, s, host, tick: f => ticks.push(f),
    pick(e, objs) { const r = cv.getBoundingClientRect(); const m = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(m, camera); return ray.intersectObjects(objs, false); },
    project(v) { const p = v.clone().project(camera); return { x: (p.x * 0.5 + 0.5) * host.clientWidth, y: (-p.y * 0.5 + 0.5) * host.clientHeight }; }
  };
  return api;
}

const M = (color, op = 1, extra = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.45, metalness: 0.05, transparent: op < 1, opacity: op, depthWrite: op >= 0.9, emissive: color, emissiveIntensity: 0 }, extra));
function ellipsoid(r, sx, sy, sz, mat) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat); m.scale.set(sx, sy, sz); return m; }

/* ---------------------------------------------------------------- entity models for the inspector (and the hero) */
function buildEntity(kind) {
  const g = new THREE.Group(), parts = {};
  const add = (id, name, info, tip, mesh, shell = false) => {
    if (!parts[id]) parts[id] = { id, name, info, tip, objs: [], mats: [] };
    mesh.userData.part = id; mesh.userData.shell = shell; parts[id].objs.push(mesh);
    if (mesh.material && !parts[id].mats.includes(mesh.material)) parts[id].mats.push(mesh.material);
    g.add(mesh); return mesh;
  };
  if (kind === "animal") {
    add("membrane", "Cell membrane", "A thin, flexible layer that controls what enters and leaves the cell. Animal cells have a membrane but no cell wall.", "Exam tip: animal cells have NO cell wall and NO chloroplasts.", new THREE.Mesh(new THREE.SphereGeometry(1.6, 48, 32), M(0x6fb0ff, 0.22, { roughness: 0.2 })), true);
    add("cytoplasm", "Cytoplasm", "A jelly-like fluid where many chemical reactions happen.", "Remember: the cytoplasm fills the space between membrane and organelles.", new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 24), M(0xcfe8ff, 0.1)), true);
    add("nucleus", "Nucleus", "Holds the DNA (chromosomes) and controls the cell&rsquo;s activities. Having a nucleus makes this a eukaryotic cell.", "Eukaryote = true nucleus. Prokaryote = no nucleus.", ellipsoid(0.55, 1, 1, 1, M(0x9b6bd6)).translateX(-0.25).translateY(0.2));
    add("nucleolus", "Nucleolus", "A dense region inside the nucleus that makes the parts of ribosomes.", "Found inside the nucleus.", ellipsoid(0.18, 1, 1, 1, M(0x5b2f9a)).translateX(-0.2).translateY(0.2).translateZ(0.3));
    [[0.8, -0.5, 0.3, 0.6], [-0.9, -0.4, -0.5, -0.4], [0.5, 0.6, -0.7, 1.2], [-0.3, -0.8, 0.8, 2]].forEach(p => { const m = ellipsoid(0.26, 1.7, 0.8, 0.8, M(0xf59e0b)); m.position.set(p[0], p[1], p[2]); m.rotation.z = p[3]; add("mito", "Mitochondria", "The site of aerobic respiration: glucose and oxygen are used to release energy. Cells that use lots of energy have lots of mitochondria.", "Mitochondria release the energy. They do not make it from nothing.", m); });
  } else if (kind === "plant") {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.4, 2.4), M(0x2f9e4f, 0.2)); add("wall", "Cell wall (cellulose)", "A rigid layer outside the membrane made of cellulose. It supports the cell and stops it bursting when it takes in water.", "Plant wall = cellulose. Fungi = chitin. Bacteria = peptidoglycan.", wall, true);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(wall.geometry), new THREE.LineBasicMaterial({ color: 0x1e8c4b })); edges.userData.part = "wall"; edges.userData.edge = true; g.add(edges);
    add("membrane", "Cell membrane", "Sits just inside the wall and controls what passes in and out of the cell.", "Do not confuse the membrane with the wall.", new THREE.Mesh(new THREE.BoxGeometry(3.45, 2.25, 2.25), M(0x8fe0ad, 0.14)), true);
    add("cytoplasm", "Cytoplasm", "Where many reactions happen; holds all the organelles.", "Fluid between the membrane and organelles.", new THREE.Mesh(new THREE.BoxGeometry(3.3, 2.1, 2.1), M(0xd8f5e0, 0.08)), true);
    add("vacuole", "Permanent vacuole", "A large sac of cell sap that keeps the cell firm (turgid) and stores substances.", "Animal cells have only small temporary vacuoles, if any.", ellipsoid(0.85, 1.35, 0.95, 0.85, M(0x4aa3ff, 0.55)).translateX(0.45).translateY(-0.1));
    add("nucleus", "Nucleus", "Contains the DNA and controls the cell. Plants are eukaryotes.", "A nucleus is present in plant cells.", ellipsoid(0.42, 1, 1, 1, M(0x9b6bd6)).translateX(-1.15).translateY(0.15).translateZ(0.3));
    [[-1.0, 0.8, 0.5], [0.4, 0.85, 0.7], [1.3, 0.7, 0.3], [-0.6, -0.8, 0.7], [1.0, -0.85, 0.5], [-1.3, -0.5, -0.6]].forEach(p => { const m = ellipsoid(0.26, 1.5, 0.75, 0.9, M(0x1f8f3a)); m.position.set(p[0], p[1], p[2]); add("chloro", "Chloroplasts", "Contain chlorophyll and carry out photosynthesis, making glucose from light, water and carbon dioxide.", "Only plant cells (and some protoctists) have chloroplasts. Animal cells never do.", m); });
    [[0.2, -0.7, -0.5], [-0.8, 0.0, -0.7]].forEach(p => { const m = ellipsoid(0.2, 1.7, 0.8, 0.8, M(0xf59e0b)); m.position.set(p[0], p[1], p[2]); add("mito", "Mitochondria", "Release energy by respiration. Plants respire too, all day and night.", "Plants do both photosynthesis AND respiration.", m); });
    g.scale.setScalar(0.95);
  } else if (kind === "bacteria") {
    const cap = (id, name, info, tip, r, len, mat, shell) => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 24, 1, true), mat); c.rotation.z = Math.PI / 2; add(id, name, info, tip, c, shell);
      [-1, 1].forEach(sx => { const e = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), mat); e.position.x = sx * len / 2; add(id, name, info, tip, e, shell); });
    };
    cap("wall", "Cell wall (peptidoglycan)", "A tough wall made of peptidoglycan. It gives the bacterium its shape.", "Bacterial wall = peptidoglycan, not cellulose.", 0.75, 2.2, M(0x12998a, 0.28), true);
    cap("cytoplasm", "Cytoplasm", "Jelly-like fluid holding the DNA, plasmids and ribosomes. There is no nucleus and no membrane-bound organelles.", "Prokaryotes have no mitochondria or chloroplasts.", 0.66, 2.2, M(0xb8f0e8, 0.12), true);
    add("dna", "Circular chromosome (DNA)", "A single loop of DNA floating free in the cytoplasm. It is not enclosed by a nuclear membrane.", "No nucleus = prokaryote.", new THREE.Mesh(new THREE.TorusKnotGeometry(0.34, 0.07, 100, 12), M(0xf3d36b)).translateX(-0.2));
    [[0.7, 0.2, 0.2], [0.85, -0.25, -0.15]].forEach(p => { const m = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 10, 24), M(0xff8a4c)); m.position.set(...p); m.rotation.x = rnd(0, 3); add("plasmid", "Plasmids", "Small extra rings of DNA. They often carry useful genes, for example antibiotic resistance.", "Plasmids are only in bacteria in this topic.", m); });
    const pts = []; for (let i = 0; i <= 20; i++) pts.push(new THREE.Vector3(-1.1 - i * 0.12, Math.sin(i * 0.9) * 0.18, Math.cos(i * 0.9) * 0.18));
    add("flagellum", "Flagellum", "A whip-like tail that spins to push the bacterium along. Not all bacteria have one.", "Used for movement.", new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.05, 8), M(0x0e7c70)));
    g.scale.setScalar(0.92);
  } else {
    const ico = new THREE.IcosahedronGeometry(1.15, 0);
    add("capsid", "Capsid (protein coat)", "A protective coat made of protein that surrounds the genetic material. Viruses have no cell membrane and no cytoplasm.", "Virus = genetic material + protein coat. Not a cell.", new THREE.Mesh(ico, M(0xe0566e, 0.45, { flatShading: true })), true);
    const wire = new THREE.LineSegments(new THREE.EdgesGeometry(ico), new THREE.LineBasicMaterial({ color: 0xffb3c0 })); wire.userData.part = "capsid"; wire.userData.edge = true; g.add(wire);
    const pts = []; for (let i = 0; i <= 60; i++) { const a = i * 0.45; pts.push(new THREE.Vector3(Math.cos(a) * 0.38, (i - 30) * 0.024, Math.sin(a) * 0.38)); }
    add("core", "DNA or RNA core", "The virus&rsquo;s genetic material, either DNA or RNA (never both). It carries instructions to make new viruses inside a host cell.", "A virus can only reproduce inside a host cell.", new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 100, 0.05, 8), M(0xf3d36b)));
    const seen = []; const pa = ico.attributes.position;
    for (let i = 0; i < pa.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(pa, i); if (seen.some(u => u.distanceTo(v) < 0.01)) continue; seen.push(v); const sp = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.4, 10), M(0x7bd0ff)); sp.position.copy(v.clone().multiplyScalar(1.12)); sp.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize()); add("spikes", "Surface spikes (some viruses)", "Many viruses, such as influenza, have spike proteins that lock onto host cells.", "Not every virus has spikes. The capsid and genetic material are always present.", sp); }
  }
  return { group: g, parts };
}

/* ---------------------------------------------------------------- hero */
(function hero() {
  const st = makeStage($("#heroStage"), { dist: 6.4, pitch: 0.25, spin: 0.35 }); if (!st) return;
  const e = buildEntity("animal"); st.root.add(e.group);
  const N = 70, pos = new Float32Array(N * 3), seed = [];
  for (let i = 0; i < N; i++) { const a = rnd(0, 6.28), b = rnd(-1, 1), r = rnd(2.0, 2.9); seed.push([a, b, r, rnd(0.2, 0.6)]); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.14, map: glow(), color: 0xf3d36b, transparent: true, depthWrite: false, sizeAttenuation: true })); pts.frustumCulled = false; st.root.add(pts);
  st.tick((dt, t) => {
    seed.forEach((s, i) => { const a = s[0] + t * s[3]; pos[i * 3] = Math.cos(a) * s[2]; pos[i * 3 + 1] = s[1] * 1.6 + Math.sin(t + i) * 0.15; pos[i * 3 + 2] = Math.sin(a) * s[2]; });
    geo.attributes.position.needsUpdate = true; e.group.position.y = Math.sin(t * 0.9) * 0.08;
  });
})();

/* ---------------------------------------------------------------- LAB 1: living cell */
(function lifeLab() {
  const host = $("#lifeStage"), hud = $("#lifeHud");
  const st = makeStage(host, { dist: 6.4, pitch: 0.2, fov: 42, spin: 0.12, onClick: (e) => { const h = st.pick(e, [mem]); if (h.length) poke(cell.worldToLocal(h[0].point.clone())); else poke(); }, onKey: () => poke() });
  const lit = {}, row = $("#mrsRow"); const LB = ["M", "R", "S", "C", "G", "R", "E", "N"], TT = ["Movement", "Respiration", "Sensitivity", "Control", "Growth", "Reproduction", "Excretion", "Nutrition"];
  row.innerHTML = LB.map((l, i) => `<span title="${TT[i]}" data-i="${i}">${l}</span>`).join("");
  let litCount = 0;
  const light = i => { if (lit[i]) return; lit[i] = 1; litCount++; const s = row.children[i]; s.classList.add("on"); if (litCount === 8) { msg("It&rsquo;s alive! You have shown all eight life processes.", 6); award("life"); } else msg(`${TT[i]} shown. ${8 - litCount} to go.`, 3); };
  let msgT = 0, msgText = "";
  const msg = (h, secs) => { msgText = h; msgT = secs; };
  const rS = $("#slR"), eS = $("#slE"), cS = $("#slC");
  const sync = () => { $("#lblR").textContent = (+rS.value).toFixed(1) + "x"; $("#lblE").textContent = eS.value + "%"; $("#lblC").textContent = cS.value; };
  [rS, eS, cS].forEach(s => s.addEventListener("input", sync)); sync();
  if (!st) { $("#lifeFeed").disabled = $("#lifePoke").disabled = $("#lifeHeat").disabled = $("#lifeMitosis").disabled = true; return; }
  const cell = new THREE.Group(); st.root.add(cell);
  const memMat = M(0x6fb0ff, 0.2, { roughness: 0.2 }); const mem = new THREE.Mesh(new THREE.SphereGeometry(1.5, 48, 32), memMat); cell.add(mem);
  const nuc = ellipsoid(0.5, 1, 1, 1, M(0x9b6bd6)); nuc.position.set(-0.2, 0.15, 0); cell.add(nuc);
  const nl = ellipsoid(0.17, 1, 1, 1, M(0x5b2f9a)); nl.position.set(-0.15, 0.15, 0.32); cell.add(nl);
  const mitos = [0, 1, 2].map(i => { const m = ellipsoid(0.24, 1.8, 0.8, 0.8, M(0xf59e0b)); cell.add(m); return { m, a: i * 2.1 }; });
  const MAXP = 220, P = new Float32Array(MAXP * 3), C = new Float32Array(MAXP * 3), V = new Float32Array(MAXP * 3), TY = new Uint8Array(MAXP), LF = new Float32Array(MAXP);
  const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(P, 3)); pg.setAttribute("color", new THREE.BufferAttribute(C, 3));
  const points = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.2, map: glow(), vertexColors: true, transparent: true, depthWrite: false, sizeAttenuation: true })); points.frustumCulled = false; cell.add(points);
  const COL = { 1: [1, 0.76, 0.2], 2: [0.95, 0.3, 0.3], 3: [0.3, 0.95, 0.95], 4: [0.95, 0.35, 0.3], 5: [1, 0.76, 0.2] };
  function spawn(type, x, y, z, vx, vy, vz, life = 0) { for (let i = 0; i < MAXP; i++) if (!TY[i]) { TY[i] = type; P.set([x, y, z], i * 3); V.set([vx, vy, vz], i * 3); LF[i] = life; return i; } return -1; }
  const inside = () => { let v; do v = new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)); while (v.length() > 1); return v.multiplyScalar(1.15); };
  for (let i = 0; i < 22; i++) { const v = inside(); spawn(1, v.x, v.y, v.z, rnd(-0.3, 0.3), rnd(-0.3, 0.3), rnd(-0.3, 0.3)); }
  for (let i = 0; i < 3; i++) { const v = inside(); spawn(2, v.x, v.y, v.z, 0, 0, 0); }
  let E = 70, T = 37, heatLeft = 0, heatEvents = 0, t = 0, hudTick = 0, rec = new THREE.Vector3(), recV = new THREE.Vector3(), cellsMade = 1, exited = false;
  const mit = { phase: 0, p: 0, d: null, off: 0, q: 0 };
  const rings = [];

  function poke(local) {
    const pt = local ? local.clone().normalize().multiplyScalar(1.5) : new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize().multiplyScalar(1.5);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.28, 40), new THREE.MeshBasicMaterial({ color: 0x7dffd0, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    ring.position.copy(pt); cell.add(ring); ring.lookAt(cell.localToWorld(pt.clone().multiplyScalar(2))); rings.push({ ring, age: 0 });
    for (let i = 0; i < MAXP; i++) if (TY[i] && TY[i] < 3) { const p = new THREE.Vector3(P[i * 3], P[i * 3 + 1], P[i * 3 + 2]); const d = p.distanceTo(pt); if (d < 1.8) { const push = p.sub(pt).normalize().multiplyScalar(3.2 * (1 - d / 1.8)); V[i * 3] += push.x; V[i * 3 + 1] += push.y; V[i * 3 + 2] += push.z; } }
    recV.add(pt.clone().normalize().multiplyScalar(-2.2));
    light(2); light(0); msg("Sensitivity: the cell detected the stimulus and moved away.", 3.5);
    const r = host.getBoundingClientRect(); const q = st.project(cell.localToWorld(pt.clone())); burstAt(host, q.x, q.y, "#7dffd0");
  }
  $("#lifePoke").onclick = () => poke();
  $("#lifeFeed").onclick = () => {
    for (let i = 0; i < 12; i++) { const d = new THREE.Vector3(rnd(-1, 1), rnd(-1, 1), rnd(-1, 1)).normalize(); const p = d.clone().multiplyScalar(2.6); const v = d.clone().multiplyScalar(-1.3); spawn(5, p.x, p.y, p.z, v.x, v.y, v.z); }
    msg("Nutrition: glucose is moving into the cell.", 3.5); light(7); popIt($("#lifeFeed"));
  };
  $("#lifeHeat").onclick = () => { heatLeft = 5; heatEvents++; msg("Heat stress! Raise the Control strength to see homeostasis cope.", 4); };
  $("#lifeMitosis").onclick = () => {
    if (mit.phase) return;
    if (E < 40) { shake($("#lifeMitosis")); msg("Not enough energy to divide: needs 40% ATP. Feed the cell first.", 3.5); return; }
    E -= 40; mit.phase = 1; mit.p = 0; light(4);
    const d = new THREE.Group(); d.add(new THREE.Mesh(new THREE.SphereGeometry(1.5, 32, 24), M(0x6fb0ff, 0.22))); const dn = ellipsoid(0.5, 1, 1, 1, M(0x9b6bd6)); dn.position.set(-0.2, 0.15, 0); d.add(dn);
    d.position.copy(cell.position); d.scale.setScalar(0.5); st.root.add(d); mit.d = d;
    msg("Growth then reproduction: the cell copies its DNA and divides into two.", 4);
  };

  st.tick((dt) => {
    const rate = +rS.value, exc = +eS.value / 100, ctl = +cS.value; t += dt;
    heatLeft = Math.max(0, heatLeft - dt);
    T += ((heatLeft > 0 ? 4 : 0) - ctl * 0.3 * (T - 37)) * dt;
    T = clamp(T, 33, 50);
    if (heatEvents && heatLeft === 0 && T < 39) light(3);
    const eff = T > 41 ? Math.max(0.12, 1 - (T - 41) * 0.2) : 1;
    E = clamp(E - dt * (2.0 + Math.max(0, T - 37) * 0.3), 0, 100);
    mitos.forEach(o => { o.a += dt * 0.45 * rate * eff; o.m.position.set(Math.cos(o.a) * 0.9, Math.sin(o.a * 1.3) * 0.45, Math.sin(o.a) * 0.9); o.m.rotation.z = o.a; });
    const jit = 1 + (T - 37) * 0.14; let gl = 0, wa = 0;
    for (let i = 0; i < MAXP; i++) {
      const ty = TY[i]; if (!ty) continue; const k = i * 3;
      if (ty === 3) { LF[i] -= dt; P[k + 1] += dt * 0.7; if (LF[i] <= 0) TY[i] = 0; }
      else {
        if (ty === 1 || ty === 2) { V[k] += rnd(-1, 1) * dt * 2.4 * jit; V[k + 1] += rnd(-1, 1) * dt * 2.4 * jit; V[k + 2] += rnd(-1, 1) * dt * 2.4 * jit; const sp = Math.hypot(V[k], V[k + 1], V[k + 2]), mx = 0.9 * jit + 0.5; if (sp > mx) { V[k] *= mx / sp; V[k + 1] *= mx / sp; V[k + 2] *= mx / sp; } }
        P[k] += V[k] * dt; P[k + 1] += V[k + 1] * dt; P[k + 2] += V[k + 2] * dt;
        const r = Math.hypot(P[k], P[k + 1], P[k + 2]);
        if (ty === 1 || ty === 2) {
          if (r > 1.28) { const nx = P[k] / r, ny = P[k + 1] / r, nz = P[k + 2] / r; P[k] = nx * 1.28; P[k + 1] = ny * 1.28; P[k + 2] = nz * 1.28; const dp = V[k] * nx + V[k + 1] * ny + V[k + 2] * nz; V[k] -= 1.8 * dp * nx; V[k + 1] -= 1.8 * dp * ny; V[k + 2] -= 1.8 * dp * nz; }
          if (ty === 1) {
            gl++;
            for (const o of mitos) { const mp = o.m.position; if (Math.hypot(P[k] - mp.x, P[k + 1] - mp.y, P[k + 2] - mp.z) < 0.4 && Math.random() < dt * 1.6 * rate * eff) { TY[i] = 2; E = clamp(E + 6, 0, 100); light(1); for (let s = 0; s < 2; s++) spawn(3, mp.x + rnd(-0.1, 0.1), mp.y, mp.z + rnd(-0.1, 0.1), 0, 0, 0, 0.9); break; } }
          } else {
            wa++;
            if (r > 1.0 && Math.random() < dt * exc * 1.1) { TY[i] = 4; const s = 1.1 / (r || 1); V[k] = P[k] * s; V[k + 1] = P[k + 1] * s; V[k + 2] = P[k + 2] * s; }
          }
        } else if (ty === 5) { if (r < 1.15) { TY[i] = 1; light(7); } }
        else if (ty === 4) { if (r > 2.5) { TY[i] = 0; if (!exited) { exited = true; light(6); msg("Excretion: waste produced inside the cell is leaving it.", 3.5); } } }
      }
      const c = COL[TY[i]]; if (c) { C[k] = c[0]; C[k + 1] = c[1]; C[k + 2] = c[2]; } if (!TY[i]) { P[k + 1] = 999; }
    }
    pg.attributes.position.needsUpdate = true; pg.attributes.color.needsUpdate = true;
    // recoil spring (Movement) and idle life
    recV.addScaledVector(rec, -9 * dt); recV.multiplyScalar(1 - 3 * dt); rec.addScaledVector(recV, dt);
    cell.position.copy(rec); cell.position.x += mit.off; cell.position.y += Math.sin(t * 1.4) * 0.05;
    const br = 1 + 0.025 * Math.sin(t * 2.2 + 1); cell.scale.set(br * (mit.phase === 1 ? 1 + 0.35 * mit.p : 1), br, br);
    const heat = clamp((T - 37) / 8, 0, 1), tox = clamp((wa - 12) / 16, 0, 1);
    memMat.color.setRGB(0.44 + 0.5 * Math.max(heat, tox), 0.69 - 0.4 * Math.max(heat, tox), 1 - 0.7 * Math.max(heat, tox)); memMat.emissive.copy(memMat.color); memMat.emissiveIntensity = 0.12 + 0.2 * Math.max(heat, tox);
    for (let i = rings.length - 1; i >= 0; i--) { const r = rings[i]; r.age += dt; const k = r.age / 0.9; r.ring.scale.setScalar(1 + k * 4); r.ring.material.opacity = 1 - k; if (k >= 1) { cell.remove(r.ring); r.ring.geometry.dispose(); r.ring.material.dispose(); rings.splice(i, 1); } }
    // mitosis
    if (mit.phase === 1) { mit.p = Math.min(1, mit.p + dt / 3); mit.off = -mit.p * 1.7; mit.d.position.set(rec.x + mit.p * 1.9, rec.y, rec.z); mit.d.scale.setScalar(0.5 + 0.5 * mit.p); if (mit.p >= 1) { mit.phase = 2; mit.q = 0; light(5); cellsMade++; } }
    else if (mit.phase === 2) { mit.q += dt; mit.off = -1.7 * Math.max(0, 1 - mit.q / 1.2); mit.d.position.x += dt * 1.1; mit.d.children.forEach(c => { c.material.opacity = Math.max(0, (c === mit.d.children[0] ? 0.22 : 1) * (1 - mit.q / 2.2)); c.material.transparent = true; }); if (mit.q >= 2.2) { st.root.remove(mit.d); mit.d.children.forEach(c => { c.geometry.dispose(); c.material.dispose(); }); mit.d = null; mit.phase = 0; mit.off = 0; msg("Division complete: one cell became two. That is reproduction and growth.", 4); } }
    // HUD
    hudTick += dt; if (msgT > 0) msgT -= dt;
    if (hudTick > 0.1) {
      hudTick = 0;
      $("#mAtp").style.width = E + "%"; $("#mWaste").style.width = clamp(wa / 30 * 100, 0, 100) + "%"; $("#mTemp").style.width = clamp((T - 30) / 20 * 100, 0, 100) + "%"; $("#tTemp").textContent = T.toFixed(1) + "°C";
      let s = "Optimal homeostasis", warn = false;
      if (msgT > 0) s = msgText; else if (E < 15) { s = "Low energy: feed the cell (Nutrition)."; warn = true; } else if (wa >= 22) { s = "Toxic waste build-up: increase excretion."; warn = true; } else if (T > 41) { s = "Too hot: enzymes are denaturing, respiration slowing."; warn = true; } else if (cellsMade > 1) s = `Cells produced so far: ${cellsMade}`;
      hud.innerHTML = s; hud.classList.toggle("warn", warn);
    }
  });
})();

/* ---------------------------------------------------------------- LAB 2: inspector + label challenge */
(function inspector() {
  const host = $("#inspStage"); const chipsEl = $("#inspChips"), info = $("#inspInfo"), prompt = $("#chalPrompt"), scoreEl = $("#chalScore");
  let cur = null, curKind = "plant", sel = null, chal = null;
  const lbl = el("div", "", ""); lbl.style.cssText = "position:absolute;pointer-events:none;padding:.25rem .6rem;border-radius:99px;background:#f3d36bee;color:#2a2100;font-weight:700;font-size:.78rem;transform:translate(-50%,-140%);display:none;white-space:nowrap;z-index:3";
  const st = makeStage(host, { dist: 6.6, pitch: 0.25, spin: 0.2, onClick: (e) => { const hits = st.pick(e, allObjs()); if (!hits.length) return; let h = hits.find(x => !x.object.userData.shell && !x.object.userData.edge); if (!h) h = hits[1] || hits[0]; choose(h.object.userData.part, e); } });
  if (!st) { chipsEl.textContent = "3D view unavailable on this device."; return; }
  host.appendChild(lbl);
  const allObjs = () => cur ? Object.values(cur.parts).flatMap(p => p.objs) : [];
  function load(kind) {
    if (cur) { st.root.remove(cur.group); }
    curKind = kind; cur = buildEntity(kind); st.root.add(cur.group); sel = null; lbl.style.display = "none";
    Object.values(cur.parts).forEach(p => p.objs.forEach(o => { o.userData.s0 = o.scale.clone(); }));
    $$("#inspTabs button").forEach(b => b.setAttribute("aria-selected", b.dataset.e === kind));
    stopChal(); renderChips(); showInfo(null);
  }
  function renderChips() {
    chipsEl.innerHTML = ""; const ids = Object.keys(cur.parts);
    ids.forEach((id, i) => { const b = el("button", sel === id ? "on" : "", chal ? `Part ${String.fromCharCode(65 + i)}` : cur.parts[id].name); b.onclick = () => choose(id); b.addEventListener("mouseenter", () => { hover = id; }); b.addEventListener("mouseleave", () => { hover = null; }); chipsEl.appendChild(b); });
  }
  let hover = null;
  function showInfo(id) {
    if (!id) { info.innerHTML = "<b>Pick a part</b><p>Tap any part of the model or choose one above.</p>"; return; }
    const p = cur.parts[id]; info.innerHTML = `<b>${p.name}</b><p>${p.info}</p><p class="tip">${p.tip}</p>`;
  }
  function choose(id, ev) {
    if (chal) return answer(id, ev);
    sel = id; showInfo(id); renderChips(); popPart(id);
    if (!reduced() && ev) { const r = host.getBoundingClientRect(); burstAt(host, ev.clientX - r.left, ev.clientY - r.top, "#f3d36b"); }
  }
  let pop = { id: null, t: 0 };
  function popPart(id) { pop = { id, t: 0.4 }; }
  st.tick((dt, tm) => {
    if (!cur) return;
    if (curKind === "bacteria") cur.parts.flagellum.objs[0].rotation.x = Math.sin(tm * 6) * 0.35;
    if (pop.t > 0) pop.t -= dt;
    Object.values(cur.parts).forEach(p => {
      const on = (p.id === sel && !chal) || p.id === hover; p.mats.forEach(m => { m.emissiveIntensity = on ? 0.35 + 0.25 * Math.sin(tm * 5) : 0; });
      const sc = (pop.id === p.id && pop.t > 0) ? 1 + 0.15 * Math.sin((1 - pop.t / 0.4) * Math.PI) : 1;
      p.objs.forEach(o => { if (o.userData.s0 && !o.userData.edge) o.scale.copy(o.userData.s0).multiplyScalar(sc); });
    });
    if (sel && !chal) { const o = cur.parts[sel].objs.find(x => !x.userData.edge) || cur.parts[sel].objs[0]; const q = st.project(o.getWorldPosition(new THREE.Vector3())); lbl.textContent = cur.parts[sel].name; lbl.style.left = q.x + "px"; lbl.style.top = q.y + "px"; lbl.style.display = "block"; } else lbl.style.display = "none";
  });

  // label challenge
  function stopChal() { chal = null; prompt.textContent = ""; scoreEl.textContent = ""; $("#chalBtn").textContent = "Start label challenge"; if (cur) renderChips(); }
  function startChal() {
    const ids = shuffle(Object.keys(cur.parts)).slice(0, Math.min(6, Object.keys(cur.parts).length));
    chal = { q: ids, i: 0, score: 0 }; sel = null; $("#chalBtn").textContent = "Stop challenge"; renderChips(); ask();
  }
  function ask(extra = "") { const id = chal.q[chal.i]; prompt.textContent = `${extra}Find the ${cur.parts[id].name.replace(/ \(.*\)/, "")}: tap it in 3D or pick its letter.`; scoreEl.textContent = `Score ${chal.score} / ${chal.i}`; }
  function answer(id, ev) {
    const want = chal.q[chal.i], ok = id === want; let extra;
    if (ok) { chal.score++; extra = "Correct! "; popPart(id); if (ev) { const r = host.getBoundingClientRect(); burstAt(host, ev.clientX - r.left, ev.clientY - r.top, "#3fd9a0"); } }
    else { extra = `That was the ${cur.parts[id].name.replace(/ \(.*\)/, "")}. `; shake(host); }
    chal.i++;
    if (chal.i >= chal.q.length) {
      const n = chal.q.length, sc = chal.score; prompt.textContent = `${extra}Challenge over: ${sc} / ${n}.` + (sc >= Math.ceil(n * 0.8) ? " Lab badge earned." : " Aim for 80% to earn the badge."); scoreEl.textContent = "";
      if (sc >= Math.ceil(n * 0.8)) award("insp"); chal = null; $("#chalBtn").textContent = "Start label challenge"; renderChips(); return;
    }
    ask(extra);
  }
  $("#chalBtn").onclick = () => chal ? stopChal() : startChal();
  $$("#inspTabs button").forEach(b => b.onclick = () => load(b.dataset.e));
  load("plant");
})();

/* ---------------------------------------------------------------- LAB 3: saprophytic digestion (2D canvas game) */
(function fungusLab() {
  const cv = $("#fungCanvas"), ctx = cv.getContext("2d"), W = 800, H = 600, BREAD = 300;
  let chunks, enz, sol, floats, hyph, absorbed, totalSol, level, stage, t = 0, done = false;
  const steps = $$("#fSteps li");
  function branches(lv) {
    const b = [[[60, 110], [200, 180], [320, 300], [400, 430], [430, 520]], [[200, 180], [300, 200], [420, 280], [540, 380], [600, 470]]];
    if (lv >= 2) b.push([[320, 300], [250, 380], [200, 460], [190, 540]], [[420, 280], [520, 250], [650, 300], [720, 400]]);
    if (lv >= 3) b.push([[400, 430], [330, 480], [300, 560]], [[540, 380], [470, 450], [470, 560]], [[650, 300], [720, 330], [770, 270]]);
    return b;
  }
  function pts() { const out = []; hyph.forEach(path => { for (let i = 0; i < path.length - 1; i++) { const [x1, y1] = path[i], [x2, y2] = path[i + 1]; const n = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 14); for (let k = 0; k <= n; k++) { const x = x1 + (x2 - x1) * k / n, y = y1 + (y2 - y1) * k / n; if (y > BREAD) out.push([x, y]); } } }); return out; }
  let abs = [];
  function reset() {
    level = 1; hyph = branches(1); abs = pts(); absorbed = 0; enz = []; sol = []; floats = []; stage = 1; done = false;
    chunks = []; let tries = 0; while (chunks.length < 9 && tries++ < 200) { const x = rnd(90, 730), y = rnd(350, 560); if (chunks.every(c => Math.hypot(c.x - x, c.y - y) > 85)) { const r = rnd(28, 36); chunks.push({ x, y, r0: r, hp: 3, shape: Array.from({ length: 9 }, (_, i) => r * rnd(0.78, 1.1)) }); } }
    totalSol = chunks.length * 4; tip("Click on the bread to secrete enzymes. Try growing more hyphae: more surface area means faster absorption."); sync();
  }
  function tip(s) { $("#fTip").textContent = s; }
  function tipsOf() { return hyph.map(p => p[p.length - 1]).filter(p => p[1] > BREAD - 20); }
  function secrete(tx, ty, n = 6) {
    const tips = tipsOf(); const from = tips.length ? tips.reduce((a, b) => Math.hypot(a[0] - tx, a[1] - ty) < Math.hypot(b[0] - tx, b[1] - ty) ? a : b) : [200, 400];
    for (let i = 0; i < n && enz.length < 44; i++) enz.push({ x: from[0] + rnd(-6, 6), y: from[1] + rnd(-6, 6), vx: 0, vy: 0, tx, ty });
    popIt($("#fSecrete"));
  }
  function sync() {
    const lost = chunks.reduce((a, c) => a + (3 - c.hp), 0), tot = chunks.length * 3;
    $("#fMeterD").style.width = lost / tot * 100 + "%"; $("#fMeterA").style.width = absorbed / totalSol * 100 + "%"; $("#fCount").textContent = absorbed;
    steps.forEach(li => { const s = +li.dataset.s; li.classList.toggle("on", s === stage && !done); li.classList.toggle("done", s < stage || done); });
    if (absorbed >= 12) award("fung");
  }
  cv.addEventListener("click", e => { const r = cv.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width * W, y = (e.clientY - r.top) / r.height * H; if (y > BREAD) { secrete(x, y, 5); } else { tip("The enzymes must reach the bread: click lower down."); } });
  cv.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); secrete(rnd(100, 700), rnd(380, 550)); } });
  $("#fSecrete").onclick = () => { const c = chunks.filter(c => c.hp > 0); const g = c.length ? c[Math.floor(Math.random() * c.length)] : { x: 400, y: 450 }; secrete(g.x, g.y, 8); };
  $("#fGrow").onclick = () => { if (level < 3) { level++; hyph = branches(level); abs = pts(); tip(`More hyphae: ${abs.length} absorbing points, so faster absorption.`); popIt($("#fGrow")); } else tip("The fungus is fully grown."); };
  $("#fReset").onclick = reset;
  const bgCache = (() => { const c = document.createElement("canvas"); c.width = W; c.height = H; const x = c.getContext("2d"); const g = x.createLinearGradient(0, 0, 0, BREAD); g.addColorStop(0, "#27140a"); g.addColorStop(1, "#3a2010"); x.fillStyle = g; x.fillRect(0, 0, W, BREAD); const b = x.createLinearGradient(0, BREAD, 0, H); b.addColorStop(0, "#d9a45f"); b.addColorStop(1, "#a8702f"); x.fillStyle = b; x.fillRect(0, BREAD, W, H - BREAD); for (let i = 0; i < 260; i++) { x.fillStyle = `rgba(90,50,10,${rnd(0.05, 0.18)})`; x.beginPath(); x.arc(rnd(0, W), rnd(BREAD, H), rnd(2, 7), 0, 6.28); x.fill(); } x.fillStyle = "#fff3"; x.font = "bold 18px sans-serif"; x.fillText("Bread (dead organic matter)", 18, BREAD + 28); return c; })();
  let visible = true, last = performance.now();
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }, { threshold: 0.01 }).observe(cv);
  function frame(now) {
    requestAnimationFrame(frame); const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!visible) return; t += dt;
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1); const w = Math.round(r.width * dpr), h = Math.round(r.height * dpr); if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    ctx.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0); ctx.drawImage(bgCache, 0, 0);
    // enzymes seek chunks (and are not used up)
    enz.forEach(z => {
      let best = null, bd = 1e9; chunks.forEach(c => { if (c.hp > 0) { const d = Math.hypot(c.x - z.tx, c.y - z.ty); if (d < bd) { bd = d; best = c; } } });
      if (best) { const dx = best.x - z.x, dy = best.y - z.y, d = Math.hypot(dx, dy) || 1; z.vx += (dx / d * 90 - z.vx) * dt * 2 + rnd(-1, 1) * 20 * dt; z.vy += (dy / d * 90 - z.vy) * dt * 2 + rnd(-1, 1) * 20 * dt; if (d < best.r0 * (0.5 + 0.17 * best.hp) + 4 && !z.cool) { best.hp--; z.cool = 1.4; if (stage < 2) { stage = 2; tip("Step 2: the enzymes are breaking the bread down OUTSIDE the fungus. They are not used up."); } if (best.hp === 0) { for (let k = 0; k < 4; k++) { sol.push({ x: best.x + rnd(-12, 12), y: best.y + rnd(-12, 12), vx: rnd(-20, 20), vy: rnd(-20, 20) }); } floats.push({ x: best.x, y: best.y, s: "digested", a: 1 }); } sync(); } }
      z.cool = Math.max(0, (z.cool || 0) - dt); z.x += z.vx * dt; z.y += z.vy * dt; z.y = clamp(z.y, 20, H - 10);
    });
    // soluble molecules diffuse toward hyphae and get absorbed
    for (let i = sol.length - 1; i >= 0; i--) {
      const m = sol[i]; let bp = null, bd = 1e9; for (const p of abs) { const d = Math.hypot(p[0] - m.x, p[1] - m.y); if (d < bd) { bd = d; bp = p; } }
      if (bp && bd < 170) { m.vx += (bp[0] - m.x) / bd * 60 * dt; m.vy += (bp[1] - m.y) / bd * 60 * dt; }
      m.vx += rnd(-1, 1) * 60 * dt; m.vy += rnd(-1, 1) * 60 * dt; m.vx *= 0.97; m.vy *= 0.97; m.x += m.vx * dt; m.y = clamp(m.y + m.vy * dt, BREAD + 5, H - 8);
      if (bp && bd < 16) { sol.splice(i, 1); absorbed++; floats.push({ x: m.x, y: m.y, s: "+1", a: 1 }); if (stage < 3) { stage = 3; tip("Step 3: small soluble molecules are absorbed into the hyphae."); } if (absorbed === totalSol) { done = true; tip(`Bread fully digested and ${absorbed} nutrient molecules absorbed. More hyphae would have done it faster.`); } sync(); }
    }
    // draw chunks
    chunks.forEach(c => { if (c.hp <= 0) return; const sc = 0.45 + 0.55 * c.hp / 3; ctx.beginPath(); c.shape.forEach((rr, i) => { const a = i / c.shape.length * 6.28; const x = c.x + Math.cos(a) * rr * sc, y = c.y + Math.sin(a) * rr * sc; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.fillStyle = "#5b3516"; ctx.fill(); ctx.strokeStyle = "#8a5a2a"; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = "#e8c98f"; ctx.font = "10px sans-serif"; ctx.textAlign = "center"; ctx.fillText("starch", c.x, c.y + 3); });
    // hyphae
    hyph.forEach(path => { ctx.lineCap = "round"; ctx.lineJoin = "round"; [[16, "#a86b00"], [10, "#f3d36b"]].forEach(([lw, col]) => { ctx.beginPath(); path.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.stroke(); }); path.forEach((p, i) => { if (i % 2 === 1) { ctx.beginPath(); ctx.arc(p[0], p[1], 3.2, 0, 6.28); ctx.fillStyle = "#4f86d8"; ctx.fill(); } }); });
    ctx.fillStyle = "#fff"; ctx.font = "bold 13px sans-serif"; ctx.textAlign = "left"; ctx.fillText("hypha (chitin wall)", 70, 98);
    sol.forEach(m => { ctx.beginPath(); ctx.arc(m.x, m.y, 4.5, 0, 6.28); ctx.fillStyle = "#4ade80"; ctx.fill(); });
    enz.forEach(z => { ctx.beginPath(); ctx.arc(z.x, z.y, 5, 0, 6.28); ctx.fillStyle = "#facc15"; ctx.shadowColor = "#facc15"; ctx.shadowBlur = 8; ctx.fill(); ctx.shadowBlur = 0; });
    for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.a -= dt; f.y -= 24 * dt; if (f.a <= 0) { floats.splice(i, 1); continue; } ctx.globalAlpha = f.a; ctx.fillStyle = "#fff"; ctx.font = "bold 15px sans-serif"; ctx.textAlign = "center"; ctx.fillText(f.s, f.x, f.y); ctx.globalAlpha = 1; }
    ctx.textAlign = "left"; ctx.fillStyle = "#facc15"; ctx.fillText("● enzyme", 640, 24); ctx.fillStyle = "#4ade80"; ctx.fillText("● soluble product", 640, 44);
  }
  reset(); requestAnimationFrame(frame);
})();

/* ---------------------------------------------------------------- LAB 4: Kingdom Detective + key */
const KCOL = { plants: "#2f9e4f", animals: "#2f7dd1", fungi: "#c9791b", protoctists: "#8a4fc0", bacteria: "#12998a", virus: "#c43a52" };
const KNAME = { plants: "Plants", animals: "Animals", fungi: "Fungi", protoctists: "Protoctists", bacteria: "Bacteria", virus: "Not a kingdom (virus)" };
const SPEC = [
  { id: "maize", name: "Maize", k: "plants", c: ["Made of many cells joined together", "Cells have a nucleus", "Cell wall made of cellulose", "Makes its own food using light"] },
  { id: "polar-bear", name: "Polar bear", k: "animals", c: ["Made of many cells joined together", "Cells have a nucleus", "Cells have no cell wall", "Eats other animals to get its food"] },
  { id: "mushroom", name: "Mushroom", k: "fungi", c: ["Made of many cells in thread-like hyphae", "Cells have a nucleus", "Cell wall made of chitin", "Digests dead matter outside its body, then absorbs it"] },
  { id: "yeast", name: "Yeast", k: "fungi", c: ["A single cell", "Has a nucleus", "Cell wall made of chitin", "Cannot photosynthesise and stores glycogen"] },
  { id: "amoeba", name: "<i>Amoeba</i>", k: "protoctists", c: ["A single cell", "Has a nucleus", "No cell wall", "Engulfs food and has a contractile vacuole"] },
  { id: "chlorella", name: "<i>Chlorella</i>", k: "protoctists", c: ["A single cell", "Has a nucleus", "Cellulose cell wall", "Makes food by photosynthesis"] },
  { id: "bacteria-ecoli", name: "<i>E. coli</i>", k: "bacteria", c: ["A single cell", "No nucleus", "Cell wall made of peptidoglycan", "DNA is a loop with extra plasmid rings"] },
  { id: "influenza", name: "Influenza virus", k: "virus", c: ["Not made of cells at all", "No nucleus, cytoplasm or organelles", "A protein coat around RNA", "Reproduces only inside a host cell"] }
];
const CRED = { maize: ["Ay treasure", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"], "polar-bear": ["Arturo de Frias Marques", "CC BY-SA 4.0", "https://creativecommons.org/licenses/by-sa/4.0/"], mushroom: ["Mike Pennington", "CC BY-SA 2.0", "https://creativecommons.org/licenses/by-sa/2.0/"], yeast: ["Masur", "public domain"], amoeba: ["Cymothoa exigua", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/"], chlorella: ["NEON_ja", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/"], "bacteria-ecoli": ["Janice Haney Carr / CDC", "public domain"], influenza: ["NIH Image Gallery", "public domain"], mosquito: ["US Department of Agriculture", "public domain"], lactobacillus: ["Mogana Das Murtey & Patchamuthu Ramasamy", "CC BY-SA 3.0", "https://creativecommons.org/licenses/by-sa/3.0/"] };
$("#credits").innerHTML = "Photos (Wikimedia Commons): " + Object.entries(CRED).map(([id, c]) => `${id.replace(/-/g, " ")}: ${c[0]}, ${c[2] ? `<a href="${c[2]}" target="_blank" rel="noopener noreferrer">${c[1]}</a>` : c[1]}`).join(" · ");

(function key() {
  const ids = ["kCells", "kNuc", "kWall", "kNut"].map(i => $("#" + i));
  function classify() {
    const [cells, nuc, wall, nut] = ids.map(s => s.value);
    if (nuc === "no") return ["bacteria", "Bacteria", "Single-celled prokaryotes with a peptidoglycan wall, a circular chromosome and plasmids." + (wall !== "peptido" ? " (Real bacteria have peptidoglycan walls.)" : "")];
    if (wall === "peptido") return [null, "No organism matches", "Peptidoglycan walls only occur in bacteria, and bacteria have no nucleus."];
    if (cells === "multi") {
      if (wall === "cellulose") return nut === "photo" ? ["plants", "Plants", "Multicellular, cellulose wall, photosynthesis, chloroplasts, starch store."] : [null, "Check again", "Plants make their own food by photosynthesis."];
      if (wall === "chitin") return ["fungi", "Fungi", "Multicellular fungi with chitin walls and hyphae; they feed saprophytically."];
      return nut === "hetero" ? ["animals", "Animals", "Multicellular, no cell wall, feed on other organisms, store glycogen."] : [null, "Check again", "Animals eat other organisms (they cannot photosynthesise)."];
    }
    if (wall === "chitin") return ["fungi", "Fungi", "Single-celled fungi such as yeast have chitin walls."];
    return ["protoctists", "Protoctists", "Single-celled eukaryotes, the &ldquo;dustbin kingdom&rdquo;: <i>Amoeba</i>, <i>Chlorella</i>, <i>Plasmodium</i>."];
  }
  function show() { const [k, n, d] = classify(); const b = $("#kRes"); b.style.background = k ? `linear-gradient(135deg,${KCOL[k]},color-mix(in srgb,${KCOL[k]} 55%,#000))` : "linear-gradient(135deg,#555,#333)"; b.innerHTML = `<b>${n}</b><span>${d}</span>`; popIt(b); }
  ids.forEach(s => s.addEventListener("change", show)); show();

  // detective game
  const g = { order: [], i: 0, clues: 0, pts: 0, answered: false, over: false };
  const clueEl = $("#specClues"), ansEl = $("#specAns"), out = $("#specOut"), btn = $("#specClue");
  ansEl.innerHTML = Object.keys(KNAME).map(k => `<button style="--c:${KCOL[k]}" data-k="${k}">${KNAME[k]}</button>`).join("");
  const ansBtns = $$("button", ansEl);
  function round() {
    const s = g.order[g.i]; g.clues = 0; g.answered = false; $("#specImg").src = `photos/${s.id}.jpg`; $("#specImg").alt = "Mystery specimen";
    $("#specNum").textContent = `Specimen ${g.i + 1} / ${g.order.length}`; out.textContent = ""; btn.textContent = "Reveal next clue"; btn.disabled = false; ansBtns.forEach(b => b.disabled = false); drawClues();
  }
  function drawClues() { const s = g.order[g.i]; clueEl.innerHTML = s.c.map((c, i) => i < g.clues ? `<li>${c}</li>` : `<li class="hidden">Clue ${i + 1} hidden</li>`).join(""); }
  function start() { g.order = shuffle(SPEC).slice(0, 6); g.i = 0; g.pts = 0; g.over = false; round(); }
  btn.onclick = () => {
    if (g.over) return start();
    if (g.answered) { g.i++; if (g.i >= g.order.length) { const max = g.order.length * 4, pct = Math.round(g.pts / max * 100); out.textContent = `Case closed! ${g.pts} / ${max} points (${pct}%).` + (pct >= 60 ? " Lab badge earned." : " Aim for 60% to earn the badge."); if (pct >= 60) award("key"); g.over = true; btn.textContent = "Play again"; ansBtns.forEach(b => b.disabled = true); return; } return round(); }
    if (g.clues < 4) { g.clues++; drawClues(); if (g.clues === 4) btn.disabled = true; }
  };
  ansBtns.forEach(b => b.onclick = () => {
    if (g.answered || g.over) return; g.answered = true; const s = g.order[g.i], ok = b.dataset.k === s.k;
    const used = g.clues; g.clues = 4; drawClues();
    const earned = ok ? Math.max(1, 5 - Math.max(1, used)) : 0;
    g.pts += ok ? earned : 0;
    out.innerHTML = ok ? `<b>Correct:</b> ${s.name} is ${s.k === "virus" ? "not in any kingdom" : "in Kingdom " + KNAME[s.k]}. +${earned} point${earned > 1 ? "s" : ""} (fewer clues = more points).` : `<b>Not quite.</b> ${s.name} is ${s.k === "virus" ? "a virus, so it is not in any kingdom" : "in Kingdom " + KNAME[s.k]}. Read the clues again.`;
    if (ok) { const r = b.getBoundingClientRect(), h = $("#lab-key").getBoundingClientRect(); burstAt($("#lab-key"), r.left - h.left + r.width / 2, r.top - h.top, KCOL[s.k]); popIt(b); } else shake(b);
    btn.textContent = g.i + 1 < g.order.length ? "Next specimen" : "See result"; btn.disabled = false;
  });
  start();
})();

/* ---------------------------------------------------------------- practice exam */
(function quiz() {
  const N = Math.min(20, BANK.length); let qs = [], idx = 0, streak = 0, finished = false;
  const $q = id => $("#" + id); $q("qTot").textContent = N;
  function newQuiz() {
    qs = shuffle(BANK).slice(0, N).map(r => ({ q: r[0], exp: r[5], opts: shuffle([{ t: r[1], ok: true }, { t: r[2] }, { t: r[3] }, { t: r[4] }]), pick: null }));
    idx = 0; streak = 0; finished = false; render();
  }
  function tally() { let s = 0, d = 0; qs.forEach(q => { if (q.pick !== null) { d++; if (q.opts[q.pick].ok) s++; } }); return [s, d]; }
  function render() {
    const box = $q("quiz"); if (!$q("qText")) return;
    const q = qs[idx], [s, d] = tally();
    $q("qNum").textContent = idx + 1; $q("qScore").textContent = s; $q("qDone").textContent = d; $q("qProg").style.width = (d / N * 100) + "%"; $q("qStreak").textContent = streak > 1 ? `Streak x${streak}` : "";
    $q("qText").innerHTML = q.q;
    const o = $q("qOpts"); o.innerHTML = "";
    q.opts.forEach((op, i) => {
      const b = el("button", "", `${String.fromCharCode(65 + i)}. ${op.t}`);
      if (q.pick !== null) { b.disabled = true; if (op.ok) b.classList.add("ok"); else if (i === q.pick) b.classList.add("no"); }
      b.onclick = () => { if (q.pick !== null) return; q.pick = i; if (op.ok) { streak++; } else streak = 0; render(); if (op.ok) { popIt(o.children[i]); const r = o.children[i].getBoundingClientRect(), h = box.getBoundingClientRect(); burstAt(box, r.left - h.left + 30, r.top - h.top + r.height / 2); } else shake(o.children[i]); };
      o.appendChild(b);
    });
    const fb = $q("qFb");
    if (q.pick !== null) { const ok = q.opts[q.pick].ok; fb.hidden = false; fb.className = "quiz__fb " + (ok ? "ok" : "no"); fb.innerHTML = `<b>${ok ? "Correct." : "Not quite."}</b> ${q.exp}`; } else fb.hidden = true;
    $q("qPrev").disabled = idx === 0;
    const last = idx === N - 1, allDone = d === N;
    $q("qNext").textContent = last ? "See results" : "Next question"; $q("qNext").disabled = last ? !allDone : false;
  }
  function results() {
    finished = true; const [s] = tally(), pct = Math.round(s / N * 100); if (pct >= 60) { prog.quiz = true; saveProg(); renderProgress(); }
    const miss = qs.filter(q => !q.opts[q.pick].ok);
    $q("quiz").innerHTML = `<div class="qend"><h3>${s} / ${N} (${pct}%)</h3><p>${pct >= 80 ? "Excellent: you are exam ready on this topic." : pct >= 60 ? "Good work. Review the questions you missed below." : "Keep revising. Re-read the levels, try the labs, then take a new exam. (60% earns the exam badge.)"}</p>${miss.length ? "<p><b>Revise these:</b></p><ul>" + miss.map(q => `<li>${q.q}<br><small>Answer: ${q.opts.find(o => o.ok).t}</small></li>`).join("") + "</ul>" : "<p>No mistakes at all.</p>"}<button class="btn" id="qAgain">New exam</button></div>`;
    $q("qAgain").onclick = rebuild;
  }
  function rebuild() {
    $q("quiz").innerHTML = `<div class="quiz__bar"><span>Question <b id="qNum">1</b> of <span id="qTot">${N}</span></span><span>Score <b id="qScore">0</b> / <span id="qDone">0</span></span><span class="qstreak" id="qStreak"></span></div><div class="quiz__prog"><i id="qProg"></i></div><h3 id="qText" class="quiz__q"></h3><div class="quiz__opts" id="qOpts"></div><div class="quiz__fb" id="qFb" aria-live="polite" hidden></div><div class="gx-row quiz__nav"><button class="btn btn--ghost" id="qPrev">Previous</button><button class="btn" id="qNext">Next</button></div>`;
    wire(); newQuiz();
  }
  function wire() {
    $q("qPrev").onclick = () => { if (idx > 0) { idx--; render(); } };
    $q("qNext").onclick = () => { if (idx < N - 1) { idx++; render(); } else results(); };
  }
  $q("quizNew").onclick = () => { if ($q("qText")) newQuiz(); else rebuild(); };
  wire(); newQuiz();
})();
