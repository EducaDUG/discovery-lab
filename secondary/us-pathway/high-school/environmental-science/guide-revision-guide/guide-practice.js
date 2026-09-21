/* ==========================================================================
   COURSE REVISION GUIDE — practice questions and interactive concept models.

   This is a static reference page, not a graded Discovery Lab simulation, so
   it deliberately does NOT use engine/engine.js's Orient->Apply->Knowledge
   Check pipeline, marking.json split, or evidence PDF (there is nothing here
   to submit or mark against a rubric — it's ungated self-practice a student
   can repeat as often as they like). It borrows only the visual language
   (auto-marked multiple choice with instant feedback) that students already
   know from real simulations, kept local to this guide's own folder per the
   content-vs-engine rule.
   ========================================================================== */

/* Two sticky bars stack at the top of this page (the shared site header,
   then this page's own quick-nav). Both react to font metrics/loading and
   viewport width, so their real heights are measured at runtime rather than
   hardcoded — exposed as CSS vars that both the quicknav's `top` and every
   anchor target's `scroll-margin-top` read, so jumping to a chapter (or a
   pill click) never lands a heading underneath either bar. */
function syncStickyHeights() {
  const head = document.querySelector(".site-head");
  const nav = document.querySelector(".quicknav:not([hidden])");
  if (head) document.documentElement.style.setProperty("--head-h", head.getBoundingClientRect().height + "px");
  if (nav) document.documentElement.style.setProperty("--nav-h", nav.getBoundingClientRect().height + "px");
}
syncStickyHeights();
window.addEventListener("resize", syncStickyHeights);
window.addEventListener("load", syncStickyHeights);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(syncStickyHeights);

/* ------------------------------------------------------------------------
   Question bank — 3 per chapter, pooled into the Practice Bank below.
   ------------------------------------------------------------------------ */
const BANK = {
  1: [
    { q: "Which of these is the most useful way to describe an environmental impact?",
      opts: ["“Energy”", "Charging a phone overnight", "“Nature”", "“Pollution”"], correct: 1,
      explain: "A strong example names the exact action and impact, not a broad category." },
    { q: "What is the main modern concern about the planet's water supply?",
      opts: ["The total amount of water on Earth is shrinking", "Access to clean, safe water", "The oceans are disappearing", "There is too much water in the atmosphere"], correct: 1,
      explain: "Water stays in the water cycle — the real issue is whether it's clean, safe and available." },
    { q: "Environmental Science studies…",
      opts: ["Only wild ecosystems untouched by people", "Only pollution and disasters", "Air, water, soil, ecosystems, biodiversity, climate and how humans interact with them", "Only climate change"], correct: 2,
      explain: "It's a broad science covering every system and how humans interact with it." },
  ],
  2: [
    { q: "In a food web diagram, an arrow between two organisms points…",
      opts: ["From predator to prey", "From the organism eaten to the organism that eats it", "In whichever direction looks tidiest", "From producer to decomposer only"], correct: 1,
      explain: "The arrow shows the direction energy travels: eaten → eater." },
    { q: "Roughly what percentage of energy transfers from one trophic level to the next?",
      opts: ["90%", "50%", "10%", "1%"], correct: 2,
      explain: "The 10% rule — which is why top predators are always rare." },
    { q: "Which organisms recycle nutrients from dead material back into the soil?",
      opts: ["Producers", "Primary consumers", "Top predators", "Decomposers"], correct: 3,
      explain: "Fungi and bacteria break down dead material and return nutrients to the soil." },
  ],
  3: [
    { q: "Variation in DNA within a single species is called…",
      opts: ["Species diversity", "Genetic diversity", "Ecosystem diversity", "Ecoregion diversity"], correct: 1,
      explain: "Genetic diversity gives a population a better chance of surviving disease or change." },
    { q: "A biome is best described as…",
      opts: ["A single species' genetic makeup", "A specific region within a country", "A broad, major ecological zone such as desert or rainforest", "A single farm's crop rotation"], correct: 2,
      explain: "An ecoregion is the more specific slice within a biome." },
    { q: "Which of these is a cultural ecosystem service?",
      opts: ["Timber for construction", "Pollination of crops", "Recreation and inspiration from a natural landscape", "Nutrient cycling in soil"], correct: 2,
      explain: "Cultural services are non-material benefits — beauty, recreation, inspiration." },
  ],
  4: [
    { q: "What makes a species “invasive” rather than simply non-native?",
      opts: ["It was brought from another country", "It looks different from native species", "It spreads successfully and causes harm to the local ecosystem", "It is larger than native species"], correct: 2,
      explain: "Being non-native alone isn't enough — it must spread and cause damage." },
    { q: "Which IUCN Red List category represents the LOWEST extinction risk of these three?",
      opts: ["Critically Endangered", "Endangered", "Vulnerable", "They are all equal"], correct: 2,
      explain: "Order of increasing risk: Vulnerable → Endangered → Critically Endangered." },
    { q: "An Alliance for Zero Extinction (AZE) site is best described as…",
      opts: ["Any national park", "A site that may be the last refuge for one highly threatened species", "Any area with high rainfall", "A zoo breeding programme"], correct: 1,
      explain: "AZE sites sharpen conservation focus onto the most critical single sites." },
  ],
  5: [
    { q: "A population, in the ecological sense, must always be defined by…",
      opts: ["Just a species name", "A species AND a specific, named area", "A country's borders only", "A single individual"], correct: 1,
      explain: "“Kangaroos” means nothing without naming the area they're counted in." },
    { q: "Which growth pattern levels off as a population nears its environment's carrying capacity?",
      opts: ["Exponential growth", "Logistic growth", "Linear growth", "Negative growth"], correct: 1,
      explain: "Logistic growth forms an S-curve as density-dependent limits kick in." },
    { q: "A wildfire affecting a population regardless of how crowded it is, is an example of a…",
      opts: ["Density-dependent factor", "Density-independent factor", "Carrying capacity", "Genetic factor"], correct: 1,
      explain: "Density-independent factors (fire, flood) act regardless of population size." },
  ],
  6: [
    { q: "Which of these is NOT one of Earth's four systems?",
      opts: ["Geosphere", "Hydrosphere", "Technosphere", "Biosphere"], correct: 2,
      explain: "The four are geosphere, hydrosphere, atmosphere and biosphere." },
    { q: "A tsunami's DIRECT effect on ocean water is best classified under which system?",
      opts: ["Atmosphere", "Hydrosphere", "Biosphere", "Geosphere"], correct: 1,
      explain: "The hydrosphere is all of Earth's water — directly involved through mass water movement." },
    { q: "Why is it more accurate to treat Earth's four systems as one connected model?",
      opts: ["Because only the atmosphere really matters", "Because effects spread across systems as connected consequences", "Because they never interact", "Because scientists prefer simpler diagrams"], correct: 1,
      explain: "Environmental events rarely stay contained to just one system." },
  ],
  7: [
    { q: "Roughly what percentage of Earth's water is fresh water?",
      opts: ["50%", "25%", "3%", "75%"], correct: 2,
      explain: "About 97% is salt water; only ~3% is fresh, mostly stored underground." },
    { q: "Why can't a freshwater fish survive if moved directly into the sea?",
      opts: ["The sea is too cold", "Osmosis causes it to lose water and dehydrate", "There is no oxygen in seawater", "It cannot swim in salt water"], correct: 1,
      explain: "Water moves from higher to lower concentration across the fish's membranes." },
    { q: "Which soil layer is the nutrient-rich topsoil where most roots grow?",
      opts: ["Bedrock", "O horizon", "A horizon", "Subsoil"], correct: 2,
      explain: "The A horizon is fed by leaching and is where most plant roots grow." },
  ],
  8: [
    { q: "A system dominated by a single species, such as a pine plantation, is called a…",
      opts: ["Biome", "Monoculture", "Ecoregion", "Buffer zone"], correct: 1,
      explain: "Monocultures support far less biodiversity than a native multi-species forest." },
    { q: "Industrial agriculture is best described as farming that…",
      opts: ["Feeds only the farming family", "Is run mainly as a business selling most of its produce", "Uses no machinery", "Only grows one crop for personal use"], correct: 1,
      explain: "Subsistence agriculture is the one that mainly feeds the farming family." },
    { q: "What is a buffer zone designed to do?",
      opts: ["Increase crop yield", "Reduce pressure on a sensitive ecosystem from an adjacent human land use", "Replace the need for national parks", "Measure rainfall"], correct: 1,
      explain: "A buffer zone cuts noise, runoff, erosion and invasive spread at the edge." },
  ],
  9: [
    { q: "“Day Zero” refers to…",
      opts: ["The first day a reservoir is built", "The day a reservoir has no water left to supply anyone", "A public holiday", "The wettest day of the year"], correct: 1,
      explain: "The central risk reservoir management is designed to avoid." },
    { q: "Which human activity uses the largest share of the world's fresh water?",
      opts: ["Industry", "Domestic households", "Agriculture", "Power stations"], correct: 2,
      explain: "Agriculture is the single largest water user, and the largest driver of scarcity." },
    { q: "Which conservation measure works by collecting rain for later use?",
      opts: ["Drip irrigation", "Rainwater harvesting", "Wetland restoration", "Desalination"], correct: 1,
      explain: "Rainwater harvesting (e.g. roof tanks) reduces demand on the mains supply." },
  ],
  10: [
    { q: "Which of these is a renewable energy source?",
      opts: ["Coal", "Petroleum", "Solar", "Uranium"], correct: 2,
      explain: "Solar is naturally replenished on a human timescale; the others are not." },
    { q: "The real problem with the greenhouse effect is…",
      opts: ["That it exists at all", "Extra greenhouse gases from human activity trapping additional heat", "That plants absorb carbon dioxide", "That the sun is getting hotter"], correct: 1,
      explain: "The natural effect keeps Earth livable — it's the EXTRA gases that are the problem." },
    { q: "An environmental footprint is broader than a carbon footprint because it also includes…",
      opts: ["Only car emissions", "Land use, water, food, packaging and more", "Nothing extra, they are the same", "Only flight emissions"], correct: 1,
      explain: "Carbon footprint is mainly greenhouse gases; environmental footprint is much broader." },
  ],
  11: [
    { q: "Pollution coming from one identifiable location, like a single drilling platform, is called…",
      opts: ["Non-point source pollution", "Point source pollution", "Diffuse pollution", "Background pollution"], correct: 1,
      explain: "One traceable source — authorities can act directly on it." },
    { q: "Why is agricultural run-off into a reef usually harder to fix than a single oil spill?",
      opts: ["It is less harmful", "It comes from many farms across a whole region with no single source to target", "It only happens once", "It is illegal everywhere"], correct: 1,
      explain: "Non-point source pollution needs broad, coordinated regional action instead." },
    { q: "What actually caused the Montara oil spill?",
      opts: ["A cargo ship collision", "An offshore drilling platform blowout", "A pipeline leak in a city", "An oil tanker running aground"], correct: 1,
      explain: "The West Atlas rig blowout, Timor Sea, 2009 — not a cargo ship." },
  ],
  12: [
    { q: "What does the ozone layer actually filter out of sunlight?",
      opts: ["Infrared heat", "Ultraviolet (UV) light", "Visible light", "Radio waves"], correct: 1,
      explain: "It absorbs UV, especially UV-B — heat arrives separately as infrared." },
    { q: "Ozone depletion and global warming are best described as…",
      opts: ["Exactly the same problem", "Two separate problems with different causes", "Both caused only by CFCs", "Both caused only by carbon dioxide"], correct: 1,
      explain: "CFCs deplete ozone; greenhouse gases cause warming — different mechanisms." },
    { q: "The Montreal Protocol (1987) is significant because it…",
      opts: ["Increased CFC production", "Banned ozone-depleting chemicals internationally", "Ended all fossil fuel use", "Created the first weather satellite"], correct: 1,
      explain: "A genuine environmental success story — the ozone layer is now recovering." },
  ],
};

