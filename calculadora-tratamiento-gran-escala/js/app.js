/**
 * =============================================================================
 * ARCHIVO: app.js
 * Vista: lee el DOM, delega reglas de negocio en gran-escala-flow.js + motor,
 *        pinta resultado y enlaza reportes.
 * =============================================================================
 */

import {
  ARTICULO_14_SUPUESTOS_ORIENTATIVOS,
  CRITERIA,
  CRITERIA_COUNT,
  DECISION_RULES,
  VERDICT_LABELS
} from "./criteria-config.js";
import { buildJustificationText } from "./gran-escala-engine.js";
import { resolveGranEscalaSession } from "./gran-escala-flow.js";
import { downloadReportHtml, openReportInNewWindow } from "./report-html.js";

const formRoot = document.getElementById("criteria-form-root");
const mtgeSection = document.getElementById("mtge-section");
const art14MotivoWrap = document.getElementById("art14-motivo-wrap");
const art14MotivoInput = document.getElementById("art14-motivo");

const resultPanel = document.getElementById("result-panel");
const verdictBadge = document.getElementById("verdict-badge");
const scoreValue = document.getElementById("score-value");
const justificationEl = document.getElementById("justification-text");
const breakdownEl = document.getElementById("breakdown-list");

const btnReportWindow = document.getElementById("btn-report-window");
const btnReportDownload = document.getElementById("btn-report-download");
const art14ExamplesList = document.getElementById("art14-examples-list");

function readArt14Direct() {
  const el = document.querySelector('input[name="art14Direct"]:checked');
  return Boolean(el && el.value === "yes");
}

function getReportEvalOptions() {
  if (readArt14Direct()) {
    return {
      art14OnlyPath: true,
      art14Motivo: art14MotivoInput ? art14MotivoInput.value : ""
    };
  }
  return { art14OnlyPath: false };
}

/**
 * Visibilidad y accesibilidad según rama art. 14:
 * - Sí: oculta MTGE para lectores de pantalla (aria-hidden) y deshabilita selects.
 * - No: oculta el bloque de motivo (aria-hidden) y muestra MTGE.
 */
function applyArt14BranchUi(art14Yes) {
  if (!mtgeSection || !art14MotivoWrap) return;

  if (art14Yes) {
    mtgeSection.classList.add("hidden");
    mtgeSection.setAttribute("aria-hidden", "true");
    art14MotivoWrap.classList.remove("hidden");
    art14MotivoWrap.setAttribute("aria-hidden", "false");
  } else {
    mtgeSection.classList.remove("hidden");
    mtgeSection.setAttribute("aria-hidden", "false");
    art14MotivoWrap.classList.add("hidden");
    art14MotivoWrap.setAttribute("aria-hidden", "true");
  }

  formRoot.querySelectorAll("select").forEach((sel) => {
    sel.disabled = art14Yes;
  });
  mtgeSection.classList.toggle("mtge-section--disabled", art14Yes);
}

function populateArt14Examples() {
  if (!art14ExamplesList) return;
  art14ExamplesList.innerHTML = "";
  ARTICULO_14_SUPUESTOS_ORIENTATIVOS.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    art14ExamplesList.appendChild(li);
  });
}

function renderForm() {
  formRoot.innerHTML = "";
  CRITERIA.forEach((criterion) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "criterion-fieldset";
    fieldset.dataset.criterionKey = criterion.key;

    const legend = document.createElement("legend");
    legend.className = "criterion-legend";
    legend.textContent = `Art. ${criterion.articleRef} — ${criterion.title}`;

    const desc = document.createElement("p");
    desc.className = "criterion-desc";
    desc.textContent = criterion.description || "";

    const row = document.createElement("div");
    row.className = "select-row";

    const label = document.createElement("label");
    label.className = "visually-hidden";
    label.setAttribute("for", `select-${criterion.key}`);
    label.textContent = `Selección: Art. ${criterion.articleRef}`;

    const select = document.createElement("select");
    select.id = `select-${criterion.key}`;
    select.name = criterion.key;
    select.required = true;
    select.setAttribute("aria-label", `Art. ${criterion.articleRef} — ${criterion.title}`);

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = "— Seleccione una opción —";
    select.appendChild(placeholder);

    criterion.options.forEach((opt) => {
      const o = document.createElement("option");
      o.value = opt.id;
      o.textContent = `${opt.label} (Puntaje: ${opt.score})`;
      o.dataset.score = String(opt.score);
      if (opt.forceGranEscala) {
        o.dataset.critical = "true";
      }
      select.appendChild(o);
    });

    row.appendChild(label);
    row.appendChild(select);
    fieldset.appendChild(legend);
    if (criterion.description) {
      fieldset.appendChild(desc);
    }
    fieldset.appendChild(row);
    formRoot.appendChild(fieldset);

    select.addEventListener("change", updateResults);
  });
}

function readSelections() {
  /** @type {Record<string, string>} */
  const out = {};
  CRITERIA.forEach((c) => {
    const el = formRoot.querySelector(`select[name="${c.key}"]`);
    out[c.key] = el ? el.value : "";
  });
  return out;
}

function renderMarkdownishToHtml(text) {
  return text
    .split("\n\n")
    .map((para) => {
      const escaped = escapeHtml(para);
      const withBold = escaped.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return `<p>${withBold}</p>`;
    })
    .join("");
}

