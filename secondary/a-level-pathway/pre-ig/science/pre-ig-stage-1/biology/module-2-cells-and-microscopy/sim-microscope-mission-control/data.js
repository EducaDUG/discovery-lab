/* Microscope Mission Control — shared data, local to this activity (CLAUDE.md §15: L(en, es)). */
import { getLang } from "../../../../../../../../engine/i18n.js?v=10";

export const L = (en, es) => (getLang() === "es" ? es : en);
export const reduced = () => document.documentElement.getAttribute("data-reduced-motion") === "on";

export const CREDITS = {
  scope: { name: "Compound microscope", who: "Acagastya", lic: "CC0", url: "https://creativecommons.org/publicdomain/zero/1.0/" },
  "onion-low": { name: "Onion epidermis, low power", who: "Berkshire Community College Bioscience Image Library", lic: "CC0", url: "https://creativecommons.org/publicdomain/zero/1.0/" },
  "onion-nuc": { name: "Onion epidermis, high power", who: "Berkshire Community College Bioscience Image Library", lic: "CC0", url: "https://creativecommons.org/publicdomain/zero/1.0/" },
  "onion-high": { name: "Onion epidermis cell walls", who: "loganrickert", lic: "CC BY 2.0", url: "https://creativecommons.org/licenses/by/2.0/" },
  cheek: { name: "Human cheek cells (methylene blue)", who: "Fritzmann2002", lic: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "onion-cut": { name: "Red onion, cut", who: "Amada44", lic: "Public domain", url: "" },
};
export function creditLine(ids) {
  return L("Photos (Wikimedia Commons): ", "Fotos (Wikimedia Commons): ") + ids.map(id => {
    const c = CREDITS[id]; if (!c) return "";
    const lic = c.url ? `<a href="${c.url}" target="_blank" rel="noopener noreferrer">${c.lic}</a>` : c.lic;
    return `${c.name} — ${c.who}, ${lic}`;
  }).join(" · ");
}
export const img = id => `photos/${id}.jpg`;

/* the nine parts from the lesson, with hotspot positions on photos/scope.jpg (fractions of width/height) */
export const PARTS = [
  { id: "eyepiece", x: 0.31, y: 0.14, name: () => L("Eyepiece", "Ocular"),
    fn: () => L("The part you look down. It holds a lens (usually ×10) that magnifies the image a second time.", "La parte por la que miras. Tiene una lente (normalmente ×10) que amplía la imagen una segunda vez."),
    clue: () => L("The part of the microscope that you look down.", "La parte del microscopio por la que miras.") },
  { id: "barrel", x: 0.31, y: 0.34, name: () => L("Barrel (body tube)", "Tubo (cuerpo)"),
    fn: () => L("The long hollow tube connected to the eyepiece. It keeps the lenses the right distance apart.", "El tubo largo y hueco unido al ocular. Mantiene las lentes a la distancia correcta."),
    clue: () => L("The long hollow tube that is connected to the eyepiece.", "El tubo largo y hueco que está unido al ocular.") },
  { id: "objective", x: 0.30, y: 0.557, name: () => L("Objective lens", "Lente objetivo"),
    fn: () => L("The lens you point at your sample (the object). A turning nosepiece holds several: ×4, ×10, ×40.", "La lente que apuntas hacia tu muestra (el objeto). Un revólver giratorio sostiene varias: ×4, ×10, ×40."),
    clue: () => L("The lens that you point at your sample (the object).", "La lente que apuntas hacia tu muestra (el objeto).") },
  { id: "coarse", x: 0.47, y: 0.284, name: () => L("Coarse focus knob", "Tornillo macrométrico"),
    fn: () => L("The big knob. You turn it to get the object partly in focus, using low power only.", "El tornillo grande. Lo giras para enfocar el objeto a medias, solo con el aumento bajo."),
    clue: () => L("You adjust this to get the object partly in focus.", "Lo ajustas para que el objeto quede enfocado a medias.") },
  { id: "fine", x: 0.57, y: 0.44, name: () => L("Fine focus knob", "Tornillo micrométrico"),
    fn: () => L("You carefully adjust this smaller knob to get the object fully in focus. On this older model it sits lower on the arm.", "Lo ajustas con cuidado para que el objeto quede totalmente enfocado. En este modelo antiguo está más abajo en el brazo."),
    clue: () => L("You carefully adjust this control to get the object fully in focus.", "Lo ajustas con cuidado para que el objeto quede totalmente enfocado.") },
  { id: "stage", x: 0.20, y: 0.628, name: () => L("Stage", "Platina"),
    fn: () => L("The flat platform that holds the slide. Clips keep the sample in place. It has a hole for light to pass through.", "La plataforma plana que sostiene la preparación. Las pinzas la sujetan. Tiene un agujero para que pase la luz."),
    clue: () => L("The stage has clips that can hold the sample in place.", "La platina tiene pinzas que sujetan la muestra.") },
  { id: "mirror", x: 0.32, y: 0.838, name: () => L("Mirror (light source)", "Espejo (fuente de luz)"),
    fn: () => L("It can be adjusted to shine more light up through the sample. Newer microscopes use a built-in lamp instead.", "Se orienta para enviar más luz hacia la muestra. Los microscopios nuevos usan una lámpara incorporada."),
    clue: () => L("The mirror can be adjusted to shine more light up to the sample.", "El espejo se orienta para enviar más luz hacia la muestra.") },
  { id: "base", x: 0.58, y: 0.924, name: () => L("Base", "Base"),
    fn: () => L("The sturdy bottom part that sits on the table and keeps the microscope steady.", "La parte inferior y firme que se apoya en la mesa y mantiene estable el microscopio."),
    clue: () => L("The sturdy bottom part that sits on the table.", "La parte inferior y firme que se apoya en la mesa.") },
  { id: "arm", x: 0.79, y: 0.51, name: () => L("Arm (body)", "Brazo (cuerpo)"),
    fn: () => L("The solid curved part that you carry the microscope by. Hold the arm with one hand and support the base with the other.", "La parte sólida y curva por la que se lleva el microscopio. Sujeta el brazo con una mano y apoya la base con la otra."),
    clue: () => L("The solid part that you can carry the microscope by.", "La parte sólida por la que puedes llevar el microscopio.") },
];

export const OBJ = [{ x: 4, c: "#e0644b" }, { x: 10, c: "#e8b830" }, { x: 40, c: "#3fae5a" }, { x: 100, c: "#2d7fd6" }];
export const OBJ_NAME = { 4: () => L("scanning", "exploración"), 10: () => L("low power", "aumento bajo"), 40: () => L("high power", "aumento alto"), 100: () => L("oil immersion", "inmersión en aceite") };
