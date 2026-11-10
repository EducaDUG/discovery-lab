/* A hyper-real procedural 3D compound microscope (CLAUDE.md §18): PBR enamel/chrome, ACES, soft shadows,
   a working revolving nosepiece, rack-and-pinion stage, glowing lamp. Parts are tappable (tap vs drag is
   decided by cumulative travel, per §4). The scene only READS state - controls live in the page. */
import { hasWebGL, makeStage, dressVault, glowTexture, textSprite, burst3D } from "./fx.js?v=1";
import { PARTS, OBJ, reduced } from "./data.js?v=1";

export { hasWebGL };

export function buildScope3D(wrap, { onPart, size = 10.6 } = {}) {
  const st = makeStage(wrap, { fov: 38, dist: size, target: [0, 3.2, 0], fog: 0x0a141c, minPhi: 0.7, maxPhi: 1.5, autoSpin: 0.07 });
  const { THREE, scene } = st;
  dressVault(st, { floorColor: [24, 34, 42], accent: 0x6fd6ff, spores: 150, radius: 9 });
  st.orbit.theta = 0.45; st.orbit.phi = 1.2;

  const enamel = new THREE.MeshPhysicalMaterial({ color: 0x1a1f27, roughness: 0.32, metalness: 0.35, clearcoat: 0.7, clearcoatRoughness: 0.25 });
  const chrome = new THREE.MeshStandardMaterial({ color: 0xcfd6dd, roughness: 0.18, metalness: 0.95 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xb88a3a, roughness: 0.3, metalness: 0.9 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xbfe3f2, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.38, clearcoat: 1 });
  const parts = {};
  const tag = (m, id) => { m.userData.part = id; m.castShadow = true; m.receiveShadow = true; (parts[id] = parts[id] || []).push(m); return m; };
  const add = (m, id, parent = scene) => { if (id) tag(m, id); parent.add(m); return m; };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };

  // bench
  const bench = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.25, 64), new THREE.MeshStandardMaterial({ color: 0x2a3440, roughness: 0.55, metalness: 0.25 }));
  bench.position.y = -0.13; bench.receiveShadow = true; scene.add(bench);

  // base + arm
  add(at(new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.38, 2.6), enamel), 0, 0.19, 0), "base");
  add(at(new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.2, 1.9), enamel), 0.15, 0.46, -0.1), "base");
  const armCurve = new THREE.CatmullRomCurve3([[0, 0.5, -0.85], [0, 1.4, -1.25], [0, 2.8, -1.38], [0, 4.3, -1.15], [0, 5.2, -0.6], [0, 5.28, -0.05]].map(p => new THREE.Vector3(...p)));
  add(new THREE.Mesh(new THREE.TubeGeometry(armCurve, 40, 0.36, 16), enamel), "arm");
  add(at(new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.4, 0.3), chrome), 0, 2.25, -0.9), "arm");

  // body tube + eyepiece
  add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 1.7, 40), enamel), 0, 4.45, 0), "barrel");
  add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.28, 32), chrome), 0, 5.4, 0), "barrel");
  add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 1.0, 32), chrome), 0, 6.0, 0), "eyepiece");
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.2, 32), new THREE.MeshStandardMaterial({ color: 0x5aa0ff, roughness: 0.05, metalness: 0.2, emissive: 0x1a3a7a, emissiveIntensity: 0.5 }));
  lens.rotation.x = -Math.PI / 2; add(at(lens, 0, 6.51, 0), "eyepiece");
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 12, 32), brass); ring.rotation.x = Math.PI / 2; add(at(ring, 0, 5.62, 0), "eyepiece");

  // nosepiece: disc + 4 objectives; the group turns so the chosen one sits on the optical axis
  const nose = new THREE.Group(); nose.position.set(-0.42, 3.5, 0); scene.add(nose);
  add(new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 0.22, 40), chrome), "objective", nose);
  const lens4 = [0.5, 0.65, 0.78, 0.82];
  OBJ.forEach((o, i) => {
    const a = i * Math.PI / 2, g = new THREE.Group(); g.position.set(Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42);
    const h = lens4[i];
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.12, h, 24), new THREE.MeshStandardMaterial({ color: 0x20262e, roughness: 0.3, metalness: 0.8 }));
    add(at(body, 0, -0.11 - h / 2, 0), "objective", g);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.175, 0.175, 0.09, 24), new THREE.MeshStandardMaterial({ color: new THREE.Color(o.c), roughness: 0.4, metalness: 0.2 }));
    add(at(band, 0, -0.2, 0), "objective", g);
    const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.05, 20), new THREE.MeshStandardMaterial({ color: 0xbcd4e6, roughness: 0.05, metalness: 0.9 }));
    add(at(tip, 0, -0.11 - h, 0), "objective", g);
    nose.add(g);
  });

  // stage carrier (moves with the coarse focus)
  const stage = new THREE.Group(); scene.add(stage);
  add(new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.14, 2.0), new THREE.MeshStandardMaterial({ color: 0x3b4450, roughness: 0.4, metalness: 0.7 })), "stage", stage);
  stage.add(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.16, 32), new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.9 })));
  [-0.55, 0.55].forEach(x => add(at(new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.5), chrome), x, 0.1, 0.1), "stage", stage));
  add(at(new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 1.1), enamel), 0, -0.02, -0.95), "stage", stage);
  const slide = new THREE.Group(); slide.position.set(0, 0.1, 0); stage.add(slide);
  slide.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.05, 0.5), glass));
  slide.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 24), new THREE.MeshStandardMaterial({ color: 0xc86aa8, roughness: 0.6, transparent: true, opacity: 0.85 })), 0, 0.04, 0));
  slide.add(at(new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.02, 0.36), glass), 0, 0.065, 0));
  slide.visible = false;

  // light path: condenser + mirror + lamp + beam
  add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 0.5, 28), enamel), 0, 1.18, 0), "stage");
  const lampG = new THREE.Group(); lampG.position.set(0, 0.72, 0); scene.add(lampG);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16), new THREE.MeshStandardMaterial({ color: 0xfff1c4, emissive: 0xffd36a, emissiveIntensity: 1 }));
  add(bulb, "mirror", lampG);
  const mir = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 40), new THREE.MeshStandardMaterial({ color: 0x9fb4c4, roughness: 0.12, metalness: 0.55, emissive: 0x2a4a60, emissiveIntensity: 0.6 }));
  mir.rotation.x = -0.75; add(at(mir, 0, -0.35, 0.75), "mirror", lampG);
  const mirRim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 12, 40), brass); mirRim.rotation.x = Math.PI / 2 - 0.75; add(at(mirRim, 0, -0.35, 0.75), "mirror", lampG);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture("rgba(255,225,150,1)", "rgba(255,200,90,0)"), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(1.8); lampG.add(halo);
  const lampLight = new THREE.PointLight(0xffe2a0, 1.2, 6); lampLight.position.set(0, 0.2, 0); lampG.add(lampLight);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.3, 1.6, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe9a6, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  beam.position.set(0, 1.9, 0); scene.add(beam);

  // focus knobs either side of the arm
  const coarseKnobs = [], fineKnobs = [];
  [-1, 1].forEach(sx => {
    const k = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.34, 40), chrome); k.rotation.z = Math.PI / 2; k.position.set(sx * 0.75, 2.75, -1.3);
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.06, 0.1), enamel); mark.position.set(0, 0, 0.5); k.add(mark);
    tag(k, "coarse"); scene.add(k); coarseKnobs.push(k);
    const f = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.3, 32), brass); f.rotation.z = Math.PI / 2; f.position.set(sx * 1.06, 2.75, -1.3);
    const fm = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.05, 0.08), enamel); fm.position.set(0, 0, 0.3); f.add(fm);
    tag(f, "fine"); scene.add(f); fineKnobs.push(f);
  });
  const blob = new THREE.Mesh(new THREE.CircleGeometry(2.6, 40), new THREE.MeshBasicMaterial({ map: glowTexture("rgba(0,0,0,.55)", "rgba(0,0,0,0)"), transparent: true, depthWrite: false }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.02; scene.add(blob);

  // ---------- state-driven pose ----------
  const pose = { coarse: 55, fine: 0, obj: 0, light: 0.4, noseAngle: 0, noseTarget: 0, crash: 0 };
  function apply() {
    stage.position.y = 1.58 + pose.coarse * 0.0155;
    coarseKnobs.forEach(k => { k.rotation.x = pose.coarse * 0.22; });
    fineKnobs.forEach(k => { k.rotation.x = pose.fine * 0.6; });
    const k = Math.min(1.5, pose.light);
    bulb.material.emissiveIntensity = 0.15 + k * 1.2; lampLight.intensity = 0.2 + k * 1.6;
    halo.material.opacity = Math.min(1, 0.2 + k * 0.7); beam.material.opacity = 0.03 + k * 0.2;
  }
  apply();
  const wrapAngle = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  st.tick((dt, now) => {
    const diff = wrapAngle(pose.noseTarget - pose.noseAngle);
    if (reduced()) pose.noseAngle = pose.noseTarget; else pose.noseAngle += diff * Math.min(1, dt * 7);
    nose.rotation.y = pose.noseAngle;
    if (pose.crash > 0 && !reduced()) { pose.crash = Math.max(0, pose.crash - dt * 3); stage.position.x = (Math.random() - 0.5) * 0.08 * pose.crash; } else stage.position.x = 0;
    halo.scale.setScalar(1.7 + Math.sin(now / 600) * 0.05);
  });

  // ---------- tap a part ----------
  const ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
  let labelSprite = null;
  const el = st.renderer.domElement;
  el.addEventListener("click", e => {
    if (st.wasDrag()) return;
    const r = el.getBoundingClientRect();
    mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(mouse, st.camera);
    const hits = ray.intersectObjects(scene.children, true).filter(h => h.object.userData.part);
    if (hits.length) api.pick(hits[0].object.userData.part, hits[0].point); else onPart && onPart(null);
  });
  const orig = new Map();
  function flash(id) {
    (parts[id] || []).forEach(m => {
      if (!m.material.emissive) return;
      if (!orig.has(m)) orig.set(m, { c: m.material.emissive.clone(), i: m.material.emissiveIntensity });
      m.material.emissive.setHex(0x2fe0c0); m.material.emissiveIntensity = 0.9;
      setTimeout(() => { const o = orig.get(m); m.material.emissive.copy(o.c); m.material.emissiveIntensity = o.i; }, 900);
    });
  }
  const api = {
    st, pose, apply,
    pick(id, point) {
      flash(id);
      const p = PARTS.find(x => x.id === id);
      if (labelSprite) scene.remove(labelSprite);
      if (p && point) {
        const s = textSprite(p.name(), { size: 40 }); s.position.copy(point).add(new THREE.Vector3(0, 0.7, 0)); s.scale.multiplyScalar(1.2); scene.add(s); labelSprite = s;
        setTimeout(() => { if (labelSprite === s) { scene.remove(s); labelSprite = null; } }, 2600);
        burst3D(st, point, 0x6fd6ff, 14, 1.6);
      }
      onPart && onPart(id);
    },
    setObjective(i) { pose.obj = i; pose.noseTarget = -(i * Math.PI / 2); },
    setCoarse(v) { pose.coarse = v; apply(); },
    setFine(v) { pose.fine = v; apply(); },
    setLight(v) { pose.light = v; apply(); },
    setSlide(on) { slide.visible = on; },
    crash() { pose.crash = 1; st.punch(0.1); burst3D(st, new THREE.Vector3(0, stage.position.y + 0.3, 0), 0xff7a7a, 34, 3); },
    celebrate() { burst3D(st, new THREE.Vector3(0, 3.4, 0.4), 0x7dffb4, 30, 2.8); st.punch(0.06); },
  };
  return api;
}
