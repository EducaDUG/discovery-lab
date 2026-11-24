/* Cell City - the four Investigate stations (local to this activity).
   Progress lives in sim.state.lab (CLAUDE.md 12.16) and every station works without WebGL (chips are the button route). */
import { T, C, L, esc, burstAt, floatText, shake, makeStage, reduced, clamp } from "./kit.js?v=1";
import { ORG, keysOf, icon, JOBS, BUILDS, ORDERS, MITO_E, MAXN, energyOf, sugarOf, photoCredits } from "./data.js?v=1";
import { buildCell } from "./cell3d.js?v=1";

const FALLBACK = () => L("3D view not available on this device. Everything still works with the buttons.", "La vista 3D no está disponible en este dispositivo. Todo sigue funcionando con los botones.");
const shuffle = (a, seed) => { let s = seed >>> 0 || 1; const r = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

/* two-column layout: sticky 3D view + task panel */
function layout(box, noStage) {
  box.innerHTML = `<div class="cc-split"><div class="cc-view">${noStage ? "" : `<div class="cc-stage3d" data-fallback="${esc(FALLBACK())}"><div class="cc-tag3d" hidden></div></div><div class="cc-cams"></div>`}</div><div class="cc-panel"></div></div>`;
  return { stageEl: box.querySelector(".cc-stage3d"), cams: box.querySelector(".cc-cams"), panel: box.querySelector(".cc-panel"), view: box.querySelector(".cc-view") };
}
function mount3D(L0, kind, copts = {}, sopts = {}) {
  const st = makeStage(L0.stageEl, Object.assign({ cam: { theta: .55, phi: 1.2, dist: 12.5, target: [0, 0, 0] }, limits: { minDist: 3.2, maxDist: 20, minPhi: .35, maxPhi: 1.7 }, exposure: 1.0, hemi: .55, sun: 1.7, sunPos: [5, 9, 7], shadowRange: 8, swayAmp: .16 }, sopts));
  if (!st) { L0.stageEl.parentElement.classList.add("cc-nogl"); return { st: null, cell: null }; }
  const cell = buildCell(st, kind, copts);
  if (L0.cams) L0.cams.innerHTML = "";
  /* floating name tag that follows an organelle */
  const tagEl = L0.stageEl.querySelector(".cc-tag3d"); tagEl.hidden = true; let tagKey = null; const v = new T.Vector3();
  st.onFrame.push(() => {
    if (!tagKey) return; const c = cell.centerOf(tagKey); v.set(c[0], c[1], c[2]).project(st.camera);
    const w = L0.stageEl.clientWidth, h = L0.stageEl.clientHeight; tagEl.style.left = clamp((v.x * .5 + .5) * w, 60, w - 60) + "px"; tagEl.style.top = clamp((-v.y * .5 + .5) * h - 22, 14, h - 30) + "px";
  });
  const tag = k => { tagKey = k; if (!k) { tagEl.hidden = true; return; } tagEl.hidden = false; tagEl.style.setProperty("--c", ORG[k].color); tagEl.textContent = ORG[k].name(); };
  const cv = st.canvas; let down = null;
  cv.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY]; });
  cv.addEventListener("click", e => { if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 7) return; const k = cell.pick(e.clientX, e.clientY); if (k && copts.onPick) copts.onPick(k, e); });
  let hv = 0; cv.addEventListener("pointermove", e => { if (e.buttons || performance.now() - hv < 70) return; hv = performance.now(); cv.style.cursor = cell.pick(e.clientX, e.clientY) ? "pointer" : "grab"; });
  const fly = (k, d = 5.5) => { const c = cell.centerOf(k); st.flyTo({ target: c, dist: d }); };
  const home = () => st.flyTo({ target: [0, 0, 0], dist: 12.5, theta: .55, phi: 1.2 });
  const cams = L0.cams; if (cams) {
    [[L("Whole cell", "Célula entera"), home], [L("From above", "Desde arriba"), () => st.flyTo({ target: [0, 0, 0], dist: 12.5, theta: .3, phi: .5 })], [L("Side on", "De lado"), () => st.flyTo({ target: [0, 0, 0], dist: 12.5, theta: 1.6, phi: 1.4 })], [L("Close up", "De cerca"), () => st.flyTo({ target: [0, 0, 0], dist: 6.2 })]].forEach(([n, f]) => { const b = document.createElement("button"); b.type = "button"; b.textContent = n; b.addEventListener("click", f); cams.append(b); });
  }
  return { st, cell, tag, fly, home };
}
const fb = (el, kind, html) => { el.className = "cc-fb " + (kind || ""); el.innerHTML = html; };
const chipRow = (keys, cls = "cc-orgchip") => keys.map(k => `<button type="button" class="${cls}" data-k="${k}" style="--c:${ORG[k].color}">${icon(k, 34)}<span>${esc(ORG[k].name())}</span></button>`).join("");

/* ======================================================================
   STATION 1 - Dive Inside: explore the 3D cell, then the Job Centre
   ====================================================================== */
