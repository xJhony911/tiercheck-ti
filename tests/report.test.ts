import { describe, expect, it } from "vitest";
import { buildReportData } from "@/lib/report/data";
import { pdfSafe, renderReportPdf } from "@/lib/report/pdf";
import { createRecord } from "@/lib/storage/repository";
import { DEMO_SCENARIOS } from "@/domain/scenarios/scenarios";
import { scenarioAnswers } from "./helpers";

const entity = {
  organizationName: "Universidad de Prueba",
  entityType: "universidad" as const,
  facilityType: "Sala de servidores",
  observations: "Solo para pruebas.",
};

describe("Informe PDF", () => {
  it("el modelo del informe contiene todas las secciones requeridas", () => {
    const rec = createRecord(entity, scenarioAnswers("redundant"), { now: new Date("2026-03-05T10:00:00Z") });
    const data = buildReportData(rec);
    expect(data.entity.map((e) => e[0])).toEqual(
      expect.arrayContaining(["Organización", "Tipo de entidad", "Instalación evaluada", "Observaciones"]),
    );
    expect(data.evaluationDate).toBeTruthy();
    expect(data.result.label).toBe("Tier II preliminar");
    expect(data.result.summary).toContain("Tier II");
    expect(data.met.length).toBeGreaterThan(0);
    expect(data.notMet.length).toBeGreaterThan(0);
    expect(data.recommendations.length).toBeGreaterThan(0);
    expect(data.limitations.join(" ")).toMatch(/ANSI\/TIA-942/);
    expect(data.ai).toBeUndefined(); // sin IA no se inventa contenido
  });

  it("incluye el texto de IA solo cuando existe", () => {
    const rec = createRecord(entity, scenarioAnswers("redundant"));
    rec.ai = {
      model: "m",
      generatedAt: new Date().toISOString(),
      executiveSummary: "Resumen ejecutivo de prueba.",
      explanation: "Explicación de prueba.",
      prioritizedActions: [{ title: "Acción", detail: "Detalle" }],
      uncertainty: "Incertidumbre de prueba.",
    };
    expect(buildReportData(rec).ai?.executiveSummary).toBe("Resumen ejecutivo de prueba.");
  });

  it("genera un PDF válido con varias páginas de contenido", () => {
    const rec = createRecord(entity, scenarioAnswers("basic"));
    const doc = renderReportPdf(buildReportData(rec));
    const bytes = new Uint8Array(doc.output("arraybuffer"));
    const header = String.fromCharCode(...bytes.slice(0, 5));
    expect(header).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(5_000);
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(2);
  });

  it("genera PDF para resultados indeterminados y para escenarios simulados", () => {
    const empty = renderReportPdf(buildReportData(createRecord(entity, {})));
    expect(empty.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    for (const s of DEMO_SCENARIOS) {
      const rec = createRecord(s.entity, s.answers, { simulated: true });
      const data = buildReportData(rec);
      expect(data.simulated).toBe(true);
      expect(renderReportPdf(data).getNumberOfPages()).toBeGreaterThanOrEqual(1);
    }
  });

  it("normaliza caracteres no soportados por la fuente estándar", () => {
    expect(pdfSafe("≥ 5 min ≈ 12 h — “ok”")).toBe('>= 5 min ~ 12 h - "ok"');
    expect(pdfSafe("Climatización y señalización")).toBe("Climatización y señalización");
  });
});
