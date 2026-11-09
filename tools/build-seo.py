"""Make Discovery Lab easy for search engines and AI systems to understand.

Run after build-nav.py (idempotent, safe to re-run):
    python tools/build-seo.py

What it writes (all derived from data/subjects.json and each activity's config.json):
  * llms.txt / llms-full.txt   a plain-text map of the whole site for AI assistants
  * a marked SEO block in every live activity.html: description, canonical, Open Graph,
    and schema.org LearningResource JSON-LD (free, accessible, bilingual, age-banded)
  * a marked SEO block in the home page: WebSite + EducationalOrganization JSON-LD
    and a <noscript> course list, because the navigation is drawn by JavaScript
URLs use SITE_URL; tools/sync-to-morehumaned.sh rewrites that host on publish.
"""
import json, pathlib, re, html

REPO = pathlib.Path(__file__).resolve().parent.parent
SITE_URL = "https://educadug.github.io/discovery-lab/"
START, END = "<!-- seo:start -->", "<!-- seo:end -->"
AGE = {"primary": "Primary (ages 7-11)", "lower-secondary": "Lower secondary (ages 11-14)",
       "secondary": "Secondary (ages 14-18)", "advanced": "Advanced secondary / A-Level (ages 16-18)"}
data = json.loads((REPO / "data" / "subjects.json").read_text(encoding="utf-8"))


def esc(s):
    return html.escape(s or "", quote=True)


def walk(nodes, trail, band, out):
    for n in nodes:
        path = trail + [n["id"]]
        b = n.get("ageBand", band)
        if n.get("type") == "simulation":
            out.append((path, n, b))
        elif n.get("type") != "guide":
            walk(n.get("children", []), path, b, out)


sims = []
walk(data["tree"], [], "secondary", sims)
live = [(p, n, b) for p, n, b in sims if n.get("status") == "live"]


def inject(page, block):
    text = page.read_text(encoding="utf-8")
    block = f"{START}\n{block}\n{END}\n"
    if START in text:
        text = re.sub(re.escape(START) + r".*?" + re.escape(END) + r"\n?", lambda m: block, text, flags=re.S)
    else:
        text = text.replace("</head>", block + "</head>", 1)
    page.write_text(text, encoding="utf-8", newline="")


count = 0
full = []
for path, node, band in live:
    folder = REPO.joinpath(*path)
    page = folder / "activity.html"
    if not page.exists():
        continue
    url = SITE_URL + "/".join(path) + "/activity.html"
    cfg = {}
    if (folder / "config.json").exists():
        try:
            cfg = json.loads((folder / "config.json").read_text(encoding="utf-8"))
        except Exception:
            cfg = {}
    focus = cfg.get("learningFocus", {}) if isinstance(cfg.get("learningFocus"), dict) else {}
    title = node.get("name") or cfg.get("title", "Activity")
    desc = (focus.get("summary") or node.get("blurb") or f"{title}, an interactive activity on Discovery Lab.").strip()
    desc = re.sub(r"\s+", " ", desc)
    short = desc if len(desc) <= 300 else desc[:297].rsplit(" ", 1)[0] + "..."
    skills = focus.get("skills", [])
    course = cfg.get("course", "")
    ld = {
        "@context": "https://schema.org", "@type": "LearningResource", "name": title, "description": desc, "url": url,
        "learningResourceType": "interactive simulation", "interactivityType": "active", "isAccessibleForFree": True,
        "inLanguage": ["en", "es"], "educationalLevel": AGE.get(band, band),
        "teaches": skills or title, "educationalUse": "practice", "audience": {"@type": "EducationalAudience", "educationalRole": "student"},
        "accessibilityFeature": ["largePrint", "highContrastDisplay", "readingOrder", "textToSpeech", "displayTransformability"],
        "accessibilityHazard": ["noFlashingHazard", "noMotionSimulationHazard"],
        "accessMode": ["textual", "visual"], "provider": {"@type": "EducationalOrganization", "name": "Discovery Lab", "url": SITE_URL},
        "author": {"@type": "Person", "name": data.get("site", {}).get("owner", "Diego Urrutia Guevara")},
    }
    if course:
        ld["isPartOf"] = {"@type": "Course", "name": course}
    text = page.read_text(encoding="utf-8")
    parts = []
    if '<meta name="description"' not in text.split(START)[0]:
        parts.append(f'<meta name="description" content="{esc(short)}">')
    if 'rel="canonical"' not in text.split(START)[0]:
        parts.append(f'<link rel="canonical" href="{url}">')
    parts += [f'<meta property="og:type" content="website">', f'<meta property="og:site_name" content="Discovery Lab">',
              f'<meta property="og:title" content="{esc(title)} | Discovery Lab">', f'<meta property="og:description" content="{esc(short)}">',
              f'<meta property="og:url" content="{url}">', '<meta name="twitter:card" content="summary">',
              '<script type="application/ld+json">' + json.dumps(ld, ensure_ascii=False).replace("</", "<\\/") + "</script>"]
    inject(page, "\n".join(parts))
    count += 1
    full.append(f"- [{title}]({url}): {short} Level: {AGE.get(band, band)}.")