export function station1(box, ctx) {
  const { sim, lab, addXp } = ctx; const S = lab.s1 = lab.s1 || { mode: "explore", kind: "animal", seen: { animal: {}, plant: {} }, idx: 0, got: 0, streak: 0, tries: 0, resolved: false };
  const L0 = layout(box); const P = L0.panel; let m3 = null, sel = null;
  const total = k => keysOf(k).length;
  function build(kind) {
    if (m3 && m3.st) { m3.st.dispose(); } S.kind = kind; sim.saveState();
    m3 = mount3D(L0, kind, { onPick: (k) => (S.mode === "explore" ? explore(k) : answer(k)) });
  }
  const modeBar = () => `<div class="cc-steps"><button type="button" class="cc-step ${S.mode === "explore" ? "is-on" : ""}" data-m="explore">${L("1 · Explore", "1 · Explorar")}</button><button type="button" class="cc-step ${S.mode === "jobs" ? "is-on" : ""}" data-m="jobs">${L("2 · Job Centre", "2 · Bolsa de trabajo")} (${Math.min(S.idx, JOBS.length)}/${JOBS.length})</button></div>`;

  function paint() {
    if (S.mode === "explore") {
      const n = Object.keys(S.seen[S.kind]).length;
      P.innerHTML = `${modeBar()}<h3 class="cc-h">${L("Dive inside the cell", "Sumérgete en la célula")}</h3>
        <p class="cc-sub">${L("Drag to turn the cell, scroll or pinch to zoom. <b>Tap any part</b> to meet it. Or use the buttons.", "Arrastra para girar la célula, usa la rueda o pellizca para acercar. <b>Toca cualquier parte</b> para conocerla. O usa los botones.")}</p>
        <div class="cc-row"><button type="button" class="cc-chip ${S.kind === "animal" ? "is-on" : ""}" data-kind="animal">${L("Animal cell", "Célula animal")}</button><button type="button" class="cc-chip ${S.kind === "plant" ? "is-on" : ""}" data-kind="plant">${L("Plant cell", "Célula vegetal")}</button></div>
        <div class="cc-prog" role="img" aria-label="${n}/${total(S.kind)}"><i style="width:${n / total(S.kind) * 100}%"></i><span>${L("Discovered", "Descubiertas")} ${n}/${total(S.kind)}</span></div>
        <div class="cc-orgchips">${chipRow(keysOf(S.kind))}</div>
        <div class="cc-info" role="status" aria-live="polite">${sel ? infoCard(sel) : `<p class="cc-hint">${L("Nothing selected yet. Tap a part of the cell.", "Aún no has elegido nada. Toca una parte de la célula.")}</p>`}</div>
        <div class="cc-row"><button type="button" class="cc-btn" data-go="jobs">${L("Start the Job Centre", "Empezar la bolsa de trabajo")} →</button></div>`;
      P.querySelectorAll("[data-kind]").forEach(b => b.addEventListener("click", () => { sel = null; build(b.dataset.kind); paint(); }));
      P.querySelectorAll(".cc-orgchip").forEach(b => b.addEventListener("click", () => explore(b.dataset.k, true)));
    } else paintJobs();
    P.querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => { S.mode = b.dataset.m; if (S.mode === "jobs" && S.idx < JOBS.length) build(JOBS[S.idx].cell); sim.saveState(); paint(); }));
    P.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => { S.mode = "jobs"; if (S.idx < JOBS.length) build(JOBS[S.idx].cell); sim.saveState(); paint(); }));
  }
  const infoCard = k => `<div class="cc-card3" style="--c:${ORG[k].color}">${icon(k, 52)}<div><b>${esc(ORG[k].name())}</b>${ORG[k].plant ? `<em>${L("plant cells only", "solo células vegetales")}</em>` : ""}<p>${esc(ORG[k].fn())}</p><span class="cc-tag">${esc(ORG[k].hook())}</span></div></div>`;
  function explore(k, fromChip) {
    sel = k; const first = !S.seen[S.kind][k]; S.seen[S.kind][k] = 1; sim.saveState();
    if (m3.cell) { m3.cell.pulse(k); m3.tag(k); m3.fly(k, k === "membrane" || k === "cytoplasm" || k === "wall" ? 8.5 : 5.2); if (!reduced()) m3.st.punch(.94); }
    if (first) { addXp(5, P); sim.recordTrial({ station: L("Explore", "Explorar"), step: (S.kind === "plant" ? L("Plant cell", "Célula vegetal") : L("Animal cell", "Célula animal")), part: ORG[k].name(), result: L("Discovered", "Descubierta") }); }
    paint();
  }
  /* ---- job centre ---- */
  function paintJobs() {
    if (S.idx >= JOBS.length) {
      P.innerHTML = `${modeBar()}<div class="cc-finish2"><b>${L("All eight jobs filled!", "¡Los ocho puestos cubiertos!")}</b><p>${L("Score", "Puntuación")}: ${S.got}/${JOBS.length}. ${L("You can explore the cells again any time.", "Puedes volver a explorar las células cuando quieras.")}</p></div><div class="cc-row"><button type="button" class="cc-btn cc-btn--ghost" data-m="explore">${L("Back to exploring", "Volver a explorar")}</button></div>`; return;
    }
    const j = JOBS[S.idx];
    P.innerHTML = `${modeBar()}<div class="cc-clue"><small>${L("Job advert", "Anuncio de empleo")} ${S.idx + 1}/${JOBS.length} · ${j.cell === "plant" ? L("PLANT CELL", "CÉLULA VEGETAL") : L("ANIMAL CELL", "CÉLULA ANIMAL")}</small><b>${esc(j.ad())}</b><span>${L("Tap the right part in the 3D cell, or choose it below.", "Toca la parte correcta en la célula 3D, o elígela abajo.")}</span></div>
      <div class="cc-orgchips">${chipRow(keysOf(j.cell))}</div><div class="cc-fb" role="status" aria-live="polite"></div>
      <div class="cc-row"><span class="cc-streak" aria-live="polite">${S.streak > 1 ? "🔥 " + S.streak + " " + L("in a row", "seguidas") : ""}</span><button type="button" class="cc-btn cc-next" hidden>${S.idx === JOBS.length - 1 ? L("Finish", "Terminar") : L("Next advert", "Siguiente anuncio")} →</button></div>`;
    P.querySelectorAll(".cc-orgchip").forEach(b => b.addEventListener("click", () => answer(b.dataset.k, b)));
    P.querySelector(".cc-next").addEventListener("click", () => { S.idx++; S.tries = 0; S.resolved = false; sim.saveState(); if (S.idx < JOBS.length) { build(JOBS[S.idx].cell); } else if (!lab.s1done) { lab.s1done = true; sim.saveState(); ctx.done("s1"); } paintJobs(); P.querySelectorAll("[data-m]").forEach(b => b.addEventListener("click", () => { S.mode = b.dataset.m; paint(); })); });
  }
  function answer(k) {
    if (S.mode !== "jobs" || S.idx >= JOBS.length || S.resolved) return; const j = JOBS[S.idx]; if (!keysOf(j.cell).includes(k)) { return; }
    const f = P.querySelector(".cc-fb"), nx = P.querySelector(".cc-next"); const chip = P.querySelector(`.cc-orgchip[data-k="${k}"]`);
    const row = r => sim.recordTrial({ station: L("Job Centre", "Bolsa de trabajo"), step: `${L("Advert", "Anuncio")} ${S.idx + 1}`, part: ORG[j.key].name(), result: r });
    if (k === j.key) {
      S.resolved = true; const first = S.tries === 0; S.streak++; if (first) S.got++; addXp(first ? 15 + Math.min(10, S.streak * 2) : 6, f);
      fb(f, "good", `<b>✔ ${esc(ORG[k].name())}</b> — ${esc(ORG[k].fn())}<br><span class="cc-tag">${esc(ORG[k].hook())}</span>`);
      row(first ? L("Correct first try", "Correcta a la primera") : L("Correct on second try", "Correcta al segundo intento"));
      if (m3.cell) { m3.cell.pulse(k); m3.tag(k); m3.fly(k, 5.5); m3.st.burst(new T.Vector3(...m3.cell.centerOf(k)), C(ORG[k].color).getHex(), 34, 2.6, .12); m3.st.punch(.9); }
      burstAt(chip, ORG[k].color, 18); nx.hidden = false; nx.focus();
    } else {
      S.tries++; S.streak = 0; shake(chip); shake(L0.stageEl);
      if (S.tries === 1) fb(f, "bad", `${L("Not quite. That is the", "No exactamente. Eso es")} <b>${esc(ORG[k].name())}</b>: ${esc(ORG[k].fn().split(".")[0])}. ${L("Read the advert again and try once more.", "Lee el anuncio otra vez e inténtalo de nuevo.")}`);
      else { S.resolved = true; fb(f, "bad", `${L("The answer is", "La respuesta es")} <b>${esc(ORG[j.key].name())}</b> — ${esc(ORG[j.key].fn())}<br><span class="cc-tag">${esc(ORG[j.key].hook())}</span>`); row(L("Needed the answer shown", "Se mostró la respuesta")); if (m3.cell) { m3.cell.pulse(j.key); m3.tag(j.key); m3.fly(j.key, 5.5); } nx.hidden = false; nx.focus(); }
    }
    sim.saveState();
  }
  build(S.mode === "jobs" && S.idx < JOBS.length ? JOBS[S.idx].cell : S.kind); paint();
  return () => { m3 && m3.st && m3.st.dispose(); };
}

