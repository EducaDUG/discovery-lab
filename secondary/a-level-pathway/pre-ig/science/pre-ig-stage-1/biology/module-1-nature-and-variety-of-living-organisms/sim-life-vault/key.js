/* Station 2 — the Kingdom Key (a real dichotomous key, the activity's core
   mechanic). A specimen pod rides a glowing tube network down five yes/no
   forks into one of six vaults (five kingdoms + the separate virus vault).
   The student reads the evidence card and steers at every fork; feedback
   only comes once the pod lands (decide first, then see — no gating on
   being right). */
import { L, reduced, SPEC, GROUPS, KEY_Q, KEY_ORDER, img, creditLine } from "./data.js?v=1";
import { hasWebGL, makeStage, dressVault, photoTexture, glowTexture, textSprite, burst3D, burstAt, shake, floatText, blip } from "./fx.js?v=1";

const NEEDED = 8;
const NODE_POS = { cells: [0, 7.0, 0], nucleus: [0.7, 5.6, 0], chitin: [0, 4.2, 0], multi: [0.7, 2.8, 0], chloro: [0, 1.5, 0] };
const VAULT_POS = { virus: [-3.9, 5.9, 0.6], bacteria: [4.3, 4.6, 0.6], fungi: [-4.1, 3.2, 0.6], protoctist: [4.3, 1.9, 0.6], plant: [-3.2, 0.55, 0.9], animal: [3.4, 0.55, 0.9] };
const REP = { virus: "influenza", bacteria: "lactobacillus", fungi: "mushroom", protoctist: "amoeba", plant: "fern", animal: "polar-bear" };

function correctRoute(id) {
  const k = SPEC[id].key; const route = []; let node = "cells";
  while (node && node[0] !== "@") { const a = !!k[node]; route.push({ node, a }); node = a ? KEY_Q[node].yes : KEY_Q[node].no; }
  return { route, end: node.slice(1) };
}

