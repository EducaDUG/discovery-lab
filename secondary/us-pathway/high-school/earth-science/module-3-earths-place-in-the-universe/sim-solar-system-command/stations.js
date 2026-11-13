/* Solar System Command - the three Experiment stations (Orbit Lab, Eclipse Studio, Sun Dive).
   Each is an interactive real-time 3D scene (vendored Three.js). Game state lives in sim.state and is saved;
   scene code only READS state. Timing that matters (none here is scored by frame-rate) never depends on rAF. */
import { makeRenderer, TEX, starField, glow, sunMesh, planetMesh, orbitControls, fitRenderer, loop, burst, popText, reduced, webgl, C } from "./space3d.js?v=1";
import { orbitAt, perihelion, aphelion, speedAt, eclipseState, ECLIPSE_LABEL, EC, SUN_LAYERS, layerAtRadius } from "./solar-data.js?v=1";
const THREE = window.THREE;

export const STATION_CSS = `
.ssc-stage{position:relative;border-radius:14px;overflow:hidden;background:#03040a;border:1px solid #2a2f55;aspect-ratio:16/10;min-height:320px}
.ssc-stage canvas{display:block;width:100%;height:100%;cursor:grab;outline:none}.ssc-stage canvas:active{cursor:grabbing}
.ssc-stage canvas:focus-visible{box-shadow:inset 0 0 0 3px var(--signal,#f5b82e)}
.ssc-hud{position:absolute;left:10px;top:10px;display:grid;gap:4px;font:600 .78rem var(--font-data,monospace);color:#eaf0ff;pointer-events:none;z-index:3}
.ssc-hud span{background:#05061199;border:1px solid #4a5490;border-radius:8px;padding:.28rem .6rem;backdrop-filter:blur(3px)}
.ssc-hud b{color:#ffd9a1}
.ssc-banner{position:absolute;left:50%;top:10px;transform:translateX(-50%);background:#05061199;border:1px solid #6a74c0;border-radius:999px;padding:.3rem 1rem;font:700 .9rem var(--font-data,monospace);color:#fff;z-index:3;text-align:center;max-width:70%;pointer-events:none;transition:background .3s,border-color .3s}
.ssc-banner[data-hit="true"]{background:#1d6b3acc;border-color:#6ee7a1}
.ssc-inset{position:absolute;right:10px;bottom:10px;width:150px;border:1px solid #6a74c0;border-radius:10px;background:#000;z-index:3;overflow:hidden}
.ssc-inset canvas{width:150px;height:110px;cursor:default}.ssc-inset p{margin:0;padding:2px 6px;background:#0a0c1ecc;color:#cfd8ff;font:600 .66rem var(--font-data,monospace);text-align:center}
.ssc-ctl{display:flex;flex-wrap:wrap;gap:.55rem;align-items:center;margin-top:10px}
.ssc-ctl .ssc-grow{flex:1 1 240px;display:flex;align-items:center;gap:.6rem;min-width:200px}
.ssc-ctl input[type=range]{flex:1;accent-color:var(--accent)}
.ssc-read{font:700 .9rem var(--font-data,monospace);min-width:7ch;text-align:right}
.ssc-chip{border:1px solid var(--line);background:var(--surface);border-radius:999px;padding:.32rem .8rem;font:600 .8rem var(--font-data,monospace);cursor:pointer;color:var(--ink-2);min-height:36px}
.ssc-chip:hover,.ssc-chip:focus-visible{border-color:var(--accent);color:var(--accent);outline:none}
.ssc-chip[data-done="true"]{background:#1d6b3a22;border-color:#2e9b5a;color:var(--ink-1)}
.ssc-chip[data-on="true"]{background:var(--accent-wash);border-color:var(--accent)}
.ssc-note{margin:.6rem 0 0;font-size:.88rem;color:var(--ink-2)}
.ssc-fb{margin-top:.6rem;padding:.55rem .8rem;border-radius:8px;font-size:.9rem;background:var(--accent-wash);color:var(--ink-1);min-height:2.2em}
.ssc-fb[data-t="ok"]{background:#1d6b3a22;border-left:4px solid #2e9b5a}.ssc-fb[data-t="no"]{background:#b4432b22;border-left:4px solid #c0502e}
.ssc-shake{animation:ssc-shake .35s}.ssc-pulse{animation:ssc-pulse .45s}
[data-reduced-motion="on"] .ssc-shake,[data-reduced-motion="on"] .ssc-pulse{animation:none}
@keyframes ssc-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
@keyframes ssc-pulse{0%{transform:scale(1)}45%{transform:scale(1.18)}100%{transform:scale(1)}}
.ssc-nogl{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:1rem;color:#cfd8ff;font-size:.9rem;background:radial-gradient(circle at 50% 40%,#1b1f3a,#03040a)}
`;

const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const fx = (stage, x, y) => ({ burst: (c, n) => burst(stage, x, y, c, n), pop: (t, c) => popText(stage, t, x, y, c) });

function mkStage(L, aria) {
  const stage = el("div", "ssc-stage"); stage.setAttribute("role", "group"); stage.setAttribute("aria-label", aria);
  const canvas = el("canvas"); canvas.setAttribute("aria-label", aria + " " + L("(drag to orbit the camera, scroll to zoom, arrow keys also work)", "(arrastra para orbitar la cámara, desplázate para acercar, también funcionan las flechas)"));
  stage.append(canvas);
  let gl = webgl();
  if (!gl) stage.append(el("div", "ssc-nogl", L("3D view isn't available on this device. The controls and readouts still work.", "La vista 3D no está disponible en este dispositivo. Los controles y las lecturas siguen funcionando.")));
  return { stage, canvas, gl };
}
const rangeRow = (L, id, label, min, max, step, val) => {
  const row = el("div", "ssc-grow");
  const lab = el("label", "field__label", label); lab.htmlFor = id;
  const r = el("input"); r.type = "range"; r.id = id; r.min = min; r.max = max; r.step = step; r.value = val;
  const o = el("span", "ssc-read");
  row.append(lab, r, o); return { row, r, o };
};
const btn = (cls, text) => { const b = el("button", cls); b.type = "button"; b.textContent = text; return b; };
const shake = n => { n.classList.remove("ssc-shake"); void n.offsetWidth; n.classList.add("ssc-shake"); };

/* ======================================================================
   STATION 1 - ORBIT LAB  (independent variable: eccentricity)
   ====================================================================== */
