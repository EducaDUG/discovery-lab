/* ==========================================================================
   OCEANCURRENTS — 3D SCENE  (port of OceanCanvas.tsx onto vendored Three.js r128)
   Pacifica Bay in true 3D: orbit (drag), pan (right-drag / shift-drag / two fingers),
   zoom (wheel / pinch), keyboard (arrows + / -). Bathymetry, animated swell, day/night
   sky and sun, city skyline whose windows light up at night and go dark in a blackout,
   fauna, research ship + ROV, lighthouse, the cheeky "tradie" service boat, thermocline
   and artificial-reef overlays, click-to-select and click-to-place devices.
   Falls back to a calm 2D cross-section if WebGL is unavailable.
   ========================================================================== */
import { MARINE_TECHNOLOGIES, techOf, ZONES } from "./marine-data.js?v=2";
import { isEligible, zoneAt } from "./marine-engine.js?v=2";

const WORLD_X0 = -240, WORLD_W = 520;
export const xToWorld = xr => WORLD_X0 + xr * WORLD_W;
export function seabedDepthAt(x) {
  if (x < -200) return -4 - Math.max(0, (-200 - x) * 0.15);
  if (x < -50) return -6 - ((x + 200) / 150) * 22;
  if (x < 150) return -28 - ((x + 50) / 200) * 34;
  const p = Math.min(1.0, (x - 150) / 180);
  return -62 - Math.sin(p * Math.PI * 0.5) * 88;
}

export function loadThree(url) {
  if (window.THREE) return Promise.resolve(window.THREE);
  return new Promise((res, rej) => { const s = document.createElement("script"); s.src = url; s.onload = () => res(window.THREE); s.onerror = () => rej(new Error("three load failed")); document.head.appendChild(s); });
}