export function buildKey(root, sim, onDone, muteBtn) {
  sim.state.key = sim.state.key || { i: 0, results: [] };
  const prog = sim.state.key;
  let route = [], node = "cells", busy = false;

  const card = document.createElement("section"); card.className = "card lv-station";
  card.innerHTML = `
    <div class="lv-station__head"><p class="eyebrow">${L("Station 2 · The Kingdom Key", "Estación 2 · La Clave de los Reinos")}</p><span class="lv-head-tools"></span></div>
    <h3 class="lv-station__title">${L("Steer each specimen to its kingdom vault", "Guía cada espécimen hasta la cámara de su reino")}</h3>
    <p class="q__hint">${L("Read the evidence card, then answer each fork YES or NO (keys Y / N work too). The pod slides down the branch you choose. Sort at least 8 specimens.",
      "Lee la ficha de pruebas y responde SÍ o NO en cada bifurcación (también con las teclas Y / N). La cápsula baja por la rama que elijas. Clasifica al menos 8 especímenes.")}</p>
    <div class="lv-key">
      <div class="lv-key__side">
        <div class="lv-key__card"></div>
        <div class="lv-key__ask" aria-live="polite"></div>
        <div class="lv-key__fb" aria-live="polite"></div>
      </div>
      <div class="lv-stage lv-stage--key"><span class="lv-hud"></span></div>
    </div>
    <div class="lv-key__trail"></div>
    <p class="lv-credit"></p>`;
  root.append(card);
  card.querySelector(".lv-head-tools").append(muteBtn());
  card.querySelector(".lv-credit").innerHTML = creditLine(KEY_ORDER);
  const evCard = card.querySelector(".lv-key__card"), stageEl = card.querySelector(".lv-stage"), hud = card.querySelector(".lv-hud");
  const ask = card.querySelector(".lv-key__ask"), trail = card.querySelector(".lv-key__trail"), fb = card.querySelector(".lv-key__fb");

  const s3 = hasWebGL ? build3D(stageEl) : null;
  if (!s3) { stageEl.classList.add("lv-stage--flat"); stageEl.insertAdjacentHTML("beforeend", `<div class="lv-flat-key"></div>`); }

  const curId = () => KEY_ORDER[prog.i % KEY_ORDER.length];

  function paintCard() {
    const id = curId(), s = SPEC[id];
    evCard.innerHTML = `<p class="lv-key__count">${L("Specimen", "Espécimen")} ${prog.i + 1} · ${L("sorted", "clasificados")} ${prog.results.length}/${NEEDED}</p>
      <img src="${img(id)}" alt="${s.name()}"><p class="lv-key__name">${s.name()}</p>
      <p class="eyebrow" style="margin:.4em 0 .2em">${L("Evidence card", "Ficha de pruebas")}</p>
      <ul class="lv-facts">${s.facts().map(f => `<li>${f}</li>`).join("")}</ul>`;
    const c = prog.results.filter(r => r.correct).length;
    hud.innerHTML = `${L("Kingdom Key", "Clave de Reinos")} · ${L("correct", "correctos")} ${c}/${prog.results.length}`;
  }
  function paintAsk() {
    if (node[0] === "@") { ask.innerHTML = ""; return; }
    const qn = Object.keys(KEY_Q).indexOf(node) + 1;
    ask.innerHTML = `<p class="lv-ask__q"><span class="lv-ask__n">Q${qn}</span> ${KEY_Q[node].q()}</p>
      <div class="lv-ask__btns"><button type="button" class="btn lv-yes" data-a="1">${L("YES", "SÍ")} <kbd>Y</kbd></button>
      <button type="button" class="btn lv-no" data-a="0">${L("NO", "NO")} <kbd>N</kbd></button></div>`;
    ask.querySelectorAll("button").forEach(b => b.addEventListener("click", () => answer(b.dataset.a === "1", b)));
  }
  function paintTrail(correct) {
    const chip = (r, wrong) => `<span class="lv-chip ${wrong ? "is-wrong" : ""}">${KEY_Q[r.node].q().replace(/\?$/, "")}: <b>${r.a ? L("yes", "sí") : L("no", "no")}</b></span>`;
    trail.innerHTML = route.map((r, i) => chip(r, correct && correct.route[i] && correct.route[i].a !== r.a)).join(`<span class="lv-arrow">→</span>`);
  }

  function answer(a, btn) {
    if (busy || node[0] === "@") return;
    blip("tap"); burstAt(btn, a ? "#2fbf71" : "#e0644b", 8);
    route.push({ node, a });
    const next = a ? KEY_Q[node].yes : KEY_Q[node].no;
    const from = node; node = next;
    paintTrail();
    busy = true; ask.querySelectorAll("button").forEach(b => b.disabled = true);
    s3?.travel(from, next, a);
    setTimeout(() => {               // wall-clock, never rAF (CLAUDE.md §4)
      busy = false;
      if (node[0] === "@") { ask.innerHTML = ""; land(node.slice(1)); } else paintAsk();
    }, reduced() || !s3 ? 150 : 950);
  }

  function land(group) {
    const id = curId(), right = SPEC[id].group === group, corr = correctRoute(id);
    const res = { id, route: route.map(r => `${r.node}:${r.a ? "Y" : "N"}`), chosen: group, correct: right };
    prog.results.push(res); sim.saveState();
    sim.recordTrial({
      station: L("Kingdom key", "Clave"),
      sample: SPEC[id].name(),
      evidence: route.map(r => `${KEY_Q[r.node].s()}: ${r.a ? L("yes", "sí") : "no"}`).join("; "),
      verdict: GROUPS[group].name(),
      check: right ? L("Correct", "Correcto") : L(`Wrong - belongs in ${GROUPS[corr.end].name()}`, `Incorrecto - pertenece a ${GROUPS[corr.end].name()}`),
    });
    s3?.landed(group, right, corr.end);
    paintTrail(right ? null : corr);
    const firstWrong = corr.route.findIndex((r, i) => !route[i] || route[i].a !== r.a);
    const hook = {
      plant: L("Chloroplasts + cellulose walls = plant.", "Cloroplastos + paredes de celulosa = planta."),
      animal: L("Many cells, no cell walls, no chloroplasts = animal.", "Muchas células, sin pared, sin cloroplastos = animal."),
      fungi: L("Chitin walls (like an insect's shell) = fungus.", "Paredes de quitina (como el caparazón de un insecto) = hongo."),
      protoctist: L("One cell with a nucleus, no chitin = protoctist (the 'dustbin' kingdom).", "Una célula con núcleo, sin quitina = protoctista (el reino 'cajón de sastre')."),
      bacteria: L("No nucleus = prokaryote = bacteria.", "Sin núcleo = procariota = bacteria."),
      virus: L("Not made of cells = virus, outside the five kingdoms.", "No está formado por células = virus, fuera de los cinco reinos."),
    }[corr.end];
    const btnRow = prog.results.length < KEY_ORDER.length ? `<button type="button" class="btn lv-next">${L("Next specimen →", "Siguiente espécimen →")}</button>` : "";
    fb.innerHTML = right
      ? `<p class="lv-fb lv-fb--ok"><b>${L("Sorted!", "¡Clasificado!")}</b> ${SPEC[id].name()} → ${GROUPS[group].name()}. ${hook}</p>${btnRow}`
      : `<p class="lv-fb lv-fb--bad"><b>${L("Wrong vault.", "Cámara equivocada.")}</b> ${SPEC[id].name()} ${L("belongs in", "pertenece a")} <b>${GROUPS[corr.end].name()}</b>. ${firstWrong >= 0 ? L("The route split at: ", "La ruta se desvió en: ") + `<i>${KEY_Q[corr.route[firstWrong].node].q()}</i> → ${corr.route[firstWrong].a ? L("yes", "sí") : "no"}. ` : ""}${hook}</p>${btnRow}`;
    if (right) { blip("win"); floatText(fb, "+10 XP"); } else { blip("bad"); shake(fb.firstElementChild); }
    fb.querySelector(".lv-next")?.addEventListener("click", nextSpecimen);
    if (!s3) paintFlat(group, right);
    if (prog.results.length >= NEEDED && !prog._done) {
      prog._done = true; sim.saveState();
      sim.award("lv-key", L("Kingdom Navigator", "Navegante de Reinos"));
      onDone();
    }
    paintCard();
  }
  function nextSpecimen() {
    prog.i++; sim.saveState(); route = []; node = "cells"; fb.innerHTML = ""; trail.innerHTML = "";
    paintCard(); paintAsk(); s3?.reset(curId()); if (!s3) paintFlat();
  }
  function paintFlat(group, ok) {
    const f = stageEl.querySelector(".lv-flat-key"); if (!f) return;
    f.innerHTML = Object.keys(GROUPS).map(g => `<span class="lv-flat-vault ${g === group ? (ok ? "is-ok" : "is-bad") : ""}" style="--c:${GROUPS[g].color}">${GROUPS[g].name()}</span>`).join("");
  }

  // keyboard Y / N while the station has focus
  card.tabIndex = -1;
  card.addEventListener("keydown", e => {
    if (e.target.matches("input,textarea")) return;
    const k = e.key.toLowerCase();
    if (k === "y" || k === "s") { const b = ask.querySelector(".lv-yes"); if (b && !b.disabled) { e.preventDefault(); answer(true, b); } }
    if (k === "n") { const b = ask.querySelector(".lv-no"); if (b && !b.disabled) { e.preventDefault(); answer(false, b); } }
  });

  // restore: if the last specimen was already landed, offer the next one
  const lastDone = prog.results.length > prog.i;
  if (lastDone) { prog.i = prog.results.length; }
  paintCard(); paintAsk(); s3?.reset(curId()); if (!s3) paintFlat();
}

