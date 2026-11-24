/* Organelle Cannon - bonus round (launch-and-land, real 3D). Aim a vesicle cannon so the shot lands on the
   organelle the job advert describes. Open jelly = cytoplasm, the pink bilayer ring = membrane, the lime blocks = cell wall.
   Bonus only: no marks, no fail state, ~2 minutes on a wall-clock setInterval, silent (nothing here makes sound). */
import { T, C, L, esc, burstAt, floatText, shake, makeStage, reduced, clamp, glowSprite, noiseTex, std, mesh, canvasTex } from "./kit.js?v=1";
import { ORG, icon } from "./data.js?v=1";
import { makeNucleus, makeMito, makeChloro, makeRibosomes } from "./cell3d.js?v=1";

const G = 9.8, ELEV = Math.PI / 4, ROUND_MS = 120000;
const rangeOf = p => 4 + 20 * p, speedOf = p => Math.sqrt(G * rangeOf(p));
/* pads on the cell floor: x,z and radius (cannon sits at the origin firing towards +z) */
const PADS = {
  ribosome: { x: -4.1, z: 4.4, r: 1.9 }, mito: { x: 4.1, z: 8.5, r: 2.1 }, chloroplast: { x: 10.1, z: 6.5, r: 2.1 },
  nucleus: { x: -4.1, z: 13.4, r: 2.6 }, vacuole: { x: 8.7, z: 14.0, r: 3.3 },
};
const MEM = [19.5, 22.2], WALL = [22.5, 26];
const PROMPTS = [
  ["nucleus", () => L("Where is the cell's DNA, the instructions that control its activities?", "¿Dónde está el ADN de la célula, las instrucciones que controlan sus actividades?")],
  ["nucleus", () => L("Which part contains the chromosomes and the genes?", "¿Qué parte contiene los cromosomas y los genes?")],
  ["mito", () => L("Where does aerobic respiration release energy?", "¿Dónde libera energía la respiración aeróbica?")],
  ["mito", () => L("A muscle cell has MANY of these because it needs lots of energy.", "Una célula muscular tiene MUCHAS de estas porque necesita mucha energía.")],
  ["ribosome", () => L("Where are proteins made?", "¿Dónde se fabrican las proteínas?")],
  ["ribosome", () => L("Tiny particles that follow the genes' instructions to build proteins.", "Partículas diminutas que siguen las instrucciones de los genes para construir proteínas.")],
  ["chloroplast", () => L("Where does photosynthesis happen? (plant cells only)", "¿Dónde ocurre la fotosíntesis? (solo células vegetales)")],
  ["chloroplast", () => L("Contains chlorophyll, the green pigment that absorbs light.", "Contiene clorofila, el pigmento verde que absorbe la luz.")],
  ["vacuole", () => L("Which part is filled with cell sap and helps keep a plant cell firm?", "¿Qué parte está llena de savia y ayuda a mantener firme una célula vegetal?")],
  ["vacuole", () => L("A big permanent space of sugars, mineral ions and water in a plant cell.", "Un gran espacio permanente de azúcares, iones minerales y agua en una célula vegetal.")],
  ["cytoplasm", () => L("Land in the watery jelly where many chemical reactions happen and the organelles float.", "Cae en la gelatina acuosa donde ocurren muchas reacciones químicas y flotan los orgánulos.")],
  ["membrane", () => L("Which part is the thin boundary that controls what goes in and out?", "¿Qué parte es el límite fino que controla lo que entra y sale?")],
  ["wall", () => L("Which part is made of cellulose, protects the cell and keeps its shape? (plants only)", "¿Qué parte es de celulosa, protege la célula y mantiene su forma? (solo plantas)")],
  ["cytoplasm", () => L("Which part is the jelly-like liquid that holds everything inside the cell?", "¿Qué parte es el líquido gelatinoso que contiene todo dentro de la célula?")],
];
const where = (x, z) => {
  for (const k in PADS) { const p = PADS[k]; if (Math.hypot(x - p.x, z - p.z) <= p.r) return k; }
  const R = Math.hypot(x, z); if (R >= MEM[0] && R <= MEM[1]) return "membrane"; if (R >= WALL[0] && R <= WALL[1]) return "wall"; if (R > WALL[1]) return "outside"; return "cytoplasm";
};

