import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { ReportData } from "./data";

/**
 * Exportación del informe a PDF (se ejecuta en el navegador con jsPDF).
 * Usa la fuente estándar Helvetica: se normalizan los caracteres que no
 * soporta (≥, ≈, comillas tipográficas, etc.).
 */

const NAVY: [number, number, number] = [11, 28, 61];
const BLUE: [number, number, number] = [37, 99, 235];
const SLATE: [number, number, number] = [51, 65, 85];
const LIGHT: [number, number, number] = [239, 246, 255];
const AMBER: [number, number, number] = [254, 243, 199];

const MARGIN = 16;

export function pdfSafe(text: string): string {
  return text
    .replace(/[≥]/g, ">=")
    .replace(/[≤]/g, "<=")
    .replace(/[≈]/g, "~")
    .replace(/[“”«»]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/•/g, "-")
    .replace(/[^\x00-\xFF]/g, "?");
}

type DocWithTable = jsPDF & { lastAutoTable?: { finalY: number } };

function lastY(doc: DocWithTable, fallback: number): number {
  return doc.lastAutoTable?.finalY ?? fallback;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 20) {
    doc.addPage();
    return 24;
  }
  return y;
}

function heading(doc: jsPDF, text: string, y: number): number {
  y = ensureSpace(doc, y, 14);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.setTextColor(...NAVY);
  doc.text(pdfSafe(text), MARGIN, y);
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y + 1.8, MARGIN + 18, y + 1.8);
  return y + 8;
}

function paragraph(doc: jsPDF, text: string, y: number, opts: { size?: number; bold?: boolean } = {}): number {
  const width = doc.internal.pageSize.getWidth() - MARGIN * 2;
  doc.setFont("helvetica", opts.bold ? "bold" : "normal");
  doc.setFontSize(opts.size ?? 10);
  doc.setTextColor(...SLATE);
  const lines = doc.splitTextToSize(pdfSafe(text), width) as string[];
  const lineHeight = (opts.size ?? 10) * 0.5;
  for (const line of lines) {
    y = ensureSpace(doc, y, lineHeight + 2);
    doc.text(line, MARGIN, y);
    y += lineHeight + 0.8;
  }
  return y + 2;
}

function reqTable(
  doc: DocWithTable,
  title: string,
  rows: ReportData["met"],
  y: number,
  emptyText: string,
): number {
  y = heading(doc, title, y);
  if (rows.length === 0) return paragraph(doc, emptyText, y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Requisito", "Categoría", "Nivel", "Crítico"]],
    body: rows.map((r) => [r.title, r.category, r.tier, r.critical ? "Sí" : "No"].map(pdfSafe)),
    styles: { fontSize: 8.5, cellPadding: 2, textColor: SLATE },
    headStyles: { fillColor: BLUE, textColor: 255 },
    alternateRowStyles: { fillColor: LIGHT },
    columnStyles: { 3: { cellWidth: 16 }, 2: { cellWidth: 18 } },
  });
  return lastY(doc, y) + 8;
}

