/* Solar Forge — Station 3: Power Tower (concentrated solar power, the Second Law, molten-salt storage).
   60 heliostats in 5 rings, a receiver, salt tanks, a steam turbine and a town. All numbers come from
   the small model functions below; the scene only reads state. The 24-hour run uses setInterval. */
import { L, T, C, clamp, lerp, rng, shell, ask, track, goalsHTML, mesh, std, glassMat, steelTex, noiseTex, desert, liveSky, sunDisc, glowSprite, sfx, burstAt, shake, reduced, img, creditLine, esc } from "./kit.js?v=3";

const RINGS = [8, 10, 12, 14, 16], RAD = [6, 8.5, 11, 13.5, 16], NEED = 565, COLD = 35, TOWN = 15;
export const recvT = n => Math.round(25 + n * 9.5);
export function chain(n) {
  const rad = 4 * n, th = rad * .6, hot = recvT(n), carnot = 1 - (COLD + 273) / (hot + 273), eff = hot >= 250 ? .62 * carnot : 0, mech = th * eff, el = mech * .97;
  return { rad, th, hot, carnot, eff, mech, el };
}
/* 24 h from 07:06: receiver heat follows the Sun; the town needs TOWN MW all day and all night. */
export function dayRun(storage, releaseAt) {
  const c = chain(60), need = TOWN / (c.eff * .97), out = []; let tank = 0, on = 0, peak = 0, wasted = 0;
  for (let i = 0; i < 240; i++) {
    const t = (7.1 + i * .1) % 24, s = t >= 6 && t <= 18 ? Math.max(0, Math.sin(Math.PI * (t - 6) / 12)) : 0, th = c.th * s; let pw = false;
    if (th >= need) { pw = true; const sur = (th - need) * .1; if (storage) tank = Math.min(700, tank + sur); else wasted += sur; }
    else if (storage && i >= releaseAt && tank >= (need - th) * .1) { tank -= (need - th) * .1; pw = true; }
    if (pw) on++; peak = Math.max(peak, tank); out.push({ t, s, th, tank, pw });
  }
  return { out, hours: Math.round(on / 10), peak: Math.round(peak), wasted: Math.round(wasted), need };
}
const f1 = v => v.toFixed(1), pc = v => Math.round(v * 100);