export function mountCannonLaunch(host, sim) {
  host.innerHTML = `<div class="cc-launch"><div><p class="cc-launch__t">${L("Bonus round: Organelle Cannon", "Ronda bonus: Cañón de orgánulos")}</p>
    <p>${L("Aim the vesicle cannon so your shot lands on the part the advert describes. About two minutes, no lives, no marks, just for fun and practice.", "Apunta el cañón de vesículas para que tu disparo caiga en la parte que describe el anuncio. Unos dos minutos, sin vidas ni notas: solo diversión y práctica.")}</p>
    <div class="cc-row"><button type="button" class="cc-btn cc-btn--big" data-play>${L("Play", "Jugar")} ▶</button><button type="button" class="cc-btn cc-btn--ghost" data-skip>${L("Skip", "Saltar")}</button></div></div></div>`;
  host.querySelector("[data-skip]").addEventListener("click", () => { host.innerHTML = `<p class="cc-hint">${L("Bonus round skipped. Move on to Record whenever you are ready.", "Ronda bonus omitida. Pasa a Registrar cuando quieras.")}</p>`; });
  host.querySelector("[data-play]").addEventListener("click", () => mountCannon(host, sim));
}

function mountCannon(host, sim) {
  host.innerHTML = `<div class="cc-dash"><div class="cc-dash__stage cc-stage" data-fallback="${esc(L("3D view not available on this device. Skip this bonus round.", "La vista 3D no está disponible en este dispositivo. Omite esta ronda bonus."))}">
      <div class="cc-dash__hud"><span class="d-time">2:00</span><span class="d-score">0</span><span class="d-streak"></span></div>
      <div class="cc-dash__q"><div class="cc-qicon"></div><b></b></div><div class="cc-dash__toast"></div></div>
    <div class="cn-ctl"><label>${L("Aim left / right", "Apuntar izq. / der.")}<input type="range" min="-130" max="130" value="0" step="1" data-yaw aria-label="${L("Aim left or right", "Apuntar a izquierda o derecha")}"></label>
      <label>${L("Power", "Potencia")}<input type="range" min="0" max="100" value="50" step="1" data-pow aria-label="${L("Power", "Potencia")}"></label>
      <button type="button" class="cc-btn cc-btn--big" data-fire>${L("FIRE", "¡FUEGO!")} 💥</button></div>
    <div class="cc-dash__foot"><span>${L("Keys: ← → aim · ↑ ↓ power · Space fire", "Teclas: ← → apuntar · ↑ ↓ potencia · Espacio disparar")}</span><label class="cc-tg2"><input type="checkbox" data-guide checked> ${L("Aim guide", "Guía de puntería")}</label><button type="button" class="cc-btn cc-btn--ghost" data-end>${L("End round", "Terminar ronda")}</button></div></div>`;
  const stageEl = host.querySelector(".cc-dash__stage"), q = host.querySelector(".cc-dash__q"), qb = q.querySelector("b"), qi = q.querySelector(".cc-qicon"), toast = host.querySelector(".cc-dash__toast");
  const hTime = host.querySelector(".d-time"), hScore = host.querySelector(".d-score"), hStreak = host.querySelector(".d-streak");
  const yawEl = host.querySelector("[data-yaw]"), powEl = host.querySelector("[data-pow]"), fireBtn = host.querySelector("[data-fire]"), guideEl = host.querySelector("[data-guide]");
  const st = makeStage(stageEl, { cam: { theta: Math.PI, phi: 1.02, dist: 25, target: [0, 0, 11] }, orbit: false, sway: false, exposure: 1.0, hemi: .6, sun: 1.8, sunPos: [-6, 14, -2], shadowRange: 28, fitAspect: 1.2, limits: { minDist: 5, maxDist: 60 } });
  host.scrollIntoView({ block: "center", behavior: reduced() ? "auto" : "smooth" });
  if (!st) { stageEl.classList.add("cc-nogl"); return; }
  const sc = st.scene;
  sc.background = canvasTex(8, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#0e3550"); gr.addColorStop(1, "#05141f"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  /* jelly floor */
  const floorTex = noiseTex("#f2c88a", .35, 3200, [5, 5], 256, 21);
  const floor = mesh(new T.CircleGeometry(27, 72), std(0xffffff, .55, 0, { map: floorTex, bumpMap: noiseTex("#808080", .7, 2400, [5, 5], 128, 8), bumpScale: .06, emissive: C(0x8a5a22), emissiveIntensity: .18 }), 0, 0, 0); floor.rotation.x = -Math.PI / 2; floor.castShadow = false; sc.add(floor);
  const labels = [];
  const addLabel = (key, x, y, z) => { const d = document.createElement("div"); d.className = "cn-label"; d.style.setProperty("--c", ORG[key].color); d.textContent = ORG[key].name(); stageEl.append(d); labels.push({ d, v: new T.Vector3(x, y, z) }); };
  const padRing = (key, p) => { const r = new T.Mesh(new T.RingGeometry(p.r - .12, p.r + .05, 48), new T.MeshBasicMaterial({ color: C(ORG[key].color), transparent: true, opacity: .85, side: T.DoubleSide })); r.rotation.x = -Math.PI / 2; r.position.set(p.x, .03, p.z); sc.add(r); const f = new T.Mesh(new T.CircleGeometry(p.r - .12, 40), new T.MeshBasicMaterial({ color: C(ORG[key].color), transparent: true, opacity: .13 })); f.rotation.x = -Math.PI / 2; f.position.set(p.x, .02, p.z); sc.add(f); };
  const place = (obj, key, s, y) => { const p = PADS[key]; obj.scale.setScalar(s); obj.position.set(p.x, y, p.z); sc.add(obj); obj.traverse(m => { if (m.isMesh) { m.castShadow = true; } }); padRing(key, p); addLabel(key, p.x, y + 1.9, p.z); return obj; };
  const nuc = place(makeNucleus(), "nucleus", 2.2, 1.5), mit = place(makeMito(3), "mito", 2.0, 1.1), chl = place(makeChloro(2), "chloroplast", 2.0, 1.0), rib = place(makeRibosomes(4), "ribosome", 2.6, 1.0);
  rib.children.forEach(c => { if (c.geometry && c.geometry.type === "SphereGeometry" && c.geometry.parameters.radius > .3) c.visible = false; });
  { /* vacuole: translucent dome */
    const p = PADS.vacuole, v = new T.Mesh(new T.SphereGeometry(p.r, 36, 20, 0, 6.283, 0, 1.45), new T.MeshPhysicalMaterial({ color: C(0x5aa9ff), transparent: true, opacity: .5, roughness: .08, clearcoat: 1, emissive: C(0x5aa9ff), emissiveIntensity: .12, side: T.DoubleSide, depthWrite: false })); v.position.set(p.x, 0, p.z); sc.add(v); padRing("vacuole", p); addLabel("vacuole", p.x, p.r * .9 + .8, p.z); }
  { /* membrane = phospholipid bilayer of pink heads; wall = lime cellulose blocks; both as arcs around the far side */
    const hm = std(0xff8fb8, .35, 0, { emissive: C(0xff5f9a), emissiveIntensity: .25 }), tm = std(0xffd0e0, .5), bm = std(0xb7dc5d, .6, 0, { map: noiseTex("#b7dc5d", .35, 1400, [1, 1], 64, 6), emissive: C(0x6fa31e), emissiveIntensity: .1 });
    for (let a = -1.45; a <= 1.45; a += .045) { [[20.1, 0], [21.6, 0]].forEach(([R], j) => { const s = mesh(new T.SphereGeometry(.34, 10, 8), hm, Math.sin(a) * R, .5, Math.cos(a) * R); sc.add(s); const t1 = mesh(new T.CylinderGeometry(.06, .06, .9, 5), tm, Math.sin(a) * (R + (j ? -.55 : .55)), .5, Math.cos(a) * (R + (j ? -.55 : .55)), false); sc.add(t1); }); }
    for (let a = -1.45; a <= 1.45; a += .09) { const b = mesh(new T.BoxGeometry(1.5, 1.5, 3.3), bm, Math.sin(a) * 24.3, .75, Math.cos(a) * 24.3); b.rotation.y = a; sc.add(b); }
    addLabel("membrane", 0, 1.8, 20.9); addLabel("wall", 0, 2.4, 24.3);
    const jl = (key, text, x, z) => { const d = document.createElement("div"); d.className = "cn-label cn-label--s"; d.style.setProperty("--c", ORG[key].color); d.textContent = text; stageEl.append(d); labels.push({ d, v: new T.Vector3(x, .6, z) }); };
    jl("cytoplasm", ORG.cytoplasm.name() + " = " + L("open jelly", "gelatina libre"), -1.5, 9.5);
  }
  /* cannon */
  const cannon = new T.Group(); cannon.position.set(0, 0, -.2); sc.add(cannon);
  const metal = std(0x9fb2c0, .35, .85), brass = std(0xd9a441, .4, .9);
  const base = mesh(new T.CylinderGeometry(1.1, 1.3, .5, 24), metal, 0, .25, 0); cannon.add(base);
  const barrelPiv = new T.Group(); barrelPiv.position.set(0, .8, 0); barrelPiv.rotation.x = -ELEV; cannon.add(barrelPiv);
  const barrel = mesh(new T.CylinderGeometry(.42, .55, 2.4, 24), brass, 0, 0, 0); barrel.rotation.x = Math.PI / 2; barrel.position.z = 1.0; barrelPiv.add(barrel);
  const ringM = mesh(new T.TorusGeometry(.5, .08, 10, 24), metal, 0, 0, 2.2); barrelPiv.add(ringM);
  [-1, 1].forEach(s => { const w = mesh(new T.CylinderGeometry(.55, .55, .22, 20), std(0x4a3a2a, .8), s * 1.0, .45, 0); w.rotation.z = Math.PI / 2; cannon.add(w); });
  const muzzle = new T.Object3D(); muzzle.position.set(0, 0, 2.3); barrelPiv.add(muzzle);
  /* aim guide: landing ring + dotted arc */
  const mark = new T.Mesh(new T.RingGeometry(.55, .85, 32), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .95, side: T.DoubleSide, depthTest: false })); mark.rotation.x = -Math.PI / 2; mark.renderOrder = 9; sc.add(mark);
  const dots = []; for (let i = 0; i < 14; i++) { const d = new T.Mesh(new T.SphereGeometry(.13, 8, 6), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .7, depthTest: false })); d.renderOrder = 8; sc.add(d); dots.push(d); }
  /* drifting dust for depth */
  const dn = 120, dp = new Float32Array(dn * 3); for (let i = 0; i < dn; i++) { dp[i * 3] = (Math.random() - .5) * 50; dp[i * 3 + 1] = 1 + Math.random() * 9; dp[i * 3 + 2] = Math.random() * 34 - 4; }
  const dg = new T.BufferGeometry(); dg.setAttribute("position", new T.BufferAttribute(dp, 3)); const dust = new T.Points(dg, new T.PointsMaterial({ color: C(0xfff0c8), size: .09, transparent: true, opacity: .5, depthWrite: false, blending: T.AdditiveBlending })); sc.add(dust);
  const rim = new T.PointLight(C(0x4de3ff), 1.2, 60); rim.position.set(-12, 8, 24); sc.add(rim);

  /* game state */
  const S = { yaw: 0, pow: .5, score: 0, streak: 0, best: 0, ok: 0, n: 0, miss: [], busy: false, over: false, qi: 0, order: [], cur: null };
  const shuf = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const nextQ = () => { if (!S.order.length) S.order = shuf(PROMPTS.map((_, i) => i)); S.cur = PROMPTS[S.order.pop()]; qb.textContent = S.cur[1](); qi.innerHTML = icon(S.cur[0], 44); q.hidden = false; };
  const showToast = (cls, html) => { toast.className = "cc-dash__toast show " + cls; toast.innerHTML = html; clearTimeout(showToast.t); showToast.t = setTimeout(() => toast.classList.remove("show"), 3400); };
  const land = () => { const R = rangeOf(S.pow), a = S.yaw; return [Math.sin(a) * R, Math.cos(a) * R]; };
  function sync() {
    const [lx, lz] = land(); cannon.rotation.y = S.yaw; mark.position.set(lx, .08, lz); mark.visible = guideEl.checked; mark.material.color.set(C(ORG[where(lx, lz)] ? ORG[where(lx, lz)].color : "#ffffff"));
    const v = speedOf(S.pow), T2 = 2 * v * Math.sin(ELEV) / G;
    dots.forEach((d, i) => { const t = T2 * (i + 1) / (dots.length + 1), h = v * Math.cos(ELEV) * t; d.position.set(Math.sin(S.yaw) * h, .8 + v * Math.sin(ELEV) * t - .5 * G * t * t, Math.cos(S.yaw) * h); d.visible = guideEl.checked; });
  }
  yawEl.addEventListener("input", () => { S.yaw = +yawEl.value / 100; sync(); }); powEl.addEventListener("input", () => { S.pow = +powEl.value / 100; sync(); }); guideEl.addEventListener("change", sync);
  const key = e => {
    if (S.over || !host.isConnected) return; const k = e.key; const t = e.target && e.target.tagName; if (t === "BUTTON" && (k === " " || k === "Enter")) return; if (t === "INPUT" && e.target.type === "text") return;
    if (k === "ArrowLeft" || k === "a" || k === "A") { yawEl.value = clamp(+yawEl.value - 4, -130, 130); } else if (k === "ArrowRight" || k === "d" || k === "D") { yawEl.value = clamp(+yawEl.value + 4, -130, 130); }
    else if (k === "ArrowUp" || k === "w" || k === "W") { powEl.value = clamp(+powEl.value + 3, 0, 100); } else if (k === "ArrowDown" || k === "s" || k === "S") { powEl.value = clamp(+powEl.value - 3, 0, 100); }
    else if (k === " " || k === "Enter") { fire(); } else return; e.preventDefault(); S.yaw = +yawEl.value / 100; S.pow = +powEl.value / 100; sync();
  };
  document.addEventListener("keydown", key);

  /* shot */
  const ball = mesh(new T.SphereGeometry(.42, 20, 14), std(0xbff3ff, .15, 0, { emissive: C(0x4de3ff), emissiveIntensity: .9 }), 0, -9, 0); sc.add(ball); const bglow = glowSprite(0x4de3ff, 2.4); ball.add(bglow);
  const trail = []; for (let i = 0; i < 16; i++) { const t = glowSprite(0x4de3ff, 1 - i * .04); t.position.y = -9; t.material.opacity = .5 * (1 - i / 16); sc.add(t); trail.push(t); }
  let flight = null;
  function fire() {
    if (S.busy || S.over || !S.cur) return; S.busy = true; fireBtn.disabled = true; const v = speedOf(S.pow), Tf = 2 * v * Math.sin(ELEV) / G, yaw = S.yaw; const [lx, lz] = land();
    flight = { t0: performance.now(), v, Tf, yaw }; if (!reduced()) { st.punch(1.03); barrelPiv.position.z = -.4; setTimeout(() => (barrelPiv.position.z = 0), 160); }
    st.burst(new T.Vector3(Math.sin(yaw) * 2.4, 1.6, Math.cos(yaw) * 2.4), 0xffe08a, 22, 2.2, .1);
    setTimeout(() => resolve(lx, lz), Tf * 1000 + 40);
  }
  fireBtn.addEventListener("click", fire);
  function resolve(lx, lz) {
    flight = null; ball.position.y = -9; trail.forEach(t => (t.position.y = -9)); const hit = where(lx, lz), want = S.cur[0]; S.n++;
    const col = ORG[hit] ? ORG[hit].color : "#9db4c4"; st.burst(new T.Vector3(lx, .4, lz), C(col).getHex(), 40, 3.2, .16);
    const ring = new T.Mesh(new T.RingGeometry(.2, .45, 40), new T.MeshBasicMaterial({ color: C(col), transparent: true, opacity: .9, side: T.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.set(lx, .1, lz); sc.add(ring);
    const ob = { k: 0 }; st.tween(ob, { k: 1 }, .9, { done: () => { sc.remove(ring); ring.geometry.dispose(); } }); const sync2 = () => { ring.scale.setScalar(1 + ob.k * 5); ring.material.opacity = .9 * (1 - ob.k); }; const tick = setInterval(() => { sync2(); if (!ring.parent) clearInterval(tick); }, 33);
    if (hit === want) {
      S.ok++; S.streak++; S.best = Math.max(S.best, S.streak); const pts = 100 + Math.min(100, (S.streak - 1) * 20); S.score += pts; floatText(stageEl, "+" + pts, "#7dffb4");
      showToast("good", `✔ <b>${esc(ORG[want].name())}</b> — ${esc(ORG[want].hook())}`); st.punch(.95);
    } else {
      S.streak = 0; S.miss.push(want); shake(stageEl);
      const got = hit === "outside" ? L("Off the cell!", "¡Fuera de la célula!") : `${L("You landed on", "Has caído en")} <b>${esc(ORG[hit].name())}</b>`;
      showToast("bad", `${got}. ${L("The answer was", "La respuesta era")} <b>${esc(ORG[want].name())}</b>. ${esc(ORG[want].hook())}`);
    }
    hScore.textContent = S.score; hStreak.textContent = S.streak > 1 ? "🔥 " + S.streak : "";
    setTimeout(() => { S.busy = false; if (S.over) return finish(); fireBtn.disabled = false; nextQ(); }, 1900);
  }
  /* wall-clock countdown (setInterval, never rAF) */
  const t0 = Date.now(); const clock = setInterval(() => {
    if (!host.isConnected) { clearInterval(clock); document.removeEventListener("keydown", key); return; }
    const left = Math.max(0, ROUND_MS - (Date.now() - t0)); hTime.textContent = Math.floor(left / 60000) + ":" + String(Math.floor(left / 1000) % 60).padStart(2, "0");
    if (left <= 0) { clearInterval(clock); S.over = true; if (!S.busy) finish(); }
  }, 250);
  host.querySelector("[data-end]").addEventListener("click", () => { clearInterval(clock); S.over = true; if (!S.busy) finish(); });

  st.onFrame.push((dt, t) => {
    const w = new T.Vector3();
    labels.forEach(l => { w.copy(l.v).project(st.camera); const vis = w.z < 1; l.d.style.display = vis ? "" : "none"; if (vis) { l.d.style.left = (w.x * .5 + .5) * stageEl.clientWidth + "px"; l.d.style.top = (-w.y * .5 + .5) * stageEl.clientHeight + "px"; } });
    if (!reduced()) { nuc.rotation.y += dt * .3; mit.rotation.y += dt * .4; chl.rotation.y += dt * .35; rib.rotation.y += dt * .5; mark.scale.setScalar(1 + Math.sin(t * 4) * .06); const a = dg.attributes.position; for (let i = 0; i < dn; i++) { a.array[i * 3 + 1] += Math.sin(t + i) * dt * .15; } a.needsUpdate = true; }
    if (flight) {
      const e = (performance.now() - flight.t0) / 1000, tt = clamp(e, 0, flight.Tf), h = flight.v * Math.cos(ELEV) * tt;
      ball.position.set(Math.sin(flight.yaw) * h, .8 + flight.v * Math.sin(ELEV) * tt - .5 * G * tt * tt, Math.cos(flight.yaw) * h);
      for (let i = trail.length - 1; i > 0; i--) trail[i].position.copy(trail[i - 1].position); trail[0].position.copy(ball.position);
    }
  });
  function finish() {
    document.removeEventListener("keydown", key); q.hidden = true; const acc = S.n ? Math.round(S.ok / S.n * 100) : 0;
    const uniq = [...new Set(S.miss)];
    sim.recordTrial({ station: L("Bonus: Organelle Cannon", "Bonus: Cañón de orgánulos"), step: L("Round", "Ronda"), part: L("all", "todas"), result: `${S.ok}/${S.n} ${L("correct", "correctas")}, ${L("best streak", "mejor racha")} ${S.best}` });
    host.innerHTML = `<div class="cc-dashend"><p class="cc-h">${L("Round over!", "¡Ronda terminada!")}</p><div class="cc-stats"><span>${L("Score", "Puntos")}<b>${S.score}</b></span><span>${L("Accuracy", "Precisión")}<b>${acc}%</b></span><span>${L("Best streak", "Mejor racha")}<b>${S.best}</b></span><span>${L("Shots", "Disparos")}<b>${S.n}</b></span></div>
      ${uniq.length ? `<p class="cc-sub">${L("Parts to revisit:", "Partes para repasar:")}</p><ul class="cc-miss">${uniq.map(k => `<li>${icon(k, 36)}<div><b>${esc(ORG[k].name())}</b><small>${esc(ORG[k].hook())}</small></div></li>`).join("")}</ul>` : `<p class="cc-sub">${L("Perfect aim, no part to revisit!", "¡Puntería perfecta, nada que repasar!")}</p>`}
      <div class="cc-row"><button type="button" class="cc-btn" data-again>${L("Play again", "Jugar otra vez")}</button></div></div>`;
    host.querySelector("[data-again]").addEventListener("click", () => mountCannon(host, sim));
    st.dispose();
  }
  sync(); nextQ();
}