/* ======================================================================
   STATION 2 - Photo Lab: label REAL micrographs
   ====================================================================== */
const PHOTOS = [
  { id: "cheek", src: "photos/cheek.jpg", cell: "animal",
    title: () => L("Real animal cells: human cheek", "Células animales reales: mejilla humana"),
    alt: () => L("Human cheek cells stained blue seen through a microscope", "Células de la mejilla humana teñidas de azul vistas al microscopio"),
    pins: [
      { key: "nucleus", x: 0.139, y: 0.209, hint: () => L("The small, darkest blue oval inside the cell.", "El óvalo azul más oscuro dentro de la célula.") },
      { key: "cytoplasm", x: 0.16, y: 0.27, hint: () => L("The pale blue jelly filling the cell body.", "La gelatina azul pálido que llena el cuerpo de la célula.") },
      { key: "membrane", x: 0.281, y: 0.191, hint: () => L("The thin edge right around the cell.", "El borde fino que rodea la célula.") },
    ],
    decoys: ["chloroplast", "wall"],
    reveal: () => L("Notice what is missing: no green chloroplasts, no thick cell wall (the edge is thin and the shape is irregular), and no big vacuole. That is typical of an animal cell.", "Fíjate en lo que falta: no hay cloroplastos verdes, ni pared celular gruesa (el borde es fino y la forma irregular), ni vacuola grande. Es típico de una célula animal.") },
  { id: "elodea", src: "photos/elodea.jpg", cell: "plant",
    title: () => L("Real plant cells: Elodea leaf", "Células vegetales reales: hoja de Elodea"),
    alt: () => L("Elodea pondweed leaf cells: box-shaped cells with thick outlines full of green discs", "Células de hoja de Elodea: células en forma de caja con bordes gruesos llenas de discos verdes"),
    pins: [
      { key: "wall", x: 0.573, y: 0.43, hint: () => L("The thick, regular line between neighbouring cells.", "La línea gruesa y regular entre células vecinas.") },
      { key: "chloroplast", x: 0.74, y: 0.40, hint: () => L("The many small green discs packed in the cells.", "Los muchos discos verdes pequeños apretados en las células.") },
      { key: "vacuole", x: 0.63, y: 0.505, hint: () => L("The large clear space in the middle of a cell, full of cell sap.", "El gran espacio transparente en el centro de una célula, lleno de savia.") },
    ],
    decoys: ["ribosome", "mito"],
    decoyMsg: { ribosome: () => L("Ribosomes are far too small to see with a light microscope.", "Los ribosomas son demasiado pequeños para verlos con un microscopio óptico."), mito: () => L("Mitochondria are tiny, and hard to spot with a light microscope here.", "Las mitocondrias son diminutas y aquí es difícil verlas con un microscopio óptico.") },
    reveal: () => L("Honest note: each cell also has a nucleus, but here it is hidden behind the crowd of green chloroplasts. The big clear space is the vacuole. The thick, box-like outline is the cell wall: all three are plant-only features.", "Nota honesta: cada célula también tiene núcleo, pero aquí queda oculto tras la multitud de cloroplastos verdes. El gran espacio transparente es la vacuola. El borde grueso en forma de caja es la pared celular: las tres son características solo de plantas.") },
];
export function station2(box, ctx) {
  const { sim, lab, addXp } = ctx; const S = lab.s2 = lab.s2 || { p: 0, pins: {} };
  const L0 = layout(box, true); const P = L0.panel; L0.view.innerHTML = ""; box.firstElementChild.classList.add("cc-split--photo");
  let selPin = null;
  function paint() {
    const ph = PHOTOS[Math.min(S.p, PHOTOS.length - 1)]; const done = ph.pins.filter(pn => S.pins[ph.id + pn.key]).length;
    L0.view.innerHTML = `<div class="cc-photo"><img src="${ph.src}" alt="${esc(ph.alt())}"><div class="cc-pins"></div></div><p class="cc-credit">${photoCredits([ph.id])}</p>`;
    const pins = L0.view.querySelector(".cc-pins");
    ph.pins.forEach((pn, i) => { const b = document.createElement("button"); b.type = "button"; b.className = "cc-pin" + (S.pins[ph.id + pn.key] ? " ok" : "") + (selPin === pn.key ? " sel" : ""); b.style.left = pn.x * 100 + "%"; b.style.top = pn.y * 100 + "%"; b.textContent = S.pins[ph.id + pn.key] ? "✓" : i + 1; b.setAttribute("aria-label", `${L("Pin", "Punto")} ${i + 1}`); b.addEventListener("click", () => { selPin = pn.key; paint(); }); pins.append(b); });
    const labels = shuffle(ph.pins.map(p => p.key).concat(ph.decoys), ph.id.length * 977 + 13);
    const cur = ph.pins.find(p => p.key === selPin);
    P.innerHTML = `<div class="cc-steps">${PHOTOS.map((q, i) => `<span class="cc-step ${i === S.p ? "is-on" : ""}" aria-current="${i === S.p}">${i + 1}</span>`).join("")}</div>
      <h3 class="cc-h">${esc(ph.title())}</h3>
      <p class="cc-sub">${L("This is a REAL photo through a microscope. Tap a numbered pin, then choose its label.", "Esta es una foto REAL a través de un microscopio. Toca un punto numerado y elige su etiqueta.")}</p>
      <div class="cc-prog"><i style="width:${done / ph.pins.length * 100}%"></i><span>${done}/${ph.pins.length} ${L("labelled", "etiquetadas")}</span></div>
      <div class="cc-clue" ${cur ? "" : "style='opacity:.7'"}><small>${cur ? `${L("Pin", "Punto")} ${ph.pins.indexOf(cur) + 1}` : L("No pin chosen", "Ningún punto elegido")}</small><b>${cur ? esc(cur.hint()) : L("Tap a pin on the photo first.", "Primero toca un punto de la foto.")}</b></div>
      <div class="cc-orgchips">${labels.map(k => `<button type="button" class="cc-orgchip" data-k="${k}" style="--c:${ORG[k].color}" ${!cur || S.pins[ph.id + cur.key] ? "disabled" : ""}>${icon(k, 30)}<span>${esc(ORG[k].name())}</span></button>`).join("")}</div>
      <div class="cc-fb" role="status" aria-live="polite"></div>
      <div class="cc-row"><button type="button" class="cc-btn cc-next" ${done === ph.pins.length ? "" : "hidden"}>${S.p < PHOTOS.length - 1 ? L("Next photo", "Siguiente foto") + " →" : L("Finish labelling", "Terminar el etiquetado")}</button></div>`;
    if (done === ph.pins.length) fb(P.querySelector(".cc-fb"), "good", `<b>${L("All labelled!", "¡Todo etiquetado!")}</b> ${esc(ph.reveal())}`);
    P.querySelectorAll(".cc-orgchip").forEach(b => b.addEventListener("click", () => label(ph, cur, b.dataset.k, b)));
    P.querySelector(".cc-next").addEventListener("click", () => { if (S.p < PHOTOS.length - 1) { S.p++; selPin = null; sim.saveState(); paint(); } else { if (!lab.s2done) { lab.s2done = true; sim.saveState(); ctx.done("s2"); } P.querySelector(".cc-fb").innerHTML = `<b>${L("Photo Lab complete!", "¡Laboratorio de fotos completo!")}</b>`; P.querySelector(".cc-next").hidden = true; } });
  }
  function label(ph, pin, k, btn) {
    const f = P.querySelector(".cc-fb"); if (!pin) return; const key = ph.id + pin.key; S.tries = S.tries || {}; S.tries[key] = S.tries[key] || 0;
    if (k === pin.key) {
      const first = S.tries[key] === 0; S.pins[key] = 1; addXp(first ? 12 : 5, f);
      sim.recordTrial({ station: L("Photo Lab", "Laboratorio de fotos"), step: `${ph.id === "cheek" ? L("Cheek cell", "Célula de mejilla") : L("Elodea cell", "Célula de Elodea")}: ${L("pin", "punto")} ${ph.pins.indexOf(pin) + 1}`, part: ORG[k].name(), result: first ? L("Correct first try", "Correcta a la primera") : L("Correct after retry", "Correcta tras reintentar") });
      burstAt(btn, ORG[k].color, 20); selPin = null; sim.saveState(); paint();
    } else {
      S.tries[key]++; shake(btn); shake(L0.view.querySelector(".cc-photo"));
      const msg = (ph.decoyMsg && ph.decoyMsg[k] && ph.decoyMsg[k]()) || (ph.cell === "animal" && ORG[k].plant ? L("Animal cells do not have this. Look at the photo again: is there any green or a thick box outline?", "Las células animales no tienen esto. Mira la foto otra vez: ¿ves algo verde o un borde grueso en forma de caja?") : `${esc(ORG[k].name())}: ${esc(ORG[k].fn().split(".")[0])}. ${L("Not what this pin points at.", "No es lo que señala este punto.")}`);
      fb(f, "bad", `${msg} <span class="cc-tag">${esc(pin.hint())}</span>`);
    }
  }
  paint();
  return () => {};
}