/* ------------------------------------------------------------------------
   MCQ rendering — click an option, get instant feedback, correct answer
   always revealed. No login, no persistence: ungated self-practice.
   ------------------------------------------------------------------------ */
const LETTERS = ["A", "B", "C", "D", "E"];

function renderMCQ(item, onAnswered) {
  const card = document.createElement("div");
  card.className = "mcq";
  const q = document.createElement("p");
  q.className = "mcq__q";
  q.textContent = item.q;
  card.append(q);

  const opts = document.createElement("div");
  opts.className = "mcq__opts";
  const explain = document.createElement("p");
  explain.className = "mcq__explain";
  explain.hidden = true;
  explain.textContent = item.explain;

  let answered = false;
  item.opts.forEach((text, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mcq__opt";
    const letter = document.createElement("span");
    letter.className = "letter";
    letter.textContent = LETTERS[i];
    const label = document.createElement("span");
    label.textContent = text;
    btn.append(letter, label);
    btn.addEventListener("click", () => {
      if (answered) return;
      answered = true;
      const correct = i === item.correct;
      [...opts.children].forEach((b, j) => {
        b.disabled = true;
        if (j === item.correct) b.classList.add("is-correct");
        else if (j === i) b.classList.add("is-wrong");
        else b.classList.add("is-faded");
      });
      explain.hidden = false;
      if (onAnswered) onAnswered(correct);
    });
    opts.append(btn);
  });

  card.append(opts, explain);
  return card;
}

function checkIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML = '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>';
  return svg;
}

/* Per-chapter practice: the 3 questions for that chapter, always visible. */
document.querySelectorAll(".practice-mount[data-chapter]").forEach(mount => {
  const chapter = mount.dataset.chapter;
  const items = BANK[chapter];
  if (!items) return;
  const head = document.createElement("div");
  head.className = "practice-mount__head";
  head.append(checkIcon());
  const label = document.createElement("span");
  label.textContent = "Practice Questions";
  head.append(label);
  mount.append(head);
  items.forEach(item => mount.append(renderMCQ(item)));
});

/* Practice Bank: every question pooled, shuffled, with a running score and a
   "New set" button that reshuffles and resets the score. */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const bankMount = document.getElementById("practice-bank-mount");
if (bankMount) {
  const all = Object.values(BANK).flat();
  let correctCount = 0;
  let answeredCount = 0;

  const toolbar = document.createElement("div");
  toolbar.className = "practice-bank__toolbar";
  const scoreEl = document.createElement("span");
  scoreEl.className = "practice-bank__score";
  const newSetBtn = document.createElement("button");
  newSetBtn.type = "button";
  newSetBtn.className = "btn btn--ghost";
  newSetBtn.textContent = "New set";
  toolbar.append(scoreEl, newSetBtn);

  const list = document.createElement("div");

  function updateScore() {
    scoreEl.innerHTML = "";
    scoreEl.append(document.createTextNode("Score: "));
    const b = document.createElement("b");
    b.textContent = `${correctCount} / ${answeredCount}`;
    scoreEl.append(b);
    scoreEl.append(document.createTextNode(` answered (${all.length} in this set)`));
  }

  function buildSet() {
    list.innerHTML = "";
    correctCount = 0;
    answeredCount = 0;
    updateScore();
    shuffle(all).forEach(item => {
      list.append(renderMCQ(item, correct => {
        answeredCount++;
        if (correct) correctCount++;
        updateScore();
      }));
    });
  }

  newSetBtn.addEventListener("click", buildSet);
  bankMount.append(toolbar, list);
  buildSet();
}

/* ------------------------------------------------------------------------
   Try It — Population Growth Explorer (Chapter 5).
   Redraws a live logistic curve (and an exponential comparison) as the
   student drags the growth-rate and carrying-capacity sliders.
   ------------------------------------------------------------------------ */