# ---- llms.txt ----------------------------------------------------------------
site = data.get("site", {})
head = (f"# Discovery Lab\n\n> {site.get('tagline', 'Learn it by doing it.')} Free, hands-on interactive simulations in science, "
        "computing and languages for primary and secondary students, each with a built-in auto-marked check and a "
        "downloadable evidence report. Bilingual (English and Spanish), designed for dyslexia, dyspraxia and other "
        "special educational needs, and built by an independent educator (Diego Urrutia Guevara). Student work never leaves the browser.\n\n"
        f"Part of MoreHuman Ed: https://morehumaned.com/\n\n")
(REPO / "llms.txt").write_text(head + "## Start here\n\n" + f"- [Home]({SITE_URL}): choose Primary or Secondary\n"
                               f"- [About]({SITE_URL}about/): about the author and approach\n"
                               f"- [Full list of activities]({SITE_URL}llms-full.txt): every live activity with a summary\n", encoding="utf-8")
(REPO / "llms-full.txt").write_text(head + f"## All live activities ({len(full)})\n\n" + "\n".join(full) + "\n", encoding="utf-8")

# ---- home page ---------------------------------------------------------------
home = REPO / "index.html"
top = [(n["name"], n["id"]) for n in data["tree"]]
ld_home = [
    {"@context": "https://schema.org", "@type": "WebSite", "name": "Discovery Lab", "url": SITE_URL,
     "inLanguage": ["en", "es"], "description": site.get("tagline", "")},
    {"@context": "https://schema.org", "@type": "EducationalOrganization", "name": "Discovery Lab", "url": SITE_URL,
     "founder": {"@type": "Person", "name": site.get("owner", "")}, "parentOrganization": {"@type": "Organization", "name": "MoreHuman Ed", "url": "https://morehumaned.com/"},
     "description": "Free interactive simulations for primary and secondary students, designed to include learners with special educational needs."},
]
block = ('<link rel="alternate" type="text/plain" href="llms.txt" title="llms.txt">\n'
         + "\n".join('<script type="application/ld+json">' + json.dumps(x, ensure_ascii=False) + "</script>" for x in ld_home))
inject(home, block)
text = home.read_text(encoding="utf-8")
ns = ("<noscript><nav aria-label=\"Courses\"><p>Discovery Lab needs JavaScript to run its simulations. Browse by level: "
      + " ".join(f'<a href="{i}/">{esc(n)}</a>' for n, i in top)
      + f' <a href="llms.txt">Site map for assistants</a></p></nav></noscript>')
if "<noscript><nav" in text:
    text = re.sub(r"<noscript><nav.*?</noscript>", lambda m: ns, text, flags=re.S)
else:
    text = text.replace('<div id="nav-root"', ns + '\n    <div id="nav-root"', 1)
home.write_text(text, encoding="utf-8", newline="")
print(f"SEO block written to {count} activities; llms.txt and llms-full.txt updated.")
