/* Solar Forge — Station 2: Passive House (passive solar design, thermal mass, heat transfer).
   A cutaway house seen from the side. Real shading geometry: the roof overhang blocks the
   high summer Sun and lets the low winter Sun in. Results come from simulate(); the scene only reads. */
import { L, T, C, clamp, lerp, rng, shell, track, goalsHTML, mesh, std, glassMat, noiseTex, canvasTex, liveSky, sunDisc, glowSprite, sfx, burstAt, shake, reduced, esc } from "./kit.js?v=3";

const TOP = 2.3, SILL = .5, EAVE = 2.6;
const KEYS = ["face", "win", "floor", "ins", "glaze", "over"];
/* Lumped thermal model, 15-minute steps, run for 5 days so day 5 is a steady repeat. */
export function simulate(d, season) {
  const W = season === "winter", area = d.win ? 10 : 3, U = (d.ins ? 60 : 240) + (d.glaze ? 2.6 : 5.6) * area, Cm = d.floor ? 9000 : 1400;
  const noon = W ? 26 : 74, rise = W ? 8 : 6, set = W ? 16 : 18, mean = W ? 4 : 23, amp = W ? 4 : 6;
  let Tin = 15; const day = [];
  for (let step = 0; step < 96 * 5; step++) {
    const t = (step % 96) / 4, To = mean + amp * Math.cos((t - 15) / 24 * 2 * Math.PI);
    let g = 0, elev = 0, lit = 0;
    if (t > rise && t < set) {
      const s = Math.sin(Math.PI * (t - rise) / (set - rise)); elev = Math.max(3, noon * s); const a = elev * Math.PI / 180;
      const shade = Math.max(0, (d.over ? .9 : .1) * Math.tan(a) - (EAVE - TOP)); lit = clamp(1 - shade / (TOP - SILL), 0, 1);
      g = d.face ? area * (850 * Math.sqrt(s) * Math.cos(a) * lit + 50 * s) * (d.glaze ? .75 : .85) : area * 40 * s;
    }
    const vent = !W && To < Tin && Tin > 21 ? 500 : 0, loss = (U + vent) * (Tin - To);
    Tin += (g + 350 - loss) / Cm * .25;
    if (step >= 96 * 4) day.push({ t, Tin, To, elev, lit: d.face ? lit : 0, g, loss });
  }
  const ins = day.map(x => x.Tin), min = Math.min(...ins), max = Math.max(...ins);
  return { day, min, max, comfy: Math.round(day.filter(x => x.Tin >= 18 && x.Tin <= 26).length / 4), outMin: mean - amp, outMax: mean + amp, gain: day.reduce((a, x) => a + x.g, 0) / 4000, lost: day.reduce((a, x) => a + Math.max(0, x.loss), 0) / 4000 };
}
const f1 = v => v.toFixed(1);

