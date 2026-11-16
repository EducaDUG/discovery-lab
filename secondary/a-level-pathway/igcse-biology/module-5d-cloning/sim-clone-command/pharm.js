/* Clone Command — Station 3: Pharming Barn (cloned transgenic animals making human proteins). */
import { L, T, C, clamp, lerp, rng, makeStage, mesh, std, glassMat, steelTex, skyBackdrop, meadow, makeSheep, dnaMarker, noiseTex, sfx, burstAt, shake, reduced, esc } from "./kit.js?v=2";

const ORDER = 60, ROUND = 45;
const GENES = [
  { id: "human", ok: true, name: () => L("Human gene for the protein AAT", "Gen humano de la proteína AAT"), why: () => L("Correct. The gene is the instruction for making the protein. With the human AAT gene in her cells, the ewe makes human AAT in her milk. An animal carrying a gene from another species is called transgenic.", "Correcto. El gen es la instrucción para fabricar la proteína. Con el gen humano de la AAT en sus células, la oveja produce AAT humana en su leche. Un animal con un gen de otra especie se llama transgénico.") },
  { id: "wool", ok: false, name: () => L("Sheep gene for faster wool growth", "Gen de oveja para lana de crecimiento rápido"), why: () => L("That gene is the instruction for wool, not for the human protein the patients need.", "Ese gen es la instrucción para la lana, no para la proteína humana que necesitan los pacientes.") },
  { id: "bact", ok: false, name: () => L("Bacterial gene for antibiotic resistance", "Gen bacteriano de resistencia a antibióticos"), why: () => L("That gene would make a bacterial protein. The patients need human AAT, so the instruction must be the human AAT gene.", "Ese gen fabricaría una proteína bacteriana. Los pacientes necesitan AAT humana, así que la instrucción debe ser el gen humano de la AAT.") },
];

