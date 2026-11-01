# Pre-IG Stage 1 Spanish, Internal Exam 4 (Units 7 and 8) revision: question bank, booklet data and content.json writer.
# Run:  python tools/booklets/preig4.py   (writes exam-4-revision/content.json)  then  python tools/make-booklets.py preig4
import json, os, random, sys, pathlib
HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from preig4_lessons import LESSONS, B, S

SITE = HERE.parent.parent / "secondary/a-level-pathway/pre-ig/spanish/pre-ig-stage-1-spanish/exam-4-revision"
rnd = random.Random(41)

BANK = []
def Q(l, q, ok, w, ex):
    """q, ex: B() pairs (or str for both). ok / w: plain strings shown in both languages."""
    f = lambda x: x if isinstance(x, dict) else S(x)
    BANK.append({"l": l, "q": f(q), "ok": ok, "w": w, "ex": f(ex)})

# ---------- vocabulary (Spanish to English and back) ----------
CLOTHES = [("la falda", "skirt"), ("los zapatos", "shoes"), ("la corbata", "tie"), ("el traje", "suit"), ("el vestido", "dress"), ("las botas", "boots"), ("la camisa", "shirt"), ("la camiseta", "T-shirt"), ("los pantalones", "trousers"), ("la chaqueta", "jacket"), ("el abrigo", "coat"), ("el sombrero", "hat"), ("la bufanda", "scarf"), ("los guantes", "gloves"), ("las gafas de sol", "sunglasses"), ("el jersey", "sweater"), ("el suéter", "sweater")]
TRAVEL = [("la maleta", "suitcase"), ("el pasaporte", "passport"), ("el aeropuerto", "airport"), ("el billete", "ticket"), ("el boleto", "ticket"), ("el hotel", "hotel"), ("la playa", "beach"), ("la montaña", "mountain"), ("el mapa", "map"), ("la cámara", "camera"), ("el museo", "museum"), ("el avión", "plane")]
def distract(group, en, n=3):
    pool = sorted({e for _, e in group if e != en})
    return rnd.sample(pool, n)
for es, en in CLOTHES + TRAVEL:
    grp = CLOTHES if (es, en) in CLOTHES else TRAVEL
    l = 1 if grp is CLOTHES else 6
    if es in ("el suéter", "el boleto"): l = 2
    Q(l, B(f"What does «{es}» mean?", f"¿Qué significa «{es}»?"), en, distract(grp, en), B(f"«{es}» means '{en}'.", f"«{es}» significa '{en}'."))
for es, en in [("la falda", "skirt"), ("el traje", "suit"), ("la maleta", "suitcase"), ("el pasaporte", "passport"), ("la playa", "beach"), ("el aeropuerto", "airport"), ("la corbata", "tie"), ("las botas", "boots")]:
    grp = CLOTHES if any(e == en for _, e in CLOTHES) else TRAVEL
    l = 1 if grp is CLOTHES else 6
    Q(l, B(f"How do you say '{en}' in Spanish?", f"¿Cómo se dice '{en}' en español?"), es, [x for x, _ in rnd.sample([g for g in grp if g[0] != es], 3)], B(f"'{en}' is {es}.", f"'{en}' es {es}."))

# ---------- articles and agreement ----------
for noun, art, wrong in [("falda", "la", ["el", "los", "las"]), ("jersey", "el", ["la", "los", "las"]), ("zapatos", "los", ["el", "la", "las"]), ("botas", "las", ["el", "la", "los"]), ("pantalones", "los", ["el", "la", "las"]), ("camiseta", "la", ["el", "los", "las"]), ("traje", "el", ["la", "los", "las"]), ("gafas", "las", ["el", "la", "los"]), ("pasaporte", "el", ["la", "los", "las"]), ("maleta", "la", ["el", "los", "las"])]:
    Q(1 if noun not in ("pasaporte", "maleta") else 6, B(f"Which article goes with «{noun}»?", f"¿Qué artículo va con «{noun}»?"), art, wrong, B(f"{noun.capitalize()} takes '{art}': {art} {noun}.", f"{noun.capitalize()} lleva '{art}': {art} {noun}."))
for stem, ok, wr, ex in [("una camiseta", "blanca", ["blanco", "blancos", "blancas"], "Camiseta is feminine singular, so blanca."), ("unos zapatos", "negros", ["negro", "negra", "negras"], "Zapatos is masculine plural, so negros."), ("unas botas", "negras", ["negro", "negros", "negra"], "Botas is feminine plural, so negras."), ("un jersey", "rojo", ["roja", "rojos", "rojas"], "Jersey is masculine singular, so rojo."), ("una falda", "azul", ["azula", "azules", "azulo"], "Azul does not change in the singular."), ("unos pantalones", "verdes", ["verde", "verdas", "verdos"], "Verde ends in -e, so the plural is verdes."), ("una corbata", "amarilla", ["amarillo", "amarillos", "amarillas"], "Corbata is feminine: amarilla."), ("un vestido", "rosa", ["rosas", "rosos", "rosado"], "Rosa does not change.")]:
    Q(1, B(f"Choose the correct colour: {stem} ___.", f"Elige el color correcto: {stem} ___."), ok, wr, B(ex, ex.replace("is feminine singular", "es femenino singular").replace("is masculine plural", "es masculino plural").replace("is feminine plural", "es femenino plural").replace("is masculine singular", "es masculino singular").replace("so ", "así que ").replace("does not change in the singular.", "no cambia en singular.").replace("ends in -e, so the plural is", "acaba en -e, así que el plural es").replace("is feminine:", "es femenino:").replace("does not change.", "no cambia.")))
