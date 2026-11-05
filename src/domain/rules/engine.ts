import { CATEGORIES } from "../questionnaire/categories";
import { computeProgress } from "../questionnaire/visibility";
import { tierLabel } from "../tiers";
import { lowerFirst } from "../text";
import type {
  Answers,
  CategoryScore,
  CoverageInfo,
  EvaluatedRequirement,
  EvaluationResult,
  IndeterminateReason,
  NextTierState,
  Requirement,
  ResultStatus,
  TierLevel,
} from "../types";
import { detectContradictions } from "./contradictions";
import {
  MIN_CRITICAL_COVERAGE_PCT,
  REQUIREMENTS,
  RULES_VERSION,
} from "./requirements";

/**
 * MOTOR DE EVALUACIÓN TIER (determinista)
 * ---------------------------------------------------------------------------
 * Función pura: mismas respuestas => mismo resultado. No usa IA, red ni
 * almacenamiento. No asigna el nivel por porcentaje de respuestas afirmativas:
 * cada nivel exige que TODOS sus requisitos críticos (y los de los niveles
 * inferiores) estén cumplidos.
 *
 * Orden de decisión:
 *  1. Contradicciones                      -> INDETERMINATE
 *  2. Requisito crítico de Tier I no_met   -> BELOW_TIER_1
 *  3. Requisito crítico de Tier I unknown  -> INDETERMINATE
 *  4. Cobertura crítica < mínimo           -> INDETERMINATE
 *  5. Mayor nivel con todos sus críticos (y los inferiores) cumplidos -> TIER
 *
 * "No sé" (unknown) nunca cuenta como cumplimiento.
 */

const TIERS: TierLevel[] = [1, 2, 3, 4];

function toEvaluated(req: Requirement, answers: Answers): EvaluatedRequirement {
  return {
    id: req.id,
    tier: req.tier,
    category: req.category,
    critical: req.critical,
    title: req.title,
    description: req.description,
    reference: req.reference,
    questionIds: req.questionIds,
    status: req.evaluate(answers),
  };
}

function listTitles(reqs: EvaluatedRequirement[], max = 4): string {
  const titles = reqs.slice(0, max).map((r) => lowerFirst(r.title));
  const extra = reqs.length - titles.length;
  return titles.join("; ") + (extra > 0 ? `; y ${extra} más` : "");
}

function computeCategoryScores(evaluated: EvaluatedRequirement[]): CategoryScore[] {
  return CATEGORIES.map((cat) => {
    const inCat = evaluated.filter((r) => r.category === cat.id);
    const met = inCat.filter((r) => r.status === "met").length;
    const notMet = inCat.filter((r) => r.status === "not_met").length;
    const unknown = inCat.filter((r) => r.status === "unknown").length;
    return {
      category: cat.id,
      name: cat.name,
      met,
      notMet,
      unknown,
      total: inCat.length,
      percentMet: inCat.length === 0 ? 0 : Math.round((met / inCat.length) * 100),
    };
  });
}

function computeCoverage(
  answers: Answers,
  evaluated: EvaluatedRequirement[],
): CoverageInfo {
  const progress = computeProgress(answers);
  const critical = evaluated.filter((r) => r.critical);
  const known = critical.filter((r) => r.status !== "unknown").length;
  return {
    answeredQuestions: progress.answered,
    totalQuestions: progress.total,
    progressPct: progress.pct,
    criticalKnown: known,
    criticalTotal: critical.length,
    coveragePct:
      critical.length === 0 ? 0 : Math.round((known / critical.length) * 100),
  };
}