export function mountHouse(host, ctx) {
  const sim = ctx.sim;
  const H = sim.state.house = sim.state.house || { d: { face: 0, win: 0, floor: 0, ins: 0, glaze: 0, over: 0 }, season: "winter", runs: [], n: 0, goals: {}, hour: 12 };
  const save = () => sim.saveState();
  const CAMS = {
    side: { label: L("Side section", "Sección lateral"), theta: 1.22, phi: 1.38, dist: 11.5, target: [0, 1.6, .7] },
    in: { label: L("Inside", "Interior"), theta: 1.0, phi: 1.38, dist: 7.5, target: [-.4, 1.2, .6] },
    sky: { label: L("Sun path", "Trayectoria del Sol"), theta: 1.5, phi: 1.0, dist: 26, target: [0, 5, 6] },
  };
  const { st, panel, over } = shell(host, CAMS, { limits: { minDist: 4, maxDist: 34, minPhi: .45, maxPhi: 1.5 }, shadowRange: 12, swayAmp: .05, sway: false });
  let timer = 0, running = false, cur = null, idx = Math.round(H.hour * 4), shown = null;
  const stop = () => { clearInterval(timer); timer = 0; running = false; };
  const preview = () => simulate(H.d, H.season);
  cur = preview();

  /* ------------------------------------------------------------ 3D scene */
  let rebuild = () => {};
  if (st) {
    const sky = liveSky(st, { fogNear: 50, fogFar: 210 }), sunS = sunDisc(st, 9);
    const ground = mesh(new T.PlaneGeometry(240, 240), std(0xffffff, 1, 0, { map: noiseTex("#ffffff", .1, 2600, [30, 30], 256, 13) }), 0, 0, 0, true); ground.rotation.x = -Math.PI / 2; ground.castShadow = false; st.scene.add(ground);
    const r = rng(4), trees = new T.Group(); st.scene.add(trees);
    for (let i = 0; i < 16; i++) { const a = r() * 6.283, dd = 6 + r() * 30, x = -9 - Math.abs(Math.cos(a)) * dd, z = Math.sin(a) * dd * .9 - 4, s = .8 + r() * .9, tr = new T.Group(); tr.add(mesh(new T.CylinderGeometry(.12, .16, 1.2, 8), std(0x5a4030, .9), 0, .6, 0)); const leaf = mesh(new T.ConeGeometry(.9, 2.6, 9), std(0x2f6a3a, .9), 0, 2.4, 0); leaf.userData.leaf = 1; tr.add(leaf); tr.position.set(x, 0, z); tr.scale.setScalar(s); trees.add(tr); }
    const house = new T.Group(); st.scene.add(house);
    const beamGeo = new T.BufferGeometry(); beamGeo.setAttribute("position", new T.BufferAttribute(new Float32Array(24), 3)); beamGeo.setIndex([0, 1, 5, 0, 5, 4, 1, 2, 6, 1, 6, 5, 2, 3, 7, 2, 7, 6, 3, 0, 4, 3, 4, 7]);
    const beam = new T.Mesh(beamGeo, new T.MeshBasicMaterial({ color: C(0xffc530), transparent: true, opacity: .3, depthWrite: false, side: T.DoubleSide })); beam.frustumCulled = false; st.scene.add(beam);
    const patch = mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ color: C(0xffd040), transparent: true, opacity: .75, depthWrite: false }), 0, .32, 0, false); patch.rotation.x = -Math.PI / 2; st.scene.add(patch);
    const lamp = new T.PointLight(C(0xffc27a), 0, 9); lamp.position.set(0, 2.1, 0); st.scene.add(lamp);
    const leaks = Array.from({ length: 22 }, () => { const s = glowSprite(0xff5a3a, .45); s.visible = false; st.scene.add(s); return { s, t: 9 }; });
    const concrete = canvasTex(256, 256, (g, w, h) => { const q = rng(8); g.fillStyle = "#a9adb0"; g.fillRect(0, 0, w, h); for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${q() > .5 ? 255 : 0},${q() > .5 ? 255 : 0},${q() > .5 ? 255 : 0},${q() * .08})`; g.fillRect(q() * w, q() * h, 2 + q() * 3, 2 + q() * 3); } }, [3, 3]);
    const planks = canvasTex(256, 256, (g, w, h) => { const q = rng(6); for (let i = 0; i < 8; i++) { g.fillStyle = `hsl(${26 + q() * 8},${38 + q() * 12}%,${40 + q() * 12}%)`; g.fillRect(0, i * 32, w, 31); g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(q() * w, i * 32, 2, 31); } }, [2, 3]);
    let floorMat = null, winW = 1.67, parts = {};
    rebuild = () => {
      st.pickables.length = 0; while (house.children.length) { const c = house.children.pop(); c.traverse(x => x.geometry && x.geometry.dispose()); }
      const d = H.d, wallM = std(0xb9a98f, .9, 0, { map: noiseTex("#b9a98f", .1, 900, [2, 1], 256, 2), envMapIntensity: .3 }), insM = std(0xf2c53d, .95), dark = std(0x4a4f57, .6, .2);
      floorMat = new T.MeshStandardMaterial({ map: d.floor ? concrete : planks, roughness: d.floor ? .8 : .6, emissive: C(0xff5a1f), emissiveIntensity: 0 });
      const fl = mesh(new T.BoxGeometry(6.4, d.floor ? .5 : .12, 5.4), floorMat, 0, d.floor ? .05 : .24, 0); house.add(fl); parts.floor = fl;
      const wall = (w, h, dd, x, y, z, tag) => { const g = new T.Group(); g.add(mesh(new T.BoxGeometry(w, h, dd), wallM, x, y, z)); if (d.ins) { const iw = dd < w ? [w, h, .16, x, y, z + Math.sign(z || 1) * (dd / 2 + .08)] : [.16, h, dd, x - (dd ? .2 : 0), y, z]; g.add(mesh(new T.BoxGeometry(iw[0], iw[1], iw[2]), insM, iw[3], iw[4], iw[5])); } g.userData.tag = tag; house.add(g); return g; };
      /* window wall on the Sun side (+Z) or the shade side (-Z); the other is solid */
      winW = d.win ? 5.5 : 1.67; const zs = d.face ? 2.6 : -2.6, zo = -zs, side = (6.2 - winW) / 2;
      parts.walls = [wall(6.2, 2.6, .25, 0, 1.6, zo, "wall"), wall(.25, 2.6, 5.4, -3.1, 1.6, 0, "wall")];
      if (side > .05) [-1, 1].forEach(s => parts.walls.push(wall(side, 2.6, .25, s * (winW / 2 + side / 2), 1.6, zs, "wall")));
      parts.walls.push(wall(winW, SILL - .3, .25, 0, .3 + (SILL - .3) / 2, zs, "wall"), wall(winW, 2.9 - TOP, .25, 0, TOP + (2.9 - TOP) / 2, zs, "wall"));
      const pane = z => mesh(new T.BoxGeometry(winW, TOP - SILL, .03), glassMat(0xbfe6ff, .22), 0, (TOP + SILL) / 2, z, false);
      const win = new T.Group(); win.add(pane(zs)); if (d.glaze) win.add(pane(zs - Math.sign(zs) * .12)); win.add(mesh(new T.BoxGeometry(winW + .1, .06, .2), dark, 0, SILL, zs), mesh(new T.BoxGeometry(winW + .1, .06, .2), dark, 0, TOP, zs)); house.add(win); parts.win = win;
      /* roof with or without the overhang on the Sun side */
      const o = d.over ? .9 : .1, roof = new T.Group(); roof.add(mesh(new T.BoxGeometry(6.8, .18, 5.6 + o), std(0x7a3f32, .8, 0, { map: noiseTex("#7a3f32", .1, 800, [3, 2], 256, 5) }), 0, 3, o / 2)); if (d.ins) roof.add(mesh(new T.BoxGeometry(6.2, .16, 5.2), insM, 0, 2.83, 0)); house.add(roof); parts.roof = roof;
      /* furniture */
      const sofa = new T.Group(); sofa.add(mesh(new T.BoxGeometry(1.9, .4, .8), std(0x3d6d8f, .9), 0, .55, 0), mesh(new T.BoxGeometry(1.9, .55, .2), std(0x35607f, .9), 0, .95, -.3)); sofa.position.set(-1.2, 0, -1.7); house.add(sofa);
      house.add(mesh(new T.CylinderGeometry(.18, .14, .3, 12), std(0xb5683c, .8), 2.2, .45, -1.9)); const pl = mesh(new T.SphereGeometry(.4, 12, 10), std(0x3c8a48, .9), 2.2, 1, -1.9); pl.scale.y = 1.4; house.add(pl);
      house.add(mesh(new T.BoxGeometry(2.4, .02, 1.6), std(0xb2473e, 1), .3, .31, .2, false));
      st.pickable(fl, () => flip("floor")); st.pickable(win, () => flip("win")); st.pickable(roof, () => flip("over")); parts.walls.forEach(w => st.pickable(w, () => flip("ins")));
    };
    rebuild();
    const P = beamGeo.attributes.position, snow = C(0xc9d6e6), grass = C(0x4f8a36), leafW = C(0x4a6f5a), leafS = C(0x2f7a3a);
    st.onFrame.push((dt, t) => {
      const x = cur.day[clamp(idx, 0, 95)], W = H.season === "winter", a = x.elev * Math.PI / 180, up = x.elev > 0;
      ground.material.color.lerp(W ? snow : grass, .08); trees.children.forEach(tr => tr.children[1].material.color.lerp(W ? leafW : leafS, .08));
      const sp = new T.Vector3(0, Math.sin(a) * 34, 2.6 + Math.cos(a) * 34); if (!up) sp.y = -6;
      sunS.position.lerp(sp, reduced() ? 1 : .15); sunS.visible = sunS.position.y > -1; st.sun.position.set(2, Math.max(2, Math.sin(a) * 30), 2.6 + Math.cos(a) * 30); sky(up ? clamp(.35 + x.elev / 26, 0, 1) : .04);
      lamp.intensity = up ? 0 : 1.1;
      /* beam through the lit part of the window down to the floor */
      const lit = H.d.face && up ? x.lit : 0, yT = SILL + (TOP - SILL) * lit, hw = winW / 2, ta = Math.max(.06, Math.tan(a)), zf = y => Math.max(-2.4, 2.6 - (y - .32) / ta);
      beam.visible = patch.visible = lit > .02;
      if (beam.visible) {
        [[-hw, yT, 2.6], [hw, yT, 2.6], [hw, SILL, 2.6], [-hw, SILL, 2.6], [-hw, .33, zf(yT)], [hw, .33, zf(yT)], [hw, .33, zf(SILL)], [-hw, .33, zf(SILL)]].forEach((v, i) => P.setXYZ(i, v[0], v[1], v[2])); P.needsUpdate = true;
        const z0 = zf(yT), z1 = zf(SILL); patch.position.set(0, .33, (z0 + z1) / 2); patch.scale.set(winW, Math.max(.05, z1 - z0), 1); beam.material.opacity = .22 + .2 * Math.sqrt(x.elev / 74);
      }
      if (floorMat) floorMat.emissiveIntensity = lerp(floorMat.emissiveIntensity, H.d.floor ? clamp((x.Tin - 16) / 14, 0, 1) * .5 : 0, .1);
      /* heat leaking out through walls and roof */
      if (!reduced()) {
        const rate = clamp(x.loss / 5200, 0, 1); leaks.forEach(l => {
          l.t += dt; if (l.t > 1.4) { if (r() < rate * .5) { l.t = 0; l.s.visible = true; const side = Math.floor(r() * 3); l.v = side === 0 ? [0, 1.2, 0] : side === 1 ? [0, .3, -1.3] : [-1.3, .3, 0]; l.s.position.set(side === 2 ? -3.3 : -2.5 + r() * 5, side === 0 ? 3.2 : .8 + r() * 1.6, side === 1 ? -2.9 : -2 + r() * 4); } else l.s.visible = false; }
          if (l.s.visible) { l.s.position.x += l.v[0] * dt; l.s.position.y += l.v[1] * dt; l.s.position.z += l.v[2] * dt; l.s.material.opacity = clamp(1 - l.t / 1.4, 0, 1) * .7; }
        });
      } else leaks.forEach(l => l.s.visible = false);
    });
  }

  /* --------------------------------------------------------------- panel */
  const FEAT = () => ({
    face: [L("Window faces the Sun", "Ventana orientada al Sol"), L("North in New Zealand, south in the Northern Hemisphere", "Norte en Nueva Zelanda, sur en el hemisferio norte")],
    win: [L("Large window", "Ventana grande"), L("10 m² of glass instead of 3 m²", "10 m² de vidrio en lugar de 3 m²")],
    floor: [L("Concrete floor (thermal mass)", "Suelo de hormigón (masa térmica)"), L("Instead of a thin timber floor", "En lugar de un suelo fino de madera")],
    ins: [L("Insulated walls and roof", "Paredes y techo aislados"), L("The yellow layer", "La capa amarilla")],
    glaze: [L("Double glazing", "Doble acristalamiento"), L("Two panes with a gap", "Dos vidrios con una cámara")],
    over: [L("Roof overhang", "Alero del tejado"), L("0.9 m over the window", "0,9 m sobre la ventana")],
  });
  const GOALS = () => [["base", L("Run a winter day", "Simula un día de invierno")], ["fair", L("Fair test: two runs in the same season that differ in ONE feature", "Prueba justa: dos simulaciones de la misma estación que difieran en UNA característica")], ["winter", L("Winter: 24 of 24 hours between 18 and 26 °C with no heater", "Invierno: 24 de 24 horas entre 18 y 26 °C sin calefacción")], ["both", L("The same design also stays 24 of 24 hours in summer", "El mismo diseño también aguanta 24 de 24 horas en verano")]];
  const dkey = d => KEYS.map(k => d[k] ? 1 : 0).join("");
  function goals() {
    const R = H.runs; H.goals.base = R.some(x => x.s === "winter");
    H.goals.fair = R.some((a, i) => R.some((b, j) => j > i && a.s === b.s && [...a.k].filter((c, q) => c !== b.k[q]).length === 1));
    H.goals.winter = R.some(x => x.s === "winter" && x.c >= 24); H.goals.both = R.some(a => a.s === "winter" && a.c >= 24 && R.some(b => b.s === "summer" && b.k === a.k && b.c >= 24));
  }
  function stars() { const g = H.goals; let n = g.base && g.fair ? 1 : 0; if (n && g.winter) n = 2; if (n === 2 && g.both) n = 3; if (n) ctx.star("house", n, H.runs.length >= 3); }
  const desc = d => { const F = FEAT(), on = KEYS.filter(k => d[k]).map(k => F[k][0].toLowerCase()); return on.length ? on.join("; ") : L("no passive features", "sin características pasivas"); };
  function diagnose(res) {
    const d = H.d, W = H.season === "winter";
    if (W) {
      if (res.comfy >= 24) return L("Comfortable all day and all night with no heater. Low winter sunlight came in under the overhang, the concrete stored it, and insulation kept it in.", "Confortable todo el día y toda la noche sin calefacción. La luz baja del invierno entró bajo el alero, el hormigón la almacenó y el aislamiento la retuvo.");
      if (!d.face || !d.win) return L(`Too cold. Only ${f1(res.gain)} kWh of solar energy got in. More Sun-facing glass would capture more.`, `Demasiado frío. Solo entraron ${f1(res.gain)} kWh de energía solar. Más vidrio orientado al Sol captaría más.`);
      if (!d.ins) return L(`${f1(res.gain)} kWh came in, but ${f1(res.lost)} kWh leaked straight out through the walls and roof (the red puffs).`, `Entraron ${f1(res.gain)} kWh, pero ${f1(res.lost)} kWh se escaparon por paredes y techo (las nubes rojas).`);
      if (!d.floor) return L(`It swung from ${f1(res.min)} to ${f1(res.max)} °C. With little thermal mass the house overheats by day and has nothing stored for the night.`, `Osciló de ${f1(res.min)} a ${f1(res.max)} °C. Con poca masa térmica la casa se sobrecalienta de día y no guarda nada para la noche.`);
      return L("Nearly there. Heat is still escaping through the glass at night.", "Casi. El calor sigue escapando por el vidrio durante la noche.");
    }
    if (res.max > 26) return d.over ? L(`It reached ${f1(res.max)} °C. With little thermal mass, the air heats up quickly in the afternoon.`, `Llegó a ${f1(res.max)} °C. Con poca masa térmica, el aire se calienta rápido por la tarde.`) : L(`It reached ${f1(res.max)} °C. High summer sunlight is pouring through the glass. Look at the beam at midday.`, `Llegó a ${f1(res.max)} °C. La luz alta del verano entra de lleno por el vidrio. Mira el haz a mediodía.`);
    return L("Comfortable all day. Watch the midday beam: the overhang blocks the high summer Sun before it reaches the glass.", "Confortable todo el día. Observa el haz a mediodía: el alero bloquea el Sol alto del verano antes de que llegue al vidrio.");
  }
  function flip(k) { if (running) return; H.d[k] = H.d[k] ? 0 : 1; save(); sfx("pop"); cur = preview(); shown = null; rebuild(); st && st.burst(new T.Vector3(0, 2.2, 1.5), 0xffd166, 16, 1.6); render(); }
  function render(note) {
    const F = FEAT(), W = H.season === "winter";
    panel.innerHTML = `${track([L("Design", "Diseña"), L("Run 24 h", "Simula 24 h"), L("Compare", "Compara")], running ? 1 : H.runs.length ? 2 : 0)}<h3 class="sf-h">${L("Heat a house with no heater", "Calienta una casa sin calefacción")}</h3>
      <p class="sf-sub">${L("Choose the building features (or tap the window, floor, walls and roof in the 3D view). Then run a whole day and read the indoor temperature. <b>Change one feature at a time.</b>", "Elige las características del edificio (o toca la ventana, el suelo, las paredes y el tejado en la vista 3D). Después simula un día entero y lee la temperatura interior. <b>Cambia una sola característica cada vez.</b>")}</p>
      <div class="sf-steps"><button type="button" class="sf-chip${W ? " is-on" : ""}" data-season="winter">${L("Winter day (0 to 8 °C)", "Día de invierno (0 a 8 °C)")}</button><button type="button" class="sf-chip${W ? "" : " is-on"}" data-season="summer">${L("Summer day (17 to 29 °C)", "Día de verano (17 a 29 °C)")}</button></div>
      <div class="sf-tgs">${KEYS.map(k => `<label class="sf-tg"><input type="checkbox" data-k="${k}" ${H.d[k] ? "checked" : ""}><span><b>${F[k][0]}</b><small>${F[k][1]}</small></span></label>`).join("")}</div>
      <label class="sf-range">${L("Move the Sun: time of day", "Mueve el Sol: hora del día")} <b class="v-hr"></b><input type="range" class="r-hr" min="0" max="95" step="1" value="${idx}"></label>
      <canvas class="sf-graph" width="560" height="200" role="img" aria-label="${esc(L("Graph of indoor and outdoor temperature over 24 hours", "Gráfica de la temperatura interior y exterior durante 24 horas"))}"></canvas>
      <div class="sf-row"><button type="button" class="sf-btn sf-btn--big sf-go">${L("Run a 24-hour test", "Simular 24 horas")}</button></div>
      <div class="sf-fb ${note ? note[0] : ""}" role="status">${note ? note[1] : ""}</div>${goalsHTML(GOALS(), H.goals)}
      <div class="sf-log-list">${H.runs.slice(-4).reverse().map(x => `<div class="sf-run"><b>${L("Day", "Día")} ${x.n} (${x.s === "winter" ? L("winter", "invierno") : L("summer", "verano")}): ${x.c}/24 h</b><span>${f1(x.min)} ${L("to", "a")} ${f1(x.max)} °C · ${esc(x.t)}</span></div>`).join("")}</div>`;
    const $ = s => panel.querySelector(s), cv = $(".sf-graph");
    const hud = () => { const x = cur.day[idx], hh = String(Math.floor(x.t)).padStart(2, "0") + ":" + String(Math.round((x.t % 1) * 60)).padStart(2, "0"); $(".v-hr").textContent = hh; if (over) over.innerHTML = `<span>${hh}</span><span>${L("Outdoor", "Exterior")} ${f1(x.To)} °C</span>${shown ? `<span class="hot">${L("Indoor", "Interior")} ${f1(x.Tin)} °C</span>` : ""}`; };
    const draw = upto => {
      const g = cv.getContext("2d"), w = cv.width, h = cv.height, X = t => 34 + t / 24 * (w - 44), Y = v => h - 22 - (v + 2) / 44 * (h - 34);
      g.clearRect(0, 0, w, h); g.fillStyle = "rgba(255,255,255,.05)"; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(90,220,140,.2)"; g.fillRect(X(0), Y(26), X(24) - X(0), Y(18) - Y(26));
      g.font = "11px system-ui"; g.fillStyle = "#b9c8d6"; g.strokeStyle = "rgba(255,255,255,.14)"; g.lineWidth = 1;
      [0, 10, 20, 30, 40].forEach(v => { g.beginPath(); g.moveTo(X(0), Y(v)); g.lineTo(X(24), Y(v)); g.stroke(); g.fillText(v + "°", 6, Y(v) + 4); }); [0, 6, 12, 18, 24].forEach(t => g.fillText(t + "h", X(t) - 8, h - 6));
      g.fillStyle = "#8be0a8"; g.fillText(L("comfort 18-26 °C", "confort 18-26 °C"), X(.4), Y(26) + 12);
      const line = (key, color, n, dash) => { g.strokeStyle = color; g.lineWidth = 2.5; g.setLineDash(dash || []); g.beginPath(); for (let i = 0; i <= n; i++) { const x = cur.day[i]; i ? g.lineTo(X(x.t), Y(x[key])) : g.moveTo(X(x.t), Y(x[key])); } g.stroke(); g.setLineDash([]); };
      line("To", "#6fb8ff", 95, [5, 4]); if (shown) line("Tin", "#ffd166", upto); g.fillStyle = "#6fb8ff"; g.fillText(L("outdoor", "exterior"), X(19.5), Y(cur.day[80].To) - 6); if (shown) { g.fillStyle = "#ffd166"; g.fillText(L("indoor", "interior"), X(1), Y(cur.day[4].Tin) - 6); }
      g.strokeStyle = "rgba(255,255,255,.6)"; g.lineWidth = 1; g.beginPath(); g.moveTo(X(idx / 4), 8); g.lineTo(X(idx / 4), h - 22); g.stroke();
    };
    hud(); draw(95);
    panel.querySelectorAll("[data-k]").forEach(c => c.addEventListener("change", () => flip(c.dataset.k)));
    panel.querySelectorAll("[data-season]").forEach(b => b.addEventListener("click", () => { if (running || H.season === b.dataset.season) return; H.season = b.dataset.season; save(); cur = preview(); shown = null; sfx("tick"); render(); }));
    $(".r-hr").addEventListener("input", e => { if (running) return; idx = +e.target.value; H.hour = idx / 4; hud(); draw(95); });
    $(".sf-go").addEventListener("click", e => {
      if (running) return; const key = dkey(H.d);
      if (H.runs.some(x => x.k === key && x.s === H.season)) { shake(e.currentTarget); sfx("bad"); const f = $(".sf-fb"); f.className = "sf-fb bad"; f.textContent = L("You already tested exactly this design in this season. Change one feature, or switch season.", "Ya probaste exactamente este diseño en esta estación. Cambia una característica o cambia de estación."); return; }
      running = true; shown = true; cur = preview(); idx = 0; sfx("ok"); e.currentTarget.disabled = true; panel.querySelectorAll("input,[data-season]").forEach(x => x.disabled = true); st && st.flyTo(CAMS.side);
      const finish = () => {
        stop(); idx = 56; H.hour = 14; const res = cur, n = ++H.n, before = Object.assign({}, H.goals);
        H.runs.push({ n, s: H.season, k: key, c: res.comfy, min: res.min, max: res.max, t: desc(H.d) });
        ctx.log({ lab: L("Passive house", "Casa pasiva"), run: L(`Day ${n}`, `Día ${n}`), setup: (H.season === "winter" ? L("Winter", "Invierno") : L("Summer", "Verano")) + "; " + desc(H.d), outcome: L(`Indoor ${f1(res.min)} to ${f1(res.max)} °C (outdoor ${res.outMin} to ${res.outMax} °C); solar gain ${f1(res.gain)} kWh`, `Interior ${f1(res.min)} a ${f1(res.max)} °C (exterior ${res.outMin} a ${res.outMax} °C); ganancia solar ${f1(res.gain)} kWh`), count: L(`${res.comfy} of 24 h at 18-26 °C`, `${res.comfy} de 24 h a 18-26 °C`) });
        goals(); stars(); save(); const got = Object.keys(H.goals).filter(k => H.goals[k] && !before[k]).length, good = res.comfy >= 24;
        if (H.goals.both && !before.both) ctx.award("sf-house", L("Passive Architect", "Arquitecto pasivo"));
        sfx(good ? "win" : "pop"); if (good && st) st.burst(new T.Vector3(0, 2, 0), 0xffd166, 40, 2.6);
        render([good ? "good" : "bad", `<b>${res.comfy}/24 h ${L("comfortable", "confortables")} · ${f1(res.min)} ${L("to", "a")} ${f1(res.max)} °C.</b> ${diagnose(res)}`]); ctx.gain(10 + got * 25 + (good ? 15 : 0), panel.querySelector(".sf-h"));
      };
      if (reduced()) return finish();
      const t0 = Date.now(); timer = setInterval(() => { if (!panel.isConnected) return stop(); idx = Math.min(95, Math.floor((Date.now() - t0) / 55)); if (idx >= 95) return finish(); hud(); draw(idx); }, 55);
    });
  }
  goals(); render();
  return { dispose() { stop(); st && st.dispose(); } };
}