for q_en, q_es, ok, wr, ex_en, ex_es in [
    ("How do you say 'a cotton shirt'?", "¿Cómo se dice «a cotton shirt»?", "una camisa de algodón", ["una camisa algodón", "una camisa en lana", "un camisa de algodón"], "Use de + material after the noun.", "Usa de + material después del sustantivo."),
    ("What does «de lana» tell you?", "¿Qué te indica «de lana»?", "It is made of wool", ["It is made of cotton", "It is striped", "It is leather"], "Lana is wool.", "Lana es wool."),
    ("«una falda de cuadros» describes a skirt that is...", "«una falda de cuadros» describe una falda...", "checked", ["striped", "silk", "very long"], "De cuadros means checked.", "De cuadros significa a cuadros."),
    ("Which phrase means 'leather boots'?", "¿Qué frase significa 'leather boots'?", "unas botas de cuero", ["unas botas de seda", "unos botas de cuero", "unas botas en cuero"], "Cuero is leather.", "Cuero es leather."),
    ("What does «una corbata de seda» mean?", "¿Qué significa «una corbata de seda»?", "a silk tie", ["a wool tie", "a striped tie", "a cotton tie"], "Seda is silk.", "Seda es silk.")]:
    Q(1, B(q_en, q_es), ok, wr, B(ex_en, ex_es))

# ---------- regional Spanish ----------
for q_en, q_es, ok, wr, ex_en, ex_es in [
    ("Which word is used for 'ticket' in Spain?", "¿Qué palabra se usa para 'ticket' en España?", "el billete", ["el boleto", "el pasaje", "la valija"], "El billete is Spain; el boleto and el pasaje are Latin America.", "El billete es de España; el boleto y el pasaje, de Latinoamérica."),
    ("What does «los lentes» mean in Latin America?", "¿Qué significa «los lentes» en Latinoamérica?", "glasses", ["lenses only", "sunglasses only", "ties"], "Los lentes = las gafas.", "Los lentes = las gafas."),
    ("What is «la remera» in Argentina?", "¿Qué es «la remera» en Argentina?", "a T-shirt", ["a skirt", "a suitcase", "a scarf"], "La remera = la camiseta.", "La remera = la camiseta."),
    ("Which word for 'luggage' is used in Argentina?", "¿Qué palabra para 'luggage' se usa en Argentina?", "la valija", ["la playera", "el colectivo", "el carro"], "La valija is the Argentine word for suitcase.", "La valija es la palabra argentina para maleta."),
    ("What is «el colectivo» in Argentina?", "¿Qué es «el colectivo» en Argentina?", "a bus", ["a car", "a ticket", "a plane"], "El colectivo is a bus in Argentina.", "El colectivo es un autobús en Argentina."),
    ("What is the Mexican word for T-shirt?", "¿Cuál es la palabra mexicana para camiseta?", "la playera", ["la remera", "el jersey", "los vaqueros"], "La playera is Mexican; la remera is Argentine.", "La playera es mexicana; la remera es argentina."),
    ("What is «el carro» in Latin America?", "¿Qué es «el carro» en Latinoamérica?", "a car", ["a bus", "a ticket", "a plane"], "El carro = el coche.", "El carro = el coche."),
    ("Which pair means the same thing?", "¿Qué pareja significa lo mismo?", "el jersey / el suéter", ["el jersey / la bufanda", "el suéter / los guantes", "el jersey / los zapatos"], "Both mean sweater.", "Los dos significan suéter."),
    ("What are «pantalones cortos» in Latin America?", "¿Qué son «pantalones cortos» en Latinoamérica?", "shorts (short / pantalonetas)", ["a swimsuit", "long trousers", "boots"], "Pantalones cortos = shorts.", "Pantalones cortos = shorts.")]:
    Q(2, B(q_en, q_es), ok, wr, B(ex_en, ex_es))

# ---------- demonstratives ----------
N = {"camiseta": ("f", 1), "falda": ("f", 1), "bufanda": ("f", 1), "chaqueta": ("f", 1), "maleta": ("f", 1), "jersey": ("m", 1), "abrigo": ("m", 1), "sombrero": ("m", 1), "vestido": ("m", 1), "zapatos": ("m", 2), "pantalones": ("m", 2), "guantes": ("m", 2), "botas": ("f", 2), "gafas": ("f", 2)}
D = {"close": {("m", 1): "este", ("f", 1): "esta", ("m", 2): "estos", ("f", 2): "estas"}, "mid": {("m", 1): "ese", ("f", 1): "esa", ("m", 2): "esos", ("f", 2): "esas"}, "far": {("m", 1): "aquel", ("f", 1): "aquella", ("m", 2): "aquellos", ("f", 2): "aquellas"}}
DIST = {"close": ("close to me", "cerca de mí"), "mid": ("a medium distance away", "a distancia media"), "far": ("far from both of us", "lejos de los dos")}
combos = [("camiseta", "close"), ("falda", "mid"), ("abrigo", "far"), ("zapatos", "mid"), ("botas", "far"), ("jersey", "close"), ("gafas", "close"), ("chaqueta", "far"), ("guantes", "mid"), ("vestido", "mid"), ("pantalones", "close"), ("bufanda", "far"), ("sombrero", "close"), ("maleta", "mid"), ("falda", "far"), ("zapatos", "close")]
for noun, d in combos:
    g = N[noun]; ok = D[d][g]
    forms = [v for k, v in D[d].items() if v != ok]
    other = D["mid" if d != "mid" else "close"][g]
    Q(3, B(f"Choose the demonstrative: ___ {noun} ({DIST[d][0]}).", f"Elige el demostrativo: ___ {noun} ({DIST[d][1]})."), ok, forms[:2] + [other], B(f"{noun.capitalize()} is {'masculine' if g[0] == 'm' else 'feminine'} {'plural' if g[1] == 2 else 'singular'} and the item is {DIST[d][0]}: {ok} {noun}.", f"{noun.capitalize()} es {'masculino' if g[0] == 'm' else 'femenino'} {'plural' if g[1] == 2 else 'singular'} y el objeto está {DIST[d][1]}: {ok} {noun}."))