/* ============================ 3D key tree ============================ */
function build3D(wrap) {
  const st = makeStage(wrap, { dist: 12.5, target: [0, 3.7, 0], fov: 50, minPhi: 0.9, maxPhi: 1.5, autoSpin: 0 });
  st.orbit.theta = 0; st.orbit.phi = 1.38;
  const { THREE, scene } = st;
  dressVault(st, { floorColor: [10, 40, 48], spores: 260, radius: 11 });

  // gentle sway instead of full auto-orbit (the tree reads best from the front)
  let swayBase = 0;
  st.tick((dt, now) => { if (!reduced() && !st.isDragging()) { swayBase = Math.sin(now / 5200) * 0.28; st.orbit.theta += (swayBase - st.orbit.theta) * dt * 0.4; } });

  // flowing tube texture
  const fc = document.createElement("canvas"); fc.width = 128; fc.height = 16; const fg = fc.getContext("2d");
  const grd = fg.createLinearGradient(0, 0, 128, 0); grd.addColorStop(0, "#0b3b44"); grd.addColorStop(0.45, "#5ee6c8"); grd.addColorStop(0.55, "#d6fff5"); grd.addColorStop(1, "#0b3b44");
  fg.fillStyle = grd; fg.fillRect(0, 0, 128, 16);
  const flowTex = new THREE.CanvasTexture(fc); flowTex.wrapS = flowTex.wrapT = THREE.RepeatWrapping; flowTex.encoding = THREE.sRGBEncoding;
  const tubes = {};
  function tube(key, a, b, color = 0x5ee6c8) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const mid = A.clone().lerp(B, 0.5); mid.y += 0.25; mid.z += 0.4;
    const curve = new THREE.QuadraticBezierCurve3(A, mid, B);
    const tex = flowTex.clone(); tex.needsUpdate = true; tex.repeat.set(4, 1);
    const mat = new THREE.MeshStandardMaterial({ color: 0x163f48, emissive: color, emissiveMap: tex, emissiveIntensity: 0.55, transparent: true, opacity: 0.85, roughness: 0.2, metalness: 0.1 });
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.13, 12, false), mat); scene.add(m);
    tubes[key] = { curve, mat, tex };
  }
  const yesNo = [];
  Object.entries(KEY_Q).forEach(([k, q]) => {
    const p = NODE_POS[k];
    const to = t => t[0] === "@" ? VAULT_POS[t.slice(1)] : NODE_POS[t];
    tube(`${k}:Y`, p, to(q.yes), 0x7dffb4); tube(`${k}:N`, p, to(q.no), 0xff9a7a);
    [["yes", q.yes, L("YES", "SÍ"), "#7dffb4"], ["no", q.no, "NO", "#ff9a7a"]].forEach(([w, t, txt, col]) => {
      const B = to(t), lab = textSprite(txt, { size: 40, border: col, color: col, padX: 16 });
      lab.position.set(p[0] + (B[0] - p[0]) * 0.32, p[1] + (B[1] - p[1]) * 0.32 + 0.35, 0.6); lab.scale.multiplyScalar(0.8); scene.add(lab); yesNo.push(lab);
    });
  });
  // entry tube from the top
  tube("start", [0, 8.6, 0], NODE_POS.cells);

  // question nodes
  const nodeMeshes = {};
  Object.keys(KEY_Q).forEach((k, i) => {
    const mat = new THREE.MeshStandardMaterial({ color: 0x0f2d35, emissive: 0x5ee6c8, emissiveIntensity: 0.6, roughness: 0.15, metalness: 0.3 });
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 1), mat); m.position.set(...NODE_POS[k]); scene.add(m);
    const lab = textSprite(`Q${i + 1}`, { size: 40, padX: 14 }); lab.position.set(NODE_POS[k][0] + 0.75, NODE_POS[k][1] + 0.2, 0.2); lab.scale.multiplyScalar(0.7); scene.add(lab);
    nodeMeshes[k] = { m, mat };
  });

  // vaults
  const vaults = {};
  Object.entries(VAULT_POS).forEach(([g, p]) => {
    const grp = new THREE.Group(); grp.position.set(...p); scene.add(grp);
    const col = GROUPS[g].hex;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.22, 40), new THREE.MeshStandardMaterial({ color: 0x8aa2ad, metalness: 0.8, roughness: 0.3 }));
    base.position.y = -0.6; base.castShadow = true; grp.add(base);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 1.1, 40, 1, true), new THREE.MeshPhysicalMaterial({ color: col, transparent: true, opacity: 0.22, roughness: 0.05, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false }));
    grp.add(glass);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.05, 10, 50), new THREE.MeshBasicMaterial({ color: col })); ring.rotation.x = Math.PI / 2; ring.position.y = 0.56; grp.add(ring);
    const pic = new THREE.Sprite(new THREE.SpriteMaterial({ map: photoTexture(`photos/${REP[g]}.jpg`, true), transparent: true }));
    pic.scale.set(0.8, 0.8, 1); grp.add(pic);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: col, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(2.6, 2.6, 1); grp.add(glow);
    const lab = textSprite(GROUPS[g].name(), { size: 40, border: GROUPS[g].color, padX: 18 }); lab.position.y = 1.05; lab.scale.multiplyScalar(0.85); grp.add(lab);
    vaults[g] = { grp, glow, ring, flash: 99, ok: true };
  });

  // the pod
  const pod = new THREE.Group(); scene.add(pod);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.58, 32, 24), new THREE.MeshPhysicalMaterial({ color: 0xdffcff, transparent: true, opacity: 0.22, roughness: 0, clearcoat: 1, depthWrite: false, depthTest: false }));
  pod.add(shell);
  const podPic = new THREE.Sprite(new THREE.SpriteMaterial({ map: photoTexture("photos/maize.jpg", true), transparent: true, depthTest: false })); podPic.scale.set(0.95, 0.95, 1); podPic.renderOrder = 20; shell.renderOrder = 19; pod.add(podPic);
  const podGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color: 0xffffff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false })); podGlow.scale.set(2.2, 2.2, 1); podGlow.renderOrder = 18; pod.add(podGlow);

  let move = null, at = new THREE.Vector3(...NODE_POS.cells), bounce = 0;
  pod.position.copy(at);

  st.tick((dt, now) => {
    Object.values(tubes).forEach(t => { if (!reduced()) t.tex.offset.x -= dt * 0.6; });
    Object.values(nodeMeshes).forEach(n => { if (!reduced()) n.m.rotation.y += dt * 0.8; });
    Object.values(vaults).forEach(v => {
      v.flash += dt;
      const base = 0.35 + (reduced() ? 0 : Math.sin(now / 700 + v.grp.position.x) * 0.06);
      v.glow.material.opacity = v.flash < 2.5 ? 0.9 * (1 - v.flash / 2.5) + base : base;
      if (v.flash < 2.5 && !v.ok) v.grp.position.x += Math.sin(v.flash * 40) * 0.004 * (1 - v.flash / 2.5);
    });
    if (move) {
      move.u = Math.min(1, move.u + dt / 0.85);
      const e = move.u < 0.5 ? 2 * move.u * move.u : 1 - Math.pow(-2 * move.u + 2, 2) / 2;
      pod.position.copy(move.curve.getPoint(e));
      if (move.u >= 1) { at.copy(pod.position); move = null; }
    } else {
      bounce += dt;
      pod.position.set(at.x, at.y + (reduced() ? 0 : Math.sin(bounce * 3) * 0.05), at.z);
    }
    podPic.material.rotation = reduced() ? 0 : Math.sin(now / 800) * 0.12;
  });

  function travel(from, to, a) {
    const t = tubes[`${from}:${a ? "Y" : "N"}`]; if (!t) return;
    t.mat.emissiveIntensity = 1.6; setTimeout(() => { t.mat.emissiveIntensity = 0.55; }, 1400);
    if (reduced()) { at.copy(t.curve.getPoint(1)); pod.position.copy(at); return; }
    move = { curve: t.curve, u: 0 }; nodeMeshes[from].mat.emissiveIntensity = 2; setTimeout(() => { nodeMeshes[from].mat.emissiveIntensity = 0.6; }, 900);
  }
  function landed(group, ok, correct) {
    const v = vaults[group]; v.flash = 0; v.ok = ok;
    burst3D(st, new THREE.Vector3(...VAULT_POS[group]), ok ? GROUPS[group].hex : 0xff4d4d, ok ? 44 : 14, ok ? 3 : 1.4);
    st.punch(ok ? 0.1 : 0.04);
    if (!ok) { const c = vaults[correct]; c.flash = 0.6; c.ok = true; }
  }
  function reset(id) {
    podPic.material.map = photoTexture(`photos/${id}.jpg`, true); podPic.material.needsUpdate = true;
    const s = new THREE.Vector3(0, 8.6, 0); pod.position.copy(s); at.copy(new THREE.Vector3(...NODE_POS.cells));
    if (!reduced()) move = { curve: tubes.start.curve, u: 0 }; else pod.position.copy(at);
  }
  return { travel, landed, reset };
}
