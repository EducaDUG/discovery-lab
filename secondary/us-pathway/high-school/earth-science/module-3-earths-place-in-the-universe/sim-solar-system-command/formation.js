/* Solar System Command - Orient 3D: "Rewind 4.6 billion years" - a nebula spins into a disk and accretes into planets. */
import { makeRenderer, TEX, starField, glow, sunMesh, orbitControls, fitRenderer, loop, reduced, webgl } from "./space3d.js?v=1";
import { PLANETS } from "./solar-data.js?v=1";
const THREE = window.THREE;
const el = (t, c, h) => { const e = document.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; };
const sm = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export function mountFormation(host, ctx) {
  const { L, sim, addXP } = ctx; const S = sim.state;
  const stage = el("div", "ssc-stage"); stage.style.minHeight = "300px"; const canvas = el("canvas"); canvas.setAttribute("aria-label", L("3D model of the solar nebula becoming the solar system. Drag to orbit.", "Modelo 3D de la nebulosa solar convirtiéndose en el sistema solar. Arrastra para orbitar.")); stage.append(canvas);
  const banner = el("div", "ssc-banner"); banner.setAttribute("aria-live", "polite"); stage.append(banner);
  const row = el("div", "ssc-ctl"); const g = el("div", "ssc-grow"); const lab = el("label", "field__label", L("Time machine", "Máquina del tiempo")); lab.htmlFor = "ssc-time";
  const sl = el("input"); sl.type = "range"; sl.id = "ssc-time"; sl.min = 0; sl.max = 100; sl.step = 1; sl.value = S.formT ?? 0; const out = el("span", "ssc-read"); out.style.minWidth = "13ch"; g.append(lab, sl, out); row.append(g);
  const play = el("button", "btn btn--signal", L("▶ Play 4.6 billion years", "▶ Reproducir 4.600 millones de años")); play.type = "button"; row.append(play);
  const note = el("div", "ssc-fb"); note.setAttribute("aria-live", "polite");
  host.append(stage, row, note);
  const gl = webgl(); if (!gl) stage.append(el("div", "ssc-nogl", L("3D view isn't available on this device. Use the slider to read each stage.", "La vista 3D no está disponible en este dispositivo. Usa el control deslizante para leer cada etapa.")));

  const STAGES = [
    [0, L("1. A cold cloud of gas and dust (the solar nebula)", "1. Una nube fría de gas y polvo (la nebulosa solar)"), L("A huge, slowly rotating cloud of gas and dust — the raw material. Something (like a nearby supernova) nudges it and gravity begins to pull it together.", "Una enorme nube de gas y polvo que gira despacio — la materia prima. Algo (como una supernova cercana) la empuja y la gravedad empieza a juntarla.")],
    [0.28, L("2. It spins faster and flattens into a disk", "2. Gira más rápido y se aplana en un disco"), L("As the cloud collapses it spins faster (like a skater pulling in their arms) and flattens into a rotating disk, with most mass piling up in the centre.", "Al colapsar, gira más rápido (como una patinadora que recoge los brazos) y se aplana en un disco giratorio, con la mayor parte de la masa acumulándose en el centro.")],
    [0.55, L("3. The Sun ignites — gravity and accretion build planets", "3. El Sol se enciende — la gravedad y la acreción forman planetas"), L("The centre gets hot and dense enough for nuclear fusion: the Sun ignites. In the disk, dust sticks together and gravity pulls clumps into larger and larger bodies (accretion).", "El centro se calienta y se densifica lo bastante para la fusión nuclear: el Sol se enciende. En el disco, el polvo se pega y la gravedad atrae grumos que forman cuerpos cada vez mayores (acreción).")],
    [0.88, L("4. Today: 4.6 billion years old — rocky planets inside, gas giants outside, belts of leftovers", "4. Hoy: 4.600 millones de años — planetas rocosos dentro, gigantes gaseosos fuera, cinturones de restos"), L("Inner (warm) planets could only keep rock and metal, so they are small and rocky. Outer (cold) planets gathered gas and ice and grew huge. Leftovers form the asteroid belt and the Kuiper Belt. Meteorites tell us this all happened about 4.6 billion years ago.", "Los planetas internos (cálidos) solo retuvieron roca y metal, y son pequeños y rocosos. Los externos (fríos) reunieron gas y hielo y crecieron enormes. Los restos forman el cinturón de asteroides y el cinturón de Kuiper. Los meteoritos nos dicen que todo esto ocurrió hace unos 4.600 millones de años.")]
  ];
  let T = (S.formT ?? 0) / 100, playing = false, seen = !!S.formSeen;
  const setT = (v, q) => { T = v; sl.value = Math.round(v * 100); const st = [...STAGES].reverse().find(s => T >= s[0]); banner.textContent = st[1]; note.innerHTML = `<b>${st[1]}</b><br>${st[2]}`; out.textContent = (T * 4.6).toFixed(1) + L(" billion yrs", " mil millones a."); S.formT = Math.round(v * 100); if (T >= 0.99 && !seen) { seen = true; S.formSeen = true; sim.mark("watched_formation", true); addXP(10, L("time traveller", "viajero del tiempo")); } if (!q) sim.saveState(); };
  sl.addEventListener("input", () => setT(Number(sl.value) / 100));
  play.addEventListener("click", () => { if (playing) return; playing = true; T = 0; const t0 = performance.now(), dur = reduced() ? 600 : 14000; const iv = setInterval(() => { const k = Math.min(1, (performance.now() - t0) / dur); setT(k, true); if (k >= 1 || !document.body.contains(stage)) { clearInterval(iv); playing = false; sim.saveState(); } }, 50); });
  setT(T, true);
  if (!gl) return;

  const renderer = makeRenderer(canvas), scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(45, 1, 0.1, 500); starField(scene);
  scene.add(new THREE.AmbientLight(0x303858, 0.5)); const light = new THREE.PointLight(0xfff0d0, 3.2, 0, 1.2); scene.add(light);
  const sun = sunMesh(1.0); sun.scale.setScalar(0.001); scene.add(sun);
  const bodies = PLANETS.map((p, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(p.size * 1.25, 32, 24), new THREE.MeshStandardMaterial({ map: p.type === "gas" ? TEX.bands([p.col, p.col2, p.col], 3 + i % 3, 4 + i, 0.3) : TEX.rock(p.col, p.col2, 6, 2 + i), roughness: 0.9 })); m.scale.setScalar(0.001); scene.add(m);
    if (p.id === "saturn") { const r = new THREE.Mesh(new THREE.RingGeometry(p.size * 1.6, p.size * 2.7, 64), new THREE.MeshBasicMaterial({ color: 0xe0cfa0, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })); r.rotation.x = Math.PI / 2.3; m.add(r); }
    return { p, m, ang: i * 0.9 + 0.3 };
  });
  const N = 3200, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), pd = [];
  for (let i = 0; i < N; i++) {
    const isPl = i % 4 < 3, k = (Math.random() * 8) | 0, belt = Math.random();
    let rho, kind = 0;
    if (isPl) { kind = 1; rho = PLANETS[k].a + (Math.random() - 0.5) * 1.6; }
    else if (belt < 0.4) { kind = 2; rho = 8.2 + Math.random() * 1.6; } // asteroid belt
    else if (belt < 0.7) { kind = 3; rho = 21 + Math.random() * 4; } // Kuiper belt
    else { kind = 0; rho = 2 + Math.random() * 20; }
    const u = Math.random() * 6.283, v = Math.acos(2 * Math.random() - 1), cr = 7 + Math.random() * 9;
    pd.push({ k, kind, rho, phi: Math.random() * 6.283, cx: cr * Math.sin(v) * Math.cos(u), cy: cr * Math.cos(v), cz: cr * Math.sin(v) * Math.sin(u), jit: Math.random() });
    const c = kind === 1 ? PLANETS[k].col : [210, 190, 160]; col[i * 3] = c[0] / 255; col[i * 3 + 1] = c[1] / 255; col[i * 3 + 2] = c[2] / 255;
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3)); geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const cloud = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.34, map: TEX.star(), vertexColors: true, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(cloud);
  const cam = orbitControls(canvas, camera, new THREE.Vector3(0, 0, 0), { th: 0.7, ph: 1.05, r: 30 }, { rmin: 8, rmax: 80 }); fitRenderer(renderer, camera, stage);
  let clock = 0;
  loop(stage, (dt, t) => {
    clock += dt; const s1 = sm(0.02, 0.32, T), s2 = sm(0.5, 0.9, T), sunS = sm(0.5, 0.6, T);
    for (let i = 0; i < N; i++) {
      const d = pd[i], om = 0.9 / Math.pow(Math.max(d.rho, 1.5), 1.4) * (0.2 + s1);
      const ang = d.phi + clock * om, dx = Math.cos(ang) * d.rho, dz = Math.sin(ang) * d.rho, dy = (d.jit - 0.5) * (0.5 + (1 - s1) * 3);
      let x = d.cx * (1 - s1) + dx * s1, y = d.cy * (1 - s1) + dy * s1, z = d.cz * (1 - s1) + dz * s1;
      if (d.kind === 1) { const b = bodies[d.k], tx = Math.cos(b.ang + clock * 0.9 / Math.pow(b.p.a, 1.4)) * b.p.a, tz = Math.sin(b.ang + clock * 0.9 / Math.pow(b.p.a, 1.4)) * b.p.a; const c = s2 * s2; x = x * (1 - c) + tx * c; z = z * (1 - c) + tz * c; y *= 1 - c; }
      pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z;
    }
    geo.attributes.position.needsUpdate = true; cloud.material.size = 0.34 - 0.12 * s2;
    sun.scale.setScalar(Math.max(0.001, sunS * 1.1)); sun.userData.surface.rotation.y += dt * 0.1; light.intensity = 3.2 * sunS + 0.01;
    bodies.forEach(b => { const a = b.ang + clock * 0.9 / Math.pow(b.p.a, 1.4); b.m.position.set(Math.cos(a) * b.p.a, 0, Math.sin(a) * b.p.a); b.m.scale.setScalar(Math.max(0.001, sm(0.78, 0.97, T))); b.m.rotation.y += dt * 0.6; });
    if (cam.auto && !reduced()) cam.th += dt * 0.07; cam.apply(); renderer.render(scene, camera);
  });
}