Q(3, B("Which word means 'over there' (far from both of us)?", "¿Qué palabra significa 'over there' (lejos de los dos)?"), "allá", ["aquí", "allí", "ahí"], B("Aquí is here, allí/ahí is there (medium), allá is far.", "Aquí es here, allí/ahí es there (media), allá es lejos."))
Q(3, B("Which form means 'those (far away)' with <b>botas</b>?".replace("<b>", "").replace("</b>", ""), "¿Qué forma significa 'those (far away)' con botas?"), "aquellas", ["aquellos", "esas", "estas"], B("Botas is feminine plural: aquellas botas.", "Botas es femenino plural: aquellas botas."))
Q(3, B("«Este, esta, estos, estas» all contain which letter?", "«Este, esta, estos, estas» contienen todas qué letra?"), "t", ["s only", "q", "l"], B("This and These have T's: the close forms.", "This y These tienen T: las formas cercanas."))
Q(3, B("Which sentence is correct?", "¿Qué frase es correcta?"), "Me gusta esta camiseta, pero prefiero esos pantalones.", ["Me gusta este camiseta, pero prefiero esas pantalones.", "Me gusta esta camiseta, pero prefiero esa pantalones.", "Me gusta estos camiseta, pero prefiero esos pantalones."], B("Camiseta is feminine (esta); pantalones is masculine plural (esos).", "Camiseta es femenino (esta); pantalones es masculino plural (esos)."))

# ---------- ponerse / llevar ----------
for pr, ok, wr in [("yo", "me", ["te", "se", "nos"]), ("tú", "te", ["me", "se", "nos"]), ("ella", "se", ["me", "te", "nos"]), ("nosotros", "nos", ["me", "te", "se"]), ("mis hermanos", "se", ["me", "te", "nos"]), ("mi madre", "se", ["me", "te", "nos"])]:
    verb = {"yo": "pongo", "tú": "pones", "ella": "pone", "nosotros": "ponemos", "mis hermanos": "ponen", "mi madre": "pone"}[pr]
    Q(4, B(f"Choose the pronoun: {pr.capitalize()} ___ {verb} el abrigo.", f"Elige el pronombre: {pr.capitalize()} ___ {verb} el abrigo."), ok, wr, B(f"{pr.capitalize()} goes with '{ok}': {ok} {verb}.", f"{pr.capitalize()} va con '{ok}': {ok} {verb}."))
for q_en, q_es, ok, wr, ex_en, ex_es in [
    ("Which sentence means 'I put on the scarf'?", "¿Qué frase significa 'I put on the scarf'?", "Me pongo la bufanda.", ["Pongo la bufanda me.", "Me pone la bufanda.", "Te pongo la bufanda."], "Ponerse is reflexive: me pongo.", "Ponerse es reflexivo: me pongo."),
    ("Which verb means 'to put an object on the table'?", "¿Qué verbo significa 'to put an object on the table'?", "poner", ["ponerse", "llevar", "viajar"], "Poner is for objects.", "Poner es para objetos."),
    ("Which verb means 'to put clothes on yourself'?", "¿Qué verbo significa 'to put clothes on yourself'?", "ponerse", ["poner", "salir", "llegar"], "Ponerse is reflexive.", "Ponerse es reflexivo."),
    ("What does «Llevo una camiseta blanca» mean?", "¿Qué significa «Llevo una camiseta blanca»?", "I am wearing a white T-shirt", ["I put the T-shirt on the table", "I am going to buy a T-shirt", "I took a white T-shirt"], "Llevar describes what you are wearing.", "Llevar describe lo que llevas puesto."),
    ("Complete: ¿Qué ___ pones para la fiesta?", "Completa: ¿Qué ___ pones para la fiesta?", "te", ["me", "se", "nos"], "Tú goes with te.", "Tú va con te.")]:
    Q(4, B(q_en, q_es), ok, wr, B(ex_en, ex_es))

