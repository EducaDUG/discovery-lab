/* Pre-IG Stage 1 Spanish, Internal Exam 4 Revision Website (Units 7 and 8).
   The whole page is rendered here from content.json, in English or Spanish (the flag switcher reloads the page).
   Plain ES module on engine/revision-kit.js. Vendored Three.js (window.THREE), no network. */
import { buildHero, buildStreet, buildGlobe } from "./labs3d.js?v=3";
import { mountTaxi } from "./game.js?v=1";
import { $, $$, el, shuffle, T, isES, initLang, initProgress, makeSorter, makeMatch, makeAnswer, makeOrder, initHotspots, initQuiz, wireBooklet, burstOn, popIt, shake, toast } from "../../../../../../engine/revision-kit.js?v=22";

await initLang();
const ES = isES(), LG = ES ? "es" : "en";
const t = x => (x && typeof x === "object" ? x[LG] : x);
const U = {
  heroPill: ["Pre-IG Stage 1 · Spanish · Units 7 and 8", "Pre-IG Etapa 1 · Español · Unidades 7 y 8"],
  heroH1a: ["Internal Exam 4", "Examen Interno 4"], heroH1b: ["Revision", "Repaso"],
  heroLede: ["Ten lessons, three hyper-real 3D labs, a conjugation machine, a shop, a reading and a writing workshop, a taxi game and a shuffled practice exam. Everything you need to aim for 40 out of 40.", "Diez lecciones, tres laboratorios 3D hiperrealistas, una máquina de conjugación, una tienda, talleres de lectura y escritura, un juego de taxis y un examen de práctica. Todo para apuntar a 40 sobre 40."],
  download: ["Download the revision booklet (PDF)", "Descargar el cuadernillo de repaso (PDF)"], jump: ["Jump to the labs", "Ir a los laboratorios"],
  mastery: ["Your mastery", "Tu dominio"], howBadge: ["How do I earn each badge?", "¿Cómo gano cada insignia?"],
  heroAlt: ["A 3D boutique carousel of real clothing photos with floating Spanish grammar words. Drag sideways to turn it.", "Un carrusel 3D de boutique con fotos reales de ropa y palabras de gramática flotando. Arrastra para girarlo."],
  skip: ["Skip to content", "Saltar al contenido"], navLabs: ["3D labs", "Laboratorios"], navPhotos: ["Photos", "Fotos"], navBonus: ["Taxi Hop", "Taxi Hop"], navExam: ["Practice exam", "Examen de práctica"],
  unitA: ["Unit 7: Fashion and Shopping", "Unidad 7: La moda y las compras"], unitB: ["Unit 8: Holidays and Travel", "Unidad 8: Vacaciones y viajes"],
  lessons15: ["Lessons 1 to 5", "Lecciones 1 a 5"], lessons610: ["Lessons 6 to 10", "Lecciones 6 a 10"],
  markDone: ["Mark lesson complete", "Marcar lección completada"], keyIdeas: ["Key ideas", "Ideas clave"], more: ["More to know", "Más para saber"], didYouKnow: ["Remember", "Recuerda"],
  checkYourself: ["Check yourself", "Compruébalo tú"], answers: ["Show the answers", "Mostrar las respuestas"], task: ["Revision task", "Tarea de repaso"],
  photoTitle: ["Real Photos: Tap the Word", "Fotos reales: toca la palabra"], photoSub: ["Real photographs. Tap the item named in Spanish to earn the Photo hunter badge.", "Fotografías reales. Toca el objeto que se nombra en español para ganar la insignia de Fotógrafo."],
  labsTitle: ["Live Labs", "Laboratorios en vivo"], labsSub: ["Six labs: two in hyper-real 3D, a conjugation machine, a shop, a reading detective and a writing workshop.", "Seis laboratorios: dos en 3D hiperrealista, una máquina de conjugación, una tienda, un detective de lectura y un taller de escritura."],
  bonusTitle: ["Bonus Game: Taxi Hop", "Juego extra: Taxi Hop"], bonusSub: ["Hop onto the taxi with the right answer and collect passport stamps. About two minutes. Nothing can hurt you.", "Salta al taxi con la respuesta correcta y reúne sellos de pasaporte. Unos dos minutos. Nada puede hacerte daño."],
  bonusText: ["A question appears and three taxis drive across the street. Press 1, 2 or 3 (or tap an answer) to hop your suitcase onto a taxi. A right answer earns a passport stamp. A wrong one shows the right answer and a hint. The game is silent.", "Aparece una pregunta y tres taxis cruzan la calle. Pulsa 1, 2 o 3 (o toca una respuesta) para saltar al taxi. Una respuesta correcta da un sello de pasaporte. Una incorrecta muestra la correcta y una pista. El juego es silencioso."],
  play: ["Play Taxi Hop", "Jugar a Taxi Hop"], toExam: ["Skip to the practice exam", "Ir al examen de práctica"],
  examTitle: ["Practice Exam", "Examen de práctica"], examNew: ["New exam", "Nuevo examen"], pickAria: ["Choose lessons to practise", "Elige las lecciones para practicar"],
  endTitle: ["Take the revision booklet with you", "Llévate el cuadernillo de repaso"], endText: ["The booklet has every key idea, check question, revision task and an answer key for Lessons 1 to 10, ready to print.", "El cuadernillo incluye todas las ideas clave, preguntas, tareas de repaso y respuestas de las Lecciones 1 a 10, listo para imprimir."],
  foot1: ["Your work stays in your browser. Nothing is uploaded or stored on a server.", "Tu trabajo se queda en tu navegador. No se sube ni se guarda en ningún servidor."],
  qLabel: ["Question", "Pregunta"], of: ["of", "de"], score: ["Score", "Puntos"], prev: ["Previous", "Anterior"], next: ["Next", "Siguiente"],
  cred: ["Photo credits (Wikimedia Commons):", "Créditos de las fotos (Wikimedia Commons):"], by: ["by", "de"], earthCred: ["NASA Visible Earth (public domain)", "NASA Visible Earth (dominio público)"]
};
const u = k => U[k][ES ? 1 : 0];
const NAV = [["Ropa", "Ropa"], ["Regional", "Regional"], ["Este/Ese", "Este/Ese"], ["Ponerse", "Ponerse"], ["Tienda", "Tienda"], ["Viaje", "Viaje"], ["Voy a", "Voy a"], ["Pasado", "Pasado"], ["Cultura", "Cultura"], ["Examen", "Examen"]];
const LABEL = ["Clothes", "Regional", "Este / Ese", "Ponerse", "Shop", "Trip", "Near future", "Past", "Culture", "Exam skills"];
const LABEL_ES = ["Ropa", "Regional", "Este / Ese", "Ponerse", "Tienda", "Viaje", "Futuro próximo", "Pasado", "Cultura", "Técnica de examen"];
const lessonLabel = i => (ES ? LABEL_ES : LABEL)[i];

const content = await (await fetch("content.json")).json();
const LESSONS = content.lessons, BANK = content.bank, READ = content.reading;
const FILES = { falda: "falda", botas: "botas", vestido: "vestido", jersey: "jersey", zapatos: "zapatos", chaqueta: "chaqueta", abrigo: "abrigo", bufanda: "bufanda", camisa: "camisa", camiseta: "camiseta", gafas: "gafas", gorro: "gorro", guantes: "guantes", pantalones: "pantalones" };
const NOUN = {
  abrigo: ["m", 1, "coat"], botas: ["f", 2, "boots"], bufanda: ["f", 1, "scarf"], camisa: ["f", 1, "shirt"], camiseta: ["f", 1, "T-shirt"], chaqueta: ["f", 1, "jacket"], falda: ["f", 1, "skirt"],
  gafas: ["f", 2, "glasses"], gorro: ["m", 1, "woolly hat"], guantes: ["m", 2, "gloves"], jersey: ["m", 1, "sweater"], pantalones: ["m", 2, "trousers"], vestido: ["m", 1, "dress"], zapatos: ["m", 2, "shoes"]
};
const NOUN_ES = { coat: "abrigo", boots: "botas", scarf: "bufanda", shirt: "camisa", "T-shirt": "camiseta", jacket: "chaqueta", skirt: "falda", glasses: "gafas", "woolly hat": "gorro", gloves: "guantes", sweater: "jersey", trousers: "pantalones", dress: "vestido", shoes: "zapatos" };