const growthMount = document.getElementById("sim-growth");
if (growthMount) {
  growthMount.innerHTML = "";
  const W = 560, H = 260, PAD_L = 50, PAD_B = 40, PAD_T = 20, PAD_R = 20;
  const plotW = W - PAD_L - PAD_R, plotH = H - PAD_T - PAD_B;
  const P0 = 4, T_MAX = 20;

  const card = document.createElement("div");
  card.className = "sim-card";
  card.innerHTML = `
    <p class="sim-card__title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 14c3-8 7-8 10 -2"/></svg>
      Try It &mdash; Population Growth Explorer
    </p>
    <div class="sim-row">
      <div class="sim-controls">
        <label>Growth rate (r): <span class="val" id="growth-r-val">0.4</span>
          <input type="range" id="growth-r" min="0.1" max="1" step="0.05" value="0.4">
        </label>
        <label>Carrying capacity (K): <span class="val" id="growth-k-val">70</span>
          <input type="range" id="growth-k" min="20" max="100" step="5" value="70">
        </label>
        <p class="sim-readout" id="growth-readout"></p>
      </div>
      <svg id="growth-svg" viewBox="0 0 560 260" role="img" aria-label="A live-updating graph of logistic and exponential population growth curves that redraw as the growth rate and carrying capacity sliders change.">
        <line x1="50" y1="20" x2="50" y2="220" stroke="currentColor" stroke-width="1.3"/>
        <line x1="50" y1="220" x2="530" y2="220" stroke="currentColor" stroke-width="1.3"/>
        <text x="20" y="120" text-anchor="middle" font-size="11" fill="var(--ink-2)" transform="rotate(-90 20 120)">Population size</text>
        <text x="290" y="245" text-anchor="middle" font-size="11" fill="var(--ink-2)">Time</text>
        <line id="growth-k-line" x1="50" x2="530" stroke="var(--accent)" stroke-width="1" stroke-dasharray="5 4"/>
        <text id="growth-k-label" font-size="11" fill="var(--accent)"></text>
        <path id="growth-exp-path" fill="none" stroke="var(--signal)" stroke-width="2" stroke-dasharray="4 3" opacity="0.75"/>
        <path id="growth-log-path" fill="none" stroke="var(--accent)" stroke-width="2.4"/>
      </svg>
    </div>
  `;
  growthMount.append(card);

  const rInput = card.querySelector("#growth-r");
  const kInput = card.querySelector("#growth-k");
  const rVal = card.querySelector("#growth-r-val");
  const kVal = card.querySelector("#growth-k-val");
  const readout = card.querySelector("#growth-readout");
  const logPath = card.querySelector("#growth-log-path");
  const expPath = card.querySelector("#growth-exp-path");
  const kLine = card.querySelector("#growth-k-line");
  const kLabel = card.querySelector("#growth-k-label");

  function yFor(pop, kMax) {
    const clamped = Math.min(pop, kMax * 1.6);
    return PAD_T + plotH - (clamped / (kMax * 1.6)) * plotH;
  }
  function xFor(t) { return PAD_L + (t / T_MAX) * plotW; }

  function redraw() {
    const r = parseFloat(rInput.value);
    const K = parseFloat(kInput.value);
    rVal.textContent = r.toFixed(2);
    kVal.textContent = String(K);

    const yMax = K * 1.6;
    const kY = yFor(K, K);
    kLine.setAttribute("y1", kY); kLine.setAttribute("y2", kY);
    kLabel.setAttribute("x", 534); kLabel.setAttribute("y", kY + 4);
    kLabel.textContent = "K";

    const N = 60;
    let logD = "", expD = "";
    for (let i = 0; i <= N; i++) {
      const t = (T_MAX * i) / N;
      const logistic = K / (1 + ((K - P0) / P0) * Math.exp(-r * t));
      const exponential = P0 * Math.exp(r * t * 0.6);
      const lx = xFor(t), ly = yFor(logistic, K);
      const ex = xFor(t), ey = yFor(exponential, K);
      logD += (i === 0 ? "M" : "L") + lx.toFixed(1) + "," + ly.toFixed(1) + " ";
      if (exponential <= yMax) expD += (expD === "" ? "M" : "L") + ex.toFixed(1) + "," + ey.toFixed(1) + " ";
    }
    logPath.setAttribute("d", logD.trim());
    expPath.setAttribute("d", expD.trim());

    const finalPop = Math.round(K / (1 + ((K - P0) / P0) * Math.exp(-r * T_MAX)));
    readout.innerHTML = `With <strong>r = ${r.toFixed(2)}</strong> and <strong>K = ${K}</strong>, the logistic
      population (solid line) settles at roughly <strong>${finalPop}</strong> by year ${T_MAX} — while
      unchecked exponential growth (dashed) keeps climbing far past what the environment could really support.`;
  }

  rInput.addEventListener("input", redraw);
  kInput.addEventListener("input", redraw);
  redraw();
}

/* ------------------------------------------------------------------------
   Try It — Reservoir Manager, simplified (Chapter 9).
   A single-screen model: set extraction and rainfall, advance a year at a
   time, and watch the reservoir level respond. Not a Discovery Lab
   simulation (no mission/rubric/evidence) — a quick concept check.
   ------------------------------------------------------------------------ */
const reservoirMount = document.getElementById("sim-reservoir");
if (reservoirMount) {
  reservoirMount.innerHTML = "";
  const card = document.createElement("div");
  card.className = "sim-card";
  card.innerHTML = `
    <p class="sim-card__title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 14h16v6H4z"/><path d="M7 14V6l5-3 5 3v8"/></svg>
      Try It &mdash; Reservoir Manager
    </p>
    <div class="sim-row">
      <div class="sim-controls">
        <label>Extraction level: <span class="val" id="res-ex-val">50</span>%
          <input type="range" id="res-extraction" min="0" max="100" step="5" value="50">
        </label>
        <label>Rainfall this year (% of normal): <span class="val" id="res-rain-val">100</span>%
          <input type="range" id="res-rainfall" min="0" max="150" step="5" value="100">
        </label>
        <div class="cluster" style="margin-top:var(--sp-4)">
          <button type="button" class="btn" id="res-advance">Advance one year &rarr;</button>
          <button type="button" class="btn btn--ghost" id="res-reset">Reset</button>
        </div>
        <p class="sim-readout" id="res-readout"></p>
      </div>
      <svg id="res-svg" viewBox="0 0 260 260" role="img" aria-label="A reservoir tank that fills or drains as the student advances each year, based on the extraction and rainfall sliders, with a Day Zero warning if it runs dry.">
        <rect x="60" y="20" width="140" height="200" fill="none" stroke="currentColor" stroke-width="2"/>
        <rect id="res-water" x="62" y="120" width="136" height="98" fill="var(--accent)" opacity="0.75"/>
        <line x1="60" y1="20" x2="200" y2="20" stroke="var(--negative)" stroke-width="2" stroke-dasharray="4 3"/>
        <text x="205" y="24" font-size="10" fill="var(--negative)">full</text>
        <line x1="60" y1="220" x2="200" y2="220" stroke="var(--ink-3)" stroke-width="1"/>
        <text id="res-pct" x="130" y="170" text-anchor="middle" font-size="20" font-weight="700" fill="currentColor"></text>
        <text id="res-year" x="130" y="245" text-anchor="middle" font-family="var(--font-data)" font-size="12" fill="var(--ink-2)"></text>
      </svg>
    </div>
  `;
  reservoirMount.append(card);

  const exInput = card.querySelector("#res-extraction");
  const rainInput = card.querySelector("#res-rainfall");
  const exVal = card.querySelector("#res-ex-val");
  const rainVal = card.querySelector("#res-rain-val");
  const advanceBtn = card.querySelector("#res-advance");
  const resetBtn = card.querySelector("#res-reset");
  const readout = card.querySelector("#res-readout");
  const waterRect = card.querySelector("#res-water");
  const pctText = card.querySelector("#res-pct");
  const yearText = card.querySelector("#res-year");

  let level = 60, year = 0;
  const TANK_TOP = 20, TANK_H = 200;

  function paint() {
    const h = (level / 100) * TANK_H;
    waterRect.setAttribute("y", TANK_TOP + TANK_H - h);
    waterRect.setAttribute("height", h);
    waterRect.setAttribute("fill", level <= 0 ? "var(--negative)" : "var(--accent)");
    pctText.textContent = Math.round(level) + "%";
    yearText.textContent = "Year " + year;
    if (level <= 0) {
      readout.innerHTML = "<strong style=\"color:var(--negative)\">DAY ZERO — the reservoir is empty.</strong> Lower extraction or wait for more rainfall, then reset to try a better strategy.";
      readout.classList.add("is-alert");
      advanceBtn.disabled = true;
    } else {
      readout.classList.remove("is-alert");
      advanceBtn.disabled = false;
      const net = (parseFloat(rainInput.value) - 100) / 100 * 12 - (parseFloat(exInput.value) / 100) * 18;
      readout.innerHTML = `At these settings, next year's net change would be roughly
        <strong>${net >= 0 ? "+" : ""}${net.toFixed(0)}%</strong>.`;
    }
  }

  exInput.addEventListener("input", () => { exVal.textContent = exInput.value; paint(); });
  rainInput.addEventListener("input", () => { rainVal.textContent = rainInput.value; paint(); });
  advanceBtn.addEventListener("click", () => {
    const rain = parseFloat(rainInput.value), extraction = parseFloat(exInput.value);
    const net = (rain - 100) / 100 * 12 - (extraction / 100) * 18;
    level = Math.max(0, Math.min(100, level + net));
    year++;
    paint();
  });
  resetBtn.addEventListener("click", () => { level = 60; year = 0; paint(); });
  paint();
}