/** Evalúa las respuestas y devuelve un resultado serializable. */
export function evaluateTier(answers: Answers): EvaluationResult {
  const evaluated = REQUIREMENTS.map((r) => toEvaluated(r, answers));
  const byStatus = (s: EvaluatedRequirement["status"]) =>
    evaluated.filter((r) => r.status === s);
  const critical = (tier: TierLevel) =>
    evaluated.filter((r) => r.critical && r.tier === tier);

  const contradictions = detectContradictions(answers);
  const coverage = computeCoverage(answers, evaluated);

  const tier1Critical = critical(1);
  const tier1NotMet = tier1Critical.filter((r) => r.status === "not_met");
  const tier1Unknown = tier1Critical.filter((r) => r.status === "unknown");

  // Mayor nivel consecutivo con todos los críticos cumplidos.
  let achieved: TierLevel | undefined;
  for (const t of TIERS) {
    if (critical(t).every((r) => r.status === "met")) achieved = t;
    else break;
  }

  // ---- Estado global -------------------------------------------------------
  let status: ResultStatus;
  const reasons: IndeterminateReason[] = [];

  if (contradictions.length > 0) {
    status = "INDETERMINATE";
    reasons.push("contradictions");
  } else if (tier1NotMet.length > 0) {
    status = "BELOW_TIER_1";
  } else if (tier1Unknown.length > 0) {
    status = "INDETERMINATE";
    reasons.push("tier1_unverified");
  } else if (coverage.coveragePct < MIN_CRITICAL_COVERAGE_PCT) {
    status = "INDETERMINATE";
    reasons.push("low_coverage");
  } else {
    status = "TIER";
  }
  if (status === "INDETERMINATE") {
    if (tier1Unknown.length > 0 && !reasons.includes("tier1_unverified")) {
      reasons.push("tier1_unverified");
    }
    if (
      coverage.coveragePct < MIN_CRITICAL_COVERAGE_PCT &&
      !reasons.includes("low_coverage")
    ) {
      reasons.push("low_coverage");
    }
  }

  const tier = status === "TIER" ? achieved : undefined;

  // ---- Siguiente nivel -----------------------------------------------------
  let nextTier: TierLevel | undefined;
  let nextTierState: NextTierState = "not_applicable";
  let blockersNextTier: EvaluatedRequirement[] = [];
  let unverifiedNextTier: EvaluatedRequirement[] = [];

  if (status === "BELOW_TIER_1") {
    nextTier = 1;
    nextTierState = "blocked";
    blockersNextTier = tier1NotMet;
    unverifiedNextTier = tier1Unknown;
  } else if (tier !== undefined && tier < 4) {
    nextTier = (tier + 1) as TierLevel;
    blockersNextTier = critical(nextTier).filter((r) => r.status === "not_met");
    unverifiedNextTier = critical(nextTier).filter((r) => r.status === "unknown");
    nextTierState = blockersNextTier.length > 0 ? "blocked" : "unverified";
  }

  // ---- Información faltante (casos indeterminados) -------------------------
  const missingInformation =
    status === "INDETERMINATE"
      ? evaluated
          .filter((r) => r.critical && r.status === "unknown")
          .sort((a, b) => a.tier - b.tier)
      : [];

  // ---- Notas ---------------------------------------------------------------
  const notes: string[] = [];
  if (tier !== undefined) {
    for (const t of TIERS) {
      if (t > tier + 1 && critical(t).every((r) => r.status === "met")) {
        notes.push(
          `Los requisitos críticos de ${tierLabel(t)} aparecen cumplidos, pero el nivel es acumulativo: no se estima ${tierLabel(t)} porque no se han demostrado los niveles inferiores.`,
        );
      }
    }
  }

  const label =
    status === "TIER" && tier !== undefined
      ? `${tierLabel(tier)} preliminar`
      : status === "BELOW_TIER_1"
        ? "Por debajo de Tier I (preliminar)"
        : "Nivel preliminar indeterminado";

  const result: EvaluationResult = {
    rulesVersion: RULES_VERSION,
    status,
    tier,
    indeterminateReason: status === "INDETERMINATE" ? reasons : undefined,
    label,
    summary: "",
    met: byStatus("met"),
    notMet: byStatus("not_met"),
    unknown: byStatus("unknown"),
    missingInformation,
    nextTier,
    nextTierState,
    blockersNextTier,
    unverifiedNextTier,
    contradictions,
    categoryScores: computeCategoryScores(evaluated),
    coverage,
    notes,
  };
  result.summary = buildSummary(result);
  return result;
}

/** Explicación determinista del resultado (en lenguaje natural, calculada). */
function buildSummary(r: EvaluationResult): string {
  const parts: string[] = [];

  if (r.status === "INDETERMINATE") {
    parts.push(
      "No es posible estimar un nivel Tier preliminar con la información proporcionada.",
    );
    if (r.indeterminateReason?.includes("contradictions")) {
      parts.push(
        `Se detectaron ${r.contradictions.length} respuesta(s) contradictoria(s) que deben revisarse antes de emitir una estimación.`,
      );
    }
    if (r.indeterminateReason?.includes("tier1_unverified")) {
      const t1 = r.missingInformation.filter((m) => m.tier === 1);
      parts.push(
        `No se han verificado condiciones básicas de Tier I: ${listTitles(t1)}.`,
      );
    }
    if (r.indeterminateReason?.includes("low_coverage")) {
      parts.push(
        `Solo se verificaron ${r.coverage.criticalKnown} de ${r.coverage.criticalTotal} requisitos críticos (${r.coverage.coveragePct} %), por debajo del mínimo de ${MIN_CRITICAL_COVERAGE_PCT} %.`,
      );
    }
    return parts.join(" ");
  }

  if (r.status === "BELOW_TIER_1") {
    parts.push(
      `No se alcanzan de forma preliminar los criterios básicos de Tier I. Condiciones declaradas como no cumplidas: ${listTitles(r.blockersNextTier)}.`,
    );
    if (r.unverifiedNextTier.length > 0) {
      parts.push(
        `Además, no se han verificado: ${listTitles(r.unverifiedNextTier)}.`,
      );
    }
    return parts.join(" ");
  }

  // status === "TIER"
  const tier = r.tier as TierLevel;
  parts.push(
    `Su infraestructura presenta características compatibles de manera preliminar con ${tierLabel(tier)}, ya que se declaran cumplidos todos los requisitos críticos de ese nivel y de los inferiores.`,
  );

  if (r.nextTier !== undefined) {
    const next = tierLabel(r.nextTier);
    if (r.blockersNextTier.length > 0) {
      parts.push(
        `No se estima ${next} porque se declaran no cumplidos: ${listTitles(r.blockersNextTier)}.`,
      );
    }
    if (r.unverifiedNextTier.length > 0) {
      parts.push(
        r.blockersNextTier.length > 0
          ? `Adicionalmente no se han verificado: ${listTitles(r.unverifiedNextTier)}.`
          : `No existe evidencia suficiente para estimar ${next}: no se han verificado ${listTitles(r.unverifiedNextTier)}.`,
      );
    }
  } else {
    parts.push(
      "Se declaran cumplidos todos los requisitos críticos considerados por esta matriz. Una certificación oficial requeriría una auditoría profesional.",
    );
  }
  return parts.join(" ");
}