/* ---------------------------------------------------------------- page shell */
const main = $("#main");
const lessonHTML = L => {
  const i = L.num - 1, ideas = L.ideas.map(t);
  const tab = L.table;
  const tbl = `<div class="gx-table-wrap"><table class="gx-table"><thead><tr>${tab.head.map(h => `<th>${t(h)}</th>`).join("")}</tr></thead><tbody>${tab.rows.map(r => `<tr><th scope="row">${t(r[0])}</th>${r.slice(1).map(c => `<td>${t(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  const acts = L.activities.map((a, k) => `<h3 class="gx-h3">${t(a.title)}</h3>${a.type === "answer" ? `<div class="ans" id="a${L.num}_${k}"></div><div class="gx-row"><button class="btn" id="a${L.num}_${k}c">${ES ? "Comprobar" : "Check"}</button><button class="btn btn--ghost" id="a${L.num}_${k}r">${ES ? "Reiniciar" : "Reset"}</button></div><p class="gx-out" id="a${L.num}_${k}o" aria-live="polite"></p>` : `<div class="${a.type === "match" ? "pmatch" : a.type === "order" ? "order" : "sorter"}" id="a${L.num}_${k}"></div>`}`).join("");
  const photos = { 1: ["falda", "botas", "vestido", "jersey", "zapatos", "chaqueta"], 6: ["playa", "madrid", "prado", "machu"], 9: ["zara-store", "weaving"] }[L.num];
  const cap = { falda: ["la falda", "skirt", "la falda"], botas: ["las botas", "boots", "las botas"], vestido: ["el vestido", "dress", "el vestido"], jersey: ["el jersey", "sweater", "el jersey"], zapatos: ["los zapatos", "shoes", "los zapatos"], chaqueta: ["la chaqueta", "jacket", "la chaqueta"], playa: ["la playa", "beach", "la playa"], madrid: ["Madrid", "Puerta del Sol, Madrid", "Madrid"], prado: ["el museo", "museum (Museo del Prado)", "el museo (Museo del Prado)"], machu: ["la montaña", "mountain (Machu Picchu, Peru)", "la montaña (Machu Picchu, Perú)"], "zara-store": ["Zara", "fast fashion: new designs twice a week", "moda rápida: diseños nuevos dos veces por semana"], weaving: ["el tejido", "slow fashion: handmade weaving in Guatemala", "moda lenta: tejido a mano en Guatemala"] };
  const gal = photos ? `<div class="ph-grid">${photos.map(f => `<figure><img src="photos/${f}.jpg" alt="${cap[f][1]}" loading="lazy" width="320" height="240"><figcaption><b>${cap[f][0]}</b> <small>${ES ? cap[f][2] : cap[f][1]}</small></figcaption></figure>`).join("")}</div>` : "";
  return `<section class="gx-sec" id="l${L.num}"><header class="gx-sec__head"><span class="gx-lvl">${L.num}</span><div><h2>${t(L.title)}</h2><p>${t(L.intro)}</p></div><button class="gx-done" data-lesson="${L.num}" aria-pressed="false">${u("markDone")}</button></header>
<div class="gx-two"><div class="gx-card"><span class="gx-tag">${u("keyIdeas")}</span><ul class="gx-ticks">${ideas.slice(0, 3).map(x => `<li>${x}</li>`).join("")}</ul></div><div class="gx-card"><span class="gx-tag" style="--c:#2f7dd1">${u("more")}</span><ul class="gx-ticks">${ideas.slice(3).map(x => `<li>${x}</li>`).join("")}</ul></div></div>
${tbl}${gal}<aside class="gx-fact" style="margin-top:var(--sp-4)"><b>${u("didYouKnow")}</b> ${t(L.fact)}</aside>${acts}
<details class="gx-how" style="margin-top:var(--sp-4)"><summary>${u("checkYourself")}</summary><ol>${L.questions.map(q => `<li>${t(q)}</li>`).join("")}</ol><details><summary>${u("answers")}</summary><ol>${L.answers.map(a => `<li>${t(a)}</li>`).join("")}</ol></details><p class="gx-note"><b>${u("task")}:</b> ${t(L.task)}</p></details></section>`;
};
const navHTML = `<nav class="gx-nav" aria-label="Sections">${NAV.map((n, i) => `<a href="#l${i + 1}">${i + 1} ${n[ES ? 1 : 0]}</a>`).join("")}<a href="#photos" class="is-lab">${u("navPhotos")}</a><a href="#labs" class="is-lab">${u("navLabs")}</a><a href="#bonus" class="is-lab">${u("navBonus")}</a><a href="#exam" class="is-exam">${u("navExam")}</a><a href="Exam-4-Revision-Booklet-EN.pdf" data-booklet="Exam-4-Revision-Booklet" download class="is-dl">${u("download")}</a></nav>`;
const dlIcon = `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l-5-5m5 5l5-5M4 20h16"/></svg>`;
main.innerHTML = `<nav class="crumbs" aria-label="Breadcrumb"><ol class="crumbs__list"><li><a href="../../../../../../">Discovery Lab</a></li><li><a href="../../../../../">${ES ? "Secundaria" : "Secondary"}</a></li><li><a href="../../../../">${ES ? "Ruta A-Level" : "A-Level Pathway"}</a></li><li><a href="../../../">Pre-IG</a></li><li><a href="../../">${ES ? "Español" : "Spanish"}</a></li><li><a href="../">${ES ? "Etapa 1" : "Stage 1"}</a></li><li><span aria-current="page">${ES ? "Sitio de repaso del Examen 4" : "Exam 4 Revision Website"}</span></li></ol></nav>
<section class="gx-hero" id="hero"><div class="gx-hero__text"><span class="gx-pill">${u("heroPill")}</span><h1>${ES ? `Repaso del <span class="gx-grad">Examen Interno 4</span>` : `Internal Exam 4 <span class="gx-grad">Revision</span>`}</h1><p class="gx-lede">${u("heroLede")}</p>
<div class="gx-cta"><a class="btn btn--signal btn--lg" href="Exam-4-Revision-Booklet-EN.pdf" data-booklet="Exam-4-Revision-Booklet" download>${dlIcon} ${u("download")}</a><a class="btn btn--ghost btn--lg" href="#labs">${u("jump")}</a></div>
<div class="gx-progress" aria-label="${u("mastery")}"><div class="gx-progress__top"><b>${u("mastery")}</b><span id="pPct">0%</span></div><div class="gx-bar"><div id="pBar"></div></div><div class="gx-badges" id="pBadges"></div><details class="gx-how"><summary>${u("howBadge")}</summary><ul id="pHow"></ul></details></div></div>
<div class="gx-hero__stage"><div class="stage3d stage3d--hero" id="heroStage" role="img" aria-label="${u("heroAlt")}"></div></div></section>
${navHTML}
<div class="gx-unit"><b>${u("unitA")}</b><span>${u("lessons15")}</span></div>${LESSONS.slice(0, 5).map(lessonHTML).join("")}
<div class="gx-unit"><b>${u("unitB")}</b><span>${u("lessons610")}</span></div>${LESSONS.slice(5).map(lessonHTML).join("")}
<section class="gx-sec" id="photos"><header class="gx-sec__head"><span class="gx-lvl gx-lvl--lab">${ES ? "Foto" : "Photo"}</span><div><h2>${u("photoTitle")}</h2><p>${u("photoSub")}</p></div></header>
<div class="hs" id="hs"><div class="tabs hs__tabs" role="tablist" id="hsTabs"></div><div class="hs__stage"><img id="hsImg" alt="" width="800" height="600"><div class="hs__marks" id="hsMarks"></div></div><p class="hs__q" id="hsQ" aria-live="polite"></p><div class="hs__fb" id="hsFb" aria-live="polite"></div></div></section>
<section class="gx-sec" id="labs"><header class="gx-sec__head"><span class="gx-lvl gx-lvl--lab">3D</span><div><h2>${u("labsTitle")}</h2><p>${u("labsSub")}</p></div></header><div id="labsHost"></div></section>
<section class="gx-sec" id="bonus"><header class="gx-sec__head"><span class="gx-lvl gx-lvl--lab">${ES ? "Juega" : "Play"}</span><div><h2>${u("bonusTitle")}</h2><p>${u("bonusSub")}</p></div></header><div id="bonusHost" class="bz__launch"><div class="gx-card"><p>${u("bonusText")}</p><div class="gx-row" style="justify-content:center"><button class="btn btn--signal btn--lg" id="bonusPlay">${u("play")}</button><a class="btn btn--ghost btn--lg" href="#exam">${u("toExam")}</a></div></div></div></section>
<section class="gx-sec" id="exam"><header class="gx-sec__head"><span class="gx-lvl gx-lvl--exam">?</span><div><h2>${u("examTitle")}</h2><p id="examSub"></p></div><button class="btn" id="quizNew">${u("examNew")}</button></header><div class="gx-row" id="quizPick" role="group" aria-label="${u("pickAria")}"></div>
<div class="quiz" id="quiz"><div class="quiz__bar"><span>${u("qLabel")} <b id="qNum">1</b> ${u("of")} <span id="qTot">20</span></span><span>${u("score")} <b id="qScore">0</b> / <span id="qDone">0</span></span><span class="qstreak" id="qStreak"></span></div><div class="quiz__prog"><i id="qProg"></i></div><h3 id="qText" class="quiz__q"></h3><div class="quiz__opts" id="qOpts"></div><div class="quiz__fb" id="qFb" aria-live="polite" hidden></div><div class="gx-row quiz__nav"><button class="btn btn--ghost" id="qPrev">${u("prev")}</button><button class="btn" id="qNext">${u("next")}</button></div></div></section>
<section class="gx-sec gx-end"><h2>${u("endTitle")}</h2><p>${u("endText")}</p><a class="btn btn--signal btn--lg" href="Exam-4-Revision-Booklet-EN.pdf" data-booklet="Exam-4-Revision-Booklet" download>${u("download")}</a><p class="gx-credit" id="credits"></p></section>`;
$(".site-foot__inner span:last-child") && ($(".site-foot__inner span:last-child").textContent = u("foot1"));

/* ---------------------------------------------------------------- progress */
const LAB = { street: ["Demonstrative Street", "Calle de los Demostrativos", "Choose the right este / ese / aquel form in 8 of 10 rounds", "Elige bien este / ese / aquel en 8 de 10 rondas"], conj: ["Conjugation Machine", "Máquina de conjugación", "Get 6 of 8 test questions right", "Acierta 6 de 8 preguntas del test"], shop: ["Boutique", "Boutique", "Complete one dialogue with every gap right", "Completa un diálogo con todos los huecos correctos"], globe: ["Season Flip Globe", "Globo de las estaciones", "Pack two perfect suitcases", "Prepara dos maletas perfectas"], read: ["Reading Detective", "Detective de lectura", "Find the answers in all five texts", "Encuentra las respuestas en los cinco textos"], write: ["Writing Workshop", "Taller de escritura", "Score 7 or 8 out of 8 on a check", "Saca 7 u 8 sobre 8 en una revisión"] };
const P = initProgress({
  store: "dl-preig-spanish-exam4-revision-v1",
  badges: prog => [
    ...LESSONS.map(L => [(ES ? "Lección " : "Lesson ") + L.num, () => prog.lessons[L.num], (ES ? "Pulsa «Marcar lección completada» en la Lección " : "Press “Mark lesson complete” on Lesson ") + L.num]),
    ...Object.keys(LAB).map(k => [LAB[k][ES ? 1 : 0], () => prog.labs[k], LAB[k][ES ? 3 : 2]]),
    [ES ? "Fotógrafo" : "Photo hunter", () => prog.labs.photos, ES ? "Fotos reales: encuentra todo en las tres fotos" : "Real photos: find every item on all three photos"],
    ["Taxi Hop", () => prog.labs.bonus, ES ? "Termina una ronda de Taxi Hop" : "Finish a Taxi Hop round"],
    [ES ? "Examen 80%" : "Exam 80%", () => prog.quiz, ES ? "Saca 80% o más en un examen de práctica de 20 preguntas" : "Score 80% or more on a 20-question practice exam"]
  ]
});
const award = P.award; P.render();

/* ---------------------------------------------------------------- lesson activities */
LESSONS.forEach(L => L.activities.forEach((a, k) => {
  const host = $(`#a${L.num}_${k}`);
  if (a.type === "match") makeMatch(host, a.pairs.map(p => [t(p[0]), t(p[1])]));
  else if (a.type === "sorter") makeSorter(host, a.items.map(i => [t(i[0]), i[1], t(i[2])]), a.opts.map(t));
  else if (a.type === "order") makeOrder(host, a.steps.map(s => [t(s[0]), t(s[1])]));
  else if (a.type === "answer") makeAnswer(host, a.statements.map(s => [t(s[0]), s[1]]), $(`#a${L.num}_${k}c`), $(`#a${L.num}_${k}r`), $(`#a${L.num}_${k}o`));
}));

/* ---------------------------------------------------------------- real photos */
const hsT = (en, es) => (ES ? es : en);
initHotspots({
  outfit: { name: hsT("Winter outfit", "Conjunto de invierno"), img: "photos/outfit.jpg", alt: hsT("A woman in a hat, gloves, a coat, a dress and boots", "Una mujer con gorro, guantes, abrigo, vestido y botas"), tasks: [
    [hsT("Tap el gorro (the hat)", "Toca el gorro"), 0.55, 0.07, "el gorro", hsT("A yellow woolly hat. El gorro is a hat for cold weather.", "Un gorro amarillo. El gorro se usa con frío.")],
    [hsT("Tap los guantes (the gloves)", "Toca los guantes"), 0.18, 0.44, "los guantes", hsT("Guantes is masculine plural: los guantes.", "Guantes es masculino plural: los guantes.")],
    [hsT("Tap el abrigo (the coat)", "Toca el abrigo"), 0.27, 0.34, "el abrigo", hsT("A patterned coat. El abrigo is masculine.", "Un abrigo con dibujo. El abrigo es masculino.")],
    [hsT("Tap el vestido (the dress)", "Toca el vestido"), 0.61, 0.44, "el vestido", hsT("A mustard dress. Say: un vestido amarillo.", "Un vestido mostaza. Di: un vestido amarillo.")],
    [hsT("Tap las botas (the boots)", "Toca las botas"), 0.55, 0.82, "las botas", hsT("Beige leather boots: unas botas de cuero.", "Botas beige de cuero: unas botas de cuero.")]] },
  playa: { name: hsT("The beach", "La playa"), img: "photos/playa.jpg", alt: hsT("A city beach with a bay and mountains behind", "Una playa urbana con una bahía y montañas al fondo"), tasks: [
    [hsT("Tap la playa (the beach)", "Toca la playa"), 0.62, 0.57, "la playa", hsT("The sandy curve of the bay. La playa is feminine.", "La curva de arena de la bahía. La playa es femenino.")],
    [hsT("Tap el mar (the sea)", "Toca el mar"), 0.22, 0.62, "el mar", hsT("Use it in: Voy a nadar en el mar.", "Úsalo en: Voy a nadar en el mar.")],
    [hsT("Tap la montaña (the mountain)", "Toca la montaña"), 0.86, 0.2, "la montaña", hsT("The green hill at the top right. La montaña is feminine.", "La colina verde de arriba a la derecha. La montaña es femenino.")]] },
  tienda: { name: hsT("A fashion shop", "Una tienda de moda"), img: "photos/zara-store.jpg", alt: hsT("The entrance of a clothes shop with a mannequin", "La entrada de una tienda de ropa con un maniquí"), tasks: [
    [hsT("Tap el nombre de la tienda (the shop sign)", "Toca el nombre de la tienda"), 0.5, 0.08, "Zara", hsT("Zara is a Spanish fast-fashion shop, founded by Amancio Ortega.", "Zara es una tienda española de moda rápida, fundada por Amancio Ortega.")],
    [hsT("Tap el maniquí (the mannequin)", "Toca el maniquí"), 0.08, 0.5, "el maniquí", hsT("The mannequin wears the latest design.", "El maniquí lleva el diseño más reciente.")]] }
}, "outfit", award);

/* ---------------------------------------------------------------- labs markup */
const labsHost = $("#labsHost");
const tag = (n, lessons, r3d) => `<span class="gx-tag gx-tag--dark">Lab ${n} · ${ES ? "Lecciones" : "Lessons"} ${lessons}${r3d ? " · 3D" : ""}</span>`;
labsHost.innerHTML = `
<article class="lab" id="lab-st"><div class="lab__head">${tag(1, "3", true)}<h3>${ES ? "Calle de los Demostrativos" : "Demonstrative Street"}</h3><p>${ES ? "Mira dónde está el objeto de la flecha: cerca, a distancia media o lejos. Elige este, ese o aquel con el género y el número correctos." : "Look where the arrowed item is: close, medium or far. Choose este, ese or aquel with the right gender and number."}</p></div>
<div class="lab__body"><div class="lab__scene"><div class="stage3d" id="stStage" aria-label="${ES ? "Calle 3D con objetos cerca, a distancia media y lejos" : "3D street with items close, at medium distance and far away"}"></div><div class="lab__hud" aria-live="polite">${ES ? "Ronda" : "Round"} <b id="stRound">1</b> / 10 · ${ES ? "Puntos" : "Score"} <b id="stScore">0</b> · ${ES ? "Racha" : "Streak"} <b id="stStreak">0</b></div></div>
<div class="lab__panel"><p class="st__prompt" id="stPrompt" aria-live="polite"></p><div class="st__opts" id="stOpts"></div><div class="infocard" id="stFb" aria-live="polite"><b>${ES ? "Listo" : "Ready"}</b><p>${ES ? "Busca la flecha dorada en la calle." : "Find the golden arrow on the street."}</p></div>
<label class="lab__check"><input type="checkbox" id="stHint"> ${ES ? "Mostrar ayuda en inglés" : "Show the English hint"}</label><div class="lab__btns"><button class="btn btn--signal" id="stNext" hidden>${u("next")}</button><button class="btn btn--ghost" id="stNew">${ES ? "Nueva calle" : "New street"}</button></div>
<p class="lab__tip">${ES ? "Cerca = aquí (este). Medio = ahí/allí (ese). Lejos = allá (aquel)." : "Close = aquí (este). Medium = ahí/allí (ese). Far = allá (aquel)."}</p></div></div></article>

<article class="lab" id="lab-cj"><div class="lab__head">${tag(2, "4, 7, 8", false)}<h3>${ES ? "Máquina de conjugación" : "Conjugation Machine"}</h3><p>${ES ? "Elige un verbo y un tiempo y mira la tabla. Luego pasa el test." : "Pick a verb and a time. Read the table, then take the test."}</p></div>
<div class="lab__body lab__body--one"><div class="lab__panel cj">
<div class="chips" id="cjVerbs" role="group" aria-label="${ES ? "Verbo" : "Verb"}"></div>
<div class="tabs cj__time" id="cjTime" role="group" aria-label="${ES ? "Tiempo" : "Time"}"></div>
<div class="cj__line"><span>${ES ? "ayer" : "yesterday"}</span><i><u id="cjDot"></u></i><span>${ES ? "hoy" : "today"}</span><i></i><span>${ES ? "mañana" : "tomorrow"}</span></div>
<table class="gx-table gx-table--dark cj__table"><tbody id="cjBody"></tbody></table><p class="infocard" id="cjEx" aria-live="polite"></p>
<h4 class="cj__h">${ES ? "Ponte a prueba" : "Test me"} <small id="cjScore"></small></h4><p class="cj__q" id="cjQ" aria-live="polite"></p><div class="gx-row"><input class="cj__in" id="cjIn" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${ES ? "Tu respuesta" : "Your answer"}"><button class="btn btn--signal" id="cjCheck">${ES ? "Comprobar" : "Check"}</button><button class="btn btn--ghost" id="cjNew">${ES ? "Nuevo test" : "New test"}</button></div><p class="cj__fb" id="cjFb" aria-live="polite"></p></div></div></article>

<article class="lab" id="lab-bq"><div class="lab__head">${tag(3, "5", false)}<h3>${ES ? "La boutique: diálogos" : "The Boutique: Shop Dialogues"}</h3><p>${ES ? "Toca una palabra del banco y luego un hueco. Completa cada diálogo." : "Tap a word in the bank, then tap a gap. Complete each dialogue."}</p></div>
<div class="lab__body lab__body--one"><div class="lab__panel bq"><div class="tabs" id="bqTabs" role="tablist"></div><div class="bq__chat" id="bqChat"></div><div class="chips bq__bank" id="bqBank" aria-label="${ES ? "Banco de palabras" : "Word bank"}"></div><div class="lab__btns"><button class="btn btn--signal" id="bqCheck">${ES ? "Comprobar" : "Check"}</button><button class="btn btn--ghost" id="bqReset">${ES ? "Reiniciar" : "Reset"}</button></div><p class="cj__fb" id="bqFb" aria-live="polite"></p>
<h4 class="cj__h">${ES ? "¿Cuánto cuesta?" : "How much does it cost?"} <small id="pxScore"></small></h4><div class="px"><div class="px__tag" id="pxTag" aria-live="polite"></div><div class="px__opts" id="pxOpts"></div></div></div></div></article>

<article class="lab" id="lab-gl"><div class="lab__head">${tag(4, "6, 9", true)}<h3>${ES ? "Globo de las estaciones" : "Season Flip Globe"}</h3><p>${ES ? "Cambia el mes y mira cómo se inclina la Tierra. ¿Qué te pones en Madrid, Ciudad de México y Buenos Aires?" : "Change the month and watch the Earth tilt. What do you wear in Madrid, Mexico City and Buenos Aires?"}</p></div>
<div class="lab__body"><div class="lab__scene"><div class="stage3d" id="glStage" aria-label="${ES ? "Globo 3D con Madrid, Ciudad de México y Buenos Aires" : "3D globe with pins on Madrid, Mexico City and Buenos Aires"}"></div><div class="lab__hud" aria-live="polite"><b id="glMonth"></b> · <span id="glCity"></span></div></div>
<div class="lab__panel"><label class="sl">${ES ? "Mes" : "Month"}: <b id="glMonthL"></b><input type="range" id="glMon" min="0" max="11" step="1" value="11"></label><div class="chips" id="glCities" role="group" aria-label="${ES ? "Ciudades" : "Cities"}"></div>
<div class="lab__btns"><button class="btn" id="glXmas">${ES ? "Navidad (diciembre)" : "Christmas (December)"}</button><button class="btn btn--ghost" id="glJul">${ES ? "Julio" : "July"}</button></div><div class="infocard" id="glInfo" aria-live="polite"></div>
<h4 class="cj__h">${ES ? "Prepara tu maleta (elige 4)" : "Pack your suitcase (pick 4)"}</h4><div class="gl__pack" id="glPack"></div><div class="lab__btns"><button class="btn btn--signal" id="glCheck">${ES ? "Comprobar maleta" : "Check my suitcase"}</button></div><p class="cj__fb" id="glFb" aria-live="polite"></p></div></div></article>

<article class="lab" id="lab-rd"><div class="lab__head">${tag(5, "10", false)}<h3>${ES ? "Detective de lectura" : "Reading Detective"}</h3><p>${ES ? "Lee el texto. Toca la palabra del texto que responde a cada pregunta, como en el examen." : "Read the text. Tap the word in the text that answers each question, just like the exam."}</p></div>
<div class="lab__body lab__body--one"><div class="lab__panel rd"><div class="tabs" id="rdTabs" role="tablist"></div><p class="rd__text" id="rdText"></p><p class="rd__q" id="rdQ" aria-live="polite"></p><div class="infocard" id="rdFb" aria-live="polite"></div><p class="gx-out" id="rdProg"></p></div></div></article>

<article class="lab" id="lab-wr"><div class="lab__head">${tag(6, "7, 8, 10", false)}<h3>${ES ? "Taller de escritura: 8 sobre 8" : "Writing Workshop: 8 out of 8"}</h3><p>${ES ? "Escribe cuatro frases sobre tus vacaciones. Cada una vale 2 puntos: 1 de contenido y 1 de lenguaje." : "Write four sentences about your holiday. Each is worth 2 marks: 1 for content and 1 for language."}</p></div>
<div class="lab__body lab__body--one"><div class="lab__panel wr"><label class="sl">${ES ? "Plan para" : "Plan a holiday to"} <select id="wrDest"><option>España</option><option>México</option><option>Perú</option><option>Argentina</option><option>Chile</option><option>Colombia</option></select></label><div id="wrBox"></div><div class="chips wr__bank" id="wrBank" aria-label="${ES ? "Banco de palabras" : "Word bank"}"></div>
<div class="lab__btns"><button class="btn btn--signal" id="wrCheck">${ES ? "Revisar mis frases" : "Check my sentences"}</button><button class="btn btn--ghost" id="wrModel">${ES ? "Ver un modelo" : "Show a model answer"}</button><button class="btn btn--ghost" id="wrClear">${ES ? "Borrar" : "Clear"}</button></div><div class="infocard" id="wrOut" aria-live="polite"></div></div></div></article>`;

/* ---- helpers shared by labs */
const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[¿¡.,;:!?«»"“”]/g, " ").replace(/\s+/g, " ").trim();
const setText = (e, v) => { if (e && e.textContent !== v) e.textContent = v; };
const MONTHS = ES ? ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"] : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/* ---------------------------------------------------------------- hero 3D */
const heroS = buildHero($("#heroStage"), ["falda", "botas", "vestido", "jersey", "zapatos", "chaqueta", "abrigo", "camiseta", "pantalones", "bufanda"], ["este", "esta", "ese", "aquel", "aquellas", "voy a", "fui", "comí", "me pongo", "cuesta", "hace calor", "tomar"]);

/* ---------------------------------------------------------------- Lab 1: Demonstrative Street */
{
  const D = { close: { m1: "este", f1: "esta", m2: "estos", f2: "estas" }, mid: { m1: "ese", f1: "esa", m2: "esos", f2: "esas" }, far: { m1: "aquel", f1: "aquella", m2: "aquellos", f2: "aquellas" } };
  const DE = { close: ["this", "these"], mid: ["that", "those"], far: ["that over there", "those over there"] };
  const DN = { close: ES ? "cerca (aquí)" : "close (aquí)", mid: ES ? "distancia media (ahí / allí)" : "medium (ahí / allí)", far: ES ? "lejos (allá)" : "far (allá)" };
  const S = buildStreet($("#stStage"));
  let round = 0, score = 0, streak = 0, locked = false, cur = null, total = 0;
  const nouns = Object.keys(NOUN);
  function make() {
    if (round >= 10) return finish();
    const picks = shuffle(nouns).slice(0, 3), zones = shuffle(["close", "mid", "far"]), tIdx = Math.floor(Math.random() * 3);
    const n = picks[tIdx], z = zones[tIdx], g = NOUN[n][0] + NOUN[n][1];
    const ok = D[z][g];
    const sameZone = ["m1", "f1", "m2", "f2"].filter(k => k !== g).map(k => D[z][k]), other = D[z === "mid" ? "far" : "mid"][g];
    cur = { n, z, g, ok, opts: shuffle([ok, ...shuffle(sameZone).slice(0, 2), other]) };
    if (S) S.setScene(picks.map((p, i) => ({ file: FILES[p], zone: zones[i], plural: NOUN[p][1] === 2, side: i % 2 ? 1 : -1, target: i === tIdx })));
    setText($("#stRound"), String(round + 1)); locked = false; $("#stNext").hidden = true;
    const hint = $("#stHint").checked ? `<small>(${DE[z][NOUN[n][1] - 1]} ${NOUN[n][2]})</small>` : "";
    $("#stPrompt").innerHTML = `<span class="st__gap">___</span> <b>${n}</b> ${hint}`;
    const box = $("#stOpts"); box.innerHTML = "";
    cur.opts.forEach(o => { const b = el("button", "btn btn--ghost", o); b.addEventListener("click", () => pick(b, o)); box.append(b); });
  }
  function pick(b, o) {
    if (locked) return; locked = true; total++;
    const good = o === cur.ok, fb = $("#stFb");
    $$("#stOpts button").forEach(x => { x.disabled = true; if (x.textContent === cur.ok) x.classList.add("ok"); });
    const why = ES ? `${cur.n} es ${NOUN[cur.n][0] === "m" ? "masculino" : "femenino"} ${NOUN[cur.n][1] === 2 ? "plural" : "singular"} y está ${DN[cur.z]}: <b>${cur.ok} ${cur.n}</b>.` : `${cur.n} is ${NOUN[cur.n][0] === "m" ? "masculine" : "feminine"} ${NOUN[cur.n][1] === 2 ? "plural" : "singular"} and it is ${DN[cur.z]}: <b>${cur.ok} ${cur.n}</b>.`;
    if (good) { score++; streak++; popIt(b); burstOn(b, "#3fd9a0"); fb.innerHTML = `<b>${ES ? "¡Correcto!" : "Correct!"}</b><p>${why}</p>`; } else { streak = 0; shake(b); b.classList.add("no"); fb.innerHTML = `<b>${ES ? "Casi." : "Not quite."}</b><p>${why}</p>`; }
    setText($("#stScore"), String(score)); setText($("#stStreak"), String(streak)); round++;
    const nx = $("#stNext"); nx.hidden = false; nx.textContent = round >= 10 ? (ES ? "Ver resultado" : "See result") : u("next"); nx.focus();
    if (score >= 8) award("street");
  }
  function finish() {
    $("#stPrompt").textContent = ES ? `Resultado: ${score} / 10` : `Result: ${score} / 10`; $("#stOpts").innerHTML = ""; $("#stNext").hidden = true;
    $("#stFb").innerHTML = `<b>${score >= 8 ? (ES ? "¡Excelente!" : "Excellent!") : (ES ? "Sigue practicando" : "Keep practising")}</b><p>${ES ? "Pulsa «Nueva calle» para otra ronda." : "Press “New street” for another round."}</p>`;
  }
  $("#stNext").addEventListener("click", make);
  $("#stNew").addEventListener("click", () => { round = 0; score = 0; streak = 0; setText($("#stScore"), "0"); setText($("#stStreak"), "0"); make(); });
  $("#stHint").addEventListener("change", () => { if (cur && !locked) { const hint = $("#stHint").checked ? `<small>(${DE[cur.z][NOUN[cur.n][1] - 1]} ${NOUN[cur.n][2]})</small>` : ""; $("#stPrompt").innerHTML = `<span class="st__gap">___</span> <b>${cur.n}</b> ${hint}`; } });
  make();
}

/* ---------------------------------------------------------------- Lab 2: Conjugation Machine */
{
  const PERS = ["yo", "tú", "él / ella", "nosotros", "ellos"], IR = ["voy", "vas", "va", "vamos", "van"];
  const V = {
    ir: { pres: ["voy", "vas", "va", "vamos", "van"], past: ["fui", "fuiste", "fue", "fuimos", "fueron"], inf: "ir", en: "to go (past also = to be)", ex: { pres: "Voy a la playa.", past: "Ayer fui a la playa.", fut: "Mañana voy a ir a la playa." } },
    comer: { pres: ["como", "comes", "come", "comemos", "comen"], past: ["comí", "comiste", "comió", "comimos", "comieron"], inf: "comer", en: "to eat", ex: { pres: "Como tapas.", past: "Anoche comí paella.", fut: "Mañana voy a comer tacos." } },
    visitar: { pres: ["visito", "visitas", "visita", "visitamos", "visitan"], past: ["visité", "visitaste", "visitó", "visitamos", "visitaron"], inf: "visitar", en: "to visit", ex: { pres: "Visito el museo.", past: "El año pasado visité Perú.", fut: "Este verano voy a visitar Madrid." } },
    ponerse: { pres: ["me pongo", "te pones", "se pone", "nos ponemos", "se ponen"], past: null, inf: null, en: "to put on (clothes)", ex: { pres: "Me pongo el abrigo." } },
    llevar: { pres: ["llevo", "llevas", "lleva", "llevamos", "llevan"], past: null, inf: "llevar", en: "to wear / to carry", ex: { pres: "Llevo una camiseta blanca.", fut: "Voy a llevar un abrigo." } }
  };
  let verb = "ir", tense = "pres";
  const forms = (v, ten) => ten === "pres" ? V[v].pres : ten === "past" ? V[v].past : IR.map(x => x + " a " + V[v].inf);
  const avail = v => ["pres", ...(V[v].past ? ["past"] : []), ...(V[v].inf ? ["fut"] : [])];
  const TN = { past: ES ? "Pasado" : "Past", pres: ES ? "Presente" : "Now", fut: ES ? "Futuro próximo" : "Near future" };
  function paint() {
    if (!avail(verb).includes(tense)) tense = "pres";
    $("#cjVerbs").innerHTML = ""; Object.keys(V).forEach(k => { const b = el("button", k === verb ? "on" : "", k); b.addEventListener("click", () => { verb = k; paint(); }); $("#cjVerbs").append(b); });
    $("#cjTime").innerHTML = ""; ["past", "pres", "fut"].forEach(k => { const b = el("button", "", TN[k]); b.setAttribute("aria-selected", k === tense); b.disabled = !avail(verb).includes(k); b.addEventListener("click", () => { tense = k; paint(); }); $("#cjTime").append(b); });
    $("#cjDot").style.left = { past: "0%", pres: "50%", fut: "100%" }[tense];
    $("#cjBody").innerHTML = forms(verb, tense).map((f, i) => `<tr><th>${PERS[i]}</th><td><b>${f}</b></td></tr>`).join("");
    const ex = V[verb].ex[tense]; $("#cjEx").innerHTML = `<b>${verb}</b> · ${ES ? "ejemplo" : "example"}: <i>${ex || (ES ? "Este verbo solo se usa en presente en este examen." : "This verb is only needed in the present tense for this exam.")}</i>`;
  }
  paint();
  let qs = [], qi = 0, sc = 0;
  function newTest() {
    const pool = [];
    ["ir", "comer", "visitar"].forEach(v => ["pres", "past", "fut"].forEach(te => PERS.forEach((p, i) => pool.push({ v, te, i }))));
    ["ponerse", "llevar"].forEach(v => PERS.forEach((p, i) => pool.push({ v, te: "pres", i })));
    qs = shuffle(pool).slice(0, 8); qi = 0; sc = 0; show();
  }
  function show() {
    if (qi >= qs.length) { $("#cjQ").textContent = ES ? `Test terminado: ${sc} / 8.` : `Test finished: ${sc} / 8.`; $("#cjFb").textContent = ""; setText($("#cjScore"), ""); return; }
    const q = qs[qi]; $("#cjQ").innerHTML = `<b>${PERS[q.i]}</b> · <b>${q.v}</b> · ${TN[q.te]}`; $("#cjIn").value = ""; $("#cjIn").focus(); setText($("#cjScore"), `${qi + 1} / 8`);
  }
  function check() {
    if (qi >= qs.length) return; const q = qs[qi], right = forms(q.v, q.te)[q.i], a = $("#cjIn").value.trim().toLowerCase();
    if (!a) return;
    const fb = $("#cjFb");
    if (a === right) { sc++; fb.className = "cj__fb ok"; fb.textContent = (ES ? "¡Correcto! " : "Correct! ") + right; popIt($("#cjIn")); }
    else if (norm(a) === norm(right)) { sc++; fb.className = "cj__fb ok"; fb.textContent = (ES ? "¡Casi perfecto! Falta el acento: " : "Nearly perfect! Add the accent: ") + right; }
    else { fb.className = "cj__fb no"; fb.textContent = (ES ? "No. La respuesta es: " : "Not quite. The answer is: ") + right; shake($("#cjIn")); }
    if (sc >= 6) award("conj");
    qi++; setTimeout(show, 1400);
  }
  $("#cjCheck").addEventListener("click", check); $("#cjIn").addEventListener("keydown", e => { if (e.key === "Enter") check(); }); $("#cjNew").addEventListener("click", newTest); newTest();
}

/* ---------------------------------------------------------------- Lab 3: Boutique */
{
  const DL = [
    { bank: ["jersey", "talla", "grande", "cuesta", "euros", "cuarenta"], lines: [["C", "Busco un {1} verde."], ["V", "¿Qué {2} necesita?"], ["C", "La L, por favor. Una L es más {3} que una M."], ["V", "Aquí tiene."], ["C", "¿Cuánto {4}?"], ["V", "Cuesta cuarenta {5}."], ["C", "Aquí tiene."], ["V", "Gracias. Son {6} euros."]], ans: ["jersey", "talla", "grande", "cuesta", "euros", "cuarenta"] },
    { bank: ["chaqueta", "talla", "grande", "cuesta", "euros", "setenta"], lines: [["C", "Busco una {1} negra."], ["V", "¿Qué {2} necesita?"], ["C", "La L. Una L es más {3} que una S."], ["V", "Aquí tiene."], ["C", "¿Cuánto {4}?"], ["V", "Cuesta setenta {5}."], ["C", "Aquí tiene."], ["V", "Gracias. Son {6} euros."]], ans: ["chaqueta", "talla", "grande", "cuesta", "euros", "setenta"] },
    { bank: ["vestido", "talla", "pequeña", "cuesta", "euros", "cincuenta"], lines: [["C", "Busco un {1} rojo."], ["V", "¿Qué {2} necesita?"], ["C", "La S. Una S es más {3} que una M."], ["V", "Aquí tiene."], ["C", "¿Cuánto {4}?"], ["V", "Cuesta cincuenta {5}."], ["C", "Aquí tiene."], ["V", "Gracias. Son {6} euros."]], ans: ["vestido", "talla", "pequeña", "cuesta", "euros", "cincuenta"] },
    { bank: ["abrigo", "talla", "grande", "cuestan", "euros", "cien"], lines: [["C", "Busco un {1} azul."], ["V", "¿Qué {2} necesita?"], ["C", "La XL. Una XL es más {3} que una L."], ["V", "Aquí tiene."], ["C", "¿Cuánto {4} estas botas?"], ["V", "Cuestan cien {5}."], ["C", "Aquí tiene."], ["V", "Gracias. Son {6} euros."]], ans: ["abrigo", "talla", "grande", "cuestan", "euros", "cien"] }
  ];
  let di = 0, picked = null, fill = {};
  const who = { C: ES ? "Cliente" : "Customer", V: ES ? "Vendedor" : "Assistant" };
  function render() {
    const d = DL[di]; fill = {}; picked = null;
    $("#bqTabs").innerHTML = ""; DL.forEach((_, i) => { const b = el("button", "", (ES ? "Diálogo " : "Dialogue ") + (i + 1)); b.setAttribute("aria-selected", i === di); b.addEventListener("click", () => { di = i; render(); }); $("#bqTabs").append(b); });
    $("#bqChat").innerHTML = d.lines.map(l => `<p class="bq__line bq__line--${l[0]}"><b>${who[l[0]]}:</b> ${l[1].replace(/\{(\d)\}/g, (m, n) => `<button class="gap" data-n="${n}" aria-label="gap ${n}">(${n}) ______</button>`)}</p>`).join("");
    $("#bqBank").innerHTML = ""; shuffle(d.bank).forEach(w => { const b = el("button", "", w); b.addEventListener("click", () => { picked = w; $$("#bqBank button").forEach(x => x.classList.toggle("on", x === b)); }); $("#bqBank").append(b); });
    $$(".gap", $("#bqChat")).forEach(g => g.addEventListener("click", () => {
      const n = g.dataset.n;
      if (fill[n]) { $$("#bqBank button").forEach(x => { if (x.textContent === fill[n]) x.disabled = false; }); delete fill[n]; g.textContent = `(${n}) ______`; g.classList.remove("ok", "no"); return; }
      if (!picked) { shake(g); setText($("#bqFb"), ES ? "Toca primero una palabra del banco." : "Tap a word in the bank first."); return; }
      fill[n] = picked; g.textContent = picked; $$("#bqBank button").forEach(x => { if (x.textContent === picked) { x.disabled = true; x.classList.remove("on"); } }); picked = null; popIt(g);
    }));
    setText($("#bqFb"), "");
  }
  $("#bqCheck").addEventListener("click", () => {
    const d = DL[di]; let good = 0;
    $$(".gap", $("#bqChat")).forEach(g => { const n = +g.dataset.n; const ok = fill[n] === d.ans[n - 1]; g.classList.remove("ok", "no"); if (fill[n]) g.classList.add(ok ? "ok" : "no"); if (ok) good++; });
    const fb = $("#bqFb"); fb.className = "cj__fb " + (good === 6 ? "ok" : "no"); fb.textContent = good === 6 ? (ES ? "¡6 / 6! Diálogo perfecto." : "6 / 6! Perfect dialogue.") : `${good} / 6. ${ES ? "Lee la frase completa: la palabra correcta suele estar cerca." : "Read the whole sentence: the right word is often nearby."}`;
    if (good === 6) { award("shop"); burstOn($("#bqCheck"), "#3fd9a0"); }
  });
  $("#bqReset").addEventListener("click", render); render();
  /* price reader */
  const NUM = { 10: "diez", 20: "veinte", 30: "treinta", 40: "cuarenta", 50: "cincuenta", 60: "sesenta", 70: "setenta", 80: "ochenta", 90: "noventa", 100: "cien" };
  let px = 0, pxs = 0, cur;
  function pxNew() {
    const keys = Object.keys(NUM), n = keys[Math.floor(Math.random() * keys.length)];
    cur = { n, ok: NUM[n], opts: shuffle([NUM[n], ...shuffle(keys.filter(k => k !== n)).slice(0, 3).map(k => NUM[k])]) };
    $("#pxTag").innerHTML = `<b>${n} €</b> <small>${ES ? "¿Cómo se dice?" : "How do you say it?"} Cuesta ___ euros.</small>`;
    $("#pxOpts").innerHTML = ""; cur.opts.forEach(o => { const b = el("button", "btn btn--ghost", o); b.addEventListener("click", () => { $$("#pxOpts button").forEach(x => { x.disabled = true; if (x.textContent === cur.ok) x.classList.add("ok"); }); px++; if (o === cur.ok) { pxs++; popIt(b); burstOn(b, "#3fd9a0"); } else { shake(b); b.classList.add("no"); } setText($("#pxScore"), `${pxs} / ${px}`); setTimeout(pxNew, 1000); }); $("#pxOpts").append(b); });
  }
  pxNew();
}

/* ---------------------------------------------------------------- Lab 4: Season Flip Globe */
{
  const CITY = { madrid: { name: "Madrid", cat: "cchhhhhhmmc".split("").concat(["c"]).slice(0, 12), r: { c: "3 – 11", m: "9 – 21", h: "19 – 34" } }, mexico: { name: "Ciudad de México", cat: Array(12).fill("m"), r: { m: "12 – 25" } }, bsas: { name: "Buenos Aires", cat: ["h", "h", "m", "m", "c", "c", "c", "c", "m", "m", "h", "h"], r: { c: "6 – 15", m: "11 – 23", h: "20 – 30" } } };
  CITY.madrid.cat = ["c", "c", "m", "m", "m", "h", "h", "h", "h", "m", "m", "c"];
  const TXT = {
    c: [ES ? "FRÍO" : "COLD", ES ? "Hace frío: abrigo, bufanda, guantes, gorro y botas." : "Hace frío: coat, scarf, gloves, woolly hat and boots."],
    m: [ES ? "TEMPLADO" : "MILD", ES ? "Ni frío ni calor: chaqueta, jersey, pantalones y zapatos." : "Not cold, not hot: jacket, sweater, trousers and shoes."],
    h: [ES ? "CALOR" : "HOT", ES ? "Hace calor: camiseta, vestido, falda y gafas de sol." : "Hace calor: T-shirt, dress, skirt and sunglasses."]
  };
  const GEAR = { c: ["abrigo", "bufanda", "guantes", "gorro"], m: ["chaqueta", "jersey", "pantalones", "zapatos"], h: ["camiseta", "vestido", "falda", "gafas"] };
  const ALL = shuffle([...GEAR.c, ...GEAR.m, ...GEAR.h]), LBL = { abrigo: "el abrigo", bufanda: "la bufanda", guantes: "los guantes", gorro: "el gorro", chaqueta: "la chaqueta", jersey: "el jersey", pantalones: "los pantalones", zapatos: "los zapatos", camiseta: "la camiseta", vestido: "el vestido", falda: "la falda", gafas: "las gafas" };
  let city = "bsas", mon = 11, perfect = 0, sel = new Set();
  const G = buildGlobe($("#glStage"), k => setCity(k));
  const lab = { summer: ES ? "VERANO" : "SUMMER", winter: ES ? "INVIERNO" : "WINTER", mild: ES ? "TEMPLADO" : "MILD" };
  function setCity(k) { city = k; if (G) G.faceCity(k); paint(); }
  function paint() {
    const c = CITY[city], cat = c.cat[mon];
    setText($("#glMonth"), MONTHS[mon]); setText($("#glCity"), c.name); setText($("#glMonthL"), MONTHS[mon]); $("#glMon").value = mon;
    if (G) G.setMonth(mon, lab);
    $("#glInfo").innerHTML = `<b>${c.name} · ${MONTHS[mon]}: ${TXT[cat][0]}</b><p>${c.r[cat] || c.r.m} °C. ${TXT[cat][1]}</p>${mon === 11 ? `<p><i>${city === "madrid" ? (ES ? "Navidad en invierno. El 5 de enero: la Cabalgata de Reyes." : "Navidad in winter. On 5 January: the Cabalgata de Reyes.") : city === "bsas" ? (ES ? "Navidad en verano: asado al aire libre y piscina." : "Navidad in summer: an outdoor asado and the pool.") : (ES ? "En Ciudad de México diciembre es fresco pero seco." : "In Mexico City December is cool but dry.")}</i></p>` : ""}`;
    $$("#glCities button").forEach(b => b.classList.toggle("on", b.dataset.k === city));
  }
  $("#glCities").innerHTML = ""; Object.keys(CITY).forEach(k => { const b = el("button", "", CITY[k].name); b.dataset.k = k; b.addEventListener("click", () => setCity(k)); $("#glCities").append(b); });
  $("#glMon").addEventListener("input", e => { mon = +e.target.value; paint(); });
  $("#glXmas").addEventListener("click", () => { mon = 11; paint(); popIt($("#glXmas")); });
  $("#glJul").addEventListener("click", () => { mon = 6; paint(); popIt($("#glJul")); });
  $("#glPack").innerHTML = ""; ALL.forEach(n => { const b = el("button", "gl__it", `<img src="photos/${n}.jpg" alt="" width="64" height="64" loading="lazy"><span>${LBL[n]}</span>`); b.setAttribute("aria-pressed", "false"); b.dataset.n = n; b.addEventListener("click", () => { const on = !sel.has(n); if (on && sel.size >= 4) { shake(b); return; } on ? sel.add(n) : sel.delete(n); b.setAttribute("aria-pressed", on); }); $("#glPack").append(b); });
  $("#glCheck").addEventListener("click", () => {
    const cat = CITY[city].cat[mon], ok = GEAR[cat], good = [...sel].filter(n => ok.includes(n)).length, fb = $("#glFb");
    if (sel.size < 4) { fb.className = "cj__fb no"; fb.textContent = ES ? "Elige 4 prendas." : "Pick 4 items."; return; }
    if (good === 4) { fb.className = "cj__fb ok"; fb.textContent = ES ? `¡Maleta perfecta para ${CITY[city].name} en ${MONTHS[mon]}!` : `Perfect suitcase for ${CITY[city].name} in ${MONTHS[mon]}!`; perfect++; burstOn($("#glCheck"), "#3fd9a0"); if (perfect >= 2) award("globe"); }
    else { fb.className = "cj__fb no"; fb.textContent = (ES ? `${good} / 4 correctas. Aquí es ` : `${good} / 4 right. Here it is `) + TXT[cat][0].toLowerCase() + ": " + ok.map(n => LBL[n]).join(", ") + "."; }
  });
  paint(); if (G) G.faceCity("bsas");
}

/* ---------------------------------------------------------------- Lab 5: Reading Detective */
{
  let ti = 0, qi = 0; const doneT = new Set();
  const tabs = $("#rdTabs");
  READ.forEach((r, i) => { const b = el("button", "", t(r.title).replace(/^[^:]*:\s*/, "") + " " + (i + 1)); b.addEventListener("click", () => { ti = i; qi = 0; draw(); }); tabs.append(b); });
  function draw() {
    const r = READ[ti]; $$("#rdTabs button").forEach((b, i) => b.setAttribute("aria-selected", i === ti));
    $("#rdText").innerHTML = r.text.split(" ").map((w, i) => `<button class="tok" data-w="${norm(w)}">${w}</button>`).join(" ");
    $$("#rdText .tok").forEach(b => b.addEventListener("click", () => tap(b)));
    ask(); $("#rdFb").innerHTML = `<b>${t(r.title)}</b><p>${ES ? "Toca la palabra que responde a la pregunta." : "Tap the word that answers the question."}</p>`; prog();
  }
  function ask() { const r = READ[ti]; if (qi >= r.qs.length) { $("#rdQ").innerHTML = `<b>${ES ? "¡Texto completo!" : "Text complete!"}</b>`; doneT.add(ti); if (doneT.size === READ.length) award("read"); return; } $("#rdQ").innerHTML = `${qi + 1}/${r.qs.length}: <b>${t(r.qs[qi].q)}</b>`; }
  function prog() { setText($("#rdProg"), (ES ? "Textos terminados: " : "Texts finished: ") + doneT.size + " / " + READ.length); }
  function tap(b) {
    const r = READ[ti]; if (qi >= r.qs.length) return; const q = r.qs[qi];
    if (q.tap.some(x => norm(x) === b.dataset.w)) { b.classList.add("ok"); popIt(b); burstOn(b, "#3fd9a0"); $("#rdFb").innerHTML = `<b>${ES ? "¡Sí!" : "Yes!"} ${q.en}</b><p>${t(q.ex)}</p>`; qi++; ask(); prog(); }
    else { shake(b); $("#rdFb").innerHTML = `<b>${ES ? "Esa palabra no responde la pregunta." : "That word does not answer the question."}</b><p>${t(q.q)}</p>`; }
  }
  draw();
}

/* ---------------------------------------------------------------- Lab 6: Writing Workshop */
{
  const GAR = { camiseta: "f1", camisa: "f1", falda: "f1", chaqueta: "f1", bufanda: "f1", corbata: "f1", jersey: "m1", sueter: "m1", abrigo: "m1", sombrero: "m1", vestido: "m1", traje: "m1", gorro: "m1", zapatos: "m2", pantalones: "m2", vaqueros: "m2", guantes: "m2", botas: "f2", gafas: "f2" };
  const COL = { blanco: 1, negro: 1, rojo: 1, amarillo: 1, azul: 2, verde: 2, gris: 2, rosa: 3, naranja: 3, marron: 4 };
  const colForms = (c, g) => { const t = COL[c], pl = g[1] === "2", f = g[0] === "f"; if (t === 1) return c.replace(/o$/, "") + (f ? "a" : "o") + (pl ? "s" : ""); if (t === 2) return c + (pl ? (c === "gris" ? "es" : c === "azul" ? "es" : "s") : ""); if (t === 3) return c; return c + (pl ? "es" : ""); };
  const ART = { m1: "un", f1: "una", m2: "unos", f2: "unas" };
  const SET = [
    { h: ES ? "1. Di adónde vas y con quién." : "1. Say where you are going and who with.", st: "Voy a ir a ... con ..." },
    { h: ES ? "2. Di qué tiempo hace allí." : "2. Say what the weather is like there.", st: "Hace ..." },
    { h: ES ? "3. Di una prenda que llevas y su color." : "3. Say one item of clothing you take and its colour.", st: "Llevo ..." },
    { h: ES ? "4. Di una actividad que vas a hacer." : "4. Say one activity you are going to do.", st: "Voy a ..." }
  ];
  const BANK = [[ES ? "Personas" : "People", ["mi familia", "mis amigos", "mi hermano"]], [ES ? "Tiempo" : "Weather", ["calor", "frío", "sol", "viento"]], [ES ? "Ropa" : "Clothes", ["una camiseta", "una camisa", "unos zapatos", "unas botas"]], [ES ? "Colores" : "Colours", ["blanca", "negra", "blancos", "negros"]], [ES ? "Actividades" : "Activities", ["visitar el museo", "visitar la playa", "comer tacos", "comer tapas", "nadar en el mar"]]];
  let focus = 0;
  $("#wrBox").innerHTML = SET.map((s, i) => `<label class="wr__row"><span>${s.h} <small>(2)</small></span><input class="wr__in" data-i="${i}" type="text" value="" placeholder="${s.st}" autocomplete="off" spellcheck="false"></label>`).join("");
  $$(".wr__in").forEach(inp => inp.addEventListener("focus", () => { focus = +inp.dataset.i; }));
  $("#wrBank").innerHTML = BANK.map(b => `<span class="wr__grp"><b>${b[0]}:</b> ${b[1].map(w => `<button type="button" data-w="${w}">${w}</button>`).join("")}</span>`).join("");
  $$("#wrBank button").forEach(b => b.addEventListener("click", () => { const inp = $$(".wr__in")[focus]; inp.value = (inp.value ? inp.value.replace(/\s*$/, " ") : "") + b.dataset.w; inp.focus(); popIt(b); }));
  const dest = () => $("#wrDest").value;
  function markOne(i, raw) {
    const n = norm(raw), r = { c: 0, l: 0, m: "" };
    if (i === 0) {
      const dM = /voy a (?:ir|viajar|volar) a (?:la |el |los |las )?(?!con\b)([a-z]+)/.exec(n), dAlt = /\ba (?:la |el )?(?!con\b)([a-z]+) con\b/.exec(n), comp = /\bcon (?:mi |mis |un |una |el |la |los |las )?[a-z]+/.test(n);
      r.c = (dM || dAlt) && comp ? 1 : 0; r.l = dM || /voy a (?!ir\b|viajar\b)[a-z]+ con \w+/.test(n) ? 1 : 0;
      r.m = r.c ? "" : (ES ? "Falta el destino o la persona (con ...)." : "Name a destination AND who with (con ...).");
      if (!r.l) r.m += (ES ? " Usa «voy a ir a ...» con la «a»." : " Use “voy a ir a ...” with the 'a'.");
    } else if (i === 1) {
      r.c = /\b(calor|frio|sol|viento|lluvia|nieve|llueve|nieva|buen tiempo|mal tiempo)\b/.test(n) ? 1 : 0; r.l = /\bhace (calor|frio|sol|viento|buen tiempo|mal tiempo)\b|\b(llueve|nieva)\b/.test(n) ? 1 : 0;
      if (!r.c) r.m = ES ? "Nombra un tiempo: calor, frío, sol..." : "Name a weather: calor, frío, sol..."; else if (!r.l) r.m = ES ? "Usa «Hace + calor/frío/sol/viento»." : "Use “Hace + calor/frío/sol/viento”.";
    } else if (i === 2) {
      const g = Object.keys(GAR).find(k => new RegExp("\\b" + k + "\\b").test(n)), col = Object.keys(COL).find(c => new RegExp("\\b" + c.slice(0, Math.max(3, c.length - 1)) + "[a-z]*\\b").test(n.split(g || "§").pop() || ""));
      r.c = g && col ? 1 : 0;
      if (!r.c) r.m = ES ? "Nombra una prenda Y su color." : "Name a clothing item AND its colour.";
      else {
        const gen = GAR[g], artOk = new RegExp("\\bllevo " + ART[gen] + " (?:[a-z]+ )?" + g + "\\b").test(n) || new RegExp("\\b" + ART[gen] + " " + g + "\\b").test(n), colOk = new RegExp("\\b" + g + "(?: [a-z]+)* " + colForms(col, gen) + "\\b").test(n), llevo = /\bllevo\b/.test(n);
        r.l = llevo && artOk && colOk ? 1 : 0;
        if (!llevo) r.m = ES ? "Empieza con «Llevo ...»." : "Start with “Llevo ...”."; else if (!artOk) r.m = (ES ? "El artículo no concuerda: " : "The article does not agree: ") + ART[gen] + " " + g; else if (!colOk) r.m = (ES ? "El color debe concordar: " : "The colour must agree: ") + g + " " + colForms(col, gen);
      }
    } else {
      const m = /\b(?:voy|vamos) a ([a-z]+(?:ar|er|ir))\b(.*)/.exec(n);
      r.c = m && (m[2].trim() || /^(nadar|bailar|descansar|comer|viajar|jugar)$/.test(m[1])) ? 1 : 0; r.l = m ? 1 : 0;
      if (!m) r.m = ES ? "Usa «Voy a + infinitivo»: voy a visitar..." : "Use “Voy a + infinitive”: voy a visitar..."; else if (!r.c) r.m = ES ? "Di qué actividad: visitar el museo, comer tapas..." : "Say what activity: visitar el museo, comer tapas...";
    }
    return r;
  }
  $("#wrCheck").addEventListener("click", () => {
    let tot = 0; const rows = $$(".wr__in").map((inp, i) => { const raw = inp.value.trim(), r = raw ? markOne(i, raw) : { c: 0, l: 0, m: ES ? "Escribe una frase completa." : "Write a full sentence." }; tot += r.c + r.l; inp.classList.toggle("ok", r.c + r.l === 2); inp.classList.toggle("no", r.c + r.l < 2); return `<li><b>${i + 1}.</b> ${ES ? "Contenido" : "Content"} ${r.c ? "✔" : "✘"} · ${ES ? "Lenguaje" : "Language"} ${r.l ? "✔" : "✘"} <span>${r.m || (ES ? "¡Dos puntos!" : "Both marks!")}</span></li>`; });
    $("#wrOut").innerHTML = `<b>${tot} / 8</b><ol>${rows.join("")}</ol><small>${ES ? "Esta revisión usa la misma idea del examen (1 contenido + 1 lenguaje). Tu profesor califica el examen real." : "This checker uses the same two-mark idea as the exam (1 content + 1 language). Your teacher marks the real paper."}</small>`;
    if (tot >= 7) { award("write"); burstOn($("#wrCheck"), "#3fd9a0"); }
  });
  const MODEL = d => [`Voy a ir a ${d} con mi familia.`, "Hace calor.", "Llevo una camiseta blanca.", "Voy a visitar el museo."];
  $("#wrModel").addEventListener("click", () => { $("#wrOut").innerHTML = `<b>${ES ? "Modelo de 8 / 8" : "Full-mark model"}</b><ol>${MODEL(dest()).map(s => `<li>${s}</li>`).join("")}</ol>`; });
  $("#wrClear").addEventListener("click", () => { $$(".wr__in").forEach(i => { i.value = ""; i.classList.remove("ok", "no"); }); $("#wrOut").innerHTML = ""; });
}

/* ---------------------------------------------------------------- bonus game */
$("#bonusPlay").addEventListener("click", () => {
  const tx = { lang: LG, time: ES ? "Tiempo" : "Time", stamps: ES ? "Sellos" : "Stamps", streak: ES ? "Racha" : "Streak", quit: ES ? "Terminar" : "Finish", alt: ES ? "Calle con tres taxis; cada uno lleva una respuesta" : "A street with three taxis, each carrying an answer", stamp: ES ? "Sello" : "Stamp", wrong: ES ? "El taxi te lleva a" : "The taxi takes you to", right: ES ? "La respuesta correcta" : "The right answer", done: ES ? "¡Fin del viaje!" : "End of the trip!", stamps2: ES ? "sellos" : "stamps", acc: ES ? "de acierto" : "accuracy", best: ES ? "mejor racha" : "best streak", revisit: ES ? "Repasa esto:" : "Revisit these:", perfect: ES ? "Sin puntos débiles en esta ronda." : "No weak spots this round.", again: ES ? "Jugar otra vez" : "Play again", skip: u("toExam"), passport: ES ? "PASAPORTE" : "PASSPORT" };
  mountTaxi($("#bonusHost"), { bank: BANK, tx, onDone: () => award("bonus") });
});

/* ---------------------------------------------------------------- practice exam */
const KBANK = BANK.map(b => [b.l, t(b.q), b.ok, b.w[0], b.w[1], b.w[2], t(b.ex)]);
initQuiz({ BANK: KBANK, labels: LESSONS.map((_, i) => lessonLabel(i)), first: 1, award, P });

/* ---------------------------------------------------------------- credits and booklet links */
wireBooklet("Exam-4-Revision-Booklet");
fetch("photos/credits.json").then(r => r.json()).then(c => {
  $("#credits").innerHTML = u("cred") + " " + Object.keys(c).map(k => `<a href="${c[k].page}" target="_blank" rel="noopener noreferrer">${c[k].file.replace(/^File:/, "").replace(/\.[a-z]+$/i, "")}</a> ${u("by")} ${c[k].author}, ${c[k].license}`).join("; ") + ".";
}).catch(() => { /* credits are a progressive enhancement */ });

/* the site header is sticky too: park the section bar just under it */
const headFix = () => { const h = $(".site-head"); if (h) document.documentElement.style.setProperty("--headh", Math.round(h.getBoundingClientRect().height) + "px"); };
headFix(); addEventListener("resize", headFix); setTimeout(headFix, 600);

/* back-to-top button, shown once the student has scrolled down */
const toTop = el("button", "totop", `<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5m0 0l-6 6m6-6l6 6"/></svg>${ES ? "Volver arriba" : "Back to top"}`);
toTop.type = "button"; toTop.setAttribute("aria-label", ES ? "Volver al inicio de la página" : "Return to the top of the page");
document.body.append(toTop);
toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
addEventListener("scroll", () => toTop.classList.toggle("show", scrollY > 700), { passive: true });
