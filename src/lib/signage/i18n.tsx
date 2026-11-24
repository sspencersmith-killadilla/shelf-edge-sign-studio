import { createContext, useContext } from "react";
export type Lang = "en" | "es" | "fr";
export const LANGS: { v: Lang; l: string }[] = [{ v: "en", l: "English" }, { v: "es", l: "Español" }, { v: "fr", l: "Français" }];
const D: Record<Exclude<Lang, "en">, Record<string, string>> = {
  es: { Content: "Contenido", Style: "Estilo", Size: "Tamaño", Saved: "Guardados", Print: "Imprimir", "Export PDF": "Exportar PDF", "Export PNG (300 DPI)": "Exportar PNG (300 DPI)", Guides: "Guías",
    "Collection preset": "Colección", "Library header": "Encabezado de biblioteca", "Section title": "Título de sección", "Call number range": "Rango de signaturas", "Sub-ranges / genres": "Subrangos / géneros", "Aisle / bay": "Pasillo", "Floor / zone": "Piso / zona", "Direction arrow": "Flecha", "Footer note": "Nota al pie", Icon: "Icono", "Text direction": "Dirección del texto", "QR code link": "Enlace de código QR", "Braille preview": "Vista previa en braille",
    Template: "Plantilla", Colors: "Colores", "Heading font": "Fuente de títulos", "Body / call-number font": "Fuente de texto", "Title size": "Tamaño del título", "Call number size": "Tamaño de signatura", "Body size": "Tamaño del texto", Alignment: "Alineación", "Background image": "Imagen de fondo",
    Units: "Unidades", "Print size": "Tamaño de impresión", Orientation: "Orientación", Padding: "Margen", "Border / frame": "Borde / marco", "Print shop": "Imprenta", "Save current sign": "Guardar letrero", "Back side": "Reverso" },
  fr: { Content: "Contenu", Style: "Style", Size: "Taille", Saved: "Enregistrés", Print: "Imprimer", "Export PDF": "Exporter PDF", "Export PNG (300 DPI)": "Exporter PNG (300 DPI)", Guides: "Repères",
    "Collection preset": "Collection", "Library header": "En-tête de bibliothèque", "Section title": "Titre de section", "Call number range": "Plage de cotes", "Sub-ranges / genres": "Sous-plages / genres", "Aisle / bay": "Allée", "Floor / zone": "Étage / zone", "Direction arrow": "Flèche", "Footer note": "Note de bas", Icon: "Icône", "Text direction": "Sens du texte", "QR code link": "Lien du code QR", "Braille preview": "Aperçu braille",
    Template: "Modèle", Colors: "Couleurs", "Heading font": "Police des titres", "Body / call-number font": "Police du texte", "Title size": "Taille du titre", "Call number size": "Taille des cotes", "Body size": "Taille du texte", Alignment: "Alignement", "Background image": "Image de fond",
    Units: "Unités", "Print size": "Format d'impression", Orientation: "Orientation", Padding: "Marge", "Border / frame": "Bordure / cadre", "Print shop": "Imprimeur", "Save current sign": "Enregistrer le panneau", "Back side": "Verso" },
};
export const translate = (lang: Lang, s: string) => (lang === "en" ? s : D[lang][s] ?? s);
export const LangContext = createContext<Lang>("en");
export const useT = () => { const l = useContext(LangContext); return (s: string) => translate(l, s); };
