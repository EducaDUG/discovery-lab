/* Solar System Command - BONUS ROUND "Planet Sling" (launch-and-land).
   Aim and fire a probe from Earth; the Sun's gravity bends its path; hit the planet named in the clue.
   120 s real-time round on setInterval (rAF is only for drawing). Optional, unmarked, no fail state, silent. */
import { makeRenderer, TEX, starField, glow, sunMesh, planetMesh, orbitControls, fitRenderer, loop, burst, popText, reduced, webgl } from "./space3d.js?v=1";
import { PLANETS } from "./solar-data.js?v=1";
const THREE = window.THREE;
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };

const K = 85.6, AE = 5.6, VMAX = 8, SUN_R = 0.55, FLIGHT = 16;
const Q = [
  ["mercury", "The smallest planet and the closest to the Sun.", "La planeta más pequeña y la más cercana al Sol."],
  ["venus", "The hottest planet — a thick carbon-dioxide atmosphere traps heat.", "El planeta más caliente — una densa atmósfera de dióxido de carbono atrapa el calor."],
  ["earth", "Home! The only known planet with liquid water on its surface. (Aim at yourself!)", "¡Nuestro hogar! El único planeta conocido con agua líquida en su superficie. (¡Apunta a tu propio planeta!)"],
  ["mars", "The 'Red Planet' — a small, rocky, terrestrial planet.", "El 'Planeta Rojo' — un planeta terrestre pequeño y rocoso."],
  ["jupiter", "The largest planet, with a storm (the Great Red Spot) raging for over 300 years.", "El planeta más grande, con una tormenta (la Gran Mancha Roja) que dura más de 300 años."],
  ["saturn", "A gas giant famous for its bright rings.", "Un gigante gaseoso famoso por sus brillantes anillos."],
  ["uranus", "An ice giant that spins on its side.", "Un gigante helado que gira de lado."],
  ["neptune", "The farthest planet from the Sun — a deep-blue ice giant.", "El planeta más lejano del Sol — un gigante helado de un azul profundo."],
  ["jupiter", "A GAS GIANT with no solid surface — pick the biggest one.", "Un GIGANTE GASEOSO sin superficie sólida — elige el más grande."],
  ["mars", "A terrestrial planet just OUTSIDE Earth's orbit.", "Un planeta terrestre justo FUERA de la órbita de la Tierra."]
];
const planetOf = id => PLANETS.find(p => p.id === id);