export function mountOrbitLab(host, ctx) {
  const { L, sim, addXP } = ctx; const S = sim.state; S.orbitLogged = S.orbitLogged || [];
  host.innerHTML = "";
  const { stage, canvas, gl } = mkStage(L, L("Orbit Lab: a planet orbiting the Sun", "Laboratorio de órbitas: un planeta orbitando el Sol"));
  const hud = el("div", "ssc-hud"); const hR = el("span"), hV = el("span"), hM = el("span"); hud.append(hR, hV, hM); stage.append(hud);
  host.append(stage);

  const ec = rangeRow(L, "ssc-e", L("Eccentricity (e)", "Excentricidad (e)"), 0, 0.9, 0.05, S.orbitE ?? 0.5);
  const presets = [[L("Earth", "Tierra"), 0.017], ["Mars", 0.09], [L("Mercury", "Mercurio"), 0.21], [L("Comet-like", "Como cometa"), 0.8]];
  const ctl = el("div", "ssc-ctl"); ctl.append(ec.row);
  presets.forEach(([n, v]) => { const b = btn("ssc-chip", `${n} (e≈${v})`); b.addEventListener("click", () => { ec.r.value = v; setE(v); }); ctl.append(b); });
  const ctl2 = el("div", "ssc-ctl");
  const bGo = btn("btn btn--signal", L("▶ Launch orbit", "▶ Lanzar órbita"));
  const bP = btn("btn btn--ghost", L("📍 Mark CLOSEST (C)", "📍 Marcar el MÁS CERCANO (C)"));
  const bF = btn("btn btn--ghost", L("📍 Mark FARTHEST (F)", "📍 Marcar el MÁS LEJANO (F)"));
  const bPause = btn("ssc-chip", L("⏸ Pause", "⏸ Pausa"));
  const bSlow = btn("ssc-chip", L("Slow ×0.5", "Lento ×0.5"));
  const bLog = btn("btn btn--signal", L("Log this orbit to my Record", "Registrar esta órbita en mi Registro"));
  ctl2.append(bGo, bP, bF, bPause, bSlow, bLog);
  const fb = el("div", "ssc-fb", L("Launch the orbit, then press <b>Mark CLOSEST</b> the instant the planet is nearest the Sun, and <b>Mark FARTHEST</b> when it is furthest. Watch the speed readout as it moves.", "Lanza la órbita y pulsa <b>Marcar el MÁS CERCANO</b> en el instante en que el planeta esté más cerca del Sol, y <b>Marcar el MÁS LEJANO</b> cuando esté más lejos. Observa la velocidad mientras se mueve."));
  fb.setAttribute("aria-live", "polite");
  const logged = el("p", "ssc-note");
  host.append(ctl, ctl2, fb, logged);

  let e = S.orbitE ?? 0.5, M = 1.2, running = true, slow = false, mP = null, mF = null;
  const SC = 4.2, PERIOD = 18;
  const refreshLogged = () => { const n = new Set(S.orbitLogged).size; logged.innerHTML = L(`Orbits logged with different eccentricities: <b>${n}</b> (log at least 3 for strong evidence).`, `Órbitas registradas con distinta excentricidad: <b>${n}</b> (registra al menos 3 para tener evidencia sólida).`); };
  const updBtns = () => { bLog.disabled = !(mP && mF); bP.dataset.done = mP ? "true" : "false"; bF.dataset.done = mF ? "true" : "false"; hM.innerHTML = `${L("Closest", "Más cercano")}: <b>${mP ? mP.r.toFixed(2) + " AU" : "—"}</b> · ${L("Farthest", "Más lejano")}: <b>${mF ? mF.r.toFixed(2) + " AU" : "—"}</b>`; };
  const readE = () => { ec.o.textContent = "e = " + e.toFixed(2); };

  // ---- 3D ----
  let renderer, scene, camera, cam, planet, sun, ellipse, sector, rv, mkP, mkF, sectorN = 16, sectorPos;
  if (gl) {
    renderer = makeRenderer(canvas); scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
    starField(scene); scene.add(new THREE.AmbientLight(0x2a3050, 0.55));
    sun = sunMesh(0.55); scene.add(sun);
    const light = new THREE.PointLight(0xfff0d0, 2.6, 0, 1.4); scene.add(light);
    planet = new THREE.Group();
    const earth = planetMesh(0.32, TEX.earth(), { atmos: 0x5aa8ff, clearcoat: 0.25, rough: 0.7 }); planet.add(earth); planet.userData.body = earth; scene.add(planet);
    const circ = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 128 }, (_, i) => new THREE.Vector3(Math.cos(i / 128 * 6.2832) * SC, 0, Math.sin(i / 128 * 6.2832) * SC))), new THREE.LineBasicMaterial({ color: 0x5a6aa8, transparent: true, opacity: 0.35 })); scene.add(circ);
    ellipse = new THREE.LineLoop(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x7fd0ff })); scene.add(ellipse);
    const sg = new THREE.BufferGeometry(); sectorPos = new Float32Array((sectorN + 2) * 3); sg.setAttribute("position", new THREE.BufferAttribute(sectorPos, 3));
    const idx = []; for (let i = 1; i <= sectorN; i++) idx.push(0, i, i + 1); sg.setIndex(idx);
    sector = new THREE.Mesh(sg, new THREE.MeshBasicMaterial({ color: 0xffc766, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })); scene.add(sector);
    rv = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })); scene.add(rv);
    mkP = glow(0x6ee7a1, 1.1); mkF = glow(0xff9a6c, 1.1); mkP.visible = mkF.visible = false; scene.add(mkP, mkF);
    camera.position.set(0, 9, 8);
    cam = orbitControls(canvas, camera, new THREE.Vector3(-0.8, 0, 0), { th: 1.55, ph: 0.95, r: 9.5 }, { rmin: 4, rmax: 28 });
    fitRenderer(renderer, camera, stage);
  }
  const buildEllipse = () => {
    if (!gl) return; const b = Math.sqrt(1 - e * e);
    ellipse.geometry.setFromPoints(Array.from({ length: 160 }, (_, i) => { const E = i / 160 * 6.2832; return new THREE.Vector3((Math.cos(E) - e) * SC, 0, b * Math.sin(E) * SC); }));
  };
  const clearMarks = () => { mP = mF = null; if (gl) mkP.visible = mkF.visible = false; updBtns(); };
  const setE = v => { e = v; S.orbitE = v; sim.saveState(); readE(); buildEllipse(); clearMarks(); fb.dataset.t = ""; fb.innerHTML = L(`New orbit shape: e = ${v.toFixed(2)}. Mark the closest and farthest points again.`, `Nueva forma de órbita: e = ${v.toFixed(2)}. Marca de nuevo los puntos más cercano y más lejano.`); };
  ec.r.addEventListener("input", () => setE(Number(ec.r.value)));
  readE(); buildEllipse(); updBtns(); refreshLogged();

  const cur = () => orbitAt(M, e);
  const tolOf = () => 0.04 * 2 * e + 0.014;
  function mark(kind) {
    const o = cur(), rp = perihelion(e), ra = aphelion(e), tgt = kind === "P" ? rp : ra, tol = tolOf();
    const sxy = hudXY();
    if (Math.abs(o.r - tgt) <= tol || e < 0.02) {
      const val = { r: tgt, v: speedAt(tgt) };
      if (kind === "P") mP = val; else mF = val;
      if (gl) { const m = kind === "P" ? mkP : mkF; m.position.set((kind === "P" ? (1 - e) : -(1 + e)) * SC * (kind === "P" ? 1 : 1) + (-e * SC) * 0, 0, 0); m.position.x = (kind === "P" ? (1 - e) : -(1 + e)) * SC; m.visible = true; }
      fb.dataset.t = "ok";
      fb.innerHTML = kind === "P" ? L(`Locked on! Closest point = <b>${tgt.toFixed(2)} AU</b>, speed <b>${val.v.toFixed(1)} km/s</b>. Notice how fast it was moving there.`, `¡Fijado! Punto más cercano = <b>${tgt.toFixed(2)} UA</b>, velocidad <b>${val.v.toFixed(1)} km/s</b>. Fíjate en lo rápido que iba ahí.`)
        : L(`Locked on! Farthest point = <b>${tgt.toFixed(2)} AU</b>, speed <b>${val.v.toFixed(1)} km/s</b>. Slow here — gravity's pull is weaker.`, `¡Fijado! Punto más lejano = <b>${tgt.toFixed(2)} UA</b>, velocidad <b>${val.v.toFixed(1)} km/s</b>. Lento aquí — la gravedad tira con menos fuerza.`);
      burst(stage, sxy[0], sxy[1], kind === "P" ? "#6ee7a1" : "#ff9a6c", 18); popText(stage, "+5 XP", sxy[0], sxy[1]); addXP(5, L("orbit mark", "marca orbital"));
      updBtns();
    } else {
      fb.dataset.t = "no"; shake(kind === "P" ? bP : bF);
      fb.innerHTML = o.r > tgt + tol ? L(kind === "P" ? "Not yet — the planet is still farther from the Sun than its closest point. Wait for the line to the Sun to be at its SHORTEST, then try again (no penalty)." : "Too early — the planet is closer than its farthest point. Wait for the line to the Sun to be at its LONGEST (no penalty).", kind === "P" ? "Todavía no — el planeta sigue más lejos del Sol que en su punto más cercano. Espera a que la línea al Sol sea la MÁS CORTA e inténtalo otra vez (sin penalización)." : "Demasiado pronto — el planeta está más cerca que en su punto más lejano. Espera a que la línea al Sol sea la MÁS LARGA (sin penalización).")
        : L("Not quite — that's too close to mark as the farthest. Wait for the longest line, then try again (no penalty).", "Casi — está demasiado cerca para ser el más lejano. Espera la línea más larga e inténtalo otra vez (sin penalización).");
    }
  }
  function hudXY() { if (!gl) return [60, 60]; const v = planet.position.clone().project(camera), w = stage.clientWidth, h = stage.clientHeight; return [(v.x * 0.5 + 0.5) * w, (-v.y * 0.5 + 0.5) * h]; }
  bP.addEventListener("click", () => mark("P")); bF.addEventListener("click", () => mark("F"));
  host.addEventListener("keydown", ev => { if (ev.target.tagName === "INPUT") return; if (ev.key === "c" || ev.key === "C") mark("P"); else if (ev.key === "f" || ev.key === "F") mark("F"); });
  bGo.addEventListener("click", () => { M = 1.2; running = true; bPause.textContent = L("⏸ Pause", "⏸ Pausa"); clearMarks(); fb.dataset.t = ""; fb.innerHTML = L("Orbit launched. Watch the planet speed up as it falls toward the Sun and slow down as it climbs away.", "Órbita lanzada. Observa cómo el planeta acelera al caer hacia el Sol y frena al alejarse."); });
  bPause.addEventListener("click", () => { running = !running; bPause.textContent = running ? L("⏸ Pause", "⏸ Pausa") : L("▶ Resume", "▶ Reanudar"); });
  bSlow.addEventListener("click", () => { slow = !slow; bSlow.dataset.on = slow ? "true" : "false"; bSlow.textContent = slow ? L("Normal speed", "Velocidad normal") : L("Slow ×0.5", "Lento ×0.5"); });
  bLog.addEventListener("click", () => {
    if (!(mP && mF)) return;
    sim.recordTrial({ lab: L("Orbit", "Órbita"), setting: `e = ${e.toFixed(2)}`, peri: mP.r.toFixed(2), aph: mF.r.toFixed(2), vP: mP.v.toFixed(1), vA: mF.v.toFixed(1), temp: "-", result: L(`speed ratio ${(mP.v / mF.v).toFixed(2)}x`, `razón de velocidades ${(mP.v / mF.v).toFixed(2)}x`) });
    const first = !S.orbitLogged.includes(+e.toFixed(2)); S.orbitLogged.push(+e.toFixed(2)); sim.saveState(); refreshLogged();
    sim.toast(L(`Orbit e = ${e.toFixed(2)} logged to your Record.`, `Órbita e = ${e.toFixed(2)} registrada en tu Registro.`), "correct");
    if (first) addXP(15, L("new orbit shape", "nueva forma de órbita"));
    const sxy = hudXY(); burst(stage, sxy[0], sxy[1], "#ffd27a", 24); bLog.classList.remove("ssc-pulse"); void bLog.offsetWidth; bLog.classList.add("ssc-pulse");
    mP = mF = null; if (gl) mkP.visible = mkF.visible = false; updBtns();
    fb.dataset.t = "ok"; fb.innerHTML = L("Logged. Try a different eccentricity — does the speed difference grow or shrink?", "Registrado. Prueba otra excentricidad — ¿la diferencia de velocidad crece o disminuye?");
  });

  loop(stage, (dt, t) => {
    if (running) M += dt * (6.2832 / PERIOD) * (slow ? 0.5 : 1);
    const o = cur(); hR.innerHTML = `${L("Distance to Sun", "Distancia al Sol")}: <b>${o.r.toFixed(2)} AU</b>`; hV.innerHTML = `${L("Speed", "Velocidad")}: <b>${o.v.toFixed(1)} km/s</b>`;
    if (!gl) return;
    planet.position.set(o.x * SC, 0, o.z * SC); planet.userData.body.rotation.y += dt * 1.6;
    sun.userData.surface.rotation.y += dt * 0.1; const pl = 1 + Math.sin(t * 2) * 0.03; sun.children[1].scale.setScalar(2.9 * pl);
    rv.geometry.setFromPoints([new THREE.Vector3(), planet.position]);
    const span = 0.9 / 6.2832 * 6.2832 * 0.16; // sweep window in mean anomaly: equal TIME => equal AREA
    sectorPos[0] = sectorPos[1] = sectorPos[2] = 0;
    for (let i = 0; i <= sectorN; i++) { const q = orbitAt(M - span * (i / sectorN) * 6.2832 * 0.5, e); sectorPos[(i + 1) * 3] = q.x * SC; sectorPos[(i + 1) * 3 + 1] = 0; sectorPos[(i + 1) * 3 + 2] = q.z * SC; }
    sector.geometry.attributes.position.needsUpdate = true;
    if (cam.auto && !reduced()) cam.th += dt * 0.05; cam.apply(); renderer.render(scene, camera);
  });
  return {};
}

