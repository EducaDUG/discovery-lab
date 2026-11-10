"""Fetch real, licence-verified Wikimedia Commons photographs as tile thumbnails.

    python tools/fetch-tile-photos.py            # fetch every tile that has no photo yet
    python tools/fetch-tile-photos.py --redo id  # refetch one tile (path suffix) with the next candidate

Rules (CLAUDE.md section 4, real photos): CC0 / public domain / CC BY / CC BY-SA only, licence read from the
file's own Commons metadata, never AI-generated (files in AI categories are rejected), no close-ups of people
(titles mentioning children/students/etc. are rejected), vendored locally (never hotlinked), credit recorded in
assets/tile-photos/credits.json and shown on the tile. Photos are cropped to 3:2 and kept to a few tens of KB.
"""
import json, pathlib, re, sys, time, io, urllib.parse, urllib.request
from PIL import Image

REPO = pathlib.Path(__file__).resolve().parent.parent
OUT = REPO / "assets" / "tile-photos"
CREDITS = OUT / "credits.json"
API = "https://commons.wikimedia.org/w/api.php"
UA = "DiscoveryLab/1.0 (educational site; contact duguevara@gmail.com)"
OK_LIC = re.compile(r"^(CC0|Public domain|PD|CC BY(?!-N)|CC BY-SA)", re.I)
BAD_LIC = re.compile(r"-NC|-ND|GFDL only", re.I)
BAD_TITLE = re.compile(r"diagram|map|logo|icon|\.svg|chart|illustration|drawing|painting|cartoon|clip ?art|poster|screenshot|"
                       r"child|kid|boy|girl|student|pupil|baby|toddler|portrait|selfie|model release|"
                       r"\bAI\b|midjourney|stable diffusion|dall-?e|generated|render|scheme|infographic|engraving|stamp|flag", re.I)

