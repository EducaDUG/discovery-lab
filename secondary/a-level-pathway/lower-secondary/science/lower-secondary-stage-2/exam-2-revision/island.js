/* Exam 2 revision: the 3D Energy Island. A small island with a wind turbine, solar panels and a coal power station.
   Sliders move the Sun and the wind; a switch burns coal. The houses light up when supply meets demand, and CO2 climbs when coal burns. */
import { $, make3D, mat, glowTexture, clamp, rnd, reduced, T } from "../../../../../../engine/revision-kit.js?v=12";

export function buildIsland({ award }) {
  const host = $("#heroStage"); if (!host) return;
  const S = make3D(host, { cam: [0, 4.6, 9.4], target: [0, 0.8, 0], auto: 0.12, bg: null, hint: "Drag sideways to turn the island" });
  const ui = { time: $("#isTime"), wind: $("#isWind"), coal: $("#isCoal"), solar: $("#isSolarOut"), windOut: $("#isWindOut"), coalOut: $("#isCoalOut"), total: $("#isTotal"), co2: $("#isCo2"), lamps: $("#isLamps") };
  if (!S) { return; }
  const THREE = S.THREE; const used = { time: false, wind: false, coal: false };
  const check = () => { if (used.time && used.wind && used.coal) award("island"); };
  /* sea and island */
  const sea = new THREE.Mesh(new THREE.CircleGeometry(14, 48), new THREE.MeshStandardMaterial({ color: 0x1c6fa8, roughness: 0.3, metalness: 0.1 })); sea.rotation.x = -Math.PI / 2; sea.position.y = -0.25; S.scene.add(sea);
  const isle = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.2, 0.7, 40), mat(THREE, 0x3d9a4a, { roughness: 0.9 })); isle.position.y = -0.05; S.scene.add(isle);
  const sand = new THREE.Mesh(new THREE.CylinderGeometry(5.3, 5.5, 0.3, 40), mat(THREE, 0xe6cf8a, { roughness: 1 })); sand.position.y = -0.2; S.scene.add(sand);
  /* wind turbine */
  const tur = new THREE.Group(); tur.position.set(-2.4, 0.3, -0.6); S.scene.add(tur);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 3.4, 12), mat(THREE, 0xf2f6f8)); tower.position.y = 1.7; tur.add(tower);
  const hub = new THREE.Group(); hub.position.set(0, 3.4, 0.25); tur.add(hub);
  hub.add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), mat(THREE, 0xffffff)));
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.7, 0.04), mat(THREE, 0xffffff)); b.position.y = 0.85; const pv = new THREE.Group(); pv.rotation.z = i * 2.094; pv.add(b); hub.add(pv); }
  /* solar panels */
  const panels = []; for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.06, 1), new THREE.MeshStandardMaterial({ color: 0x1a3d8f, roughness: 0.2, metalness: 0.6, emissive: 0x000000 })); p.position.set(0.4 + i * 1.7 - 0.6, 0.55, 2.4); p.rotation.x = -0.55; S.scene.add(p); panels.push(p); }
  /* coal power station */
  const coal = new THREE.Group(); coal.position.set(2.5, 0.3, -1.4); S.scene.add(coal);
  const blk = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.1, 1.2), mat(THREE, 0x6b6560)); blk.position.y = 0.55; coal.add(blk);
  const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 2.4, 14), mat(THREE, 0x8a8480)); chim.position.set(0.5, 1.6, 0); coal.add(chim);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(THREE, "255,140,60"), transparent: true, depthWrite: false })); glow.position.set(-0.3, 0.7, 0.7); glow.scale.set(1.2, 1.2, 1); coal.add(glow);
  const smoke = []; for (let i = 0; i < 26; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(THREE, "90,90,90"), transparent: true, opacity: 0.5, depthWrite: false })); sp.userData = { t: i / 26 }; sp.visible = false; coal.add(sp); smoke.push(sp); }
  /* houses */
  const houses = []; for (let i = 0; i < 6; i++) { const h = new THREE.Group(); const w = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.55), mat(THREE, 0xf1e4d0)); w.position.y = 0.22; h.add(w); const r = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.35, 4), mat(THREE, 0xb5473a)); r.position.y = 0.62; r.rotation.y = Math.PI / 4; h.add(r); const win = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.18), new THREE.MeshBasicMaterial({ color: 0x333333 })); win.position.set(0, 0.25, 0.28); h.add(win); h.position.set(-1 + (i % 3) * 1.1, 0.3, 0.2 + Math.floor(i / 3) * 1); S.scene.add(h); houses.push(win); }
  /* sun and sky */
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.55, 24, 18), new THREE.MeshBasicMaterial({ color: 0xfff1a8 })); S.scene.add(sun);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(THREE, "255,235,150"), transparent: true, depthWrite: false })); halo.scale.set(3, 3, 1); sun.add(halo);
  const state = { out: { solar: 0, wind: 0, coal: 0 }, co2: 0, shown: 0 };
  function compute() {
    const h = +ui.time.value, w = +ui.wind.value / 100, elev = Math.max(0, Math.sin(Math.PI * (h - 6) / 12));
    state.out.solar = 45 * elev; state.out.wind = 55 * w; state.out.coal = ui.coal.checked ? 60 : 0;
    const total = state.out.solar + state.out.wind + state.out.coal;
    ui.solar.style.width = state.out.solar / 60 * 100 + "%"; ui.windOut.style.width = state.out.wind / 60 * 100 + "%"; ui.coalOut.style.width = state.out.coal / 60 * 100 + "%";
    const lit = Math.round(clamp(total / 100, 0, 1) * 6); houses.forEach((win, i) => win.material.color.set(i < lit ? 0xffe27a : 0x333333));
    ui.total.textContent = `${Math.round(total)} / 100 MW`; ui.lamps.textContent = `${lit} / 6 ${T("homes lit")}`;
    return { h, elev, w };
  }
  ["time", "wind"].forEach(k => ui[k].addEventListener("input", () => { used[k] = true; $("#isTimeLbl").textContent = String(ui.time.value).padStart(2, "0") + ":00"; $("#isWindLbl").textContent = ui.wind.value + "%"; compute(); check(); }));
  ui.coal.addEventListener("change", () => { used.coal = true; compute(); check(); });
  compute();
  const sky = new THREE.Color();
  S.onFrame = null;
  let last = performance.now();
  (function loop() {
    requestAnimationFrame(loop); const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
    const { h, elev, w } = compute();
    hub.rotation.z -= dt * (0.2 + w * 7) * (reduced() ? 0.3 : 1);
    sun.position.set(Math.cos(Math.PI * (h - 6) / 12) * -7, 1 + Math.sin(Math.PI * (h - 6) / 12) * 6, -3); sun.visible = elev > 0.02;
    panels.forEach(p => p.material.emissive.setRGB(0.1 * elev, 0.3 * elev, 0.8 * elev));
    sky.setRGB(0.04 + 0.4 * elev, 0.08 + 0.6 * elev, 0.18 + 0.78 * elev); S.scene.background = sky; S.scene.fog = null;
    const burning = state.out.coal > 0; glow.visible = burning; if (burning) state.co2 += dt * 6; ui.co2.textContent = Math.round(state.co2);
    smoke.forEach(sp => { sp.visible = burning; if (!burning) return; const u = sp.userData; u.t = (u.t + dt * 0.25) % 1; sp.position.set(0.5 + u.t * 1.6, 2.8 + u.t * 2.4, Math.sin(u.t * 7) * 0.2); const s = 0.5 + u.t * 1.6; sp.scale.set(s, s, 1); sp.material.opacity = 0.55 * (1 - u.t); });
  })();
}