# ---------- shop ----------
for q_en, q_es, ok, wr, ex_en, ex_es in [
    ("How do you say 'I am looking for a red skirt'?", "¿Cómo se dice 'I am looking for a red skirt'?", "Busco una falda roja.", ["Busco un falda rojo.", "Llevo una falda roja.", "Voy a una falda roja."], "Busco = I am looking for.", "Busco = I am looking for."),
    ("What does «¿Qué talla necesita?» ask?", "¿Qué pregunta «¿Qué talla necesita?»?", "What size do you need?", ["What colour do you need?", "How much is it?", "Where is the shop?"], "Talla means size.", "Talla significa size."),
    ("Which question asks for the price?", "¿Qué pregunta pide el precio?", "¿Cuánto cuesta?", ["¿Qué talla necesita?", "¿Dónde está el hotel?", "¿Qué te pones?"], "Cuánto cuesta = how much does it cost?", "Cuánto cuesta = how much does it cost?"),
    ("What is the word for 'large' or 'big'?", "¿Cuál es la palabra para 'large' o 'big'?", "grande", ["pequeño", "rápido", "corto"], "Grande = big/large.", "Grande = big/large."),
    ("Complete: Una L es más ___ que una S.", "Completa: Una L es más ___ que una S.", "grande", ["pequeña", "cuesta", "euros"], "L is bigger than S.", "L es más grande que S."),
    ("Complete: Cuesta cuarenta ___.", "Completa: Cuesta cuarenta ___.", "euros", ["talla", "grande", "busco"], "Prices need euros.", "Los precios necesitan euros."),
    ("Which number is «cincuenta»?", "¿Qué número es «cincuenta»?", "50", ["15", "5", "500"], "Cincuenta = 50.", "Cincuenta = 50."),
    ("Which number is «veinte»?", "¿Qué número es «veinte»?", "20", ["2", "12", "200"], "Veinte = 20.", "Veinte = 20."),
    ("Which number is «sesenta»?", "¿Qué número es «sesenta»?", "60", ["16", "6", "600"], "Sesenta = 60.", "Sesenta = 60."),
    ("How do you write 40 in Spanish?", "¿Cómo se escribe 40 en español?", "cuarenta", ["catorce", "cuatro", "cuatrocientos"], "Cuarenta = 40.", "Cuarenta = 40."),
    ("Which phrase finishes a sale: 'Here you are'?", "¿Qué frase significa 'Here you are'?", "Aquí tiene.", ["Busco una talla.", "Cuánto cuesta.", "¿Qué talla?"], "Aquí tiene = here you are.", "Aquí tiene = here you are."),
    ("What does «Son treinta euros» mean?", "¿Qué significa «Son treinta euros»?", "That is thirty euros", ["It costs three euros", "I am thirty years old", "There are thirty shops"], "Son + number + euros = that is ... euros.", "Son + número + euros = that is ... euros.")]:
    Q(5, B(q_en, q_es), ok, wr, B(ex_en, ex_es))

# ---------- weather / activities ----------
for q_en, q_es, ok, wr, ex_en, ex_es in [
    ("How do you say 'It is hot'?", "¿Cómo se dice 'It is hot'?", "Hace calor.", ["Es calor.", "Tiene calor frío.", "Está sol."], "Weather uses hace + noun.", "El tiempo usa hace + sustantivo."),
    ("What does «Hace frío» mean?", "¿Qué significa «Hace frío»?", "It is cold", ["It is hot", "It is raining", "It is sunny"], "Frío is cold.", "Frío es cold."),
    ("Which phrase means 'It is sunny'?", "¿Qué frase significa 'It is sunny'?", "Hace sol.", ["Llueve.", "Hace frío.", "Nieva."], "Sol is sun.", "Sol es sun."),
    ("What does «Llueve» mean?", "¿Qué significa «Llueve»?", "It is raining", ["It is windy", "It is cold", "It snows"], "Llover = to rain.", "Llover = to rain."),
    ("Which sentence says 'I am going to visit the museum'?", "¿Qué frase dice 'I am going to visit the museum'?", "Voy a visitar el museo.", ["Voy visitar museo.", "Visito voy el museo.", "Voy el museo visitar."], "voy a + infinitive.", "voy a + infinitivo."),
    ("Which verb means 'to arrive'?", "¿Qué verbo significa 'to arrive'?", "llegar", ["salir", "viajar", "visitar"], "Llegar = to arrive; salir = to leave.", "Llegar = to arrive; salir = to leave."),
    ("Which phrase means 'to pack your suitcase'?", "¿Qué frase significa 'to pack your suitcase'?", "hacer la maleta", ["llevar la maleta", "poner la maleta", "ir a la maleta"], "Hacer la maleta is to pack.", "Hacer la maleta es to pack."),
    ("What is «la montaña»?", "¿Qué es «la montaña»?", "the mountain", ["the beach", "the museum", "the airport"], "Montaña = mountain.", "Montaña = mountain.")]:
    Q(6, B(q_en, q_es), ok, wr, B(ex_en, ex_es))

# ---------- near future ----------
for pr, ok, wr in [("Yo", "voy", ["vas", "va", "vamos"]), ("Tú", "vas", ["voy", "va", "van"]), ("Mi hermana", "va", ["vas", "vamos", "van"]), ("Nosotros", "vamos", ["voy", "va", "van"]), ("Mis padres", "van", ["va", "vamos", "vas"]), ("Ellos", "van", ["vas", "voy", "vamos"])]:
    Q(7, B(f"Choose the form of ir: {pr} ___ a nadar en el mar.", f"Elige la forma de ir: {pr} ___ a nadar en el mar."), ok, wr, B(f"{pr} goes with '{ok}'.", f"{pr} va con '{ok}'."))
