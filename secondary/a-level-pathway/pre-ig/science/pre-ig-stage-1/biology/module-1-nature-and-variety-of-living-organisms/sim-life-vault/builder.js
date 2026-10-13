/* Station 3 — the Bio-Printer. The student builds the cell (or virus
   particle) the order asks for, part by part, and watches each part pop into
   a live 3D model: wall lattice (cellulose fibres / chitin hexes /
   peptidoglycan net), nucleus, chloroplasts, starch grains or glycogen
   granules, plasmids, protein coat. "Print" checks the build against the
   PDF's comparison table (carbohydrate store, cell wall, nucleus). */
import { L, reduced, SPEC, BUILD_ORDERS, PART_HOOK, img } from "./data.js?v=1";
import { hasWebGL, makeStage, dressVault, noiseTexture, latticeTexture, glowTexture, burst3D, burstAt, shake, floatText, blip } from "./fx.js?v=1";

const WALLS = ["none", "cellulose", "chitin", "peptidoglycan"];
const STORES = ["none", "starch", "glycogen"];
const WALL_NAME = { none: () => L("None", "Ninguna"), cellulose: () => L("Cellulose", "Celulosa"), chitin: () => L("Chitin", "Quitina"), peptidoglycan: () => L("Peptidoglycan", "Peptidoglucano") };
const STORE_NAME = { none: () => L("None", "Ninguno"), starch: () => L("Starch", "Almidón"), glycogen: () => L("Glycogen", "Glucógeno") };
const PART_NAME = { membrane: () => L("Cell membrane + cytoplasm", "Membrana celular + citoplasma"), nucleus: () => L("Nucleus", "Núcleo"), wall: () => L("Cell wall", "Pared celular"),
  chloro: () => L("Chloroplasts", "Cloroplastos"), store: () => L("Carbohydrate store", "Reserva de carbohidratos"), plasmid: () => L("Plasmids", "Plásmidos"), capsid: () => L("Protein coat around DNA/RNA", "Cubierta de proteína con ADN/ARN") };
const blank = () => ({ membrane: 1, nucleus: 0, wall: "none", chloro: 0, store: "none", plasmid: 0, capsid: 0 });