Q = {  # key (path suffix) -> photo search
    "primary/science": "science laboratory glassware", "primary-1-science": "seedling sprouting soil",
    "primary-1-science/term-1": "magnifying glass leaf nature", "primary-1-science/term-2": "fresh fruit vegetables market",
    "term-2/module-1": "bean seedling germination", "term-2/module-2": "butterfly on flower", "term-2/module-3": "playground slide park",
    "term-2/module-4": "ice cubes melting", "term-2/module-6": "rainbow over field",
    "module-5-nutrition-and-responses": "balanced meal vegetables plate", "sim-nutrition-and-health": "fruit and vegetables variety",
    "sim-pentagon-quest": "bicycle road countryside", "primary-2-science": "telescope night sky",
    "primary-2-science/physics": "Jupiter planet NASA", "module-1-our-solar-system-and-beyond": "Solar System planets NASA",
    "sim-orbit-architects": "Saturn rings Cassini", "sim-space-rock-patrol": "Perseids meteor shower night sky",
    "ext-gravity-and-orbits-phet": "Earth Moon from space", "module-2-sun-seasons-and-tides": "sunrise over horizon",
    "sim-sun-seasons-tides": "low tide beach rocks", "primary-2-science/chemistry": "colorful liquids flasks laboratory",
    "primary-2-science/biology": "leaf dew drops macro", "module-1-plants": "sunflower field", "sim-plant-biology": "greenhouse seedlings trays",
    "primary/maths": "wooden blocks numbers", "primary-1-maths": "abacus beads", "primary-2-maths": "tape measure ruler",
    "module-7-fractions": "pizza slices", "sim-fraction-bakery": "cupcakes bakery display", "sim-fraction-training-camp": "chocolate bar squares",
    "sim-fraction-multiplication-lab": "graph paper grid pencil", "module-8-multiplying-fractions": "farmland fields aerial patchwork",
    "sim-fraction-groups-workshop": "eggs carton", "sim-perimeter-patrol": "running track stadium", "sim-potion-lab-shrink-grow": "glass bottles apothecary",
    "sim-module8-sim4": "measuring cups kitchen", "module-9-dividing-fractions": "sliced cake pieces", "sim-orchard-market-fraction-review": "apples market stall",
    "sim-chocolate-slicer-workshop": "broken chocolate bar", "sim-timber-yard-dividing-unit-fractions": "timber planks lumber stack",
    "primary/computer-skills": "keyboard and mouse desk", "primary-1-computer-skills": "computer mouse keyboard", "primary-2-computer-skills": "computer motherboard",
    "sim-basic-computer-hardware": "desktop computer open case internal", "sim-cpu-memory-storage": "CPU processor chip close up",
    "sim-software-categories": "laptop code on screen", "sim-computer-maintenance-troubleshooting": "computer repair circuit board tools",
    "primary-enrichment": "chess board pieces", "primary-enrichment/english": "open book library shelves", "sim-cause-and-effect": "dominoes falling",
    "sim-mirror-word-mystery": "mirror reflection", "primary-enrichment/maths": "dice", "sim-probability-dice-lab": "dice rolling board game",
    "primary-enrichment/science": "test tubes rack laboratory",
    "us-pathway": "New York skyline", "a-level-pathway": "Big Ben London", "junior-high": "school building brick",
    "usdp-junior-high-life-science-6": "microscope laboratory", "usdp-junior-high-life-science-6/term-1": "forest canopy green leaves",
    "usdp-junior-high-life-science-6/term-2": "DNA double helix model", "life-science-6/term-1/guide-revision-guide": "notebook pen desk",
    "usdp-junior-high-life-science-6/term-1/module-1": "onion cells microscope", "usdp-junior-high-life-science-6/term-1/module-2": "bacteria colonies petri dish",
    "usdp-junior-high-life-science-6/term-1/module-3": "mushrooms forest floor", "module-4": "vertebrate skeleton museum",
    "sim-vertebrate-sorting-lab": "zebra savanna", "module-5-green-plant": "bean seedling roots", "sim-seed-germination-lab": "germinating seeds",
    "sim-plant-highway-lab": "celery stalk food colouring", "module-1-heredity-and-adaptation": "labrador puppies litter",
    "sim-gene-quest": "peppered moth", "module-2-ecosystems": "forest stream ecosystem", "sim-ecosystem-ranger": "gray wolf forest",
    "module-3-digestive-system": "fresh bread vegetables table", "sim-digestive-journey": "eating apple orchard",
    "high-school": "science laboratory glassware", "high-school/biology": "rainforest leaves", "earth-science": "Grand Canyon",
    "module-2-the-universe": "Milky Way night sky", "sim-stellar-forge": "Orion Nebula Hubble", "module-4-atmosphere-and-humidity": "cumulus clouds blue sky",
    "sim-dew-point-chasers": "spider web morning dew", "ext-precipitation-simulator-noaa": "heavy rain storm clouds",
    "environmental-science": "river valley forest aerial", "environmental-science/guide-revision-guide": "field notebook leaf",
    "introduction-to-the-course": "Blue Marble Earth NASA", "sim-marisma-wetland": "salt marsh wetland birds", "sim-spaceship-earth": "Earth from space ISS",
    "module-5-water-resources": "drought dry reservoir", "sim-day-zero-reservoir": "dam reservoir low water",
    "marine-science": "ocean waves", "module-1-overview-of-marine-science": "sea surf wave", "sim-mission-blue-planet": "salt evaporation ponds",
    "sim-ocean-power-grid": "offshore wind farm", "sim-ocean-power-grid-free-play": "tidal turbine wave energy",
    "module-4-ocean-zones-and-habitats": "coral reef fish", "sim-cuvier-deep-dive": "sperm whale diving",
    "renewable-energy": "solar panels field", "module-1-basics-of-energy-and-key-sources": "wind turbines sunset",
    "module-1-basics-of-energy-and-key-sources/guide-revision-guide": "wind turbines field", "sim-solar-power-station": "solar farm sunrise",
    "sim-carbon-climb": "coal power plant smoke", "sim-grid-commander": "electricity pylons dusk",
    "module-2-hydro-bioenergy-and-ocean-energy": "Hoover Dam", "module-2-hydro-bioenergy-and-ocean-energy/guide-revision-guide": "hydroelectric dam spillway",
    "module-3-assessing-technologies-and-future-grid": "power transmission lines", "module-3-assessing-technologies-and-future-grid/guide-revision-guide": "electric substation",
    "module-4-foundations-of-sustainability": "organic farm vegetables rows", "module-4-foundations-of-sustainability/guide-revision-guide": "community garden vegetables",
    "module-5-sustainable-societies-and-biodiversity": "tropical rainforest canopy", "module-5-sustainable-societies-and-biodiversity/guide-revision-guide": "coral reef biodiversity",
    "module-6-smart-growth-and-built-environment": "green rooftop city skyline", "module-6-smart-growth-and-built-environment/guide-revision-guide": "bicycle lane city",
    "spanish-1": "Plaza Mayor Madrid", "spanish-2": "Sagrada Familia Barcelona",
    "lower-secondary": "science laboratory equipment", "lower-secondary/science": "chemistry test tubes", "lower-secondary-stage-1": "microscope lab",
    "lower-secondary-stage-1/physics": "Newton's cradle", "lower-secondary-stage-1/chemistry": "bunsen burner flame", "lower-secondary-stage-1/biology": "human heart anatomy model",
    "lower-secondary-stage-1/biology/exam-revision-materials": "exam desks hall", "lower-secondary-stage-1/biology/exam-revision-materials/exam-1-revision": "stethoscope",
    "module-3-heart-lungs-circulation": "human heart model anatomy", "sim-circulopolis-delivery-run": "city traffic night long exposure",
    "sim-lung-command-oxygen-exchange": "lungs anatomy model", "ext-virtual-cardiology-lab-hhmi": "ECG heart monitor",
    "ext-respiratory-journey-bioman": "mountain hiker breathing", "lower-secondary-stage-2": "chemistry laboratory glassware",
    "lower-secondary-stage-2/exam-revision-materials": "pencil exam paper", "lower-secondary-stage-2/exam-revision-materials/exam-1-revision": "plant cell microscope",
    "exam-2-revision": "light bulb filament", "exam-3-revision": "red cabbage indicator pH colours", "exam-4-revision": "electronic circuit breadboard",
    "exam-5-revision": "skeleton x-ray", "exam-6-revision": "spring balance weights", "lower-secondary-stage-2/physics": "lightning storm",
    "renewable-resources": "solar panels rooftop", "sim-renewable-resources-lab": "wind turbine blades", "electricity-and-circuits": "electrical wires cables",
    "sim-circuit-workshop": "light bulb glowing", "lower-secondary-stage-2/chemistry": "colorful liquids beakers", "mixtures-and-solutions": "salt crystals macro",
    "sim-separation-station": "coffee filter pouring", "ext-sugar-and-salt-solutions-phet": "sugar cubes", "acids-and-bases": "lemons citrus fruit",
    "sim-ph-lab": "litmus paper pH test", "lower-secondary-stage-2/biology": "butterfly wings macro", "life-processes-and-organs": "ladybird leaf",
    "sim-mrs-c-gren-life-scanner": "meerkat standing", "cell-structure": "onion epidermis microscope", "sim-cell-structure-detective": "microscope eyepiece",
    "puberty-and-the-menstrual-cycle": "flower bud opening", "sim-cycle-lab": "moon phases",
    "pre-ig": "exam hall desks", "pre-ig/science": "laboratory equipment glass", "pre-ig-stage-1": "sunlight forest path", "pre-ig-stage-1/biology": "tree frog",
    "module-1-nature-and-variety-of-living-organisms": "rainforest biodiversity", "module-1-nature-and-variety-of-living-organisms/guide-revision-guide": "mushroom gills",
    "sim-life-vault": "bacteria colonies agar plate", "pre-ig-stage-2": "chemistry laboratory flasks", "pre-ig/spanish": "Seville street",
    "pre-ig-stage-1-spanish": "Valencia old town", "module-1-fashion-and-shopping": "clothing market stall", "sim-pasarela-de-moda": "fashion runway",
    "module-2-holidays-and-travel": "beach holiday Spain", "sim-el-diario-de-viaje": "travel notebook map passport",
    "module-3-exam-revision-materials": "pen notebook desk", "module-3-exam-revision-materials/exam-4-revision": "Alhambra Granada",
    "igcse-biology": "leaf cross section microscope", "module-0-exam-skills": "exam hall desks", "sim-command-words": "fountain pen exam paper",
    "module-1-variety-of-living-things": "coral reef", "module-5a-food-production": "tomato plants greenhouse", "primary/leap-science": "vegetable garden raised beds", "leap-science/module-1-growing-food": "seedlings sprouting soil", "sim-greenhouse-business-tycoon": "polytunnel vegetables farm", "sim-five-kingdoms-sorter": "mushroom forest", "a-level-biology": "laboratory microscope",
}