/* ======================================================================
   STATION 3 - Build-a-Cell (assembly): drop the right parts into the 3D cell
   ====================================================================== */
export function station3(box, ctx) {
  const { sim, lab, addXp } = ctx; const S = lab.s3 = lab.s3 || { idx: 0, inst: [], miss: [], results: [] };
  const L0 = layout(box); const P = L0.panel; let m3 = null;
  function mountBuild() {
    if (m3 && m3.st) m3.st.dispose(); const b = BUILDS[Math.min(S.idx, BUILDS.length - 1)];
    m3 = mount3D(L0, b.cell, { empty: true, onPick: () => {} });
    if (m3.cell) { S.inst.forEach(k => { (m3.cell.parts[k] || []).forEach(o => { o.visible = true; }); });
      const geo = b.cell === "plant" ? new T.BoxGeometry(7, 4, 4.6) : new T.SphereGeometry(3, 26, 16);
      const w = new T.LineSegments(new T.WireframeGeometry(geo), new T.LineBasicMaterial({ color: 0x4de3ff, transparent: true, opacity: .28 })); if (b.cell === "animal") w.scale.set(1.15, .9, 1);
      m3.st.scene.add(w); m3.ghost = w; w.visible = !S.inst.includes("membrane"); }
  }
  const ALLK = ["wall", "membrane", "cytoplasm", "nucleus", "mito", "ribosome", "chloroplast", "vacuole"];
  function paint() {
    if (S.idx >= BUILDS.length) { P.innerHTML = `<div class="cc-finish2"><b>${L("Three cells built!", "¡Tres células construidas!")}</b><p>${L("You built an animal cell, a leaf cell and a root cell, and decided which parts each one needs.", "Has construido una célula animal, una de hoja y una de raíz, y decidiste qué partes necesita cada una.")}</p></div><div class="cc-row"><button type="button" class="cc-btn cc-btn--ghost" data-again>${L("Rebuild for practice", "Reconstruir para practicar")}</button></div>`; P.querySelector("[data-again]").addEventListener("click", () => { S.idx = 0; S.inst = []; S.miss = []; sim.saveState(); mountBuild(); paint(); }); return; }
    const b = BUILDS[S.idx]; const need = b.need.filter(k => !S.inst.includes(k)).length;
    P.innerHTML = `<div class="cc-steps">${BUILDS.map((q, i) => `<span class="cc-step ${i === S.idx ? "is-on" : i < S.idx ? "is-on" : ""}">${i + 1}</span>`).join("")}</div>
      <h3 class="cc-h">${esc(b.title())}</h3><p class="cc-sub">${esc(b.brief())}</p>
      <div class="cc-prog"><i style="width:${(b.need.length - need) / b.need.length * 100}%"></i><span>${b.need.length - need}/${b.need.length} ${L("parts installed", "partes instaladas")}</span></div>
      <p class="cc-hint">${L("Tap a part to install it in the cell. Choose carefully: some parts do not belong here.", "Toca una parte para instalarla en la célula. Elige con cuidado: algunas partes no van aquí.")}</p>
      <div class="cc-orgchips">${ALLK.map(k => `<button type="button" class="cc-orgchip ${S.inst.includes(k) ? "is-in" : ""}" data-k="${k}" style="--c:${ORG[k].color}" ${S.inst.includes(k) ? "disabled" : ""}>${icon(k, 34)}<span>${esc(ORG[k].name())}</span></button>`).join("")}</div>
      <div class="cc-fb" role="status" aria-live="polite"></div>
      <div class="cc-row"><span class="cc-hint">${L("Wrong tries", "Intentos erróneos")}: <b>${S.miss.length}</b></span><button type="button" class="cc-btn cc-next" ${need === 0 ? "" : "hidden"}>${S.idx === BUILDS.length - 1 ? L("Finish", "Terminar") : L("Next cell", "Siguiente célula")} →</button></div>`;
    P.querySelectorAll(".cc-orgchip").forEach(c => c.addEventListener("click", () => place(c.dataset.k, c)));
    P.querySelector(".cc-next").addEventListener("click", () => { S.idx++; S.inst = []; S.miss = []; sim.saveState(); if (S.idx >= BUILDS.length && !lab.s3done) { lab.s3done = true; sim.saveState(); ctx.done("s3"); } mountBuild(); paint(); });
    if (need === 0) fb(P.querySelector(".cc-fb"), "good", `<b>✔ ${L("Complete!", "¡Completa!")}</b> ${S.miss.length ? L("Wrong tries", "Intentos erróneos") + ": " + S.miss.map(k => ORG[k].name()).join(", ") : L("Flawless build, no wrong tries!", "¡Construcción perfecta, sin errores!")}`);
  }
  function place(k, chip) {
    const b = BUILDS[S.idx]; const f = P.querySelector(".cc-fb");
    if (b.need.includes(k)) {
      S.inst.push(k); addXp(8, chip); if (k === "membrane" && m3.ghost) m3.ghost.visible = false; if (m3.cell) { m3.cell.install(k); m3.tag(k); m3.st.punch(.93); setTimeout(() => m3.tag(null), 1600); }
      const left = b.need.filter(x => !S.inst.includes(x)).length;
      if (left === 0) { const bonus = Math.max(8, 25 - S.miss.length * 5); addXp(bonus, f); sim.recordTrial({ station: L("Build-a-Cell", "Construye la célula"), step: b.title(), part: L("all parts", "todas las partes"), result: S.miss.length ? `${L("Built; wrong tries", "Construida; errores")}: ${S.miss.map(x => ORG[x].name()).join(", ")}` : L("Built with no wrong tries", "Construida sin errores") }); if (m3.cell) m3.st.burst(new T.Vector3(0, 0, 0), 0x7dffb4, 60, 3.4, .14); }
      sim.saveState(); paint(); if (left > 0) { const nf = P.querySelector(".cc-fb"); fb(nf, "good", `<b>${esc(ORG[k].name())}</b> ✔ ${esc(ORG[k].hook())}`); }
    } else {
      S.miss.push(k); shake(chip); shake(L0.stageEl); const why = b.why[k] ? b.why[k]() : L("This part does not belong in this cell.", "Esta parte no va en esta célula.");
      fb(f, "bad", `✖ <b>${esc(ORG[k].name())}</b>: ${esc(why)}`); sim.saveState(); P.querySelector(".cc-hint b").textContent = S.miss.length;
      if (m3.cell) { m3.st.burst(new T.Vector3(0, 1.5, 0), 0xff6a7a, 24, 2, .12); }
    }
  }
  mountBuild(); paint();
  return () => { m3 && m3.st && m3.st.dispose(); };
}