/* ======================================================================
   STATION 2 - ECLIPSE STUDIO
   ====================================================================== */
const ECLIPSE_TYPES = ["solar-total", "solar-annular", "solar-partial", "lunar-total", "lunar-partial", "lunar-penumbral"];
export function mountEclipseStudio(host, ctx) {
  const { L, sim, addXP } = ctx; const S = sim.state; S.eclipseDone = S.eclipseDone || {};
  host.innerHTML = "";
  const { stage, canvas, gl } = mkStage(L, L("Eclipse Studio: Sun, Earth and Moon", "Estudio de eclipses: Sol, Tierra y Luna"));
  const banner = el("div", "ssc-banner"); banner.setAttribute("aria-live", "polite"); stage.append(banner);
  const inset = el("div", "ssc-inset"); const ic = el("canvas"); ic.width = 150; ic.height = 110; const ip = el("p"); inset.append(ic, ip); stage.append(inset);
  host.append(stage);
  const missions = el("div", "ssc-ctl"); host.append(missions);
  const chips = {}; ECLIPSE_TYPES.forEach(id => { const c = el("span", "ssc-chip", ""); c.style.cursor = "default"; c.textContent = L(ECLIPSE_LABEL[id][0], ECLIPSE_LABEL[id][1]); c.dataset.done = S.eclipseDone[id] ? "true" : "false"; chips[id] = c; missions.append(c); });
  const ph = rangeRow(L, "ssc-phase", L("Moon's position in its orbit", "Posición de la Luna en su órbita"), 0, 360, 0.5, S.eclPhase ?? 40); ph.row.setAttribute("title", "0° = New Moon · 180° = Full Moon");
  const season = rangeRow(L, "ssc-season", L("Time of year (tilt effect)", "Época del año (efecto de la inclinación)"), -1, 1, 0.05, S.eclSeason ?? 0.5);
  const ctl = el("div", "ssc-ctl"); ctl.append(ph.row);
  const bNew = btn("ssc-chip", L("🌑 New Moon", "🌑 Luna nueva")), bFull = btn("ssc-chip", L("🌕 Full Moon", "🌕 Luna llena"));
  const bTilt = btn("ssc-chip", ""), bNear = btn("ssc-chip", "");
  const ctl2 = el("div", "ssc-ctl"); ctl2.append(bNew, bFull, bTilt, bNear, season.row);
  const bLog = btn("btn btn--signal", L("Log this eclipse to my Record", "Registrar este eclipse en mi Registro"));
  const fb = el("div", "ssc-fb", L("Slide the Moon around its orbit. Missions: create all six eclipse types, then log each one. (The sizes are exaggerated so you can see the shadows.)", "Desliza la Luna por su órbita. Misiones: crea los seis tipos de eclipse y regístralos. (Los tamaños están exagerados para que veas las sombras.)"));
  fb.setAttribute("aria-live", "polite");
  host.append(ctl, ctl2, el("div", "ssc-ctl"), fb); host.lastElementChild.previousElementSibling.append(bLog);
  const left = el("p", "ssc-note"); host.append(left);

  let th = S.eclPhase ?? 40, tilt = S.eclTilt ?? true, near = S.eclNear ?? true, sea = S.eclSeason ?? 0.5, st = eclipseState(th, tilt, sea, near);
  const upd = () => { bTilt.textContent = tilt ? L("Moon's orbit: TILTED 5° (real)", "Órbita lunar: INCLINADA 5° (real)") : L("Moon's orbit: FLAT (simple model)", "Órbita lunar: PLANA (modelo simple)"); bTilt.dataset.on = tilt; bNear.textContent = near ? L("Moon is: NEAR (looks big)", "La Luna está: CERCA (se ve grande)") : L("Moon is: FAR (looks small)", "La Luna está: LEJOS (se ve pequeña)"); bNear.dataset.on = near; season.row.style.display = tilt ? "" : "none"; ph.o.textContent = th.toFixed(1) + "°"; season.o.textContent = sea.toFixed(2); left.innerHTML = L(`Eclipse types created: <b>${ECLIPSE_TYPES.filter(i => S.eclipseDone[i]).length} / 6</b>`, `Tipos de eclipse creados: <b>${ECLIPSE_TYPES.filter(i => S.eclipseDone[i]).length} / 6</b>`); };
  const phaseName = d => { const x = ((d % 360) + 360) % 360; return x < 20 || x > 340 ? L("New Moon", "Luna nueva") : (x > 160 && x < 200 ? L("Full Moon", "Luna llena") : (x < 180 ? L("waxing", "creciente") : L("waning", "menguante"))); };

  // ---- 3D ----
  let renderer, scene, camera, cam, moon, moonMat, earth, decU, decP, coneU, coneP, ecU, ecP;
  if (gl) {
    renderer = makeRenderer(canvas); scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500); starField(scene);
    scene.add(new THREE.AmbientLight(0x1a2036, 0.35));
    const sunDir = new THREE.DirectionalLight(0xfff4e0, 3.0); sunDir.position.set(30, 0, 0); scene.add(sunDir);
    const sun = sunMesh(3.2); sun.position.set(30, 0, 0); scene.add(sun);
    earth = planetMesh(EC.RE, TEX.earth(), { atmos: 0x5aa8ff, clearcoat: 0.25, rough: 0.7 }); scene.add(earth);
    moonMat = new THREE.MeshStandardMaterial({ map: TEX.moon(), roughness: 1, metalness: 0 }); moon = new THREE.Mesh(new THREE.SphereGeometry(EC.RM, 48, 32), moonMat); scene.add(moon);
    const orb = new THREE.LineLoop(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: 0x5a6aa8, transparent: true, opacity: 0.45 })); scene.add(orb); scene.userData.orb = orb;
    const cone = (c, o) => new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 32, 1, true), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, side: THREE.DoubleSide, depthWrite: false }));
    coneU = cone(0x000000, 0.55); coneP = cone(0x8892c9, 0.09); ecU = cone(0x000000, 0.35); ecP = cone(0x8892c9, 0.07); scene.add(coneU, coneP, ecU, ecP);
    const dec = (c, o) => { const m = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide })); m.visible = false; scene.add(m); return m; };
    decP = dec(0x000000, 0.35); decU = dec(0x000000, 0.9);
    cam = orbitControls(canvas, camera, new THREE.Vector3(1.2, 0, 0), { th: 1.9, ph: 1.0, r: 11.5 }, { rmin: 3, rmax: 26 });
    fitRenderer(renderer, camera, stage);
    const R = EC.R; orb.geometry.setFromPoints(Array.from({ length: 160 }, (_, i) => { const a = i / 160 * 6.2832; return new THREE.Vector3(R * Math.cos(a), tilt ? EC.H * sea * Math.cos(a) : 0, R * Math.sin(a)); }));
  }
  const align = (m, from, dir, len, r0, r1) => { m.scale.set(1, 1, 1); m.geometry.dispose(); m.geometry = new THREE.CylinderGeometry(r1, r0, len, 32, 1, true); const d = dir.clone().normalize(); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d); m.position.copy(from).addScaledVector(d, len / 2); };
  function place() {
    st = eclipseState(th, tilt, sea, near); const rad = th * Math.PI / 180;
    banner.textContent = L(ECLIPSE_LABEL[st.type][0], ECLIPSE_LABEL[st.type][1]).toUpperCase(); banner.dataset.hit = st.type !== "none";
    bLog.disabled = st.type === "none";
    drawInset();
    if (!gl) return;
    const mpos = new THREE.Vector3(st.x, st.y, st.z); moon.position.copy(mpos);
    const mscale = near ? 1.1 : 0.9; moon.scale.setScalar(mscale);
    const R = EC.R, orb = scene.userData.orb; orb.geometry.setFromPoints(Array.from({ length: 160 }, (_, i) => { const a = i / 160 * 6.2832; return new THREE.Vector3(R * Math.cos(a), tilt ? EC.H * sea * Math.cos(a) : 0, R * Math.sin(a)); }));
    // Moon's own shadow (solar eclipses): cones point away from the Sun (-x).
    const away = new THREE.Vector3(-1, 0, 0), sol = st.x > 0;
    coneU.visible = coneP.visible = sol; ecU.visible = ecP.visible = !sol;
    if (sol) { const Lu = near ? EC.R * 1.12 : EC.R * 0.86; align(coneU, mpos, away, Lu, EC.RM, 0.01); align(coneP, mpos, away, EC.R * 1.7, EC.RM, EC.RM + (EC.PEN_SOL - EC.RM) * 1.7 * 1); }
    else { align(ecU, new THREE.Vector3(0, 0, 0), away, EC.R * 1.45, EC.RE, EC.RU_MOON * 0.9); align(ecP, new THREE.Vector3(0, 0, 0), away, EC.R * 1.45, EC.RE, EC.RP_MOON * 1.1); }
    // decals on Earth
    decU.visible = decP.visible = false;
    if (sol && st.type !== "none") {
      const d = st.d; const dir = new THREE.Vector3(0, st.y, st.z); const cl = Math.min(d, EC.RE * 0.98);
      const px = d < EC.RE ? Math.sqrt(EC.RE * EC.RE - d * d) : 0.02, py = d < EC.RE ? st.y : (st.y / d) * EC.RE * 0.98, pz = d < EC.RE ? st.z : (st.z / d) * EC.RE * 0.98;
      const p = new THREE.Vector3(px, py, pz); const n = p.clone().normalize();
      [[decP, EC.PEN_SOL * 0.65], [decU, near ? 0.09 : 0.05]].forEach(([m, s]) => { m.visible = !(m === decU && d >= EC.RE); m.position.copy(n).multiplyScalar(EC.RE * 1.004); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), n); m.scale.setScalar(s); });
    }
    // Moon tint in Earth's shadow
    const tints = { "lunar-total": [0x7a2515, 0.35], "lunar-partial": [0x9a8f88, 0.1], "lunar-penumbral": [0xc9c4c0, 0], none: [0xffffff, 0], "solar-total": [0xffffff, 0], "solar-annular": [0xffffff, 0], "solar-partial": [0xffffff, 0] };
    const [tc, em] = tints[st.type]; moonMat.color.setHex(tc); moonMat.emissive.setHex(st.type === "lunar-total" ? 0x5a1508 : 0x000000); moonMat.emissiveIntensity = em * 2;
    if (st.type === "none" || sol) { moonMat.color.setHex(0xffffff); moonMat.emissive.setHex(0); }
  }
  function drawInset() {
    const g = ic.getContext("2d"); g.clearRect(0, 0, 150, 110); g.fillStyle = "#02030a"; g.fillRect(0, 0, 150, 110);
    for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(255,255,255," + (0.2 + ((i * 37) % 10) / 14) + ")"; g.fillRect((i * 53) % 150, (i * 29) % 110, 1.2, 1.2); }
    const t = st.type, cx = 75, cy = 52;
    if (t.startsWith("solar") || (t === "none" && st.x > 0)) {
      const sr = 28, mr = near ? 31 : 24; g.fillStyle = "#fff1bf"; g.shadowColor = "#ffb347"; g.shadowBlur = 18; g.beginPath(); g.arc(cx, cy, sr, 0, 6.28); g.fill(); g.shadowBlur = 0;
      let off = 0; if (t === "solar-partial") off = Math.min(70, (st.d - EC.RE) / EC.PEN_SOL * 60 + 14); else if (t === "none") off = 110;
      if (t === "solar-total") { g.strokeStyle = "rgba(255,240,210,.55)"; g.lineWidth = 6; g.beginPath(); g.arc(cx, cy, mr + 5, 0, 6.28); g.stroke(); }
      g.fillStyle = "#06060a"; g.beginPath(); g.arc(cx + off, cy - off * 0.25, mr, 0, 6.28); g.fill();
      ip.textContent = L("what you'd see looking up", "lo que verías mirando al cielo");
    } else {
      const mr = 30; const dx = st.d / EC.RM * mr * 0.5; g.save(); g.beginPath(); g.arc(cx, cy, mr, 0, 6.28); g.clip(); g.fillStyle = "#cfc8bd"; g.fillRect(0, 0, 150, 110);
      if (t !== "none") { const ur = EC.RU_MOON / EC.RM * mr * 0.9; g.fillStyle = t === "lunar-penumbral" ? "rgba(40,30,25,.35)" : "rgba(95,25,12,.92)"; g.beginPath(); g.arc(cx - dx * (t === "lunar-penumbral" ? 0.3 : 1), cy + dx * 0.1, t === "lunar-penumbral" ? ur * 2.3 : ur, 0, 6.28); g.fill(); }
      g.restore(); ip.textContent = L("the Moon as seen from Earth", "la Luna vista desde la Tierra");
    }
  }
  function set(v, quiet) { th = ((v % 360) + 360) % 360; S.eclPhase = th; ph.r.value = th; place(); upd(); if (!quiet) sim.saveState(); }
  ph.r.addEventListener("input", () => set(Number(ph.r.value)));
  season.r.addEventListener("input", () => { sea = Number(season.r.value); S.eclSeason = sea; place(); upd(); sim.saveState(); });
  bNew.addEventListener("click", () => set(0)); bFull.addEventListener("click", () => set(180));
  bTilt.addEventListener("click", () => { tilt = !tilt; S.eclTilt = tilt; place(); upd(); sim.saveState(); fb.dataset.t = ""; fb.innerHTML = tilt ? L("Real life: the Moon's orbit is tilted about 5°, so at most New and Full Moons it passes above or below the Earth–Sun line. Slide 'Time of year' to see when it lines up.", "En la realidad: la órbita de la Luna está inclinada unos 5°, así que en casi todas las lunas nuevas y llenas pasa por encima o por debajo de la línea Tierra–Sol. Mueve 'Época del año' para ver cuándo se alinea.") : L("Simple model: with a flat orbit, EVERY New Moon would be a solar eclipse and EVERY Full Moon a lunar eclipse. That doesn't happen — turn the tilt back on to see why.", "Modelo simple: con una órbita plana, TODA luna nueva sería un eclipse solar y TODA luna llena uno lunar. Eso no ocurre — activa de nuevo la inclinación para ver por qué."); });
  bNear.addEventListener("click", () => { near = !near; S.eclNear = near; place(); upd(); sim.saveState(); fb.dataset.t = ""; fb.innerHTML = near ? L("Moon at its closest: it looks slightly BIGGER than the Sun, so it can cover it completely (total eclipse).", "Luna en su punto más cercano: se ve un poco MÁS GRANDE que el Sol, así que puede taparlo por completo (eclipse total).") : L("Moon at its farthest: it looks slightly SMALLER than the Sun, so a bright ring of Sun is left showing (annular eclipse).", "Luna en su punto más lejano: se ve un poco MÁS PEQUEÑA que el Sol, y queda un anillo brillante visible (eclipse anular)."); });
  bLog.addEventListener("click", () => {
    if (st.type === "none") return; const lab = L(ECLIPSE_LABEL[st.type][0], ECLIPSE_LABEL[st.type][1]);
    sim.recordTrial({ lab: L("Eclipse", "Eclipse"), setting: `${near ? L("Moon near", "Luna cerca") : L("Moon far", "Luna lejos")}, ${tilt ? L("tilt on", "inclinada") + " " + sea.toFixed(2) : L("flat orbit", "órbita plana")}, ${th.toFixed(0)}° (${phaseName(th)})`, peri: "-", aph: "-", vP: "-", vA: "-", temp: "-", result: lab });
    const first = !S.eclipseDone[st.type]; S.eclipseDone[st.type] = true; chips[st.type].dataset.done = "true"; sim.saveState(); upd();
    sim.toast(L(`${lab} logged to your Record.`, `${lab} registrado en tu Registro.`), "correct");
    if (first) addXP(20, lab); burst(stage, stage.clientWidth / 2, 70, "#ffd27a", 26); chips[st.type].classList.remove("ssc-pulse"); void chips[st.type].offsetWidth; chips[st.type].classList.add("ssc-pulse");
    fb.dataset.t = "ok"; fb.innerHTML = st.type.startsWith("solar") ? L("In a SOLAR eclipse the Moon is between the Sun and Earth, so the Moon's shadow falls on Earth. Only a small area sees the umbra (total/annular); a wider area sees the penumbra (partial).", "En un eclipse SOLAR la Luna está entre el Sol y la Tierra, y su sombra cae sobre la Tierra. Solo una zona pequeña ve la umbra (total/anular); una zona más amplia ve la penumbra (parcial).") : L("In a LUNAR eclipse Earth is between the Sun and the Moon, so the Moon moves into Earth's shadow. Total ones glow red because Earth's atmosphere bends red light onto the Moon.", "En un eclipse LUNAR la Tierra está entre el Sol y la Luna, y la Luna entra en la sombra de la Tierra. Los totales se ven rojizos porque la atmósfera terrestre desvía la luz roja hacia la Luna.");
    if (ECLIPSE_TYPES.every(i => S.eclipseDone[i])) { sim.mark("all_eclipses_created", true); addXP(30, L("all six eclipses!", "¡los seis eclipses!")); }
  });
  place(); upd();
  if (gl) loop(stage, (dt, t) => { earth.rotation.y += dt * 0.25; moon.rotation.y += dt * 0.05; if (cam.auto && !reduced()) cam.th += dt * 0.04; cam.apply(); renderer.render(scene, camera); });
  return {};
}

