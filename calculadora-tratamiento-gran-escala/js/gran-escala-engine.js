/**
 * =============================================================================
 * ARCHIVO: gran-escala-engine.js
 * Lógica pura: (A) MTGE arts. 8.1–8.6 solamente, o (B) vía exclusiva art. 14
 * con motivo declarado (sin puntaje MTGE en el reporte).
 * =============================================================================
 */

import { CRITERIA, DECISION_RULES, VERDICT_LABELS } from "./criteria-config.js";

/**
 * Resultado cuando el usuario elige **solo art. 14** (calificación directa):
 * no hay filas MTGE ni suma; el veredicto es siempre gran escala.
 *
 * @param {string} motivoText — texto obligatorio que explica el supuesto del art. 14
 */
export function buildArt14OnlyResult(motivoText) {
  const art14Motivo = String(motivoText).trim();
  return {
    complete: true,
    art14OnlyPath: true,
    art14Motivo,
    totalScore: null,
    isGranEscala: true,
    optionCriticalTriggered: false,
    art14Direct: true,
    exceedsThreshold: false,
    overrideTriggered: true,
    overrideReasons: [],
    breakdown: [],
    verdictKey: "granEscala",
    verdictLabel: VERDICT_LABELS.granEscala
  };
}

/**
 * Evalúa únicamente el **MTGE** (arts. 8.1–8.6). El art. 14 como primer paso
 * se gestiona en la UI con `buildArt14OnlyResult`; aquí no se mezcla.
 *
 * @param {Record<string, string>} selections — clave criterio → id opción
 * @returns {{ complete: false } | object} complete false si falta algún select
 */
export function evaluateGranEscala(selections) {
  const breakdown = [];
  const overrideReasons = [];
  let totalScore = 0;
  let optionCriticalTriggered = false;

  for (const criterion of CRITERIA) {
    const optionId = selections[criterion.key];
    if (!optionId) {
      return { complete: false };
    }
    const opt = criterion.options.find((o) => o.id === optionId);
    if (!opt) {
      return { complete: false };
    }

    totalScore += opt.score;
    const displayLine = `Art. ${criterion.articleRef} — ${criterion.title}`;

    breakdown.push({
      criterionKey: criterion.key,
      articleRef: criterion.articleRef,
      criterionTitle: criterion.title,
      displayLine,
      optionLabel: opt.label,
      score: opt.score,
      forced: Boolean(opt.forceGranEscala)
    });

    if (opt.forceGranEscala) {
      optionCriticalTriggered = true;
      overrideReasons.push(
        `${displayLine}: condición crítica del MTGE por la opción seleccionada ("${opt.label}").`
      );
    }
  }

  const exceedsThreshold = totalScore > DECISION_RULES.normalMaxTotal;
  const isGranEscala = optionCriticalTriggered || exceedsThreshold;

  return {
    complete: true,
    art14OnlyPath: false,
    art14Motivo: "",
    art14Direct: false,
    totalScore,
    isGranEscala,
    optionCriticalTriggered,
    overrideTriggered: optionCriticalTriggered,
    overrideReasons,
    exceedsThreshold,
    breakdown,
    verdictKey: isGranEscala ? "granEscala" : "normal",
    verdictLabel: isGranEscala ? VERDICT_LABELS.granEscala : VERDICT_LABELS.normal
  };
}

/**
 * Texto de justificación para la UI o el reporte HTML.
 */
export function buildJustificationText(result) {
  if (!result.complete) {
    return "";
  }

  /** Ruta exclusiva art. 14: párrafos centrados en el motivo declarado. */
  if (result.art14OnlyPath) {
    const parts = [];
    parts.push(
      "Se utilizó la vía de **calificación directa** conforme al **art. 14** de la Norma General. **No se aplicó el puntaje del MTGE** (arts. 8.1 a 8.6) en esta evaluación."
    );
    parts.push(`**Motivo / supuesto del art. 14 declarado:**\n\n${result.art14Motivo}`);
    parts.push(
      "El resultado orientativo es **tratamiento a gran escala** por esa vía. Contrastar siempre con el texto oficial del art. 14 y del Registro Oficial."
    );
    return parts.join("\n\n");
  }

  if (result.breakdown === undefined) {
    return "";
  }

  const parts = [];
  parts.push(
    `Puntaje total MTGE (**arts. 8.1 a 8.6**): **${result.totalScore}**. Tratamiento **normal** si la suma es ≤ **${DECISION_RULES.normalMaxTotal}**; **a gran escala** si la suma es ≥ **${DECISION_RULES.granEscalaMinTotal}**, o si aplica una **condición crítica** en las opciones del MTGE.`
  );

  if (result.optionCriticalTriggered) {
    parts.push(
      "Se activó una **condición crítica** en las opciones del MTGE (p. ej. titulares en el tramo máximo o datos especiales / perfilamiento exhaustivo en volumen y variedad), lo que orienta a **gran escala** aunque la suma sea baja."
    );
    result.overrideReasons.forEach((r) => parts.push(r));
  } else if (result.exceedsThreshold) {
    parts.push(
      `La suma alcanza o supera el umbral de **${DECISION_RULES.granEscalaMinTotal}** puntos; el MTGE orienta a **tratamiento a gran escala**.`
    );
  }

  if (!result.isGranEscala) {
    parts.push(
      "No se superó el umbral del MTGE ni se activó condición crítica en las opciones; el resultado orientativo es **tratamiento normal**."
    );
  }

  parts.push(
    "Verifique siempre el texto de la **Norma General** (MTGE, arts. 8.1–8.6 y **art. 14**) y la versión publicada en el Registro Oficial."
  );

  return parts.join("\n\n");
}