/* ==========================================================================
   One lightweight interactive per remaining chapter. Deliberately simple —
   tap-to-reveal, classify-by-click, a slider, a set of toggles — rather than
   a bespoke mini-app each, so every topic gets something to manipulate
   without the build cost of ten more "Try It" models.
   ========================================================================== */

function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
}

/* Tap-to-reveal grid: click a chip, see a verdict + explanation. Used where
   the point is "notice the difference", not "get it right or wrong". */
function buildRevealGrid(mount, items) {
  const grid = el("div", "reveal-grid");
  items.forEach(item => {
    const chip = el("button", "reveal-chip");
    chip.type = "button";
    chip.innerHTML = `<span class="reveal-chip__label">${item.label}</span>
      <div class="reveal-chip__verdict">
        <span class="reveal-chip__tag reveal-chip__tag--${item.good ? "good" : "bad"}">${item.tag}</span>
        <p class="reveal-chip__explain">${item.explain}</p>
      </div>`;
    chip.addEventListener("click", () => chip.classList.add("is-open"));
    grid.append(chip);
  });
  mount.append(grid);
}

/* Classify-by-click: one label, a row of category buttons, instant right/
   wrong feedback plus an explanation. Used for sorting real cases. */
function buildClassifyGrid(mount, categories, items) {
  const grid = el("div", "classify-grid");
  items.forEach(item => {
    const row = el("div", "classify-item");
    row.append(el("p", "classify-item__label", item.label));
    const btns = el("div", "classify-item__btns");
    categories.forEach(cat => {
      const b = el("button", null, cat);
      b.type = "button";
      b.addEventListener("click", () => {
        if (row.classList.contains("is-answered")) return;
        row.classList.add("is-answered");
        const correct = cat === item.answer;
        b.classList.add("chosen", correct ? "correct" : "wrong");
        if (!correct) {
          [...btns.children].forEach(other => { if (other.textContent === item.answer) other.classList.add("chosen", "correct"); });
        }
        [...btns.children].forEach(other => other.disabled = true);
        explainEl.textContent = item.explain;
      });
      btns.append(b);
    });
    row.append(btns);
    const explainEl = el("p", "classify-item__explain");
    row.append(explainEl);
    grid.append(row);
  });
  mount.append(grid);
}

/* --- Chapter 1: Vague or Specific? --------------------------------------- */
(function () {
  const mount = document.getElementById("sim-ch1");
  if (!mount) return;
  mount.innerHTML = "";
  const card = el("div", "sim-card");
  card.innerHTML = `<p class="sim-card__title">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/></svg>
    Try It &mdash; Vague or Specific?</p>
    <p style="color:var(--ink-2);font-size:var(--step--1)">Tap each example. Which ones would earn full marks in an exam answer?</p>`;
  mount.append(card);
  buildRevealGrid(card, [
    { label: "“Energy”", good: false, tag: "Too vague", explain: "Names no exact action or impact — an examiner can't tell what you mean." },
    { label: "“Charging a phone overnight”", good: true, tag: "Specific", explain: "A named action, using a named resource (electricity) — this is exam-ready." },
    { label: "“Pollution”", good: false, tag: "Too vague", explain: "Pollution of what, from what source, affecting what? Needs detail." },
    { label: "“Driving a petrol car to work every day”", good: true, tag: "Specific", explain: "Names the action, the fuel, and the frequency — easy to build an impact chain from this." },
    { label: "“Nature”", good: false, tag: "Too vague", explain: "Not an environmental impact at all — no action, no consequence." },
    { label: "“Buying food in single-use plastic packaging”", good: true, tag: "Specific", explain: "A concrete choice with a traceable waste consequence." },
  ]);
})();

/* --- Chapter 2: Energy Pyramid Calculator -------------------------------- */
(function () {
  const mount = document.getElementById("sim-ch2");
  if (!mount) return;
  mount.innerHTML = "";
  const card = el("div", "sim-card");
  card.innerHTML = `
    <p class="sim-card__title">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l9 18H3z"/></svg>
      Try It &mdash; Energy Pyramid Calculator
    </p>
    <label style="display:block;font-size:var(--step--1);font-weight:700">
      Energy available at the producer level: <span class="val" id="ep-val" style="font-family:var(--font-data);color:var(--accent)">200</span> units
      <input type="range" id="ep-slider" min="50" max="500" step="10" value="200" style="width:100%;margin-top:var(--sp-2);accent-color:var(--accent)">
    </label>
    <div class="table-scroll">
      <table class="field" id="ep-table">
        <tr><th>Trophic level</th><th>Energy available</th></tr>
        <tr><td>Producer</td><td id="ep-l0"></td></tr>
        <tr><td>Primary consumer</td><td id="ep-l1"></td></tr>
        <tr><td>Secondary consumer</td><td id="ep-l2"></td></tr>
        <tr><td>Top predator</td><td id="ep-l3"></td></tr>
      </table>
    </div>
    <p class="sim-readout" id="ep-readout"></p>
  `;
  mount.append(card);
  const slider = card.querySelector("#ep-slider");
  const val = card.querySelector("#ep-val");
  const cells = [0, 1, 2, 3].map(i => card.querySelector(`#ep-l${i}`));
  const readout = card.querySelector("#ep-readout");
  function paint() {
    const start = parseFloat(slider.value);
    val.textContent = start;
    let level = start;
    cells.forEach((cell, i) => {
      cell.textContent = (i === 0 ? level : level).toFixed(i === 0 ? 0 : 2) + " units";
      level *= 0.1;
    });
    readout.innerHTML = `A top predator only ever has access to about <strong>${(start * 0.001).toFixed(3)}</strong> units
      of the original ${start} — which is why a food chain rarely supports more than 4 or 5 levels.`;
  }
  slider.addEventListener("input", paint);
  paint();
})();

/* --- Chapter 3: Which level of biodiversity? ----------------------------- */
(function () {
  const mount = document.getElementById("sim-ch3");
  if (!mount) return;
  mount.innerHTML = "";
  const card = el("div", "sim-card");
  card.innerHTML = `<p class="sim-card__title">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>
    Try It &mdash; Which Level Is This?</p>
    <p style="color:var(--ink-2);font-size:var(--step--1)">Tap each example to see which level of biodiversity it demonstrates.</p>`;
  mount.append(card);
  buildRevealGrid(card, [
    { label: "Two koalas whose DNA makes them respond differently to disease", good: true, tag: "Genetic diversity", explain: "Variation inside one species — the koala." },
    { label: "A rainforest with 500 species vs. a wheat field with one", good: true, tag: "Species diversity", explain: "Comparing how many different species live in each place." },
    { label: "A country with deserts, forests, coastlines and grasslands", good: true, tag: "Ecosystem diversity", explain: "The variety of habitats across a whole region." },
    { label: "Bees relaxing on a beach for their summer holiday", good: false, tag: "Not biodiversity", explain: "A fun distractor — biodiversity is about variation and habitats, not bee vacations." },
  ]);
})();

/* --- Chapter 4: Sort by IUCN risk ---------------------------------------- */
(function () {
  const mount = document.getElementById("sim-ch4");
  if (!mount) return;
  mount.innerHTML = "";
  const card = el("div", "sim-card");
  card.innerHTML = `<p class="sim-card__title">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6z"/></svg>
    Try It &mdash; Sort by IUCN Risk</p>`;
  mount.append(card);
  buildClassifyGrid(card, ["Least Concern", "Vulnerable", "Endangered", "Critically Endangered"], [
    { label: "Javan rhino — fewer than 80 individuals left, habitat shrinking fast", answer: "Critically Endangered", explain: "One of the rarest large mammals on Earth — the most urgent category." },
    { label: "Koala — population decreasing, but still tens of thousands remain", answer: "Vulnerable", explain: "At real risk, but not yet at the two most severe levels." },
    { label: "A common garden bird with a large, stable population", answer: "Least Concern", explain: "No significant threat to its survival at present." },
    { label: "A frog species restricted to one shrinking wetland, numbers falling sharply every year", answer: "Endangered", explain: "Serious, worsening risk — one level below Critically Endangered." },
  ]);
})();

