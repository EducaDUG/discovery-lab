/* Clone Command — Station 1: Propagation Bay (micropropagation / tissue culture). */
import { L, T, C, rng, clamp, makeStage, mesh, std, glassMat, steelTex, glowSprite, noiseTex, sfx, burstAt, shake, reduced, esc } from "./kit.js?v=2";

const PARENTS = [
  { id: "p1", bloom: 1.0, color: 0xfaf6ee, sick: false, name: () => L("Plant 1", "Planta 1"), stats: [5, 5], why: () => L("Large white blooms and completely healthy: exactly what the customer ordered. Every clone will copy these characteristics.", "Flores blancas grandes y totalmente sana: justo lo que pidió el cliente. Cada clon copiará estas características.") },
  { id: "p2", bloom: .5, color: 0xfaf6ee, sick: false, name: () => L("Plant 2", "Planta 2"), stats: [2, 5], why: () => L("Healthy, but the blooms are small. Clones are genetically identical to the parent, so every one would have small blooms too.", "Sana, pero con flores pequeñas. Los clones son genéticamente idénticos a la planta madre, así que todos tendrían flores pequeñas.") },
  { id: "p3", bloom: 1.0, color: 0xfaf6ee, sick: true, name: () => L("Plant 3", "Planta 3"), stats: [5, 1], why: () => L("Big blooms, but the leaves are diseased. You would be mass-producing a weak plant, and the infection could spread to every jar.", "Flores grandes, pero las hojas están enfermas. Producirías en masa una planta débil y la infección podría pasar a todos los frascos.") },
];
const ORDER = 600;

