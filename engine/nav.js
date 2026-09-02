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

  n.append(el("span", `badge badge--${live ? "live" : "soon"}`, live ? "Live" : "Coming soon"));
  n.append(el("span", "tile__title", node.name));
  if (node.subtitle) n.append(el("span", "tile__sub", node.subtitle));
  if (node.blurb) n.append(el("span", "tile__blurb", node.blurb));
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

  const children = node.children || [];
  if (!children.length) {
    mount.append(el("p", "nav-empty", "Activities for this course are still being built."));
    return;
  }

  const grid = el("div", "grid-tiles");
  children.forEach(child => {
    const href = child.type === "simulation" ? `./${child.id}/activity.html` : `./${child.id}/`;
    grid.append(tile(child, href));
  });
  mount.append(grid);
}

mountNav();