export function mountCSP(host, ctx) {
  const sim = ctx.sim;
  const S = sim.state.csp = sim.state.csp || { phase: 0, lab: {}, rings: [0, 0, 0, 0, 0], runs: [], chains: [], asks: {}, n: 0, nights: [], goals: {}, storage: 0 };
  const save = () => sim.saveState();
  const CAMS = {
    field: { label: L("Mirror field", "Campo de espejos"), theta: -.6, phi: 1.24, dist: 34, target: [3, 4.2, 0] },
    recv: { label: L("Receiver", "Receptor"), theta: -.9, phi: 1.25, dist: 13, target: [0, 8.4, 0] },
    block: { label: L("Tanks and turbine", "Tanques y turbina"), theta: .25, phi: 1.2, dist: 13, target: [7.5, 1.4, 0] },
    town: { label: L("Town", "Pueblo"), theta: .9, phi: 1.2, dist: 17, target: [22, 1, 2] },
  };
  const { st, panel, over } = shell(host, CAMS, { limits: { minDist: 6, maxDist: 60, minPhi: .4, maxPhi: 1.5 }, shadowRange: 26, sunPos: [-8, 24, 8], swayAmp: .05, fov: 42 });
  const V = { hour: 12, valve: false, power: 0, tank: 0, lit: true };
  const nMir = () => S.rings.reduce((a, on, i) => a + (on ? RINGS[i] : 0), 0);
  let timer = 0, running = false; const stop = () => { clearInterval(timer); timer = 0; running = false; };

  /* ------------------------------------------------------------ 3D scene */
  if (st) {
    const sky = liveSky(st, { fog: 0xe8d9c0, fogNear: 60, fogFar: 230, sunMax: 2.5 }), sunS = sunDisc(st, 22); desert(st);
    const steel = new T.MeshStandardMaterial({ map: steelTex(), color: C(0xd8dee3), roughness: .3, metalness: .9 }), conc = std(0xcfc8bb, .9, 0, { map: noiseTex("#cfc8bb", .08, 1200, [2, 4], 256, 9) });
    /* tower + receiver */
    st.scene.add(mesh(new T.CylinderGeometry(.75, 1.25, 8, 20), conc, 0, 4, 0));
    const recM = new T.MeshStandardMaterial({ color: C(0x1c1c20), roughness: .6, emissive: C(0xff5a1a), emissiveIntensity: 0 });
    const rec = mesh(new T.CylinderGeometry(.85, .85, 1.3, 24), recM, 0, 8.65, 0); st.scene.add(rec); st.scene.add(mesh(new T.CylinderGeometry(.95, .95, .12, 24), steel, 0, 9.36, 0));
    const halo = glowSprite(0xffd27a, 1); halo.position.set(0, 8.65, 0); halo.material.fog = false; st.scene.add(halo);
    /* heliostats */
    const mirM = new T.MeshStandardMaterial({ color: C(0x9cc4f0), roughness: .05, metalness: 1, envMapIntensity: 1.9 }), backM = std(0x5d6770, .6, .4), mirrors = [], r = rng(12);
    RINGS.forEach((cnt, ri) => { for (let j = 0; j < cnt; j++) {
      const a = .62 + (j + .5) / cnt * (6.283 - 1.24), p = new T.Vector3(Math.cos(a) * RAD[ri], 1.05, Math.sin(a) * RAD[ri]);
      st.scene.add(mesh(new T.CylinderGeometry(.05, .07, 1.05, 8), backM, p.x, .52, p.z));
      const g = new T.Group(); g.position.copy(p); g.up.set(0, 0, 1); g.add(mesh(new T.BoxGeometry(1.5, 1.05, .04), mirM, 0, 0, .03), mesh(new T.BoxGeometry(1.52, 1.07, .04), backM, 0, 0, -.01)); st.scene.add(g);
      st.pickable(g, () => toggleRing(ri)); mirrors.push({ ri, p, g, q: new T.Quaternion() });
    } });
    const beamGeo = new T.BufferGeometry(); beamGeo.setAttribute("position", new T.BufferAttribute(new Float32Array(60 * 6), 3));
    const beams = new T.LineSegments(beamGeo, new T.LineBasicMaterial({ color: C(0xffe9a0), transparent: true, opacity: .5, depthWrite: false, blending: T.AdditiveBlending, fog: false })); beams.frustumCulled = false; st.scene.add(beams);
    /* salt tanks, pipes, turbine hall, cooling tower */
    const tank = (x, z, col) => { const g = new T.Group(); g.position.set(x, 0, z); g.add(mesh(new T.CylinderGeometry(1.25, 1.25, 2.1, 28), steel, 0, 1.05, 0)); const band = mesh(new T.CylinderGeometry(1.27, 1.27, .5, 28), new T.MeshStandardMaterial({ color: C(col), roughness: .5, emissive: C(col), emissiveIntensity: .1 }), 0, 1.2, 0, false); g.add(band); g.add(mesh(new T.SphereGeometry(1.25, 28, 10, 0, 6.283, 0, 1.2), steel, 0, 1.75, 0)); g.children[2].scale.y = .35; st.scene.add(g); return band; };
    const hotBand = tank(4.4, -1.9, 0xff5a2a); tank(4.4, 1.9, 0x3a8cff);
    const gaugeBg = mesh(new T.BoxGeometry(.3, 2.2, .1), std(0x1b222a, .6), 4.4, 1.3, -3.4, false), gauge = mesh(new T.BoxGeometry(.22, 2.1, .12), new T.MeshBasicMaterial({ color: C(0xff8a3d) }), 4.4, 1.3, -3.4, false); gauge.scale.y = .01; st.scene.add(gaugeBg, gauge);
    const pipe = (pts, col) => st.scene.add(mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p => new T.Vector3(...p))), 30, .09, 8), std(col, .4, .6)));
    pipe([[.9, .5, -.6], [2.4, .5, -1.6], [3.2, .9, -1.9]], 0xd4572a); pipe([[5.6, .9, -1.9], [6.4, .9, -1], [6.9, 1, -.2]], 0xd4572a); pipe([[6.9, .6, .4], [6.2, .6, 1.4], [5.6, .9, 1.9]], 0x3a78c8); pipe([[3.2, .9, 1.9], [2.2, .5, 1.5], [.9, .5, .6]], 0x3a78c8);
    const hall = new T.Group(); hall.position.set(8.6, 0, 0); hall.add(mesh(new T.BoxGeometry(3.8, .15, 2.6), conc, 0, .08, 0), mesh(new T.BoxGeometry(3.8, .15, 2.6), std(0x56606a, .5, .5), 0, 2.2, 0), mesh(new T.BoxGeometry(3.8, 2, .08), std(0x56606a, .5, .5), 0, 1.15, -1.26));
    [[-1.9, 0], [1.9, 0]].forEach(p => hall.add(mesh(new T.BoxGeometry(.08, 2, 2.6), glassMat(0xbfe6ff, .16), p[0], 1.15, p[1], false))); hall.add(mesh(new T.BoxGeometry(3.8, 2, .05), glassMat(0xbfe6ff, .14), 0, 1.15, 1.26, false));
    const rotor = new T.Group(); rotor.position.set(-.4, 1, 0); rotor.add(mesh(new T.CylinderGeometry(.09, .09, 2.6, 12).rotateZ(Math.PI / 2), steel));
    for (let i = 0; i < 5; i++) { const d = new T.Group(); d.position.x = -1 + i * .42; const rr = .34 + i * .07; for (let b = 0; b < 12; b++) { const bl = mesh(new T.BoxGeometry(.05, rr, .1), steel, 0, rr / 2, 0, false); const h = new T.Group(); h.rotation.x = b / 12 * 6.283; bl.rotation.y = .5; h.add(bl); d.add(h); } rotor.add(d); }
    hall.add(rotor); const gen = mesh(new T.CylinderGeometry(.5, .5, 1, 20).rotateZ(Math.PI / 2), std(0xc8742e, .35, .8), 1.25, 1, 0); hall.add(gen); st.scene.add(hall);
    const pts = []; for (let i = 0; i <= 10; i++) { const y = i / 10; pts.push(new T.Vector2(.75 + .5 * Math.pow(y * 2 - 1.1, 2), y * 3)); }
    const cool = mesh(new T.LatheGeometry(pts, 24), std(0xd9d4c8, .9, 0, { side: T.DoubleSide }), 9.4, 0, -4.2); st.scene.add(cool);
    const steam = Array.from({ length: 12 }, (_, i) => { const s = glowSprite(0xffffff, 2); s.material.blending = T.NormalBlending; s.material.opacity = 0; s.userData.t = i / 12; st.scene.add(s); return s; });
    /* pylons + town */
    const wireM = new T.LineBasicMaterial({ color: 0x20262c }), wp = [];
    [[12.5, 0], [16.5, .8], [20, 1.6]].forEach((p, i, arr) => { const g = new T.Group(); g.position.set(p[0], 0, p[1]); g.add(mesh(new T.CylinderGeometry(.06, .16, 3.6, 6), steel, 0, 1.8, 0), mesh(new T.BoxGeometry(.06, .06, 1.6), steel, 0, 3.3, 0), mesh(new T.BoxGeometry(.06, .06, 1.1), steel, 0, 2.8, 0)); st.scene.add(g); if (i) [-.75, .75].forEach(o => wp.push(arr[i - 1][0], 3.3, arr[i - 1][1] + o, p[0], 3.3, p[1] + o)); });
    wp.push(10.4, 1.8, 0, 12.5, 3.3, -.75, 10.4, 1.8, 0, 12.5, 3.3, .75); const wg = new T.BufferGeometry(); wg.setAttribute("position", new T.Float32BufferAttribute(wp, 3)); st.scene.add(new T.LineSegments(wg, wireM));
    const winM = std(0x1d242c, .3, 0, { emissive: C(0xffd27a), emissiveIntensity: 0 }), lampM = new T.MeshBasicMaterial({ color: C(0x3a3a34) }), townGlow = [];
    for (let i = 0; i < 11; i++) { const x = 21 + (i % 4) * 2.3 + r() * .6, z = -1 + Math.floor(i / 4) * 2.6 + r() * .5, h = 1 + r() * .8, g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = (r() - .5) * .5;
      g.add(mesh(new T.BoxGeometry(1.5, h, 1.3), std([0xead9c2, 0xd9b99a, 0xf1e7d8, 0xc9a98a][i % 4], .9), 0, h / 2, 0)); const rf = mesh(new T.ConeGeometry(1.2, .7, 4), std(0x8a4a3a, .8), 0, h + .35, 0); rf.rotation.y = Math.PI / 4; g.add(rf);
      [-.35, .35].forEach(o => { g.add(mesh(new T.BoxGeometry(.32, .34, .03), winM, o, h * .55, .66, false)); }); st.scene.add(g);
      if (i % 3 === 0) { st.scene.add(mesh(new T.CylinderGeometry(.03, .04, 1.9, 6), steel, x + 1, .95, z + 1.1)); const b = mesh(new T.SphereGeometry(.1, 10, 8), lampM, x + 1, 1.95, z + 1.1, false); st.scene.add(b); const gl = glowSprite(0xffd890, 2.4); gl.position.set(x + 1, 1.95, z + 1.1); gl.material.opacity = 0; st.scene.add(gl); townGlow.push(gl); } }
    const up = new T.Vector3(0, 1, 0), recP = new T.Vector3(0, 8.65, 0), sd = new T.Vector3(), tmp = new T.Vector3(), m4 = new T.Matrix4(), tq = new T.Quaternion(), BP = beamGeo.attributes.position, cA = C(0xff3a10), cB = C(0xfff0c0);
    st.onFrame.push((dt, t) => {
      const h = V.hour, day = h >= 6 && h <= 18, th = Math.PI * (h - 6) / 12, sunK = day ? Math.max(0, Math.sin(th)) : 0;
      if (day) sd.set(-Math.cos(th) * .85, Math.max(.02, Math.sin(th)), .32).normalize(); else sd.set(0, -1, 0);
      sunS.position.copy(sd).multiplyScalar(150); sunS.visible = day; st.sun.position.copy(day ? sd : up).multiplyScalar(40); sky(day ? clamp(sunK * 2.4, .06, 1) : .04);
      const n = nMir(), temp = 25 + (recvT(n) - 25) * Math.sqrt(sunK), k = clamp((temp - 80) / 520, 0, 1);
      recM.emissive.copy(cA).lerp(cB, k * k); recM.emissiveIntensity = k * 3.2; halo.scale.setScalar(.1 + k * 7); halo.material.opacity = .25 + k * .6;
      const snap = reduced() ? 1 : 1 - Math.exp(-dt * 3.5);
      mirrors.forEach((m, i) => {
        const on = S.rings[m.ri] && sunK > .03; if (on) tmp.copy(recP).sub(m.p).normalize().add(sd).normalize(); else tmp.set(0, 1, 0.0001).normalize();
        m4.lookAt(tmp, new T.Vector3(0, 0, 0), m.g.up); tq.setFromRotationMatrix(m4); m.g.quaternion.slerp(tq, snap);
        BP.setXYZ(i * 2, m.p.x, m.p.y, m.p.z); if (on) BP.setXYZ(i * 2 + 1, 0, 8.65, 0); else BP.setXYZ(i * 2 + 1, m.p.x, m.p.y, m.p.z);
      });
      BP.needsUpdate = true; beams.material.opacity = .12 + .34 * sunK;
      if (!reduced()) rotor.rotation.x += dt * V.power * 16;
      gauge.scale.y = Math.max(.01, V.tank); gauge.position.y = .25 + 1.05 * V.tank; hotBand.material.emissiveIntensity = .1 + V.tank * 1.2;
      steam.forEach(s => { s.userData.t = (s.userData.t + dt * .16) % 1; const u = s.userData.t; s.position.set(9.4 + Math.sin(u * 5 + t * .2) * .5 + u * 1.5, 3.2 + u * 5.5, -4.2); s.scale.setScalar(1.4 + u * 3.4); s.material.opacity = reduced() ? V.power * .3 : V.power * .55 * (1 - u); });
      const lit = V.lit ? 1 : 0, dark = 1 - clamp(sunK * 3, 0, 1); winM.emissiveIntensity = lerp(winM.emissiveIntensity, lit * (.25 + dark * 1.5), .15); lampM.color.copy(C(0x3a3a34)).lerp(C(0xfff0c0), lit * dark); townGlow.forEach(g => g.material.opacity = lit * dark * .8);
    });
  }
  const cam = k => st && st.flyTo(CAMS[k]);
  const hud = html => { if (over) over.innerHTML = html; };

  /* --------------------------------------------------------------- panel */
  const NAMES = [L("Label the plant", "Rotula la central"), L("Focus the field", "Enfoca el campo"), L("Energy chain", "Cadena de energía"), L("Night shift", "Turno de noche")];
  const head = (title, sub) => `${track(NAMES, S.phase)}<h3 class="sf-h">${title}</h3><p class="sf-sub">${sub}</p>`;
  function goals() {
    const g = S.goals; g.three = new Set(S.runs).size >= 3; g.hot = S.runs.some(n => recvT(n) >= NEED);
    g.chain2 = new Set(S.chains.filter(n => recvT(n) >= 250)).size >= 2; g.law = !!S.asks.law;
    g.nostore = S.nights.some(x => !x.s); g.store = S.nights.some(x => x.s && x.h >= 23);
  }
  function stars() { const g = S.goals; let n = S.phase > 1 && g.hot ? 1 : 0; if (n && g.chain2 && g.law) n = 2; if (n === 2 && g.nostore && g.store) n = 3; if (n) ctx.star("csp", n, S.runs.length >= 3); else if (S.runs.length >= 3) ctx.star("csp", 0, true); }
  const ringBtns = () => `<div class="sf-rings">${RINGS.map((c, i) => `<button type="button" class="sf-ring${S.rings[i] ? " is-on" : ""}" data-ring="${i}" aria-pressed="${!!S.rings[i]}"><b>${L("Ring", "Anillo")} ${i + 1}</b><span>${c} ${L("mirrors", "espejos")}</span></button>`).join("")}</div>`;
  function toggleRing(i) { if (running || S.phase === 0 || S.phase === 3) return; S.rings[i] = S.rings[i] ? 0 : 1; save(); sfx(S.rings[i] ? "pop" : "tick"); st && S.rings[i] && st.burst(new T.Vector3(0, 8.8, 0), 0xffb347, 14, 2.4, .2); render(); }
  const wireRings = () => panel.querySelectorAll("[data-ring]").forEach(b => b.addEventListener("click", () => toggleRing(+b.dataset.ring)));

  /* ---- phase 0: label a real photo ---- */
  const PINS = [{ id: "recv", x: .502, y: .262, n: () => L("Receiver", "Receptor"), why: () => L("The glowing top of the tower. All the reflected sunlight lands here.", "La parte brillante de lo alto de la torre. Toda la luz reflejada llega aquí.") },
    { id: "helio", x: .16, y: .55, n: () => L("Heliostats (mirrors)", "Heliostatos (espejos)"), why: () => L("More than 2,600 flat mirrors. Each one turns to follow the Sun.", "Más de 2600 espejos planos. Cada uno gira para seguir al Sol.") },
    { id: "block", x: .506, y: .51, n: () => L("Salt tanks and turbine", "Tanques de sal y turbina"), why: () => L("At the foot of the tower: hot molten-salt storage, the steam turbine and the generator.", "Al pie de la torre: el almacén de sales fundidas calientes, la turbina de vapor y el generador.") }];
  function renderLabel(sel, note) {
    cam("field"); V.hour = 12;
    const all = PINS.every(p => S.lab[p.id]);
    panel.innerHTML = head(L("A real power tower", "Una torre solar real"), L("This is a REAL photo: the Gemasolar plant near Seville, Spain. Choose a label, then tap the numbered part it belongs to.", "Esta es una foto REAL: la central Gemasolar, cerca de Sevilla (España). Elige un rótulo y toca la parte numerada a la que corresponde.")) +
      `<div class="sf-photo"><img src="${img("gemasolar")}" alt="${esc(L("Aerial photo of a solar power tower surrounded by rings of mirrors", "Foto aérea de una torre solar rodeada de anillos de espejos"))}">${PINS.map((p, i) => `<button type="button" class="sf-pin${S.lab[p.id] ? " ok" : ""}" data-pin="${p.id}" style="left:${p.x * 100}%;top:${p.y * 100}%" aria-label="${L("Part", "Parte")} ${i + 1}">${S.lab[p.id] ? "✓" : i + 1}</button>`).join("")}</div>
       <div class="sf-steps">${PINS.map(p => `<button type="button" class="sf-chip${sel === p.id ? " is-on" : ""}" data-lab="${p.id}" ${S.lab[p.id] ? "disabled" : ""}>${p.n()}</button>`).reverse().join("")}</div>
       <div class="sf-fb ${note ? note[0] : ""}" role="status">${note ? note[1] : L("Pick a label first.", "Elige primero un rótulo.")}</div>
       <div class="sf-row"><button type="button" class="sf-btn sf-next" ${all ? "" : "hidden"}>${L("Take control of the field", "Toma el control del campo")}</button></div><p class="sf-credit">${creditLine(["gemasolar"])}</p>`;
    panel.querySelectorAll("[data-lab]").forEach(b => b.addEventListener("click", () => { sfx("tick"); renderLabel(b.dataset.lab); }));
    panel.querySelectorAll("[data-pin]").forEach(b => b.addEventListener("click", () => {
      const p = PINS.find(x => x.id === b.dataset.pin); if (S.lab[p.id]) return;
      if (!sel) { shake(b); sfx("bad"); const f = panel.querySelector(".sf-fb"); f.className = "sf-fb bad"; f.textContent = L("Choose a label below first, then tap a part.", "Elige primero un rótulo abajo y después toca una parte."); return; }
      if (sel === p.id) { S.lab[p.id] = 1; save(); sfx("ok"); burstAt(b); ctx.gain(15, b); renderLabel(null, ["good", `✔ <b>${p.n()}.</b> ${p.why()}`]); }
      else { shake(b); b.classList.add("bad"); sfx("bad"); const f = panel.querySelector(".sf-fb"); f.className = "sf-fb bad"; f.textContent = L("That part is not the ", "Esa parte no es: ") + PINS.find(x => x.id === sel).n().toLowerCase() + L(". Look again and try another part.", ". Mira otra vez y prueba otra parte."); }
    }));
    panel.querySelector(".sf-next").addEventListener("click", () => { S.phase = 1; save(); render(); });
  }

  /* ---- phase 1: concentrate the light ---- */
  function renderFocus(note) {
    V.hour = 12; V.valve = false; V.power = 0; const n = nMir(), temp = recvT(n), okT = temp >= NEED;
    hud(`<span>${n}/60 ${L("mirrors", "espejos")}</span><span class="hot">${L("Receiver", "Receptor")} ${temp} °C</span>`);
    panel.innerHTML = head(L("Concentrate the sunlight", "Concentra la luz solar"), L(`Aim rings of mirrors at the receiver (use the buttons or tap a mirror). The molten salt must reach <b>${NEED} °C</b>. Record the temperature for at least three different numbers of mirrors.`, `Apunta anillos de espejos al receptor (usa los botones o toca un espejo). La sal fundida debe alcanzar <b>${NEED} °C</b>. Registra la temperatura con al menos tres cantidades distintas de espejos.`)) + ringBtns() +
      `<div class="sf-thermo"><div class="sf-thermo__bar"><i style="width:${clamp(temp / 620 * 100, 2, 100)}%"></i><u style="left:${NEED / 620 * 100}%"></u></div><div class="sf-thermo__n"><b>${temp} °C</b><span>${n} ${L("of 60 mirrors focused", "de 60 espejos enfocados")}</span></div></div>
       <div class="sf-row"><button type="button" class="sf-btn sf-log">${L("Record this reading", "Registrar esta lectura")}</button><button type="button" class="sf-btn sf-btn--ghost sf-next" ${S.goals.three && S.goals.hot ? "" : "hidden"}>${L("Next: make electricity", "Siguiente: genera electricidad")}</button></div>
       <div class="sf-fb ${note ? note[0] : ""}" role="status">${note ? note[1] : ""}</div>${goalsHTML([["three", L("Readings for 3 different numbers of mirrors", "Lecturas con 3 cantidades distintas de espejos")], ["hot", L(`A reading of ${NEED} °C or more`, `Una lectura de ${NEED} °C o más`)]], S.goals)}
       <div class="sf-log-list">${S.runs.slice(-5).reverse().map(m => `<div class="sf-run"><b>${m} ${L("mirrors", "espejos")} → ${recvT(m)} °C</b></div>`).join("")}</div><div class="sf-ask"></div>`;
    wireRings();
    panel.querySelector(".sf-log").addEventListener("click", e => {
      if (S.runs.includes(n)) { shake(e.currentTarget); sfx("bad"); const f = panel.querySelector(".sf-fb"); f.className = "sf-fb bad"; f.textContent = L("You already recorded this number of mirrors. Change the rings first.", "Ya registraste esta cantidad de espejos. Cambia antes los anillos."); return; }
      const before = Object.assign({}, S.goals); S.runs.push(n); const k = ++S.n;
      ctx.log({ lab: L("CSP tower", "Torre CSP"), run: L(`Focus ${k}`, `Enfoque ${k}`), setup: L(`${n} of 60 mirrors aimed at the receiver; midday Sun`, `${n} de 60 espejos apuntando al receptor; Sol de mediodía`), outcome: L(`Receiver at ${temp} °C`, `Receptor a ${temp} °C`), count: okT ? L(`hot enough (needs ${NEED} °C)`, `suficiente (necesita ${NEED} °C)`) : L(`too cool (needs ${NEED} °C)`, `insuficiente (necesita ${NEED} °C)`) });
      goals(); stars(); save(); sfx("coin"); const got = ["three", "hot"].filter(x => S.goals[x] && !before[x]).length; ctx.gain(8 + got * 20, e.currentTarget);
      renderFocus(["good", "✔ " + L(`Recorded: ${n} mirrors gave ${temp} °C.`, `Registrado: ${n} espejos dieron ${temp} °C.`) + (n === 0 ? " " + L("With no mirrors the receiver just sits at air temperature.", "Sin espejos el receptor se queda a la temperatura del aire.") : "")]);
    });
    panel.querySelector(".sf-next").addEventListener("click", () => { S.phase = 2; ctx.award("sf-csp", L("Heliostat Captain", "Capitán de heliostatos")); stars(); save(); render(); });
    if (S.goals.three && S.goals.hot && !S.asks.why) ask(panel.querySelector(".sf-ask"), L("Why does a power tower aim thousands of mirrors at one small receiver?", "¿Por qué una torre solar apunta miles de espejos a un receptor pequeño?"), [
      { t: L("To concentrate solar radiation and reach very high temperatures", "Para concentrar la radiación solar y alcanzar temperaturas muy altas"), ok: true, why: L("Yes. Your own readings show it: more mirrors, higher temperature.", "Sí. Tus propias lecturas lo muestran: más espejos, más temperatura.") },
      { t: L("Because mirrors turn light directly into electricity", "Porque los espejos convierten la luz directamente en electricidad"), why: L("Mirrors only reflect light. Here electricity is made later, by a turbine and a generator.", "Los espejos solo reflejan la luz. Aquí la electricidad se produce después, con una turbina y un generador.") },
      { t: L("To keep the tower cool", "Para mantener fría la torre"), why: L("The opposite: look at the receiver glowing.", "Al contrario: mira cómo brilla el receptor.") }], first => { S.asks.why = 1; save(); ctx.gain(first ? 20 : 8, panel.querySelector(".sf-h")); });
  }

  /* ---- phase 2: radiant -> thermal -> mechanical -> electrical ---- */
  function renderChain(note) {
    V.hour = 12; const n = nMir(), c = chain(n), run = V.valve && c.eff > 0; V.power = run ? c.el / 56 : 0; V.lit = run && c.el >= TOWN; V.tank = 0;
    hud(`<span class="hot">${c.hot} °C</span><span>${run ? f1(c.el) : "0.0"} MW</span>`);
    const bar = (name, v, max, cls, lost) => `<div class="sf-chain__row"><small>${name}</small><div class="sf-chain__bar"><i class="${cls}" style="width:${clamp(v / max * 100, 0, 100)}%"></i></div><b>${f1(v)} MW</b>${lost ? `<em>${lost}</em>` : ""}</div>`;
    const mech = run ? c.mech : 0, el = run ? c.el : 0;
    panel.innerHTML = head(L("Follow the energy", "Sigue la energía"), L("Open the steam valve. Hot salt boils water, steam spins the turbine, the turbine spins the generator. Record the chain at <b>two different receiver temperatures</b> and compare the turbine's efficiency.", "Abre la válvula de vapor. La sal caliente hierve agua, el vapor hace girar la turbina y la turbina mueve el generador. Registra la cadena con <b>dos temperaturas distintas del receptor</b> y compara la eficiencia de la turbina.")) + ringBtns() +
      `<div class="sf-row"><button type="button" class="sf-btn sf-valve" aria-pressed="${V.valve}">${V.valve ? L("Close steam valve", "Cerrar válvula de vapor") : L("Open steam valve", "Abrir válvula de vapor")}</button><span class="sf-hint">${c.eff > 0 ? "" : L("Below 250 °C the steam is too weak to drive the turbine.", "Por debajo de 250 °C el vapor es demasiado débil para mover la turbina.")}</span></div>
       <div class="sf-chain">${bar(L("Radiant (sunlight on mirrors)", "Radiante (luz en los espejos)"), c.rad, 240, "c1")}${bar(L("Thermal (heat in the salt)", "Térmica (calor en la sal)"), c.th, 240, "c2", L(`${f1(c.rad - c.th)} MW lost: reflection, glow of the hot receiver`, `${f1(c.rad - c.th)} MW perdidos: reflexión y radiación del receptor`))}${bar(L("Mechanical (spinning turbine)", "Mecánica (turbina girando)"), mech, 240, "c3", run ? L(`${f1(c.th - mech)} MW of heat passed on to the cooling tower`, `${f1(c.th - mech)} MW de calor cedidos a la torre de refrigeración`) : "")}${bar(L("Electrical (generator)", "Eléctrica (generador)"), el, 240, "c4")}</div>
       <p class="sf-hint">${L(`Turbine: hot side ${c.hot} °C, cold side ${COLD} °C. It converts <b>${pc(c.eff)} %</b> of the heat into work. Second Law limit at these temperatures: <b>${pc(c.carnot)} %</b>.`, `Turbina: lado caliente ${c.hot} °C, lado frío ${COLD} °C. Convierte el <b>${pc(c.eff)} %</b> del calor en trabajo. Límite de la Segunda Ley a estas temperaturas: <b>${pc(c.carnot)} %</b>.`)}</p>
       <div class="sf-row"><button type="button" class="sf-btn sf-log" ${run ? "" : "disabled"}>${L("Record this energy chain", "Registrar esta cadena")}</button><button type="button" class="sf-btn sf-btn--ghost sf-next" ${S.goals.chain2 && S.goals.law ? "" : "hidden"}>${L("Next: the night shift", "Siguiente: turno de noche")}</button></div>
       <div class="sf-fb ${note ? note[0] : ""}" role="status">${note ? note[1] : ""}</div>${goalsHTML([["chain2", L("Energy chain recorded at 2 different receiver temperatures", "Cadena registrada con 2 temperaturas distintas del receptor")], ["law", L("Answer the Second Law question", "Responde la pregunta de la Segunda Ley")]], S.goals)}
       <div class="sf-log-list">${S.chains.slice(-4).reverse().map(m => { const x = chain(m); return `<div class="sf-run"><b>${x.hot} °C → ${f1(x.el)} MW</b><span>${L("turbine", "turbina")} ${pc(x.eff)} % (${L("limit", "límite")} ${pc(x.carnot)} %)</span></div>`; }).join("")}</div><div class="sf-ask"></div>`;
    wireRings();
    panel.querySelector(".sf-valve").addEventListener("click", () => { V.valve = !V.valve; sfx(V.valve ? "zap" : "tick"); if (V.valve) cam("block"); renderChain(); });
    panel.querySelector(".sf-log").addEventListener("click", e => {
      if (S.chains.includes(n)) { shake(e.currentTarget); sfx("bad"); const f = panel.querySelector(".sf-fb"); f.className = "sf-fb bad"; f.textContent = L("You already recorded the chain at this temperature. Change the number of mirrors first.", "Ya registraste la cadena a esta temperatura. Cambia antes la cantidad de espejos."); return; }
      const before = S.goals.chain2; S.chains.push(n); const k = ++S.n;
      ctx.log({ lab: L("CSP tower", "Torre CSP"), run: L(`Chain ${k}`, `Cadena ${k}`), setup: L(`${n} mirrors; hot side ${c.hot} °C, cold side ${COLD} °C`, `${n} espejos; lado caliente ${c.hot} °C, lado frío ${COLD} °C`), outcome: L(`${f1(c.rad)} MW radiant > ${f1(c.th)} thermal > ${f1(c.mech)} mechanical > ${f1(c.el)} electrical`, `${f1(c.rad)} MW radiante > ${f1(c.th)} térmica > ${f1(c.mech)} mecánica > ${f1(c.el)} eléctrica`), count: L(`turbine ${pc(c.eff)} % (limit ${pc(c.carnot)} %)`, `turbina ${pc(c.eff)} % (límite ${pc(c.carnot)} %)`) });
      goals(); stars(); save(); sfx("coin"); ctx.gain(10 + (S.goals.chain2 && !before ? 25 : 0), e.currentTarget);
      renderChain(["good", "✔ " + L(`Recorded. At ${c.hot} °C the turbine turned ${pc(c.eff)} % of the heat into work.`, `Registrado. A ${c.hot} °C la turbina convirtió el ${pc(c.eff)} % del calor en trabajo.`)]);
    });
    panel.querySelector(".sf-next").addEventListener("click", () => { S.phase = 3; S.rings = [1, 1, 1, 1, 1]; save(); render(); });
    if (S.chains.length >= 1 && !S.asks.law) ask(panel.querySelector(".sf-ask"), L("Engineers build a perfect turbine with no friction at all. Could it turn ALL of the heat it receives into work?", "Unos ingenieros construyen una turbina perfecta, sin ningún rozamiento. ¿Podría convertir en trabajo TODO el calor que recibe?"), [
      { t: L("No. A heat engine must always pass some heat on to something colder", "No. Una máquina térmica siempre debe ceder parte del calor a algo más frío"), ok: true, why: L("Second Law of Thermodynamics. Heat flows from hot to cold, and an engine can only take work from that flow. The hotter the source, the bigger the share: that is why the plant concentrates sunlight.", "Segunda Ley de la Termodinámica. El calor fluye de lo caliente a lo frío y una máquina solo puede extraer trabajo de ese flujo. Cuanto más caliente la fuente, mayor la parte aprovechada: por eso la central concentra la luz solar.") },
      { t: L("Yes. With no friction nothing is wasted", "Sí. Sin rozamiento no se desperdicia nada"), why: L("Friction is not the main loss. Look at the cooling tower: that heat has to leave even in a perfect engine.", "El rozamiento no es la pérdida principal. Mira la torre de refrigeración: ese calor debe salir incluso en una máquina perfecta.") },
      { t: L("Yes, if enough mirrors are added", "Sí, si se añaden suficientes espejos"), why: L("More mirrors raise the temperature and the limit, but the limit never reaches 100 %.", "Más espejos suben la temperatura y el límite, pero el límite nunca llega al 100 %.") }], first => { S.asks.law = 1; goals(); stars(); save(); ctx.gain(first ? 30 : 12, panel.querySelector(".sf-h")); setTimeout(() => panel.isConnected && S.phase === 2 && renderChain(), 2600); });
  }

  /* ---- phase 3: power the town for 24 hours ---- */
  function renderNight(note) {
    S.rings = [1, 1, 1, 1, 1]; if (!running) { V.hour = 12; V.power = .27; V.lit = true; V.tank = 0; hud(""); }
    panel.innerHTML = head(L("Keep the town's lights on", "Mantén encendido el pueblo"), L(`The town needs <b>${TOWN} MW</b> all day and all night. At midday the receiver collects far more heat than that. Run 24 hours <b>without</b> storage, then <b>with</b> molten-salt storage, and compare.`, `El pueblo necesita <b>${TOWN} MW</b> día y noche. A mediodía el receptor capta mucho más calor del necesario. Simula 24 horas <b>sin</b> almacenamiento y después <b>con</b> almacenamiento de sales fundidas, y compara.`)) +
      `<div class="sf-steps"><button type="button" class="sf-chip${S.storage ? "" : " is-on"}" data-st="0">${L("No storage", "Sin almacenamiento")}</button><button type="button" class="sf-chip${S.storage ? " is-on" : ""}" data-st="1">${L("Molten-salt storage", "Almacén de sales fundidas")}</button></div>
       <div class="sf-meter"><div><small>${L("Clock", "Reloj")}</small><b class="n-clock">07:06</b></div><div><small>${L("Hot tank", "Tanque caliente")}</small><b class="n-tank">0 MWh</b></div><div><small>${L("Town", "Pueblo")}</small><b class="n-town">-</b></div><div><small>${L("Powered", "Con luz")}</small><b class="n-hrs">0 h</b></div></div>
       <div class="sf-prog"><i class="n-bar"></i></div>
       <div class="sf-row"><button type="button" class="sf-btn sf-btn--big sf-go">${L("Start the 24-hour run", "Empezar las 24 horas")}</button><button type="button" class="sf-btn sf-release" disabled>${L("Release the hot salt", "Liberar la sal caliente")}</button></div>
       <p class="sf-hint">${L("With storage: when the Sun gets low, press Release the hot salt so the stored heat keeps the turbine running.", "Con almacenamiento: cuando el Sol baje, pulsa Liberar la sal caliente para que el calor guardado mantenga la turbina en marcha.")}</p>
       <div class="sf-fb ${note ? note[0] : ""}" role="status">${note ? note[1] : ""}</div>${goalsHTML([["nostore", L("A 24-hour run with no storage", "Una simulación de 24 h sin almacenamiento")], ["store", L("A 24-hour run with storage that powers the town all 24 hours", "Una simulación con almacenamiento que dé luz las 24 horas")]], S.goals)}
       <div class="sf-log-list">${S.nights.slice(-4).reverse().map(x => `<div class="sf-run"><b>${x.s ? L("With storage", "Con almacenamiento") : L("No storage", "Sin almacenamiento")}: ${x.h}/24 h</b></div>`).join("")}</div>`;
    const $ = s => panel.querySelector(s), rel = $(".sf-release");
    panel.querySelectorAll("[data-st]").forEach(b => b.addEventListener("click", () => { if (running) return; S.storage = +b.dataset.st; save(); sfx("tick"); renderNight(); }));
    $(".sf-go").addEventListener("click", e => {
      if (running) return; running = true; e.currentTarget.disabled = true; panel.querySelectorAll("[data-st]").forEach(x => x.disabled = true); sfx("ok"); cam("field");
      const st0 = !!S.storage; let i = 0, releaseAt = st0 ? (reduced() ? 0 : 9999) : 9999, on = 0, tank = 0, peak = 0, wasted = 0; const need = dayRun(false, 0).need, c = chain(60);
      if (st0) { rel.disabled = false; rel.addEventListener("click", () => { if (releaseAt < 9999) return; releaseAt = i; rel.disabled = true; rel.textContent = L("Hot salt flowing", "Sal caliente circulando"); sfx("zap"); burstAt(rel, "#ff8a3d", 18); cam("block"); }); }
      const step = () => {
        const t = (7.1 + i * .1) % 24, s = t >= 6 && t <= 18 ? Math.max(0, Math.sin(Math.PI * (t - 6) / 12)) : 0, th = c.th * s; let pw = false;
        if (th >= need) { pw = true; const sur = (th - need) * .1; if (st0) tank = Math.min(700, tank + sur); else wasted += sur; }
        else if (st0 && i >= releaseAt && tank >= (need - th) * .1) { tank -= (need - th) * .1; pw = true; }
        if (pw) on++; peak = Math.max(peak, tank); V.hour = t; V.tank = tank / 700; V.lit = pw; V.power = pw ? .27 : 0; i++;
        if (st0 && releaseAt === 9999 && s < .45 && t > 12) rel.classList.add("pulse");
      };
      const paint = () => { const t = V.hour, hh = String(Math.floor(t)).padStart(2, "0") + ":" + String(Math.floor((t % 1) * 60)).padStart(2, "0"); $(".n-clock").textContent = hh; $(".n-tank").textContent = Math.round(tank) + " MWh"; $(".n-town").textContent = V.lit ? L("Lights on", "Con luz") : L("BLACKOUT", "APAGÓN"); $(".n-town").className = "n-town " + (V.lit ? "ok" : "no"); $(".n-hrs").textContent = Math.round(on / 10) + " h"; $(".n-bar").style.width = i / 240 * 100 + "%"; hud(`<span>${hh}</span><span class="${V.lit ? "" : "hot"}">${V.lit ? TOWN + " MW" : L("Blackout", "Apagón")}</span>${st0 ? `<span>${L("Tank", "Tanque")} ${Math.round(tank)} MWh</span>` : ""}`); };
      const finish = () => {
        stop(); const h = Math.round(on / 10), k = ++S.n, before = Object.assign({}, S.goals); S.nights.push({ s: st0 ? 1 : 0, h });
        ctx.log({ lab: L("CSP tower", "Torre CSP"), run: L(`24 h run ${k}`, `24 h n.º ${k}`), setup: st0 ? L("Molten-salt storage ON; town needs 15 MW day and night", "Almacén de sales fundidas ACTIVADO; el pueblo necesita 15 MW día y noche") : L("NO storage; town needs 15 MW day and night", "SIN almacenamiento; el pueblo necesita 15 MW día y noche"), outcome: L(`Town powered ${h} of 24 h`, `Pueblo con luz ${h} de 24 h`), count: st0 ? L(`tank peak ${Math.round(peak)} MWh of heat`, `máximo del tanque ${Math.round(peak)} MWh de calor`) : L(`${Math.round(wasted)} MWh of heat thrown away`, `${Math.round(wasted)} MWh de calor desperdiciados`) });
        goals(); stars(); save(); const got = ["nostore", "store"].filter(x => S.goals[x] && !before[x]).length; if (S.goals.store && S.goals.nostore && got) ctx.award("sf-night", L("Night Shift Hero", "Héroe del turno de noche"));
        sfx(h >= 23 ? "win" : "pop"); V.hour = 12; V.lit = true; V.power = .27;
        const msg = st0 ? (h >= 23 ? L(`<b>${h} of 24 hours powered.</b> The surplus midday heat was stored in molten salt (peak ${Math.round(peak)} MWh) and released after sunset. This is how a CSP plant generates electricity at night.`, `<b>${h} de 24 horas con luz.</b> El calor sobrante del mediodía se guardó en sales fundidas (máximo ${Math.round(peak)} MWh) y se liberó tras la puesta de sol. Así genera electricidad de noche una central CSP.`) : L(`<b>${h} of 24 hours powered.</b> The tank was full of heat, but it stayed shut for part of the night. Run it again and release the hot salt as the Sun gets low.`, `<b>${h} de 24 horas con luz.</b> El tanque estaba lleno de calor, pero estuvo cerrado parte de la noche. Repite y libera la sal caliente cuando baje el Sol.`)) : L(`<b>Only ${h} of 24 hours powered.</b> With nowhere to store it, ${Math.round(wasted)} MWh of surplus midday heat was thrown away, and the turbine stopped at sunset.`, `<b>Solo ${h} de 24 horas con luz.</b> Sin dónde guardarlo, se desperdiciaron ${Math.round(wasted)} MWh de calor sobrante del mediodía y la turbina se paró al atardecer.`);
        renderNight([h >= 23 ? "good" : "bad", msg]); ctx.gain(15 + got * 30, panel.querySelector(".sf-h"));
      };
      if (reduced()) { while (i < 240) step(); return finish(); }
      const t0 = Date.now(); timer = setInterval(() => { if (!panel.isConnected) return stop(); const want = Math.min(240, Math.floor((Date.now() - t0) / 50)); while (i < want) step(); paint(); if (i >= 240) finish(); }, 100);
    });
  }
  function render(note) { hud(""); [renderLabel, renderFocus, renderChain, renderNight][S.phase](S.phase === 0 ? null : note); }
  goals(); render();
  return { dispose() { stop(); st && st.dispose(); } };
}
