/* ==========================================================================
   DISCOVERY LAB — NAVIGATION RENDERER
   Every navigation page (home, subject, module) is a thin shell. This reads
   data/subjects.json and renders the right level, so adding a simulation means
   editing that one JSON file — the navigation UI is never hand-edited.

   Usage — put one element on the page and declare what it should render:
     <div id="nav-root" data-level="home"     data-root="./"></div>
     <div id="nav-root" data-level="subject"  data-root="../../../"
          data-pathway="us-pathway" data-stage="secondary"
          data-subject="environmental-science"></div>
     <div id="nav-root" data-level="module"   data-root="../../../../"
          data-pathway="us-pathway" data-stage="secondary"
          data-subject="environmental-science" data-module="module-1-introduction"></div>
   ========================================================================== */

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};

const statusBadge = (status) => {
  const live = status === "live";
  return el("span", `badge badge--${live ? "live" : "soon"}`, live ? "Live" : "Coming soon");
};

/* A subject is only genuinely live if something inside it is. Prevents a tile
   promising content that does not exist yet. */
const liveSims = (subject) =>
  (subject.modules || []).flatMap(m => m.simulations || []).filter(s => s.status === "live");

const countLabel = (n, singular) =>
  `${n} ${singular}${n === 1 ? "" : "s"}`;

/* `status` drives the badge; `href` drives whether the tile is walkable. They
   are deliberately separate — a module with nothing finished in it should still
   be browsable so a student can see what is coming. */
function tile({ href, title, blurb, meta, status, theme }) {
  const node = el(href ? "a" : "div", "tile");
  if (href) node.href = href; else node.setAttribute("aria-disabled", "true");
  if (theme) node.setAttribute("data-theme", theme);
  node.append(statusBadge(status));
  node.append(el("span", "tile__title", title));
  if (blurb) node.append(el("span", "tile__blurb", blurb));
  if (meta) node.append(el("span", "tile__meta", meta));
  return node;
}

function sectionHead(eyebrow, heading, blurb) {
  const head = el("div", "nav-sec__head");
  head.append(el("p", "eyebrow", eyebrow));
  head.append(el("h2", null, heading));
  if (blurb) head.append(el("p", "nav-sec__blurb", blurb));
  return head;
}

/* --- HOME: pathways, their stages, and the subjects inside each ---------- */
function renderHome(data, root, mount) {
  data.pathways.forEach(pathway => {
    const sec = el("section", "nav-sec");
    sec.append(sectionHead(pathway.name, pathway.name, pathway.blurb));

    pathway.stages.forEach(stage => {
      const group = el("div", "nav-group");
      const label = el("p", "nav-group__label", stage.name);
      group.append(label);

      const grid = el("div", "grid-tiles");
      stage.subjects.forEach(subject => {
        const live = liveSims(subject);
        const walkable = (subject.modules || []).length > 0;
        grid.append(tile({
          href: walkable ? `${root}${pathway.slug}/${stage.id}/${subject.id}/` : null,
          title: subject.name,
          blurb: subject.blurb,
          meta: live.length ? countLabel(live.length, "activity") : "In preparation",
          status: live.length ? "live" : "coming-soon",
          theme: subject.theme
        }));
      });
      group.append(grid);
      sec.append(group);
    });
    mount.append(sec);
  });
}

/* --- SUBJECT: module tiles ---------------------------------------------- */
function renderSubject(data, root, mount, ds) {
  const ctx = locate(data, ds);
  if (!ctx) return fail(mount, "That subject is not in subjects.json.");
  const { pathway, stage, subject } = ctx;

  document.documentElement.setAttribute("data-theme", subject.theme || "earth");
  document.documentElement.setAttribute("data-age-band", stage.ageBand || "secondary");
  setCrumbs(mount, [
    { label: "Discovery Lab", href: root },
    { label: pathway.name },
    { label: stage.name },
    { label: subject.name }
  ]);
  setTitle(mount, subject.name, `${pathway.name} · ${stage.name}`, subject.blurb);

  const grid = el("div", "grid-tiles");
  const modules = subject.modules || [];
  if (!modules.length) return mount.append(emptyNote("Modules for this subject are still being written."));

  modules.forEach(module => {
    const live = (module.simulations || []).filter(s => s.status === "live");
    grid.append(tile({
      href: (module.simulations || []).length ? `./${module.id}/` : null,
      title: module.name,
      blurb: module.blurb,
      meta: live.length ? countLabel(live.length, "activity") : "In preparation",
      status: live.length ? "live" : "coming-soon"
    }));
  });
  mount.append(grid);
}