Q(7, B("What is the formula for the near future?", "¿Cuál es la fórmula del futuro próximo?"), "ir + a + infinitive", ["ir + infinitive", "ser + a + infinitive", "ir + a + past form"], B("Ir (conjugated) + a + infinitive.", "Ir (conjugado) + a + infinitivo."))
Q(7, B("Which sentence is correct?", "¿Qué frase es correcta?"), "Vamos a comer tapas.", ["Vamos comer tapas.", "Vamos a comemos tapas.", "Vamos a comimos tapas."], B("The 'a' and the infinitive are both needed.", "Se necesitan la «a» y el infinitivo."))
Q(7, B("Which sentence is a plan for the future?", "¿Qué frase es un plan de futuro?"), "Mañana voy a visitar el museo.", ["Ayer visité el museo.", "Anoche comí tapas.", "El año pasado fui a Cuba."], B("Mañana points to the future.", "Mañana indica futuro."))
Q(7, B("Which word signals the near future?", "¿Qué palabra indica el futuro próximo?"), "mañana", ["ayer", "anoche", "el año pasado"], B("Mañana = tomorrow.", "Mañana = tomorrow."))
Q(7, B("Say 'She is going to travel to Spain'.", "Di 'She is going to travel to Spain'."), "Ella va a viajar a España.", ["Ella vas a viajar a España.", "Ella va viajar a España.", "Ella viaja va a España."], B("Ella = va; a + infinitive.", "Ella = va; a + infinitivo."))

# ---------- past ----------
for q_en, q_es, ok, wr, ex_en, ex_es in [
    ("Choose: Ayer, yo ___ al parque. (went)", "Elige: Ayer, yo ___ al parque. (went)", "fui", ["voy", "fue", "iba"], "Yo = fui.", "Yo = fui."),
    ("Choose: Ayer, tú ___ a la playa. (went)", "Elige: Ayer, tú ___ a la playa. (went)", "fuiste", ["fui", "fue", "vas"], "Tú = fuiste.", "Tú = fuiste."),
    ("Choose: Ayer, ella ___ al museo. (went)", "Elige: Ayer, ella ___ al museo. (went)", "fue", ["fui", "fuiste", "va"], "Ella = fue.", "Ella = fue."),
    ("Choose: Anoche, yo ___ pizza. (ate)", "Elige: Anoche, yo ___ pizza. (ate)", "comí", ["como", "comió", "comiste"], "Yo = comí.", "Yo = comí."),
    ("Choose: Ayer, tú ___ tacos. (ate)", "Elige: Ayer, tú ___ tacos. (ate)", "comiste", ["comí", "comió", "comes"], "Tú = comiste.", "Tú = comiste."),
    ("Choose: Mi padre ___ paella. (ate)", "Elige: Mi padre ___ paella. (ate)", "comió", ["comí", "comiste", "come"], "Él = comió.", "Él = comió."),
    ("Choose: El año pasado, yo ___ Perú. (visited)", "Elige: El año pasado, yo ___ Perú. (visited)", "visité", ["visito", "visitó", "visitaste"], "Yo = visité.", "Yo = visité."),
    ("Choose: Ayer, tú ___ el museo. (visited)", "Elige: Ayer, tú ___ el museo. (visited)", "visitaste", ["visité", "visitó", "visitas"], "Tú = visitaste.", "Tú = visitaste."),
    ("Choose: Mi tía ___ Argentina. (visited)", "Elige: Mi tía ___ Argentina. (visited)", "visitó", ["visité", "visitaste", "visita"], "Ella = visitó.", "Ella = visitó."),
    ("What does «Fue divertido» mean?", "¿Qué significa «Fue divertido»?", "It was fun", ["He went fun", "I was fun", "It is fun"], "Fue here is the verb SER.", "Fue aquí es el verbo SER."),
    ("What does «Fui a España» mean?", "¿Qué significa «Fui a España»?", "I went to Spain", ["I was Spain", "I am going to Spain", "I am Spain"], "Fui here is the verb IR.", "Fui aquí es el verbo IR."),
    ("Which verb has the SAME preterite forms as ir?", "¿Qué verbo tiene las MISMAS formas del pretérito que ir?", "ser", ["comer", "visitar", "ponerse"], "Ir and ser share fui, fuiste, fue.", "Ir y ser comparten fui, fuiste, fue."),
    ("Which word tells you to use the past?", "¿Qué palabra indica que debes usar el pasado?", "ayer", ["mañana", "la semana que viene", "el año que viene"], "Ayer = yesterday.", "Ayer = yesterday."),
    ("Which sentence is correct?", "¿Qué frase es correcta?", "Ayer comí paella.", ["Ayer como paella.", "Ayer voy a comer paella.", "Ayer comiste paella yo."], "Ayer needs the preterite: comí.", "Ayer necesita el pretérito: comí."),
    ("Which sentence is correct?", "¿Qué frase es correcta?", "Fui a la playa con mi familia.", ["Voy a la playa con mi familia ayer.", "Vas a la playa ayer.", "Fuiste yo a la playa."], "Fui = I went.", "Fui = I went."),
    ("Which sentence means 'Tomorrow I am going to visit Madrid'?", "¿Qué frase significa 'Tomorrow I am going to visit Madrid'?", "Mañana voy a visitar Madrid.", ["Mañana visité Madrid.", "Ayer voy a visitar Madrid.", "Mañana fui a Madrid."], "Mañana + voy a + infinitive.", "Mañana + voy a + infinitivo.")]:
    Q(8, B(q_en, q_es), ok, wr, B(ex_en, ex_es))

