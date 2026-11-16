/* Selective Breeding Ranch - 3D scene (Three.js, vendored). It only READS the model; clicking animals, plants and buildings calls rt.onPick. */
export async function initScene(view, g, rt, M, opt) {
  const THREE = window.THREE, reduced = opt.reduced;
  let gl = null; try { const c = document.createElement("canvas"); gl = c.getContext("webgl2") || c.getContext("webgl"); } catch (e) {}
  if (!gl) return null;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputEncoding = THREE.sRGBEncoding; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  view.prepend(renderer.domElement); const cv = renderer.domElement; cv.style.touchAction = "none";
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x7fb8e6); scene.fog = new THREE.Fog(0x9cc8ea, 90, 230);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 500);
  const C = h => new THREE.Color(h).convertSRGBToLinear();
  let seed = 5; const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const tex = (w, h, draw, rep) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; if (rep) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; };
  const S = (o) => new THREE.MeshStandardMaterial(o);
  const box = (w, h, d, m, x, y, z, par, shadow = true) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = shadow; o.receiveShadow = true; if (par) par.add(o); return o; };
  const cyl = (rt_, rb, h, m, x, y, z, par, seg = 14) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt_, rb, h, seg), m); o.position.set(x, y, z); o.castShadow = true; if (par) par.add(o); return o; };
  const sph = (r, m, x, y, z, par, sx = 1, sy = 1, sz = 1) => { const o = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.castShadow = true; if (par) par.add(o); return o; };
  try { const es = new THREE.Scene(); es.background = new THREE.Color(0x9cc8ea); [[0, 9, 0, 18, .5, 18, 0xffffff, 2], [-14, 3, 2, .5, 6, 12, 0xcfe8ff, 1.4], [14, 3, 2, .5, 6, 12, 0xfff0cf, 1.4]].forEach(p => es.add(Object.assign(new THREE.Mesh(new THREE.BoxGeometry(p[3], p[4], p[5]), new THREE.MeshBasicMaterial({ color: new THREE.Color(p[6]).multiplyScalar(p[7]) })), { position: new THREE.Vector3(p[0], p[1], p[2]) }))); const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(es, 0.04).texture; pm.dispose(); } catch (e) {}

  /* ---------- textures & materials ---------- */
  const grassTex = tex(512, 512, (x, w, h) => { x.fillStyle = "#4a8a3a"; x.fillRect(0, 0, w, h); for (let i = 0; i < 16000; i++) { x.fillStyle = `hsla(${85 + rand() * 40},55%,${24 + rand() * 24}%,.5)`; x.fillRect(rand() * w, rand() * h, 2, 5); } }, [34, 26]);
  const dirtTex = tex(256, 256, (x, w, h) => { x.fillStyle = "#6a5236"; x.fillRect(0, 0, w, h); for (let i = 0; i < 3000; i++) { x.fillStyle = `rgba(${80 + rand() * 60},${60 + rand() * 40},${35 + rand() * 25},.6)`; x.fillRect(rand() * w, rand() * h, 3, 3); } }, [8, 8]);
  const redBoard = tex(256, 256, (x, w, h) => { x.fillStyle = "#a3281e"; x.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(i * 16, 0, 2, h); } for (let i = 0; i < 700; i++) { x.fillStyle = `rgba(255,255,255,${rand() * .05})`; x.fillRect(rand() * w, rand() * h, 2, 18); } }, [4, 2]);
  const woodTex = tex(256, 256, (x, w, h) => { x.fillStyle = "#9c6b3c"; x.fillRect(0, 0, w, h); for (let i = 0; i < 900; i++) { x.fillStyle = `rgba(${70 + rand() * 50},${40 + rand() * 30},20,.35)`; x.fillRect(rand() * w, rand() * h, 40, 2); } for (let k = 0; k < 8; k++) { x.fillStyle = "rgba(0,0,0,.3)"; x.fillRect(0, k * 32, w, 2); } }, [3, 1]);
  const metalTex = tex(256, 256, (x, w, h) => { x.fillStyle = "#cfd6dc"; x.fillRect(0, 0, w, h); for (let i = 0; i < 32; i++) { x.fillStyle = i % 2 ? "rgba(0,0,0,.12)" : "rgba(255,255,255,.18)"; x.fillRect(i * 8, 0, 4, h); } }, [6, 2]);
  const concTex = tex(256, 256, (x, w, h) => { x.fillStyle = "#b6b9bb"; x.fillRect(0, 0, w, h); for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(${90 + rand() * 80},${90 + rand() * 80},${90 + rand() * 80},.35)`; x.fillRect(rand() * w, rand() * h, 2, 2); } }, [8, 8]);
  const spots = [0, 1, 2].map(k => tex(256, 128, (x, w, h) => { x.fillStyle = ["#f4f4f0", "#c98b55", "#f1e7d6"][k]; x.fillRect(0, 0, w, h); x.fillStyle = ["#1c1c1c", "#fbf3e6", "#7a4a2a"][k]; for (let i = 0; i < 7; i++) { x.beginPath(); x.ellipse(rand() * w, rand() * h, 14 + rand() * 26, 10 + rand() * 18, rand() * 3, 0, 6.3); x.fill(); } }));
  const woolTex = tex(128, 128, (x, w, h) => { x.fillStyle = "#f2efe6"; x.fillRect(0, 0, w, h); for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(${200 + rand() * 50},${195 + rand() * 50},${180 + rand() * 40},.5)`; x.beginPath(); x.arc(rand() * w, rand() * h, 3 + rand() * 5, 0, 6.3); x.fill(); } });
  const emoji = (ch) => { const t = tex(128, 128, (x, w, h) => { x.font = "92px serif"; x.textAlign = "center"; x.textBaseline = "middle"; x.fillText(ch, w / 2, h / 2 + 6); }); return t; };
  const signTex = (txt, bg, fg, w = 512, h = 128) => tex(w, h, (x, ww, hh) => { x.fillStyle = bg; x.fillRect(0, 0, ww, hh); x.strokeStyle = fg; x.lineWidth = 8; x.strokeRect(8, 8, ww - 16, hh - 16); x.fillStyle = "#fff"; x.textAlign = "center"; let fs = 58; x.font = `bold ${fs}px Arial`; while (x.measureText(txt).width > ww - 50 && fs > 20) { fs -= 3; x.font = `bold ${fs}px Arial`; } x.fillText(txt, ww / 2, hh / 2 + fs * .35); });
  const forSale = (price, label) => { const t = tex(512, 340, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = "rgba(255,226,120,.95)"; x.lineWidth = 8; x.setLineDash([26, 18]); x.strokeRect(10, 10, w - 20, h - 20); x.setLineDash([]); x.fillStyle = "rgba(255,226,120,.95)"; x.textAlign = "center"; x.font = "bold 50px Arial"; x.fillText(label, w / 2, h / 2 - 10); x.font = "bold 40px Arial"; x.fillText("FOR SALE", w / 2, h / 2 + 50); }); return t; };

  /* ---------- world ---------- */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(420, 320), S({ map: grassTex, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const addPatch = (x, z, w, d, m) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, 0.03, z); p.receiveShadow = true; scene.add(p); return p; };
  const dirtM = S({ map: dirtTex, roughness: 1 }), concM = S({ map: concTex, roughness: .9 });
  addPatch(-41, -19, 36, 32, dirtM); addPatch(-1, -19, 34, 32, dirtM); addPatch(-41, 10, 80, 16, concM); addPatch(28, 17, 44, 22, concM);
  for (let i = 0; i < 9; i++) { const h = new THREE.Mesh(new THREE.SphereGeometry(16 + rand() * 14, 22, 12, 0, 6.3, 0, 1.5), S({ color: C(i % 2 ? 0x3b7a3a : 0x4f8f45), roughness: 1 })); h.position.set(-120 + i * 32, -2, -110 - rand() * 14); h.scale.y = .5; scene.add(h); }
  for (let i = 0; i < 38; i++) { const t = new THREE.Group(); cyl(.3, .4, 2.4, S({ color: C(0x5a3f2a) }), 0, 1.2, 0, t, 6); sph(1.8 + rand() * 1.1, S({ color: C(0x2f7a34), roughness: 1 }), 0, 3.6, 0, t); t.position.set(-110 + i * 6 + rand() * 3, 0, -62 - rand() * 18); scene.add(t); }
  const road = new THREE.Mesh(new THREE.PlaneGeometry(420, 6), S({ color: C(0x3a3d42), roughness: .95 })); road.rotation.x = -Math.PI / 2; road.position.set(0, .04, 38); road.receiveShadow = true; scene.add(road);
  for (let i = -100; i <= 100; i += 6) { const d = new THREE.Mesh(new THREE.PlaneGeometry(2.2, .2), new THREE.MeshBasicMaterial({ color: 0xe8e2c0 })); d.rotation.x = -Math.PI / 2; d.position.set(i, .05, 38); scene.add(d); }
  const hemi = new THREE.HemisphereLight(0xcfe8ff, 0x3a5a30, 0.6); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2d6, 1.5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.05;
  Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 50, bottom: -50, near: 1, far: 200 }); scene.add(sun); scene.add(sun.target);
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(5, 20, 14), new THREE.MeshBasicMaterial({ color: 0xfff3b0 })); scene.add(sunBall);
  const clouds = []; const cmat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, transparent: true, opacity: .9 });
  for (let i = 0; i < 8; i++) { const cg = new THREE.Group(); for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.SphereGeometry(3 + rand() * 2, 12, 8), cmat); b.position.set(k * 3 - 6, rand(), rand() * 3); b.scale.y = .6; cg.add(b); } cg.position.set(-140 + i * 36, 40 + rand() * 10, -30 + rand() * 60); scene.add(cg); clouds.push(cg); }

  /* ---------- fences ---------- */
  const fenceM = S({ map: woodTex, roughness: .9 });
  function fenceRect(x0, z0, x1, z1) { const g_ = new THREE.Group(); const post = (x, z) => box(.25, 1.6, .25, fenceM, x, .8, z, g_); const rail = (xa, za, xb, zb) => { const len = Math.hypot(xb - xa, zb - za), r = box(len, .18, .1, fenceM, (xa + xb) / 2, 1.2, (za + zb) / 2, g_, false); r.rotation.y = -Math.atan2(zb - za, xb - xa); const r2 = r.clone(); r2.position.y = .7; g_.add(r2); };
    const pts_ = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; pts_.forEach((p, i) => { const q = pts_[(i + 1) % 4], n = Math.max(1, Math.round(Math.hypot(q[0] - p[0], q[1] - p[1]) / 4)); for (let k = 0; k < n; k++) post(p[0] + (q[0] - p[0]) * k / n, p[1] + (q[1] - p[1]) * k / n); rail(p[0], p[1], q[0], q[1]); }); scene.add(g_); }
  const COWBOX = [-58, -35, -24, -4], SHEEPBOX = [-16, -35, 14, -4];
  fenceRect(COWBOX[0], COWBOX[1], COWBOX[2], COWBOX[3]); fenceRect(SHEEPBOX[0], SHEEPBOX[1], SHEEPBOX[2], SHEEPBOX[3]);

  /* ---------- buildings (each has a level; level 0 shows a FOR SALE marker) ---------- */
  const B = {}; const pickables = []; const bldPick = (grp, key) => { grp.traverse(o => { if (o.isMesh) { o.userData.ref = { kind: "bld", key }; pickables.push(o); } }); };
  const redM = S({ map: redBoard, roughness: .8 }), whiteM = S({ color: C(0xf3f3ef), roughness: .6 }), roofM = S({ map: metalTex, color: C(0x7a8189), roughness: .5, metalness: .6 }), glassM = new THREE.MeshPhysicalMaterial({ color: C(0xd6efff), roughness: .04, transparent: true, opacity: .32, envMapIntensity: 1.6, side: THREE.DoubleSide, depthWrite: false });
  function makeB(key, x, z, label, w, d, builder) {
    const grp = new THREE.Group(); grp.position.set(x, 0, z); scene.add(grp);
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: forSale(0, label), transparent: true, opacity: .6, depthWrite: false })); mark.rotation.x = -Math.PI / 2; mark.position.y = .1; grp.add(mark); mark.userData.ref = { kind: "bld", key }; pickables.push(mark);
    const built = new THREE.Group(); grp.add(built); const levels = builder(built); levels.forEach(l => { l.visible = false; });
    B[key] = { grp, mark, levels, shown: -1, pop: 1 }; return B[key];
  }
  const roofPrism = (w, d, h, m, par, y) => { const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(0, h); const geo = new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }); geo.translate(0, 0, -d / 2); const o = new THREE.Mesh(geo, m); o.position.y = y; o.castShadow = true; par.add(o); return o; };
  makeB("barn", -41, -41, "COW BARN", 22, 14, par => { const L1 = new THREE.Group(), L2 = new THREE.Group(), L3 = new THREE.Group(); par.add(L1, L2, L3);
    box(16, 7, 10, redM, 0, 3.5, 0, L1); roofPrism(17, 10.6, 4, roofM, L1, 7); box(5, 5.5, .3, S({ map: woodTex }), 0, 2.75, 5.1, L1); box(5.4, .3, .5, whiteM, 0, 5.6, 5.1, L1);
    box(7, 6, 9, redM, 11.5, 3, 0, L2); roofPrism(7.6, 9.6, 3, roofM, L2, 6); box(2.6, 4, .3, S({ map: woodTex }), 11.5, 2, 4.6, L2);
    box(7, 6, 9, redM, -11.5, 3, 0, L3); roofPrism(7.6, 9.6, 3, roofM, L3, 6); cyl(1.7, 1.7, 11, S({ color: C(0xc8ccd0), metalness: .7, roughness: .35 }), -15.5, 5.5, 6, L3); cyl(1.7, 1.7, 9, S({ color: C(0xc8ccd0), metalness: .7, roughness: .35 }), 15.5, 4.5, 6, L3);
    return [L1, L2, L3]; });
  makeB("pen", -1, -41, "SHEEP SHELTER", 14, 10, par => { const L1 = new THREE.Group(), L2 = new THREE.Group(), L3 = new THREE.Group(); par.add(L1, L2, L3);
    box(10, 4, 6, S({ map: woodTex, roughness: .9 }), 0, 2, 0, L1); roofPrism(11, 6.6, 2.4, roofM, L1, 4); for (let i = 0; i < 3; i++) box(2.4, .6, 1, S({ color: C(0xd9c27a), roughness: 1 }), -3 + i * 3, .3, 6, L2); for (let i = 0; i < 3; i++) box(1.2, 1.2, 1.2, S({ color: C(0xd9c27a), roughness: 1 }), -3 + i * 3, .6, 8, L3);
    return [L1, L2, L3]; });
  makeB("shed", 14, -41, "SHEARING SHED", 12, 9, par => { const L1 = new THREE.Group(), L2 = new THREE.Group(); par.add(L1, L2);
    box(8, 4, 5, S({ map: woodTex }), 0, 2, 0, L1); roofPrism(9, 5.6, 2, roofM, L1, 4); box(2.2, 3, .2, whiteM, 0, 1.5, 2.55, L1); box(5, 1, 4, S({ color: C(0xbf9a5a) }), 5, .5, 0, L2); box(1.4, 1.4, 1.4, S({ color: C(0xf2efe6), roughness: 1 }), 6, 1.5, 0, L2);
    return [L1, L2]; });
  makeB("parlour", -23, -41, "MILKING PARLOUR", 9, 8, par => { const L1 = new THREE.Group(), L2 = new THREE.Group(); par.add(L1, L2);
    box(7, 3.6, 5, whiteM, 0, 1.8, 0, L1); box(7.4, .4, 5.4, S({ color: C(0x2f9e44), roughness: .6 }), 0, 3.8, 0, L1); box(2, 2.2, .2, S({ color: C(0x9bd6ff), roughness: .1, metalness: .6 }), 0, 1.4, 2.55, L1); cyl(.9, .9, 3.4, S({ color: C(0xdfe6ee), metalness: .8, roughness: .25 }), 4.4, 1.7, 0, L2);
    return [L1, L2]; });
  makeB("glass", 44, -21, "GLASSHOUSE", 36, 30, par => { const L = [new THREE.Group(), new THREE.Group(), new THREE.Group()]; L.forEach((l, i) => { par.add(l);
      const sh = new THREE.Shape(); [[-5.5, 0], [5.5, 0], [5.5, 3.2], [0, 5.4], [-5.5, 3.2]].forEach((p, k) => k ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1])); const geo = new THREE.ExtrudeGeometry(sh, { depth: 30, bevelEnabled: false }); geo.translate(0, 0, -15); geo.rotateY(Math.PI / 2);
      const m = new THREE.Mesh(geo, glassM); m.position.z = -11 + i * 11; m.renderOrder = 2; l.add(m); const ed = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xffffff })); ed.position.copy(m.position); l.add(ed); box(30, .12, 10, S({ color: C(0x5a4630), roughness: 1 }), 0, .06, -11 + i * 11, l, false); }); return L; });
  makeB("warehouse", 30, 20, "WAREHOUSE", 32, 16, par => { const L1 = new THREE.Group(), L2 = new THREE.Group(); par.add(L1, L2);
    box(22, 8, 12, S({ map: metalTex, color: C(0xaeb7bf), roughness: .5, metalness: .5 }), 0, 4, 0, L1); box(22.4, .6, 12.4, S({ color: C(0x3a4a5a), roughness: .5, metalness: .6 }), 0, 8.3, 0, L1); for (let i = 0; i < 3; i++) box(4, 5, .3, S({ color: C(0xe4e8ec), roughness: .4, metalness: .5 }), -6 + i * 6, 2.5, 6.1, L1); box(8, .3, 6, S({ color: C(0x2f9e44) }), -3, 8.7, 0, L1); box(7, 1.4, .1, S({ map: signTex("FARM WAREHOUSE", "#1f5d33", "#ffd166"), roughness: .6 }), 0, 7, 6.2, L1);
    box(14, 7, 12, S({ map: metalTex, color: C(0xaeb7bf), roughness: .5, metalness: .5 }), 18, 3.5, 0, L2); box(14.4, .6, 12.4, S({ color: C(0x3a4a5a), roughness: .5, metalness: .6 }), 18, 7.3, 0, L2); for (let i = 0; i < 2; i++) box(4, 5, .3, S({ color: C(0xe4e8ec), roughness: .4, metalness: .5 }), 14 + i * 7, 2.5, 6.1, L2);
    return [L1, L2]; });
  makeB("clinic", -49, 14, "VET CLINIC", 14, 10, par => { const L1 = new THREE.Group(); par.add(L1);
    box(10, 4.4, 7, whiteM, 0, 2.2, 0, L1); roofPrism(10.8, 7.6, 2, S({ color: C(0x6e8aa0), roughness: .5, metalness: .4 }), L1, 4.4); box(1.6, .5, .2, S({ color: C(0xd63b3b) }), 0, 4.2, 3.6, L1); box(.5, 1.6, .2, S({ color: C(0xd63b3b) }), 0, 4.2, 3.6, L1); box(2, 3, .2, S({ color: C(0x9bd6ff), roughness: .1, metalness: .6 }), 0, 1.5, 3.55, L1);
    return [L1]; });
  makeB("lab", -23, 14, "BREEDING LAB", 16, 10, par => { const L1 = new THREE.Group(), L2 = new THREE.Group(); par.add(L1, L2);
    box(11, 4.6, 7, S({ color: C(0xeef2f5), roughness: .35, metalness: .3 }), 0, 2.3, 0, L1); box(11.2, 3.4, .2, S({ color: C(0x7fc4ff), roughness: .08, metalness: .7, transparent: true, opacity: .75 }), 0, 2.6, 3.55, L1); box(7, 1.2, .2, S({ map: signTex("BREEDING LAB", "#1b3a6b", "#7fe3ff"), roughness: .6 }), 0, 5.3, 3.5, L1);
    box(6, 6.4, 7, S({ color: C(0xeef2f5), roughness: .35, metalness: .3 }), 8.5, 3.2, 0, L2); const dna = new THREE.Group(); for (let i = 0; i < 14; i++) { const a = i * .6; sph(.32, S({ color: C(0x35d0ff), emissive: C(0x1fb0ff), emissiveIntensity: .6 }), Math.cos(a) * 1, 7.6 + i * .32, Math.sin(a) * 1, dna); sph(.32, S({ color: C(0xff7ad9), emissive: C(0xff4fb3), emissiveIntensity: .6 }), -Math.cos(a) * 1, 7.6 + i * .32, -Math.sin(a) * 1, dna); } dna.position.set(0, 0, 0); L2.add(dna); L2.userData.dna = dna;
    return [L1, L2]; });
  function setBuild(key, level) { const b = B[key]; if (b.shown === level) return; const first = b.shown === -1; b.shown = level; b.mark.visible = level === 0; b.levels.forEach((l, i) => { l.visible = level > i; }); if (!first && level > 0) { b.pop = 0; rt.dust?.(b.grp.position.x, b.grp.position.z); } }

  /* ---------- tomato plants in the glasshouse ---------- */
  const leafProto = new THREE.SphereGeometry(.22, 8, 6), fruitProto = new THREE.SphereGeometry(.14, 10, 8), stemM = S({ color: C(0x3d8a35), roughness: .8 }), potM = S({ color: C(0xb5651d), roughness: .9 });
  const plantMap = new Map();
  function mkPlant(p) { const grp = new THREE.Group(); box(.9, .5, .9, potM, 0, .25, 0, grp); const stem = cyl(.07, .1, 2, stemM, 0, 1.25, 0, grp, 6); const leaves = [], fruits = [];
    for (let k = 0; k < 8; k++) { const l = new THREE.Mesh(leafProto, S({ color: C(0x3fa33a), roughness: .7 })); l.scale.set(1.4, .22, .9); const a = k * 2.2, h = .8 + k * .2; l.position.set(Math.cos(a) * .45, h, Math.sin(a) * .45); l.rotation.y = -a; l.castShadow = true; grp.add(l); leaves.push(l); }
    for (let k = 0; k < 7; k++) { const f = new THREE.Mesh(fruitProto, S({ color: C(0xd63b2a), roughness: .35 })); const a = k * 1.8; f.position.set(Math.cos(a) * .4, .9 + k * .22, Math.sin(a) * .4); f.castShadow = true; grp.add(f); fruits.push(f); }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.8, .07, 8, 28), new THREE.MeshBasicMaterial({ color: 0xffe36b })); ring.rotation.x = Math.PI / 2; ring.position.y = .1; ring.visible = false; grp.add(ring);
    grp.userData = { stem, leaves, fruits, ring, id: p.id }; grp.traverse(o => { if (o.isMesh) { o.userData.ref = { kind: "plant", id: p.id }; pickables.push(o); } }); scene.add(grp); return grp; }

  /* ---------- animals ---------- */
  const skinM = S({ color: C(0xf0a8a8), roughness: .6 }), darkM = S({ color: C(0x2a2a2a), roughness: .8 });
  function mkCow(a) { const grp = new THREE.Group(), body = new THREE.Group(); grp.add(body);
    const coat = S({ map: spots[a.id % 3], roughness: .75 }); const torso = sph(1, coat, 0, 1.25, 0, body, .85, .78, 1.7); const rump = sph(.9, coat, 0, 1.3, -1.0, body, .9, .8, .9);
    const head = new THREE.Group(); head.position.set(0, 1.55, 1.75); body.add(head); sph(.5, coat, 0, 0, 0, head, .85, .85, 1); box(.46, .38, .5, skinM, 0, -.12, .5, head); box(.1, .1, .1, darkM, -.2, .12, .46, head); box(.1, .1, .1, darkM, .2, .12, .46, head);
    sph(.18, coat, -.5, .15, -.05, head, 1, .5, .7); sph(.18, coat, .5, .15, -.05, head, 1, .5, .7); const hornL = new THREE.Mesh(new THREE.ConeGeometry(.07, .3, 6), S({ color: C(0xeee6cf) })); hornL.position.set(-.28, .5, -.05); head.add(hornL); const hornR = hornL.clone(); hornR.position.x = .28; head.add(hornR);
    const legs = []; [[-.55, 1.0], [.55, 1.0], [-.55, -1.1], [.55, -1.1]].forEach(p => { const lg = new THREE.Group(); lg.position.set(p[0], .85, p[1]); cyl(.13, .1, .9, coat, 0, -.45, 0, lg, 8); box(.22, .15, .26, darkM, 0, -.92, .02, lg); body.add(lg); legs.push(lg); });
    cyl(.05, .04, 1.2, coat, 0, 1.0, -1.8, body, 6).rotation.x = .25; sph(.14, darkM, 0, .35, -1.95, body);
    const udder = sph(.34, skinM, 0, .6, -.55, body, 1, .8, 1.1); const sickIcon = new THREE.Sprite(new THREE.SpriteMaterial({ map: emoji("\u{1F912}"), transparent: true })); sickIcon.scale.set(1.4, 1.4, 1); sickIcon.position.set(0, 3.1, 0); sickIcon.visible = false; grp.add(sickIcon);
    const heart = new THREE.Sprite(new THREE.SpriteMaterial({ map: emoji("\u{1F495}"), transparent: true })); heart.scale.set(1.3, 1.3, 1); heart.position.set(0, 3.1, 0); heart.visible = false; grp.add(heart);
    grp.userData = { body, head, legs, udder, torso, rump, coat, sickIcon, heart, kind: "cow" }; return grp; }
  function mkSheep(a) { const grp = new THREE.Group(), body = new THREE.Group(); grp.add(body); const wm = S({ map: woolTex, roughness: 1 });
    const fleece = new THREE.Group(); body.add(fleece); for (let k = 0; k < 9; k++) sph(.5 + (k % 3) * .06, wm, (k % 3 - 1) * .38, .95 + (k > 4 ? .22 : 0), (Math.floor(k / 3) - 1) * .5, fleece);
    const head = new THREE.Group(); head.position.set(0, 1.05, .95); body.add(head); sph(.28, darkM, 0, 0, 0, head, .9, .95, 1.15); sph(.12, darkM, -.3, .05, -.1, head, 1, .5, .7); sph(.12, darkM, .3, .05, -.1, head, 1, .5, .7);
    const legs = []; [[-.28, .55], [.28, .55], [-.28, -.55], [.28, -.55]].forEach(p => { const lg = new THREE.Group(); lg.position.set(p[0], .62, p[1]); cyl(.06, .05, .6, darkM, 0, -.3, 0, lg, 6); body.add(lg); legs.push(lg); });
    const sickIcon = new THREE.Sprite(new THREE.SpriteMaterial({ map: emoji("\u{1F912}"), transparent: true })); sickIcon.scale.set(1.2, 1.2, 1); sickIcon.position.set(0, 2.5, 0); sickIcon.visible = false; grp.add(sickIcon);
    const heart = new THREE.Sprite(new THREE.SpriteMaterial({ map: emoji("\u{1F495}"), transparent: true })); heart.scale.set(1.1, 1.1, 1); heart.position.set(0, 2.5, 0); heart.visible = false; grp.add(heart);
    grp.userData = { body, head, legs, fleece, sickIcon, heart, wm, kind: "sheep" }; return grp; }
  const ents = new Map();
  const ringM = new THREE.MeshBasicMaterial({ color: 0xffe36b, transparent: true, opacity: .9 });
  const selRing = new THREE.Mesh(new THREE.TorusGeometry(1.5, .1, 8, 36), ringM); selRing.rotation.x = Math.PI / 2; selRing.position.y = .15; selRing.visible = false; scene.add(selRing);
  const tagSprite = (txt, col) => { const t = tex(256, 96, (x, w, h) => { x.fillStyle = col; x.beginPath(); x.roundRect ? x.roundRect(4, 8, w - 8, h - 16, 18) : x.rect(4, 8, w - 8, h - 16); x.fill(); x.fillStyle = "#fff"; x.font = "bold 44px Arial"; x.textAlign = "center"; x.fillText(txt, w / 2, h / 2 + 15); }); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false })); s.scale.set(3.2, 1.2, 1); s.visible = false; s.renderOrder = 10; scene.add(s); return s; };
  const tagMum = tagSprite("MUM", "#e0559a"), tagDad = tagSprite("DAD", "#3b82f6"), tagPick = tagSprite("SELECTED", "#2f9e44");
  const SPB = { cow: COWBOX, sheep: SHEEPBOX };
  function syncAnimals(dt, t) {
    const live = new Set();
    for (const a of g.animals) { live.add(a.id); let e = ents.get(a.id);
      if (!e) { const grp = a.sp === "cow" ? mkCow(a) : mkSheep(a); const bx = SPB[a.sp]; grp.position.set(bx[0] + 3 + Math.random() * (bx[2] - bx[0] - 6), 0, bx[1] + 4 + Math.random() * (bx[3] - bx[1] - 8)); grp.traverse(o => { if (o.isMesh) { o.userData.ref = { kind: "animal", id: a.id }; pickables.push(o); } }); scene.add(grp); e = { grp, tx: grp.position.x, tz: grp.position.z, wait: Math.random() * 3, sig: "", bornPop: a.age < 1 ? 0 : 1 }; ents.set(a.id, e); if (a.age < 1) rt.hearts?.(grp.position.x, grp.position.z); }
      const u = e.grp.userData, sig = a.sp + a.t.prod + a.t.meat + a.t.health + a.t.looks + a.t.growth + (a.adult ? "A" : "J") + (a.preg ? "P" : "") + (a.sick ? "S" : "");
      if (sig !== e.sig) { e.sig = sig; const k = a.adult ? 1 : 0.5 + 0.5 * Math.min(1, a.age / Math.max(1, M.matureAge(a)));
        if (a.sp === "cow") { const mus = .86 + a.t.meat / 330; u.torso.scale.set(.85 * mus, .78 * mus, 1.7); u.rump.scale.set(.9 * mus, .8 * mus, .9); u.udder.visible = a.sex === "F" && a.adult; u.udder.scale.setScalar(.7 + a.t.prod / 130); e.baseS = k * (.95 + a.t.growth / 600); u.coat.color.copy(C(0xffffff)).multiplyScalar(.75 + a.t.looks / 260); }
        else { const w = .8 + a.t.prod / 130; u.fleece.scale.set(w, w, w); e.baseS = k * .95; u.wm.color.copy(C(0xffffff)).multiplyScalar(.72 + a.t.looks / 250); }
        if (a.preg) e.baseS *= 1.04; u.sickIcon.visible = !!a.sick; u.heart.visible = !!a.preg; }
      /* growing, wandering, grazing */
      e.bornPop = Math.min(1, e.bornPop + dt * 1.5); const sc = (e.baseS || 1) * (.3 + .7 * e.bornPop); e.grp.scale.setScalar(sc);
      const speed = a.sick ? .15 : (a.adult ? .8 : 1.1); e.wait -= dt;
      const dx = e.tx - e.grp.position.x, dz = e.tz - e.grp.position.z, dist = Math.hypot(dx, dz);
      if (dist < .4) { if (e.wait <= 0) { const bx = SPB[a.sp]; e.tx = bx[0] + 3 + Math.random() * (bx[2] - bx[0] - 6); e.tz = bx[1] + 4 + Math.random() * (bx[3] - bx[1] - 8); e.wait = 2 + Math.random() * 5; } e.walk = false; }
      else if (e.wait <= 0 || e.walk) { e.walk = true; e.grp.position.x += dx / dist * speed * dt; e.grp.position.z += dz / dist * speed * dt; const ty = Math.atan2(dx, dz); let dy = ty - e.grp.rotation.y; while (dy > Math.PI) dy -= 6.283; while (dy < -Math.PI) dy += 6.283; e.grp.rotation.y += dy * Math.min(1, dt * 3); }
      const wk = e.walk ? 1 : 0; u.legs.forEach((lg, i) => { lg.rotation.x = reduced() ? 0 : Math.sin(t * 6 + i * (i % 2 ? 2.6 : 0)) * .4 * wk; });
      u.head.rotation.x = e.walk || a.sick ? (a.sick ? .5 : 0) : .55 + Math.sin(t * 2 + a.id) * .08; u.body.position.y = e.walk && !reduced() ? Math.abs(Math.sin(t * 6)) * .05 : 0;
      u.heart.position.y = (a.sp === "cow" ? 3.1 : 2.5) + (reduced() ? 0 : Math.sin(t * 3) * .12); if (u.sickIcon.visible) u.sickIcon.position.y = (a.sp === "cow" ? 3.1 : 2.5) + (reduced() ? 0 : Math.sin(t * 3) * .1);
      if (a.sick) e.grp.rotation.z = .05; else e.grp.rotation.z = 0;
    }
    for (const [id, e] of ents) if (!live.has(id)) { scene.remove(e.grp); ents.delete(id); const keep = pickables.filter(o => !(o.userData.ref && o.userData.ref.kind === "animal" && o.userData.ref.id === id)); pickables.length = 0; pickables.push(...keep); }
  }
  function syncPlants(dt, t) {
    const live = new Set();
    g.plants.forEach((p, i) => { live.add(p.id); let grp = plantMap.get(p.id); if (!grp) { grp = mkPlant(p); plantMap.set(p.id, grp); grp.userData.pop = 0; }
      const bay = Math.floor(i / 7), k = i % 7; grp.position.set(44 + (k - 3) * 3.8, 0, -32 + bay * 11 + (k % 2 ? -1.8 : 1.8));
      const u = grp.userData; u.pop = Math.min(1, u.pop + dt * 1.2); const h = .35 + .65 * Math.min(1, p.age / 9) * (.7 + p.t.yield / 200); grp.scale.set(.8 + p.t.looks / 300, h * u.pop, .8 + p.t.looks / 300); const ripe = p.age >= 7, fr = Math.round(2 + p.t.yield / 18);
      u.fruits.forEach((f, j) => { f.visible = ripe && j < fr; f.scale.setScalar(.8 + p.t.looks / 140); f.material.color.copy(C(0xd63b2a)).lerp(C(0xff5a3a), p.t.flavour / 140); });
      const sick = p.ill, col = tmpC.copy(C(0x3fa33a)).lerp(C(0xc4a838), sick ? .9 : 0); u.leaves.forEach(l => l.material.color.copy(col)); grp.rotation.z = reduced() ? 0 : Math.sin(t * 1.3 + i) * .02; });
    for (const [id, grp] of plantMap) if (!live.has(id)) { scene.remove(grp); plantMap.delete(id); const keep = pickables.filter(o => !(o.userData.ref && o.userData.ref.kind === "plant" && o.userData.ref.id === id)); pickables.length = 0; pickables.push(...keep); }
  }
  const tmpC = new THREE.Color();

  /* ---------- people, trucks, effects ---------- */
  const person = (shirt, skin, par) => { const gp = new THREE.Group(); cyl(.22, .27, .85, S({ color: C(shirt), roughness: .8 }), 0, .9, 0, gp, 10); cyl(.18, .18, .5, S({ color: C(0x2d3748) }), 0, .25, 0, gp, 8); sph(.2, S({ color: C(skin), roughness: .6 }), 0, 1.5, 0, gp); (par || scene).add(gp); return gp; };
  const hands = Array.from({ length: 5 }, (_, i) => { const gp = person(0x2f7a34, [0xf1c27d, 0xc68642, 0x8d5524][i % 3]); gp.scale.setScalar(1.15); cyl(.34, .34, .05, S({ color: C(0xe3c16f) }), 0, 1.7, 0, gp, 12); gp.visible = false; gp.userData = { tx: -40 + i * 6, tz: -8, wait: 0 }; gp.position.set(-30 + i, 0, 8); return gp; });
  const vetPerson = person(0xffffff, 0xf1c27d); vetPerson.position.set(-49, 0, 19); vetPerson.scale.setScalar(1.2); vetPerson.visible = false; cyl(.34, .34, .04, S({ color: C(0xd63b3b) }), 0, 1.4, .2, vetPerson, 8).rotation.x = 1.57;
  const truck = new THREE.Group(); { box(7, 3.2, 3, whiteM, 0, 2.4, 0, truck); box(2.4, 2.4, 3, S({ color: C(0x2f9e44), roughness: .4 }), 4.8, 2, 0, truck); box(6.8, .9, 3.1, S({ map: signTex("FARM FRESH", "#1f5d33", "#ffd166"), roughness: .6 }), 0, 2.3, 0, truck).scale.set(1, 1, 1); [[-2, 1.5], [-2, -1.5], [4.6, 1.5], [4.6, -1.5], [1.5, 1.5], [1.5, -1.5]].forEach(w => { const wh = cyl(.8, .8, .5, darkM, w[0], .8, w[1], truck, 16); wh.rotation.x = 1.57; }); }
  truck.position.set(-120, 0, 40); scene.add(truck); const trk = { st: "idle", t: 0, cb: null };
  const vetCar = new THREE.Group(); { box(4.4, 1.5, 2, whiteM, 0, 1.2, 0, vetCar); box(2.2, 1.1, 1.9, whiteM, 0, 2.3, 0, vetCar); box(1.2, .3, 2.05, S({ color: C(0xd63b3b) }), 0, 1.3, 0, vetCar); [[-1.4, 1], [-1.4, -1], [1.4, 1], [1.4, -1]].forEach(w => { const wh = cyl(.45, .45, .3, darkM, w[0], .45, w[1], vetCar, 12); wh.rotation.x = 1.57; }); }
  vetCar.position.set(-120, 0, 41.5); scene.add(vetCar); const vcr = { st: "idle", t: 0 };
  rt.truck = cb => { if (trk.st !== "idle") { cb && cb(); return; } trk.st = "arrive"; trk.cb = cb; truck.position.x = -120; };
  rt.vetCar = () => { if (vcr.st !== "idle") return; vcr.st = "arrive"; vetCar.position.x = -120; };
  const burstPts = (() => { const n = 240, geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 3), 3)); const p = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffd166, size: .7, transparent: true, opacity: .9, depthWrite: false, blending: THREE.AdditiveBlending })); p.frustumCulled = false; p.userData = { n, life: 0, vel: new Float32Array(n * 3) }; scene.add(p); return p; })();
  function burst(x, y, z, col) { const b = burstPts.userData; b.life = 1.4; burstPts.material.color.set(col); const a = burstPts.geometry.attributes.position; for (let i = 0; i < b.n; i++) { a.array[i * 3] = x; a.array[i * 3 + 1] = y; a.array[i * 3 + 2] = z; const ang = Math.random() * 6.3, up = 4 + Math.random() * 7, sp = 2 + Math.random() * 5; b.vel[i * 3] = Math.cos(ang) * sp; b.vel[i * 3 + 1] = up; b.vel[i * 3 + 2] = Math.sin(ang) * sp; } a.needsUpdate = true; }
  function updBurst(dt) { const b = burstPts.userData; if (b.life <= 0) { burstPts.visible = false; return; } burstPts.visible = true; b.life -= dt; const a = burstPts.geometry.attributes.position; for (let i = 0; i < b.n; i++) { b.vel[i * 3 + 1] -= 9 * dt; a.array[i * 3] += b.vel[i * 3] * dt; a.array[i * 3 + 1] += b.vel[i * 3 + 1] * dt; a.array[i * 3 + 2] += b.vel[i * 3 + 2] * dt; } a.needsUpdate = true; burstPts.material.opacity = Math.max(0, b.life / 1.4); }
  rt.burst = (kind, p) => { const c = p || [0, 3, -10]; burst(c[0], c[1], c[2], kind === "coins" ? 0xffd166 : kind === "green" ? 0x7dff9a : kind === "bad" ? 0xff5468 : 0xff8ad8); };
  rt.dust = (x, z) => burst(x, 1.5, z, 0xc8b08a); rt.hearts = (x, z) => burst(x, 3, z, 0xff8ad8);
  const floaters = []; rt.float = (ch, x, y, z) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: emoji(ch), transparent: true, depthTest: false })); s.scale.set(2.2, 2.2, 1); s.position.set(x, y, z); s.renderOrder = 11; scene.add(s); floaters.push({ s, t: 0 }); };
  const bee = new THREE.Group(); sph(.22, S({ color: C(0xffd33d) }), 0, 0, 0, bee); sph(.12, darkM, .2, 0, 0, bee); const wing = sph(.22, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .6 }), 0, .2, 0, bee, 1, .15, 1.4); bee.visible = false; scene.add(bee); const beeS = { on: false, t: 0, a: null, b: null, cb: null };
  rt.bee = (aId, bId, cb) => { const A = plantMap.get(aId), Bp = plantMap.get(bId); if (!A || !Bp) { cb && cb(); return; } beeS.on = true; beeS.t = 0; beeS.a = A; beeS.b = Bp; beeS.cb = cb; bee.visible = true; };
  rt.setSel = (sel) => { rt.sel = sel; };
  rt.screenOf = id => { const p = rt.pos(id); if (!p) return null; const v = new THREE.Vector3(p.x, 1.2, p.z).project(camera), r = cv.getBoundingClientRect(); return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height }; };
  rt.pos = id => { const e = ents.get(id); if (e) return e.grp.position; const pl = plantMap.get(id); return pl ? pl.position : null; };

  /* ---------- picking (tap, not drag) ---------- */
  const cam = { az: .8, pol: 1.0, dist: 120, tx: -4, ty: 2, tz: -8 }, goal = { ...cam }; let dragging = false, last = null, travel = 0, touched = false, shake = 0;
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  cv.addEventListener("pointerdown", e => { dragging = true; travel = 0; last = [e.clientX, e.clientY]; touched = true; try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
  cv.addEventListener("pointermove", e => { if (!dragging) return; const dx = e.clientX - last[0], dy = e.clientY - last[1]; last = [e.clientX, e.clientY]; travel += Math.abs(dx) + Math.abs(dy); goal.az -= dx * .005; goal.pol = Math.max(.3, Math.min(1.45, goal.pol - dy * .004)); });
  ["pointerup", "pointercancel", "pointerleave"].forEach(ev => cv.addEventListener(ev, () => { dragging = false; }));
  cv.addEventListener("wheel", e => { e.preventDefault(); goal.dist = Math.max(14, Math.min(220, goal.dist * (1 + Math.sign(e.deltaY) * .09))); touched = true; }, { passive: false });
  cv.addEventListener("click", e => { if (travel > 6) return; const r = cv.getBoundingClientRect(); mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(mouse, camera); const hit = ray.intersectObjects(pickables, false)[0]; if (hit && hit.object.userData.ref) rt.onPick?.(hit.object.userData.ref, hit.point); else rt.onPick?.(null); });
  const PRE = { overview: { az: .8, pol: 1.0, dist: 92, tx: -4, ty: 2, tz: -8 }, cows: { az: .5, pol: 1.05, dist: 46, tx: -41, ty: 1, tz: -20 }, sheep: { az: .5, pol: 1.05, dist: 42, tx: -1, ty: 1, tz: -20 }, glass: { az: .6, pol: 1.0, dist: 54, tx: 44, ty: 1, tz: -21 }, warehouse: { az: .5, pol: 1.1, dist: 52, tx: 30, ty: 2, tz: 20 }, lab: { az: .4, pol: 1.15, dist: 46, tx: -36, ty: 2, tz: 14 } };
  rt.goto = (name, p) => { touched = true; if (name === "at" && p) Object.assign(goal, { az: .6, pol: 1.1, dist: 26, tx: p[0], ty: 1.5, tz: p[1] }); else if (PRE[name]) Object.assign(goal, PRE[name]); };

  /* ---------- run ---------- */
  let t = 0, last_ = performance.now(), tod = .25, ro;
  function size() { const w = view.clientWidth || 600, h = view.clientHeight || 400; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); cv.style.width = w + "px"; cv.style.height = h + "px"; }
  size(); ro = new ResizeObserver(size); ro.observe(view);
  function frame(now) {
    const dt = Math.min(.05, (now - last_) / 1000); last_ = now; t += dt; const rm = reduced();
    tod = (tod + dt / 36) % 1; const ang = tod * 6.283, sh = Math.sin(ang), dayK = Math.max(0, Math.min(1, sh * 1.6 + .25));
    sun.position.set(Math.cos(ang) * 70, Math.max(6, sh * 60 + 8), 30); sun.intensity = .15 + dayK * 1.5; sunBall.position.copy(sun.position).multiplyScalar(2.4); sunBall.visible = sh > .02;
    hemi.intensity = .2 + dayK * .55; scene.background.copy(C(0x0b1630)).lerp(C(0x7fb8e6), dayK); scene.fog.color.copy(scene.background); renderer.toneMappingExposure = .75 + dayK * .35;
    clouds.forEach((c, i) => { c.position.x += dt * (.6 + i * .1) * (rm ? 0 : 1); if (c.position.x > 180) c.position.x = -180; });
    for (const k in B) { setBuild(k, g.b[k] || 0); const b = B[k]; if (b.pop < 1) { b.pop = Math.min(1, b.pop + dt * 1.6); const q = b.pop - 1; b.grp.scale.set(1, Math.max(.01, 1 + 2.5 * q * q * q + 1.6 * q * q), 1); } else b.grp.scale.set(1, 1, 1); }
    if (B.lab.levels[1] && B.lab.levels[1].userData.dna) B.lab.levels[1].userData.dna.rotation.y += dt * .8;
    syncAnimals(dt, t); syncPlants(dt, t);
    hands.forEach((h, i) => { h.visible = i < g.staff.hand; if (!h.visible) return; const u = h.userData; const dx = u.tx - h.position.x, dz = u.tz - h.position.z, d = Math.hypot(dx, dz); if (d < .5) { u.wait -= dt; if (u.wait <= 0) { const pick = Math.random() < .45 ? COWBOX : Math.random() < .6 ? SHEEPBOX : [26, -34, 62, -6]; u.tx = pick[0] + 2 + Math.random() * (pick[2] - pick[0] - 4); u.tz = pick[3] + 2 + Math.random() * 4; u.wait = 2 + Math.random() * 3; } } else { h.position.x += dx / d * 2.2 * dt; h.position.z += dz / d * 2.2 * dt; h.rotation.y = Math.atan2(dx, dz); h.position.y = rm ? 0 : Math.abs(Math.sin(t * 8 + i)) * .05; } });
    vetPerson.visible = g.staff.vet > 0 && g.b.clinic > 0;
    if (trk.st !== "idle") { trk.t += dt; if (trk.st === "arrive") { truck.position.x += dt * 24 * Math.max(.2, Math.min(1, (24 - truck.position.x) / 14)); if (truck.position.x >= 23.8) { trk.st = "load"; trk.t = 0; truck.position.x = 24; } } else if (trk.st === "load") { if (trk.t > 1.6) { trk.st = "leave"; trk.t = 0; const cb = trk.cb; trk.cb = null; cb && cb(); } } else if (trk.st === "leave") { truck.position.x += dt * (4 + trk.t * 12); if (truck.position.x > 130) trk.st = "idle"; } }
    if (vcr.st !== "idle") { vcr.t += dt; if (vcr.st === "arrive") { vetCar.position.x += dt * 26 * Math.max(.2, Math.min(1, (-44 - vetCar.position.x) / 12)); if (vetCar.position.x >= -44.2) { vcr.st = "wait"; vcr.t = 0; } } else if (vcr.st === "wait") { if (vcr.t > 3.2) vcr.st = "leave"; } else { vetCar.position.x += dt * 20; if (vetCar.position.x > 130) vcr.st = "idle"; } }
    if (beeS.on) { beeS.t += dt; const k = Math.min(1, beeS.t / 2.6), a = beeS.a.position, b = beeS.b.position, kk = k < .5 ? k * 2 : (1 - k) * 2; bee.position.set(a.x + (b.x - a.x) * k, 2.4 + Math.sin(k * 6.283 * 2) * .5 + kk * 1.2, a.z + (b.z - a.z) * k); bee.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); wing.scale.y = .15 + Math.abs(Math.sin(t * 40)) * .25; if (k >= 1) { beeS.on = false; bee.visible = false; beeS.cb && beeS.cb(); } }
    for (let i = floaters.length - 1; i >= 0; i--) { const f = floaters[i]; f.t += dt; f.s.position.y += dt * 2.2; f.s.material.opacity = Math.max(0, 1 - f.t / 1.6); if (f.t > 1.6) { scene.remove(f.s); floaters.splice(i, 1); } }
    updBurst(dt);
    /* selection markers */
    const sel = rt.sel || {}; const place = (id, sprite, txt) => { const e = ents.get(id), pl = plantMap.get(id), o = e ? e.grp : pl; if (o && id) { sprite.visible = true; sprite.position.set(o.position.x, (e ? 4.6 : 4.2), o.position.z); } else sprite.visible = false; };
    place(sel.mum, tagMum); place(sel.dad, tagDad); const selId = sel.id, so = ents.get(selId) ? ents.get(selId).grp : plantMap.get(selId);
    if (so) { selRing.visible = true; selRing.position.set(so.position.x, .2, so.position.z); selRing.scale.setScalar(ents.get(selId) ? (ents.get(selId).grp.userData.kind === "cow" ? 1.2 : .8) : .8); ringM.opacity = rm ? .9 : .65 + Math.sin(t * 4) * .3; if (sel.id !== sel.mum && sel.id !== sel.dad) { tagPick.visible = true; tagPick.position.set(so.position.x, ents.get(selId) ? 5.4 : 4.9, so.position.z); } else tagPick.visible = false; } else { selRing.visible = false; tagPick.visible = false; }
    if (!touched && !rm && !dragging) goal.az += dt * .03;
    ["az", "pol", "dist", "tx", "ty", "tz"].forEach(k => cam[k] += (goal[k] - cam[k]) * Math.min(1, dt * (rm ? 30 : 4)));
    const fit = Math.max(1, 1 / camera.aspect * 1.25); const dd = cam.dist * fit; shake = Math.max(0, shake - dt * 2.2);
    camera.position.set(cam.tx + dd * Math.sin(cam.pol) * Math.sin(cam.az), cam.ty + dd * Math.cos(cam.pol), cam.tz + dd * Math.sin(cam.pol) * Math.cos(cam.az)); camera.lookAt(cam.tx, cam.ty, cam.tz);
    renderer.render(scene, camera); rt.raf = requestAnimationFrame(frame);
  }
  Object.assign(cam, goal); rt.raf = requestAnimationFrame(frame);
  return { goto: rt.goto, destroy() { cancelAnimationFrame(rt.raf); ro.disconnect(); } };
}