def api(**p):
    p["format"] = "json"
    req = urllib.request.Request(API + "?" + urllib.parse.urlencode(p), headers={"User-Agent": UA})
    for i in range(4):
        try:
            return json.load(urllib.request.urlopen(req, timeout=40))
        except Exception:
            time.sleep(1.5 * (i + 1))
    return {}


def clean(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s or "")).strip()


def candidates(q):
    seen = []
    for extra in (' incategory:"Quality images"', ' incategory:"Featured pictures on Wikimedia Commons"', ""):
        d = api(action="query", generator="search", gsrsearch=q + extra + " filetype:bitmap", gsrnamespace=6, gsrlimit=25,
                prop="imageinfo|categories", iiprop="url|size|mime|extmetadata", iiurlwidth=1000, cllimit=50)
        pages = sorted((d.get("query", {}).get("pages", {})).values(), key=lambda x: x.get("index", 99))
        for pg in pages:
            ii = (pg.get("imageinfo") or [{}])[0]
            meta = ii.get("extmetadata", {})
            lic = clean(meta.get("LicenseShortName", {}).get("value", ""))
            title = pg.get("title", "")
            cats = " ".join(c["title"] for c in pg.get("categories", []))
            if ii.get("mime") != "image/jpeg" or ii.get("width", 0) < 1000 or ii.get("height", 0) < 600:
                continue
            if not OK_LIC.match(lic) or BAD_LIC.search(lic) or BAD_TITLE.search(title):
                continue
            if re.search(r"AI-generated|Generative|Stable Diffusion|Midjourney|DALL", cats, re.I):
                continue
            if not ii.get("thumburl"):
                continue
            seen.append({"title": title, "thumb": ii["thumburl"], "page": ii.get("descriptionurl"), "license": lic,
                         "license_url": clean(meta.get("LicenseUrl", {}).get("value", "")),
                         "author": clean(meta.get("Artist", {}).get("value", "")) or "Unknown author"})
        if len(seen) >= 6:
            break
        time.sleep(0.25)
    return seen