# ---------- culture / danger zone ----------
for q_en, q_es, ok, wr, ex_en, ex_es in [
    ("What happens on 5 January in Spain?", "¿Qué ocurre el 5 de enero en España?", "The Cabalgata de Reyes", ["An asado", "A fashion show", "A bullfight"], "The Three Kings Parade.", "El desfile de los Reyes Magos."),
    ("What do families often do at Christmas in Argentina?", "¿Qué hacen muchas familias en Navidad en Argentina?", "Have an asado outdoors", ["Wear coats and scarves", "Go skiing", "Watch the Three Kings Parade"], "It is summer in Argentina in December.", "Es verano en Argentina en diciembre."),
    ("Why do Spain and Argentina have opposite seasons?", "¿Por qué España y Argentina tienen estaciones opuestas?", "They are in opposite hemispheres", ["They speak different Spanish", "They are in the same hemisphere", "Argentina is nearer the Moon"], "Northern vs Southern Hemisphere.", "Hemisferio norte frente a hemisferio sur."),
    ("What do people wear at Christmas in Argentina?", "¿Qué lleva la gente en Navidad en Argentina?", "shorts and sandals", ["coats and boots", "gloves and scarves", "wool hats"], "It is hot and humid there.", "Hace calor y humedad."),
    ("What does Zara do that changed retail?", "¿Qué hace Zara que cambió el comercio?", "New designs in shops twice a week", ["Sells only handmade weaving", "Makes one collection a year", "Only sells shoes"], "Zara is a fast-fashion leader.", "Zara es líder de la moda rápida."),
    ("Who founded Zara?", "¿Quién fundó Zara?", "Amancio Ortega", ["Simón Bolívar", "Pablo Neruda", "Antonio Banderas"], "Zara was founded by Amancio Ortega.", "Zara fue fundada por Amancio Ortega."),
    ("Which is an example of slow fashion?", "¿Cuál es un ejemplo de moda lenta?", "Handmade Andean or Guatemalan weaving", ["A Zara T-shirt", "A mass-produced jacket", "A plastic raincoat"], "Handmade textiles with symbolic meaning.", "Textiles hechos a mano con significado simbólico."),
    ("In which region is weaving a significant indigenous art?", "¿En qué región el tejido es un arte indígena importante?", "the Andes and Guatemala", ["the Caribbean beaches", "Madrid", "Patagonia penguins"], "Peru, Bolivia and Guatemala.", "Perú, Bolivia y Guatemala."),
    ("You are travelling to Buenos Aires. Which is SAFE?", "Viajas a Buenos Aires. ¿Cuál es SEGURO?", "Voy a tomar el autobús.", ["Voy a coger el autobús.", "Voy a coger el taxi.", "Voy a coger el metro."], "Use tomar in Latin America.", "Usa tomar en Latinoamérica."),
    ("Where can you say «coger el metro» without any problem?", "¿Dónde puedes decir «coger el metro» sin ningún problema?", "Spain", ["Mexico", "Argentina", "Colombia"], "Coger is fine in Spain only.", "Coger está bien solo en España."),
    ("Why must you NOT say «coger» in Mexico City?", "¿Por qué NO debes decir «coger» en Ciudad de México?", "It is vulgar slang there", ["It means 'to run'", "It means 'to eat'", "It is a past tense"], "In Latin America coger is vulgar.", "En Latinoamérica coger es vulgar."),
    ("Which verb is the safe choice everywhere for taking the bus?", "¿Qué verbo es la opción segura en todas partes para tomar el autobús?", "tomar", ["coger", "poner", "viajar"], "Tomar is always safe.", "Tomar es siempre seguro."),
    ("In December, where do people need a winter coat?", "En diciembre, ¿dónde necesita la gente un abrigo?", "Spain", ["Argentina", "Both", "Neither"], "December is winter in Spain.", "Diciembre es invierno en España.")]:
    Q(9, B(q_en, q_es), ok, wr, B(ex_en, ex_es))

# ---------- exam technique ----------
for q_en, q_es, ok, wr, ex_en, ex_es in [
    ("How many marks does each writing sentence earn at most?", "¿Cuántos puntos gana como máximo cada frase de escritura?", "2 (1 content, 1 language)", ["1", "4", "8"], "Content and language are marked separately.", "Contenido y lenguaje se puntúan por separado."),
    ("Which of these loses the language mark in a near-future sentence?", "¿Cuál de estas cosas pierde el punto de lenguaje en una frase de futuro próximo?", "Leaving out the 'a' in voy a", ["A missing accent on one word", "A short sentence", "Using the word bank"], "Omitting a loses the language mark.", "Omitir la a pierde el punto de lenguaje."),
    ("What is enough for a reading answer?", "¿Qué basta para una respuesta de lectura?", "A word or short phrase", ["A full sentence in Spanish", "Three sentences", "A paragraph"], "One mark per answer, short is fine.", "Un punto por respuesta; basta algo corto."),
    ("Does a copied starter alone earn a language mark?", "¿Un inicio copiado gana por sí solo un punto de lenguaje?", "No", ["Yes", "Only if it has an accent", "Only for the first sentence"], "Write a full sentence.", "Escribe una frase completa."),
    ("Which sentence would earn both marks for 'say what the weather is like'?", "¿Qué frase ganaría los dos puntos para 'say what the weather is like'?", "Hace calor.", ["Calor.", "Es calor hace.", "Hace."], "Hace + weather noun.", "Hace + sustantivo del tiempo."),
    ("Which sentence would earn both marks for 'clothing and colour'?", "¿Qué frase ganaría los dos puntos para 'clothing and colour'?", "Llevo una camisa negra.", ["Llevo una camisa negro.", "Llevo camisa.", "Una camisa negra llevo yo no."], "Llevo + article + noun + agreeing colour.", "Llevo + artículo + sustantivo + color que concuerda."),
    ("Which is a safe way to start the 'where and who with' sentence?", "¿Cuál es una forma segura de empezar la frase 'where and who with'?", "Voy a ir a ... con ...", ["Fui a ... con ...", "Hace ...", "Llevo ..."], "Near future for plans.", "Futuro próximo para planes."),
    ("In which order should you plan your 55 minutes?", "¿Cómo debes planear tus 55 minutos?", "Work through the paper in about 40-45 min and keep time to check", ["Spend 50 minutes on the writing", "Skip the vocabulary", "Leave nothing to check"], "Keep time to check your answers.", "Deja tiempo para revisar las respuestas.")]:
    Q(10, B(q_en, q_es), ok, wr, B(ex_en, ex_es))