/* ======================================================================
   STATION 4 - Energy & Light Lab: set organelle numbers to meet a cell's demand
   ====================================================================== */
export function station4(box, ctx) {
  const { sim, lab, addXp } = ctx; const S = lab.s4 = lab.s4 || { idx: 0, mito: 4, chl: 4, light: 100, tries: 0, resolved: false };
  const L0 = layout(box); const P = L0.panel; let m3 = null, flow = null;
  const ord = () => ORDERS[Math.min(S.idx, ORDERS.length - 1)];
  function mount(kind) {
    if (m3 && m3.st) m3.st.dispose();
    m3 = mount3D(L0, kind, { empty: true, mitoCount: MAXN, chloroCount: MAXN, dense: true, onPick: () => {} });
    if (!m3.cell) return; const cell = m3.cell, st = m3.st;
    ["nucleus", "ribosome", "cytoplasm", "membrane", "wall", "vacuole"].forEach(k => (cell.parts[k] || []).forEach(o => { o.visible = true; }));
    /* streaming particles: ATP (orange) from mitochondria, sugar (yellow) from chloroplasts */
    const mk = (hex, n) => { const geo = new T.BufferGeometry(), p = new Float32Array(n * 3); geo.setAttribute("position", new T.BufferAttribute(p, 3)); const pts = new T.Points(geo, new T.PointsMaterial({ color: C(hex), size: .16, map: undefined, transparent: true, opacity: .95, depthWrite: false, blending: T.AdditiveBlending })); pts.frustumCulled = false; cell.group.add(pts); return { pts, p, n, seed: Array.from({ length: n }, (_, i) => Math.random() * 100 + i) }; };
    flow = { atp: mk(0xffa050, 70), sug: mk(0xfff070, 70) };
    st.onFrame.push((dt, t) => {
      if (!flow) return; const r = ratio(); const lerpv = (a, b, k) => a + (b - a) * k;
      [[flow.atp, "mito", S.mito, r.e], [flow.sug, "chloroplast", S.chl, r.s]].forEach(([f, key, n, q]) => {
        const srcs = (cell.parts[key] || []).filter(o => o.visible); const act = srcs.length ? Math.round(f.n * clamp(q, 0, 1.4) / 1.4) : 0;
        for (let i = 0; i < f.n; i++) { const o = srcs.length ? srcs[i % srcs.length] : null; if (!o || i >= act) { f.p[i * 3 + 1] = -99; continue; } const ph = ((t * (.4 + q * .5) + f.seed[i] * .137) % 1); const w = o.getWorldPosition(new T.Vector3()); f.p[i * 3] = lerpv(w.x, w.x * .2, ph); f.p[i * 3 + 1] = w.y + ph * 1.1; f.p[i * 3 + 2] = lerpv(w.z, w.z * .2, ph); }
        f.pts.geometry.attributes.position.needsUpdate = true;
      });
      const e = r.e; if (!reduced()) { const k = 1 + .03 * Math.sin(t * (2 + 6 * clamp(e, 0, 1.2))) * clamp(e, 0, 1); cell.group.scale.setScalar(k); }
      st.sun.intensity = .4 + 1.6 * (S.light / 100);
    });
    apply();
  }
  const ratio = () => { const o = ord(); return { e: o.demand ? energyOf(S.mito) / o.demand : 1, s: o.sugar ? sugarOf(S.chl, S.light) / o.sugar : 1 }; };
  function apply() { if (!m3 || !m3.cell) return; const o = ord(); m3.cell.setCount("mito", S.mito); m3.cell.setCount("chloroplast", o.chl ? S.chl : 0); }
  function status() {
    const o = ord(), e = energyOf(S.mito), s = sugarOf(S.chl, S.light); const eOK = e >= o.demand && e <= o.demand + 30; const sOK = !o.sugar || (s >= o.sugar && s <= o.sugar + 30); const rootBad = o.id === "root" && S.chl > 0;
    return { e, s, eOK, sOK, rootBad, ok: eOK && sOK && !rootBad };
  }
  function paint() {
    if (S.idx >= ORDERS.length) { P.innerHTML = `<div class="cc-finish2"><b>${L("Lab complete!", "¡Laboratorio completo!")}</b><p>${L("You matched organelles to the work each cell does: many mitochondria where energy is needed, chloroplasts only where there is light.", "Has ajustado los orgánulos al trabajo de cada célula: muchas mitocondrias donde hace falta energía, cloroplastos solo donde hay luz.")}</p></div><div class="cc-row"><button type="button" class="cc-btn cc-btn--ghost" data-again>${L("Run the orders again", "Repetir los pedidos")}</button></div>`; P.querySelector("[data-again]").addEventListener("click", () => { S.idx = 0; S.tries = 0; S.resolved = false; sim.saveState(); mount(ORDERS[0].cell); paint(); }); return; }
    const o = ord(); S.light = o.light; const s = status();
    P.innerHTML = `<div class="cc-steps">${ORDERS.map((q, i) => `<span class="cc-step ${i <= S.idx ? "is-on" : ""}">${i + 1}</span>`).join("")}</div>
      <div class="cc-clue"><small>${L("Order", "Pedido")} ${S.idx + 1}/${ORDERS.length} · ${esc(o.label())}</small><b>${esc(o.brief())}</b></div>
      <div class="cc-meterbox"><div class="cc-gauge2"><span>${L("Energy (mitochondria)", "Energía (mitocondrias)")}</span><div class="cc-bar2"><i data-e style="width:0"></i><u style="left:${Math.min(100, o.demand / 150 * 100)}%"></u></div><b data-et></b></div>
        ${o.sugar || o.chl ? `<div class="cc-gauge2"><span>${L("Sugar made (chloroplasts)", "Azúcar fabricado (cloroplastos)")}</span><div class="cc-bar2 cc-bar2--s"><i data-s style="width:0"></i>${o.sugar ? `<u style="left:${Math.min(100, o.sugar / 150 * 100)}%"></u>` : ""}</div><b data-st></b></div>` : ""}</div>
      <label class="cc-range"><span>${L("Mitochondria", "Mitocondrias")}: <b data-mn>${S.mito}</b></span><input type="range" min="0" max="${MAXN}" step="1" value="${S.mito}" data-mito aria-label="${L("Number of mitochondria", "Número de mitocondrias")}"></label>
      ${o.chl ? `<label class="cc-range"><span>${L("Chloroplasts", "Cloroplastos")}: <b data-cn>${S.chl}</b></span><input type="range" min="0" max="${MAXN}" step="1" value="${S.chl}" data-chl aria-label="${L("Number of chloroplasts", "Número de cloroplastos")}"></label>
      <div class="cc-lightbox"><span>${L("Light", "Luz")}: <b>${o.light}%</b></span><i style="--l:${o.light}%"></i></div>` : ""}
      <div class="cc-fb" role="status" aria-live="polite"></div>
      <div class="cc-row"><button type="button" class="cc-btn" data-lock>${L("Lock in this cell", "Fijar esta célula")}</button><button type="button" class="cc-btn cc-btn--ghost cc-next" hidden>${S.idx === ORDERS.length - 1 ? L("Finish", "Terminar") : L("Next order", "Siguiente pedido")} →</button></div>
      <p class="cc-hint">${L("Aim to meet the need without wasting much: a cell that makes far more than it uses is wasteful. Energy per mitochondrion = 10 units.", "Intenta cubrir la necesidad sin desperdiciar mucho: una célula que fabrica mucho más de lo que usa malgasta. Energía por mitocondria = 10 unidades.")}</p>`;
    const upd = () => { const q = status(); const bar = P.querySelector("[data-e]"); bar.style.width = Math.min(100, q.e / 150 * 100) + "%"; bar.parentElement.dataset.ok = q.eOK; P.querySelector("[data-et]").textContent = `${q.e} / ${o.demand}`; const bs = P.querySelector("[data-s]"); if (bs) { bs.style.width = Math.min(100, q.s / 150 * 100) + "%"; bs.parentElement.dataset.ok = q.sOK; P.querySelector("[data-st]").textContent = `${q.s}${o.sugar ? " / " + o.sugar : ""}`; } };
    P.querySelector("[data-mito]").addEventListener("input", e => { S.mito = +e.target.value; P.querySelector("[data-mn]").textContent = S.mito; apply(); upd(); sim.saveState(); });
    const cs = P.querySelector("[data-chl]"); if (cs) cs.addEventListener("input", e => { S.chl = +e.target.value; P.querySelector("[data-cn]").textContent = S.chl; apply(); upd(); sim.saveState(); });
    P.querySelector("[data-lock]").addEventListener("click", () => lock(o));
    P.querySelector(".cc-next").addEventListener("click", () => { S.idx++; S.tries = 0; S.resolved = false; if (S.idx < ORDERS.length) { S.mito = 4; S.chl = 4; mount(ORDERS[S.idx].cell); } else if (!lab.s4done) { lab.s4done = true; ctx.done("s4"); } sim.saveState(); paint(); });
    apply(); upd();
  }
  function lock(o) {
    if (S.resolved) return; const q = status(), f = P.querySelector(".cc-fb"), nx = P.querySelector(".cc-next"); S.tries++;
    const row = res => sim.recordTrial({ station: L("Energy Lab", "Laboratorio de energía"), step: o.label(), part: o.chl ? L("mito + chloro", "mito + cloro") : L("mitochondria", "mitocondrias"), mito: S.mito, chlor: o.chl ? S.chl : "-", light: o.light + "%", energy: `${q.e}/${o.demand}`, sugar: o.sugar ? `${q.s}/${o.sugar}` : "-", result: res });
    if (q.ok) {
      S.resolved = true; const pts = Math.max(8, 30 - (S.tries - 1) * 8); addXp(pts, f); row(`${L("Matched demand", "Cubrió la demanda")} (${S.tries} ${S.tries === 1 ? L("try", "intento") : L("tries", "intentos")})`);
      fb(f, "good", `<b>✔ ${L("The cell thrives!", "¡La célula prospera!")}</b> ${o.id === "root" ? L("Roots are underground in the dark, so chloroplasts would be useless. They get sugar from the leaves and release its energy with mitochondria.", "Las raíces están bajo tierra y a oscuras, así que los cloroplastos serían inútiles. Reciben azúcar de las hojas y liberan su energía con mitocondrias.") : o.id === "cloud" ? L("Less light means less sugar per chloroplast, so the cell needs MORE chloroplasts to make the same amount of food.", "Menos luz significa menos azúcar por cloroplasto, así que la célula necesita MÁS cloroplastos para fabricar la misma cantidad de alimento.") : o.chl ? L("Chloroplasts made the sugar and mitochondria released energy from it.", "Los cloroplastos fabricaron el azúcar y las mitocondrias liberaron energía de él.") : L("More work needs more mitochondria: they release the energy by aerobic respiration.", "Más trabajo necesita más mitocondrias: liberan la energía por respiración aeróbica.")}`);
      if (m3 && m3.st) { m3.st.burst(new T.Vector3(0, 0, 0), 0x7dffb4, 70, 3.6, .14); m3.st.punch(.9); } burstAt(P.querySelector("[data-lock]"), "#7dffb4", 22); nx.hidden = false; nx.focus();
    } else {
      let msg;
      if (q.rootBad) msg = L("There is no light underground, so these chloroplasts cannot make any sugar. They are wasted. Which organelle does a root cell really need?", "No hay luz bajo tierra, así que estos cloroplastos no pueden fabricar azúcar. Se desperdician. ¿Qué orgánulo necesita realmente una célula de raíz?");
      else if (q.e < o.demand) msg = L("Not enough energy: the cell would slow down and stall. Mitochondria release energy by aerobic respiration, so it needs more of them.", "No hay suficiente energía: la célula se ralentizaría y se pararía. Las mitocondrias liberan energía por respiración aeróbica, así que necesita más.");
      else if (q.e > o.demand + 30) msg = L("Far more energy than needed: the cell is wasting resources on extra mitochondria. Try fewer.", "Mucha más energía de la necesaria: la célula desperdicia recursos en mitocondrias de más. Prueba con menos.");
      else if (o.sugar && q.s < o.sugar) msg = L("Not enough sugar is being made. Photosynthesis needs chloroplasts AND light: with this light you need more chloroplasts.", "No se fabrica suficiente azúcar. La fotosíntesis necesita cloroplastos Y luz: con esta luz necesitas más cloroplastos.");
      else msg = L("More sugar than the cell needs. Try fewer chloroplasts.", "Más azúcar del que necesita la célula. Prueba con menos cloroplastos.");
      shake(P.querySelector("[data-lock]")); shake(L0.stageEl); fb(f, "bad", msg);
      if (S.tries >= 3) { S.resolved = true; const need = o.id === "root" ? L("0 chloroplasts and a few mitochondria", "0 cloroplastos y algunas mitocondrias") : `${Math.ceil(o.demand / MITO_E)}-${Math.floor((o.demand + 30) / MITO_E)} ${L("mitochondria", "mitocondrias")}${o.sugar ? `, ${Math.ceil(o.sugar / (o.light * .12))}-${Math.min(MAXN, Math.floor((o.sugar + 30) / (o.light * .12)))} ${L("chloroplasts", "cloroplastos")}` : ""}`; row(L("Needed the answer shown", "Se mostró la respuesta")); fb(f, "bad", `${msg}<br><b>${L("Target", "Objetivo")}: ${need}</b>`); nx.hidden = false; }
    }
    sim.saveState();
  }
  mount(ord().cell); paint();
  return () => { m3 && m3.st && m3.st.dispose(); flow = null; };
}
