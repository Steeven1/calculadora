/**
 * =============================================================================
 * ARCHIVO: criteria-config.js
 * PROPÓSITO: Única fuente de verdad para textos normativos, umbrales y tabla de
 *            criterios/opciones/puntajes del MTGE. El motor (gran-escala-engine.js)
 *            y la interfaz (app.js) solo leen estos datos; así puedes cambiar la
 *            normativa sin tocar la lógica de evaluación.
 * =============================================================================
 *
 * Referencias legales (orientativas):
 *   - Arts. 8.1 a 8.6: variables del Modelo Técnico de Gran Escala (MTGE).
 *   - Art. 14: supuestos de calificación directa / validación (pueden imponer
 *     “gran escala” sin depender solo de la suma; ver opción en app.js/HTML).
 *
 * Campos por criterio en CRITERIA[]:
 *   - articleRef: etiqueta del artículo (p. ej. "8.3") para UI y reportes.
 *   - key: identificador interno estable (no cambiar a la ligera: rompe guardados
 *     si en el futuro persistes respuestas).
 *   - title / description: textos mostrados al usuario.
 *   - options[]: cada opción tiene:
 *       - id: valor del <select> (único dentro del criterio).
 *       - label: texto visible.
 *       - score: puntos que suman al total MTGE.
 *       - forceGranEscala (opcional): si es true, la opción activa “gran escala”
 *         aunque la suma total sea baja (condición crítica del MTGE).
 *
 * Umbral numérico:
 *   - granEscalaMinTotal: a partir de esta suma (inclusive) → gran escala por MTGE.
 *   - normalMaxTotal: debe ser granEscalaMinTotal − 1; el motor usa
 *     totalScore > normalMaxTotal como equivalente a totalScore >= granEscalaMinTotal.
 */

/** Textos fijos para pies de página, reportes HTML y recordatorios al usuario. */
export const NORMATIVE_REF = {
  shortTitle: "Norma General — Tratamiento de datos personales a gran escala (SPDP)",
  criteriaArticles: "Arts. 8.1 a 8.6 (variables del MTGE)",
  validationArticle: "Art. 14 (supuestos de calificación directa y validación)",
  disclaimer:
    "Los textos legales oficiales prevalecen sobre esta calculadora. Ajuste puntajes y redacción en este archivo si el Registro Oficial difiere."
};

/**
 * Umbrales del MTGE (suma de los seis criterios arts. 8.1–8.6).
 * Alinear siempre con el Registro Oficial / Excel oficial de la SPDP.
 */
export const DECISION_RULES = {
  granEscalaMinTotal: 6,
  normalMaxTotal: 5
};

/** Etiquetas del veredicto final mostradas en badge y reporte. */
export const VERDICT_LABELS = {
  normal: "Tratamiento Normal",
  granEscala: "Tratamiento a Gran Escala"
};

/**
 * Ejemplos orientativos de supuestos que suelen figurar en el **art. 14** (calificación directa).
 * No es lista cerrada: sustituya por el detalle del art. 14 del texto oficial.
 */
export const ARTICULO_14_SUPUESTOS_ORIENTATIVOS = [
  "Tratamiento de datos de salud o de categorías especiales en supuestos previstos en la norma.",
  "Datos biométricos, geolocalización o videovigilancia / monitoreo sistemático en espacios de acceso público, según el texto legal.",
  "Transferencias sistemáticas de datos personales (nacionales o transfronterizas) cuando así lo disponga el art. 14.",
  "Tratamientos con perfilamiento automatizado que produzca efectos jurídicos o afecte significativamente a los titulares, si el art. 14 lo contempla.",
  "Otros supuestos de **calificación directa** que indique el art. 14 vigente (revise el PDF oficial)."
];

/**
 * @typedef {{ id: string, label: string, score: number, forceGranEscala?: boolean }} CriterionOption
 * @typedef {{ key: string, articleRef: string, title: string, description?: string, options: CriterionOption[] }} Criterion
 */

/**
 * Lista ordenada de criterios MTGE. El orden define el orden en el formulario.
 * Orden habitual: titulares → volumen → categorías → frecuencia → permanencia → alcance.
 * @type {Criterion[]}
 */