# ---------- reading practice texts (original) ----------
READ = [
 {"id": "r1", "title": B("Reading 1: Clothes", "Lectura 1: La ropa"),
  "text": "Hoy llevo una chaqueta verde y unos vaqueros azules. Mi chaqueta es de cuero. Mis botas cuestan setenta euros.",
  "qs": [(B("What colour is the jacket?", "¿De qué color es la chaqueta?"), ["verde"], "green", B("Verde = green.", "Verde = green.")),
         (B("What colour are the jeans?", "¿De qué color son los vaqueros?"), ["azules"], "blue", B("Azules = blue (plural).", "Azules = blue (plural).")),
         (B("What is the jacket made of?", "¿De qué es la chaqueta?"), ["cuero"], "leather", B("De cuero = made of leather.", "De cuero = made of leather.")),
         (B("How much do the boots cost?", "¿Cuánto cuestan las botas?"), ["setenta"], "seventy euros", B("Setenta = 70.", "Setenta = 70."))]},
 {"id": "r2", "title": B("Reading 2: A holiday", "Lectura 2: Unas vacaciones"),
  "text": "Voy a viajar a Colombia. Voy a visitar la montaña. En julio hace viento. En mi maleta llevo unas botas y una cámara.",
  "qs": [(B("Which country will the person visit?", "¿Qué país va a visitar la persona?"), ["Colombia"], "Colombia", B("A Colombia = to Colombia.", "A Colombia = to Colombia.")),
         (B("What place will they visit?", "¿Qué lugar va a visitar?"), ["montaña"], "the mountain", B("La montaña = the mountain.", "La montaña = the mountain.")),
         (B("What is the weather like?", "¿Qué tiempo hace?"), ["viento"], "windy", B("Hace viento = it is windy.", "Hace viento = it is windy.")),
         (B("Name ONE item in the suitcase.", "Nombra UN objeto de la maleta."), ["botas", "cámara"], "boots or a camera", B("Either item scores.", "Cualquiera de los dos puntúa."))]},
 {"id": "r3", "title": B("Reading 3: At the shop", "Lectura 3: En la tienda"),
  "text": "Busco una falda de cuadros, talla L. Es grande. Cuesta sesenta euros. Tengo cien euros.",
  "qs": [(B("What clothing does the customer want?", "¿Qué prenda quiere el cliente?"), ["falda"], "a skirt", B("Falda = skirt.", "Falda = skirt.")),
         (B("What pattern is it?", "¿Qué dibujo tiene?"), ["cuadros"], "checked", B("De cuadros = checked.", "De cuadros = checked.")),
         (B("What size does the customer want?", "¿Qué talla quiere?"), ["L"], "L", B("Talla L.", "Talla L.")),
         (B("How much does it cost?", "¿Cuánto cuesta?"), ["sesenta"], "sixty euros", B("Sesenta = 60.", "Sesenta = 60."))]},
 {"id": "r4", "title": B("Reading 4: A past trip", "Lectura 4: Un viaje pasado"),
  "text": "El verano pasado fui a Chile con mi hermana. Visité el museo y comí empanadas. Fue muy divertido.",
  "qs": [(B("Where did the person go?", "¿Adónde fue la persona?"), ["Chile"], "Chile", B("Fui a Chile = I went to Chile.", "Fui a Chile = I went to Chile.")),
         (B("Who went with them?", "¿Quién fue con ella?"), ["hermana"], "their sister", B("Hermana = sister.", "Hermana = sister.")),
         (B("What did they eat?", "¿Qué comió?"), ["empanadas"], "empanadas", B("Comí empanadas.", "Comí empanadas.")),
         (B("What place did they visit?", "¿Qué lugar visitó?"), ["museo"], "the museum", B("Visité el museo.", "Visité el museo."))]},
 {"id": "r5", "title": B("Reading 5: What to pack", "Lectura 5: Qué llevar"),
  "text": "Mañana voy a Madrid con mis amigos. En mi maleta llevo un abrigo gris, unos guantes negros y mi pasaporte. En diciembre hace frío.",
  "qs": [(B("Which city are they travelling to?", "¿A qué ciudad viajan?"), ["Madrid"], "Madrid", B("A Madrid.", "A Madrid.")),
         (B("What colour is the coat?", "¿De qué color es el abrigo?"), ["gris"], "grey", B("Gris = grey.", "Gris = grey.")),
         (B("What colour are the gloves?", "¿De qué color son los guantes?"), ["negros"], "black", B("Negros = black.", "Negros = black.")),
         (B("What is the weather like?", "¿Qué tiempo hace?"), ["frío"], "cold", B("Hace frío = it is cold.", "Hace frío = it is cold."))]},
]

# ---------- writing practice scenarios (original, not the exam topics) ----------
WRITE = [
 {"id": "w1", "dest": "Argentina", "title": B("Plan a holiday to Peru", "Planea unas vacaciones a Perú")},
]

