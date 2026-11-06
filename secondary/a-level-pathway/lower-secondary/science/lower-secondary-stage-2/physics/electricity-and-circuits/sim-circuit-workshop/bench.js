/* bench.js — Spark Workshop: shared circuit physics + hyper-real 3D bench + circuit-diagram view.
   Hyper-real 3D (CLAUDE.md §18): vendored Three.js, ACES tone mapping, soft shadows, PBR brass/glass/wood,
   procedural cutting-mat + wood textures, dust motes, glowing charge carriers. No CDN. Silent (no audio).
   The same buildRuns() layout feeds the 3D bench AND the SVG diagram (the diagram is also the no-WebGL fallback). */

export const V_CELL = 1.5, V_REF = 3.0, R_BULB = 10, BURN_P = 2.0, CAP_AH = 3.0;
const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ physics (normalised classroom model) */
export function solve(cfg) {
  const n = cfg.n, V = cfg.volts || cfg.cells * V_CELL, closed = cfg.closed !== false, broken = cfg.broken || [];
  const gapOK = cfg.gap == null || cfg.gap === "cond";
  const alive = Array.from({ length: n }, (_, i) => !broken[i]);
  const branch = new Array(n).fill(0), Vb = new Array(n).fill(0);
  let I = 0;
  if (cfg.mode === "series") {
    const loop = closed && gapOK && alive.every(Boolean);
    if (loop) { I = V / (n * R_BULB); for (let i = 0; i < n; i++) { branch[i] = I; Vb[i] = V / n; } }
  } else {
    for (let i = 0; i < n; i++) if (closed && alive[i]) { branch[i] = V / R_BULB; Vb[i] = V; I += branch[i]; }
  }
  const P = Vb.map(v => Math.pow(v / V_REF, 2));
  return { V, I, branch, Vb, P, alive, life: I > 0 ? CAP_AH / I : Infinity, loop: I > 0 };
}
export const brightnessPct = p => Math.round(p * 100);

/* ------------------------------------------------------------------ layout shared by 3D + diagram */
export function buildRuns(cfg, res) {
  const { mode, n, cells } = cfg, hasSwitch = cfg.hasSwitch !== false, hasGap = cfg.gap !== undefined && cfg.gap !== null;
  const ph = cells * 0.65 + 0.05, X0 = -5.6, ZT = -2.7, ZB = 2.7;
  const step = n <= 4 ? 2.2 : n <= 6 ? 1.8 : 1.5, scale = n > 5 ? 0.78 : 1, hw = 0.62 * scale;
  const xs = [], xsw = -3.4, xg = -3.0;
  const x0 = mode === "series" ? (hasGap ? -0.7 : (n === 1 ? 0.2 : -1.8)) : -2.0;
  for (let i = 0; i < n; i++) xs.push(x0 + i * step);
  const X1 = mode === "series" ? xs[n - 1] + 1.9 : xs[n - 1];
  const runs = [], comps = [];
  const R = (pts, I, col, draw) => runs.push({ pts, I, col, draw: draw !== false });
  const RED = 0xc9302a, BLK = 0x1b1b1e, ORG = 0xe58a1c;
  comps.push({ type: "pack", x: X0, z: 0, ph });
  if (mode === "series") {
    const I = res.I;
    let cur = [[X0, -ph - 0.2], [X0, ZT]], col = RED;
    const comp = (type, i, x, hwid) => { cur.push([x - hwid, ZT]); R(cur, I, col); R([[x - hwid, ZT], [x + hwid, ZT]], I, col, false); cur = [[x + hwid, ZT]]; comps.push({ type, i, x, z: ZT, along: "x" }); };
    if (hasGap) comp("gap", 0, xg, 0.72);
    for (let i = 0; i < n; i++) { col = i === 0 && !hasGap ? RED : ORG; if (i > 0) col = ORG; comp("bulb", i, xs[i], hw); }
    col = BLK; cur.push([X1, ZT], [X1, ZB]);
    if (hasSwitch) {
      cur.push([xsw + 0.8, ZB]); R(cur, I, col); R([[xsw + 0.8, ZB], [xsw - 0.8, ZB]], I, col, false);
      cur = [[xsw - 0.8, ZB]]; comps.push({ type: "switch", x: xsw, z: ZB });
    }
    cur.push([X0, ZB], [X0, ph + 0.2]); R(cur, I, col);
  } else {
    const alive = res.branch;
    const tail = k => { let s = 0; for (let j = k; j < n; j++) s += alive[j]; return s; };
    R([[X0, -ph - 0.2], [X0, ZT], [xs[0], ZT]], tail(0), RED);
    for (let k = 1; k < n; k++) R([[xs[k - 1], ZT], [xs[k], ZT]], tail(k), RED);
    for (let i = 0; i < n; i++) {
      R([[xs[i], ZT], [xs[i], -hw]], alive[i], ORG); R([[xs[i], -hw], [xs[i], hw]], alive[i], ORG, false);
      R([[xs[i], hw], [xs[i], ZB]], alive[i], BLK); comps.push({ type: "bulb", i, x: xs[i], z: 0, along: "z" });
    }
    for (let k = n - 1; k >= 1; k--) R([[xs[k], ZB], [xs[k - 1], ZB]], tail(k), BLK);
    if (hasSwitch) {
      R([[xs[0], ZB], [xsw + 0.8, ZB]], tail(0), BLK); R([[xsw + 0.8, ZB], [xsw - 0.8, ZB]], tail(0), BLK, false);
      R([[xsw - 0.8, ZB], [X0, ZB], [X0, ph + 0.2]], tail(0), BLK); comps.push({ type: "switch", x: xsw, z: ZB });
    } else R([[xs[0], ZB], [X0, ZB], [X0, ph + 0.2]], tail(0), BLK);
  }
  return { runs, comps, xs, X0, X1, ZT, ZB, ph, scale, extents: { xmin: X0 - 1.0, xmax: X1 + 1.0, zmin: -3.7, zmax: 3.7 } };
}

