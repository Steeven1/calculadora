/**
 * =============================================================================
 * ARCHIVO: report-html.js
 * PROPÓSITO: Generar un documento HTML completo (con CSS embebido) que resume
 *            la evaluación: (A) solo art. 14 con motivo, o (B) MTGE arts. 8.1–8.6.
 * =============================================================================
 */

import { CRITERIA_COUNT, DECISION_RULES, NORMATIVE_REF, VERDICT_LABELS } from "./criteria-config.js";
import { buildArt14OnlyResult, buildJustificationText, evaluateGranEscala } from "./gran-escala-engine.js";

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function justificationToHtml(text) {
  return text
    .split("\n\n")
    .map((para) => {
      const withBold = escapeHtml(para).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return `<p>${withBold}</p>`;
    })
    .join("");
}

/**
 * @param {Record<string, string>} selections — claves MTGE (vacío si solo art. 14)
 * @param {{ art14OnlyPath?: boolean, art14Motivo?: string }} [evalOptions]
 * @returns {string|null} null si faltan datos obligatorios para el modo elegido
 */
export function buildReportHtmlDocument(selections, evalOptions = {}) {
  let result;

  if (evalOptions.art14OnlyPath) {
    const m = String(evalOptions.art14Motivo || "").trim();
    if (!m) return null;
    result = buildArt14OnlyResult(m);
  } else {
    result = evaluateGranEscala(selections);
    if (!result.complete) return null;
  }

  const generated = new Date();
  const fecha = generated.toLocaleString("es-EC", {
    dateStyle: "long",
    timeStyle: "short"
  });

  const verdictClass = result.isGranEscala ? "verdict--alert" : "verdict--ok";
  const justificationHtml = justificationToHtml(buildJustificationText(result));

  const sharedStyles = `
    :root { --text: #1a2332; --muted: #5c6677; --border: #d5dce6; --ok: #0d6b3d; --ok-bg: #e6f4ec; --alert: #9b1c1c; --alert-bg: #fceaea; }
    body { font-family: "Segoe UI", system-ui, sans-serif; margin: 0; padding: 1.25rem 1rem 2rem; color: var(--text); background: #eef1f6; line-height: 1.45; }
    .sheet { max-width: 760px; margin: 0 auto; background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 1.25rem 1.35rem; box-shadow: 0 8px 24px rgba(22,34,51,0.08); }
    h1 { margin: 0 0 0.35rem 0; font-size: 1.35rem; }
    .meta { color: var(--muted); font-size: 0.88rem; margin: 0 0 1.25rem 0; }
    h2 { margin: 1.25rem 0 0.5rem 0; font-size: 1rem; border-bottom: 1px solid var(--border); padding-bottom: 0.35rem; }
    table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    th, td { border: 1px solid var(--border); padding: 0.45rem 0.55rem; text-align: left; vertical-align: top; }
    th { background: #f4f6f9; }
    td.num { text-align: center; }
    .crit { color: var(--alert); font-weight: 600; }
    .sum-box { margin: 1rem 0; padding: 0.85rem 1rem; background: #e8f1fa; border-radius: 10px; border: 1px solid #cfe2f5; }
    .sum-box .label { font-size: 0.88rem; color: var(--muted); }
    .sum-box .value { font-size: 2rem; font-weight: 800; color: #0f4c81; margin-top: 0.2rem; }
    .verdict { margin: 1rem 0; padding: 1rem 1.1rem; border-radius: 10px; font-size: 1.1rem; font-weight: 700; }
    .verdict--ok { background: var(--ok-bg); color: var(--ok); border: 1px solid #b8dcc8; }
    .verdict--alert { background: var(--alert-bg); color: var(--alert); border: 1px solid #f0b4b4; }
    .justif { font-size: 0.88rem; }
    .justif p { margin: 0 0 0.6rem 0; }
    .note { font-size: 0.86rem; margin: 0.75rem 0; }
    .note--warn { color: var(--alert); }
    .motivo-box { margin: 1rem 0; padding: 1rem 1.1rem; background: #f8fbff; border: 1px solid #cfe2f5; border-radius: 10px; }
    .motivo-box h2 { margin-top: 0; border-bottom: none; }
    .motivo-text { white-space: pre-wrap; word-break: break-word; margin: 0; font-size: 0.9rem; }
    footer { margin-top: 1.5rem; padding-top: 0.75rem; border-top: 1px solid var(--border); font-size: 0.78rem; color: var(--muted); }
    @media print { body { background: #fff; } .sheet { box-shadow: none; border: none; } }
  `;

  if (result.art14OnlyPath) {
    const art14Line =
      "<p><strong>Art. 14:</strong> Sí — evaluación por calificación directa / validación. El motivo declarado por el responsable figura a continuación.</p>";
    const motivoHtml = `<div class="motivo-box"><h2>Motivo / supuesto del art. 14</h2><p class="motivo-text">${escapeHtml(
      result.art14Motivo
    )}</p></div>`;
    const notes =
      '<p class="note note--warn"><strong>Nota:</strong> En este reporte no se aplicó la sumatoria del MTGE (arts. 8.1 a 8.6); solo la vía del art. 14.</p>';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reporte — Tratamiento a Gran Escala (art. 14)</title>
  <style>${sharedStyles}</style>
</head>
<body>
  <div class="sheet">
    <h1>Reporte — Evaluación de tratamiento a gran escala (vía art. 14)</h1>
    <p class="meta">Generado: ${escapeHtml(fecha)} · ${escapeHtml(NORMATIVE_REF.shortTitle)}. Referencia: ${escapeHtml(
      NORMATIVE_REF.validationArticle
    )}.</p>
    <p class="meta">Este documento refleja la opción de calificación conforme al <strong>art. 14</strong>, sin tabla de puntajes del MTGE.</p>

    ${art14Line}
    ${motivoHtml}

    <h2>Modelo MTGE (arts. 8.1 a 8.6)</h2>
    <p><strong>No aplicado</strong> en esta evaluación: el usuario indicó tratamiento a gran escala exclusivamente por el art. 14.</p>

    <div class="sum-box">
      <div class="label">Sumatoria MTGE (${CRITERIA_COUNT} variables)</div>
      <div class="value">N/A</div>
    </div>

    ${notes}

    <h2>Resultado</h2>
    <div class="verdict ${verdictClass}">${escapeHtml(result.verdictLabel)}</div>

    <h2>Justificación</h2>
    <div class="justif">${justificationHtml}</div>

    <footer>${escapeHtml(NORMATIVE_REF.disclaimer)}</footer>
  </div>
</body>
</html>`;
  }

  const rows = result.breakdown
    .map(
      (row) => `
      <tr>
        <td class="num">${escapeHtml(row.articleRef)}</td>
        <td>${escapeHtml(row.criterionTitle)}</td>
        <td>${escapeHtml(row.optionLabel)}</td>
        <td class="num">${escapeHtml(String(row.score))}</td>
        <td>${row.forced ? '<span class="crit">Sí</span>' : "—"}</td>
      </tr>`
    )
    .join("");

  let notes = "";
  if (result.optionCriticalTriggered) {
    notes +=
      '<p class="note note--warn"><strong>Condición crítica MTGE:</strong> alguna opción de los arts. 8.1 u 8.2 (u otra marcada en configuración) fuerza tratamiento a gran escala.</p>';
  }

  const art14Line =
    "<p><strong>Art. 14 (validación):</strong> No — evaluación basada solo en criterios MTGE arts. 8.1–8.6.</p>";

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reporte — Tratamiento a Gran Escala (SPDP)</title>
  <style>${sharedStyles}</style>
</head>
<body>
  <div class="sheet">
    <h1>Reporte — Evaluación de tratamiento a gran escala</h1>
    <p class="meta">Generado: ${escapeHtml(fecha)} · ${escapeHtml(NORMATIVE_REF.shortTitle)}. Criterios MTGE: ${escapeHtml(
    NORMATIVE_REF.criteriaArticles
  )}. Validación: ${escapeHtml(NORMATIVE_REF.validationArticle)}.</p>
    <p class="meta">Regla de suma: puntaje total ≤ ${DECISION_RULES.normalMaxTotal} → ${escapeHtml(
    VERDICT_LABELS.normal
  )}; puntaje total ≥ ${DECISION_RULES.granEscalaMinTotal} → ${escapeHtml(
    VERDICT_LABELS.granEscala
  )}, además de condiciones críticas en opciones del MTGE.</p>

    ${art14Line}

    <h2>Selección realizada (MTGE)</h2>
    <table>
      <thead>
        <tr>
          <th>Art.</th>
          <th>Criterio</th>
          <th>Opción seleccionada</th>
          <th>Puntaje</th>
          <th>Crítico</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="sum-box">
      <div class="label">Sumatoria MTGE (arts. 8.1 a 8.6) — ${CRITERIA_COUNT} variables</div>
      <div class="value">${escapeHtml(String(result.totalScore))}</div>
    </div>

    ${notes}

    <h2>Resultado</h2>
    <div class="verdict ${verdictClass}">${escapeHtml(result.verdictLabel)}</div>

    <h2>Justificación</h2>
    <div class="justif">${justificationHtml}</div>

    <footer>${escapeHtml(NORMATIVE_REF.disclaimer)}</footer>
  </div>
</body>
</html>`;
}

export function openReportInNewWindow(selections, evalOptions) {
  const html = buildReportHtmlDocument(selections, evalOptions);
  if (!html) {
    return false;
  }
  const win = window.open("", "ReporteTratamientoGranEscala", "width=820,height=940,scrollbars=yes");
  if (!win) {
    return false;
  }
  win.opener = null;
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  return true;
}

export function downloadReportHtml(selections, evalOptions) {
  const html = buildReportHtmlDocument(selections, evalOptions);
  if (!html) {
    return false;
  }
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reporte-tratamiento-gran-escala-${stamp}.html`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}
