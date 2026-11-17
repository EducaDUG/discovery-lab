/* Solar Forge — Station 1: Photon Lab (the photovoltaic effect, efficiency, First Law).
   A giant cutaway silicon cell. The scene only READS state; all results come from pvModel(). */
import { L, T, C, clamp, lerp, rng, shell, ask, track, goalsHTML, mesh, std, glassMat, steelTex, noiseTex, liveSky, meadow, glowSprite, sunDisc, cloudPuff, canvasTex, label3d, sfx, burstAt, shake, reduced, esc } from "./kit.js?v=3";

/* 1 m2 of panel. Standard silicon: 22 % at 25 C, losing 0.4 % of its output per degree above that. */
export function pvModel(sun, temp) {
  const eff = clamp(.22 * (1 - .004 * (temp - 25)), 0, 1), elec = Math.round(sun * eff), refl = Math.round(sun * .05);
  return { eff, elec, refl, heat: sun - elec - refl };
}
const pct = e => (e * 100).toFixed(1);

export function mountPV(host, ctx) {
  const sim = ctx.sim;
  const P = sim.state.pv = sim.state.pv || { phase: 0, step: 0, runs: [], n: 0, goals: {}, ch: 0, chOk: 0, sun: 1000, temp: 25 };
  const save = () => sim.saveState();
  const CAMS = {
    rig: { label: L("Whole rig", "Montaje completo"), theta: .62, phi: 1.14, dist: 9.6, target: [1.5, 1.25, -.2] },
    cell: { label: L("Inside the cell", "Dentro de la célula"), theta: .3, phi: 1.36, dist: 5.2, target: [-1.5, 1.4, 1.2] },
    load: { label: L("Inverter and house", "Inversor y casa"), theta: -.5, phi: 1.2, dist: 6.5, target: [4, 1, -.4] },
  };
  const { st, panel } = shell(host, CAMS, { limits: { minDist: 3, maxDist: 18, minPhi: .5, maxPhi: 1.52 }, sunPos: [-3, 11, 5], shadowRange: 9, swayAmp: .07 });
  /* what the scene shows right now (set by the panel) */
  const V = { mat: P.step > 0 || P.phase > 0 ? "si" : "none", field: P.step > 1 || P.phase > 0, circuit: P.step > 2 || P.phase > 0, inv: P.step > 3 || P.phase > 0, sun: P.sun, temp: P.temp, current: 0 };

  /* ------------------------------------------------------------ 3D scene */
  if (st) {
    const sky = liveSky(st, { fogNear: 40, fogFar: 150 }); meadow(st);
    const sunS = sunDisc(st, 16); sunS.position.set(-9, 17, -16);
    const cloud = cloudPuff(8, 4, 3.4); cloud.position.set(-22, 16.4, -15.5); st.scene.add(cloud);
    /* steel frame */
    const steel = new T.MeshStandardMaterial({ map: steelTex(), color: C(0xd5dce2), roughness: .35, metalness: .85 });
    [[-1.9, -1.1], [1.9, -1.1], [-1.9, 1.1], [1.9, 1.1]].forEach(p => st.scene.add(mesh(new T.CylinderGeometry(.06, .07, 1.05, 12), steel, p[0], .52, p[1])));
    st.scene.add(mesh(new T.BoxGeometry(4.5, .08, 3), std(0x3b4654, .6, .4), 0, .04, 0));
    /* the cell: back contact, p-type, junction, n-type, glass, fingers */
    const cell = new T.Group(); st.scene.add(cell);
    cell.add(mesh(new T.BoxGeometry(4, .06, 2.4), steel, 0, 1.075, 0));
    const pMat = std(0x35527e, .45, .1, { emissive: C(0xff3b1f), emissiveIntensity: 0 }), nMat = std(0x16306b, .3, .15, { emissive: C(0xff3b1f), emissiveIntensity: 0 });
    const pLayer = mesh(new T.BoxGeometry(4, .34, 2.4), pMat, 0, 1.275, 0), nLayer = mesh(new T.BoxGeometry(4, .1, 2.4), nMat, 0, 1.5, 0); cell.add(pLayer, nLayer);
    const junction = mesh(new T.BoxGeometry(4.02, .014, 2.42), new T.MeshBasicMaterial({ color: C(0x7ff5ff), transparent: true, opacity: 0 }), 0, 1.447, 0, false); cell.add(junction);
    const jGlow = glowSprite(0x7ff5ff, 1); jGlow.scale.set(5.6, .5, 1); jGlow.position.set(0, 1.447, 1.22); jGlow.material.opacity = 0; cell.add(jGlow);
    const cellTex = canvasTex(512, 320, (g, w, h) => { g.fillStyle = "#0b1f52"; g.fillRect(0, 0, w, h); for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const x = i * w / 6 + 3, y = j * h / 4 + 3, cw = w / 6 - 6, ch = h / 4 - 6, gr = g.createLinearGradient(x, y, x + cw, y + ch); gr.addColorStop(0, "#1b3f9a"); gr.addColorStop(1, "#102a6e"); g.fillStyle = gr; g.fillRect(x, y, cw, ch); g.strokeStyle = "rgba(210,225,255,.35)"; g.lineWidth = 1; for (let k = 1; k < 9; k++) { g.beginPath(); g.moveTo(x, y + k * ch / 9); g.lineTo(x + cw, y + k * ch / 9); g.stroke(); } g.strokeStyle = "rgba(235,240,255,.8)"; g.lineWidth = 3; [.3, .7].forEach(u => { g.beginPath(); g.moveTo(x + cw * u, y); g.lineTo(x + cw * u, y + ch); g.stroke(); }); } });
    const top = mesh(new T.PlaneGeometry(4, 2.4), new T.MeshStandardMaterial({ map: cellTex, roughness: .25, metalness: .3 }), 0, 1.552, 0, false); top.rotation.x = -Math.PI / 2; cell.add(top);
    cell.add(mesh(new T.BoxGeometry(4, .03, 2.4), glassMat(0xcfe6ff, .12), 0, 1.57, 0, false));
    [[L("Glass and metal contacts", "Vidrio y contactos metálicos"), 1.66, "#cfe6ff"], [L("n-type silicon", "Silicio tipo n"), 1.5, "#8fb4ff"], [L("Junction: electric field", "Unión: campo eléctrico"), 1.4, "#7ff5ff"], [L("p-type silicon", "Silicio tipo p"), 1.26, "#a9c0e8"], [L("Back contact", "Contacto posterior"), 1.06, "#e2e8ee"]].forEach((d, i) => { const s = label3d(d[0], { color: d[2], size: .17 }); s.position.set(-2.05 - s.scale.x / 2, d[1] + (i === 0 ? .06 : 0), 1.25); cell.add(s); });
    for (let i = 0; i < 9; i++) cell.add(mesh(new T.BoxGeometry(.03, .025, 2.4), steel, -1.8 + i * .45, 1.6, 0, false));
    cell.add(mesh(new T.BoxGeometry(.1, .05, 2.4), steel, 2, 1.6, 0, false));
    /* wrong materials shown as a plate on top */
    const copper = mesh(new T.BoxGeometry(4, .08, 2.4), std(0xc77a3a, .25, 1), 0, 1.64, 0, false), glass = mesh(new T.BoxGeometry(4, .5, 2.4), glassMat(0xd8f1ff, .3), 0, 1.3, 0, false);
    copper.visible = glass.visible = false; cell.add(copper, glass);
    /* circuit: top contact -> inverter -> lamp/house -> back contact */
    const curve = new T.CatmullRomCurve3([[2.05, 1.6, .6], [2.7, 1.95, .6], [3.5, 1.7, .3], [3.6, 1.15, 0], [3.6, .45, 0], [3.1, .22, .5], [2.5, .3, .8], [2.1, 1.07, .6]].map(p => new T.Vector3(...p)));
    const wire = mesh(new T.TubeGeometry(curve, 80, .035, 8), std(0xc8742e, .35, .9)); wire.visible = V.circuit; st.scene.add(wire);
    const inv = new T.Group(); inv.position.set(3.6, .8, 0); inv.add(mesh(new T.BoxGeometry(.7, .8, .35), std(0xf2f4f6, .4, .1))); inv.add(mesh(new T.BoxGeometry(.4, .18, .02), std(0x0c1c26, .3, 0, { emissive: C(0x35f0a0), emissiveIntensity: 1.2 }), 0, .15, .18, false));
    inv.add(mesh(new T.CylinderGeometry(.04, .04, .8, 8), steel, 0, -.6, 0)); inv.visible = V.inv; st.scene.add(inv);
    /* little house whose windows light up */
    const house = new T.Group(); house.position.set(5.4, 0, -1.6); house.rotation.y = -.45;
    house.add(mesh(new T.BoxGeometry(2.4, 1.6, 2), std(0xf0e6d6, .9, 0, { map: noiseTex("#f0e6d6", .06, 600) }), 0, .8, 0));
    const roof = mesh(new T.ConeGeometry(1.95, 1, 4), std(0x9b4a3a, .8), 0, 2.1, 0); roof.rotation.y = Math.PI / 4; roof.scale.set(1.05, 1, .88); house.add(roof);
    const winMat = std(0x26323c, .3, 0, { emissive: C(0xffd27a), emissiveIntensity: 0 });
    [-.6, .6].forEach(x => house.add(mesh(new T.BoxGeometry(.55, .6, .04), winMat, x, .95, 1.01, false))); house.add(mesh(new T.BoxGeometry(.5, .9, .04), std(0x5a3a26, .8), 1.21, .45, .2, false));
    st.scene.add(house);
    const lamp = glowSprite(0xffe7a0, .1); lamp.position.set(3.6, 1.75, 0); st.scene.add(lamp);

    /* particles: photons, electrons, heat puffs (all cosmetic, pooled) */
    const r = rng(9), parts = [];
    const pool = (n, color, size) => Array.from({ length: n }, () => { const s = glowSprite(color, size); s.visible = false; st.scene.add(s); return s; });
    const free = { ph: pool(46, 0xffc21a, .3), el: pool(40, 0x39e6ff, .24), heat: pool(26, 0xff5a2d, .5) }; free.ph.forEach(s => s.scale.set(.2, .75, 1));
    const spawn = (kind, x, y, z, extra) => { const s = free[kind].pop(); if (!s) return; s.visible = true; s.material.opacity = 1; s.position.set(x, y, z); parts.push(Object.assign({ kind, s, t: 0 }, extra)); };
    const kill = p => { p.s.visible = false; free[p.kind].push(p.s); p.dead = true; };
    let acc = 0;
    st.onFrame.push((dt, t) => {
      const sunK = V.sun / 1000, m = pvModel(V.sun, V.temp);
      /* environment follows the sliders */
      cloud.position.x = lerp(cloud.position.x, lerp(-9, -24, sunK), 1 - Math.exp(-dt * 3)); sky(sunK < .01 ? .05 : .45 + .55 * sunK); sunS.visible = sunK > .01; sunS.children[0].material.opacity = .25 + .75 * sunK;
      const hot = clamp((V.temp - 25) / 45, 0, 1); pMat.emissiveIntensity = nMat.emissiveIntensity = hot * .32;
      junction.material.opacity = V.field ? .55 + Math.sin(t * 3) * .2 : 0; jGlow.material.opacity = V.field ? .5 : 0;
      copper.visible = V.mat === "cu"; glass.visible = V.mat === "glass"; cell.children.forEach(c => { if (c === pLayer || c === nLayer) c.visible = V.mat !== "glass"; });
      wire.visible = V.circuit; inv.visible = V.inv;
      const cur = V.mat === "si" && V.field && V.circuit ? m.elec / 220 : 0; V.current = cur;
      lamp.scale.setScalar(.1 + cur * .9); winMat.emissiveIntensity = V.inv ? cur * 1.6 : 0;
      if (reduced()) return;
      /* photons */
      acc += dt * 15 * sunK;
      while (acc > 1) { acc -= 1; spawn("ph", -1.8 + r() * 3.6, 6 + r(), -1 + r() * 2.1, { vy: -6.5, roll: r() }); }
      if (V.temp > 40 && r() < dt * 4) spawn("heat", -1.8 + r() * 3.6, 1.65, -1 + r() * 2, { vy: .9, life: 1.2 });
      for (const p of parts) {
        p.t += dt; const s = p.s;
        if (p.kind === "ph") {
          s.position.y += p.vy * dt; s.position.x += (p.vx || 0) * dt;
          if (p.vy < 0 && s.position.y <= (V.mat === "glass" ? -1 : 1.62)) {
            if (V.mat === "glass" || V.mat === "none") { if (s.position.y < .1) kill(p); }
            else if (V.mat === "cu" || p.roll < .05) { p.vy = 5; p.vx = (r() - .5) * 3; }
            else { kill(p); if (p.roll < .05 + m.eff) spawn("el", s.position.x, 1.4, s.position.z, { phase: 0, wob: r() * 6 }); else if (r() < .6) spawn("heat", s.position.x, 1.5, s.position.z, { vy: .8, life: .9 }); }
          }
          if (s.position.y > 7.5) kill(p);
        } else if (p.kind === "heat") { s.position.y += p.vy * dt; s.material.opacity = clamp(1 - p.t / p.life, 0, 1) * .6; if (p.t > p.life) kill(p); }
        else { /* electron */
          if (!V.field) { s.position.x += Math.sin(p.t * 9 + p.wob) * dt * .5; s.position.z += Math.cos(p.t * 7 + p.wob) * dt * .5; s.position.y = 1.4 + Math.sin(p.t * 5 + p.wob) * .06; if (p.t > 1.1) { spawn("heat", s.position.x, 1.45, s.position.z, { vy: .5, life: .6 }); kill(p); } }
          else if (p.phase === 0) { s.position.y += dt * .5; if (s.position.y >= 1.6) { p.phase = 1; } }
          else if (p.phase === 1) { s.position.x += dt * 2.6; s.position.z = lerp(s.position.z, .6, dt * 3); if (s.position.x >= 2.05) { if (V.circuit) { p.phase = 2; p.u = 0; } else { s.material.opacity -= dt * 1.5; if (s.material.opacity <= 0) kill(p); s.position.x = 2.05; } } }
          else { p.u += dt * .42; if (p.u >= 1) kill(p); else s.position.copy(curve.getPoint(p.u)); }
        }
      }
      for (let i = parts.length - 1; i >= 0; i--) if (parts[i].dead) parts.splice(i, 1);
    });
  }
  const view = o => Object.assign(V, o);
  const cam = k => st && st.flyTo(CAMS[k]);

  /* --------------------------------------------------------------- panel */
  const NAMES = [L("Build the cell", "Construye la célula"), L("Test bench", "Banco de pruebas"), L("Field calls", "Casos reales")];
  const head = (title, sub) => `${track(NAMES, P.phase)}<h3 class="sf-h">${title}</h3><p class="sf-sub">${sub}</p>`;
  function stars() { let n = P.phase > 0 ? 1 : 0; const ev = P.goals.light && P.goals.temp; if (n && ev) n = 2; if (n === 2 && P.ch >= 3 && P.chOk >= 2) n = 3; if (n) ctx.star("pv", n, !!ev); }
  const steps = [P.phase > 0 || P.step > 0];

  /* ---- phase 0: four decisions, each one changes what you see ---- */
  const BUILD = [
    { cam: "cell", q: L("Photons from the Sun are raining on the test rig. Which material should the cell be made of so that light knocks electrons loose?", "Los fotones del Sol llueven sobre el montaje. ¿De qué material debe ser la célula para que la luz libere electrones?"), o: [
      { t: L("Silicon, a semiconductor", "Silicio, un semiconductor"), ok: true, why: L("Silicon absorbs photons. Each absorbed photon can give one electron enough energy to break free and move. Watch the blue electrons appear.", "El silicio absorbe fotones. Cada fotón absorbido puede dar a un electrón energía suficiente para liberarse y moverse. Mira cómo aparecen los electrones azules."), set: { mat: "si" } },
      { t: L("Copper, a metal conductor", "Cobre, un metal conductor"), why: L("Look at the rig: polished copper reflects most of the light straight back. It conducts well, but light does not free electrons in a useful way.", "Mira el montaje: el cobre pulido refleja casi toda la luz. Conduce bien, pero la luz no libera electrones de forma útil."), wrong: () => view({ mat: "cu" }) },
      { t: L("Glass, an insulator", "Vidrio, un aislante"), why: L("Look at the rig: the photons pass straight through the glass. Nothing absorbs their energy.", "Mira el montaje: los fotones atraviesan el vidrio. Nada absorbe su energía."), wrong: () => view({ mat: "glass" }) }] },
    { cam: "cell", q: L("Electrons are free, but they wander at random and quickly lose their energy as heat (the red puffs). What makes them all move the same way?", "Los electrones están libres, pero se mueven al azar y pierden rápido su energía en forma de calor (las nubes rojas). ¿Qué hace que todos se muevan en el mismo sentido?"), o: [
      { t: L("The built-in electric field where two different silicon layers meet", "El campo eléctrico interno donde se unen dos capas distintas de silicio"), ok: true, why: L("The junction between the two layers has a permanent electric field. It pushes every free electron towards the top contact. Watch them rise.", "La unión entre las dos capas tiene un campo eléctrico permanente. Empuja cada electrón libre hacia el contacto superior. Mira cómo suben."), set: { field: true } },
      { t: L("Heating the cell with a burner", "Calentar la célula con un mechero"), why: L("Heat makes the atoms shake more, so electrons lose their energy even faster. Solar cells need light, not heat.", "El calor hace vibrar más los átomos y los electrones pierden su energía aún más rápido. Las células solares necesitan luz, no calor.") },
      { t: L("Shaking the panel", "Agitar el panel"), why: L("A solar panel has no moving parts. Moving it does not direct the electrons.", "Un panel solar no tiene partes móviles. Moverlo no dirige los electrones.") }] },
    { cam: "rig", q: L("Electrons now pile up at the top contact and stop. What do they need so that a current flows?", "Los electrones se acumulan en el contacto superior y se detienen. ¿Qué necesitan para que circule una corriente?"), o: [
      { t: L("A complete external circuit from the top contact back to the bottom contact", "Un circuito externo completo desde el contacto superior hasta el inferior"), ok: true, why: L("Current only flows round a complete loop. The electrons travel through the wire, do work in the appliance, and return to the cell.", "La corriente solo circula por un circuito cerrado. Los electrones viajan por el cable, realizan trabajo en el aparato y vuelven a la célula."), set: { circuit: true } },
      { t: L("A stronger Sun", "Un Sol más intenso"), why: L("More light frees more electrons, but with nowhere to go they still pile up.", "Más luz libera más electrones, pero sin camino siguen acumulándose.") },
      { t: L("Nothing: electricity will jump through the air", "Nada: la electricidad saltará por el aire"), why: L("Air is an insulator at these low voltages. The electrons need a conducting path.", "El aire es aislante a estos voltajes tan bajos. Los electrones necesitan un camino conductor.") }] },
    { cam: "load", q: L("The cell produces direct current (DC): it flows one way only. The house appliances need alternating current (AC). What do you add?", "La célula produce corriente continua (CC): circula en un solo sentido. Los aparatos de la casa necesitan corriente alterna (CA). ¿Qué añades?"), o: [
      { t: L("An inverter", "Un inversor"), ok: true, why: L("An inverter converts DC into AC. The house lights come on. That is the whole photovoltaic chain: radiant energy to electrical energy, with no moving parts.", "Un inversor convierte la CC en CA. Se encienden las luces de la casa. Esa es toda la cadena fotovoltaica: energía radiante a energía eléctrica, sin partes móviles."), set: { inv: true } },
      { t: L("A second solar panel", "Un segundo panel solar"), why: L("That gives more DC, but it is still DC.", "Eso da más CC, pero sigue siendo CC.") },
      { t: L("A steam turbine", "Una turbina de vapor"), why: L("Turbines belong in thermal power stations. A photovoltaic system has no moving parts.", "Las turbinas son propias de las centrales térmicas. Un sistema fotovoltaico no tiene partes móviles.") }] },
  ];
  function renderBuild() {
    const b = BUILD[P.step]; cam(b.cam);
    panel.innerHTML = head(L("Make sunlight into electricity", "Convierte la luz solar en electricidad"), L(`Decision <b>${P.step + 1} of 4</b>. Choose, then watch what happens on the rig.`, `Decisión <b>${P.step + 1} de 4</b>. Elige y observa qué ocurre en el montaje.`)) + `<div class="sf-ask"></div><div class="sf-row"><button type="button" class="sf-btn sf-next" hidden>${L("Next", "Siguiente")}</button></div>`;
    const nx = panel.querySelector(".sf-next");
    ask(panel.querySelector(".sf-ask"), b.q, b.o, (first, o) => { view(Object.assign({ mat: "si" }, o.set)); ctx.gain(first ? 25 : 12, panel.querySelector(".sf-h")); st && st.burst(new T.Vector3(0, 1.8, 0), 0x58e8ff, 24, 2); nx.hidden = false; nx.focus(); });
    nx.addEventListener("click", () => { P.step++; if (P.step >= 4) { P.phase = 1; ctx.award("sf-pv", L("Photon Wrangler", "Domador de fotones")); stars(); } save(); render(); });
  }

  /* ---- phase 1: test bench ---- */
  const GOALS = () => [["light", L("Same temperature, 3 different sunlight levels", "Misma temperatura, 3 niveles de luz distintos")], ["temp", L("Same sunlight, 3 different cell temperatures", "Misma luz, 3 temperaturas distintas")], ["night", L("One measurement with no sunlight at all", "Una medición sin nada de luz solar")]];
  function goals() {
    const by = (k, v) => { const m = {}; P.runs.forEach(x => { (m[x[k]] = m[x[k]] || new Set()).add(x[v]); }); return m; };
    const a = by("temp", "sun"), b = by("sun", "temp");
    P.goals.light = Object.values(a).some(s => s.size >= 3); P.goals.temp = Object.keys(b).some(k => +k > 0 && b[k].size >= 3); P.goals.night = P.runs.some(x => x.sun === 0);
  }
  const ledger = (sun, m) => sun ? `<div class="sf-ledger" role="img" aria-label="${esc(L("Energy ledger", "Balance de energía"))}"><i class="e" style="flex:${m.elec}"></i><i class="h" style="flex:${m.heat}"></i><i class="r" style="flex:${m.refl}"></i></div>` : `<div class="sf-ledger"><i class="z" style="flex:1"></i></div>`;
  const runRow = x => { const m = pvModel(x.sun, x.temp); return `<div class="sf-run"><b>${L("Test", "Prueba")} ${x.n}: ${x.sun} W · ${x.temp} °C → ${m.elec} W</b><span>${L("heat", "calor")} ${m.heat} W · ${L("reflected", "reflejado")} ${m.refl} W · ${pct(m.eff)} %</span>${ledger(x.sun, m)}</div>`; };
  function logRun(sun, temp, tag) {
    const m = pvModel(sun, temp), n = ++P.n; P.runs.push({ n, sun, temp });
    ctx.log({ lab: L("PV cell", "Célula FV"), run: (tag ? tag + " " : "") + L(`Test ${n}`, `Prueba ${n}`), setup: L(`Sunlight ${sun} W on 1 m2; cell at ${temp} °C`, `Luz solar ${sun} W sobre 1 m2; célula a ${temp} °C`), outcome: L(`${m.elec} W electricity; ${m.heat} W heat; ${m.refl} W reflected`, `${m.elec} W electricidad; ${m.heat} W calor; ${m.refl} W reflejado`), count: L(`${pct(m.eff)} % efficient`, `${pct(m.eff)} % de eficiencia`) });
    goals(); stars(); save(); return m;
  }
  function renderBench(note) {
    cam("rig");
    panel.innerHTML = head(L("Measure the panel", "Mide el panel"), L("Set the sunlight (drag a cloud across the Sun) and the cell temperature, then log the reading. <b>Change one thing at a time</b> so each test is fair.", "Ajusta la luz solar (arrastra una nube sobre el Sol) y la temperatura de la célula, y registra la lectura. <b>Cambia una sola cosa cada vez</b> para que cada prueba sea justa.")) +
      `<label class="sf-range">${L("Sunlight reaching the panel", "Luz solar que llega al panel")}: <b class="v-sun"></b><input type="range" class="r-sun" min="0" max="1000" step="100" value="${P.sun}"></label>
       <label class="sf-range">${L("Cell temperature", "Temperatura de la célula")}: <b class="v-temp"></b><input type="range" class="r-temp" min="-10" max="70" step="5" value="${P.temp}"></label>
       <div class="sf-meter"><div><small>${L("Electricity", "Electricidad")}</small><b class="m-e"></b></div><div><small>${L("Heat", "Calor")}</small><b class="m-h"></b></div><div><small>${L("Reflected", "Reflejado")}</small><b class="m-r"></b></div><div><small>${L("Efficiency", "Eficiencia")}</small><b class="m-f"></b></div></div>
       <div class="live-ledger"></div><p class="sf-hint m-sum"></p>
       <div class="sf-row"><button type="button" class="sf-btn sf-log">${L("Log this measurement", "Registrar esta medición")}</button><button type="button" class="sf-btn sf-btn--ghost sf-next" ${P.goals.light && P.goals.temp ? "" : "hidden"}>${L("Go to Field calls", "Ir a Casos reales")}</button></div>
       <div class="sf-fb ${note ? note[0] : ""}" role="status">${note ? note[1] : ""}</div>${goalsHTML(GOALS(), P.goals)}
       <div class="sf-log-list">${P.runs.slice(-5).reverse().map(runRow).join("")}</div>`;
    const $ = s => panel.querySelector(s);
    const paint = () => {
      const m = pvModel(P.sun, P.temp); view({ sun: P.sun, temp: P.temp });
      $(".v-sun").textContent = `${P.sun} W`; $(".v-temp").textContent = `${P.temp} °C`; $(".m-e").textContent = `${m.elec} W`; $(".m-h").textContent = `${m.heat} W`; $(".m-r").textContent = `${m.refl} W`; $(".m-f").textContent = `${pct(m.eff)} %`;
      $(".live-ledger").innerHTML = ledger(P.sun, m); $(".m-sum").textContent = L(`Energy ledger: ${P.sun} W in = ${m.elec} + ${m.heat} + ${m.refl} W out. Nothing is lost.`, `Balance de energía: entran ${P.sun} W = salen ${m.elec} + ${m.heat} + ${m.refl} W. No se pierde nada.`);
    };
    $(".r-sun").addEventListener("input", e => { P.sun = +e.target.value; paint(); }); $(".r-temp").addEventListener("input", e => { P.temp = +e.target.value; paint(); });
    $(".sf-log").addEventListener("click", e => {
      if (P.runs.some(x => x.sun === P.sun && x.temp === P.temp)) { shake(e.currentTarget); sfx("bad"); const f = $(".sf-fb"); f.className = "sf-fb bad"; f.textContent = L("You already logged exactly this setup. Change the sunlight or the temperature first.", "Ya registraste exactamente este montaje. Cambia antes la luz o la temperatura."); return; }
      const before = Object.assign({}, P.goals), m = logRun(P.sun, P.temp); sfx("coin"); st && st.burst(new T.Vector3(3.6, 1.6, 0), 0xffd166, 20, 1.8);
      const got = ["light", "temp", "night"].filter(k => P.goals[k] && !before[k]); ctx.gain(8 + got.length * 20, e.currentTarget);
      const msg = P.sun === 0 ? L("No light, no electricity: 0 W, however warm the cell is.", "Sin luz no hay electricidad: 0 W, por muy caliente que esté la célula.") : L(`Logged: ${m.elec} W of electricity from ${P.sun} W of sunlight.`, `Registrado: ${m.elec} W de electricidad a partir de ${P.sun} W de luz solar.`);
      renderBench(["good", "✔ " + msg + (got.length ? " <b>" + L("Goal complete!", "¡Objetivo cumplido!") + "</b>" : "")]);
    });
    $(".sf-next").addEventListener("click", () => { P.phase = 2; save(); render(); });
    paint();
  }

  /* ---- phase 2: decide first, then the rig tests it ---- */
  const CALLS = [
    { q: L("Two identical panels get the same bright sunlight (1000 W). Panel A is on an alpine hut, with its cells at 0 °C. Panel B is on a desert roof, with its cells at 65 °C. Which gives more electricity?", "Dos paneles idénticos reciben la misma luz intensa (1000 W). El panel A está en un refugio alpino, con sus células a 0 °C. El panel B está en un tejado del desierto, con sus células a 65 °C. ¿Cuál da más electricidad?"), tests: [[1000, 0, "A"], [1000, 65, "B"]],
      o: [{ t: L("Panel A, the cold one", "El panel A, el frío"), ok: true }, { t: L("Panel B, the hot one", "El panel B, el caliente") }, { t: L("Exactly the same", "Exactamente lo mismo") }],
      why: r => L(`Tested on the rig: A gave ${r[0].elec} W, B gave ${r[1].elec} W. Solar cells need light, not heat: high temperatures reduce the efficiency of silicon.`, `Probado en el montaje: A dio ${r[0].elec} W y B dio ${r[1].elec} W. Las células solares necesitan luz, no calor: las temperaturas altas reducen la eficiencia del silicio.`) },
    { q: L("A cloud halves the sunlight on a panel from 1000 W to 500 W. The cell temperature stays at 25 °C. The electrical power will be...", "Una nube reduce a la mitad la luz sobre un panel, de 1000 W a 500 W. La temperatura de la célula sigue a 25 °C. La potencia eléctrica será..."), tests: [[1000, 25, ""], [500, 25, ""]],
      o: [{ t: L("About half", "Aproximadamente la mitad"), ok: true }, { t: L("Unchanged", "La misma") }, { t: L("Zero", "Cero") }],
      why: r => L(`Tested: ${r[0].elec} W, then ${r[1].elec} W. Half the photons arrive, so about half the electrons are freed.`, `Probado: ${r[0].elec} W y después ${r[1].elec} W. Llega la mitad de fotones, así que se libera aproximadamente la mitad de electrones.`) },
    { q: L("In full sun the panel receives 1000 W but delivers only about 220 W of electricity. What happened to the other 780 W?", "A pleno sol el panel recibe 1000 W pero solo entrega unos 220 W de electricidad. ¿Qué ha pasado con los otros 780 W?"), tests: [],
      o: [{ t: L("It was transferred as heat, and a little light was reflected", "Se transfirió como calor, y un poco de luz se reflejó"), ok: true }, { t: L("It was destroyed inside the silicon", "Se destruyó dentro del silicio") }, { t: L("It turned into extra mass in the panel", "Se convirtió en masa extra en el panel") }],
      why: () => L("First Law of Thermodynamics: energy cannot be created or destroyed. Your ledger always balances: electricity + heat + reflected light = sunlight in.", "Primera Ley de la Termodinámica: la energía no se crea ni se destruye. Tu balance siempre cuadra: electricidad + calor + luz reflejada = luz solar que entra.") },
  ];
  function renderCalls() {
    if (P.ch >= CALLS.length) {
      panel.innerHTML = head(L("Photon Lab complete", "Laboratorio de fotones completado"), L(`You got <b>${P.chOk} of ${CALLS.length}</b> field calls right first time. Your measurements are in the Investigation Record. Keep testing on the bench, or move to Station 2.`, `Acertaste <b>${P.chOk} de ${CALLS.length}</b> casos a la primera. Tus mediciones están en el Registro de la investigación. Sigue probando en el banco o pasa a la Estación 2.`)) + `<div class="sf-row"><button type="button" class="sf-btn sf-btn--ghost sf-back">${L("Back to the test bench", "Volver al banco de pruebas")}</button></div><div class="sf-log-list">${P.runs.slice(-4).reverse().map(runRow).join("")}</div>`;
      panel.querySelector(".sf-back").addEventListener("click", () => { P.phase = 1; save(); render(); }); return;
    }
    const c = CALLS[P.ch]; cam("rig");
    panel.innerHTML = head(L("Field calls", "Casos reales"), L(`Call <b>${P.ch + 1} of ${CALLS.length}</b>. Decide first. The rig then runs the real test and logs it.`, `Caso <b>${P.ch + 1} de ${CALLS.length}</b>. Decide primero. Después el montaje hace la prueba real y la registra.`)) + `<div class="sf-ask"></div><div class="sf-row"><button type="button" class="sf-btn sf-next" hidden>${L("Next", "Siguiente")}</button></div>`;
    const res = () => c.tests.map(t => pvModel(t[0], t[1])), nx = panel.querySelector(".sf-next");
    const opts = c.o.map(o => Object.assign({}, o, { why: o.ok ? c.why(res()) : L("Not this one. Think about what the panel actually absorbs, then try again.", "Esta no. Piensa en qué absorbe realmente el panel e inténtalo otra vez.") }));
    ask(panel.querySelector(".sf-ask"), c.q, opts, first => {
      c.tests.forEach(t => { if (!P.runs.some(x => x.sun === t[0] && x.temp === t[1])) logRun(t[0], t[1], t[2] ? L("Panel", "Panel") + " " + t[2] + ":" : ""); });
      if (c.tests.length) { const t = c.tests[c.tests.length - 1]; view({ sun: t[0], temp: t[1] }); P.sun = t[0]; P.temp = t[1]; }
      if (first) P.chOk++; P.ch++; ctx.gain(first ? 30 : 12, panel.querySelector(".sf-h")); stars(); save(); nx.hidden = false; nx.focus();
    });
    nx.addEventListener("click", render);
  }
  function render() { [renderBuild, renderBench, renderCalls][P.phase](); }
  goals(); render();
  return { dispose() { st && st.dispose(); } };
}
