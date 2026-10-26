/* Exam 4 revision: shared hyper-real 3D building blocks (glass beaker, liquid, bulb, cell, wires, bubbles).
   Everything is built from vendored Three.js primitives with physically based materials, so it needs no network. */
import { glowTexture } from "../../../../../../engine/revision-kit.js?v=16";

export const PHCOL = ["#e53935", "#e53935", "#e53935", "#ef6c00", "#fb8c00", "#fdd835", "#c0ca33", "#43a047", "#26a69a", "#1e88e5", "#3949ab", "#5e35b1", "#7b1fa2", "#8e24aa", "#6a1b9a"];
const lerp = (a, b, t) => a + (b - a) * t;
export function phColour(pH) { const i = Math.max(0, Math.min(14, pH)), a = Math.floor(i), b = Math.min(14, a + 1), t = i - a; const A = PHCOL[a], B = PHCOL[b]; const c = k => parseInt(A.slice(k, k + 2), 16) * (1 - t) + parseInt(B.slice(k, k + 2), 16) * t; return (Math.round(c(1)) << 16) | (Math.round(c(3)) << 8) | Math.round(c(5)); }

export function glassMat(THREE, o = {}) { return new THREE.MeshPhysicalMaterial(Object.assign({ color: 0xeaf6ff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.28, clearcoat: 1, clearcoatRoughness: 0.03, side: THREE.DoubleSide, depthWrite: false }, o)); }

/* a lab beaker with a lip, a base disc and graduation marks; returns the group and a function to set liquid level / colour */
export function makeBeaker(THREE, { r = 1.5, h = 3.4 } = {}) {
  const g = new THREE.Group();
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.97, h, 48, 1, true), glassMat(THREE)); wall.position.y = h / 2; wall.renderOrder = 3; g.add(wall);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(r, 0.045, 10, 48), glassMat(THREE, { opacity: 0.5 })); lip.rotation.x = Math.PI / 2; lip.position.y = h; g.add(lip);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.97, r * 0.97, 0.12, 48), glassMat(THREE, { opacity: 0.45 })); base.position.y = 0.06; g.add(base);
  const liqMat = new THREE.MeshPhysicalMaterial({ color: 0xcfeaff, roughness: 0.08, metalness: 0, transparent: true, opacity: 0.78, clearcoat: 0.6, depthWrite: false });
  const liq = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.94, r * 0.92, 1, 40), liqMat); liq.renderOrder = 2; g.add(liq);
  const top = new THREE.Mesh(new THREE.CircleGeometry(r * 0.94, 40), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.35, clearcoat: 1 })); top.rotation.x = -Math.PI / 2; g.add(top);
  for (let i = 1; i <= 5; i++) { const m = new THREE.Mesh(new THREE.BoxGeometry(i % 2 ? 0.28 : 0.45, 0.025, 0.02), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })); m.position.set(r * 0.91, h * 0.14 + i * h * 0.15, r * 0.3); m.rotation.y = -0.3; g.add(m); }
  const set = (level, color) => { const lv = Math.max(0.02, level) * h * 0.82; liq.scale.y = lv; liq.position.y = lv / 2 + 0.12; top.position.y = lv + 0.12; if (color !== undefined) { liqMat.color.setHex(color); liqMat.emissive && liqMat.emissive.setHex(color).multiplyScalar(0.12); } };
  g.userData = { set, liq, liqMat, r, h }; set(0.5, 0xcfeaff); return g;
}

/* bubbles rising inside a cylinder; rate 0..1 */
export function makeBubbles(THREE, r, h, n = 90) {
  const geo = new THREE.BufferGeometry(); const pos = new Float32Array(n * 3), spd = new Float32Array(n), ph = new Float32Array(n);
  for (let i = 0; i < n; i++) { spd[i] = 0.5 + Math.random() * 1.2; ph[i] = Math.random() * 6.28; pos[i * 3] = (Math.random() - 0.5) * r * 1.5; pos[i * 3 + 1] = Math.random() * h; pos[i * 3 + 2] = (Math.random() - 0.5) * r * 1.5; }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.11, map: glowTexture(THREE), transparent: true, opacity: 0.85, depthWrite: false }));
  pts.userData = { pos, spd, ph, n, r, h, rate: 0 };
  pts.update = (dt, level) => { const u = pts.userData; const top = level * u.h * 0.82 + 0.1; for (let i = 0; i < u.n; i++) { const active = (i / u.n) < u.rate; let y = pos[i * 3 + 1] + (active ? u.spd[i] * dt * (0.6 + u.rate * 1.2) : 0); if (y > top || !active && y < 0.15) { y = active ? 0.2 : -9; pos[i * 3] = (Math.random() - 0.5) * u.r * 1.5; pos[i * 3 + 2] = (Math.random() - 0.5) * u.r * 1.5; } pos[i * 3 + 1] = y; if (active) pos[i * 3] += Math.sin(performance.now() / 400 + u.ph[i]) * 0.002; } geo.attributes.position.needsUpdate = true; pts.visible = u.rate > 0.01; };
  pts.visible = false; return pts;
}