/* --- Chapter 6: Pick the event, see the systems respond ------------------ */
(function () {
  const mount = document.getElementById("sim-ch6");
  if (!mount) return;
  mount.innerHTML = "";
  const EVENTS = {
    Tsunami: { systems: ["Geosphere", "Hydrosphere", "Biosphere"], note: "Seafloor movement (geosphere), a huge wall of moving ocean water (hydrosphere), and damage to people, animals and habitats (biosphere). Atmospheric effects are more indirect here." },
    "Volcanic eruption": { systems: ["Geosphere", "Atmosphere", "Biosphere"], note: "Molten rock reshapes land (geosphere), ash and gases fill the sky (atmosphere), and nearby life is directly affected (biosphere)." },
    Wildfire: { systems: ["Atmosphere", "Biosphere", "Geosphere"], note: "Smoke fills the atmosphere, vegetation and animals are directly affected (biosphere), and burned soil changes the geosphere." },
    Flood: { systems: ["Hydrosphere", "Geosphere", "Biosphere"], note: "Excess water (hydrosphere) reshapes land and moves soil (geosphere), and damages crops, homes and wildlife (biosphere)." },
  };
  const card = el("div", "sim-card");
  card.innerHTML = `<p class="sim-card__title">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>
    Try It &mdash; Pick an Event</p>
    <div class="btn-row" id="ev-btns"></div>
    <div class="chip-toggle-row" id="ev-systems">
      ${["Geosphere", "Hydrosphere", "Atmosphere", "Biosphere"].map(s => `<span class="chip-toggle" data-sys="${s}">${s}</span>`).join("")}
    </div>
    <div class="reveal-result" id="ev-note">Pick an event above to see which Earth systems respond most directly.</div>`;
  mount.append(card);
  const btnRow = card.querySelector("#ev-btns");
  const note = card.querySelector("#ev-note");
  const chips = [...card.querySelectorAll('[data-sys]')];
  Object.keys(EVENTS).forEach(name => {
    const b = el("button", null, name);
    b.type = "button";
    b.addEventListener("click", () => {
      [...btnRow.children].forEach(x => x.classList.remove("is-active"));
      b.classList.add("is-active");
      const affected = EVENTS[name].systems;
      chips.forEach(chip => chip.classList.toggle("is-on", affected.includes(chip.dataset.sys)));
      note.innerHTML = `<b>${name}:</b> ${EVENTS[name].note}`;
    });
    btnRow.append(b);
  });
})();

/* --- Chapter 7: Tap the water-cycle stage -------------------------------- */
(function () {
  const mount = document.getElementById("sim-ch7");
  if (!mount) return;
  mount.innerHTML = "";
  const card = el("div", "sim-card");
  card.innerHTML = `<p class="sim-card__title">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3c3 4 6 7.5 6 11a6 6 0 1 1-12 0c0-3.5 3-7 6-11z"/></svg>
    Try It &mdash; Name That Stage</p>
    <p style="color:var(--ink-2);font-size:var(--step--1)">Tap a stage to check your own definition against the real one.</p>`;
  mount.append(card);
  buildRevealGrid(card, [
    { label: "Evaporation", good: true, tag: "Stage 1", explain: "The sun heats water in oceans, lakes and rivers, turning it into invisible water vapour." },
    { label: "Condensation", good: true, tag: "Stage 2", explain: "Water vapour cools high in the atmosphere and forms clouds." },
    { label: "Precipitation", good: true, tag: "Stage 3", explain: "Water falls back to Earth as rain, snow or hail." },
    { label: "Infiltration", good: true, tag: "Stage 4a", explain: "Water soaks into the ground and can be stored in an aquifer." },
    { label: "Runoff", good: true, tag: "Stage 4b", explain: "Water flows over the land into rivers and lakes instead of soaking in." },
  ]);
})();

/* --- Chapter 8: Classify the land use ------------------------------------ */
(function () {
  const mount = document.getElementById("sim-ch8");
  if (!mount) return;
  mount.innerHTML = "";
  const card = el("div", "sim-card");
  card.innerHTML = `<p class="sim-card__title">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="3.4"/><path d="M4 19c1.5-3.5 4.7-5.5 8-5.5s6.5 2 8 5.5"/></svg>
    Try It &mdash; Classify the Land</p>`;
  mount.append(card);
  buildClassifyGrid(card, ["Primary forest", "Monoculture plantation", "Agroforestry", "Arable land"], [
    { label: "Rows of a single pine species, grown for paper", answer: "Monoculture plantation", explain: "One species, planted in rows, grown for one product." },
    { label: "Trees, shrubs and grazing animals managed together on the same land", answer: "Agroforestry", explain: "A mixed system — more biodiversity and healthier soil than a single-species plantation." },
    { label: "Old, established forest with little recent human conversion", answer: "Primary forest", explain: "Remember: this doesn't automatically mean zero human impact, just less visible conversion." },
    { label: "Ploughed fields growing wheat this season, potatoes next", answer: "Arable land", explain: "Land worked for seasonal crops — not livestock (pasture) or trees in rows (plantation)." },
  ]);
})();

/* --- Chapter 10: Footprint mixer ------------------------------------------ */
(function () {
  const mount = document.getElementById("sim-ch10");
  if (!mount) return;
  mount.innerHTML = "";
  const CHOICES = [
    { label: "Flying abroad this year", weight: 30 },
    { label: "Driving a petrol car daily", weight: 22 },
    { label: "Solar panels at home", weight: -18 },
    { label: "Recycling and reusing packaging", weight: -12 },
    { label: "Eating a lot of imported food", weight: 15 },
    { label: "Walking or cycling most journeys", weight: -15 },
  ];
  const card = el("div", "sim-card");
  card.innerHTML = `<p class="sim-card__title">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z"/></svg>
    Try It &mdash; Footprint Mixer</p>
    <p style="color:var(--ink-2);font-size:var(--step--1)">Toggle choices on or off and watch the environmental footprint meter respond.</p>
    <div class="chip-toggle-row" id="fp-chips"></div>
    <div class="meter"><div class="meter__track"><div class="meter__fill" id="fp-fill" style="width:40%"></div></div>
      <p class="meter__label" id="fp-label"></p></div>`;
  mount.append(card);
  const chipRow = card.querySelector("#fp-chips");
  const fill = card.querySelector("#fp-fill");
  const label = card.querySelector("#fp-label");
  const on = new Set();
  CHOICES.forEach(choice => {
    const chip = el("span", "chip-toggle", choice.label);
    chip.addEventListener("click", () => {
      if (on.has(choice.label)) on.delete(choice.label); else on.add(choice.label);
      chip.classList.toggle("is-on");
      paint();
    });
    chipRow.append(chip);
  });
  function paint() {
    let score = 40 + CHOICES.filter(c => on.has(c.label)).reduce((s, c) => s + c.weight, 0);
    score = Math.max(4, Math.min(96, score));
    fill.style.width = score + "%";
    const tier = score < 35 ? "Low impact" : score < 65 ? "Medium impact" : "High impact";
    label.innerHTML = `<b>${tier}</b> — an environmental footprint is more than just carbon: it's every choice added together.`;
  }
  paint();
})();

/* --- Chapter 11: Point or non-point? -------------------------------------- */
(function () {
  const mount = document.getElementById("sim-ch11");
  if (!mount) return;
  mount.innerHTML = "";
  const card = el("div", "sim-card");
  card.innerHTML = `<p class="sim-card__title">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 20V10l3-6h6l3 6v10"/></svg>
    Try It &mdash; Point or Non-Point?</p>`;
  mount.append(card);
  buildClassifyGrid(card, ["Point source", "Non-point source"], [
    { label: "An offshore drilling platform blowout", answer: "Point source", explain: "One identifiable location — the rig." },
    { label: "Fertiliser washing off hundreds of farms across a whole valley", answer: "Non-point source", explain: "Many spread-out sources, no single origin to target." },
    { label: "A single factory pipe discharging into a river", answer: "Point source", explain: "One traceable pipe, one traceable owner." },
    { label: "Stormwater picking up oil and litter from an entire city's streets", answer: "Non-point source", explain: "Comes from everywhere at once — needs city-wide action, not one fix." },
  ]);
})();

