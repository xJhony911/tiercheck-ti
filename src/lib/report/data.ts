import { CATEGORY_BY_ID } from "@/domain/questionnaire/categories";
import { generateRecommendations, priorityLabel } from "@/domain/recommendations/generate";
import { LIMITATIONS, tierLabel } from "@/domain/tiers";
import type { Recommendation } from "@/domain/types";
import type { EvaluationRecord } from "@/lib/validation/records";

/**
 * Modelo de datos del informe, independiente del formato de salida (PDF).
 * Todo el contenido proviene del motor determinista; el texto de IA solo se
 * incluye si existe y se marca explícitamente como tal.
 */

export interface ReportRequirementRow {
  title: string;
  category: string;
  tier: string;
  critical: boolean;
}

export interface ReportRecommendationRow {
  priority: string;
  problem: string;
  consequence: string;
  recommendation: string;
  benefit: string;
  kind: Recommendation["kind"];
}

export interface ReportData {
  title: string;
  generatedAt: string;
  evaluationDate: string;
  simulated: boolean;
  entity: Array<[string, string]>;
  result: {
    label: string;
    summary: string;
    progressPct: number;
    coveragePct: number;
    rulesVersion: string;
    nextTierText?: string;
  };
  contradictions: string[];
  met: ReportRequirementRow[];
  notMet: ReportRequirementRow[];
  unknown: ReportRequirementRow[];
  categoryScores: Array<{ name: string; met: number; total: number; percentMet: number }>;
  recommendations: ReportRecommendationRow[];
  ai?: {
    model: string;
    generatedAt: string;
    executiveSummary: string;
    explanation: string;
    actions: Array<{ title: string; detail: string }>;
    uncertainty: string;
  };
  limitations: string[];
}

const ENTITY_LABEL: Record<string, string> = {
  empresa: "Empresa",
  universidad: "Universidad",
  institucion_publica: "Institución pública",
  otra: "Otra",
};

export function formatDateEs(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-EC", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export function buildReportData(record: EvaluationRecord, now: Date = new Date()): ReportData {
  const { result } = record;
  const recs = generateRecommendations(result);
  const row = (r: (typeof result.met)[number]): ReportRequirementRow => ({
    title: r.title,
    category: CATEGORY_BY_ID[r.category]?.name ?? r.category,
    tier: tierLabel(r.tier),
    critical: r.critical,
  });

  const entity: Array<[string, string]> = [
    ["Organización", record.entity.organizationName?.trim() || "No indicada"],
    ["Tipo de entidad", ENTITY_LABEL[record.entity.entityType] ?? record.entity.entityType],
    ["Instalación evaluada", record.entity.facilityType],
    ["Observaciones", record.entity.observations?.trim() || "Sin observaciones"],
  ];

  const nextTierText =
    result.nextTier !== undefined
      ? `Siguiente nivel de referencia: ${tierLabel(result.nextTier)} (${
          result.nextTierState === "blocked"
            ? "existen requisitos críticos no cumplidos"
            : "faltan requisitos críticos por verificar"
        }).`
      : undefined;

  return {
    title: "Informe de evaluación preliminar",
    generatedAt: formatDateEs(now.toISOString()),
    evaluationDate: formatDateEs(record.createdAt),
    simulated: record.simulated === true,
    entity,
    result: {
      label: result.label,
      summary: result.summary,
      progressPct: result.coverage.progressPct,
      coveragePct: result.coverage.coveragePct,
      rulesVersion: result.rulesVersion,
      nextTierText,
    },
    contradictions: result.contradictions.map((c) => c.message),
    met: result.met.map(row),
    notMet: result.notMet.map(row),
    unknown: result.unknown.map(row),
    categoryScores: result.categoryScores.map((c) => ({
      name: c.name,
      met: c.met,
      total: c.total,
      percentMet: c.percentMet,
    })),
    recommendations: recs.map((r) => ({
      priority: priorityLabel(r.priority),
      problem: r.problem,
      consequence: r.consequence,
      recommendation: r.recommendation,
      benefit: r.benefit,
      kind: r.kind,
    })),
    ai: record.ai
      ? {
          model: record.ai.model,
          generatedAt: formatDateEs(record.ai.generatedAt),
          executiveSummary: record.ai.executiveSummary,
          explanation: record.ai.explanation,
          actions: record.ai.prioritizedActions,
          uncertainty: record.ai.uncertainty,
        }
      : undefined,
    limitations: LIMITATIONS,
  };
}
