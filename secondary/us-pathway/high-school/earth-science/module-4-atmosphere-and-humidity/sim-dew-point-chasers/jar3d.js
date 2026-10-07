/* ==========================================================================
   Dew Point Chasers — the Sealed Jar, as an orbitable 3D lab bench.

   Vendored Three.js r128 (global THREE). Everything the student can see is
   driven by one call, setState(): temperature, vapour, liquid. The jar is
   never still — vapour molecules and dry-air molecules jitter at a speed set
   by temperature, the thermometer glows, and when the air is over-full the
   extra water condenses as drifting mist, droplets sliding down the glass,
   and a puddle on the base.

   Off-axis landmarks (thermometer, kettle, heat lamp, ice pack) mean orbiting
   the camera is visibly rewarding, not just a spinning cylinder.
   ========================================================================== */

const R = 1.15, H = 2.3, Y0 = 0.15;          // jar radius, height, centre height

function glowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(.4, "rgba(255,255,255,.5)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
function dropletTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(26, 24, 2, 32, 34, 28);
  gr.addColorStop(0, "rgba(255,255,255,.95)"); gr.addColorStop(.25, "rgba(190,235,255,.55)"); gr.addColorStop(1, "rgba(120,200,240,.0)");
  g.fillStyle = gr; g.beginPath(); g.arc(32, 34, 26, 0, 7); g.fill();
  g.strokeStyle = "rgba(220,245,255,.8)"; g.lineWidth = 2; g.beginPath(); g.arc(32, 34, 22, 0, 7); g.stroke();
  return new THREE.CanvasTexture(c);
}
function noiseTexture(base, n, rep) {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d"); g.fillStyle = base; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < n; i++) {
    g.fillStyle = Math.random() < .5 ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.12)";
    g.fillRect(Math.random() * 128, Math.random() * 128, 1 + Math.random() * 3, 1 + Math.random() * 3);
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.encoding = THREE.sRGBEncoding; return t;
}