/* ------------------------------------------------------------------ SVG circuit diagram (also the no-WebGL fallback) */
const SVGNS = "http://www.w3.org/2000/svg";
export function renderDiagram(host, cfg, res, handlers) {
  const lay = buildRuns(cfg, res), W = 900, H = 430, e = lay.extents;
  const mx = x => 50 + (x - e.xmin) / (e.xmax - e.xmin) * (W - 100), mz = z => 30 + (z - e.zmin) / (e.zmax - e.zmin) * (H - 60);
  const reduced = document.documentElement.getAttribute("data-reduced-motion") === "on";
  let s = `<svg viewBox="0 0 ${W} ${H}" class="sp-diag" role="img" aria-label="Circuit diagram" xmlns="${SVGNS}"><defs><radialGradient id="spg"><stop offset="0" stop-color="#fff6c2"/><stop offset=".55" stop-color="#ffd04a"/><stop offset="1" stop-color="#ff9a1f" stop-opacity="0"/></radialGradient></defs>`;
  s += `<rect width="${W}" height="${H}" rx="14" fill="#f4f8ff"/><g stroke="#dbe6f7" stroke-width="1">`;
  for (let x = 40; x < W; x += 40) s += `<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`;
  for (let y = 40; y < H; y += 40) s += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`;
  s += `</g>`;
  lay.runs.forEach(r => {
    if (!r.draw) return;
    const d = r.pts.map((p, i) => (i ? "L" : "M") + mx(p[0]).toFixed(1) + " " + mz(p[1]).toFixed(1)).join(" ");
    s += `<path d="${d}" fill="none" stroke="#2c3e5c" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>`;
    if (r.I > 0) { const spd = 28 + 150 * r.I, dur = (16 / spd).toFixed(3); s += `<path d="${d}" fill="none" stroke="#18b6e8" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 14" class="sp-flow"${reduced ? "" : ` style="animation-duration:${dur}s"`}/>`; }
  });
  lay.comps.forEach(c => {
    const x = mx(c.x), z = mz(c.z);
    if (c.type === "pack") {
      for (let k = 0; k < cfg.cells; k++) { const zz = mz(-lay.ph + 0.65 + k * 1.3); s += `<line x1="${x - 17}" y1="${zz - 9}" x2="${x + 17}" y2="${zz - 9}" stroke="#2c3e5c" stroke-width="4"/><line x1="${x - 9}" y1="${zz + 7}" x2="${x + 9}" y2="${zz + 7}" stroke="#2c3e5c" stroke-width="8"/>`; }
      s += `<text x="${x - 30}" y="${mz(-lay.ph) - 2}" font-size="15" font-weight="800" fill="#c9302a">+</text><text x="${x - 30}" y="${mz(lay.ph) + 6}" font-size="18" font-weight="800" fill="#1b1b1e">−</text>`;
      s += `<text x="${x + 24}" y="${mz(0) + 4}" font-size="12" fill="#5b6b86" font-family="sans-serif">${cfg.cells} cell${cfg.cells > 1 ? "s" : ""} · ${(cfg.volts || cfg.cells * V_CELL).toFixed(1)} V</text>`;
    } else if (c.type === "bulb") {
      const i = c.i, p = res.P[i] || 0, glow = Math.min(1, Math.sqrt(p)), dead = !res.alive[i] && !cfg.hideBroken;
      s += `<g class="sp-hit" data-bulb="${i}" role="button" tabindex="0" aria-label="Bulb ${i + 1}${dead ? ", broken" : ""}" style="cursor:pointer">`;
      if (glow > 0.02) s += `<circle cx="${x}" cy="${z}" r="${26 + 16 * glow}" fill="url(#spg)" opacity="${(0.25 + 0.75 * glow).toFixed(2)}"/>`;
      s += `<circle cx="${x}" cy="${z}" r="17" fill="${dead ? "#c9ced8" : "#fff"}" stroke="${dead ? "#c9302a" : "#2c3e5c"}" stroke-width="3"${dead ? ' stroke-dasharray="4 3"' : ""}/>`;
      s += dead ? `<path d="M${x - 8} ${z - 8} L${x - 2} ${z - 1} M${x + 2} ${z + 1} L${x + 8} ${z + 8} M${x + 8} ${z - 8} L${x + 2} ${z - 1} M${x - 2} ${z + 1} L${x - 8} ${z + 8}" stroke="#c9302a" stroke-width="3" fill="none"/>` : `<path d="M${x - 8} ${z - 8} L${x + 8} ${z + 8} M${x + 8} ${z - 8} L${x - 8} ${z + 8}" stroke="#2c3e5c" stroke-width="3" fill="none"/>`;
      s += `<text x="${x}" y="${z + (cfg.mode === "series" ? -26 : 34)}" font-size="13" font-weight="800" text-anchor="middle" fill="#5b6b86" font-family="sans-serif">${i + 1}</text></g>`;
    } else if (c.type === "switch") {
      const open = cfg.closed === false;
      s += `<g class="sp-hit" data-switch="1" role="button" tabindex="0" aria-label="Switch, ${open ? "open" : "closed"}" style="cursor:pointer"><rect x="${x - 40}" y="${z - 22}" width="80" height="40" fill="transparent"/><circle cx="${x - 28}" cy="${z}" r="5" fill="#2c3e5c"/><circle cx="${x + 28}" cy="${z}" r="5" fill="#2c3e5c"/><line x1="${x - 28}" y1="${z}" x2="${open ? x + 14 : x + 26}" y2="${open ? z - 20 : z - 1}" stroke="#2c3e5c" stroke-width="5" stroke-linecap="round"/></g>`;
    } else if (c.type === "gap") {
      const g = cfg.gap;
      s += `<g class="sp-hit" data-gap="1" role="button" tabindex="0" aria-label="Gap in the circuit" style="cursor:pointer"><circle cx="${x - 24}" cy="${z}" r="6" fill="#fff" stroke="#2c3e5c" stroke-width="3"/><circle cx="${x + 24}" cy="${z}" r="6" fill="#fff" stroke="#2c3e5c" stroke-width="3"/>`;
      if (g && g !== "open") s += `<rect x="${x - 24}" y="${z - 6}" width="48" height="12" rx="4" fill="${g === "cond" ? "#d6a63a" : "#b9a79a"}" stroke="#2c3e5c" stroke-width="2"/>`;
      s += `<text x="${x}" y="${z - 14}" font-size="12" text-anchor="middle" fill="#5b6b86" font-family="sans-serif">${g && g !== "open" ? "" : "GAP"}</text></g>`;
    }
  });
  s += `</svg>`;
  host.innerHTML = s;
  host.querySelectorAll("[data-bulb]").forEach(g => { const f = () => handlers && handlers.onBulb && handlers.onBulb(+g.dataset.bulb); g.addEventListener("click", f); g.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); f(); } }); });
  const sw = host.querySelector("[data-switch]"); if (sw) { const f = () => handlers && handlers.onSwitch && handlers.onSwitch(); sw.addEventListener("click", f); sw.addEventListener("keydown", ev => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); f(); } }); }
  const gp = host.querySelector("[data-gap]"); if (gp) { const f = () => handlers && handlers.onGap && handlers.onGap(); gp.addEventListener("click", f); }
}