export const CRITERIA = [
  /* --- Art. 8.1: titulares afectados (ventana temporal según norma) --- */
  {
    articleRef: "8.1",
    key: "titulares",
    title: "Número de titulares afectados",
    description:
      "Art. 8.1 — Volumen de titulares cuyos datos se tratan (referencia habitual: ventana de 12 meses en la normativa técnica).",
    options: [
      { id: "a", label: "Menos de 1.000", score: 1 },
      { id: "b", label: "Entre 1.000 y 10.000", score: 2 },
      { id: "c", label: "Entre 10.000 y 100.000", score: 3 },
      {
        id: "d",
        label: "Más de 100.000 o proporción significativa de la población",
        score: 4,
        forceGranEscala: true
      }
    ]
  },
  /* --- Art. 8.2: volumen y sensibilidad / variedad del tratamiento --- */
  {
    articleRef: "8.2",
    key: "volumen",
    title: "Volumen de datos o variedad de datos tratados",
    description: "Art. 8.2 — Magnitud y complejidad del volumen de datos personales tratados.",
    options: [
      { id: "a", label: "Datos básicos de contacto", score: 1 },
      { id: "b", label: "Datos de comportamiento o perfiles estándar", score: 2 },
      {
        id: "c",
        label: "Categorías especiales de datos (salud, biométricos) o perfilamiento exhaustivo",
        score: 4,
        forceGranEscala: true
      }
    ]
  },
  /* --- Art. 8.3: cantidad/tipos de categorías de datos (taxonomía) --- */
  {
    articleRef: "8.3",
    key: "categoriasDatos",
    title: "Categorías de datos personales tratados",
    description:
      "Art. 8.3 — Tipos y categorías de datos (distinto del solo volumen bruto del art. 8.2): taxonomías, fichas y sensibilidad agregada.",
    options: [
      { id: "a", label: "Una o dos categorías (p. ej. identificación y contacto)", score: 1 },
      {
        id: "b",
        label: "Tres a cinco categorías habituales (laborales, económicos, preferencias, navegación, etc.)",
        score: 2
      },
      {
        id: "c",
        label: "Seis a diez categorías o fichas transversales (CRM, RR.HH., facturación, soporte, etc.)",
        score: 3
      },
      {
        id: "d",
        label: "Más de diez categorías o tratamiento integral multicanal con taxonomías amplias",
        score: 4
      }
    ]
  },
  /* --- Art. 8.4: frecuencia de operaciones sobre los datos --- */
  {
    articleRef: "8.4",
    key: "frecuencia",
    title: "Frecuencia del tratamiento",
    description: "Art. 8.4 — Periodicidad de recabación, actualización, consulta o elaboración sobre los titulares.",
    options: [
      { id: "a", label: "Puntual o esporádica (casos aislados)", score: 1 },
      { id: "b", label: "Periódica baja (trimestral o mensual)", score: 2 },
      { id: "c", label: "Frecuente (semanal, diaria o por lotes diarios)", score: 3 },
      {
        id: "d",
        label: "Continua, en tiempo casi real o mediante flujos automatizados permanentes",
        score: 4
      }
    ]
  },
  /* --- Art. 8.5: permanencia o duración del tratamiento --- */
  {
    articleRef: "8.5",
    key: "duracion",
    title: "Duración o permanencia del tratamiento",
    description: "Art. 8.5 — Continuidad temporal del tratamiento respecto de los titulares.",
    options: [
      { id: "a", label: "Acontecimiento aislado o temporal", score: 1 },
      { id: "b", label: "Tratamiento regular durante un periodo corto (< 1 año)", score: 2 },
      { id: "c", label: "Tratamiento sistemático, permanente o a largo plazo", score: 3 }
    ]
  },
  /* --- Art. 8.6: alcance geográfico del tratamiento --- */
  {
    articleRef: "8.6",
    key: "alcance",
    title: "Alcance geográfico del tratamiento",
    description: "Art. 8.6 — Extensión territorial o transfronteriza del tratamiento.",
    options: [
      { id: "a", label: "Local / municipal", score: 1 },
      { id: "b", label: "Regional / provincial", score: 2 },
      { id: "c", label: "Nacional o internacional", score: 3 }
    ]
  }
];

/** Número de criterios (6); útil para mensajes “complete los N criterios”. */
export const CRITERIA_COUNT = CRITERIA.length;
