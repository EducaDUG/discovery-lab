/* Exam 1 revision: the 3D cell explorer in the hero. Plant or animal cell, orbit with a sideways drag, tap a part (in 3D or on the chips) to light it up. */
import { $, $$, el, make3D, mat, glowTexture, T, popIt } from "../../../../../../engine/revision-kit.js?v=12";

const INFO = {
  wall: ["Cell wall", "Strengthens and supports the plant cell. Animal cells do not have one."],
  membrane: ["Cell membrane", "Controls what enters and exits the cell."],
  cytoplasm: ["Cytoplasm", "The jelly where the chemical reactions happen."],
  nucleus: ["Nucleus", "Controls the cell."],
  mito: ["Mitochondria", "Release energy by respiration."],
  chloro: ["Chloroplasts", "Use sunlight for photosynthesis. Only plant cells have them."],
  vacuole: ["Large vacuole", "Stores water and nutrients and helps keep the plant cell's shape."]
};
const ORDER = ["wall", "membrane", "cytoplasm", "nucleus", "mito", "chloro", "vacuole"];

export function buildCell3D({ award }) {
  const host = $("#heroStage"); if (!host) return;
  Object.values(INFO).forEach(i => { T(i[0]); T(i[1]); });
  T("Plant cell"); T("Animal cell"); T("Tap a part of the cell, in 3D or on the buttons."); T("Animal cells do not have this part.");
  const S = make3D(host, { cam: [0, 1.5, 7.2], target: [0, 0, 0], auto: 0.2, bg: null, hint: "Drag sideways to turn the cell. Tap a part." , onPick: rc => pick(rc) });
  const tabs = $("#cTabs"), parts = $("#cParts"), info = $("#cInfo");
  let kind = "plant"; const seen = new Set(); let sel = null, pulse = 0;
  const groups = {};
  if (!S) { info.innerHTML = `<b>${T("3D view is not available on this device. Everything else on the page still works.")}</b>`; }
  const THREE = S && S.THREE;
  function glow(m, v) { if (m.material && m.material.emissive) m.material.emissive.setRGB(v * 0.5, v * 0.45, v * 0.1); }
  function build() {
    if (!S) return;
    Object.values(groups).flat().forEach(m => S.scene.remove(m)); Object.keys(groups).forEach(k => delete groups[k]);
    const add = (k, m) => { (groups[k] = groups[k] || []).push(m); m.userData.part = k; S.scene.add(m); return m; };
    const plant = kind === "plant";
    if (plant) {
      add("wall", new THREE.Mesh(new THREE.BoxGeometry(4.6, 3.4, 3.2), new THREE.MeshStandardMaterial({ color: 0x2f9e4f, transparent: true, opacity: 0.22, roughness: 0.4, side: THREE.DoubleSide })));
      add("wall", new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(4.6, 3.4, 3.2)), new THREE.LineBasicMaterial({ color: 0x1f7a3a })));
      add("membrane", new THREE.Mesh(new THREE.BoxGeometry(4.3, 3.1, 2.9), new THREE.MeshStandardMaterial({ color: 0xe8c15a, transparent: true, opacity: 0.18, roughness: 0.3, side: THREE.DoubleSide })));
      add("cytoplasm", new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.0, 2.8), new THREE.MeshStandardMaterial({ color: 0xb6e3c6, transparent: true, opacity: 0.22, roughness: 0.6 })));
      const v = add("vacuole", new THREE.Mesh(new THREE.SphereGeometry(1.2, 32, 24), new THREE.MeshStandardMaterial({ color: 0x9fd4ff, transparent: true, opacity: 0.6, roughness: 0.2 }))); v.position.set(0.9, 0.1, 0); v.scale.set(1.15, 1, 0.9);
      const n = add("nucleus", new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18), mat(THREE, 0xa56fd6, { roughness: 0.4 }))); n.position.set(-1.5, 0.6, 0.4);
      const nu = add("nucleus", new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), mat(THREE, 0x5b2f9a))); nu.position.set(-1.62, 0.7, 0.8);
      [[-1.3, -1.0, 0.7], [0.2, 1.1, 1.0], [1.7, -1.1, 0.5], [-0.2, -1.1, -0.9], [1.9, 1.0, -0.6], [-1.0, 1.1, -0.8]].forEach(p => { const c = add("chloro", new THREE.Mesh(new THREE.SphereGeometry(0.28, 14, 10), mat(THREE, 0x2f9e4f, { roughness: 0.3 }))); c.scale.set(1.5, 0.8, 1); c.position.set(...p); });
      [[-1.7, -0.2, -0.8], [0.4, -0.2, 1.1], [1.9, 0.2, 0.9]].forEach(p => { const m = add("mito", new THREE.Mesh(THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.14, 0.4, 6, 12) : new THREE.SphereGeometry(0.2, 12, 10), mat(THREE, 0xf59e0b, { roughness: 0.4 }))); m.rotation.z = 1.2; m.position.set(...p); });
    } else {
      const body = (r, c, o, rough = 0.4) => new THREE.Mesh(new THREE.SphereGeometry(r, 40, 30), new THREE.MeshStandardMaterial({ color: c, transparent: true, opacity: o, roughness: rough }));
      const mb = add("membrane", body(2.0, 0xe8c15a, 0.2)); mb.scale.set(1.2, 0.95, 0.95);
      const cy = add("cytoplasm", body(1.94, 0xffc4cc, 0.3, 0.7)); cy.scale.set(1.2, 0.95, 0.95);
      const n = add("nucleus", new THREE.Mesh(new THREE.SphereGeometry(0.7, 28, 20), mat(THREE, 0xa56fd6, { roughness: 0.4 }))); n.position.set(-0.2, 0.1, 0);
      const nu = add("nucleus", new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), mat(THREE, 0x5b2f9a))); nu.position.set(-0.3, 0.2, 0.55);
      [[-1.5, -0.7, 0.6], [1.2, 0.8, 0.5], [1.4, -0.7, -0.4], [0.2, -1.1, 0.6]].forEach(p => { const m = add("mito", new THREE.Mesh(THREE.CapsuleGeometry ? new THREE.CapsuleGeometry(0.14, 0.45, 6, 12) : new THREE.SphereGeometry(0.22, 12, 10), mat(THREE, 0xf59e0b, { roughness: 0.4 }))); m.rotation.z = 0.9; m.position.set(...p); });
    }
  }
  function pick(rc) {
    const objs = Object.values(groups).flat(); const hits = rc.intersectObjects(objs, false).filter(h => h.object.userData.part && !["cytoplasm", "membrane"].includes(h.object.userData.part));
    const hit = hits[0] || rc.intersectObjects(objs, false)[0]; if (hit) choose(hit.object.userData.part);
  }
  function choose(k) {
    const inCell = groups[k] && groups[k].length;
    if (!inCell) { info.innerHTML = `<b>${T(INFO[k][0])}</b> ${T("Animal cells do not have this part.")}`; popIt(info); return; }
    sel = k; pulse = 1; seen.add(k); info.innerHTML = `<b>${T(INFO[k][0])}</b> ${T(INFO[k][1])}`;
    $$("button", parts).forEach(b => b.classList.toggle("on", b.dataset.k === k)); if (seen.size >= 7) award("cell3d");
  }
  function chips() { parts.innerHTML = ""; ORDER.forEach(k => { const b = el("button", "", T(INFO[k][0])); b.dataset.k = k; b.addEventListener("click", () => choose(k)); parts.append(b); }); }
  function tabsInit() { [["plant", "Plant cell"], ["animal", "Animal cell"]].forEach(([k, n]) => { const b = el("button", k === kind ? "on" : "", T(n)); b.addEventListener("click", () => { kind = k; $$("button", tabs).forEach(x => x.classList.toggle("on", x === b)); sel = null; build(); info.innerHTML = T("Tap a part of the cell, in 3D or on the buttons."); }); tabs.append(b); }); }
  tabsInit(); chips(); info.innerHTML = T("Tap a part of the cell, in 3D or on the buttons.");
  if (!S) return;
  build();
  let last = performance.now();
  (function loop() {
    requestAnimationFrame(loop); const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now; const t = now / 1000; pulse = Math.max(0, pulse - dt * 0.7);
    Object.keys(groups).forEach(k => groups[k].forEach((m, i) => { if (k === "mito") { m.rotation.y += dt * 0.8; m.position.y += Math.sin(t * 1.5 + i) * 0.0015; } if (k === "chloro") m.rotation.y += dt * 0.6; glow(m, k === sel ? 0.5 + Math.sin(t * 6) * 0.4 * pulse + 0.3 * pulse : 0); }));
  })();
}