/* ---------------------------------------------------------------- */
export async function createScene(container, hooks, threeUrl) {
  let THREE = null;
  try { THREE = await loadThree(threeUrl); } catch (e) { return createFallback(container, hooks); }
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  } catch (e) { return createFallback(container, hooks); }
  if (!renderer.getContext()) return createFallback(container, hooks);

  const C = hex => new THREE.Color(hex).convertSRGBToLinear();      // keep the source's sRGB look on r128
  const M = (hex, o = {}) => new THREE.MeshStandardMaterial({ color: C(hex), roughness: 0.5, ...o });
  const reduced = () => hooks.reduced();

  const width0 = container.clientWidth || 800, height0 = container.clientHeight || 450;
  container.innerHTML = "";
  const scene = new THREE.Scene(); scene.background = C(0x0284c7); scene.fog = new THREE.FogExp2(C(0x38bdf8), 0.00075);
  const camera = new THREE.PerspectiveCamera(45, width0 / height0, 1, 3500);
  renderer.setSize(width0, height0); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  const cv = renderer.domElement; cv.style.touchAction = "none"; cv.style.display = "block"; cv.style.width = "100%"; cv.style.height = "100%";
  cv.tabIndex = 0; cv.setAttribute("aria-label", hooks.label || "3D ocean");

  /* ---- own orbit controls with damping ---- */
  const V3 = THREE.Vector3;
  const goal = { target: new V3(30, -10, 0), theta: 0, phi: 1, radius: 300 }, cur = { target: new V3(30, -10, 0), theta: 0, phi: 1, radius: 300 };
  function setView(pos, target) {
    const d = pos.clone().sub(target); goal.radius = d.length(); goal.phi = Math.acos(Math.max(-1, Math.min(1, d.y / goal.radius))); goal.theta = Math.atan2(d.x, d.z); goal.target.copy(target);
  }
  const PRESETS = { orbit: [new V3(-70, 230, 520), new V3(20, -12, 0)], profile: [new V3(20, 15, 380), new V3(20, -25, 0)], city: [new V3(180, 50, 80), new V3(-260, 20, 0)], deep: [new V3(160, 90, -180), new V3(240, -40, 0)], top: [new V3(20, 520, 0.1), new V3(20, 0, 0)] };
  function preset(name) { const p = PRESETS[name] || PRESETS.orbit; setView(p[0], p[1]); tracking = false; }
  setView(...PRESETS.orbit); Object.assign(cur, { theta: goal.theta, phi: goal.phi, radius: goal.radius }); cur.target.copy(goal.target);
  const clampGoal = () => { goal.phi = Math.max(0.06, Math.min(Math.PI * 0.485, goal.phi)); goal.radius = Math.max(35, Math.min(900, goal.radius)); };
  let tracking = false;
  const ptrs = new Map(); let dragMoved = 0, lastPinch = 0, downBtn = 0;
  function pan(dx, dy) {
    const right = new V3(), up = new V3(); camera.matrixWorld.extractBasis(right, up, new V3());
    const k = cur.radius * 0.0016; goal.target.addScaledVector(right, -dx * k).addScaledVector(up, dy * k);
  }
  cv.addEventListener("pointerdown", e => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); dragMoved = 0; downBtn = e.button; if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; lastPinch = Math.hypot(a.x - b.x, a.y - b.y); } tracking = false; hooks.onUserCamera && hooks.onUserCamera(); });
  cv.addEventListener("pointermove", e => {
    const p = ptrs.get(e.pointerId);
    if (!p) { hover(e); return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; dragMoved += Math.abs(dx) + Math.abs(dy);
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); goal.radius *= lastPinch / Math.max(1, d); lastPinch = d; pan(dx / 2, dy / 2); }
    else if (downBtn === 2 || e.shiftKey) pan(dx, dy);
    else { goal.theta -= dx * 0.005; goal.phi -= dy * 0.005; }
    clampGoal();
  });
  const up = e => { ptrs.delete(e.pointerId); };
  cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
  cv.addEventListener("wheel", e => { e.preventDefault(); goal.radius *= Math.exp(e.deltaY * 0.0012); clampGoal(); tracking = false; }, { passive: false });
  cv.addEventListener("contextmenu", e => e.preventDefault());
  cv.addEventListener("keydown", e => {
    const k = e.key, step = 0.08;
    if (k === "ArrowLeft") goal.theta -= step; else if (k === "ArrowRight") goal.theta += step; else if (k === "ArrowUp") goal.phi -= step; else if (k === "ArrowDown") goal.phi += step;
    else if (k === "+" || k === "=") goal.radius *= 0.88; else if (k === "-" || k === "_") goal.radius *= 1.14; else return;
    e.preventDefault(); clampGoal(); tracking = false;
  });

  /* ---- lighting ---- */
  scene.add(new THREE.AmbientLight(C(0xdbeafe), 0.7));
  scene.add(new THREE.HemisphereLight(C(0x7dd3fc), C(0x0f172a), 0.85));
  const sunLight = new THREE.DirectionalLight(C(0xfff7ed), 2.2); sunLight.position.set(200, 350, 150); sunLight.castShadow = true; sunLight.shadow.mapSize.set(1024, 1024);
  Object.assign(sunLight.shadow.camera, { left: -400, right: 400, top: 300, bottom: -300, near: 10, far: 1200 }); scene.add(sunLight);
  const sunMesh = new THREE.Mesh(new THREE.SphereGeometry(18, 16, 16), new THREE.MeshBasicMaterial({ color: C(0xffedd5) })); sunMesh.position.set(400, 450, 200); scene.add(sunMesh);

  /* ---- water ---- */
  const waterGeom = new THREE.PlaneGeometry(1800, 1800, 90, 90); waterGeom.rotateX(-Math.PI / 2);
  const water = new THREE.Mesh(waterGeom, new THREE.MeshStandardMaterial({ color: C(0x0284c7), roughness: 0.12, metalness: 0.25, transparent: true, opacity: 0.84 }));
  water.receiveShadow = true; scene.add(water);
  /* ---- seabed ---- */
  const sbGeom = new THREE.PlaneGeometry(1600, 1600, 80, 80); sbGeom.rotateX(-Math.PI / 2);
  { const pa = sbGeom.attributes.position, col = new Float32Array(pa.count * 3);
    for (let i = 0; i < pa.count; i++) {
      const vx = pa.getX(i), vz = pa.getZ(i); pa.setY(i, seabedDepthAt(vx) + Math.sin(vx * 0.05 + vz * 0.03) * 2.5 + Math.cos(vz * 0.08) * 1.5);
      let r = 0.12, g = 0.18, b = 0.26; if (vx < -160) { r = 0.72; g = 0.62; b = 0.44; } else if (vx < 120) { r = 0.18; g = 0.28; b = 0.38; } else { r = 0.04; g = 0.08; b = 0.15; }
      col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b;
    }
    sbGeom.setAttribute("color", new THREE.BufferAttribute(col, 3)); sbGeom.computeVertexNormals(); }
  const seabed = new THREE.Mesh(sbGeom, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0.1, flatShading: true })); seabed.receiveShadow = true; scene.add(seabed);

  /* ---- city (deterministic layout so it never changes between visits) ---- */
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const city = new THREE.Group(); city.position.set(-310, 0, 0);
  const hillGeom = new THREE.ConeGeometry(180, 130, 8), hillMat = M(0x164e23, { roughness: 0.9 });
  const h1 = new THREE.Mesh(hillGeom, hillMat); h1.position.set(-80, 50, -180); h1.scale.set(1.4, 0.9, 1.2); city.add(h1);
  const h2 = new THREE.Mesh(hillGeom, hillMat); h2.position.set(-110, 60, 140); h2.scale.set(1.5, 1.1, 1.3); city.add(h2);
  const seawall = new THREE.Mesh(new THREE.BoxGeometry(25, 8, 700), M(0x475569, { roughness: 0.7 })); seawall.position.set(50, 4, 0); city.add(seawall);
  const pierMat = M(0x334155, { roughness: 0.8 });
  for (let p = -2; p <= 2; p++) { const pier = new THREE.Mesh(new THREE.BoxGeometry(60, 3, 14), pierMat); pier.position.set(80, 2.5, p * 110); city.add(pier); }
  const bridge = new THREE.Group(); bridge.position.set(0, 0, -380); const bm = M(0xd97706, { roughness: 0.5 });
  [[40, 45], [180, 45]].forEach(([x, y]) => { const t = new THREE.Mesh(new THREE.BoxGeometry(8, 90, 8), bm); t.position.set(x, y, 0); bridge.add(t); });
  const deck = new THREE.Mesh(new THREE.BoxGeometry(280, 4, 16), M(0x334155)); deck.position.set(110, 40, 0); bridge.add(deck); city.add(bridge);
  const bCols = [0x1e293b, 0x0284c7, 0x334155, 0x0f766e, 0x1e1b4b, 0x475569], cityMats = [];
  for (let bx = -4; bx <= 1; bx++) for (let bz = -7; bz <= 7; bz++) {
    const bh = 25 + rnd() * 85, bw = 14 + rnd() * 16, bd = 14 + rnd() * 16, col = bCols[Math.floor(rnd() * bCols.length)];
    const mat = rnd() > 0.4 ? M(col, { roughness: 0.4 }) : M(0x38bdf8, { roughness: 0.15, metalness: 0.85 });
    mat.emissive = C(0xffd98a); mat.emissiveIntensity = 0; cityMats.push(mat);
    const b = new THREE.Mesh(new THREE.BoxGeometry(bw, bh, bd), mat); b.position.set(bx * 26 - 10, bh / 2 + 4, bz * 38 + (rnd() - 0.5) * 12); city.add(b);
  }
  const lh = new THREE.Mesh(new THREE.CylinderGeometry(4, 6.5, 38, 8), M(0xf8fafc, { roughness: 0.3 })); lh.position.set(55, 23, 140); city.add(lh);
  const lantern = new THREE.Mesh(new THREE.SphereGeometry(4, 8, 8), new THREE.MeshBasicMaterial({ color: C(0xfef08a) })); lantern.position.set(55, 43, 140); city.add(lantern);
  const lhSpot = new THREE.SpotLight(C(0xfef08a), 4, 350, Math.PI * 0.18, 0.5); lhSpot.position.set(55, 43, 140); lhSpot.target.position.set(200, 0, 140); city.add(lhSpot); city.add(lhSpot.target);
  scene.add(city);

  /* ---- research ship + ROV + fauna ---- */
  const ship = new THREE.Group(); ship.position.set(230, 0, -110);
  const hull = new THREE.Mesh(new THREE.BoxGeometry(85, 14, 22), M(0x0369a1)); hull.position.y = 3; ship.add(hull);
  const sup = new THREE.Mesh(new THREE.BoxGeometry(45, 18, 18), M(0xf8fafc)); sup.position.set(-6, 17, 0); ship.add(sup); scene.add(ship);
  const rov = new THREE.Group(); rov.position.set(240, -120, -110); rov.add(new THREE.Mesh(new THREE.BoxGeometry(10, 7, 7), M(0xeab308)));
  const rovLight = new THREE.SpotLight(C(0xfef08a), 5, 120, Math.PI * 0.25, 0.4); rovLight.position.set(5, 0, 0); rovLight.target.position.set(35, -20, 0); rov.add(rovLight); rov.add(rovLight.target); scene.add(rov);
  const dolphins = new THREE.Group(), dG = new THREE.ConeGeometry(2.5, 9, 6); dG.rotateZ(-Math.PI / 2);
  for (let d = 0; d < 3; d++) { const m = new THREE.Mesh(dG, M(0x38bdf8)); m.position.set(d * 12, 0, d * 8); dolphins.add(m); }
  dolphins.position.set(130, 0, 70); scene.add(dolphins);
  const whale = new THREE.Group(); whale.position.set(260, 0, 180);
  const wb = new THREE.Mesh(new THREE.ConeGeometry(9, 36, 8), M(0x0f172a)); wb.rotateZ(-Math.PI / 2); whale.add(wb);
  const spout = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 0.2, 28, 8), new THREE.MeshBasicMaterial({ color: C(0xe0f2fe), transparent: true, opacity: 0.7 })); spout.position.set(-6, 18, 0); whale.add(spout); scene.add(whale);

  /* ---- the tradie service boat ---- */
  const boat = new THREE.Group(); boat.position.set(-220, 0, 30);
  const tOr = M(0xea580c, { roughness: 0.35 }), tYe = M(0xfacc15, { roughness: 0.35 }), rub = M(0x0f172a, { roughness: 0.8 });
  [[7], [-7]].forEach(([z]) => { const h = new THREE.Mesh(new THREE.BoxGeometry(34, 7, 5.5), tOr); h.position.set(0, 2, z); boat.add(h); const f = new THREE.Mesh(new THREE.BoxGeometry(35, 1.8, 6), rub); f.position.set(0, 4.5, z); boat.add(f); });
  const bd = new THREE.Mesh(new THREE.BoxGeometry(32, 2.5, 19.5), M(0x334155, { roughness: 0.7 })); bd.position.set(0, 5.5, 0); boat.add(bd);
  const cab = new THREE.Mesh(new THREE.BoxGeometry(15, 12, 14), M(0xf8fafc, { roughness: 0.2 })); cab.position.set(2, 12, 0); boat.add(cab);
  const ws = new THREE.Mesh(new THREE.BoxGeometry(1, 5, 12), M(0x38bdf8, { roughness: 0.1, metalness: 0.8 })); ws.position.set(9.6, 13, 0); boat.add(ws);
  const ladder = new THREE.Mesh(new THREE.BoxGeometry(22, 1, 5), M(0xd4d4d8, { metalness: 0.7, roughness: 0.2 })); ladder.position.set(1, 18.5, 0); boat.add(ladder);
  const chest = new THREE.Mesh(new THREE.BoxGeometry(6, 4.5, 5), M(0xdc2626, { roughness: 0.4 })); chest.position.set(-8, 8, 4); boat.add(chest);
  const coil = new THREE.Mesh(new THREE.TorusGeometry(3.5, 1.2, 8, 16), M(0xf97316)); coil.rotateX(Math.PI / 2); coil.position.set(-8, 7.5, -4); boat.add(coil);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 24, 6), M(0x94a3b8)); pole.position.set(-14, 14, 0); boat.add(pole);
  const fc = document.createElement("canvas"); fc.width = 128; fc.height = 80; const fx = fc.getContext("2d");
  fx.fillStyle = "#0f172a"; fx.fillRect(0, 0, 128, 80); fx.fillStyle = "#facc15"; fx.beginPath(); fx.arc(64, 38, 18, 0, Math.PI * 2); fx.fill(); fx.fillRect(40, 22, 48, 6);
  fx.fillStyle = "#0f172a"; fx.fillRect(56, 36, 5, 5); fx.fillRect(67, 36, 5, 5); fx.fillRect(58, 46, 12, 3);
  fx.strokeStyle = "#facc15"; fx.lineWidth = 4; fx.beginPath(); fx.moveTo(40, 65); fx.lineTo(88, 15); fx.moveTo(88, 65); fx.lineTo(40, 15); fx.stroke();
  const flagTex = new THREE.CanvasTexture(fc); flagTex.encoding = THREE.sRGBEncoding;
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(16, 10), new THREE.MeshBasicMaterial({ map: flagTex, side: THREE.DoubleSide })); flag.position.set(-22, 21, 0); boat.add(flag);
  const skin = new THREE.MeshBasicMaterial({ color: C(0xfed7aa) });
  const sparky = new THREE.Group(); sparky.position.set(4, 7, 5); sparky.add(new THREE.Mesh(new THREE.BoxGeometry(3, 5, 3), tYe));
  const sHead = new THREE.Group(); const sFace = new THREE.Mesh(new THREE.SphereGeometry(1.6, 8, 8), skin); sFace.position.y = 3.6; sHead.add(sFace);
  const sCap = new THREE.Mesh(new THREE.ConeGeometry(2, 1.8, 6), tYe); sCap.position.set(-0.5, 4.4, 0); sCap.rotateZ(0.4); sHead.add(sCap);
  const sWr = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 1), M(0xfacc15, { metalness: 0.8 })); sWr.position.set(2.5, 5, 1); sWr.rotation.z = -0.5; sHead.add(sWr); sparky.add(sHead); boat.add(sparky);
  const plumber = new THREE.Group(); plumber.position.set(-4, 7, -5); plumber.add(new THREE.Mesh(new THREE.BoxGeometry(3.5, 5, 3.5), M(0x1e3a8a)));
  const pHead = new THREE.Group(); const pFace = new THREE.Mesh(new THREE.SphereGeometry(1.7, 8, 8), skin); pFace.position.y = 3.6; pHead.add(pFace);
  const pBan = new THREE.Mesh(new THREE.SphereGeometry(1.8, 8, 8), new THREE.MeshBasicMaterial({ color: C(0xdc2626) })); pBan.position.y = 4.2; pHead.add(pBan);
  const pSp = new THREE.Mesh(new THREE.BoxGeometry(1.2, 9, 1.5), M(0xef4444)); pSp.position.set(-2, 4.5, 1); pSp.rotation.z = 0.6; pHead.add(pSp); plumber.add(pHead); boat.add(plumber);
  const appr = new THREE.Group(); appr.position.set(8, 7, 0); appr.add(new THREE.Mesh(new THREE.BoxGeometry(2.5, 4.5, 2.5), tOr));
  const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.5, 6), M(0xf8fafc)); mug.position.set(1.8, 3, 0); appr.add(mug); boat.add(appr);
  const wakeMat = new THREE.MeshBasicMaterial({ color: C(0xffffff), transparent: true, opacity: 0.65 }), wakeGeom = new THREE.PlaneGeometry(24, 4); wakeGeom.rotateX(-Math.PI / 2);
  const w1 = new THREE.Mesh(wakeGeom, wakeMat); w1.position.set(-24, 0.2, 7); boat.add(w1); const w2 = new THREE.Mesh(wakeGeom, wakeMat); w2.position.set(-24, 0.2, -7); boat.add(w2);
  scene.add(boat);
  const SPARKS = 60, spGeom = new THREE.BufferGeometry(); spGeom.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SPARKS * 3), 3));
  const sparks = new THREE.Points(spGeom, new THREE.PointsMaterial({ color: C(0xfde047), size: 2.5, transparent: true, opacity: 0.9 })); sparks.visible = false; scene.add(sparks);

  /* ---- thermocline + reef overlays ---- */
  const thermo = new THREE.Group();
  { const g = new THREE.PlaneGeometry(900, 500, 1, 1); g.rotateX(-Math.PI / 2); const c = document.createElement("canvas"); c.width = 8; c.height = 64; const x = c.getContext("2d"); const gr = x.createLinearGradient(0, 0, 0, 64); gr.addColorStop(0, "rgba(239,68,68,.55)"); gr.addColorStop(1, "rgba(37,99,235,.55)"); x.fillStyle = gr; x.fillRect(0, 0, 8, 64);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, side: THREE.DoubleSide, depthWrite: false })); m.position.set(30, -45, 0); thermo.add(m);
    const lines = new THREE.Mesh(new THREE.BoxGeometry(900, 0.6, 500), new THREE.MeshBasicMaterial({ color: C(0xfef08a), transparent: true, opacity: 0.35 })); lines.position.set(30, -45, 0); thermo.add(lines); }
  thermo.visible = false; scene.add(thermo);
  const reefs = new THREE.Group(); reefs.visible = true; scene.add(reefs);

  /* ---- devices ---- */
  const devGroup = new THREE.Group(); scene.add(devGroup);
  const ghost = new THREE.Mesh(new THREE.CylinderGeometry(14, 14, 2, 24), new THREE.MeshBasicMaterial({ color: C(0x38bdf8), transparent: true, opacity: 0.55, wireframe: true })); ghost.visible = false; scene.add(ghost);
  const sMat = { white: M(0xf8fafc, { roughness: 0.3 }), orange: M(0xea580c, { roughness: 0.4 }), yellow: M(0xfacc15, { roughness: 0.3 }), blue: M(0x0284c7, { roughness: 0.25 }), pv: M(0x1e3a8a, { roughness: 0.15, metalness: 0.8 }), green: M(0x065f46, { roughness: 0.4 }), red: M(0xe23a54, { roughness: 0.4 }), grey: M(0x334155, { roughness: 0.6 }), purple: M(0x7c3aed, { roughness: 0.35 }), teal: M(0x0d9488, { roughness: 0.4 }) };
  const worldPos = (d, idx) => {
    const x = xToWorld(d.xRatio), z = ((idx % 3) - 1) * 38, sb = seabedDepthAt(x), t = techOf(d.techId); let y = 0;
    if (t.visualDepth === "midwater") y = sb * 0.52; else if (t.visualDepth === "seabed") y = sb + 2.5;
    return new V3(x, y, z);
  };
  function buildDevice(d, idx, selected) {
    const pos = worldPos(d, idx), g = new THREE.Group(); g.position.copy(pos); g.name = d.instanceId; g.userData.techId = d.techId;
    if (selected) { const rg = new THREE.RingGeometry(16, 18, 32); rg.rotateX(-Math.PI / 2); const r = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ color: C(0x38bdf8), side: THREE.DoubleSide })); r.position.y = 0.5; g.add(r); }
    const add = (m, x = 0, y = 0, z = 0) => { m.position.set(x, y, z); g.add(m); return m; };
    const cyl = (rt, rb, h, mat, seg = 12) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
    const box = (w, h, dd, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, dd), mat);
    const id = d.techId;
    if (id === "offshore_wind_fixed" || id === "offshore_wind_floating") {
      const towerH = 68;
      if (id === "offshore_wind_floating") { add(cyl(8, 8, 26, sMat.yellow), 0, -10, 0); [0, 2.1, 4.2].forEach(a => { const m = cyl(0.5, 0.5, 70, sMat.grey, 5); m.rotation.z = Math.cos(a) * 1.1; m.position.set(Math.sin(a) * 12, -38, Math.cos(a) * 12); g.add(m); }); }
      else { const sb = seabedDepthAt(pos.x); add(cyl(3.5, 3.5, Math.abs(sb) + 6, sMat.orange), 0, sb / 2, 0); }
      add(cyl(2, 3.8, towerH, sMat.white, 16), 0, towerH / 2, 0); add(box(16, 7, 7, sMat.white), -2, towerH, 0);
      const rotor = new THREE.Group(); rotor.name = "rotor"; rotor.position.set(6, towerH, 0);
      const hub = new THREE.Mesh(new THREE.ConeGeometry(2.5, 5, 12), sMat.white); hub.rotateZ(-Math.PI / 2); rotor.add(hub);
      for (let b = 0; b < 3; b++) { const bl = new THREE.Mesh(new THREE.ConeGeometry(1.6, 38, 6), sMat.white); bl.geometry.translate(0, 19, 0); bl.rotation.z = (b * Math.PI * 2) / 3; rotor.add(bl); }
      g.add(rotor);
    } else if (id === "point_absorber") {
      const bg = new THREE.Group(); bg.name = "buoy_float"; const tor = new THREE.Mesh(new THREE.TorusGeometry(8, 3.2, 12, 24), sMat.yellow); tor.rotateX(Math.PI / 2); bg.add(tor);
      const sh = cyl(1.2, 1.2, 32, sMat.blue, 8); sh.position.y = -10; bg.add(sh); g.add(bg);
    } else if (id === "oscillating_water_column") {
      const ch = new THREE.Group(); ch.name = "buoy_float"; ch.add(box(22, 16, 22, M(0x94a3b8, { roughness: 0.7 }))); const mouth = box(14, 8, 2, sMat.blue); mouth.position.set(0, -4, 11.2); ch.add(mouth);
      const st = cyl(2.6, 3.2, 14, sMat.white, 10); st.position.set(0, 14, 0); ch.add(st); const ro = new THREE.Group(); ro.name = "owc_rotor"; ro.position.set(0, 22, 0); [0, 1, 2, 3].forEach(i => { const b = box(7, 0.8, 1.6, sMat.red); b.rotation.y = i * Math.PI / 2; ro.add(b); }); ch.add(ro); g.add(ch);
    } else if (id === "wave_attenuator") {
      const sn = new THREE.Group(); sn.name = "attenuator";
      for (let s = 0; s < 4; s++) { const seg = cyl(4, 4, 22, sMat.red, 12); seg.rotation.z = Math.PI / 2; seg.position.set((s - 1.5) * 23, 2, 0); seg.name = "seg" + s; sn.add(seg); const jt = new THREE.Mesh(new THREE.SphereGeometry(4.4, 8, 8), sMat.grey); jt.position.set((s - 1.5) * 23 + 11.5, 2, 0); sn.add(jt); }
      g.add(sn);
    } else if (id === "wave_surge_converter") {
      add(box(30, 4, 14, sMat.grey), 0, 0, 0); const hinge = new THREE.Group(); hinge.name = "flap"; hinge.position.set(0, 3, 0); const fl = box(3, 26, 22, sMat.yellow); fl.position.y = 13; hinge.add(fl); g.add(hinge);
    } else if (id === "tidal_stream_turbine") {
      add(new THREE.Mesh(new THREE.ConeGeometry(12, 18, 3), new THREE.MeshStandardMaterial({ color: C(0x334155), wireframe: true })), 0, 9, 0);
      const pod = cyl(3, 3, 14, sMat.blue, 8); pod.rotateZ(Math.PI / 2); add(pod, 0, 18, 0);
      const bgp = new THREE.Group(); bgp.name = "tidal_blades"; bgp.position.set(7, 18, 0); bgp.add(box(1.5, 24, 3, sMat.blue)); g.add(bgp);
    } else if (id === "tidal_kite") {
      add(cyl(1, 1, 52, sMat.grey, 6), 0, 26, 0); const k = new THREE.Group(); k.name = "kite"; k.add(box(26, 1.6, 6, sMat.purple)); const nac = cyl(2.4, 2.4, 8, sMat.white, 8); nac.rotation.z = Math.PI / 2; nac.position.y = -3; k.add(nac); k.position.set(0, 40, 0); g.add(k);
    } else if (id === "floating_marine_solar") {
      for (let px = -2; px <= 2; px++) for (let pz = -2; pz <= 2; pz++) { const p = box(8, 1.5, 8, sMat.pv); p.position.set(px * 9, 0.75, pz * 9); g.add(p); }
    } else if (id === "otec_platform") {
      add(box(32, 12, 32, sMat.green), 0, 6, 0); const pipe = cyl(3, 3, 140, M(0x10b981)); pipe.geometry.translate(0, -70, 0); g.add(pipe);
    } else if (id === "salinity_gradient") {
      add(box(30, 12, 24, M(0xcbd5e1, { roughness: 0.5 })), 0, 6, 0); add(cyl(4, 4, 16, sMat.white, 10), -8, 20, 0); add(cyl(2, 2, 26, sMat.blue, 8), 12, 8, 14).rotation.z = Math.PI / 2; add(box(8, 3, 22, sMat.teal), 14, 1.5, -6);
    } else if (id === "subsea_battery") {
      for (let i = -1; i <= 1; i++) add(box(9, 7, 20, sMat.purple), i * 11, 3.5, 0); add(cyl(0.9, 0.9, 40, sMat.orange, 6), 0, 20, 0);
    } else if (id === "subsea_hydrogen_hub") {
      const dome = new THREE.Mesh(new THREE.SphereGeometry(13, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: C(0x5eead4), transparent: true, opacity: 0.55, roughness: 0.1 })); g.add(dome);
      add(cyl(3, 3, 20, sMat.white, 10), 0, 8, 0).rotation.z = Math.PI / 2; add(box(10, 6, 10, sMat.teal), 18, 3, 0);
    } else add(cyl(6, 6, 8, sMat.blue), 0, 0, 0);
    // status beacon: green = healthy, amber = fouled/worn, red = critical (updated every frame, no rebuild)
    const bc = new THREE.Mesh(new THREE.SphereGeometry(2.6, 10, 10), new THREE.MeshBasicMaterial({ color: C(0x22c55e) })); bc.name = "beacon"; bc.position.y = techOf(id).visualDepth === "seabed" ? 30 : id.startsWith("offshore_wind") ? 86 : 30; g.add(bc);
    return g;
  }
  let devSig = "", reefSig = "";
  function syncDevices(S) {
    const sig = S.devices.map(d => d.instanceId + d.techId).join("|") + "#" + (S.selectedId || "");
    if (sig !== devSig) { devSig = sig; while (devGroup.children.length) devGroup.remove(devGroup.children[0]); S.devices.forEach((d, i) => devGroup.add(buildDevice(d, i, d.instanceId === S.selectedId))); }
    const rs = S.devices.map(d => d.instanceId).join("|") + S.showReefs;
    if (rs !== reefSig) {
      reefSig = rs; while (reefs.children.length) reefs.remove(reefs.children[0]);
      if (S.showReefs) S.devices.forEach((d, i) => { const p = worldPos(d, i), sb = seabedDepthAt(p.x); for (let k = 0; k < 7; k++) { const a = k * 0.9 + i, r = 9 + (k % 3) * 4; const rk = new THREE.Mesh(new THREE.DodecahedronGeometry(2 + (k % 3), 0), M(k % 2 ? 0x64748b : 0x78716c, { roughness: 0.9 })); rk.position.set(p.x + Math.cos(a) * r, sb + 1.2, p.z + Math.sin(a) * r); reefs.add(rk); if (k % 2 === 0) { const kelp = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 9, 4), M(0x16a34a)); kelp.position.set(rk.position.x + 1.5, sb + 5, rk.position.z); kelp.userData.kelp = 1; reefs.add(kelp); } } });
    }
  }

  /* ---- picking ---- */
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2(), plane = new THREE.Plane(new V3(0, 1, 0), 0), hit = new V3();
  function setMouse(e) { const r = cv.getBoundingClientRect(); mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(mouse, camera); }
  function hover(e) {
    const S = hooks.state(); if (!S.pendingTech) { ghost.visible = false; return; }
    setMouse(e); if (ray.ray.intersectPlane(plane, hit)) {
      const xr = Math.max(0.12, Math.min(0.94, (hit.x - WORLD_X0) / WORLD_W)); ghost.visible = true; ghost.position.set(xToWorld(xr), 1, hit.z);
      ghost.material.color.copy(C(isEligible(S.pendingTech, xr) ? 0x22c55e : 0xef4444)); hooks.onHoverX && hooks.onHoverX(xr);
    }
  }
  cv.addEventListener("click", e => {
    if (dragMoved > 6) return;                                    // a drag, not a tap (cumulative travel threshold)
    const S = hooks.state(); setMouse(e);
    if (S.pendingTech) {
      if (ray.ray.intersectPlane(plane, hit)) { const xr = Math.max(0.12, Math.min(0.94, (hit.x - WORLD_X0) / WORLD_W)); hooks.onPlace(S.pendingTech, xr, hit.z); }
      return;
    }
    const hits = ray.intersectObjects(devGroup.children, true);
    if (hits.length) { let t = hits[0].object; while (t && t.parent !== devGroup) t = t.parent; if (t && t.name) { hooks.onSelect(t.name); return; } }
    hooks.onSelect(null);
  });

  /* ---- resize ---- */
  const ro = new ResizeObserver(() => { const w = container.clientWidth, h = container.clientHeight; if (w < 10 || h < 10) return; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); }); ro.observe(container);

  /* ---- render loop (cosmetic only: all game state lives in setInterval timers elsewhere) ---- */
  let raf = 0, t = 0, frame = 0, last = performance.now(), destroyed = false;
  const tmp = new V3();
  function animate(now) {
    if (destroyed) return; raf = requestAnimationFrame(animate);
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt * 0.72; frame++;
    const S = hooks.state(), env = S.env, hour = S.hour, rm = reduced();
    // camera
    if (tracking) goal.target.lerp(tmp.set(boat.position.x, 15, boat.position.z), 0.08);
    const k = 1 - Math.pow(0.0005, dt); cur.theta += (goal.theta - cur.theta) * k; cur.phi += (goal.phi - cur.phi) * k; cur.radius += (goal.radius - cur.radius) * k; cur.target.lerp(goal.target, k);
    camera.position.set(cur.target.x + cur.radius * Math.sin(cur.phi) * Math.sin(cur.theta), cur.target.y + cur.radius * Math.cos(cur.phi), cur.target.z + cur.radius * Math.sin(cur.phi) * Math.cos(cur.theta)); camera.lookAt(cur.target);
    syncDevices(S);
    // swell
    if (frame % 2 === 0) {
      const pos = waterGeom.attributes.position, amp = Math.max(1.2, env.significantWaveHeightM * 1.5) * (rm ? 0.4 : 1);
      for (let i = 0; i < pos.count; i++) { const vx = pos.getX(i), vz = pos.getZ(i); pos.setY(i, Math.sin(vx * 0.035 + t * 2.2) * amp + Math.cos(vz * 0.045 + t * 1.8) * amp * 0.6); }
      pos.needsUpdate = true; waterGeom.computeVertexNormals();
    }
    // boat
    const B = S.boat, sailing = B.active && (B.state === "sailing_to" || B.state === "returning"), servicing = B.active && B.state === "servicing";
    const bx = xToWorld(B.xRatio); boat.position.x = bx; boat.position.y = Math.sin(t * 3.5) * 1.5; boat.rotation.z = Math.sin(t * 2.8) * 0.06; boat.rotation.y = B.state === "returning" ? Math.PI : 0;
    sHead.position.y = Math.sin(t * 14) * 0.6; sHead.rotation.z = Math.sin(t * 7) * 0.25; pHead.position.y = Math.sin(t * 12 + 1) * 0.5;
    w1.visible = w2.visible = sailing; if (sailing) w1.scale.x = w2.scale.x = 1 + Math.sin(t * 15) * 0.3;
    sparks.visible = servicing; if (servicing) { sparks.position.set(bx + 8, 12, 0); const pa = spGeom.attributes.position; for (let s = 0; s < SPARKS; s++) pa.setXYZ(s, (Math.random() - 0.5) * 12, Math.random() * 16, (Math.random() - 0.5) * 12); pa.needsUpdate = true; }
    tmp.copy(boat.position); tmp.y += 24; tmp.project(camera); const w = container.clientWidth, h = container.clientHeight;
    hooks.onBoatScreen && hooks.onBoatScreen(((tmp.x + 1) * w) / 2, ((-tmp.y + 1) * h) / 2, tmp.z < 1, t);
    // beams, fauna
    const lhA = t * 1.4; lhSpot.target.position.set(55 + Math.cos(lhA) * 200, 0, 140 + Math.sin(lhA) * 200);
    if (!rm) { const dc = (t * 0.7) % (Math.PI * 2); dolphins.position.y = Math.max(-2, Math.sin(dc) * 16); dolphins.rotation.z = Math.sin(dc) * 0.4; whale.position.y = Math.sin((t * 0.25) % (Math.PI * 2)) * 12 - 4; }
    // sky / sun / city lights
    const sa = ((hour - 6) / 12) * Math.PI, sx = Math.cos(sa) * 450, sy = Math.sin(sa) * 450; sunLight.position.set(sx, Math.max(-50, sy), 150); sunMesh.position.set(sx, Math.max(-50, sy), 150);
    let night = 0;
    if (hour < 5.5 || hour > 19.5) { scene.background.copy(C(0x020617)); scene.fog.color.copy(C(0x091b2e)); sunLight.color.copy(C(0x93c5fd)); sunLight.intensity = 0.55; night = 1; }
    else if (hour >= 16.5) { scene.background.copy(C(0x4c1d95)); scene.fog.color.copy(C(0xf97316)); sunLight.color.copy(C(0xfb923c)); sunLight.intensity = 2.4; night = 0.5; }
    else { scene.background.copy(C(0x0284c7)); scene.fog.color.copy(C(0x38bdf8)); sunLight.color.copy(C(0xfff7ed)); sunLight.intensity = 2.2; }
    const glow = S.blackout ? 0 : night * 0.9; for (let i = 0; i < cityMats.length; i++) cityMats[i].emissiveIntensity = glow * (0.4 + ((i * 37) % 10) / 14);
    lantern.visible = lhSpot.visible = night > 0;
    // devices motion + beacons
    const wind = env.windSpeedKts, tide = env.tidalCurrentSpeedKts, Hs = env.significantWaveHeightM;
    devGroup.children.forEach((c, i) => {
      const dev = S.devices[i]; if (!dev) return;
      const rot = c.getObjectByName("rotor"); if (rot) rot.rotation.z += 0.05 * Math.max(0.6, wind * 0.15) * (dev.currentOutputKW > 0 ? 1 : 0.15) * dt * 60;
      const tb = c.getObjectByName("tidal_blades"); if (tb) tb.rotation.x += 0.06 * Math.max(0.8, tide * 0.4) * dt * 60;
      const bf = c.getObjectByName("buoy_float"); if (bf) bf.position.y = Math.sin(t * 3.5 + c.position.x) * (1 + Hs * 0.8);
      const ow = c.getObjectByName("owc_rotor"); if (ow) ow.rotation.y += 0.2 * dt * 60 * Math.min(1.5, Hs * 0.5);
      const at = c.getObjectByName("attenuator"); if (at) { at.position.y = Math.sin(t * 2.6 + c.position.x) * 1.2; at.children.forEach((m, j) => { if (m.name.startsWith("seg")) m.rotation.y = Math.sin(t * 2.6 - j) * 0.18; }); }
      const fl = c.getObjectByName("flap"); if (fl) fl.rotation.z = Math.sin(t * 2.4 + c.position.x) * (0.18 + Hs * 0.1);
      const kt = c.getObjectByName("kite"); if (kt) { kt.position.x = Math.sin(t * 0.9) * 22; kt.position.y = 36 + Math.sin(t * 1.8) * 9; kt.rotation.z = Math.cos(t * 0.9) * 0.4; }
      const bcn = c.getObjectByName("beacon"); if (bcn) { const bad = dev.integrity < 35 || dev.biofouling > 70, warn = dev.integrity < 65 || dev.biofouling > 40; bcn.material.color.copy(C(bad ? 0xef4444 : warn ? 0xf59e0b : 0x22c55e)); const sc = 1 + (bad && !rm ? 0.35 * Math.sin(t * 8) : 0); bcn.scale.setScalar(sc); }
    });
    reefs.children.forEach(m => { if (m.userData.kelp) m.rotation.z = rm ? 0 : Math.sin(t * 1.6 + m.position.x) * 0.18; });
    if (S.pendingTech && S.pendingX != null) { ghost.visible = true; ghost.position.set(xToWorld(S.pendingX), 1, 0); ghost.material.color.copy(C(isEligible(S.pendingTech, S.pendingX) ? 0x22c55e : 0xef4444)); } else if (!S.pendingTech) ghost.visible = false;
    thermo.visible = !!S.showThermocline; water.material.opacity = S.showThermocline ? 0.55 : 0.84;
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(animate);
  return {
    kind: "webgl", preset, setTracking(v) { tracking = !!v; }, boatPos: () => boat.position.clone(),
    destroy() { destroyed = true; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); },
  };
}