/* --- Chapter 12: Fire a ray at the ozone layer ---------------------------- */
(function () {
  const mount = document.getElementById("sim-ch12");
  if (!mount) return;
  mount.innerHTML = "";
  const card = el("div", "sim-card");
  card.innerHTML = `<p class="sim-card__title">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15a4 4 0 0 1 1.2-7.9A5.5 5.5 0 0 1 15.8 6 4.5 4.5 0 0 1 19 15H4z"/></svg>
    Try It &mdash; Fire a Ray</p>
    <div class="btn-row">
      <button type="button" id="ray-uv">Fire a UV ray</button>
      <button type="button" id="ray-heat">Fire a heat ray</button>
    </div>
    <div class="reveal-result" id="ray-result">Choose a ray to see whether the ozone layer stops it.</div>`;
  mount.append(card);
  const result = card.querySelector("#ray-result");
  card.querySelector("#ray-uv").addEventListener("click", () => {
    result.innerHTML = "<b>ABSORBED.</b> The ozone layer catches ultraviolet light before it reaches the ground — this is its entire job.";
  });
  card.querySelector("#ray-heat").addEventListener("click", () => {
    result.innerHTML = "<b>PASSES STRAIGHT THROUGH.</b> Heat arrives as infrared radiation, which the ozone layer does not filter at all — this is why ozone depletion and global warming are different problems.";
  });
})();

/* ==========================================================================
   INTERACTIVE LABS — four live canvas simulators. Plain 2D canvas, no
   Three.js needed for this content; ported from the design brief Diego
   shared, kept vendored (no CDN) and bilingual via data-lang siblings for
   any on-page label, with only the canvas rendering itself in English
   text (short, plain data labels — same treatment as an axis label on the
   existing SVG diagrams elsewhere in this guide).
   ========================================================================== */

/* --- Lab 1: Trophic Pyramid ------------------------------------------------ */
(function () {
  const canvas = document.getElementById("trophicCanvas");
  const input = document.getElementById("producerInput");
  if (!canvas || !input) return;
  const ctx = canvas.getContext("2d");

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width; canvas.height = rect.height;
  }

  function render() {
    const p1 = parseInt(input.value, 10);
    const p2 = Math.round(p1 * 0.1), p3 = Math.round(p2 * 0.1), p4 = Math.round(p3 * 0.1);
    document.getElementById("producerVal").textContent = p1.toLocaleString() + " kJ";
    const esVal = document.getElementById("producerValEs"); if (esVal) esVal.textContent = p1.toLocaleString() + " kJ";
    document.getElementById("trophic2").textContent = p2.toLocaleString() + " kJ";
    document.getElementById("trophic3").textContent = p3.toLocaleString() + " kJ";
    document.getElementById("trophic4").textContent = p4.toLocaleString() + " kJ";

    resize();
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const maxW = w * 0.82;
    const hBlock = (h - 20) / 4;
    const widths = [maxW, maxW * 0.55, maxW * 0.3, maxW * 0.15];
    const colors = ["#16a34a", "#0d9488", "#0284c7", "#f43f5e"];
    const labels = [
      "Producers - " + p1.toLocaleString() + " kJ",
      "Herbivores - " + p2.toLocaleString() + " kJ",
      "Carnivores - " + p3.toLocaleString() + " kJ",
      "Apex - " + p4.toLocaleString() + " kJ",
    ];
    for (let i = 0; i < 4; i++) {
      const bw = widths[i];
      const x = (w - bw) / 2;
      const y = h - 10 - (i + 1) * hBlock;
      ctx.fillStyle = colors[i];
      const r = 6;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + bw, y, x + bw, y + hBlock - 4, r);
      ctx.arcTo(x + bw, y + hBlock - 4, x, y + hBlock - 4, r);
      ctx.arcTo(x, y + hBlock - 4, x, y, r);
      ctx.arcTo(x, y, x + bw, y, r);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(labels[i], w / 2, y + hBlock / 2 + 2);
    }
  }

  input.addEventListener("input", render);
  window.addEventListener("resize", render);
  render();
})();

/* --- Lab 2: Population Growth Inspector ------------------------------------ */
(function () {
  const canvas = document.getElementById("popCanvas");
  const rInput = document.getElementById("rInput");
  const kInput = document.getElementById("kInput");
  if (!canvas || !rInput || !kInput) return;
  const ctx = canvas.getContext("2d");
  let wildfireActive = false;

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width; canvas.height = rect.height;
  }

  function render() {
    const r = parseFloat(rInput.value);
    const K = parseInt(kInput.value, 10);
    document.getElementById("rVal").textContent = r.toFixed(2);
    document.getElementById("kVal").textContent = String(K);
    const rEs = document.getElementById("rValEs"); if (rEs) rEs.textContent = r.toFixed(2);
    const kEs = document.getElementById("kValEs"); if (kEs) kEs.textContent = String(K);

    resize();
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const kY = h - 20 - (K / 900) * (h - 40);
    ctx.strokeStyle = "#f59e0b";
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(30, kY); ctx.lineTo(w - 10, kY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#f59e0b";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("K = " + K, w - 12, kY - 6);

    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    let N = 20;
    const steps = 60;
    for (let t = 0; t <= steps; t++) {
      const x = 30 + (t / steps) * (w - 42);
      if (wildfireActive && t === 30) N = Math.max(10, N * 0.2);
      const dN = r * N * (1 - N / K);
      N += dN;
      const y = h - 20 - (N / 900) * (h - 40);
      if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    if (wildfireActive) {
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Wildfire strike (density-independent loss)", w / 2, 18);
    }
  }

  function triggerWildfire() {
    wildfireActive = true;
    render();
    setTimeout(function () { wildfireActive = false; }, 2500);
  }
  function resetLab() {
    wildfireActive = false;
    rInput.value = "0.15"; kInput.value = "500";
    render();
  }

  rInput.addEventListener("input", render);
  kInput.addEventListener("input", render);
  window.addEventListener("resize", render);
  ["wildfireBtn", "wildfireBtnEs"].forEach(function (id) {
    const b = document.getElementById(id); if (b) b.addEventListener("click", triggerWildfire);
  });
  ["popResetBtn", "popResetBtnEs"].forEach(function (id) {
    const b = document.getElementById(id); if (b) b.addEventListener("click", resetLab);
  });
  render();
})();

/* --- Lab 3: Reservoir "Day Zero" ------------------------------------------- */
(function () {
  const canvas = document.getElementById("reservoirCanvas");
  const inflowInput = document.getElementById("inflowInput");
  const agriInput = document.getElementById("agriInput");
  if (!canvas || !inflowInput || !agriInput) return;
  const ctx = canvas.getContext("2d");
  const dripBoxes = ["dripToggle", "dripToggleEs"].map(function (id) { return document.getElementById(id); }).filter(Boolean);

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width; canvas.height = rect.height;
  }

  function render() {
    const inflow = parseInt(inflowInput.value, 10);
    let agri = parseInt(agriInput.value, 10);
    const drip = dripBoxes.some(function (b) { return b.checked; });
    if (drip) agri = Math.round(agri * 0.6);

    const net = inflow - agri;
    let days = 999;
    if (net < 0) days = Math.max(1, Math.round(1000 / Math.abs(net)));

    const status = document.getElementById("dayZeroStatus");
    if (days === 999) {
      status.textContent = "Sustainable"; status.className = "lab-status ok";
    } else {
      status.textContent = days + " days left"; status.className = "lab-status bad";
    }

    resize();
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const levelRatio = days === 999 ? 0.8 : Math.min(0.9, Math.max(0.08, days / 100));
    const waterH = (h - 30) * levelRatio;

    ctx.strokeStyle = "#475569"; ctx.lineWidth = 3;
    ctx.strokeRect(30, 14, w - 60, h - 28);
    ctx.fillStyle = "#0d9488";
    ctx.fillRect(32, h - 14 - waterH, w - 64, waterH);

    ctx.fillStyle = "#e2e8f0"; ctx.font = "10px sans-serif"; ctx.textAlign = "left";
    ctx.fillText("Inflow +" + inflow, 36, 30);
    ctx.textAlign = "right";
    ctx.fillText("Demand -" + agri, w - 36, 30);
  }

  [inflowInput, agriInput].forEach(function (i) { i.addEventListener("input", render); });
  dripBoxes.forEach(function (b) {
    b.addEventListener("change", function () {
      dripBoxes.forEach(function (other) { other.checked = b.checked; });
      render();
    });
  });
  window.addEventListener("resize", render);
  render();
})();