/* --- MODULE: simulation tiles ------------------------------------------- */
function renderModule(data, root, mount, ds) {
  const ctx = locate(data, ds);
  if (!ctx) return fail(mount, "That module is not in subjects.json.");
  const { pathway, stage, subject } = ctx;
  const module = (subject.modules || []).find(m => m.id === ds.module);
  if (!module) return fail(mount, "That module is not in subjects.json.");

  document.documentElement.setAttribute("data-theme", subject.theme || "earth");
  document.documentElement.setAttribute("data-age-band", stage.ageBand || "secondary");
  setCrumbs(mount, [
    { label: "Discovery Lab", href: root },
    { label: subject.name, href: "../" },
    { label: module.name }
  ]);
  setTitle(mount, module.name, `${subject.name} · Module ${module.number}`, module.blurb);

  const grid = el("div", "grid-tiles");
  const sims = module.simulations || [];
  if (!sims.length) return mount.append(emptyNote("Activities for this module are still being built."));

  sims.forEach(sim => {
    const bits = [sim.activityId];
    if (sim.questionCount) bits.push(countLabel(sim.questionCount, "question"));
    if (sim.minutes) bits.push(`~${sim.minutes} min`);
    grid.append(tile({
      href: sim.status === "live" ? `./${sim.id}/activity.html` : null,
      title: sim.name,
      blurb: sim.summary,
      meta: bits.join(" · "),
      status: sim.status
    }));
  });
  mount.append(grid);
}

/* --- shared bits --------------------------------------------------------- */
function locate(data, ds) {
  const pathway = data.pathways.find(p => p.slug === ds.pathway || p.id === ds.pathway);
  const stage = pathway && pathway.stages.find(s => s.id === ds.stage);
  const subject = stage && stage.subjects.find(s => s.id === ds.subject);
  return subject ? { pathway, stage, subject } : null;
}

function setCrumbs(mount, items) {
  const nav = el("nav", "crumbs");
  nav.setAttribute("aria-label", "Breadcrumb");
  const ol = el("ol", "crumbs__list");
  items.forEach((item, i) => {
    const li = el("li");
    if (item.href && i < items.length - 1) {
      const a = el("a", null, item.label); a.href = item.href; li.append(a);
    } else {
      li.append(el("span", null, item.label));
      if (i === items.length - 1) li.setAttribute("aria-current", "page");
    }
    ol.append(li);
  });
  nav.append(ol);
  mount.before(nav);
}

function setTitle(mount, heading, eyebrow, blurb) {
  const head = el("header", "nav-title");
  head.append(el("p", "eyebrow", eyebrow));
  head.append(el("h1", null, heading));
  if (blurb) head.append(el("p", "nav-title__blurb", blurb));
  mount.before(head);
  document.title = `${heading} — Discovery Lab`;
}

const emptyNote = (msg) => {
  const p = el("p", "nav-empty", msg);
  return p;
};

function fail(mount, msg) {
  mount.append(emptyNote(msg));
  console.error("[nav]", msg);
}

/* --- boot ---------------------------------------------------------------- */
export async function mountNav() {
  const mount = document.getElementById("nav-root");
  if (!mount) return;
  const ds = mount.dataset;
  const root = ds.root || "./";

  let data;
  try {
    const res = await fetch(`${root}data/subjects.json`, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (err) {
    return fail(mount, "Could not load the site index (data/subjects.json).");
  }

  const level = ds.level || "home";
  if (level === "home") renderHome(data, root, mount);
  else if (level === "subject") renderSubject(data, root, mount, ds);
  else if (level === "module") renderModule(data, root, mount, ds);
  else fail(mount, `Unknown nav level "${level}".`);
}

mountNav();