export function mountPharm(host, ctx) {
  const sim = ctx.sim;
  const P = sim.state.ph = sim.state.ph || { phase: 0, gene: false, flocks: [], sel: -1, goals: {}, n: 0, best: 0 };
  const save = () => sim.saveState();
  host.innerHTML = `<div class="cc-split"><div class="cc-view"><div class="cc-stage3d" data-fallback="${esc(L("3D view unavailable on this device. Every control on the right still works.", "Vista 3D no disponible en este dispositivo. Todos los controles siguen funcionando."))}"></div>
    <div class="cc-cams"><button type="button" data-cam="yard">${L("Barn yard", "Corral")}</button><button type="button" data-cam="dna">${L("DNA", "ADN")}</button><button type="button" data-cam="tank">${L("Milk tank", "Tanque de leche")}</button></div></div><div class="cc-panel" aria-live="polite"></div></div>`;
  const panel = host.querySelector(".cc-panel");
  const CAMS = { yard: { theta: .2, phi: 1.12, dist: 9.5, target: [.3, .8, 0] }, dna: { theta: -.15, phi: 1.3, dist: 4.2, target: [-4.2, 1.3, 1.4] }, tank: { theta: .5, phi: 1.2, dist: 4.5, target: [4.7, 1, 1.6] } };
  const st = makeStage(host.querySelector(".cc-stage3d"), { cam: CAMS.yard, limits: { minDist: 2.5, maxDist: 15, minPhi: .6, maxPhi: 1.5 }, sunPos: [-5, 9, 7], shadowRange: 9, swayAmp: .06 });
  host.querySelectorAll("[data-cam]").forEach(b => b.addEventListener("click", () => { st && st.flyTo(CAMS[b.dataset.cam]); sfx("tick"); }));
  let timer = 0; const clear = () => { clearInterval(timer); timer = 0; };
  const game = { on: false, end: 0, doses: 0, ready: [] };

  /* ------------------------------------------------------------ 3D scene */
  const slots = []; let tracy = null, insert = null, milk = null;
  if (st) {
    skyBackdrop(st, "#5fa8e6", "#cfe6f7", "#f6e7c8"); meadow(st);
    /* barn */
    const red = std(0xa63a2c, .85, 0, { map: noiseTex("#a63a2c", .12, 1200, [3, 2]) }), barn = new T.Group(); barn.position.set(0, 0, -6);
    barn.add(mesh(new T.BoxGeometry(9, 3.4, 4), red, 0, 1.7, 0));
    const roof = mesh(new T.CylinderGeometry(.01, 3.3, 2, 4, 1), std(0x4a4f57, .6, .3), 0, 4.4, 0); roof.rotation.y = Math.PI / 4; roof.scale.set(1.45, 1, 1); barn.add(roof);
    barn.add(mesh(new T.BoxGeometry(2.2, 2.4, .1), std(0x3a2418, .9), 0, 1.2, 2.02)); [-3, 3].forEach(x => barn.add(mesh(new T.BoxGeometry(1, 1, .1), std(0xfff3c4, .4, 0, { emissive: C(0xffd27a), emissiveIntensity: .5 }), x, 2.1, 2.02)));
    st.scene.add(barn);
    const wood = std(0x8a6a45, .9); for (let i = -4; i <= 4; i++) { st.scene.add(mesh(new T.CylinderGeometry(.05, .06, .9, 8), wood, i * 1.2 + .4, .45, -3.2)); } st.scene.add(mesh(new T.BoxGeometry(10, .07, .05), wood, .4, .7, -3.2));
    /* founder ewe */
    tracy = makeSheep("white", { seed: 3, scale: 1.3 }); tracy.position.set(-3.6, 0, 1.2); tracy.rotation.y = -Math.PI / 2 + .9; st.scene.add(tracy);
    const tm = dnaMarker(0x4de3ff); tm.position.set(0, 1.25, 0); tm.scale.setScalar(1.6); tm.visible = false; tracy.add(tm); tracy.userData.marker = tm;
    /* DNA helix beside her, with a gap for the inserted gene */
    const helix = new T.Group(); helix.position.set(-4.9, 1.9, 1.6); st.scene.add(helix);
    const bb = std(0xdfe6ee, .35, .2), base = [0xff7a7a, 0xffd166, 0x7ad7ff, 0x9be06a]; insert = new T.Group(); helix.add(insert);
    for (let i = 0; i < 22; i++) {
      const a = i * .55, y = (i - 11) * .075, isGap = i >= 8 && i <= 13, grp = isGap ? insert : helix, m = isGap ? new T.MeshStandardMaterial({ color: C(0x4de3ff), emissive: C(0x4de3ff), emissiveIntensity: 1.3, roughness: .3 }) : bb;
      grp.add(mesh(new T.SphereGeometry(.05, 10, 8), m, Math.cos(a) * .22, y, Math.sin(a) * .22, false)); grp.add(mesh(new T.SphereGeometry(.05, 10, 8), m, -Math.cos(a) * .22, y, -Math.sin(a) * .22, false));
      const rung = mesh(new T.CylinderGeometry(.018, .018, .44, 6), isGap ? m : std(base[i % 4], .5), 0, y, 0, false); rung.rotation.z = Math.PI / 2; rung.rotation.y = -a; grp.add(rung);
    }
    insert.visible = !!P.gene; helix.userData.spin = true;
    /* milk tank */
    const tank = new T.Group(); tank.position.set(4.7, 0, 1.6); const steel = new T.MeshStandardMaterial({ map: steelTex(), color: C(0xe6ecef), roughness: .28, metalness: .9 });
    tank.add(mesh(new T.CylinderGeometry(.62, .62, 1.3, 32, 1, true), glassMat(0xffffff, .22), 0, .85, 0, false)); tank.add(mesh(new T.CylinderGeometry(.66, .7, .2, 32), steel, 0, .1, 0)); tank.add(mesh(new T.CylinderGeometry(.66, .66, .12, 32), steel, 0, 1.56, 0));
    milk = mesh(new T.CylinderGeometry(.58, .58, 1, 32), std(0xfdfdf6, .25), 0, .2, 0, false); milk.scale.y = .02; tank.add(milk); st.scene.add(tank);
    /* 8 flock slots */
    for (let i = 0; i < 8; i++) {
      const s = makeSheep("white", { seed: 50 + i * 3, scale: 1.05 }); s.position.set(-1.6 + (i % 4) * 1.5, 0, i < 4 ? -1.2 : 1.1); s.rotation.y = -Math.PI / 2 + (i % 2 ? .5 : -.4); s.visible = false; st.scene.add(s);
      const m = dnaMarker(0x4de3ff); m.position.y = 1.3; m.scale.setScalar(1.5); s.add(m); s.userData.marker = m; s.userData.pop = { v: 1 }; slots.push(s); st.pickable(s, () => milkSheep(i));
    }
    st.onFrame.push((dt, t) => {
      tracy.userData.idle(t); tracy.userData.marker.visible = !!P.gene; tracy.userData.marker.rotation.y = t * 1.5;
      helix.rotation.y = reduced() ? .6 : t * .5; helix.position.y = 1.9 + (reduced() ? 0 : Math.sin(t) * .04); insert.visible = !!P.gene;
      const f = P.flocks[P.sel];
      slots.forEach((s, i) => { s.visible = !!f; if (!f) return; s.userData.idle(t); s.scale.setScalar(1.05 * s.userData.pop.v); const car = f.car[i]; s.userData.marker.visible = !!car; s.userData.marker.rotation.y = t * 1.5; if (car && game.on) s.userData.marker.scale.setScalar(Date.now() >= (game.ready[i] || 0) ? 1.5 + Math.sin(t * 4) * .12 : .7); else s.userData.marker.scale.setScalar(1.5); });
      milk.scale.y = lerp(milk.scale.y, clamp(.02 + (game.doses / ORDER) * 1.05, .02, 1.25), .08); milk.position.y = .2 + milk.scale.y / 2;
    });
  }
  function popFlock() { if (!st) return; slots.forEach((s, i) => { s.userData.pop.v = .01; st.tween(s.userData.pop, { v: 1 }, .5, { delay: i * .09 }); }); const f = P.flocks[P.sel]; setTimeout(() => slots.forEach((s, i) => f && st.burst(s.position.clone().setY(1), f.car[i] ? 0x4de3ff : 0xffffff, 8, 1.2, .07)), 300); }

  /* ----------------------------------------------------------------- UI */
  const fb = (cls, html) => { const d = panel.querySelector(".cc-fb"); if (d) { d.className = "cc-fb " + cls; d.innerHTML = html; } };
  function goal(k) { if (k && !P.goals[k]) { P.goals[k] = 1; save(); } const g = P.goals; ctx.star("pharm", (g.gene && g.bred && g.cloned ? 1 : 0) + (g.order ? 1 : 0) + (g.milkBred && g.milkCloned ? 1 : 0), !!(g.bred && g.cloned)); }
  const flockName = f => f.type === "clone" ? L("Cloned flock", "Rebaño clonado") : L("Bred flock", "Rebaño criado");
  const cars = f => f.car.filter(Boolean).length;
  const steps = () => `<div class="cc-steps">${[L("1 Gene", "1 Gen"), L("2 Flock", "2 Rebaño"), L("3 Milk", "3 Ordeño")].map((s, i) => `<button type="button" class="cc-step${i === P.phase ? " is-on" : ""}" data-ph="${i}" ${i === 0 || (i === 1 && P.gene) || (i === 2 && P.flocks.length) ? "" : "disabled"}>${s}</button>`).join("")}</div>`;
  const wire = () => panel.querySelectorAll("[data-ph]").forEach(b => b.addEventListener("click", () => { if (game.on) return; P.phase = +b.dataset.ph; save(); render(); }));

  function render() {
    clear(); game.on = false;
    if (P.phase === 0) {
      st && st.flyTo(CAMS.dna);
      panel.innerHTML = steps() + `<h3 class="cc-h">${L("Make a transgenic ewe", "Crea una oveja transgénica")}</h3><p class="cc-sub">${L(`HOSPITAL ORDER: <b>${ORDER} doses of the human protein AAT</b> for patients whose bodies cannot make it (it protects the lungs). Your plan: get a ewe to make it in her milk. Which gene do you insert into the nucleus of a sheep cell?`, `PEDIDO DEL HOSPITAL: <b>${ORDER} dosis de la proteína humana AAT</b> para pacientes que no pueden fabricarla (protege los pulmones). Tu plan: que una oveja la produzca en su leche. ¿Qué gen insertas en el núcleo de una célula de oveja?`)}</p>
        <div class="cc-opts">${GENES.map(g => `<button type="button" class="cc-opt" data-gene="${g.id}">${g.name()}</button>`).join("")}</div><div class="cc-fb">${P.gene ? "✔ " + GENES[0].why() : ""}</div>
        <button type="button" class="cc-btn cc-next" ${P.gene ? "" : "hidden"}>${L("Next: build the flock", "Siguiente: formar el rebaño")} →</button>`;
      if (P.gene) panel.querySelector(".cc-fb").className = "cc-fb good";
      panel.querySelectorAll("[data-gene]").forEach(b => b.addEventListener("click", () => {
        const g = GENES.find(x => x.id === b.dataset.gene);
        if (g.ok) { b.classList.add("good"); fb("good", "✔ " + g.why()); sfx("win"); burstAt(b, "#4de3ff", 20); if (!P.gene) ctx.gain(30, b); P.gene = true; goal("gene"); if (st) { st.burst(new T.Vector3(-4.9, 1.9, 1.6), 0x4de3ff, 40, 2, .1); st.punch(.85); } panel.querySelector(".cc-next").hidden = false; }
        else { b.classList.add("bad"); shake(b); sfx("bad"); fb("bad", "✘ " + g.why()); }
      }));
      panel.querySelector(".cc-next").addEventListener("click", () => { P.phase = 1; save(); render(); });
    } else if (P.phase === 1) {
      st && st.flyTo(CAMS.yard);
      const g = P.goals;
      panel.innerHTML = steps() + `<h3 class="cc-h">${L("Build a flock from one ewe", "Forma un rebaño a partir de una oveja")}</h3><p class="cc-sub">${L("You have ONE transgenic ewe (glowing DNA marker). One ewe cannot fill a hospital order. Try both ways of getting 8 more sheep and compare how many carry the human gene.", "Tienes UNA oveja transgénica (marcador de ADN brillante). Una sola oveja no cubre el pedido. Prueba las dos formas de conseguir 8 ovejas más y compara cuántas llevan el gen humano.")}</p>
        <div class="cc-row"><button type="button" class="cc-btn cc-btn--big" data-make="breed">${L("Breed her with an ordinary ram", "Cruzarla con un carnero normal")}</button><button type="button" class="cc-btn cc-btn--big" data-make="clone">${L("Clone her by nuclear transfer", "Clonarla por transferencia nuclear")}</button></div>
        <div class="cc-fb"></div><ul class="cc-goals"><li class="${g.bred ? "done" : ""}">${L("Make a flock by breeding (sexual reproduction)", "Forma un rebaño por cruce (reproducción sexual)")}</li><li class="${g.cloned ? "done" : ""}">${L("Make a flock by cloning", "Forma un rebaño por clonación")}</li></ul>
        <div class="cc-log">${P.flocks.map((f, i) => `<button type="button" class="cc-run${i === P.sel ? " is-sel" : ""}" data-sel="${i}"><b>${flockName(f)} ${f.n}: ${cars(f)}/8 ${L("carry the gene", "llevan el gen")}</b><div class="cc-jars">${f.car.map(c => `<i class="${c ? "s-on" : "s-off"}"></i>`).join("")}</div></button>`).reverse().join("")}</div>
        <button type="button" class="cc-btn cc-next" ${P.flocks.length ? "" : "hidden"}>${L("Next: milk the flock", "Siguiente: ordeñar el rebaño")} →</button>`;
      panel.querySelectorAll("[data-make]").forEach(b => b.addEventListener("click", () => {
        const type = b.dataset.make; P.n++; const r = rng(700 + P.n * 131), car = [];
        for (let i = 0; i < 8; i++) car.push(type === "clone" ? 1 : (r() < .5 ? 1 : 0));
        const f = { type, n: P.n, car }; P.flocks.push(f); if (P.flocks.length > 6) P.flocks.shift(); P.sel = P.flocks.length - 1;
        ctx.log({ lab: L("Pharming", "Pharming"), run: type === "clone" ? L(`Flock ${P.n}: cloned`, `Rebaño ${P.n}: clonado`) : L(`Flock ${P.n}: bred`, `Rebaño ${P.n}: criado`), setup: type === "clone" ? L("8 lambs made by nuclear transfer from the transgenic ewe", "8 corderos por transferencia nuclear desde la oveja transgénica") : L("8 lambs from mating the transgenic ewe with an ordinary ram", "8 corderos del cruce de la oveja transgénica con un carnero normal"), outcome: L(`${cars(f)} of 8 lambs carry the human gene`, `${cars(f)} de 8 corderos llevan el gen humano`), count: `${cars(f)}/8` });
        goal(type === "clone" ? "cloned" : "bred"); save(); sfx(type === "clone" ? "win" : "pop"); render(); popFlock(); ctx.gain(20, panel.querySelector(".cc-h"));
        fb(type === "clone" ? "good" : "", type === "clone" ? L("<b>8 of 8 carry the gene.</b> Clones are genetically identical to the ewe that gave the nucleus, so every one has the human gene.", "<b>8 de 8 llevan el gen.</b> Los clones son genéticamente idénticos a la oveja que dio el núcleo, así que todos tienen el gen humano.") : L(`<b>${cars(f)} of 8 carry the gene.</b> In sexual reproduction each lamb gets a mix of genes from both parents, so only some inherit the human gene. Breed again and the number changes.`, `<b>${cars(f)} de 8 llevan el gen.</b> En la reproducción sexual cada cordero recibe una mezcla de genes de ambos progenitores, así que solo algunos heredan el gen humano. Si vuelves a cruzar, el número cambia.`));
      }));
      panel.querySelectorAll("[data-sel]").forEach(b => b.addEventListener("click", () => { P.sel = +b.dataset.sel; save(); render(); popFlock(); }));
      panel.querySelector(".cc-next").addEventListener("click", () => { P.phase = 2; save(); render(); });
    } else renderMilk();
    wire();
  }

  function milkSheep(i) { const b = panel.querySelector(`[data-ewe="${i}"]`); if (b) b.click(); }
  function renderMilk(result) {
    st && st.flyTo(CAMS.yard); if (P.sel < 0 || !P.flocks[P.sel]) P.sel = P.flocks.length - 1;
    const f = P.flocks[P.sel];
    panel.innerHTML = steps() + `<h3 class="cc-h">${L("Milking parlour", "Sala de ordeño")}</h3><p class="cc-sub">${L(`Milk the ewes for <b>${ROUND} seconds</b>. Only ewes with the human gene give milk containing AAT. Each ewe needs a few seconds to refill. Order: <b>${ORDER} doses</b>. Tap a ewe in the yard, a button, or press keys 1-8.`, `Ordeña durante <b>${ROUND} segundos</b>. Solo las ovejas con el gen humano dan leche con AAT. Cada oveja tarda unos segundos en rellenarse. Pedido: <b>${ORDER} dosis</b>. Toca una oveja, un botón o las teclas 1-8.`)}</p>
      <div class="cc-flocksel">${P.flocks.map((x, i) => `<button type="button" class="cc-chip${i === P.sel ? " is-on" : ""}" data-sel="${i}">${flockName(x)} ${x.n} · ${cars(x)}/8</button>`).join("")}</div>
      <div class="cc-hudrow"><span class="cc-time">${ROUND}s</span><span class="cc-doses"><b>0</b> / ${ORDER} ${L("doses", "dosis")}</span></div><div class="cc-vials">${"<i></i>".repeat(ORDER)}</div>
      <div class="cc-ewes">${f.car.map((c, i) => `<button type="button" class="cc-ewe" data-ewe="${i}" disabled><span>${i + 1}</span><i></i></button>`).join("")}</div>
      <div class="cc-row"><button type="button" class="cc-btn cc-btn--big cc-start">${L("Start milking", "Empezar a ordeñar")}</button></div><div class="cc-fb ${result ? result[0] : ""}">${result ? result[1] : ""}</div>`;
    panel.querySelectorAll("[data-sel]").forEach(b => b.addEventListener("click", () => { if (game.on) return; P.sel = +b.dataset.sel; save(); renderMilk(); wire(); popFlock(); }));
    const ewes = [...panel.querySelectorAll(".cc-ewe")], vials = [...panel.querySelectorAll(".cc-vials i")], dEl = panel.querySelector(".cc-doses b"), tEl = panel.querySelector(".cc-time");
    game.doses = 0;
    ewes.forEach((b, i) => b.addEventListener("click", () => {
      if (!game.on) return;
      if (!f.car[i]) { shake(b); sfx("bad"); b.classList.add("no"); fb("bad", L(`Ewe ${i + 1} does not carry the human gene: her milk has no AAT.`, `La oveja ${i + 1} no lleva el gen humano: su leche no tiene AAT.`)); return; }
      if (Date.now() < game.ready[i]) { shake(b); return; }
      game.ready[i] = Date.now() + 3000; game.doses++; dEl.textContent = game.doses; if (vials[game.doses - 1]) vials[game.doses - 1].classList.add("on"); sfx("coin"); burstAt(b, "#fff", 6);
      b.classList.remove("rdy"); b.firstElementChild.nextElementSibling.style.transition = "none"; b.lastElementChild.style.width = "0%"; requestAnimationFrame(() => { b.lastElementChild.style.transition = "width 3s linear"; b.lastElementChild.style.width = "100%"; });
      if (st) { st.burst(slots[i].position.clone().setY(.7), 0xffffff, 10, 1.4, .08); }
    }));
    const key = e => { if (game.on && e.key >= "1" && e.key <= "8") { e.preventDefault(); ewes[+e.key - 1].click(); } };
    panel.querySelector(".cc-start").addEventListener("click", e => {
      if (game.on) return; game.on = true; game.doses = 0; game.ready = f.car.map(() => 0); game.end = Date.now() + ROUND * 1000; e.currentTarget.disabled = true; sfx("ok"); fb("", "");
      ewes.forEach(b => { b.disabled = false; b.classList.add("rdy"); b.lastElementChild.style.width = "100%"; }); document.addEventListener("keydown", key);
      timer = setInterval(() => {
        if (!panel.isConnected) { document.removeEventListener("keydown", key); return clear(); }
        const left = Math.max(0, Math.ceil((game.end - Date.now()) / 1000)); tEl.textContent = left + "s";
        ewes.forEach((b, i) => b.classList.toggle("rdy", f.car[i] && Date.now() >= game.ready[i]));
        if (left <= 0) {
          clear(); game.on = false; document.removeEventListener("keydown", key); const d = game.doses, ok = d >= ORDER;
          ctx.log({ lab: L("Pharming", "Pharming"), run: L(`Milking flock ${f.n}`, `Ordeño rebaño ${f.n}`), setup: L(`${flockName(f)}; ${cars(f)} of 8 ewes carry the human gene; ${ROUND} s of milking`, `${flockName(f)}; ${cars(f)} de 8 ovejas llevan el gen humano; ${ROUND} s de ordeño`), outcome: ok ? L("Hospital order filled", "Pedido del hospital completado") : L("Order not filled", "Pedido no completado"), count: L(`${d} doses`, `${d} dosis`) });
          goal(f.type === "clone" ? "milkCloned" : "milkBred"); if (ok) { goal("order"); ctx.award("cc-pharm", L("Pharmer", "Pharmer")); } if (d > P.best) P.best = d; save();
          ctx.gain(ok ? 60 : 25, panel.querySelector(".cc-h")); sfx(ok ? "win" : "pop");
          const gd = game.doses; renderMilk([ok ? "good" : "bad", (ok ? `✔ <b>${d} ${L("doses: order filled.", "dosis: pedido completado.")}</b> ` : `<b>${d} ${L("doses: short of the order.", "dosis: no alcanza el pedido.")}</b> `) + (f.type === "clone" ? L("Every cloned ewe carries the gene, so every one produces the protein.", "Todas las ovejas clonadas llevan el gen, así que todas producen la proteína.") : L(`Only ${cars(f)} of these 8 bred ewes make the protein. Try the cloned flock and compare.`, `Solo ${cars(f)} de estas 8 ovejas criadas producen la proteína. Prueba el rebaño clonado y compara.`))]); game.doses = gd; wire();
        }
      }, 200);
    });
  }

  goal(null); render();
  return { dispose() { clear(); game.on = false; st && st.dispose(); } };
}
