/**
 * Capa de flujo de sesión: orquesta reglas de negocio sin tocar el DOM.
 * Usa el motor (gran-escala-engine.js) y devuelve estados listos para la vista.
 */
import { buildArt14OnlyResult, evaluateGranEscala } from "./gran-escala-engine.js";

/**
 * Resuelve el estado de la evaluación según art. 14 y MTGE.
 *
 * @param {{ art14Direct: boolean, art14Motivo: string, selections: Record<string, string> }} input
 * @returns {{ status: 'pending', reason: string } | { status: 'ready', mode: 'art14'|'mtge', result: object }}
 */
export function resolveGranEscalaSession(input) {
  const { art14Direct, art14Motivo, selections } = input;

  if (art14Direct) {
    const motivo = String(art14Motivo ?? "").trim();
    if (!motivo) {
      return { status: "pending", reason: "art14_motivo_required" };
    }
    return { status: "ready", mode: "art14", result: buildArt14OnlyResult(motivo) };
  }

  const result = evaluateGranEscala(selections);
  if (!result.complete) {
    return { status: "pending", reason: "mtge_incomplete" };
  }
  return { status: "ready", mode: "mtge", result };
}
