/* ==========================================================================
   DISCOVERY LAB — NAVIGATION RENDERER

   data/subjects.json holds one tree. Every navigation page is a thin shell that
   says where it sits; this walks the tree and renders that node's children.
   Node ids are folder names, so the URL always mirrors the JSON exactly.

   Page contract:
     <div id="nav-root" data-path=""                      data-root="./"></div>
     <div id="nav-root" data-path="secondary"             data-root="../"></div>
     <div id="nav-root" data-path="secondary/us-pathway"  data-root="../../"></div>

   Adding a course or activity means editing subjects.json and running
   tools/build-nav.py. Navigation markup is never hand-written.
   ========================================================================== */

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

/* Count finished activities anywhere beneath a node. A tile should never
   promise more than actually exists. */
function liveCount(node) {
  if (node.type === "simulation") return node.status === "live" ? 1 : 0;
  return (node.children || []).reduce((n, c) => n + liveCount(c), 0);
}
function totalCount(node) {
  if (node.type === "simulation") return 1;
  return (node.children || []).reduce((n, c) => n + totalCount(c), 0);
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

function metaFor(node) {
  if (node.type === "simulation") {
    const bits = [node.activityId];
    if (node.questionCount) bits.push(plural(node.questionCount, "question"));
    if (node.minutes) bits.push(`~${node.minutes} min`);
    return bits.filter(Boolean).join(" · ");
  }
  const live = liveCount(node), total = totalCount(node);
  if (live) return plural(live, "activity") + (total > live ? ` · ${total - live} coming` : "");
  if (total) return `${plural(total, "activity")} in preparation`;
  return "In preparation";
}

/* Status drives the badge; href drives whether a tile is walkable. Kept
   separate on purpose — a course with nothing finished should still be
   browsable so a student can see what is coming. */
function tile(node, href) {
  const live = node.type === "simulation" ? node.status === "live" : liveCount(node) > 0;
  const walkable = node.type === "simulation" ? node.status === "live" : (node.children || []).length > 0;

  const n = el(walkable && href ? "a" : "div", "tile");
  if (walkable && href) n.href = href; else n.setAttribute("aria-disabled", "true");
  if (node.theme) n.setAttribute("data-theme", node.theme);

  // A moving thumbnail of the activity's best moment — shown before you enter.
  // node.thumbnail is a filename inside the activity folder; derive its src from
  // the tile's own href (…/<id>/activity.html → …/<id>/<thumbnail>).
  if (node.thumbnail && href) {
    const media = el("span", "tile__media");
    const img = el("img", "tile__thumb");
    img.src = href.replace(/[^/]*$/, node.thumbnail);
    img.alt = "";
    img.loading = "lazy";
    img.setAttribute("aria-hidden", "true");
    media.append(img);
    n.append(media);
  }

  n.append(el("span", `badge badge--${live ? "live" : "soon"}`, live ? "Live" : "Coming soon"));
  n.append(el("span", "tile__title", node.name));
  if (node.subtitle) n.append(el("span", "tile__sub", node.subtitle));
  if (node.blurb) n.append(el("span", "tile__blurb", node.blurb));

  // Keyword snapshot — a few chips of what this branch contains, so a student
  // (or Mr Guevara) sees the shape of a term or module before opening it.
  if (Array.isArray(node.keywords) && node.keywords.length) {
    const tags = el("span", "tile__tags");
    node.keywords.forEach(k => tags.append(el("span", "tag", k)));
    n.append(tags);
  }

  n.append(el("span", "tile__meta", metaFor(node)));
  return n;
}

/* The two front doors: Primary and Secondary. Deliberately not the same
   component as a tile — this is the one choice every student makes first. */
function choice(node, href) {
  const walkable = (node.children || []).length > 0;
  const n = el(walkable ? "a" : "div", "choice");
  if (walkable) n.href = href; else n.setAttribute("aria-disabled", "true");
  if (node.theme) n.setAttribute("data-theme", node.theme);

  const mark = el("span", "choice__mark");
  mark.innerHTML = node.id === "primary"
    ? `<svg viewBox="0 0 48 48" aria-hidden="true">
         <circle cx="24" cy="24" r="15" fill="none" stroke="currentColor" stroke-width="2"/>
         <circle cx="24" cy="24" r="5" fill="currentColor"/>
         <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
           <path d="M24 2v6M24 40v6M2 24h6M40 24h6M9 9l4 4M35 35l4 4M39 9l-4 4M13 35l-4 4"/>
         </g></svg>`
    : `<svg viewBox="0 0 48 48" aria-hidden="true">
         <path d="M6 34V14l18-8 18 8v20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
         <path d="M6 34l18 8 18-8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
         <path d="M24 22v20" fill="none" stroke="currentColor" stroke-width="2" opacity=".4"/>
         <circle cx="24" cy="18" r="4" fill="currentColor"/>
       </svg>`;
  n.append(mark);

  const body = el("span", "choice__body");
  body.append(el("span", "choice__title", node.name));
  if (node.subtitle) body.append(el("span", "choice__sub", node.subtitle));
  if (node.blurb) body.append(el("span", "choice__blurb", node.blurb));
  body.append(el("span", "choice__meta", metaFor(node)));
  n.append(body);

  n.append(el("span", "choice__go", "→"));
  return n;
}

/* --- tree helpers -------------------------------------------------------- */
function walk(tree, ids) {
  const chain = [];
  let level = tree;
  for (const id of ids) {
    const found = (level || []).find(n => n.id === id);
    if (!found) return null;
    chain.push(found);
    level = found.children;
  }
  return chain;
}

function crumbs(chain, root, mount) {
  const nav = el("nav", "crumbs");
  nav.setAttribute("aria-label", "Breadcrumb");
  const ol = el("ol", "crumbs__list");

  const home = el("li");
  const a = el("a", null, "Discovery Lab"); a.href = root; home.append(a); ol.append(home);

  chain.forEach((node, i) => {
    const li = el("li");
    if (i < chain.length - 1) {
      const link = el("a", null, node.name);
      link.href = "../".repeat(chain.length - 1 - i);
      li.append(link);
    } else {
      li.append(el("span", null, node.name));
      li.setAttribute("aria-current", "page");
    }
    ol.append(li);
  });
  nav.append(ol);
  mount.before(nav);
}

function header(node, mount) {
  const head = el("header", "nav-title");
  head.append(el("p", "eyebrow", node.subtitle || node.type));
  head.append(el("h1", null, node.name));
  if (node.blurb) head.append(el("p", "nav-title__blurb", node.blurb));
  mount.before(head);
  document.title = `${node.name} — Discovery Lab`;
}

/* --- render -------------------------------------------------------------- */
export async function mountNav() {
  const mount = document.getElementById("nav-root");
  if (!mount) return;

  const root = mount.dataset.root || "./";
  const ids = (mount.dataset.path || "").split("/").filter(Boolean);

  let data;
  try {
    const res = await fetch(`${root}data/subjects.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch {
    mount.append(el("p", "nav-empty", "Could not load the site index (data/subjects.json)."));
    return;
  }

  /* Home — the two front doors. */
  if (!ids.length) {
    const grid = el("div", "choice-grid");
    data.tree.forEach(node => grid.append(choice(node, `./${node.id}/`)));
    mount.append(grid);
    return;
  }

  const chain = walk(data.tree, ids);
  if (!chain) {
    mount.append(el("p", "nav-empty", "That page is not in subjects.json."));
    return;
  }

  const node = chain[chain.length - 1];
  document.documentElement.setAttribute("data-theme", node.theme || "earth");
  document.documentElement.setAttribute("data-age-band", node.ageBand || "secondary");

  crumbs(chain, root, mount);
  header(node, mount);

  renderFeaturedGame(node, mount);

  const children = node.children || [];
  if (children.length) {
    const grid = el("div", "grid-tiles");
    children.forEach(child => {
      const href = child.type === "simulation" ? `./${child.id}/activity.html` : `./${child.id}/`;
      grid.append(tile(child, href));
    });
    mount.append(grid);
  } else {
    mount.append(el("p", "nav-empty", "Activities for this course are still being built."));
  }

  renderResources(node, mount);
}

/* The course's own learning video game — a gamified companion app Diego built
   (e.g. Kiwi & Cóndor for Spanish). One compact banner that sits above the unit
   tiles: cover art on one side, a short pitch and a play button on the other.
   Distinct from a marked Discovery Lab activity, and honest that it opens in a
   new tab and produces no evidence — so we never dress it up as one. */
function renderFeaturedGame(node, mount) {
  const g = node.featuredGame;
  if (!g || !g.url) return;

  const card = el("a", "feature-game");
  card.href = g.url;
  card.target = "_blank";
  card.rel = "noopener noreferrer";

  const glow = el("span", "feature-game__glow");
  glow.setAttribute("aria-hidden", "true");
  card.append(glow);

  // Cover art. thumbnail is a filename inside the course's own folder, which is
  // this very page, so it resolves relative to the current URL.
  if (g.thumbnail) {
    card.classList.add("feature-game--art");
    const art = el("span", "feature-game__art");
    const img = el("img", "feature-game__thumb");
    img.src = g.thumbnail;
    img.alt = "";
    img.loading = "lazy";
    img.setAttribute("aria-hidden", "true");
    art.append(img);
    card.append(art);
  }

  const body = el("div", "feature-game__body");
  if (g.kicker) {
    const k = el("p", "feature-game__kicker");
    k.append(el("span", "feature-game__badge", "Game"));
    k.append(document.createTextNode(g.kicker));
    body.append(k);
  }
  body.append(el("h2", "feature-game__title", g.title));
  if (g.tagline) body.append(el("p", "feature-game__tagline", g.tagline));
  if (g.blurb) body.append(el("p", "feature-game__blurb", g.blurb));

  const cta = el("span", "feature-game__cta btn");
  cta.append(el("span", null, g.cta || "Play the game"));
  const arrow = el("span", "feature-game__cta-arrow");
  arrow.textContent = "↗";
  arrow.setAttribute("aria-hidden", "true");
  cta.append(arrow);
  body.append(cta);

  body.append(el("p", "feature-game__note",
    "Opens in a new tab · your progress stays in your browser · not marked work."));
  card.append(el("span", "sr-only", "(opens in a new tab on an external website)"));

  card.append(body);
  mount.append(card);
}

/* Third-party simulations Diego recommends. Kept visually distinct from his own
   activities on purpose: these open elsewhere, are not marked, and produce no
   learning evidence. A student must never confuse the two. */
function renderResources(node, mount) {
  const items = node.resources || [];
  if (!items.length) return;

  const sec = el("section", "extras");
  const head = el("div", "extras__head");
  head.append(el("p", "eyebrow", "Also recommended"));
  head.append(el("h2", "extras__title", "More practice, elsewhere"));
  head.append(el("p", "extras__note",
    "Simulations by other people that Mr Guevara rates. They open in a new tab, " +
    "and they do not produce learning evidence — they are for practice and curiosity."));
  sec.append(head);

  const grid = el("div", "extras__grid");
  items.forEach(r => {
    const card = el("a", "extra");
    card.href = r.url;
    card.target = "_blank";
    card.rel = "noopener noreferrer";

    const top = el("div", "extra__top");
    top.append(el("span", "extra__source", r.source || "External"));
    const out = el("span", "extra__out");
    out.textContent = "↗";
    out.setAttribute("aria-hidden", "true");
    top.append(out);
    card.append(top);

    card.append(el("h3", "extra__title", r.title));
    if (r.practises) {
      const p = el("p", "extra__line");
      p.append(el("span", "extra__label", "You do"));
      p.append(document.createTextNode(r.practises));
      card.append(p);
    }
    if (r.teaches) {
      const p = el("p", "extra__line");
      p.append(el("span", "extra__label", "You learn"));
      p.append(document.createTextNode(r.teaches));
      card.append(p);
    }
    card.append(el("span", "sr-only", "(opens in a new tab on an external website)"));
    grid.append(card);
  });
  sec.append(grid);
  mount.append(sec);
}

mountNav();