export function benchMaterial(THREE, color = 0x6a4a30) {
  const c = document.createElement("canvas"); c.width = 512; c.height = 512; const x = c.getContext("2d"); x.fillStyle = "#" + color.toString(16).padStart(6, "0"); x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 180; i++) { x.strokeStyle = `rgba(${40 + Math.random() * 50},${25 + Math.random() * 30},10,${0.05 + Math.random() * 0.12})`; x.lineWidth = 1 + Math.random() * 2; x.beginPath(); const y = Math.random() * 512; x.moveTo(0, y); x.bezierCurveTo(170, y + Math.random() * 14 - 7, 340, y + Math.random() * 14 - 7, 512, y + Math.random() * 10 - 5); x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); if (THREE.sRGBEncoding) t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.55, metalness: 0.02 });
}
export function addBench(THREE, scene, w = 22, d = 14, y = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.6, d), benchMaterial(THREE)); m.position.y = y - 0.3; m.receiveShadow = true; scene.add(m);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.MeshStandardMaterial({ color: 0x1b2230, roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.position.y = y - 4; floor.receiveShadow = true; scene.add(floor);
  return m;
}

/* a glass light bulb with a glowing filament and a real point light */
export function makeBulb(THREE, { light = true } = {}) {
  const g = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({ color: 0xb9b2a3, metalness: 0.95, roughness: 0.3 });
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.55, 20), metal); cap.position.y = 0.28; cap.castShadow = true; g.add(cap);
  for (let i = 0; i < 3; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.345, 0.025, 8, 20), metal); t.rotation.x = Math.PI / 2; t.position.y = 0.12 + i * 0.16; g.add(t); }
  const glass = new THREE.Mesh(new THREE.SphereGeometry(0.78, 36, 28), new THREE.MeshPhysicalMaterial({ color: 0xf2f9ff, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.3, clearcoat: 1, clearcoatRoughness: 0.02, depthWrite: false })); glass.position.y = 1.35; glass.renderOrder = 4; g.add(glass);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.38, 0.45, 20), glass.material); neck.position.y = 0.72; g.add(neck);
  const fil = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 8, 24), new THREE.MeshStandardMaterial({ color: 0x332211, emissive: 0xffaa33, emissiveIntensity: 0, roughness: 0.4 })); fil.position.y = 1.3; g.add(fil);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 8), metal); stem.position.set(-0.2, 0.95, 0); g.add(stem);
  const stem2 = stem.clone(); stem2.position.x = 0.2; g.add(stem2);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(THREE, "255,200,110"), transparent: true, depthWrite: false, depthTest: false, opacity: 0, blending: THREE.AdditiveBlending })); halo.scale.set(4.2, 4.2, 1); halo.position.y = 1.35; g.add(halo);
  let pl = null; if (light) { pl = new THREE.PointLight(0xffc27a, 0, 9, 2); pl.position.y = 1.35; g.add(pl); }
  g.userData = { glass, fil, halo, pl, blown: false, level: 0 };
  g.userData.set = level => { const u = g.userData; u.level = level; const l = u.blown ? 0 : level; fil.material.emissiveIntensity = l * 4; halo.material.opacity = Math.min(0.42, l * 0.42); halo.scale.setScalar(1.6 + l * 1.8); if (pl) pl.intensity = l * 1.1; glass.material.opacity = 0.3 - l * 0.12; };
  g.userData.blow = b => { g.userData.blown = b; fil.material.color.setHex(b ? 0x111111 : 0x332211); glass.material.color.setHex(b ? 0x777777 : 0xf2f9ff); glass.material.opacity = b ? 0.45 : 0.3; g.userData.set(g.userData.level); };
  return g;
}

export function makeCell(THREE, length = 1.7) {
  const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, length, 28), new THREE.MeshStandardMaterial({ color: 0x1f3f8a, metalness: 0.55, roughness: 0.35 })); body.rotation.z = Math.PI / 2; body.castShadow = true; g.add(body);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, length * 0.18, 28), new THREE.MeshStandardMaterial({ color: 0xffd23f, metalness: 0.4, roughness: 0.4 })); band.rotation.z = Math.PI / 2; band.position.x = -length * 0.12; g.add(band);
  const pos = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.14, 18), new THREE.MeshStandardMaterial({ color: 0xc98a4b, metalness: 0.95, roughness: 0.22 })); pos.rotation.z = Math.PI / 2; pos.position.x = length / 2 + 0.06; g.add(pos);
  const neg = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 18), new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.95, roughness: 0.3 })); neg.rotation.z = Math.PI / 2; neg.position.x = -length / 2 - 0.03; g.add(neg);
  return g;
}

export function wire(THREE, a, b, color = 0xc0392b, r = 0.07) {
  const d = new THREE.Vector3().subVectors(b, a); const len = d.length(); const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.2 })); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); m.castShadow = true; return m;
}