# ---------- booklet ----------
def to_lang(x, lang):
    if isinstance(x, dict) and set(x) == {"en", "es"}: return x[lang]
    if isinstance(x, list): return [to_lang(i, lang) for i in x]
    if isinstance(x, dict): return {k: to_lang(v, lang) for k, v in x.items()}
    return x

def booklet(lang):
    lessons = []
    for L in LESSONS:
        d = {"num": L["num"], "title": L["title"], "intro": L["intro"], "ideas": L["ideas"], "table": L["table"], "fact": L["fact"], "questions": L["questions"], "task": L["task"], "answers": L["answers"]}
        lessons.append(to_lang(d, lang))
    fq = {"en": ["Write a four-sentence plan for a holiday to Peru: where and who with, the weather, what you wear, one activity.", "Choose este/ese/aquel: ___ chaqueta (far away) and ___ zapatos (close).", "Complete the shop dialogue: Busco una ___ azul. / ¿Qué ___ necesita? / ¿Cuánto ___? / Cuesta veinte ___.", "Put in the right pronoun: Yo ___ pongo la camiseta. Nosotros ___ ponemos las botas.", "Say 'Yesterday I went to the beach' and 'Tomorrow I am going to go to the beach'."],
          "es": ["Escribe un plan de cuatro frases para unas vacaciones a Perú: adónde y con quién, el tiempo, qué llevas, una actividad.", "Elige este/ese/aquel: ___ chaqueta (lejos) y ___ zapatos (cerca).", "Completa el diálogo: Busco una ___ azul. / ¿Qué ___ necesita? / ¿Cuánto ___? / Cuesta veinte ___.", "Pon el pronombre correcto: Yo ___ pongo la camiseta. Nosotros ___ ponemos las botas.", "Di «Yesterday I went to the beach» y «Tomorrow I am going to go to the beach»."]}[lang]
    fa = {"en": ["Example: Voy a ir a Perú con mi familia. Hace sol. Llevo una camiseta blanca. Voy a visitar el museo.", "aquella chaqueta; estos zapatos.", "falda / talla / cuesta / euros.", "me pongo; nos ponemos.", "Ayer fui a la playa. Mañana voy a ir a la playa."],
          "es": ["Ejemplo: Voy a ir a Perú con mi familia. Hace sol. Llevo una camiseta blanca. Voy a visitar el museo.", "aquella chaqueta; estos zapatos.", "falda / talla / cuesta / euros.", "me pongo; nos ponemos.", "Ayer fui a la playa. Mañana voy a ir a la playa."]}[lang]
    ch = {"en": "Combine four topics: write a short postcard (5 sentences) from Mexico that uses a colour, a past verb (fui or comí), a near-future plan and the right verb for taking a bus.", "es": "Une cuatro temas: escribe una postal corta (5 frases) desde México con un color, un verbo en pasado (fui o comí), un plan de futuro próximo y el verbo correcto para tomar un autobús."}[lang]
    cl = {"en": ["I know the clothing and travel vocabulary with el/la/los/las", "I can make colours agree with the noun", "I can use este / ese / aquel correctly", "I can conjugate ponerse, ir and the preterite of ir/ser, comer and visitar", "I can have a shop conversation and say prices", "I know the Spain/Latin America word pairs and the coger/tomar danger", "I can write four full sentences for the 8-mark writing task", "I scored 80% or more on a practice exam on the website"],
          "es": ["Conozco el vocabulario de ropa y viaje con el/la/los/las", "Sé hacer concordar los colores con el sustantivo", "Uso este / ese / aquel correctamente", "Sé conjugar ponerse, ir y el pretérito de ir/ser, comer y visitar", "Sé mantener una conversación en la tienda y decir precios", "Conozco las parejas de palabras España/Latinoamérica y el peligro de coger/tomar", "Sé escribir cuatro frases completas para la tarea de escritura de 8 puntos", "Saqué 80% o más en un examen de práctica del sitio web"]}[lang]
    return {"short": {"en": "Spanish Internal Exam 4 Revision", "es": "Repaso del Examen Interno 4 de español"}[lang],
            "cover_title": {"en": "Internal Exam 4 <em>Revision</em>", "es": "Repaso del Examen Interno 4"}[lang],
            "course": {"en": "Pre-IG Stage 1 · Spanish · Units 7 and 8", "es": "Pre-IG Etapa 1 · Español · Unidades 7 y 8"}[lang],
            "cover_sub": {"en": "Fashion and shopping, holidays and travel: every word, rule and exam trick you need for 40 out of 40.", "es": "Moda y compras, vacaciones y viajes: todas las palabras, reglas y trucos de examen para sacar 40 de 40."}[lang],
            "lessons": lessons, "final": {"questions": fq, "challenge": ch, "answers": fa}, "checklist": cl}
DATA = {"en": booklet("en"), "es": booklet("es")}

# ---------- content.json for the website ----------
def write_content():
    content = {"lessons": LESSONS, "bank": BANK, "reading": [{"id": r["id"], "title": r["title"], "text": r["text"], "qs": [{"q": q[0], "tap": q[1], "en": q[2], "ex": q[3]} for q in r["qs"]]} for r in READ]}
    SITE.mkdir(parents=True, exist_ok=True)
    (SITE / "content.json").write_text(json.dumps(content, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
    print("content.json", (SITE / "content.json").stat().st_size // 1024, "KB;", len(BANK), "bank questions;", len(LESSONS), "lessons")

if __name__ == "__main__":
    write_content()