/* ------------------------------------------------------------------ WebGL */
let GL_OK = null;
export function hasWebGL() {
  if (GL_OK !== null) return GL_OK;
  try { const c = document.createElement("canvas"); GL_OK = typeof THREE !== "undefined" && !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); }
  catch (e) { GL_OK = false; }
  return GL_OK;
}
const C = hex => new THREE.Color(hex).convertSRGBToLinear();
function canvasTex(w, h, draw, repeat) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  return t;
}
function glowTex(hex) {
  return canvasTex(128, 128, (g, w, h) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, hex + "ff"); r.addColorStop(0.3, hex + "aa"); r.addColorStop(1, hex + "00"); g.fillStyle = r; g.fillRect(0, 0, w, h); });
}
function textSprite(txt, color, size) {
  const t = canvasTex(128, 128, (g, w, h) => { g.fillStyle = "rgba(10,16,28,.72)"; g.beginPath(); g.arc(64, 64, 52, 0, TAU); g.fill(); g.strokeStyle = color; g.lineWidth = 6; g.stroke(); g.fillStyle = color; g.font = "bold 70px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(txt, 64, 70); });
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); sp.scale.set(size, size, 1); sp.renderOrder = 20; return sp;
}
function roundPts(pts, r) {
  const out = [], V = (p) => new THREE.Vector3(p[0], 0.2, p[1]);
  if (pts.length < 3) return pts.map(V);
  out.push(V(pts[0]));
  for (let i = 1; i < pts.length - 1; i++) {
    const a = V(pts[i - 1]), b = V(pts[i]), c = V(pts[i + 1]);
    const d1 = a.distanceTo(b), d2 = b.distanceTo(c), k = Math.min(r, d1 / 2, d2 / 2);
    const p1 = b.clone().lerp(a, k / d1), p2 = b.clone().lerp(c, k / d2);
    for (let s = 0; s <= 6; s++) { const t = s / 6, u = 1 - t; out.push(new THREE.Vector3(u * u * p1.x + 2 * u * t * b.x + t * t * p2.x, 0.2, u * u * p1.z + 2 * u * t * b.z + t * t * p2.z)); }
  }
  out.push(V(pts[pts.length - 1]));
  return out.filter((p, i) => i === 0 || p.distanceTo(out[i - 1]) > 0.004);
}

export function createBench(host, opts) {
  if (!hasWebGL()) return null;
  opts = opts || {};
  const reduced = () => document.documentElement.getAttribute("data-reduced-motion") === "on";
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }); } catch (e) { GL_OK = false; return null; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement; canvas.className = "sp-gl"; canvas.tabIndex = 0;
  canvas.setAttribute("aria-label", opts.label || "3D circuit bench. Drag to orbit, scroll to zoom, arrow keys to rotate.");
  host.append(canvas);

  const scene = new THREE.Scene(); scene.background = C(0x0b1220); scene.fog = new THREE.Fog(C(0x0b1220), 26, 60);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  scene.add(new THREE.HemisphereLight(C(0xa9bde0), C(0x2a1a0e), 0.7));
  const key = new THREE.DirectionalLight(C(0xfff0d8), 1.5); key.position.set(-7, 14, 9); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -13, right: 13, top: 9, bottom: -9, near: 1, far: 40 }); key.shadow.bias = -0.0004; scene.add(key);
  const rim = new THREE.DirectionalLight(C(0x6aa8ff), 0.55); rim.position.set(8, 6, -10); scene.add(rim);

  /* bench dressing: wood top, green cutting mat, props */
  const wood = canvasTex(512, 512, (g, w, h) => { g.fillStyle = "#8a5a33"; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(${40 + Math.random() * 40},${20 + Math.random() * 25},8,${0.06 + Math.random() * 0.12})`; g.lineWidth = 1 + Math.random() * 2.5; const y = Math.random() * h; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(w * .3, y + (Math.random() - .5) * 14, w * .7, y + (Math.random() - .5) * 14, w, y + (Math.random() - .5) * 8); g.stroke(); } }, [3, 1.6]);
  const bench = new THREE.Mesh(new THREE.BoxGeometry(34, 0.8, 16), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.62, metalness: 0.02 }));
  bench.position.set(0, -0.41, 0); bench.receiveShadow = true; scene.add(bench);
  const matTex = canvasTex(512, 256, (g, w, h) => { g.fillStyle = "#1f6b4e"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(255,255,255,.22)"; g.lineWidth = 1; for (let x = 0; x <= w; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); } for (let y = 0; y <= h; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); } g.strokeStyle = "rgba(255,255,255,.45)"; g.lineWidth = 3; g.strokeRect(2, 2, w - 4, h - 4); });
  const mat = new THREE.Mesh(new THREE.PlaneGeometry(26, 9.6), new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.85 })); mat.rotation.x = -Math.PI / 2; mat.position.y = 0.01; mat.receiveShadow = true; scene.add(mat);
  const pegTex = canvasTex(256, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#16273d"); gr.addColorStop(1, "#0b1424"); g.fillStyle = gr; g.fillRect(0, 0, w, h); g.fillStyle = "rgba(255,255,255,.1)"; for (let x = 16; x < w; x += 32) for (let y = 16; y < h; y += 32) { g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); } }, [14, 5]);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(70, 24), new THREE.MeshStandardMaterial({ map: pegTex, roughness: 0.9 })); wall.position.set(0, 10, -9); wall.receiveShadow = true; scene.add(wall);
  const props = new THREE.Group(); scene.add(props);
  const steel = new THREE.MeshStandardMaterial({ color: C(0x9aa3ad), metalness: 0.95, roughness: 0.3 });
  const spool = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.28, 14, 30), new THREE.MeshStandardMaterial({ color: C(0xb9672a), metalness: 0.9, roughness: 0.35 })); spool.rotation.x = Math.PI / 2; spool.position.set(9.6, 0.3, 3.4); spool.castShadow = true; props.add(spool);
  for (let i = 0; i < 2; i++) { const j = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 0.34), steel); j.position.set(-9.5 + i * 0.1, 0.12, 3.6 - i * 0.3); j.rotation.y = 0.5 - i * 1.0; j.castShadow = true; props.add(j); }
  const driver = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 2.2, 16), new THREE.MeshStandardMaterial({ color: C(0xe0b21f), roughness: 0.4 })); driver.rotation.z = Math.PI / 2; driver.position.set(-9.2, 0.18, -3.4); driver.castShadow = true; props.add(driver);
  const dustN = 140, dustPos = new Float32Array(dustN * 3), dustSeed = [];
  for (let i = 0; i < dustN; i++) { dustPos[i * 3] = (Math.random() - .5) * 26; dustPos[i * 3 + 1] = 0.5 + Math.random() * 7; dustPos[i * 3 + 2] = (Math.random() - .5) * 14; dustSeed.push(Math.random() * TAU); }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.07, map: glowTex("#ffe9b8"), transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending })); scene.add(dust);

  /* shared materials */
  const brass = new THREE.MeshStandardMaterial({ color: C(0xd8a93f), metalness: 1, roughness: 0.32 });
  const plastic = new THREE.MeshStandardMaterial({ color: C(0x16181d), roughness: 0.5, metalness: 0.1 });
  const glassMat = new THREE.MeshPhysicalMaterial({ color: C(0xffffff), transparent: true, opacity: 0.26, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, side: THREE.DoubleSide, depthWrite: false });
  const glowSpriteTex = glowTex("#ffc15e"), haloTex = glowTex("#ffb347"), eTex = glowTex("#7fe6ff"), smokeTex = glowTex("#9aa0aa");
  const cellTex = canvasTex(256, 128, (g, w, h) => { g.fillStyle = "#12331f"; g.fillRect(0, 0, w, h); g.fillStyle = "#e8c15a"; g.fillRect(0, 18, w, 12); g.fillRect(0, h - 30, w, 12); g.fillStyle = "#fff"; g.font = "bold 38px sans-serif"; g.textAlign = "center"; g.fillText("1.5 V", w / 2, 78); g.font = "bold 20px sans-serif"; g.fillText("CELL", w / 2, 106); });

  let world = null, S = null, cfg = null, res = null, lastKey = "", electrons = null, ePos = null, fx = [], dragged = false;
  const hits = []; const bulbs = [];
  const sw = { lever: null, target: 0, cur: 0 }, gapObj = { group: null, key: null, drop: 1 };
  const target = new THREE.Vector3(0, 0.6, 0);
  const orbit = { th: 0.0, ph: 0.92, r: 15, auto: !reduced(), idle: 0, punch: 0 };

  function clearWorld() {
    if (world) { scene.remove(world); world.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    world = new THREE.Group(); scene.add(world); hits.length = 0; bulbs.length = 0; sw.lever = null; gapObj.group = null;
  }
  function makeBulb(i, scale) {
    const g = new THREE.Group(), L = {};
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.32, 28), plastic); base.position.y = 0.16; base.castShadow = true; g.add(base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 10, 28), brass); ring.rotation.x = Math.PI / 2; ring.position.y = 0.34; g.add(ring);
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.36, 24), brass); collar.position.y = 0.52; collar.castShadow = true; g.add(collar);
    for (let k = 0; k < 4; k++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 24), brass); t.rotation.x = Math.PI / 2; t.position.y = 0.4 + k * 0.09; g.add(t); }
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.34, 24, 1, true), glassMat); neck.position.y = 0.88; g.add(neck);
    L.glass = new THREE.Mesh(new THREE.SphereGeometry(0.54, 36, 26), glassMat.clone()); L.glass.position.y = 1.28; g.add(L.glass);
    const fm = new THREE.MeshStandardMaterial({ color: C(0x3a3a3a), emissive: C(0xffa63a), emissiveIntensity: 0, metalness: 0.8, roughness: 0.4 });
    L.fil = new THREE.Group(); const coil = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 8, 22), fm); coil.rotation.y = Math.PI / 2; coil.position.y = 1.18; L.fil.add(coil);
    const leg1 = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.55, 6), fm); leg1.position.set(0, 0.92, -0.1); L.fil.add(leg1);
    const leg2 = leg1.clone(); leg2.position.z = 0.1; L.fil.add(leg2); g.add(L.fil); L.fm = fm; L.coil = coil;
    L.glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSpriteTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 })); L.glow.position.y = 1.28; g.add(L.glow);
    L.halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0, toneMapped: false })); L.halo.rotation.x = -Math.PI / 2; L.halo.position.y = 0.025; g.add(L.halo);
    L.light = new THREE.PointLight(C(0xffc36b), 0, 9, 2); L.light.position.y = 1.4; g.add(L.light);
    const lab = textSprite(String(i + 1), "#ffd24d", 0.5); lab.position.y = 2.25; g.add(lab);
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.95, 10, 8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.9; hit.userData = { bulb: i }; g.add(hit); hits.push(hit);
    g.scale.setScalar(scale); L.group = g; L.glowCur = 0; L.alive = true; L.wasAlive = true; L.smokeT = 0; return L;
  }
  function makeSwitch() {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.22, 1.1), new THREE.MeshStandardMaterial({ color: C(0x2b2f38), roughness: 0.55 })); base.position.y = 0.11; base.castShadow = true; base.receiveShadow = true; g.add(base);
    [-0.85, 0.85].forEach(x => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.34, 18), brass); p.position.set(x, 0.38, 0); p.castShadow = true; g.add(p); });
    const lever = new THREE.Group(); lever.position.set(0.85, 0.42, 0);
    const blade = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.07, 0.24), brass); blade.position.set(-0.85, 0, 0); blade.castShadow = true; lever.add(blade);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.62, 14), new THREE.MeshStandardMaterial({ color: C(0xc9302a), roughness: 0.45 })); handle.position.set(-1.1, 0.32, 0); handle.castShadow = true; lever.add(handle);
    g.add(lever); sw.lever = lever;
    const lab = textSprite("S", "#7fe6ff", 0.5); lab.position.set(0, 1.6, 0); g.add(lab);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 1.6), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.6; hit.userData = { sw: 1 }; g.add(hit); hits.push(hit);
    return g;
  }
  function gapObject(kind) {
    const g = new THREE.Group(); let m;
    const silver = new THREE.MeshStandardMaterial({ color: C(0xc7ccd4), metalness: 1, roughness: 0.28 });
    if (kind === "wire") { m = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.07, 10, 28, Math.PI), new THREE.MeshStandardMaterial({ color: C(0xb9672a), metalness: 1, roughness: 0.3 })); m.position.y = 0.18; }
    else if (kind === "coin") { m = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.09, 36), new THREE.MeshStandardMaterial({ color: C(0xd6a64a), metalness: 1, roughness: 0.3 })); m.position.y = 0.3; m.rotation.z = Math.PI / 2 - 0.15; m.scale.set(1, 1, 1); }
    else if (kind === "clip") { m = new THREE.Group(); [0.6, 0.42].forEach((r, i) => { const t = new THREE.Mesh(new THREE.TorusGeometry(0.2 + i * 0.1, 0.03, 8, 20), silver); t.scale.set(2.3 - i * 0.7, 1, 1); t.rotation.x = Math.PI / 2; t.position.set(0, 0.26 + i * 0.04, 0); m.add(t); }); }
    else if (kind === "foil") { m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 1), new THREE.MeshStandardMaterial({ color: C(0xe3e7ee), metalness: 1, roughness: 0.22, flatShading: true })); m.position.y = 0.4; m.scale.set(1.5, 0.8, 0.9); }
    else if (kind === "eraser") { m = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.4, 0.55), new THREE.MeshStandardMaterial({ color: C(0xe98bb0), roughness: 0.9 })); m.position.y = 0.22; }
    else if (kind === "ruler") { m = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.32), new THREE.MeshPhysicalMaterial({ color: C(0xff7aa8), transparent: true, opacity: 0.8, roughness: 0.2, clearcoat: 0.8 })); m.position.y = 0.2; }
    else { m = new THREE.Group(); const h = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.4, 10), new THREE.MeshStandardMaterial({ color: C(0xb98550), roughness: 0.7 })); h.rotation.z = Math.PI / 2; m.add(h); const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), h.material); b.scale.set(0.9, 0.4, 0.8); b.position.x = 0.75; m.add(b); m.position.y = 0.2; }
    m.traverse(o => { if (o.isMesh) o.castShadow = true; }); g.add(m); return g;
  }

  function rebuild() {
    clearWorld();
    const lay = S = buildRuns(cfg, res);
    /* wires + flow lines */
    lay.runs.forEach(r => {
      if (r.draw) {
        const pts = roundPts(r.pts, 0.5), curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
        const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(10, pts.length * 2), 0.085, 10, false), new THREE.MeshStandardMaterial({ color: C(r.col), roughness: 0.42, metalness: 0.05 }));
        tube.castShadow = true; world.add(tube);
        [pts[0], pts[pts.length - 1]].forEach(p => { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 12), brass); e.position.copy(p); e.rotation.z = Math.PI / 2; world.add(e); });
        r.curve = curve;
      } else r.curve = new THREE.LineCurve3(new THREE.Vector3(r.pts[0][0], 0.2, r.pts[0][1]), new THREE.Vector3(r.pts[1][0], 0.2, r.pts[1][1]));
      r.len = r.curve.getLength() || 1; r.sp = r.curve.getSpacedPoints(Math.max(6, Math.round(r.len * 6) || 6)); if (!r.sp.length) r.sp = [r.curve.getPoint(0), r.curve.getPoint(1)]; r.off = Math.random();
    });
    /* components */
    lay.comps.forEach(c => {
      if (c.type === "pack") {
        const L = cfg.cells * 1.3 + 0.35, tray = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.22, L), plastic); tray.position.set(c.x, 0.11, 0); tray.castShadow = tray.receiveShadow = true; world.add(tray);
        for (let k = 0; k < cfg.cells; k++) {
          const z = -lay.ph + 0.65 + k * 1.3, body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.22, 28), new THREE.MeshStandardMaterial({ map: cellTex, metalness: 0.45, roughness: 0.38 }));
          body.rotation.x = Math.PI / 2; body.rotation.z = Math.PI; body.position.set(c.x, 0.5, z); body.castShadow = true; world.add(body);
          const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 18), brass); cap.rotation.x = Math.PI / 2; cap.position.set(c.x, 0.5, z - 0.64); world.add(cap);
        }
        const p = textSprite("+", "#ff6b5e", 0.5); p.position.set(c.x - 0.75, 0.9, -lay.ph - 0.1); world.add(p);
        const m = textSprite("−", "#d9dde6", 0.5); m.position.set(c.x - 0.75, 0.9, lay.ph + 0.1); world.add(m);
        if (!cfg.volts) { const volt = textSprite((cfg.cells * V_CELL).toFixed(1) + "V", "#7fe6ff", 0.75); volt.position.set(c.x + 1.1, 1.3, 0); world.add(volt); }
      } else if (c.type === "bulb") {
        const L = makeBulb(c.i, lay.scale); L.group.position.set(c.x, 0, c.z); world.add(L.group); bulbs[c.i] = L; L.alive = res.alive[c.i]; L.wasAlive = L.alive;
        if (!L.alive && !cfg.hideBroken) markBroken(L, true);
      } else if (c.type === "switch") {
        const g = makeSwitch(); g.position.set(c.x, 0, c.z); world.add(g); sw.cur = sw.target = cfg.closed === false ? 1 : 0; sw.lever.rotation.z = -sw.cur * 1.1;
      } else if (c.type === "gap") {
        const g = new THREE.Group(); g.position.set(c.x, 0, c.z);
        [-0.72, 0.72].forEach(sx => { const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.5), new THREE.MeshStandardMaterial({ color: C(sx < 0 ? 0xc9302a : 0x1b1b1e), roughness: 0.5 })); jaw.position.set(sx, 0.2, 0); jaw.castShadow = true; g.add(jaw); const tip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.1, 0.34), brass); tip.position.set(sx * 0.78, 0.26, 0); g.add(tip); });
        const hit = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 1.4), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 0.5; hit.userData = { gap: 1 }; g.add(hit); hits.push(hit);
        const lab = textSprite("?", "#ffd24d", 0.62); lab.position.y = 1.5; g.add(lab); gapObj.label = lab;
        world.add(g); gapObj.group = g; gapObj.slot = new THREE.Group(); g.add(gapObj.slot); gapObj.key = null;
        setGapObject(cfg.gapKind || null, true);
      }
    });
    /* electrons */
    const total = Math.min(2400, lay.runs.reduce((a, r) => a + Math.max(2, Math.round(r.len / 0.55)), 0) + 10);
    ePos = new Float32Array(total * 3); const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(ePos, 3)); geo.setDrawRange(0, 0);
    electrons = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.3, map: eTex, color: C(0x8feaff), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
    electrons.frustumCulled = false; world.add(electrons);
    fitCamera();
  }
  function markBroken(L, instant) {
    L.glass.material.opacity = 0.62; L.glass.material.color = C(0x2a2a2e); L.fil.rotation.z = 0.5; L.fil.position.y = -0.04;
    if (!instant) L.smokeT = 1.4;
  }
  function setGapObject(kind, silent) {
    if (!gapObj.group) return;
    while (gapObj.slot.children.length) gapObj.slot.remove(gapObj.slot.children[0]);
    gapObj.key = kind; if (gapObj.label) gapObj.label.visible = !kind;
    if (kind) { const o = gapObject(kind); gapObj.slot.add(o); gapObj.drop = silent ? 0 : 1; gapObj.obj = o; }
  }
  function fitCamera() {
    const e = S.extents, w = host.clientWidth || 800, h = host.clientHeight || 450, asp = w / h;
    target.set((e.xmin + e.xmax) / 2, 0.5, 0);
    orbit.r = Math.max(15, (e.xmax - e.xmin) * 0.95 / Math.min(asp, 1.7), 18 / asp);
    camera.aspect = asp; camera.updateProjectionMatrix();
  }
  function resize() {
    const w = host.clientWidth || 800, h = host.clientHeight || 450; renderer.setSize(w, h, false); if (S) fitCamera(); else { camera.aspect = w / h; camera.updateProjectionMatrix(); }
  }
  window.addEventListener("resize", resize);

  /* orbit controls: cumulative-travel tap/drag threshold, native click for picking (CLAUDE.md §4) */
  const ptr = { down: false, x: 0, y: 0, travel: 0 };
  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", e => { ptr.down = true; ptr.x = e.clientX; ptr.y = e.clientY; ptr.travel = 0; dragged = false; orbit.auto = false; orbit.idle = 0; try { canvas.setPointerCapture(e.pointerId); } catch (_) { } });
  canvas.addEventListener("pointermove", e => {
    if (ptr.down) { const dx = e.clientX - ptr.x, dy = e.clientY - ptr.y; ptr.x = e.clientX; ptr.y = e.clientY; ptr.travel += Math.abs(dx) + Math.abs(dy); if (ptr.travel > 8) { dragged = true; orbit.th -= dx * 0.006; orbit.ph = Math.min(1.35, Math.max(0.25, orbit.ph - dy * 0.005)); } }
    else { const h = pick(e); canvas.style.cursor = h ? "pointer" : "grab"; }
  });
  const up = () => { ptr.down = false; };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("wheel", e => { e.preventDefault(); orbit.r = Math.min(34, Math.max(7, orbit.r * (1 + Math.sign(e.deltaY) * 0.08))); orbit.auto = false; }, { passive: false });
  canvas.addEventListener("keydown", e => { const k = e.key; if (k === "ArrowLeft") orbit.th += 0.12; else if (k === "ArrowRight") orbit.th -= 0.12; else if (k === "ArrowUp") orbit.ph = Math.max(0.25, orbit.ph - 0.08); else if (k === "ArrowDown") orbit.ph = Math.min(1.35, orbit.ph + 0.08); else if (k === "+" || k === "=") orbit.r = Math.max(7, orbit.r * 0.92); else if (k === "-") orbit.r = Math.min(34, orbit.r * 1.08); else return; e.preventDefault(); orbit.auto = false; });
  const ray = new THREE.Raycaster(), nd = new THREE.Vector2();
  function pick(e) {
    const r = canvas.getBoundingClientRect(); nd.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(nd, camera); const h = ray.intersectObjects(hits, false); return h.length ? h[0].object.userData : null;
  }
  canvas.addEventListener("click", e => {
    if (dragged) { dragged = false; return; }
    const u = pick(e); if (!u || !opts) return;
    if (u.bulb !== undefined && opts.onBulb) opts.onBulb(u.bulb); else if (u.sw && opts.onSwitch) opts.onSwitch(); else if (u.gap && opts.onGap) opts.onGap();
  });
  canvas.addEventListener("webglcontextlost", e => { e.preventDefault(); if (opts.onLost) opts.onLost(); });

  /* frame loop (cosmetic only — game state lives outside, on setInterval/events) */
  let raf = 0, last = performance.now(), visible = true, t0 = last, running = true;
  const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(en => { visible = en[0].isIntersecting; }) : null; if (io) io.observe(host);
  function addSmoke(L) {
    const p = L.group.getWorldPosition(new THREE.Vector3()); p.y += 1.5;
    for (let i = 0; i < 9; i++) {
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, opacity: 0.5, depthWrite: false })); s.position.copy(p).add(new THREE.Vector3((Math.random() - .5) * 0.5, Math.random() * 0.3, (Math.random() - .5) * 0.5)); s.scale.setScalar(0.4); scene.add(s);
      const vy = 0.8 + Math.random() * 0.7, vx = (Math.random() - .5) * 0.5; let age = -i * 0.08;
      fx.push(dt => { age += dt; if (age < 0) return true; s.position.y += vy * dt; s.position.x += vx * dt; s.scale.setScalar(0.4 + age * 1.6); s.material.opacity = Math.max(0, 0.5 - age * 0.4); if (age > 1.3) { scene.remove(s); s.material.dispose(); return false; } return true; });
    }
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!running || !visible || !S) return;
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; const tt = (now - t0) / 1000;
    if (!ptr.down) { orbit.idle += dt; if (orbit.idle > 9 && !reduced()) orbit.auto = true; }
    if (orbit.auto && !reduced()) orbit.th += dt * 0.06;
    let rr = orbit.r * (1 - 0.07 * orbit.punch); orbit.punch = Math.max(0, orbit.punch - dt * 2.2);
    camera.position.set(target.x + rr * Math.sin(orbit.ph) * Math.sin(orbit.th), target.y + rr * Math.cos(orbit.ph), target.z + rr * Math.sin(orbit.ph) * Math.cos(orbit.th)); camera.lookAt(target);
    /* bulbs: smooth glow, filament, light */
    bulbs.forEach((L, i) => {
      if (!L) return;
      const tg = res.alive[i] ? Math.min(1.25, Math.sqrt(res.P[i] || 0)) : 0;
      L.glowCur += (tg - L.glowCur) * Math.min(1, dt * 7); const g = L.glowCur;
      L.fm.emissiveIntensity = g * 2.4; L.light.intensity = g * 1.7; L.glow.material.opacity = Math.min(0.8, g * 0.7); L.glow.scale.setScalar(0.8 + g * 1.1);
      L.halo.material.opacity = Math.min(0.55, g * 0.5); L.halo.scale.setScalar(2.0 + g * 2.4);
      if (L.smokeT > 0) { L.smokeT -= dt; }
    });
    /* switch lever + gap object drop */
    sw.cur += (sw.target - sw.cur) * Math.min(1, dt * 12); if (sw.lever) sw.lever.rotation.z = -sw.cur * 1.1;
    if (gapObj.group && gapObj.obj) { gapObj.drop = Math.max(0, gapObj.drop - dt * 3.2); gapObj.slot.position.y = gapObj.drop * gapObj.drop * 1.6; }
    /* electrons */
    let cnt = 0;
    S.runs.forEach(r => {
      if (!(r.I > 0)) return;
      const spacing = 0.55, nDots = Math.max(2, Math.round(r.len / spacing)), speed = 1.0 + 7 * r.I; r.off = (r.off + dt * speed / r.len) % 1;
      const sp = r.sp, m = sp.length - 1; if (!sp[0]) return;
      for (let k = 0; k < nDots; k++) {
        const u = (((k / nDots) + r.off) % 1 + 1) % 1, f = u * m, a = Math.floor(f), b = Math.min(m, a + 1), q = f - a, P0 = sp[a], P1 = sp[b];
        if (cnt * 3 + 2 >= ePos.length) break;
        ePos[cnt * 3] = P0.x + (P1.x - P0.x) * q; ePos[cnt * 3 + 1] = P0.y + (P1.y - P0.y) * q + 0.16; ePos[cnt * 3 + 2] = P0.z + (P1.z - P0.z) * q; cnt++;
      }
    });
    electrons.geometry.attributes.position.needsUpdate = true; electrons.geometry.setDrawRange(0, cnt);
    /* dust + fx */
    const dp = dustGeo.attributes.position; for (let i = 0; i < dustN; i++) { dp.array[i * 3 + 1] += Math.sin(tt * 0.4 + dustSeed[i]) * 0.0016; dp.array[i * 3] += Math.cos(tt * 0.3 + dustSeed[i]) * 0.0012; } dp.needsUpdate = true;
    fx = fx.filter(f => f(dt));
    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);
  new ResizeObserver(resize).observe(host); resize();

  return {
    canvas,
    get result() { return res; },
    set(next) {
      cfg = Object.assign({}, next); res = solve(cfg);
      const keyStr = [cfg.mode, cfg.n, cfg.cells, cfg.volts || 0, cfg.hasSwitch !== false, cfg.gap === undefined || cfg.gap === null ? "n" : "g"].join("|");
      if (keyStr !== lastKey || !S) { lastKey = keyStr; rebuild(); }
      else {
        S = Object.assign(S, { runs: S.runs }); const lay = buildRuns(cfg, res);
        lay.runs.forEach((r, i) => { S.runs[i].I = r.I; });
        bulbs.forEach((L, i) => { if (!L) return; const al = res.alive[i]; if (!al && L.wasAlive && !cfg.hideBroken) { markBroken(L, false); addSmoke(L); } if (al && !L.wasAlive) { L.glass.material.opacity = 0.26; L.glass.material.color = C(0xffffff); L.fil.rotation.z = 0; L.fil.position.y = 0; } L.wasAlive = al; L.alive = al; });
        sw.target = cfg.closed === false ? 1 : 0;
        if (gapObj.group && cfg.gapKind !== gapObj.key) setGapObject(cfg.gapKind || null, false);
      }
      return res;
    },
    burn(i) { const L = bulbs[i]; if (L) { addSmoke(L); } },
    punch() { if (!reduced()) orbit.punch = 1; },
    setPaused(p) { running = !p; },
    destroy() { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); if (io) io.disconnect(); renderer.dispose(); canvas.remove(); }
  };
}