export function mountJar3D(stageEl, opts = {}) {
  if (typeof THREE === "undefined") return null;
  const reduced = () => document.documentElement.getAttribute("data-reduced-motion") === "on";
  let renderer;
  const canvas = document.createElement("canvas");
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  } catch (e) { return null; }
  stageEl.prepend(canvas);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07202b);
  scene.fog = new THREE.Fog(0x07202b, 9, 22);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 60);
  const glow = glowTexture(), drop = dropletTexture();

  /* ---- lights ---- */
  scene.add(new THREE.HemisphereLight(0xcdefff, 0x0a1f2b, 0.8));
  const key = new THREE.DirectionalLight(0xfff0d8, 1.1);
  key.position.set(4, 6, 3); key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 });
  scene.add(key);
  const rim = new THREE.PointLight(0x5fe0ff, 0.7, 16); rim.position.set(-3.5, 2, -3); scene.add(rim);

  /* ---- bench ---- */
  const bench = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.4, 0.3, 64),
    new THREE.MeshStandardMaterial({ map: noiseTexture("#0e3d52", 2600, 5), roughness: 0.82 }));
  bench.position.y = -1.15 - 0.15; bench.receiveShadow = true; scene.add(bench);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(5.15, 0.04, 8, 96), new THREE.MeshBasicMaterial({ color: 0x27d3ff, transparent: true, opacity: 0.55 }));
  ring.rotation.x = Math.PI / 2; ring.position.y = -1.0; scene.add(ring);
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.08, 48), new THREE.MeshStandardMaterial({ color: 0x9fb4bd, metalness: 0.7, roughness: 0.3 }));
  plate.position.y = -1.0; plate.receiveShadow = true; scene.add(plate);

  /* ---- the jar ---- */
  const jar = new THREE.Group(); jar.position.y = Y0; scene.add(jar);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: 0xe6f7ff, transparent: true, opacity: 0.16, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide, depthWrite: false });
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 56, 1, true), glassMat); jar.add(glass);
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.06, R + 0.06, 0.16, 48), new THREE.MeshStandardMaterial({ color: 0xc7d3da, metalness: 0.8, roughness: 0.25 }));
  lid.position.y = H / 2 + 0.08; lid.castShadow = true; jar.add(lid);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.14, 20, 16), new THREE.MeshStandardMaterial({ color: 0xff7a59, roughness: 0.4 }));
  knob.position.y = H / 2 + 0.24; jar.add(knob);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.04, R + 0.04, 0.12, 48), new THREE.MeshStandardMaterial({ color: 0x2b3a44, roughness: 0.5, metalness: 0.4 }));
  base.position.y = -H / 2 - 0.06; jar.add(base);
  // puddle of condensed water on the base
  const puddle = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.03, R - 0.03, 0.2, 40),
    new THREE.MeshPhysicalMaterial({ color: 0x4cc3ff, transparent: true, opacity: 0.7, roughness: 0.05, clearcoat: 1 }));
  puddle.position.y = -H / 2 + 0.02; puddle.scale.y = 0.001; jar.add(puddle);

  /* ---- particles inside ---- */
  function particleSet(n, size, color, map, opacity, blending) {
    const pos = new Float32Array(n * 3), vel = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) place(pos, i);
    for (let i = 0; i < n * 3; i++) vel[i] = (Math.random() - 0.5);
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const m = new THREE.PointsMaterial({ size, color, map, transparent: true, opacity, depthWrite: false, blending: blending || THREE.NormalBlending, sizeAttenuation: true });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; jar.add(pts);
    return { pts, g, pos, vel, n, m };
  }
  function place(pos, i) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * (R - 0.1);
    pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = (Math.random() - 0.5) * (H - 0.2); pos[i * 3 + 2] = Math.sin(a) * r;
  }
  const NV = 120, NA = 70, NM = 46, ND = 80;
  const air = particleSet(NA, 0.16, 0x9aa8b3, glow, 0.55);
  const vap = particleSet(NV, 0.45, 0x5fe0ff, glow, 1, THREE.AdditiveBlending);
  const mist = particleSet(NM, 0.85, 0xf2fbff, glow, 0.0);
  // droplets cling to the inside of the glass and slide down
  const dropPos = new Float32Array(ND * 3), dropAng = new Float32Array(ND), dropSpd = new Float32Array(ND);
  for (let i = 0; i < ND; i++) { dropAng[i] = Math.random() * Math.PI * 2; dropSpd[i] = 0.05 + Math.random() * 0.2; dropPos[i * 3 + 1] = (Math.random() - 0.5) * (H - 0.3); }
  const dropGeo = new THREE.BufferGeometry(); dropGeo.setAttribute("position", new THREE.BufferAttribute(dropPos, 3));
  const dropMat = new THREE.PointsMaterial({ size: 0.24, map: drop, transparent: true, opacity: 1, depthWrite: false });
  const drops = new THREE.Points(dropGeo, dropMat); drops.frustumCulled = false; jar.add(drops);

  /* ---- thermometer (off-axis landmark) ---- */
  const thermo = new THREE.Group(); thermo.position.set(2.7, 0, 0.4); scene.add(thermo);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.6, 16), new THREE.MeshPhysicalMaterial({ color: 0xeaf6ff, transparent: true, opacity: 0.4, roughness: 0.05, clearcoat: 1 }));
  tube.position.y = 0.3; tube.castShadow = true; thermo.add(tube);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 20, 16), new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff2222, emissiveIntensity: 0.6, roughness: 0.3 }));
  bulb.position.y = -1.05; thermo.add(bulb);
  const col = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1, 12), new THREE.MeshStandardMaterial({ color: 0xff3b3b, emissive: 0xff2222, emissiveIntensity: 0.6 }));
  thermo.add(col);
  for (let i = 0; i <= 8; i++) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(i % 2 ? 0.14 : 0.24, 0.025, 0.02), new THREE.MeshBasicMaterial({ color: 0xcfe9f5 }));
    t.position.set(0.17, -0.95 + i * 0.3, 0); thermo.add(t);
  }
  const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.1, 24), new THREE.MeshStandardMaterial({ color: 0x2b3a44 })); stand.position.y = -1.1; thermo.add(stand);

  /* ---- kettle (left) ---- */
  const kettle = new THREE.Group(); kettle.position.set(-2.9, -0.55, 0.6); kettle.rotation.y = 0.6; scene.add(kettle);
  const kBody = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.62, 0.8, 32), new THREE.MeshStandardMaterial({ color: 0xff7a59, metalness: 0.5, roughness: 0.25 })); kBody.castShadow = true; kettle.add(kBody);
  const kTop = new THREE.Mesh(new THREE.SphereGeometry(0.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xff7a59, metalness: 0.5, roughness: 0.25 })); kTop.position.y = 0.4; kettle.add(kTop);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 0.6, 14), new THREE.MeshStandardMaterial({ color: 0xff7a59, metalness: 0.5, roughness: 0.25 })); spout.position.set(0.62, 0.22, 0); spout.rotation.z = -0.9; kettle.add(spout);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.05, 8, 20, Math.PI), new THREE.MeshStandardMaterial({ color: 0x222b33 })); handle.position.set(-0.55, 0.3, 0); handle.rotation.z = Math.PI / 2 + 0.2; kettle.add(handle);
  const kBase = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 28), new THREE.MeshStandardMaterial({ color: 0x1b252c })); kBase.position.y = -0.45; kettle.add(kBase);
  const STEAM = 90, steamPos = new Float32Array(STEAM * 3), steamLife = new Float32Array(STEAM).fill(-1);
  const steamGeo = new THREE.BufferGeometry(); steamGeo.setAttribute("position", new THREE.BufferAttribute(steamPos, 3));
  const steam = new THREE.Points(steamGeo, new THREE.PointsMaterial({ size: 0.55, map: glow, color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false }));
  steam.frustumCulled = false; scene.add(steam);
  const spoutWorld = new THREE.Vector3();

  /* ---- heat lamp (back-right) and ice pack (front-right) ---- */
  const lamp = new THREE.Group(); lamp.position.set(2.2, -0.1, -2.6); scene.add(lamp);
  const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 12), new THREE.MeshStandardMaterial({ color: 0x9fb4bd, metalness: 0.7, roughness: 0.3 })); lampPole.position.y = -0.1; lamp.add(lampPole);
  const lampHead = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.6, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x2b3a44, side: THREE.DoubleSide, metalness: 0.5 })); lampHead.position.set(-0.5, 1.15, 0.3); lampHead.rotation.set(Math.PI * 0.12, 0, Math.PI * 0.35); lamp.add(lampHead);
  const lampBulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), new THREE.MeshBasicMaterial({ color: 0x553322 })); lampBulb.position.set(-0.62, 1.0, 0.36); lamp.add(lampBulb);
  const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xff7a30, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); lampGlow.scale.set(2.2, 2.2, 1); lampGlow.position.copy(lampBulb.position); lamp.add(lampGlow);
  const heatLight = new THREE.PointLight(0xff8a3d, 0, 8); heatLight.position.set(0.3, 0.6, 0.2); scene.add(heatLight);
  const ice = new THREE.Group(); ice.position.set(2.5, -0.85, 2.3); scene.add(ice);
  const iceMat = new THREE.MeshPhysicalMaterial({ color: 0x9be8ff, transparent: true, opacity: 0.8, roughness: 0.08, clearcoat: 1, emissive: 0x2299cc, emissiveIntensity: 0.15 });
  [[0, 0, 0, 0.5], [0.45, -0.1, 0.2, 0.36], [-0.3, -0.08, 0.35, 0.32]].forEach(([x, y, z, s]) => {
    const cube = new THREE.Mesh(new THREE.BoxGeometry(s, s, s), iceMat); cube.position.set(x, y + s / 2 - 0.02, z); cube.rotation.y = x * 2; cube.castShadow = true; ice.add(cube);
  });
  const iceGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0x6fe0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); iceGlow.scale.set(2.6, 2.6, 1); iceGlow.position.set(0, 0.3, 0); ice.add(iceGlow);
  const coldLight = new THREE.PointLight(0x7fe3ff, 0, 8); coldLight.position.set(1.2, 0.2, 1.4); scene.add(coldLight);

  /* ---- background dust motes: the room is never perfectly still ---- */
  const MOTES = 160, mp = new Float32Array(MOTES * 3);
  for (let i = 0; i < MOTES; i++) { mp[i * 3] = (Math.random() - 0.5) * 16; mp[i * 3 + 1] = Math.random() * 6 - 1; mp[i * 3 + 2] = (Math.random() - 0.5) * 16; }
  const moteGeo = new THREE.BufferGeometry(); moteGeo.setAttribute("position", new THREE.BufferAttribute(mp, 3));
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ size: 0.05, map: glow, color: 0x9fe6ff, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
  scene.add(motes);

  /* ---- sizing & orbit ---- */
  function resize() {
    const w = stageEl.clientWidth, h = stageEl.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(stageEl); resize();

  let rotY = 0.55, rotX = 0.22, radius = 8.2, dragging = false, lx = 0, ly = 0, travel = 0, idleAt = 0, punchT = 0;
  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", e => { dragging = true; lx = e.clientX; ly = e.clientY; travel = 0; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", e => {
    if (!dragging) return;
    const dx = e.clientX - lx, dy = e.clientY - ly; travel += Math.abs(dx) + Math.abs(dy);
    rotY -= dx * 0.007; rotX = Math.max(-0.1, Math.min(0.85, rotX + dy * 0.005)); lx = e.clientX; ly = e.clientY; idleAt = performance.now();
  });
  const stopDrag = () => { dragging = false; };
  canvas.addEventListener("pointerup", stopDrag); canvas.addEventListener("pointercancel", stopDrag);
  canvas.addEventListener("wheel", e => { e.preventDefault(); radius = Math.max(5.5, Math.min(11, radius + e.deltaY * 0.004)); }, { passive: false });
  // keyboard route to the same orbit (CLAUDE.md s6: no drag-only interaction)
  canvas.tabIndex = 0; canvas.setAttribute("role", "img"); canvas.setAttribute("aria-label", opts.label || "3D sealed jar");
  canvas.addEventListener("keydown", e => {
    const k = e.key; let used = true;
    if (k === "ArrowLeft") rotY += 0.12; else if (k === "ArrowRight") rotY -= 0.12;
    else if (k === "ArrowUp") rotX = Math.max(-0.1, rotX - 0.08); else if (k === "ArrowDown") rotX = Math.min(0.85, rotX + 0.08);
    else if (k === "+" || k === "=") radius = Math.max(5.5, radius - 0.5); else if (k === "-") radius = Math.min(11, radius + 0.5);
    else used = false;
    if (used) { e.preventDefault(); idleAt = performance.now(); }
  });

  /* ---- live state ---- */
  const S = { T: 22, vapour: 9, liquid: 0, rh: 50 };
  let heating = false, chilling = false, puffing = 0, lastLiquidOn = false;
  let thermoFill = 0.5;

  function emitSteam(n) {
    let made = 0;
    kettle.updateWorldMatrix(true, false); spoutWorld.set(0.85, 0.5, 0).applyMatrix4(kettle.matrixWorld);
    for (let i = 0; i < STEAM && made < n; i++) if (steamLife[i] < 0) {
      steamLife[i] = 1; made++;
      steamPos[i * 3] = spoutWorld.x + (Math.random() - 0.5) * 0.15; steamPos[i * 3 + 1] = spoutWorld.y; steamPos[i * 3 + 2] = spoutWorld.z + (Math.random() - 0.5) * 0.15;
    }
  }

  let last = performance.now(), t0 = last;
  let raf = 0, alive = true;
  function frame(now) {
    if (!alive) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const still = reduced();
    const speed = Math.sqrt((S.T + 273.15) / 295) * (still ? 0.35 : 1);

    // idle auto-orbit, paused for a few seconds after the student touches it
    if (!dragging && now - idleAt > 3500 && !still) rotY += dt * 0.12;
    punchT = Math.max(0, punchT - dt * 2.4);
    const r = radius - Math.sin(Math.min(1, punchT) * Math.PI) * 0.7;
    camera.position.set(Math.sin(rotY) * Math.cos(rotX) * r, 0.6 + Math.sin(rotX) * r, Math.cos(rotY) * Math.cos(rotX) * r);
    camera.lookAt(0, 0.15, 0);

    // molecules
    const nV = Math.max(2, Math.min(NV, Math.round(S.vapour * 2.2)));
    vap.g.setDrawRange(0, nV);
    for (const ps of [air, vap]) {
      const lim = ps === vap ? nV : ps.n;
      for (let i = 0; i < lim; i++) {
        const k = i * 3;
        ps.vel[k] += (Math.random() - 0.5) * 0.3; ps.vel[k + 1] += (Math.random() - 0.5) * 0.3; ps.vel[k + 2] += (Math.random() - 0.5) * 0.3;
        const m = Math.hypot(ps.vel[k], ps.vel[k + 1], ps.vel[k + 2]) || 1;
        const sp = (ps === vap ? 1.5 : 1.1) * speed;
        ps.vel[k] = ps.vel[k] / m; ps.vel[k + 1] = ps.vel[k + 1] / m; ps.vel[k + 2] = ps.vel[k + 2] / m;
        ps.pos[k] += ps.vel[k] * sp * dt; ps.pos[k + 1] += ps.vel[k + 1] * sp * dt; ps.pos[k + 2] += ps.vel[k + 2] * sp * dt;
        const rr = Math.hypot(ps.pos[k], ps.pos[k + 2]);
        if (rr > R - 0.1) { ps.pos[k] *= (R - 0.12) / rr; ps.pos[k + 2] *= (R - 0.12) / rr; ps.vel[k] *= -1; ps.vel[k + 2] *= -1; }
        if (Math.abs(ps.pos[k + 1]) > H / 2 - 0.1) { ps.pos[k + 1] = Math.sign(ps.pos[k + 1]) * (H / 2 - 0.12); ps.vel[k + 1] *= -1; }
      }
      ps.g.attributes.position.needsUpdate = true;
    }

    // condensation: mist in the air, droplets on the glass, a puddle below
    const wet = Math.min(1, S.liquid / 2.2);
    mist.m.opacity += (0.8 * wet - mist.m.opacity) * Math.min(1, dt * 3);
    for (let i = 0; i < NM; i++) {
      const k = i * 3;
      mist.pos[k] += mist.vel[k] * 0.08 * dt; mist.pos[k + 1] += (mist.vel[k + 1] * 0.06 - 0.02) * dt; mist.pos[k + 2] += mist.vel[k + 2] * 0.08 * dt;
      const rr = Math.hypot(mist.pos[k], mist.pos[k + 2]);
      if (rr > R - 0.2 || Math.abs(mist.pos[k + 1]) > H / 2 - 0.2) place(mist.pos, i);
    }
    mist.g.attributes.position.needsUpdate = true;
    const nD = Math.round(ND * Math.min(1, S.liquid / 2.5));
    drops.geometry.setDrawRange(0, nD);
    for (let i = 0; i < ND; i++) {
      dropPos[i * 3] = Math.cos(dropAng[i]) * (R - 0.04); dropPos[i * 3 + 2] = Math.sin(dropAng[i]) * (R - 0.04);
      dropPos[i * 3 + 1] -= dropSpd[i] * dt * (still ? 0.3 : 1) * 0.5;
      if (dropPos[i * 3 + 1] < -H / 2 + 0.1) { dropPos[i * 3 + 1] = H / 2 - 0.2 - Math.random() * 0.4; dropAng[i] = Math.random() * Math.PI * 2; }
    }
    dropGeo.attributes.position.needsUpdate = true;
    const targetPud = Math.min(1, S.liquid / 6) * 0.9 + (S.liquid > 0.01 ? 0.08 : 0);
    puddle.scale.y += (Math.max(0.001, targetPud) - puddle.scale.y) * Math.min(1, dt * 2);
    glassMat.opacity = 0.16 + 0.12 * wet;

    // thermometer column
    const target = (S.T - 0) / 40;
    thermoFill += (target - thermoFill) * Math.min(1, dt * 5);
    const colH = 0.05 + thermoFill * 2.2;
    col.scale.y = colH; col.position.y = -1.05 + colH / 2;

    // props: lamp / ice react while the student is heating / chilling
    const hT = heating ? 1 : 0, cT = chilling ? 1 : 0;
    lampGlow.material.opacity += ((heating ? 0.9 + Math.sin(now / 90) * 0.05 : 0) - lampGlow.material.opacity) * Math.min(1, dt * 6);
    lampBulb.material.color.setHex(heating ? 0xffb15a : 0x553322);
    heatLight.intensity += (hT * 1.4 - heatLight.intensity) * Math.min(1, dt * 6);
    iceGlow.material.opacity += ((chilling ? 0.8 : 0.0) - iceGlow.material.opacity) * Math.min(1, dt * 6);
    coldLight.intensity += (cT * 1.4 - coldLight.intensity) * Math.min(1, dt * 6);
    ice.children.forEach((c, i) => { if (c.isMesh) c.position.y += Math.sin(now / 600 + i) * 0.0008; });
    kettle.rotation.z = puffing > 0 ? Math.sin(now / 55) * 0.05 : 0;
    knob.material.emissive.setHex(0x000000);

    // steam
    if (puffing > 0) { puffing -= dt; if (!still) emitSteam(3); }
    for (let i = 0; i < STEAM; i++) {
      if (steamLife[i] < 0) { steamPos[i * 3 + 1] = -50; continue; }
      steamLife[i] -= dt * 0.55;
      // steam curls toward the jar lid
      steamPos[i * 3] += (0 - steamPos[i * 3]) * dt * 0.35; steamPos[i * 3 + 1] += dt * 0.85; steamPos[i * 3 + 2] += (0 - steamPos[i * 3 + 2]) * dt * 0.35;
    }
    steamGeo.attributes.position.needsUpdate = true;

    // idle motes drift
    for (let i = 0; i < MOTES; i++) { mp[i * 3 + 1] += dt * 0.1; if (mp[i * 3 + 1] > 5) mp[i * 3 + 1] = -1; mp[i * 3] += Math.sin(now / 2000 + i) * dt * 0.05; }
    moteGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  return {
    canvas,
    setState(st) {
      const was = lastLiquidOn;
      S.T = st.T; S.vapour = st.vapour; S.liquid = st.liquid; S.rh = st.rh;
      lastLiquidOn = st.liquid > 0.05;
      if (lastLiquidOn && !was && !reduced()) punchT = 1;      // the moment the jar fogs up
    },
    heat(on) { heating = !!on; },
    chill(on) { chilling = !!on; },
    puff() { puffing = 0.9; punchT = 0.6; },
    dispose() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); canvas.remove(); }
  };
}