/* --- Lab 4: Formula Logic Parser ------------------------------------------- */
(function () {
  const select = document.getElementById("calcType");
  const inputs = document.getElementById("dynamicInputs");
  const result = document.getElementById("logicResult");
  const resultEs = document.getElementById("logicResultEs");
  if (!select || !inputs || !result) return;

  function setResult(html) {
    result.innerHTML = html;
    if (resultEs) resultEs.innerHTML = html;
  }

  function build() {
    const type = select.value;
    if (type === "ocean") {
      inputs.innerHTML = '<label style="margin-top:.8em"><span>Atmospheric CO2 (ppm)</span></label>' +
        '<input type="number" id="co2Input" value="420">';
      inputs.querySelector("#co2Input").addEventListener("input", runOcean);
      runOcean();
    } else if (type === "trophic") {
      inputs.innerHTML = '<label style="margin-top:.8em"><span>Producer energy (kJ)</span></label>' +
        '<input type="number" id="energyIn" value="80000">';
      inputs.querySelector("#energyIn").addEventListener("input", runTrophic);
      runTrophic();
    } else {
      inputs.innerHTML = '<div class="lab-inline-inputs">' +
        '<input type="number" id="pB" placeholder="Births" value="120">' +
        '<input type="number" id="pD" placeholder="Deaths" value="80">' +
        '<input type="number" id="pI" placeholder="Immigration" value="15">' +
        '<input type="number" id="pE" placeholder="Emigration" value="10">' +
        '</div>';
      ["pB", "pD", "pI", "pE"].forEach(function (id) { inputs.querySelector("#" + id).addEventListener("input", runPop); });
      runPop();
    }
  }

  function runOcean() {
    const co2 = parseFloat(document.getElementById("co2Input").value) || 420;
    const pH = (8.2 - (co2 - 280) * 0.0008).toFixed(2);
    setResult("<b>CO2 + H2O &harr; H2CO3 &harr; H+ + HCO3-</b><br>" +
      "Estimated ocean pH: <b>" + pH + "</b> (pre-industrial baseline: 8.2)<br>" +
      "Extra H+ ions bind available carbonate, making it harder for corals to build CaCO3 skeletons.");
  }
  function runTrophic() {
    const e = parseFloat(document.getElementById("energyIn").value) || 0;
    setResult("<b>10% trophic transfer:</b><br>" +
      "Producers: " + e.toLocaleString() + " kJ<br>" +
      "Herbivores: " + (e * 0.1).toLocaleString() + " kJ<br>" +
      "Carnivores: " + (e * 0.01).toLocaleString() + " kJ<br>" +
      "Apex predators: " + (e * 0.001).toLocaleString() + " kJ<br>" +
      "About 90% of energy is lost as heat at every step.");
  }
  function runPop() {
    const B = parseFloat(document.getElementById("pB").value) || 0;
    const D = parseFloat(document.getElementById("pD").value) || 0;
    const I = parseFloat(document.getElementById("pI").value) || 0;
    const E = parseFloat(document.getElementById("pE").value) || 0;
    const dN = (B + I) - (D + E);
    setResult("<b>&Delta;N = (Births + Immigration) - (Deaths + Emigration)</b><br>" +
      "&Delta;N = (" + B + " + " + I + ") - (" + D + " + " + E + ") = <b>" + (dN >= 0 ? "+" : "") + dN + "</b><br>" +
      "Population is " + (dN >= 0 ? "expanding" : "declining") + ".");
  }

  select.addEventListener("change", build);
  build();
})();

/* ==========================================================================
   QUIZ ARENA — a 100-item pool, 20 pulled at random per session, instant
   marking with a full explanation and an end-of-round summary screen.
   Reuses the same {q, opts, correct, explain} shape as the chapter BANK
   above so the two pools could later be merged, but is kept separate here
   since this section deliberately mixes questions across every chapter.
   ========================================================================== */
const QUIZ_ARENA_EXTRA = [
  { q: "Which gas makes up roughly 78% of the atmosphere?", opts: ["Oxygen", "Nitrogen", "Carbon dioxide", "Argon"], correct: 1, explain: "Nitrogen is by far the most abundant atmospheric gas; oxygen is a distant second at ~21%." },
  { q: "What is the biosphere's core function among Earth's four systems?", opts: ["Storing rock and minerals", "Converting solar energy into biomass", "Regulating ocean currents", "Filtering ultraviolet light"], correct: 1, explain: "Living things (the biosphere) capture solar energy and turn it into biological tissue." },
  { q: "A country with deserts, forests, coastlines and grasslands has high...", opts: ["Genetic diversity", "Species diversity only", "Ecosystem diversity", "No particular diversity"], correct: 2, explain: "A wide range of contrasting habitats is exactly what ecosystem diversity measures." },
  { q: "Which is a provisioning ecosystem service?", opts: ["Pollination", "Flood control", "Timber and fresh water", "Cultural inspiration"], correct: 2, explain: "Provisioning services are material goods taken directly from nature." },
  { q: "What does it mean for a limiting factor to be density-dependent?", opts: ["It never changes", "Its effect strengthens as the population gets more crowded", "It only affects predators", "It is caused by weather"], correct: 1, explain: "Food competition, disease and waste buildup all intensify as density rises." },
  { q: "In the water cycle, what is infiltration?", opts: ["Water evaporating into the air", "Water falling as rain", "Water soaking down into the ground", "Water flowing over the surface"], correct: 2, explain: "Infiltration carries water down into aquifers; runoff carries it over the surface instead." },
  { q: "Which forest type is grown in rows, often as one species, for timber or paper?", opts: ["Primary forest", "Naturally regenerating forest", "Plantation forest", "Agroforestry"], correct: 2, explain: "Plantation forests are managed, single-species, row-planted timber operations." },
  { q: "Why is drip irrigation more water-efficient than flood irrigation?", opts: ["It uses more water pressure", "It waters crops slowly and directly at the roots", "It only works at night", "It requires no infrastructure"], correct: 1, explain: "Targeted, slow delivery at the roots cuts evaporation and runoff losses dramatically." },
  { q: "What does an Alliance for Zero Extinction (AZE) site protect?", opts: ["Any protected forest", "The last known wild population of a highly threatened species", "A country's entire coastline", "A generic nature reserve"], correct: 1, explain: "AZE sites are the sharpest, most urgent tier of conservation-priority mapping." },
  { q: "Ocean acidification makes it harder for corals to do what?", opts: ["Photosynthesise", "Build calcium-carbonate skeletons", "Reproduce sexually", "Absorb sunlight"], correct: 1, explain: "Extra hydrogen ions bind carbonate that corals need to build their structures." },
  { q: "What triggers a population's shift from exponential to logistic growth?", opts: ["A change in the weather only", "Increasing environmental resistance as density rises", "A drop in genetic diversity", "Immigration stopping completely"], correct: 1, explain: "As resources become limited, density-dependent resistance slows growth toward K." },
  { q: "Which is an example of a non-point source of pollution?", opts: ["A single factory discharge pipe", "An offshore drilling platform blowout", "Fertiliser runoff from many farms across a region", "A ruptured underground storage tank"], correct: 2, explain: "Non-point pollution comes from many diffuse, hard-to-trace sources at once." },
  { q: "What is the main difference between renewable and non-renewable energy?", opts: ["Renewable energy is always cheaper", "Renewable energy replenishes on a human timescale; non-renewable does not", "Non-renewable energy causes no pollution", "There is no real difference"], correct: 1, explain: "The test is replenishment speed relative to how fast we use it, not just being natural." },
  { q: "What keeps Earth's natural greenhouse effect essential rather than harmful?", opts: ["It blocks all sunlight", "It keeps Earth warm enough to support life", "It removes oxygen from the air", "It has no actual effect"], correct: 1, explain: "Without any greenhouse effect Earth would be far too cold for life as we know it - the problem is the enhanced, human-added version." },
  { q: "What does a carbon footprint measure?", opts: ["Total land and water used for all resources and waste", "Mainly greenhouse gas emissions from an activity", "A person's total physical footprint size", "Ocean plastic pollution only"], correct: 1, explain: "An environmental/ecological footprint is the broader measure; a carbon footprint focuses on emissions." },
  { q: "What does the ozone layer specifically filter out of sunlight?", opts: ["Infrared heat", "Visible light", "Ultraviolet radiation", "Radio waves"], correct: 2, explain: "The ozone layer's entire job is absorbing most incoming UV light, especially UV-B." },
  { q: "What international agreement addresses ozone-depleting chemicals?", opts: ["Paris Agreement", "Kyoto Protocol", "Montreal Protocol", "Geneva Convention"], correct: 2, explain: "The 1987 Montreal Protocol phased out CFCs and let the ozone layer begin recovering." },
  { q: "Why are threatened species categories on the IUCN Red List ranked by severity?", opts: ["To rank zoos by quality", "To combine risk level with population trend for a fuller picture of urgency", "To decide ticket prices for safaris", "They are not actually ranked"], correct: 1, explain: "Category plus population trend together show how urgent conservation action really is." },
  { q: "What is a buffer zone in conservation?", opts: ["A fenced tourist area", "A protective strip of land between a human land use and a sensitive ecosystem", "A backup water reservoir", "An area with no legal protection"], correct: 1, explain: "Buffer zones reduce edge pressures - noise, runoff, invasive species - on protected habitats." },
  { q: "Why does agriculture use more water than any other human sector?", opts: ["Crops need constant electricity", "Irrigating crops and livestock requires enormous, continuous volumes of water", "Farms are mostly located near oceans", "Agriculture uses no water at all"], correct: 1, explain: "Agriculture accounts for roughly 70% of global freshwater withdrawals worldwide." }
];