export function buildBuilder(root, sim, onDone, muteBtn) {
  sim.state.build = sim.state.build || { i: 0, printed: {}, right: {} };
  const prog = sim.state.build;
  let parts = blank();

  const card = document.createElement("section"); card.className = "card lv-station";
  card.innerHTML = `
    <div class="lv-station__head"><p class="eyebrow">${L("Station 3 · The Bio-Printer", "Estación 3 · La Bioimpresora")}</p><span class="lv-head-tools"></span></div>
    <h3 class="lv-station__title">${L("Build the cell each order asks for — then print it", "Construye la célula que pide cada encargo y luego imprímela")}</h3>
    <p class="q__hint">${L("Switch parts on and off and watch them appear in 3D. Use what you know about each kingdom: cell wall, nucleus, carbohydrate store. Print when you think it is right.",
      "Activa y desactiva partes y míralas aparecer en 3D. Usa lo que sabes de cada reino: pared celular, núcleo, reserva de carbohidratos. Imprime cuando creas que está bien.")}</p>
    <div class="lv-order"></div>
    <div class="lv-build">
      <div class="lv-stage lv-stage--build"><span class="lv-hud"></span></div>
      <div class="lv-parts" role="group" aria-label="${L("Cell parts", "Partes de la célula")}"></div>
    </div>
    <div class="lv-build__go"><button type="button" class="btn btn--signal lv-print">${L("Print it! ▶", "¡Imprímela! ▶")}</button>
      <button type="button" class="btn btn--ghost lv-clear">${L("Clear parts", "Quitar partes")}</button></div>
    <div class="lv-build__fb" aria-live="polite"></div>`;
  root.append(card);
  card.querySelector(".lv-head-tools").append(muteBtn());
  const orderEl = card.querySelector(".lv-order"), partsEl = card.querySelector(".lv-parts"), stageEl = card.querySelector(".lv-stage"), hud = card.querySelector(".lv-hud"), fb = card.querySelector(".lv-build__fb");

  const s3 = hasWebGL ? build3D(stageEl) : null;
  if (!s3) { stageEl.classList.add("lv-stage--flat"); stageEl.insertAdjacentHTML("beforeend", `<div class="lv-flat-build"></div>`); }

  const order = () => BUILD_ORDERS[prog.i % BUILD_ORDERS.length];

  function paintOrder() {
    const o = order();
    orderEl.innerHTML = `<img src="${img(o.spec)}" alt="${SPEC[o.spec].name()}"><div><p class="lv-order__kick">${L("Order", "Encargo")} ${prog.i % BUILD_ORDERS.length + 1}/${BUILD_ORDERS.length}</p>
      <p class="lv-order__txt">${L("Build ", "Construye ")}<b>${o.name()}</b></p></div>`;
    const nRight = Object.keys(prog.right).length;
    hud.innerHTML = `${L("Bio-Printer", "Bioimpresora")} · ${L("perfect prints", "impresiones perfectas")} ${nRight}/${BUILD_ORDERS.length}`;
  }
  function toggleBtn(key) {
    const b = document.createElement("button"); b.type = "button"; b.className = "lv-part";
    b.setAttribute("aria-pressed", parts[key] ? "true" : "false");
    b.innerHTML = `<span class="lv-part__sw" aria-hidden="true"></span>${PART_NAME[key]()}`;
    b.addEventListener("click", () => { parts[key] = parts[key] ? 0 : 1; changed(b, key); });
    return b;
  }
  function segBtns(key, list, names) {
    const box = document.createElement("div"); box.className = "lv-seg";
    box.innerHTML = `<span class="lv-seg__label">${PART_NAME[key]()}</span>`;
    const row = document.createElement("div"); row.className = "lv-seg__row"; row.setAttribute("role", "radiogroup"); row.setAttribute("aria-label", PART_NAME[key]());
    list.forEach(v => {
      const b = document.createElement("button"); b.type = "button"; b.className = "lv-seg__btn"; b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", parts[key] === v ? "true" : "false"); b.textContent = names[v]();
      b.addEventListener("click", () => { parts[key] = v; changed(b, key); });
      row.append(b);
    });
    box.append(row); return box;
  }
  function paintParts() {
    partsEl.innerHTML = "";
    partsEl.append(toggleBtn("membrane"), toggleBtn("nucleus"), segBtns("wall", WALLS, WALL_NAME), toggleBtn("chloro"), segBtns("store", STORES, STORE_NAME), toggleBtn("plasmid"), toggleBtn("capsid"));
  }
  function changed(btn, key) {
    blip("tap"); burstAt(btn, "#5ee6c8", 6);
    paintParts(); s3?.apply(parts, order().shape, key); paintFlat();
    fb.innerHTML = "";
  }
  function paintFlat() {
    const f = stageEl.querySelector(".lv-flat-build"); if (!f) return;
    f.innerHTML = Object.keys(PART_NAME).map(k => `<span class="lv-flat-part ${parts[k] && parts[k] !== "none" ? "is-on" : ""}">${PART_NAME[k]()}${typeof parts[k] === "string" ? ": " + (k === "wall" ? WALL_NAME : STORE_NAME)[parts[k]]() : ""}</span>`).join("");
  }

  function print(btn) {
    const o = order(), want = o.want;
    const wrong = Object.keys(want).filter(k => want[k] !== null && want[k] !== parts[k]);
    const right = wrong.length === 0;
    prog.printed[o.id] = (prog.printed[o.id] || 0) + 1;
    if (right) prog.right[o.id] = true;
    sim.saveState();
    const desc = [
      `${L("wall", "pared")}: ${WALL_NAME[parts.wall]()}`, `${L("nucleus", "núcleo")}: ${parts.nucleus ? L("yes", "sí") : "no"}`,
      `${L("store", "reserva")}: ${STORE_NAME[parts.store]()}`, `${L("membrane", "membrana")}: ${parts.membrane ? L("yes", "sí") : "no"}`,
      parts.chloro ? L("chloroplasts", "cloroplastos") : null, parts.plasmid ? L("plasmids", "plásmidos") : null, parts.capsid ? L("protein coat", "cubierta de proteína") : null,
    ].filter(Boolean).join("; ");
    sim.recordTrial({
      station: L("Bio-printer", "Bioimpresora"),
      sample: L("Order: ", "Encargo: ") + o.name(),
      evidence: desc,
      verdict: L(`Print ${prog.printed[o.id]}`, `Impresión ${prog.printed[o.id]}`),
      check: right ? L("Correct", "Correcto") : L(`Wrong - fix: ${wrong.map(k => PART_NAME[k]()).join(", ")}`, `Incorrecto - corrige: ${wrong.map(k => PART_NAME[k]()).join(", ")}`),
    });
    s3?.printed(right);
    const nextBtn = `<button type="button" class="btn ${right ? "" : "btn--ghost"} lv-next">${L("Next order →", "Siguiente encargo →")}</button>`;
    if (right) {
      blip("win"); burstAt(btn, "#2fbf71", 20); floatText(btn, "+15 XP");
      fb.innerHTML = `<p class="lv-fb lv-fb--ok"><b>${L("Perfect print!", "¡Impresión perfecta!")}</b> ${o.id === "virus" ? L("No membrane, no cytoplasm, no nucleus — just genetic material in a protein coat.", "Sin membrana, sin citoplasma, sin núcleo: solo material genético en una cubierta de proteína.") : PART_HOOK.wall(want.wall) + " " + (want.store ? PART_HOOK.store(want.store) : "")}</p>${nextBtn}`;
    } else {
      blip("bad"); shake(btn);
      const k = wrong[0], w = want[k];
      fb.innerHTML = `<p class="lv-fb lv-fb--bad"><b>${L("Print failed", "Impresión fallida")} — ${wrong.length} ${wrong.length === 1 ? L("part is wrong", "parte está mal") : L("parts are wrong", "partes están mal")}.</b>
        ${L("Check", "Revisa")} <i>${PART_NAME[k]()}</i>: ${PART_HOOK[k](w)} ${L("Fix it and print again, or move on.", "Corrígela e imprime de nuevo, o sigue adelante.")}</p>${nextBtn}`;
    }
    fb.querySelector(".lv-next").addEventListener("click", () => {
      prog.i++; sim.saveState(); parts = blank(); fb.innerHTML = ""; paintOrder(); paintParts(); s3?.apply(parts, order().shape, null, true); paintFlat();
    });
    paintOrder();
    if (BUILD_ORDERS.every(x => prog.printed[x.id]) && !prog._done) {
      prog._done = true; sim.saveState(); sim.award("lv-builder", L("Master Bio-Printer", "Maestro de la Bioimpresora")); onDone();
    }
    if (BUILD_ORDERS.every(x => prog.right[x.id])) sim.award("lv-perfect-prints", L("Five Perfect Prints", "Cinco impresiones perfectas"));
  }
  card.querySelector(".lv-print").addEventListener("click", e => print(e.currentTarget));
  card.querySelector(".lv-clear").addEventListener("click", e => { parts = blank(); changed(e.currentTarget, null); });

  paintOrder(); paintParts(); s3?.apply(parts, order().shape, null, true); paintFlat();
}