function updateResults() {
  const art14Yes = readArt14Direct();
  applyArt14BranchUi(art14Yes);

  const session = resolveGranEscalaSession({
    art14Direct: art14Yes,
    art14Motivo: art14MotivoInput ? art14MotivoInput.value : "",
    selections: readSelections()
  });

  if (session.status === "pending") {
    resultPanel.classList.remove("verdict--normal", "verdict--gran-escala");
    resultPanel.classList.add("verdict--pending");
    btnReportWindow.disabled = true;
    btnReportDownload.disabled = true;
    breakdownEl.innerHTML = "";

    if (session.reason === "art14_motivo_required") {
      verdictBadge.textContent = "Indique el motivo del art. 14";
      verdictBadge.className = "verdict-badge verdict-badge--pending";
      scoreValue.textContent = "—";
      justificationEl.innerHTML =
        '<p class="muted">Ha marcado «Sí» en el art. 14. Escriba el <strong>motivo o supuesto</strong> en el cuadro de texto para ver la justificación y poder generar el reporte.</p>';
      return;
    }

    verdictBadge.textContent = `Complete los ${CRITERIA_COUNT} criterios MTGE`;
    verdictBadge.className = "verdict-badge verdict-badge--pending";
    scoreValue.textContent = "—";
    justificationEl.innerHTML = `<p class="muted">Seleccione una opción en <strong>cada</strong> criterio de los arts. 8.1 a 8.6. Todos son obligatorios para el resultado y el reporte cuando el art. 14 está en «No».</p>`;
    return;
  }

  const { result } = session;
  btnReportWindow.disabled = false;
  btnReportDownload.disabled = false;

  resultPanel.classList.remove("verdict--pending", "verdict--normal", "verdict--gran-escala");
  if (result.isGranEscala) {
    resultPanel.classList.add("verdict--gran-escala");
    verdictBadge.className = "verdict-badge verdict-badge--alert";
  } else {
    resultPanel.classList.add("verdict--normal");
    verdictBadge.className = "verdict-badge verdict-badge--ok";
  }

  verdictBadge.textContent = result.verdictLabel;

  if (session.mode === "art14") {
    scoreValue.textContent = "N/A";
    const meta = document.createElement("p");
    meta.className = "score-meta muted";
    meta.innerHTML =
      "Evaluación por <strong>art. 14</strong> exclusivamente. <strong>No</strong> se aplicó la sumatoria del MTGE (arts. 8.1–8.6) en este resultado.";
    justificationEl.innerHTML =
      renderMarkdownishToHtml(buildJustificationText(result)) + meta.outerHTML;

    breakdownEl.innerHTML = "";
    const ul = document.createElement("ul");
    ul.className = "breakdown-ul";
    const li = document.createElement("li");
    li.className = "bd-art14-only";
    li.innerHTML =
      '<span class="bd-title">MTGE (arts. 8.1 a 8.6)</span><br /><span class="bd-opt muted">No aplicado en esta evaluación (vía art. 14).</span>';
    ul.appendChild(li);
    breakdownEl.appendChild(ul);
    return;
  }

  scoreValue.textContent = String(result.totalScore);
  const meta = document.createElement("p");
  meta.className = "score-meta muted";
  meta.innerHTML = `Solo MTGE (arts. 8.1–8.6): normal si suma ≤ <strong>${DECISION_RULES.normalMaxTotal}</strong>; gran escala si suma ≥ <strong>${DECISION_RULES.granEscalaMinTotal}</strong> u opción crítica en 8.1/8.2.`;

  justificationEl.innerHTML =
    renderMarkdownishToHtml(buildJustificationText(result)) + meta.outerHTML;

  breakdownEl.innerHTML = "";
  const ul = document.createElement("ul");
  ul.className = "breakdown-ul";
  result.breakdown.forEach((row) => {
    const li = document.createElement("li");
    li.innerHTML = `<span class="bd-title">${escapeHtml(row.displayLine)}</span><br /><span class="bd-opt">${escapeHtml(
      row.optionLabel
    )}</span> <span class="bd-score">(+${row.score})</span>${row.forced ? ' <span class="bd-critical">crítico MTGE</span>' : ""}`;
    ul.appendChild(li);
  });
  breakdownEl.appendChild(ul);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.getElementById("app-title-sub").textContent =
  `Paso 1: art. 14. Paso 2 (si «No»): ${CRITERIA_COUNT} criterios MTGE (arts. 8.1 a 8.6). Umbral suma ≥ ${DECISION_RULES.granEscalaMinTotal} → ${VERDICT_LABELS.granEscala}.`;

document.querySelectorAll('input[name="art14Direct"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    if (radio.value === "no" && radio.checked && art14MotivoInput) {
      art14MotivoInput.value = "";
    }
    updateResults();
  });
});

if (art14MotivoInput) {
  art14MotivoInput.addEventListener("input", updateResults);
}

btnReportWindow.addEventListener("click", () => {
  const selections = readSelections();
  const opts = getReportEvalOptions();
  if (!openReportInNewWindow(selections, opts)) {
    if (readArt14Direct()) {
      alert(
        "Escriba el motivo del art. 14 antes de abrir el reporte. Si el navegador bloquea ventanas emergentes, permítalas para este sitio."
      );
    } else {
      alert(
        `No se pudo abrir el reporte. Complete los ${CRITERIA_COUNT} criterios MTGE y permita ventanas emergentes si el navegador las bloquea.`
      );
    }
  }
});

btnReportDownload.addEventListener("click", () => {
  const selections = readSelections();
  const opts = getReportEvalOptions();
  if (!downloadReportHtml(selections, opts)) {
    if (readArt14Direct()) {
      alert("Escriba el motivo del art. 14 antes de descargar el reporte.");
    } else {
      alert(`Complete los ${CRITERIA_COUNT} criterios MTGE antes de descargar el reporte.`);
    }
  }
});

populateArt14Examples();
renderForm();
updateResults();
