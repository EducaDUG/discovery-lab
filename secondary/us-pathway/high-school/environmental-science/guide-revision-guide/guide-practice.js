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