export function mountSling(host, ctx) {
  const { L, onFinish } = ctx; host.innerHTML = "";
  const stage = el("div", "ssc-stage"); stage.style.minHeight = "340px"; const canvas = el("canvas"); canvas.setAttribute("aria-label", L("Planet Sling: top-down view of the solar system with an aiming path", "Honda planetaria: vista cenital del sistema solar con una trayectoria de puntería")); stage.append(canvas);
  const hud = el("div", "ssc-hud"); const hT = el("span"), hS = el("span"); hud.append(hT, hS); stage.append(hud);
  const clue = el("div", "ssc-banner"); clue.style.maxWidth = "86%"; clue.style.borderRadius = "12px"; clue.setAttribute("aria-live", "polite"); stage.append(clue);
  const row = el("div", "ssc-ctl");
  const mk = (id, label, min, max, step, val) => { const g = el("div", "ssc-grow"); const lb = el("label", "field__label", label); lb.htmlFor = id; const r = el("input"); r.type = "range"; r.id = id; r.min = min; r.max = max; r.step = step; r.value = val; const o = el("span", "ssc-read"); g.append(lb, r, o); row.append(g); return { r, o }; };
  const aim = mk("sl-aim", L("Aim", "Puntería"), 0, 360, 1, 90), pw = mk("sl-pow", L("Power", "Potencia"), 20, 100, 1, 60);
  const fire = el("button", "btn btn--signal", L("🚀 FIRE (Space)", "🚀 DISPARAR (Espacio)")); fire.type = "button"; row.append(fire);
  const fb = el("div", "ssc-fb", L("Aim the dotted path so the probe meets the planet named in the clue. The path shows where the planets will be, so time your shot! Arrow keys aim and set power; Space fires.", "Apunta la línea de puntos para que la sonda se encuentre con el planeta de la pista. La línea muestra dónde estarán los planetas, ¡así que calcula el momento! Las flechas apuntan y ajustan la potencia; Espacio dispara.")); fb.setAttribute("aria-live", "polite");
  host.append(stage, row, fb);
  if (!webgl()) { stage.append(el("div", "ssc-nogl", L("3D isn't available on this device — the bonus round is skipped.", "El 3D no está disponible en este dispositivo — se omite la ronda extra."))); setTimeout(() => onFinish && onFinish({ hits: 0, shots: 0, best: 0, score: 0, skipped: true }), 0); return; }

  const renderer = makeRenderer(canvas), scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500); starField(scene);
  scene.add(new THREE.AmbientLight(0x303858, 0.6)); scene.add(new THREE.PointLight(0xfff0d0, 3.4, 0, 1.2)); scene.add(sunMesh(SUN_R));
  const bodies = PLANETS.map((p, i) => {
    const m = planetMesh(p.size * 1.25, p.id === "earth" ? TEX.earth() : (p.type === "gas" ? TEX.bands([p.col, p.col2, p.col], 3 + i % 3, 4 + i, 0.3) : TEX.rock(p.col, p.col2, 6, 2 + i)), { atmos: p.id === "earth" ? 0x5aa8ff : (p.id === "venus" ? 0xe8c070 : 0) });
    scene.add(m); const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 96 }, (_, j) => new THREE.Vector3(Math.cos(j / 96 * 6.2832) * p.a, 0, Math.sin(j / 96 * 6.2832) * p.a))), new THREE.LineBasicMaterial({ color: 0x5a6aa8, transparent: true, opacity: 0.22 })); scene.add(ring);
    if (p.id === "saturn") { const r = new THREE.Mesh(new THREE.RingGeometry(p.size * 1.6, p.size * 2.6, 48), new THREE.MeshBasicMaterial({ color: 0xe0cfa0, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })); r.rotation.x = Math.PI / 2.3; m.add(r); }
    const halo = glow(0xffe08a, p.size * 6); halo.visible = false; m.add(halo);
    return { p, m, halo, om: 6.2832 / p.per, ph0: i * 0.9 + 0.3 };
  });
  const probe = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), new THREE.MeshStandardMaterial({ color: 0xe8f0ff, metalness: 0.9, roughness: 0.2, emissive: 0x4a7ad0, emissiveIntensity: 1 })); probe.visible = false; probe.add(glow(0x88bbff, 1)); scene.add(probe);
  const prevGeo = new THREE.BufferGeometry(), prev = new THREE.Line(prevGeo, new THREE.LineDashedMaterial({ color: 0xffe08a, dashSize: 0.25, gapSize: 0.18, transparent: true, opacity: 0.9 })); scene.add(prev);
  const trail = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x9fd0ff })); scene.add(trail);
  const cam = orbitControls(canvas, camera, new THREE.Vector3(0, 0, 0), { th: 1.5708, ph: 0.42, r: 36 }, { rmin: 14, rmax: 55 }); cam.auto = false; fitRenderer(renderer, camera, stage);

  let clock = 0, running = false, startMs = 0, ended = false, qi = 0, order = [], score = 0, hits = 0, shots = 0, streak = 0, best = 0, misses = 0, flying = null, rafKeep = null;
  const posAt = (b, tt) => { const a = b.ph0 + tt * b.om; return [Math.cos(a) * b.p.a, Math.sin(a) * b.p.a]; };
  const earth = bodies[2];
  function sim(angleDeg, power, t0, keep) {
    const [ex, ez] = posAt(earth, t0), a = angleDeg * Math.PI / 180, ve = earth.om * AE, ea = earth.ph0 + t0 * earth.om;
    let x = ex, z = ez, vx = -Math.sin(ea) * ve + Math.cos(a) * VMAX * power, vz = Math.cos(ea) * ve + Math.sin(a) * VMAX * power;
    const pts = [new THREE.Vector3(x, 0, z)], dt = 0.04; let hit = null, t = 0;
    for (let s = 0; s < FLIGHT / dt; s++) {
      const r2 = x * x + z * z, r = Math.sqrt(r2), ac = -K / (r2 * r); vx += ac * x * dt; vz += ac * z * dt; x += vx * dt; z += vz * dt; t += dt;
      if (s % 2 === 0 || keep) pts.push(new THREE.Vector3(x, 0, z));
      if (r < SUN_R + 0.1 || r > 30) { hit = { id: "lost" }; break; }
      for (const b of bodies) { if (b === earth && t < 1.2) continue; const [bx, bz] = posAt(b, t0 + t); if (Math.hypot(x - bx, z - bz) < b.p.size * 1.25 + 0.8) { hit = { id: b.p.id, t }; break; } }
      if (hit) break;
    }
    return { pts, hit, vx, vz, x, z };
  }
  const target = () => planetOf(order[qi % order.length][0]);
  function nextClue() { const e = order[qi % order.length]; clue.innerHTML = `🎯 ${L(e[1], e[2])}`; misses = 0; bodies.forEach(b => b.halo.visible = false); }
  const setHud = () => { const left = Math.max(0, 120 - Math.floor((performance.now() - startMs) / 1000)); hT.innerHTML = `${L("Time", "Tiempo")}: <b>${left}s</b>`; hS.innerHTML = `${L("Hits", "Aciertos")}: <b>${hits}</b> · ${L("Streak", "Racha")}: <b>${streak}</b>`; };
  function launch() {
    if (!running || flying) return; shots++; const r = sim(Number(aim.r.value), Number(pw.r.value) / 100, clock, true); flying = { pts: r.pts, i: 0, t0: clock, hit: r.hit, shotAt: clock }; probe.visible = true;
  }
  function resolve(hitInfo) {
    flying = null; probe.visible = false; trail.geometry.setFromPoints([]);
    const want = target(), sxy = (() => { const v = want ? bodies.find(b => b.p.id === want.id).m.position.clone().project(camera) : { x: 0, y: 0 }; return [(v.x * .5 + .5) * stage.clientWidth, (-v.y * .5 + .5) * stage.clientHeight]; })();
    if (hitInfo && hitInfo.id === want.id) {
      streak++; best = Math.max(best, streak); hits++; score += 10 + Math.min(streak, 5) * 2; fb.dataset.t = "ok"; fb.innerHTML = L(`<b>Direct hit — ${want.en}!</b> +${10 + Math.min(streak, 5) * 2} points.`, `<b>¡Impacto directo — ${want.es}!</b> +${10 + Math.min(streak, 5) * 2} puntos.`); burst(stage, sxy[0], sxy[1], "#6ee7a1", 26); popText(stage, "+" + (10 + Math.min(streak, 5) * 2), sxy[0], sxy[1] - 10); qi++; nextClue();
    } else if (hitInfo && hitInfo.id !== "lost") {
      streak = 0; misses++; const p = planetOf(hitInfo.id); fb.dataset.t = "no"; const sorted = p.type === "gas" ? L("a gas giant", "un gigante gaseoso") : L("a terrestrial (rocky) planet", "un planeta terrestre (rocoso)");
      fb.innerHTML = L(`That was <b>${p.en}</b> — ${sorted}. Not the one in the clue; try again.`, `Esa fue <b>${p.es}</b> — ${sorted}. No es la de la pista; inténtalo otra vez.`); burst(stage, stage.clientWidth / 2, stage.clientHeight / 2, "#ff9a6c", 12);
      if (misses >= 3) { fb.innerHTML += " " + L(`The answer was <b>${want.en}</b> — moving on.`, `La respuesta era <b>${want.es}</b> — seguimos.`); qi++; nextClue(); }
    } else { streak = 0; fb.dataset.t = "no"; fb.innerHTML = L("The probe drifted away or fell into the Sun — gravity bent the path. Adjust the aim and power; the dotted path shows what will happen.", "La sonda se alejó o cayó al Sol — la gravedad curvó la trayectoria. Ajusta la puntería y la potencia; la línea de puntos muestra lo que ocurrirá."); }
    setHud();
  }
  const keys = ev => { if (!running) return; if (["INPUT"].includes(ev.target.tagName) && ev.key !== " ") return; const k = ev.key; if (k === "ArrowLeft") aim.r.value = (Number(aim.r.value) + 359) % 360; else if (k === "ArrowRight") aim.r.value = (Number(aim.r.value) + 1) % 360; else if (k === "ArrowUp") pw.r.value = Math.min(100, Number(pw.r.value) + 2); else if (k === "ArrowDown") pw.r.value = Math.max(20, Number(pw.r.value) - 2); else if (k === " ") { if (ev.target.tagName === "BUTTON") return; launch(); } else return; ev.preventDefault(); };
  host.addEventListener("keydown", keys); canvas.addEventListener("keydown", e => { if (e.key === " ") { e.preventDefault(); launch(); } });
  fire.addEventListener("click", launch);

  function finish() { if (ended) return; ended = true; running = false; clearInterval(timer); const acc = shots ? Math.round(hits / shots * 100) : 0; onFinish && onFinish({ hits, shots, best, score, acc }); }
  order = Q.slice().sort(() => Math.random() - 0.5); nextClue(); startMs = performance.now(); running = true; setHud();
  const timer = setInterval(() => { if (!document.body.contains(stage)) { clearInterval(timer); return; } setHud(); if ((performance.now() - startMs) >= 120000) finish(); }, 250);

  loop(stage, (dt, t) => {
    if (!running && !flying) { /* still draw */ }
    clock += dt * (reduced() ? 0.6 : 1);
    bodies.forEach(b => { const [x, z] = posAt(b, clock); b.m.position.set(x, 0, z); b.m.rotation.y += dt * 0.5; });
    const wp = target(); if (wp) bodies.find(b => b.p.id === wp.id).halo.visible = running; // hint ring around the target
    if (!flying && running) { const r = sim(Number(aim.r.value), Number(pw.r.value) / 100, clock, false); prev.geometry.setFromPoints(r.pts); prev.computeLineDistances(); prev.material.color.setHex(r.hit && r.hit.id === wp.id ? 0x6ee7a1 : 0xffe08a); prev.visible = true; aim.o.textContent = aim.r.value + "°"; pw.o.textContent = pw.r.value + "%"; }
    else prev.visible = false;
    if (flying) { const j = Math.min(flying.pts.length - 1, Math.floor((clock - flying.shotAt) / 0.04)); probe.position.copy(flying.pts[j]); trail.geometry.setFromPoints(flying.pts.slice(0, j + 1)); if (j >= flying.pts.length - 1) { const h = flying.hit; resolve(h); } }
    cam.apply(); renderer.render(scene, camera);
  });
}