export function mountMicro(host, ctx) {
  const sim = ctx.sim;
  const S = sim.state.micro = sim.state.micro || { phase: 0, parent: null, part: null, cuts: 0, runs: [], cond: { sterile: true, nutrients: true, hormones: true, sealed: true, temp: 25 }, stock: 0, guess: 0, cycles: 0, plants: 0, delivered: false, goals: {} };
  const save = () => sim.saveState();
  host.innerHTML = `<div class="cc-split"><div class="cc-view"><div class="cc-stage3d" data-fallback="${esc(L("3D view unavailable on this device. Every control on the right still works.", "Vista 3D no disponible en este dispositivo. Todos los controles siguen funcionando."))}"></div>
    <div class="cc-cams"><button type="button" data-cam="plants">${L("Parent plants", "Plantas madre")}</button><button type="button" data-cam="jars">${L("Culture jars", "Frascos de cultivo")}</button><button type="button" data-cam="wide">${L("Whole bench", "Toda la mesa")}</button></div></div>
    <div class="cc-panel" aria-live="polite"></div></div>`;
  const panel = host.querySelector(".cc-panel");
  const CAMS = { plants: { theta: -.25, phi: 1.2, dist: 2.7, target: [-.8, 1.4, 0] }, jars: { theta: .3, phi: 1.05, dist: 2.3, target: [.75, 1.15, 0] }, wide: { theta: .1, phi: 1.15, dist: 4.1, target: [0, 1.35, 0] } };
  const st = makeStage(host.querySelector(".cc-stage3d"), { cam: CAMS.wide, limits: { minDist: 1.4, maxDist: 6, minPhi: .5, maxPhi: 1.45 }, sunPos: [2.5, 6, 4], sun: 1.5, hemi: .28, shadowRange: 3, exposure: .95, envTop: "#9fb6c4", envBot: "#141b21" });
  host.querySelectorAll("[data-cam]").forEach(b => b.addEventListener("click", () => { st && st.flyTo(CAMS[b.dataset.cam]); sfx("tick"); }));

  /* ------------------------------------------------------------ 3D scene */
  let plants = [], jars = [], batch = null, scalpel = null, flame = null;
  if (st) {
    st.scene.background = C(0x1c2a33); st.scene.fog = new T.Fog(C(0x1c2a33), 7, 16);
    const stx = steelTex().clone(); stx.needsUpdate = true; stx.repeat.set(10, 4); const steel = new T.MeshStandardMaterial({ map: stx, color: C(0xaab4bb), roughness: .38, metalness: .9 });
    st.scene.add(mesh(new T.BoxGeometry(4.2, .1, 1.5), steel, 0, .95, 0));
    st.scene.add(mesh(new T.BoxGeometry(4.2, .95, 1.4), std(0x39434b, .6, .3), 0, .45, 0));
    const wall = mesh(new T.PlaneGeometry(9, 5), std(0x4f6670, .85, 0, { map: noiseTex("#8fa6ad", .08, 900, [3, 2]) }), 0, 2.2, -.8, false); wall.receiveShadow = true; st.scene.add(wall);
    const floor = mesh(new T.PlaneGeometry(12, 8), std(0x56646c, .5, .1), 0, 0, 1.5, false); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; st.scene.add(floor);
    /* sterile hood: glass sides, top light bar */
    [-2.1, 2.1].forEach(x => { const g = mesh(new T.PlaneGeometry(1.5, 1.6), glassMat(0xbfe6ff, .16), x, 1.8, 0, false); g.rotation.y = Math.PI / 2; st.scene.add(g); });
    st.scene.add(mesh(new T.BoxGeometry(4.3, .08, 1.5), std(0xe9eef1, .4, .5), 0, 2.62, 0));
    const bar = mesh(new T.BoxGeometry(3.6, .03, .12), new T.MeshStandardMaterial({ color: 0xffffff, emissive: C(0xeaf6ff), emissiveIntensity: 2.2 }), 0, 2.57, .2, false); st.scene.add(bar);
    const pl = new T.PointLight(C(0xeaf6ff), .55, 6); pl.position.set(0, 2.4, .3); st.scene.add(pl);
    /* pink LED grow bar over jars */
    const grow = mesh(new T.BoxGeometry(1.6, .03, .5), new T.MeshStandardMaterial({ color: 0xffffff, emissive: C(0xff6ad5), emissiveIntensity: 1.1 }), .75, 1.72, 0, false); st.scene.add(grow);
    const gl = new T.PointLight(C(0xff8ad8), .55, 2.2); gl.position.set(.75, 1.6, 0); st.scene.add(gl);
    /* bleach beaker + spirit flame */
    const bk = new T.Group(); bk.position.set(-.05, 1, .42);
    bk.add(mesh(new T.CylinderGeometry(.08, .08, .2, 24, 1, true), glassMat(), 0, .1, 0, false));
    bk.add(mesh(new T.CylinderGeometry(.074, .074, .12, 24), new T.MeshStandardMaterial({ color: C(0x5bc4f0), transparent: true, opacity: .7, roughness: .1 }), 0, .065, 0, false)); st.scene.add(bk);
    const burner = new T.Group(); burner.position.set(.12, 1, .5); burner.add(mesh(new T.CylinderGeometry(.04, .05, .07, 16), std(0x8a8f94, .3, .9), 0, .035, 0));
    flame = glowSprite(0xffb347, .16); flame.position.y = .13; burner.add(flame); st.scene.add(burner);
    /* scalpel */
    scalpel = new T.Group(); scalpel.add(mesh(new T.BoxGeometry(.2, .012, .02), std(0xd8dde2, .2, 1), 0, 0, 0)); scalpel.add(mesh(new T.BoxGeometry(.09, .004, .03), std(0xf2f5f7, .1, 1), .14, 0, 0)); scalpel.position.set(-.3, 1.02, .45); scalpel.rotation.z = -.2; st.scene.add(scalpel);

    PARENTS.forEach((p, i) => { const g = makePlant(p); g.position.set(-1.45 + i * .5, 1, -.15); g.userData.id = p.id; st.scene.add(g); plants.push(g); st.pickable(g, () => pickParent(p.id)); });
    for (let i = 0; i < 10; i++) { const j = makeJar(i); j.position.set(.15 + (i % 5) * .3, 1, i < 5 ? -.2 : .2); st.scene.add(j); jars.push(j); }
    st.onFrame.push((dt, t) => {
      if (flame && !reduced()) flame.scale.setScalar(.16 + Math.sin(t * 9) * .012);
      plants.forEach((p, i) => { p.rotation.z = reduced() ? 0 : Math.sin(t * .9 + i) * .012; p.userData.ring.material.opacity = (S.parent === p.userData.id) ? .85 : 0; });
      if (batch) { const k = clamp((Date.now() - batch.start) / batch.dur, 0, 1); jars.forEach((j, i) => j.userData.apply(batch.out[i], k, batch.cond)); }
    });
    if (S.runs.length) { const r = S.runs[S.runs.length - 1]; batch = { start: 0, dur: 1, out: r.out, cond: r.cond }; }
  }

  function makePlant(p) {
    const g = new T.Group(), green = std(p.sick ? 0x9a9440 : 0x237a34, .45), stemM = std(0x3d7a35, .8);
    g.add(mesh(new T.CylinderGeometry(.15, .11, .2, 20), std(0xb5653a, .9), 0, .1, 0)); g.add(mesh(new T.CylinderGeometry(.14, .14, .02, 20), std(0x3a2a1c, 1), 0, .2, 0));
    const ring = mesh(new T.TorusGeometry(.2, .012, 8, 40), new T.MeshBasicMaterial({ color: 0x7dffb4, transparent: true, opacity: 0 }), 0, .012, 0, false); ring.rotation.x = Math.PI / 2; g.add(ring); g.userData.ring = ring;
    g.add(mesh(new T.CylinderGeometry(.014, .02, .22, 8), std(0x6b4a2c, .9), 0, .31, 0));
    const proxy = mesh(new T.CylinderGeometry(.24, .17, 1.05, 10), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), 0, .52, 0, false); g.add(proxy);
    const tips = [[0, .9, 0, 0], [-.14, .72, .04, .5], [.15, .68, -.03, -.55]];
    tips.forEach((tp, i) => {
      const len = tp[1] - .4, s = mesh(new T.CylinderGeometry(.009, .013, len, 8), stemM, tp[0] / 2, .4 + len / 2, tp[2] / 2); s.rotation.z = -tp[3] * .55; g.add(s);
      for (let k = 0; k < 4; k++) { const lf = mesh(new T.SphereGeometry(.07, 10, 8), green, tp[0] * (k / 4) + (k % 2 ? .07 : -.07), .46 + len * k / 4, tp[2] + (k % 2 ? .03 : -.03)); lf.scale.set(1.15, .12, .62); lf.rotation.z = k % 2 ? .45 : -.45; lf.rotation.y = i * 1.1 + k; g.add(lf); if (p.sick && k % 2) g.add(mesh(new T.SphereGeometry(.018, 6, 6), std(0x4a3216, 1), lf.position.x, lf.position.y + .012, lf.position.z)); }
      const bloom = new T.Group(); bloom.position.set(tp[0], tp[1] + .02, tp[2]); const pm = std(p.color, .55), sz = .075 * p.bloom * (i ? .8 : 1);
      for (let rg = 0; rg < 3; rg++) for (let k = 0; k < 6; k++) { const a = k / 6 * 6.283 + rg * .5, rr = sz * (1 - rg * .28); const pt = mesh(new T.SphereGeometry(sz * .62, 10, 8), pm, Math.cos(a) * rr, rg * sz * .3, Math.sin(a) * rr); pt.scale.set(1, .45, .75); pt.rotation.y = -a; pt.rotation.z = .5 + rg * .3; bloom.add(pt); }
      bloom.add(mesh(new T.SphereGeometry(sz * .3, 8, 8), std(0xf2d675, .6), 0, sz * .7, 0)); g.add(bloom);
      const bud = mesh(new T.SphereGeometry(.022, 8, 8), std(0x9be06a, .5), tp[0] * .82 + .03, tp[1] - .07, tp[2] + .04); g.add(bud);
    });
    return g;
  }
  function makeJar(i) {
    const g = new T.Group(), r = rng(40 + i);
    g.add(mesh(new T.CylinderGeometry(.09, .09, .24, 24, 1, true), glassMat(0xd8f1ff, .34), 0, .12, 0, false));
    g.add(mesh(new T.CylinderGeometry(.09, .09, .008, 24), glassMat(0xffffff, .3), 0, .004, 0, false));
    const lid = mesh(new T.CylinderGeometry(.096, .096, .03, 24), std(0xf4f6f7, .5), 0, .255, 0); g.add(lid);
    const agarM = new T.MeshStandardMaterial({ color: C(0xe0a93f), transparent: true, opacity: .88, roughness: .15 }); g.add(mesh(new T.CylinderGeometry(.084, .084, .05, 24), agarM, 0, .033, 0, false));
    const ex = mesh(new T.SphereGeometry(.014, 8, 6), std(0x5fae45, .6), 0, .066, 0, false); g.add(ex);
    const plant = new T.Group(); plant.position.y = .058; const gm = std(0x3fae4a, .6), rootM = std(0xf1ead6, .7);
    for (let k = 0; k < 4; k++) { const a = k * 1.7 + r() * 2, h = .07 + r() * .07, s = mesh(new T.CylinderGeometry(.003, .004, h, 5), gm, Math.cos(a) * .02, h / 2, Math.sin(a) * .02, false); s.rotation.z = (r() - .5) * .5; plant.add(s); for (let q = 0; q < 2; q++) { const lf = mesh(new T.SphereGeometry(.022, 8, 6), gm, Math.cos(a) * .02 + (q ? .02 : -.02), h * (.6 + q * .4), Math.sin(a) * .02, false); lf.scale.set(1, .2, .6); lf.rotation.z = q ? .6 : -.6; plant.add(lf); } const rt = mesh(new T.CylinderGeometry(.002, .001, .04, 4), rootM, Math.cos(a) * .025, -.02, Math.sin(a) * .025, false); rt.rotation.z = (r() - .5); plant.add(rt); }
    g.add(plant);
    const mould = new T.Group(); mould.position.y = .06; const mm = std(0x8f9c86, 1), dm = std(0x2f3a2c, 1);
    for (let k = 0; k < 9; k++) { const a = r() * 6.283, d = r() * .06; mould.add(mesh(new T.SphereGeometry(.014 + r() * .02, 8, 6), k % 3 ? mm : dm, Math.cos(a) * d, r() * .02, Math.sin(a) * d, false)); } g.add(mould);
    const callus = new T.Group(); callus.position.y = .06; for (let k = 0; k < 5; k++) callus.add(mesh(new T.SphereGeometry(.012 + r() * .008, 8, 6), std(0xd9d6a8, .8), (r() - .5) * .03, r() * .012, (r() - .5) * .03, false)); g.add(callus);
    const dead = mesh(new T.SphereGeometry(.014, 8, 6), std(0x6b5630, .9), 0, .066, 0, false); g.add(dead);
    g.userData.apply = (o, k, cond) => {
      lid.visible = !cond || cond.sealed; agarM.color.copy(C(!cond || cond.nutrients ? 0xe0a93f : 0xcdd9de));
      const z = v => Math.max(v, .0001);
      ex.visible = !o || k < .15; plant.scale.setScalar(z(o === "healthy" ? k : o === "stunted" ? k * .32 : 0)); mould.scale.setScalar(z(o === "mould" ? k * 1.15 : 0));
      callus.scale.setScalar(z(o === "callus" ? k : 0)); dead.scale.setScalar(z(o === "starved" ? Math.min(1, k * 2) : 0));
    };
    g.userData.apply(null, 0, null);
    return g;
  }

  /* --------------------------------------------------------------- model */
  function runBatch(cond, n) {
    const r = rng(1000 + n * 97 + (cond.sterile ? 1 : 0) * 3 + (cond.nutrients ? 5 : 0) + (cond.hormones ? 11 : 0) + cond.temp), out = [];
    for (let i = 0; i < 10; i++) {
      let pc = cond.sterile ? .04 : .78; if (!cond.sealed) pc = 1 - (1 - pc) * .45;
      if (r() < pc) out.push("mould");
      else if (!cond.nutrients) out.push("starved");
      else if (!cond.hormones) out.push("callus");
      else out.push(r() < Math.exp(-Math.pow((cond.temp - 25) / 9, 2)) ? "healthy" : "stunted");
    }
    return out;
  }
  const count = (out, k) => out.filter(x => x === k).length;
  const condText = c => L(`Sterilised: ${c.sterile ? "yes" : "no"}; nutrients: ${c.nutrients ? "yes" : "no"}; hormones: ${c.hormones ? "yes" : "no"}; jar: ${c.sealed ? "sealed" : "open"}; ${c.temp} C`, `Esterilizado: ${c.sterile ? "sí" : "no"}; nutrientes: ${c.nutrients ? "sí" : "no"}; hormonas: ${c.hormones ? "sí" : "no"}; frasco: ${c.sealed ? "cerrado" : "abierto"}; ${c.temp} C`);
  const outText = out => { const p = []; const add = (k, en, es) => { const n = count(out, k); if (n) p.push(`${n} ${L(en, es)}`); }; add("healthy", "healthy plantlets", "plántulas sanas"); add("mould", "contaminated (mould)", "contaminados (moho)"); add("starved", "dead, no growth", "muertos, sin crecer"); add("callus", "no roots or shoots", "sin raíces ni brotes"); add("stunted", "stunted", "poco desarrollados"); return p.join(", "); };
  const diff = (a, b) => ["sterile", "nutrients", "hormones", "sealed", "temp"].filter(k => a[k] !== b[k]).length;
  function goal(k) { if (!S.goals[k]) { S.goals[k] = 1; save(); } stars(); }
  function stars() { const g = S.goals, n = (g.parent && g.cut && g.control ? 1 : 0) + (g.nosterile && (g.nonutri || g.nohorm) ? 1 : 0) + (g.deliver ? 1 : 0); ctx.star("micro", n, !!(g.control && g.nosterile)); }

  /* ----------------------------------------------------------------- UI */
  const STEPS = () => [L("1 Parent", "1 Madre"), L("2 Explants", "2 Explantes"), L("3 Culture", "3 Cultivo"), L("4 Multiply", "4 Multiplicar")];
  function head(title, sub) {
    return `<div class="cc-steps">${STEPS().map((s, i) => `<button type="button" class="cc-step${i === S.phase ? " is-on" : ""}${i < maxPhase() + 1 ? "" : " is-lock"}" data-ph="${i}" ${i <= maxPhase() ? "" : "disabled"}>${s}</button>`).join("")}</div><h3 class="cc-h">${title}</h3>${sub ? `<p class="cc-sub">${sub}</p>` : ""}`;
  }
  const maxPhase = () => !S.goals.parent ? 0 : !S.goals.cut ? 1 : S.stock > 0 ? 3 : 2;
  function wire() { panel.querySelectorAll("[data-ph]").forEach(b => b.addEventListener("click", () => { S.phase = +b.dataset.ph; save(); render(); })); }
  const fb = (cls, html) => { const d = panel.querySelector(".cc-fb"); if (d) { d.className = "cc-fb " + cls; d.innerHTML = html; } };

  function pickParent(id) {
    if (S.phase !== 0) return;
    const p = PARENTS.find(x => x.id === id), btn = panel.querySelector(`[data-parent="${id}"]`);
    S.parent = id; save();
    if (id === "p1") { fb("good", "✔ " + p.why()); sfx("ok"); burstAt(btn); if (!S.goals.parent) ctx.gain(30, btn); goal("parent"); st && st.burst(plants[0].position.clone().setY(1.9), 0x7dffb4); panel.querySelector(".cc-next").hidden = false; wire(); }
    else { fb("bad", "✘ " + p.why() + " " + L("Choose again.", "Elige de nuevo.")); sfx("bad"); shake(btn); }
  }
  function render() {
    if (S.phase === 0) {
      st && st.flyTo(CAMS.plants);
      panel.innerHTML = head(L("Choose the parent plant", "Elige la planta madre"), L(`ORDER: a garden centre wants <b>${ORDER} identical rose plants</b> with <b>large white blooms</b> and <b>no disease</b>. Look at the three plants on the bench, then choose the one to clone.`, `PEDIDO: un vivero quiere <b>${ORDER} rosales idénticos</b> con <b>flores blancas grandes</b> y <b>sin enfermedades</b>. Observa las tres plantas y elige cuál clonar.`)) +
        `<div class="cc-cards">${PARENTS.map(p => `<button type="button" class="cc-card" data-parent="${p.id}"><b>${p.name()}</b><span>${L("Bloom size", "Tamaño de flor")} <i class="cc-bar"><i style="width:${p.stats[0] * 20}%"></i></i></span><span>${L("Health", "Salud")} <i class="cc-bar"><i style="width:${p.stats[1] * 20}%"></i></i></span></button>`).join("")}</div>
        <div class="cc-fb">${L("Tap a plant in the 3D view or a card.", "Toca una planta en la vista 3D o una tarjeta.")}</div><button type="button" class="cc-btn cc-next" ${S.goals.parent ? "" : "hidden"}>${L("Next: cut explants", "Siguiente: cortar explantes")} →</button>`;
      panel.querySelectorAll("[data-parent]").forEach(b => b.addEventListener("click", () => pickParent(b.dataset.parent)));
      panel.querySelector(".cc-next").addEventListener("click", () => { S.phase = 1; save(); render(); });
    } else if (S.phase === 1) {
      st && st.flyTo({ theta: -.1, phi: 1.1, dist: 1.6, target: [-1.45, 1.6, -.1] });
      const parts = [["tip", L("Growing shoot tips", "Puntas de brote en crecimiento")], ["wood", L("Old woody stem", "Tallo leñoso viejo")], ["petal", L("Flower petals", "Pétalos de la flor")]];
      panel.innerHTML = head(L("Cut the explants", "Corta los explantes"), L("An <b>explant</b> is a small piece of the parent plant. Which part gives the best explants?", "Un <b>explante</b> es un trocito de la planta madre. ¿Qué parte da los mejores explantes?")) +
        `<div class="cc-opts">${parts.map(p => `<button type="button" class="cc-opt" data-part="${p[0]}">${p[1]}</button>`).join("")}</div><div class="cc-fb"></div>
        <div class="cc-cut" ${S.part === "tip" ? "" : "hidden"}><p>${L("Slice 10 explants from the shoot tips:", "Corta 10 explantes de las puntas de brote:")} <b class="cc-n">${S.cuts}</b>/10</p><button type="button" class="cc-btn cc-btn--big cc-slice">${L("Slice", "Cortar")}</button>
        <div class="cc-dish">${"<i></i>".repeat(10)}</div></div><button type="button" class="cc-btn cc-next" ${S.goals.cut ? "" : "hidden"}>${L("Next: culture room", "Siguiente: sala de cultivo")} →</button>`;
      const paint = () => { panel.querySelectorAll(".cc-dish i").forEach((d, i) => d.classList.toggle("on", i < S.cuts)); panel.querySelector(".cc-n").textContent = S.cuts; };
      paint();
      panel.querySelectorAll("[data-part]").forEach(b => b.addEventListener("click", () => {
        const k = b.dataset.part;
        if (k === "tip") { S.part = "tip"; save(); b.classList.add("good"); fb("good", "✔ " + L("Shoot tips contain meristem: cells that are still dividing by mitosis, so each tiny piece can grow into a whole new plant.", "Las puntas de brote tienen meristemo: células que siguen dividiéndose por mitosis, así que cada trocito puede formar una planta completa.")); sfx("ok"); burstAt(b); panel.querySelector(".cc-cut").hidden = false; }
        else { b.classList.add("bad"); shake(b); sfx("bad"); fb("bad", "✘ " + (k === "wood" ? L("Old woody tissue has mostly stopped dividing, so it regrows slowly or not at all. Look for where the plant is actively growing.", "El tejido leñoso viejo casi no se divide, así que rebrota lento o nada. Busca dónde crece la planta.") : L("Petals are fully specialised and short-lived; they do not regrow into a plant. Look for where the plant is actively growing.", "Los pétalos están especializados y duran poco; no regeneran una planta. Busca dónde crece la planta."))); }
      }));
      panel.querySelector(".cc-slice").addEventListener("click", e => {
        if (S.cuts >= 10) return; S.cuts = Math.min(10, S.cuts + 2); save(); paint(); sfx("pop"); burstAt(e.currentTarget, "#9be06a", 8);
        if (st && scalpel) { scalpel.position.set(-1.5, 1.85, .05); st.tween(scalpel.position, { x: -1.3, y: 1.75 }, .18, { done: () => st.tween(scalpel.position, { x: -.3, y: 1.02, z: .45 }, .4) }); st.burst(new T.Vector3(-1.45, 1.85, -.1), 0x9be06a, 10, 1, .05); }
        if (S.cuts >= 10) { if (!S.goals.cut) ctx.gain(30, e.currentTarget); goal("cut"); fb("good", "✔ " + L("10 explants ready. Next they must be kept free of microorganisms and given what they need to grow.", "10 explantes listos. Ahora hay que mantenerlos sin microorganismos y darles lo que necesitan para crecer.")); panel.querySelector(".cc-next").hidden = false; wire(); }
      });
      panel.querySelector(".cc-next").addEventListener("click", () => { S.phase = 2; save(); render(); });
    } else if (S.phase === 2) renderCulture();
    else renderMultiply();
    wire();
  }

  let growing = false;
  function renderCulture() {
    st && st.flyTo(CAMS.jars);
    const c = S.cond, tg = (k, en, es, on, off) => `<label class="cc-tg"><input type="checkbox" data-k="${k}" ${c[k] ? "checked" : ""}><span><b>${L(en, es)}</b><small>${c[k] ? on : off}</small></span></label>`;
    const g = S.goals, gl = (k, t) => `<li class="${g[k] ? "done" : ""}">${t}</li>`;
    panel.innerHTML = head(L("Culture room: run fair tests", "Sala de cultivo: pruebas justas"), L("Each run grows <b>10 explants in vitro</b> (in glass) for 4 weeks. Change <b>one thing at a time</b> and compare how many healthy plantlets you get.", "Cada prueba cultiva <b>10 explantes in vitro</b> (en vidrio) durante 4 semanas. Cambia <b>una sola cosa cada vez</b> y compara cuántas plántulas sanas obtienes.")) +
      `<div class="cc-tgs">${tg("sterile", "Sterilise explants", "Esterilizar explantes", L("dipped in bleach", "bañados en lejía"), L("not sterilised", "sin esterilizar"))}${tg("nutrients", "Nutrients in agar", "Nutrientes en el agar", L("sugar + minerals", "azúcar + minerales"), L("plain agar jelly", "agar solo"))}${tg("hormones", "Plant hormones in agar", "Hormonas vegetales en el agar", L("added", "añadidas"), L("none", "ninguna"))}${tg("sealed", "Sealed sterile jar", "Frasco estéril cerrado", L("lid on", "con tapa"), L("left open to the air", "abierto al aire"))}</div>
      <label class="cc-range"><span>${L("Temperature", "Temperatura")} <b class="cc-temp">${c.temp}</b> °C</span><input type="range" min="5" max="45" step="5" value="${c.temp}" data-k="temp"></label>
      <button type="button" class="cc-btn cc-btn--big cc-grow">${L("Grow for 4 weeks", "Cultivar 4 semanas")}</button><div class="cc-prog" hidden><i></i><span></span></div>
      <div class="cc-fb"></div><ul class="cc-goals">${gl("control", L("Run the full recipe (everything on, 25 °C)", "Prueba la receta completa (todo activado, 25 °C)"))}${gl("nosterile", L("Test what happens without sterilising", "Prueba qué pasa sin esterilizar"))}${gl("nonutri", L("Test without nutrients", "Prueba sin nutrientes"))}${gl("nohorm", L("Test without hormones", "Prueba sin hormonas"))}</ul>
      <div class="cc-log"></div><button type="button" class="cc-btn cc-next" ${S.stock > 0 ? "" : "hidden"}>${L("Next: multiply and deliver", "Siguiente: multiplicar y entregar")} →</button>`;
    const logEl = panel.querySelector(".cc-log");
    const paintLog = () => { logEl.innerHTML = S.runs.slice(-4).reverse().map(r => `<div class="cc-run"><b>${L("Run", "Prueba")} ${r.n}: ${count(r.out, "healthy")}/10</b><span>${condText(r.cond)}</span><div class="cc-jars">${r.out.map(o => `<i class="j-${o}"></i>`).join("")}</div></div>`).join(""); };
    paintLog();
    panel.querySelectorAll("[data-k]").forEach(inp => inp.addEventListener("input", () => { if (growing) return; const k = inp.dataset.k; c[k] = k === "temp" ? +inp.value : inp.checked; save(); if (k === "temp") panel.querySelector(".cc-temp").textContent = c.temp; else { inp.parentElement.querySelector("small").textContent = ""; renderCulture(); wire(); } sfx("tick"); }));
    panel.querySelector(".cc-next").addEventListener("click", () => { S.phase = 3; save(); render(); });
    panel.querySelector(".cc-grow").addEventListener("click", e => {
      if (growing) return; growing = true;
      const n = S.runs.length + 1, cond = Object.assign({}, c), out = runBatch(cond, n), DUR = reduced() ? 600 : 4200, btn = e.currentTarget;
      batch = { start: Date.now(), dur: DUR, out, cond }; btn.disabled = true; panel.querySelectorAll('[data-k]').forEach(i => i.disabled = true); sfx("pop");
      const prog = panel.querySelector(".cc-prog"); prog.hidden = false; const t0 = Date.now();
      const iv = setInterval(() => { const k = clamp((Date.now() - t0) / DUR, 0, 1); prog.firstElementChild.style.width = k * 100 + "%"; prog.lastElementChild.textContent = L(`Week ${Math.min(4, Math.floor(k * 4) + 1)} of 4`, `Semana ${Math.min(4, Math.floor(k * 4) + 1)} de 4`); if (k >= 1) { clearInterval(iv); finish(); } }, 100);
      function finish() {
        growing = false; const h = count(out, "healthy"), prev = S.runs.slice();
        S.runs.push({ n, cond, out }); if (S.runs.length > 12) S.runs.shift();
        const fair = prev.some(p => diff(p.cond, cond) === 1), isCtl = cond.sterile && cond.nutrients && cond.hormones && cond.sealed && cond.temp >= 20 && cond.temp <= 30;
        if (h > S.stock) S.stock = h;
        ctx.log({ lab: L("Plants", "Plantas"), run: L(`Culture run ${n}`, `Cultivo ${n}`), setup: condText(cond), outcome: outText(out), count: `${h}/10` });
        let xp = 10, msg = `<b>${L("Result", "Resultado")}: ${outText(out)}.</b> `;
        if (isCtl) { goal("control"); } if (!cond.sterile) goal("nosterile"); if (!cond.nutrients) goal("nonutri"); if (!cond.hormones) goal("nohorm");
        if (count(out, "mould") >= 4) msg += L("Mould and bacteria got in first: they grow faster than the plant on the same agar and kill the explants.", "El moho y las bacterias llegaron antes: crecen más rápido que la planta en el mismo agar y matan los explantes.");
        else if (!cond.nutrients) msg += L("With nothing to feed on, the explants could not grow: a cut piece has no roots to absorb minerals and too few leaves to make its own food.", "Sin alimento, los explantes no crecieron: un trocito cortado no tiene raíces para absorber minerales ni hojas suficientes para fabricar su alimento.");
        else if (!cond.hormones) msg += L("The cells stayed alive but formed no roots or shoots: plant hormones are the signal that tells them to.", "Las células siguieron vivas pero no formaron raíces ni brotes: las hormonas vegetales son la señal que se lo indica.");
        else if (h >= 8) msg += L("Sterile, fed and signalled: nearly every explant became a rooted plantlet, all genetically identical to the parent.", "Estériles, alimentados y con señal: casi todos los explantes formaron plántulas con raíz, genéticamente idénticas a la madre.");
        else msg += L("Growth was poor at this temperature: the plantlets need optimum conditions.", "El crecimiento fue pobre a esta temperatura: las plántulas necesitan condiciones óptimas.");
        if (fair) { xp += 15; msg += ` <span class="cc-tag">${L("Fair test: one variable changed, +15 XP", "Prueba justa: una variable cambiada, +15 XP")}</span>`; ctx.award("cc-fair", L("Fair Tester", "Prueba Justa")); }
        if (isCtl && count(out, "mould") === 0) ctx.award("cc-sterile", L("Sterile Hands", "Manos Estériles"));
        save(); renderCulture(); wire(); fb(h >= 7 ? "good" : "bad", msg); ctx.gain(xp, panel.querySelector(".cc-grow")); sfx(h >= 7 ? "ok" : "bad");
        if (st) { st.punch(.9); jars.forEach((j, i) => { if (out[i] === "healthy") st.burst(j.position.clone().setY(1.3), 0x7dffb4, 6, .8, .05); }); }
      }
    });
  }

  function renderMultiply() {
    st && st.flyTo(CAMS.jars);
    const start = S.stock, cur = S.plants || start;
    panel.innerHTML = head(L("Multiply and deliver", "Multiplicar y entregar"), L(`Your best run gave <b>${start} healthy plantlets</b>. Every 3 weeks each plantlet can be cut into <b>4 new explants</b> and regrown (a subculture cycle). The order is for <b>${ORDER}</b>.`, `Tu mejor prueba dio <b>${start} plántulas sanas</b>. Cada 3 semanas, cada plántula se puede cortar en <b>4 explantes nuevos</b> y volver a cultivar (un ciclo de subcultivo). El pedido es de <b>${ORDER}</b>.`)) +
      (S.guess ? "" : `<p class="cc-q">${L("Before you start: how many cycles will it take to reach the order?", "Antes de empezar: ¿cuántos ciclos harán falta para completar el pedido?")}</p><div class="cc-opts cc-opts--row">${[1, 2, 3, 4, 5, 6].map(n => `<button type="button" class="cc-opt" data-guess="${n}">${n}</button>`).join("")}</div>`) +
      `<div class="cc-mult" ${S.guess ? "" : "hidden"}><div class="cc-counter"><b class="cc-plants">${cur.toLocaleString()}</b><span>${L("identical plants", "plantas idénticas")}</span><small>${L("Cycle", "Ciclo")} ${S.cycles} · ${S.cycles * 3} ${L("weeks", "semanas")} · ${L("your prediction", "tu predicción")}: ${S.guess}</small></div>
      <div class="cc-shelf">${shelf(cur)}</div>
      <button type="button" class="cc-btn cc-btn--big cc-subc" ${cur >= ORDER ? "hidden" : ""}>${L("Subculture ×4", "Subcultivar ×4")}</button>
      <button type="button" class="cc-btn cc-btn--big cc-ship" ${cur >= ORDER && !S.delivered ? "" : "hidden"}>${L("Harden off in the greenhouse and deliver", "Aclimatar en invernadero y entregar")}</button></div><div class="cc-fb"></div>`;
    panel.querySelectorAll("[data-guess]").forEach(b => b.addEventListener("click", () => { S.guess = +b.dataset.guess; S.plants = start; save(); sfx("tick"); renderMultiply(); wire(); }));
    const sub = panel.querySelector(".cc-subc"), ship = panel.querySelector(".cc-ship");
    if (S.delivered) doneMsg();
    sub && sub.addEventListener("click", () => {
      S.plants = (S.plants || start) * 4; S.cycles++; save(); sfx("coin"); renderMultiply(); wire(); burstAt(panel.querySelector(".cc-plants"), "#7dffb4", 18); ctx.gain(8, panel.querySelector(".cc-plants"));
      st && jars.forEach(j => st.burst(j.position.clone().setY(1.3), 0x7dffb4, 5, .8, .05));
      if (S.plants >= ORDER) fb("good", L(`Order reached in ${S.cycles} cycles (${S.cycles * 3} weeks). You predicted ${S.guess}. ${S.guess === S.cycles ? "Spot on!" : "Each cycle multiplies by 4, so the numbers explode."}`, `Pedido alcanzado en ${S.cycles} ciclos (${S.cycles * 3} semanas). Predijiste ${S.guess}. ${S.guess === S.cycles ? "¡Exacto!" : "Cada ciclo multiplica por 4, así que los números se disparan."}`));
    });
    ship && ship.addEventListener("click", () => {
      S.delivered = true; save();
      ctx.log({ lab: L("Plants", "Plantas"), run: L("Subculture", "Subcultivo"), setup: L(`Start ${start} plantlets; x4 per cycle; ${S.cycles} cycles (${S.cycles * 3} weeks); predicted ${S.guess} cycles`, `Inicio ${start} plántulas; x4 por ciclo; ${S.cycles} ciclos (${S.cycles * 3} semanas); predicción ${S.guess} ciclos`), outcome: L("Order delivered: all plants genetically identical to the parent", "Pedido entregado: todas las plantas genéticamente idénticas a la madre"), count: String(S.plants) });
      goal("deliver"); ctx.gain(60 + (S.guess === S.cycles ? 20 : 0), ship); sfx("win"); ctx.award("cc-mass", L("Mass Producer", "Producción en Masa")); renderMultiply(); wire();
    });
    function doneMsg() { fb("good", "✔ " + L(`Delivered ${S.plants.toLocaleString()} identical rose plants in ${S.cycles * 3} weeks. Taking cuttings from one plant would give about 20 a year. That is why growers use micropropagation for commercial quantities.`, `Entregaste ${S.plants.toLocaleString()} rosales idénticos en ${S.cycles * 3} semanas. Con esquejes de una planta saldrían unos 20 al año. Por eso los productores usan la micropropagación para cantidades comerciales.`)); }
  }
  const shelf = n => { const show = Math.min(n, 96); return `${'<i class="cc-jar"></i>'.repeat(show)}${n > show ? `<b>+${(n - show).toLocaleString()}</b>` : ""}`; };

  stars(); render();
  return { dispose() { st && st.dispose(); } };
}