def save(img_bytes, dest):
    im = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    w, h = im.size
    tw, th = 3, 2
    if w / h > tw / th:
        nw = int(h * tw / th); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))
    else:
        nh = int(w * th / tw); top = int((h - nh) * 0.4); im = im.crop((0, top, w, top + nh))
    im = im.resize((720, 480), Image.LANCZOS)
    im.save(dest, "JPEG", quality=80, optimize=True, progressive=True)


def slug(path):
    return "-".join(path[-3:]) if len(path) > 2 else "-".join(path)


def lookup(path):
    for n in (4, 3, 2, 1):
        k = "/".join(path[-n:])
        if k in Q:
            return Q[k]
    return None


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    credits = json.loads(CREDITS.read_text(encoding="utf-8")) if CREDITS.exists() else {}
    used = {c["title"] for c in credits.values()}
    redo = sys.argv[2] if len(sys.argv) > 2 and sys.argv[1] == "--redo" else None
    data = json.loads((REPO / "data" / "subjects.json").read_text(encoding="utf-8"))
    nodes = []

    def walk(ns, trail):
        for n in ns:
            p = trail + [n["id"]]
            nodes.append((p, n))
            if n.get("type") not in ("simulation", "guide"):
                walk(n.get("children", []), p)
    walk(data["tree"], [])
    missing = []
    for path, node in nodes:
        if len(path) < 2 and node.get("type") == "level":
            continue
        key = "/".join(path)
        if redo and not key.endswith(redo):
            continue
        if key in credits and not redo:
            continue
        q = lookup(path)
        if not q:
            missing.append(key); continue
        if redo:
            used.discard(credits.get(key, {}).get("title"))
            skip = {credits.get(key, {}).get("title")}
        else:
            skip = set()
        got = None
        for c in candidates(q):
            if c["title"] in used or c["title"] in skip:
                continue
            try:
                req = urllib.request.Request(c["thumb"], headers={"User-Agent": UA})
                blob = urllib.request.urlopen(req, timeout=60).read()
                dest = OUT / (slug(path) + ".jpg")
                save(blob, dest)
                got = c
                break
            except Exception as e:
                print("   skip", c["title"], e)
        if got:
            used.add(got["title"])
            credits[key] = dict(got, file=slug(path) + ".jpg", query=q)
            print("ok  ", key, "<-", got["title"], "|", got["license"])
        else:
            print("FAIL", key, q)
        CREDITS.write_text(json.dumps(credits, indent=1, ensure_ascii=False), encoding="utf-8")
        time.sleep(0.3)
    if missing:
        print("no query for:", *missing, sep="\n  ")


if __name__ == "__main__":
    main()