/** Genera el PDF y lo devuelve como jsPDF (para guardar o inspeccionar). */
export function renderReportPdf(data: ReportData): jsPDF {
  const doc: DocWithTable = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Cabecera
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setFillColor(...BLUE);
  doc.rect(0, 30, pageWidth, 1.6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("TierCheck TI", MARGIN, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.text(pdfSafe(data.title), MARGIN, 23);

  let y = 42;

  // Advertencia principal
  doc.setFillColor(...AMBER);
  doc.roundedRect(MARGIN, y - 5, pageWidth - MARGIN * 2, 15, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(120, 53, 15);
  const warn = doc.splitTextToSize(
    pdfSafe(
      "EVALUACION ORIENTATIVA, NO OFICIAL. Este informe es una estimacion preliminar basada en respuestas autodeclaradas. No es una certificacion y no reemplaza una auditoria profesional.",
    ),
    pageWidth - MARGIN * 2 - 6,
  ) as string[];
  doc.text(warn, MARGIN + 3, y);
  y += 20;

  if (data.simulated) {
    y = paragraph(doc, "DATOS SIMULADOS: esta evaluacion proviene de un escenario de demostracion.", y, { bold: true });
  }

  // Datos generales
  y = heading(doc, "1. Datos generales", y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    body: [
      ...data.entity.map(([k, v]) => [k, v].map(pdfSafe)),
      ["Fecha de evaluación", pdfSafe(data.evaluationDate)],
      ["Informe generado", pdfSafe(data.generatedAt)],
      ["Versión de reglas", data.result.rulesVersion],
    ],
    styles: { fontSize: 9, cellPadding: 2, textColor: SLATE },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 48, fillColor: LIGHT } },
    theme: "grid",
  });
  y = lastY(doc, y) + 9;

  // Resultado
  y = heading(doc, "2. Nivel preliminar estimado", y);
  y = ensureSpace(doc, y, 22);
  doc.setFillColor(...LIGHT);
  doc.roundedRect(MARGIN, y - 4, pageWidth - MARGIN * 2, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...BLUE);
  doc.text(pdfSafe(data.result.label), MARGIN + 4, y + 5);
  y += 17;
  y = paragraph(
    doc,
    `Avance del cuestionario: ${data.result.progressPct} %. Cobertura de informacion (requisitos criticos verificados): ${data.result.coveragePct} %. Estas metricas son independientes del nivel estimado.`,
    y,
    { size: 9 },
  );

  // Resumen
  y = heading(doc, "3. Resumen del análisis", y);
  y = paragraph(doc, data.result.summary, y);
  if (data.result.nextTierText) y = paragraph(doc, data.result.nextTierText, y);
  for (const c of data.contradictions) {
    y = paragraph(doc, `Contradiccion detectada: ${c}`, y, { size: 9, bold: true });
  }

  // Categorías
  y = ensureSpace(doc, y, 40);
  y = heading(doc, "4. Cumplimiento por categoría (informativo)", y);
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Categoría", "Cumplidos", "Total", "% cumplido"]],
    body: data.categoryScores.map((c) => [pdfSafe(c.name), String(c.met), String(c.total), `${c.percentMet} %`]),
    styles: { fontSize: 8.5, cellPadding: 2, textColor: SLATE },
    headStyles: { fillColor: BLUE, textColor: 255 },
    alternateRowStyles: { fillColor: LIGHT },
  });
  y = lastY(doc, y) + 4;
  y = paragraph(doc, "El porcentaje por categoría es solo informativo: el nivel Tier no se obtiene por porcentaje, sino por requisitos críticos.", y, { size: 8.5 });

  // Requisitos
  y = reqTable(doc, "5. Requisitos cumplidos", data.met, y, "No se declararon requisitos cumplidos.");
  y = reqTable(doc, "6. Requisitos pendientes (no cumplidos)", data.notMet, y, "No hay requisitos declarados como no cumplidos.");
  y = reqTable(doc, "7. Información no verificada (\"No sé\" o sin respuesta)", data.unknown, y, "No hay requisitos sin verificar.");

  // Recomendaciones
  y = heading(doc, "8. Recomendaciones priorizadas", y);
  if (data.recommendations.length === 0) {
    y = paragraph(doc, "No se identificaron deficiencias con las respuestas proporcionadas.", y);
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Prioridad", "Problema y consecuencia", "Recomendación y beneficio"]],
      body: data.recommendations.map((r) => [
        pdfSafe(r.priority),
        pdfSafe(`${r.problem}\nConsecuencia: ${r.consequence}`),
        pdfSafe(`${r.recommendation}\nBeneficio: ${r.benefit}`),
      ]),
      styles: { fontSize: 8, cellPadding: 2, textColor: SLATE, valign: "top" },
      headStyles: { fillColor: BLUE, textColor: 255 },
      alternateRowStyles: { fillColor: LIGHT },
      columnStyles: { 0: { cellWidth: 24, fontStyle: "bold" } },
    });
    y = lastY(doc, y) + 8;
  }

  // IA (solo si existe)
  if (data.ai) {
    y = heading(doc, "9. Explicación personalizada con IA (complementaria)", y);
    y = paragraph(
      doc,
      `Texto generado por IA (${data.ai.model}) el ${data.ai.generatedAt}. No modifica el resultado del motor de reglas y no constituye una certificación.`,
      y,
      { size: 8.5, bold: true },
    );
    y = paragraph(doc, `Resumen ejecutivo: ${data.ai.executiveSummary}`, y);
    y = paragraph(doc, data.ai.explanation, y);
    for (const a of data.ai.actions) y = paragraph(doc, `- ${a.title}: ${a.detail}`, y, { size: 9 });
    y = paragraph(doc, `Incertidumbre: ${data.ai.uncertainty}`, y, { size: 9 });
  }

  // Limitaciones
  y = heading(doc, data.ai ? "10. Limitaciones de la evaluación" : "9. Limitaciones de la evaluación", y);
  for (const l of data.limitations) y = paragraph(doc, `- ${l}`, y, { size: 9 });

  // Pie de página
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    const h = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(pdfSafe("TierCheck TI - Evaluación orientativa, no oficial"), MARGIN, h - 9);
    doc.text(`Pagina ${i} de ${total}`, pageWidth - MARGIN, h - 9, { align: "right" });
  }
  return doc;
}

/** Descarga el informe en el navegador. */
export function downloadReportPdf(data: ReportData, fileName: string): void {
  renderReportPdf(data).save(fileName);
}