/* ---------------------------------------------------------------- 2D fallback (no WebGL) */
function createFallback(container, hooks) {
  container.innerHTML = ""; const cv = document.createElement("canvas"); cv.style.cssText = "width:100%;height:100%;display:block"; cv.tabIndex = 0; container.appendChild(cv);
  const ctx = cv.getContext("2d"); let W = 800, H = 450, raf = 0, destroyed = false, hoverX = null;
  const fit = () => { const r = container.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); W = Math.max(300, r.width); H = Math.max(240, r.height); cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }; fit();
  const ro = new ResizeObserver(fit); ro.observe(container);
  const px = xr => 30 + xr * (W - 60), seaY = H * 0.34, bedY = x => seaY + 30 + (-seabedDepthAt(xToWorld(x)) / 150) * (H - seaY - 50);
  cv.addEventListener("pointermove", e => { const r = cv.getBoundingClientRect(); hoverX = (e.clientX - r.left - 30) / (W - 60); });
  cv.addEventListener("click", e => {
    const S = hooks.state(), r = cv.getBoundingClientRect(), xr = (e.clientX - r.left - 30) / (W - 60);
    if (S.pendingTech) { hooks.onPlace(S.pendingTech, Math.max(0.12, Math.min(0.94, xr)), 0); return; }
    let best = null, bd = 0.05; S.devices.forEach(d => { const dd = Math.abs(d.xRatio - xr); if (dd < bd) { bd = dd; best = d; } }); hooks.onSelect(best ? best.instanceId : null);
  });
  function draw() {
    if (destroyed) return; raf = requestAnimationFrame(draw); const S = hooks.state(), env = S.env;
    const night = S.hour < 5.5 || S.hour > 19.5; const g = ctx.createLinearGradient(0, 0, 0, seaY); g.addColorStop(0, night ? "#020617" : "#38bdf8"); g.addColorStop(1, night ? "#0b2a4a" : "#bae6fd"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, seaY);
    const sg = ctx.createLinearGradient(0, seaY, 0, H); sg.addColorStop(0, "#0284c7"); sg.addColorStop(1, "#082f49"); ctx.fillStyle = sg; ctx.fillRect(0, seaY, W, H - seaY);
    ctx.fillStyle = "#3a2f23"; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= 1.001; x += 0.02) ctx.lineTo(px(x), bedY(x)); ctx.lineTo(W, H); ctx.fill();
    [[0.12, 0.35, "shallow"], [0.35, 0.70, "continental_shelf"], [0.70, 0.94, "deep_ocean"]].forEach(([a, b, z]) => { ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.setLineDash([4, 6]); ctx.beginPath(); ctx.moveTo(px(a), seaY); ctx.lineTo(px(a), H); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = "rgba(255,255,255,.8)"; ctx.font = "600 11px system-ui"; ctx.fillText(ZONES[z].name(), px(a) + 6, seaY + 16); });
    ctx.fillStyle = night ? "#1e293b" : "#475569"; ctx.fillRect(0, seaY - 60, 36, 60);
    S.devices.forEach(d => { const t = techOf(d.techId), x = px(d.xRatio), y = t.visualDepth === "seabed" ? bedY(d.xRatio) - 8 : t.visualDepth === "midwater" ? seaY + (bedY(d.xRatio) - seaY) * 0.5 : seaY;
      ctx.fillStyle = d.instanceId === S.selectedId ? "#38bdf8" : "#f8fafc"; ctx.fillRect(x - 3, y - (t.category === "wind" ? 46 : 14), 6, t.category === "wind" ? 46 : 14); ctx.fillStyle = t.category === "wave" ? "#facc15" : t.category === "tidal" ? "#0284c7" : t.category === "solar" ? "#1e3a8a" : t.category === "storage" ? "#7c3aed" : "#10b981"; ctx.beginPath(); ctx.arc(x, y - (t.category === "wind" ? 46 : 14), 8, 0, 7); ctx.fill(); ctx.fillStyle = "#fff"; ctx.font = "10px system-ui"; ctx.textAlign = "center"; ctx.fillText(Math.round(d.currentOutputKW / 100) / 10 + " MW", x, y + 14); ctx.textAlign = "left"; });
    const B = S.boat; ctx.fillStyle = "#ea580c"; ctx.fillRect(px(B.xRatio) - 14, seaY - 8, 28, 10); ctx.fillStyle = "#facc15"; ctx.fillRect(px(B.xRatio) - 4, seaY - 18, 8, 10);
    if (S.pendingTech && hoverX != null) { ctx.fillStyle = isEligible(S.pendingTech, hoverX) ? "rgba(34,197,94,.5)" : "rgba(239,68,68,.5)"; ctx.fillRect(px(hoverX) - 12, seaY - 24, 24, 24); }
    ctx.fillStyle = "#fff"; ctx.font = "600 12px system-ui"; ctx.fillText(hooks.fallbackNote || "2D view (WebGL unavailable)", 10, H - 10);
  }
  raf = requestAnimationFrame(draw);
  return { kind: "2d", preset() {}, setTracking() {}, boatPos: () => ({ x: 0, y: 0, z: 0 }), destroy() { destroyed = true; cancelAnimationFrame(raf); ro.disconnect(); } };
}