/* =========================== 3D cell model =========================== */
function build3D(wrap) {
  const st = makeStage(wrap, { dist: 6.4, target: [0, 1.6, 0], autoSpin: 0.12 });
  const { THREE, scene } = st;
  dressVault(st, { floorColor: [16, 40, 52], spores: 160, radius: 8 });
  // print bed
  const bed = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.9, 0.18, 48), new THREE.MeshStandardMaterial({ color: 0x8aa2ad, metalness: 0.85, roughness: 0.25 }));
  bed.position.y = 0.09; bed.receiveShadow = true; scene.add(bed);
  const scanRing = new THREE.Mesh(new THREE.TorusGeometry(1.75, 0.03, 8, 80), new THREE.MeshBasicMaterial({ color: 0x5ee6c8, transparent: true, opacity: 0.8 }));
  scanRing.rotation.x = Math.PI / 2; scene.add(scanRing);

  const root = new THREE.Group(); root.position.y = 1.6; scene.add(root);
  let shape = "", groups = {}, pops = {};

  function bodyMesh(kind, scale, mat) {
    let geo;
    if (kind === "box") geo = new THREE.BoxGeometry(2.3, 1.5, 1.5, 6, 6, 6);
    else if (kind === "oval") geo = new THREE.SphereGeometry(1, 40, 30);
    else if (kind === "rod") {
      // capsule: cylinder + caps merged as a group, returned below
      const grp = new THREE.Group();
      const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.6, 32, 1, true), mat); cyl.rotation.z = Math.PI / 2; grp.add(cyl);
      [-1, 1].forEach(s => { const cap = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat); cap.rotation.z = -s * Math.PI / 2; cap.position.x = s * 0.8; grp.add(cap); });
      grp.scale.setScalar(scale); return grp;
    } else if (kind === "blob") {
      geo = new THREE.SphereGeometry(1, 48, 36);
      const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const v = new THREE.Vector3().fromBufferAttribute(p, i); const n = 1 + 0.09 * Math.sin(v.x * 3.1) * Math.cos(v.y * 2.7) + 0.05 * Math.sin(v.z * 4.3); v.multiplyScalar(n); p.setXYZ(i, v.x, v.y, v.z); }
      geo.computeVertexNormals();
    } else geo = new THREE.SphereGeometry(0.9, 40, 30);
    const m = new THREE.Mesh(geo, mat);
    if (kind === "oval") m.scale.set(1.15 * scale, 0.9 * scale, 0.9 * scale); else m.scale.setScalar(scale);
    return m;
  }
  function clearAll() { while (root.children.length) root.remove(root.children[0]); groups = {}; }

  function make(key, parts, kind) {
    const g = new THREE.Group();
    if (key === "membrane") {
      g.add(bodyMesh(kind, 1, new THREE.MeshPhysicalMaterial({ color: kind === "box" ? 0xa8f0c0 : 0xffc2d4, transparent: true, opacity: 0.32, roughness: 0.15, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false })));
      // cytoplasm specks
      const n = 140, pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(kind === "rod" ? 1.2 : 1.4); if (kind === "rod") v.x *= 2.2; pos.set([v.x, v.y, v.z], i * 3); }
      const pg = new THREE.BufferGeometry(); pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      g.add(new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.05, color: 0xe8fff7, transparent: true, opacity: 0.7, depthWrite: false })));
    }
    if (key === "wall" && parts.wall !== "none") {
      const col = { cellulose: "#7dff9a", chitin: "#ffc24d", peptidoglycan: "#c59bff" }[parts.wall];
      const tex = latticeTexture(parts.wall, col);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tex, transparent: true, opacity: 0.95, emissive: new THREE.Color(col), emissiveMap: tex, emissiveIntensity: 0.5, side: THREE.DoubleSide, depthWrite: false, alphaTest: 0.05 });
      g.add(bodyMesh(kind, kind === "box" ? 1.1 : 1.12, mat));
    }
    if (key === "nucleus" && parts.nucleus) {
      const nuc = new THREE.Mesh(new THREE.SphereGeometry(0.38, 32, 24), new THREE.MeshStandardMaterial({ map: noiseTexture([110, 70, 170], 70), roughness: 0.6, emissive: 0x3a1c66, emissiveIntensity: 0.4 }));
      nuc.position.set(kind === "box" ? -0.45 : 0.15, 0.05, 0); nuc.castShadow = true; g.add(nuc);
      const nl = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 12), new THREE.MeshStandardMaterial({ color: 0x2b0f4d })); nl.position.copy(nuc.position).add(new THREE.Vector3(0.12, 0.1, 0.3)); g.add(nl);
    }
    if (key === "chloro" && parts.chloro) {
      const tex = noiseTexture([30, 140, 50], 60);
      for (let i = 0; i < 9; i++) {
        const c = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, emissive: 0x0c3a10, emissiveIntensity: 0.4 }));
        c.scale.set(1.6, 0.8, 0.9); const a = i / 9 * Math.PI * 2;
        c.position.set(Math.cos(a) * 0.75, Math.sin(a * 2) * 0.35, Math.sin(a) * 0.45); c.rotation.set(a, a * 0.5, 0);
        c.userData.a = a; g.add(c);
      }
      g.userData.drift = true;
    }
    if (key === "store" && parts.store !== "none") {
      const starch = parts.store === "starch";
      const mat = new THREE.MeshStandardMaterial({ color: starch ? 0xf4f1e6 : 0xd55b8a, roughness: starch ? 0.4 : 0.6, emissive: starch ? 0x333026 : 0x3a0f22, emissiveIntensity: 0.3 });
      const n = starch ? 7 : 26;
      for (let i = 0; i < n; i++) {
        const r = starch ? 0.1 + Math.random() * 0.05 : 0.045;
        const m = new THREE.Mesh(starch ? new THREE.SphereGeometry(r, 14, 10) : new THREE.IcosahedronGeometry(r, 0), mat);
        if (starch) m.scale.set(1.4, 1, 1);
        m.position.set((Math.random() - 0.5) * (kind === "rod" ? 2 : 1.2), (Math.random() - 0.5) * 0.7, (Math.random() - 0.5) * 0.8); g.add(m);
      }
    }
    if (key === "plasmid" && parts.plasmid) {
      for (let i = 0; i < 3; i++) {
        const t = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 8, 30), new THREE.MeshStandardMaterial({ color: 0xff5ec4, emissive: 0x6a1050, emissiveIntensity: 0.6 }));
        t.position.set(-0.6 + i * 0.6, (i % 2 ? 0.2 : -0.15), 0.2); t.rotation.set(i, i * 0.7, 0); g.add(t);
      }
      // the bacterial chromosome (one big loop) comes with the cell body
      g.userData.spin = true;
    }
    if (key === "capsid" && parts.capsid) {
      const cap = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 0), new THREE.MeshStandardMaterial({ color: 0xff8fa3, roughness: 0.35, metalness: 0.2, flatShading: true, transparent: true, opacity: 0.88 }));
      g.add(cap);
      const wire = new THREE.LineSegments(new THREE.EdgesGeometry(cap.geometry), new THREE.LineBasicMaterial({ color: 0xffe0e6 })); g.add(wire);
      const spikeMat = new THREE.MeshStandardMaterial({ color: 0xffd36b, emissive: 0x553300, emissiveIntensity: 0.4 });
      const pos = cap.geometry.attributes.position; const seen = new Set();
      for (let i = 0; i < pos.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(pos, i), key2 = v.toArray().map(x => x.toFixed(2)).join();
        if (seen.has(key2)) continue; seen.add(key2);
        const s = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 6), spikeMat);
        s.position.copy(v.clone().multiplyScalar(1.18)); s.lookAt(0, 0, 0); s.rotateX(Math.PI / 2); g.add(s);
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), spikeMat); tip.position.copy(v.clone().multiplyScalar(1.42)); g.add(tip);
      }
      // RNA helix inside
      class Helix extends THREE.Curve { getPoint(t) { return new THREE.Vector3(Math.cos(t * 26) * 0.22, (t - 0.5) * 0.9, Math.sin(t * 26) * 0.22); } }
      g.add(new THREE.Mesh(new THREE.TubeGeometry(new Helix(), 200, 0.025, 6, false), new THREE.MeshBasicMaterial({ color: 0x7dffb4 })));
      g.userData.spin = true;
    }
    return g;
  }

  let glitch = 99, cheer = 99;
  st.tick((dt, now) => {
    const slow = reduced();
    if (!slow) root.rotation.y += dt * 0.25;
    root.position.y = 1.6 + (slow ? 0 : Math.sin(now / 1000) * 0.05);
    scanRing.position.y = 0.2 + (slow ? 1.4 : (Math.sin(now / 900) * 0.5 + 0.5) * 2.6);
    Object.entries(groups).forEach(([k, g]) => {
      const p = pops[k]; if (p < 1) { pops[k] = Math.min(1, p + dt * 3); const e = 1 - Math.pow(1 - pops[k], 3); g.scale.setScalar(slow ? 1 : 0.3 + e * 0.7 + Math.sin(pops[k] * Math.PI) * 0.15); }
      if (g.userData.drift && !slow) g.children.forEach(c => { c.userData.a += dt * 0.4; c.position.x = Math.cos(c.userData.a) * 0.72; c.position.z = Math.sin(c.userData.a) * 0.45; });
      if (g.userData.spin && !slow) g.rotation.y += dt * 0.8;
    });
    glitch += dt; cheer += dt;
    if (glitch < 0.7 && !slow) root.position.x = Math.sin(glitch * 60) * 0.06 * (1 - glitch / 0.7); else root.position.x = 0;
    if (cheer < 1.2 && !slow) root.rotation.y += dt * 6 * (1 - cheer / 1.2);
    scanRing.material.color.setHex(glitch < 1.5 ? 0xff6b6b : cheer < 1.5 ? 0x7dffb4 : 0x5ee6c8);
  });

  function apply(parts, kind, changedKey, rebuild) {
    if (rebuild || kind !== shape) { clearAll(); shape = kind; changedKey = null; }
    ["membrane", "wall", "nucleus", "chloro", "store", "plasmid", "capsid"].forEach(k => {
      if (changedKey && k !== changedKey && groups[k]) return;
      if (groups[k]) { root.remove(groups[k]); delete groups[k]; }
      const on = k === "membrane" ? parts.membrane : parts[k] && parts[k] !== "none";
      if (!on) return;
      const g = make(k, parts, kind); root.add(g); groups[k] = g; pops[k] = changedKey === k ? 0 : 1;
      if (changedKey === k) burst3D(st, new THREE.Vector3(0, 1.6, 0), 0x5ee6c8, 12, 1.6);
    });
  }
  function printed(ok) {
    if (ok) { cheer = 0; burst3D(st, new THREE.Vector3(0, 1.6, 0), 0x7dffb4, 50, 3.2); st.punch(0.14); }
    else { glitch = 0; burst3D(st, new THREE.Vector3(0, 1.6, 0), 0xff6b6b, 14, 1.4); st.punch(0.04); }
  }
  return { apply, printed };
}