/* ======================================================================
   STATION 3 - SUN DIVE  (probe down through the six layers + flare button + layer-ID game)
   ====================================================================== */
export function mountSunDive(host, ctx) {
  const { L, sim, addXP } = ctx; const S = sim.state; S.sunRound = S.sunRound || 0; S.sunLogged = S.sunLogged || [];
  host.innerHTML = "";
  const { stage, canvas, gl } = mkStage(L, L("Sun Dive: a cutaway of the Sun with a probe", "Inmersión solar: corte del Sol con una sonda"));
  const hud = el("div", "ssc-hud"); const hL = el("span"), hT = el("span"); hud.append(hL, hT); stage.append(hud); host.append(stage);
  const dp = rangeRow(L, "ssc-depth", L("Probe position (space → core)", "Posición de la sonda (espacio → núcleo)"), 0, 100, 1, S.sunDepth ?? 0);
  const ctl = el("div", "ssc-ctl"); ctl.append(dp.row);
  const bDive = btn("btn btn--ghost", L("⬇ Auto-dive", "⬇ Inmersión automática")), bLog = btn("btn btn--signal", L("📡 Log reading", "📡 Registrar lectura")), bFlare = btn("btn btn--signal", L("☀ Trigger solar flare", "☀ Provocar una llamarada solar"));
  ctl.append(bDive, bLog, bFlare);
  const fact = el("div", "ssc-fb"); fact.setAttribute("aria-live", "polite");
  const game = el("div", "ssc-fb"); game.style.background = "var(--surface-2)";
  const bCheck = btn("btn btn--signal", L("✔ Confirm — the probe is in this layer", "✔ Confirmar — la sonda está en esta capa")); bCheck.style.marginTop = ".5rem";
  const left = el("p", "ssc-note");
  host.append(ctl, fact, game, bCheck, left);

  let depth = S.sunDepth ?? 0, diving = false, flareT = -1, flareDir = new THREE.Vector3(0, 1, 0);
  const RS = 3; // visual Sun radius
  const rhoOf = d => 2.3 - (d / 100) * 2.3; // probe radius as a fraction of solar radius: 2.3 (above corona) -> 0 (core)
  const layerNow = () => layerAtRadius(Math.max(0, Math.min(2.19, rhoOf(depth))));
  const tempNow = () => { const rho = rhoOf(depth), Ly = layerNow(); if (Ly.id === "core") return Math.round(15000000 - rho / 0.25 * 0); if (Ly.id === "radiative") { const f = (rho - 0.25) / 0.45; return Math.round(7000000 - f * 5000000); } if (Ly.id === "convective") { const f = (rho - 0.70) / 0.285; return Math.round(2000000 - f * 1994000); } return Ly.temp; };
  const fmtT = t => t >= 1e6 ? (t / 1e6).toFixed(t >= 1e7 ? 0 : 1) + " million °C" : t.toLocaleString() + " °C";
  const fmtTes = t => t >= 1e6 ? (t / 1e6).toFixed(t >= 1e7 ? 0 : 1) + " millones °C" : t.toLocaleString() + " °C";

  let renderer, scene, camera, cam, probe, shells = [], flareG, flareMat, flarePos, flareVel, arcs;
  if (gl) {
    renderer = makeRenderer(canvas); scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400); starField(scene);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const planes = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0), new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)];
    const mk = (r, tex, col, op = 1, add = false) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r * RS, 64, 48), new THREE.MeshBasicMaterial({ map: tex, color: col, side: THREE.DoubleSide, clippingPlanes: planes, clipIntersection: true, transparent: op < 1, opacity: op, blending: add ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: !add })); scene.add(m); shells.push(m); return m; };
    const ph = mk(1.0, TEX.sun(), 0xffffff); mk(1.07, null, 0xff3b5c, 0.3, true);
    const cor = new THREE.Mesh(new THREE.SphereGeometry(2.2 * RS, 48, 32), new THREE.MeshBasicMaterial({ color: 0xaac8ff, transparent: true, opacity: 0.04, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false, clippingPlanes: planes, clipIntersection: true })); scene.add(cor);
    // flat cut faces: nested half-discs (outermost first) on both exposed planes = the classic cutaway
    [...SUN_LAYERS].reverse().forEach((Ly, i) => { [0, 1].forEach(pl => { const m = new THREE.Mesh(new THREE.CircleGeometry(Ly.r1 * RS, 64, -Math.PI / 2, Math.PI), new THREE.MeshBasicMaterial({ color: Ly.color, transparent: Ly.id === "corona", opacity: Ly.id === "corona" ? 0.05 : 1, depthWrite: Ly.id !== "corona", side: THREE.DoubleSide })); m.position.z = pl === 0 ? i * 0.004 : 0; if (pl === 1) { m.rotation.y = -Math.PI / 2; m.position.x = i * 0.004; } scene.add(m); }); });
    const coreGlow = glow(0xfff0b0, RS * 1.6); scene.add(coreGlow);
    // boundary arcs on both cut planes
    SUN_LAYERS.slice(0, 5).forEach(Ly => { const r = Ly.r1 * RS * 1.002, ptsA = [], ptsB = []; for (let i = 0; i <= 64; i++) { const a = i / 64 * 3.14159; ptsA.push(new THREE.Vector3(r * Math.cos(a * 0.5), r * Math.sin(a), 0)); ptsB.push(new THREE.Vector3(0, r * Math.sin(a), r * Math.cos(a * 0.5))); }
      [ptsA, ptsB].forEach(p => scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(p), new THREE.LineBasicMaterial({ color: Ly.color, transparent: true, opacity: 0.9 })))); });
    probe = new THREE.Group(); const pm = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 16), new THREE.MeshStandardMaterial({ color: 0xdde6ff, metalness: 0.9, roughness: 0.25, emissive: 0x2a4a8a, emissiveIntensity: 0.8 })); probe.add(pm, glow(0x88bbff, 1.1)); scene.add(probe);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.015, 8, 32), new THREE.MeshBasicMaterial({ color: 0x9fd0ff })); probe.add(ring);
    // flare particles + loop
    const N = 220; flarePos = new Float32Array(N * 3); flareVel = new Float32Array(N * 3); const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(flarePos, 3));
    flareMat = new THREE.PointsMaterial({ size: 0.28, map: TEX.star(), color: 0xffd27a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }); flareG = new THREE.Points(g, flareMat); scene.add(flareG);
    arcs = new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 10, 48, Math.PI), new THREE.MeshBasicMaterial({ color: 0xff7a2a, transparent: true, opacity: 0 })); scene.add(arcs);
    cam = orbitControls(canvas, camera, new THREE.Vector3(0, 0, 0), { th: 0.785, ph: 1.15, r: 12 }, { rmin: 5, rmax: 24 }); fitRenderer(renderer, camera, stage);
  }
  function probePos() { const rho = rhoOf(depth) * RS, dir = new THREE.Vector3(0.7071, 0.3, 0.7071).normalize(); return dir.multiplyScalar(rho); }
  function upd(quiet) {
    const Ly = layerNow(), T = tempNow(); hL.innerHTML = `${L("Layer", "Capa")}: <b>${L(Ly.en, Ly.es)}</b>`; hT.innerHTML = `${L("Temperature", "Temperatura")}: <b>${L(fmtT(T), fmtTes(T))}</b>`;
    fact.dataset.t = ""; fact.innerHTML = `<b>${L(Ly.en, Ly.es)}</b> — ${L(Ly.fEn, Ly.fEs)}`;
    dp.o.textContent = Math.round(depth) + "%"; S.sunDepth = depth; if (!quiet) sim.saveState();
    left.innerHTML = L(`Layers logged: <b>${new Set(S.sunLogged).size} / 6</b> · Layer-ID missions: <b>${Math.min(S.sunRound, 6)} / 6</b>`, `Capas registradas: <b>${new Set(S.sunLogged).size} / 6</b> · Misiones de identificar capas: <b>${Math.min(S.sunRound, 6)} / 6</b>`);
  }
  dp.r.addEventListener("input", () => { depth = Number(dp.r.value); upd(); });
  const order = [3, 0, 5, 2, 1, 4]; // photosphere, core, corona, convective, radiative, chromosphere
  function drawGame() {
    if (S.sunRound >= 6) { game.innerHTML = L("<b>All six layer missions complete!</b> You can name every layer of the Sun.", "<b>¡Las seis misiones de capas completadas!</b> Sabes nombrar todas las capas del Sol."); bCheck.style.display = "none"; return; }
    const Ly = SUN_LAYERS[order[S.sunRound]]; game.dataset.t = ""; game.innerHTML = `<b>${L("Mission", "Misión")} ${S.sunRound + 1}/6:</b> ${L(Ly.clueEn, Ly.clueEs)}`; bCheck.style.display = "";
  }
  bCheck.addEventListener("click", () => {
    if (S.sunRound >= 6) return; const want = SUN_LAYERS[order[S.sunRound]], now = layerNow();
    if (now.id === want.id) { game.dataset.t = "ok"; game.innerHTML = L(`<b>Correct!</b> That is the ${want.en}. ${want.fEn}`, `<b>¡Correcto!</b> Esa es la ${want.es}. ${want.fEs}`); S.sunRound++; sim.saveState(); addXP(10, L("layer found", "capa encontrada")); burst(stage, stage.clientWidth / 2, stage.clientHeight / 2, "#9fd0ff", 22); upd(true); setTimeout(() => { if (document.body.contains(game)) drawGame(); }, 2600); if (S.sunRound >= 6) { sim.mark("sun_layers_all_found", true); addXP(25, L("Sun explorer", "explorador solar")); } }
    else { game.dataset.t = "no"; shake(bCheck); game.innerHTML = L(`Not yet — your probe is in the <b>${now.en}</b>, not where you need to be. ${want.clueEn} Slide the probe and try again (no penalty).`, `Todavía no — tu sonda está en la <b>${now.es}</b>. ${want.clueEs} Mueve la sonda e inténtalo otra vez (sin penalización).`); }
  });
  bLog.addEventListener("click", () => {
    const Ly = layerNow(), T = tempNow();
    sim.recordTrial({ lab: L("Sun", "Sol"), setting: `${L("probe", "sonda")} ${Math.round(depth)}%`, peri: "-", aph: "-", vP: "-", vA: "-", temp: T.toLocaleString(), result: L(Ly.en, Ly.es) });
    const first = !S.sunLogged.includes(Ly.id); S.sunLogged.push(Ly.id); sim.saveState(); upd(true); sim.toast(L(`${Ly.en}: ${fmtT(T)} logged.`, `${Ly.es}: ${fmtTes(T)} registrado.`), "correct"); if (first) addXP(8, L("new layer logged", "nueva capa registrada")); burst(stage, stage.clientWidth * 0.5, stage.clientHeight * 0.55, "#ffd27a", 14);
  });
  bDive.addEventListener("click", () => { if (diving) return; diving = true; depth = 0; const t0 = performance.now(); const dur = reduced() ? 400 : 9000; const iv = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / dur); depth = k * 100; dp.r.value = depth; upd(true); if (k >= 1 || !document.body.contains(stage)) { clearInterval(iv); diving = false; sim.saveState(); } }, 60); });
  bFlare.addEventListener("click", () => {
    flareT = 0; flareDir = new THREE.Vector3(Math.random() * 0.6 + 0.3, Math.random() * 0.8 - 0.2, Math.random() * 0.6 + 0.3).normalize();
    if (gl) { for (let i = 0; i < flareVel.length / 3; i++) { const sp = 0.8 + Math.random() * 1.6, j = new THREE.Vector3((Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.7); const v = flareDir.clone().add(j).normalize().multiplyScalar(sp); flareVel.set([v.x, v.y, v.z], i * 3); const p = flareDir.clone().multiplyScalar(RS * 1.01); flarePos.set([p.x, p.y, p.z], i * 3); } flareMat.opacity = 1; arcs.position.copy(flareDir.clone().multiplyScalar(RS * 1.0)); arcs.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), flareDir); arcs.scale.setScalar(0.2); arcs.material.opacity = 0.95; }
    fact.dataset.t = "ok"; fact.innerHTML = L("<b>Solar flare!</b> Twisted magnetic field lines snap and release energy — charged particles blast outward as the solar wind. A big flare can release energy equal to millions of nuclear bombs, and it can disturb satellites and power grids on Earth.", "<b>¡Llamarada solar!</b> Líneas de campo magnético retorcidas se rompen y liberan energía — partículas cargadas salen disparadas como viento solar. Una llamarada grande libera energía equivalente a millones de bombas nucleares y puede alterar satélites y redes eléctricas en la Tierra.");
    if (!S.flared) { S.flared = true; addXP(10, L("solar flare", "llamarada solar")); sim.mark("triggered_flare", true); sim.saveState(); }
    burst(stage, stage.clientWidth * 0.6, stage.clientHeight * 0.4, "#ff9a3a", 30); stage.classList.remove("ssc-shake"); void stage.offsetWidth; stage.classList.add("ssc-shake");
  });
  upd(true); drawGame();
  if (gl) loop(stage, (dt, t) => {
    probe.position.copy(probePos()); probe.children[2].rotation.x = t * 2; probe.children[2].rotation.y = t * 1.3;
    shells[0].rotation.y += dt * 0.03;
    if (flareT >= 0) { flareT += dt; const n = flareVel.length / 3; for (let i = 0; i < n; i++) { flarePos[i * 3] += flareVel[i * 3] * dt * 3; flarePos[i * 3 + 1] += flareVel[i * 3 + 1] * dt * 3; flarePos[i * 3 + 2] += flareVel[i * 3 + 2] * dt * 3; } flareG.geometry.attributes.position.needsUpdate = true; arcs.scale.setScalar(0.2 + Math.min(flareT, 1.5) * 1.1); flareMat.opacity = Math.max(0, 1 - flareT / 3.2); arcs.material.opacity = Math.max(0, 0.95 - flareT / 2.2); if (flareT > 3.3) { flareT = -1; flareMat.opacity = 0; arcs.material.opacity = 0; } }
    if (cam.auto && !reduced()) cam.th = 0.785 + Math.sin(t * 0.3) * 0.75; cam.apply(); renderer.render(scene, camera);
  });
  return {};
}