function buildQuizArenaPool() {
  const pool = [];
  Object.values(BANK).forEach(function (list) { list.forEach(function (item) { pool.push(item); }); });
  QUIZ_ARENA_EXTRA.forEach(function (item) { pool.push(item); });
  return pool;
}

(function () {
  const mount = document.getElementById("quiz-arena-mount");
  if (!mount) return;
  const POOL = buildQuizArenaPool();
  const ROUND_SIZE = 20;
  let round = [];
  let answered = {};

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function startRound() {
    round = shuffle(POOL).slice(0, Math.min(ROUND_SIZE, POOL.length));
    answered = {};
    render();
  }

  function score() {
    return Object.keys(answered).filter(function (k) { return answered[k] === round[k].correct; }).length;
  }

  function render() {
    mount.innerHTML = "";
    const wrap = el("div", "quiz-arena");
    wrap.innerHTML =
      '<div class="quiz-arena__head">' +
      '<div><p class="lab-card__tag" style="margin-bottom:.5em;display:inline-block">' + POOL.length + '-QUESTION POOL</p>' +
      '<h3 style="margin:0;font-size:var(--step-1)">Round in progress</h3></div>' +
      '<div style="display:flex;align-items:center;gap:var(--sp-4)">' +
      '<div class="quiz-arena__score"><span class="l">Score</span><span class="v" id="qa-score">0 / ' + round.length + '</span></div>' +
      '<button class="lab-btn" id="qa-new" type="button" style="background:linear-gradient(100deg,#34D2C7,#6C8CFF);color:#06121F">New quiz session</button>' +
      '</div></div>' +
      '<div id="qa-cards"></div>' +
      '<div id="qa-summary" class="quiz-summary" hidden>' +
      '<div class="quiz-summary__icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a3 3 0 0 0 3 5M17 6h3a3 3 0 0 1-3 5"/></svg></div>' +
      '<h3 id="qa-final-score">You scored 0 / ' + round.length + '</h3>' +
      '<p id="qa-feedback"></p>' +
      '<button class="lab-btn" id="qa-again" type="button" style="background:linear-gradient(100deg,#34D2C7,#6C8CFF);color:#06121F;margin-top:var(--sp-4)">Try another 20 questions</button>' +
      '</div>';
    mount.append(wrap);
    wrap.querySelector("#qa-new").addEventListener("click", startRound);
    wrap.querySelector("#qa-again").addEventListener("click", startRound);
    renderCards();
  }

  function renderCards() {
    const container = document.getElementById("qa-cards");
    const summary = document.getElementById("qa-summary");
    if (!container) return;
    container.hidden = false;
    if (summary) summary.hidden = true;
    container.innerHTML = "";
    round.forEach(function (item, idx) {
      const card = el("div", "qa-card");
      const optsHtml = item.opts.map(function (opt, oi) {
        return '<button type="button" class="qa-opt" data-i="' + oi + '"><span class="qa-opt__letter">' +
          String.fromCharCode(65 + oi) + '</span><span>' + opt + '</span></button>';
      }).join("");
      card.innerHTML =
        '<div class="qa-card__head"><span>Question ' + (idx + 1) + ' of ' + round.length + '</span>' +
        '<span class="qa-card__badge" id="qa-badge-' + idx + '">Unanswered</span></div>' +
        '<h4>' + item.q + '</h4>' +
        '<div>' + optsHtml + '</div>' +
        '<div class="qa-explain" id="qa-explain-' + idx + '" hidden></div>';
      container.append(card);
      card.querySelectorAll(".qa-opt").forEach(function (btn) {
        btn.addEventListener("click", function () { selectAnswer(idx, parseInt(btn.dataset.i, 10)); });
      });
    });
  }

  function selectAnswer(idx, optIdx) {
    if (answered[idx] !== undefined) return;
    answered[idx] = optIdx;
    const item = round[idx];
    const isCorrect = optIdx === item.correct;
    const card = document.querySelectorAll(".qa-card")[idx];
    card.querySelectorAll(".qa-opt").forEach(function (btn, i) {
      btn.disabled = true;
      if (i === item.correct) btn.classList.add("correct");
      else if (i === optIdx) btn.classList.add("wrong");
    });
    const badge = document.getElementById("qa-badge-" + idx);
    badge.textContent = isCorrect ? "Correct" : "Incorrect";
    badge.className = "qa-card__badge " + (isCorrect ? "correct" : "wrong");
    const explain = document.getElementById("qa-explain-" + idx);
    explain.hidden = false;
    explain.className = "qa-explain " + (isCorrect ? "correct" : "wrong");
    explain.innerHTML = "<b>" + (isCorrect ? "Correct!" : "Explanation:") + "</b> " + item.explain;

    document.getElementById("qa-score").textContent = score() + " / " + round.length;

    if (Object.keys(answered).length === round.length) {
      setTimeout(function () {
        const container = document.getElementById("qa-cards");
        const summary = document.getElementById("qa-summary");
        const s = score();
        const pct = Math.round((s / round.length) * 100);
        document.getElementById("qa-final-score").textContent = "You scored " + s + " / " + round.length + " (" + pct + "%)";
        document.getElementById("qa-feedback").textContent =
          pct >= 90 ? "Mastery achieved - outstanding environmental literacy." :
          pct >= 70 ? "Solid grasp of the course - a little more revision on the misses." :
          "Good start - go back over the chapters for the questions you missed.";
        if (container) container.hidden = true;
        if (summary) summary.hidden = false;
      }, 900);
    }
  }

  startRound();
})();

/* ==========================================================================
   COMPACT CARD PREVIEW — collapses everything in a chapter card after its
   head+dek into a short, fading preview with a "Read full chapter" toggle,
   so the card grid reads at the density of the reference design without
   deleting or rewriting any of the deeper chapter content underneath.
   ========================================================================== */
(function () {
  document.querySelectorAll(".chapter--card").forEach(function (card) {
    const head = card.querySelector(".chapter__head");
    const dek = card.querySelector(".chapter__dek");
    if (!head) return;
    const afterEl = dek || head;
    const rest = [];
    let node = afterEl.nextElementSibling;
    while (node) {
      const next = node.nextElementSibling;
      if (node.classList.contains("back-to-top")) { node = next; continue; }
      rest.push(node);
      node = next;
    }
    if (!rest.length) return;
    const body = document.createElement("div");
    body.className = "chapter--card__body";
    rest.forEach(function (n) { body.append(n); });
    afterEl.after(body);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chapter-expand-btn";
    btn.innerHTML = '<span data-lang="en">Read full chapter, practice &amp; try it</span>' +
      '<span data-lang="es" hidden>Leer el capítulo completo, practicar y probarlo</span>' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>';
    body.after(btn);
    btn.addEventListener("click", function () {
      const open = body.classList.toggle("is-expanded");
      btn.classList.toggle("is-open", open);
    });
  });
})();
