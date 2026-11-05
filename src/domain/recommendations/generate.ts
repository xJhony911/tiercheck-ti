import type {
  EvaluatedRequirement,
  EvaluationResult,
  Recommendation,
  RecommendationPriority,
} from "../types";
import { RECOMMENDATION_CATALOG } from "./catalog";
import { lowerFirst } from "../text";

/**
 * GENERACIÓN DE RECOMENDACIONES (determinista)
 * ---------------------------------------------------------------------------
 * Una recomendación por cada requisito no cumplido ("gap") o sin verificar
 * ("verify"). Prioridad:
 *
 *  Requisito crítico (distancia = nivel del requisito - nivel estimado):
 *   - not_met:  distancia <= 1 -> alta | == 2 -> media | > 2 -> baja
 *   - unknown:  distancia <= 1 -> media (alta si el resultado es indeterminado)
 *               distancia >= 2 -> baja
 *  Requisito no crítico:
 *   - not_met:  prioridad base del catálogo (media o baja)
 *   - unknown:  baja
 */

const PRIORITY_ORDER: Record<RecommendationPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function priorityLabel(p: RecommendationPriority): string {
  return p === "high" ? "Prioridad alta" : p === "medium" ? "Prioridad media" : "Prioridad baja";
}

function computePriority(
  req: EvaluatedRequirement,
  result: EvaluationResult,
): RecommendationPriority {
  const baseline = result.tier ?? 0;
  if (!req.critical) {
    if (req.status === "not_met") {
      return RECOMMENDATION_CATALOG[req.id]?.basePriority ?? "low";
    }
    return "low";
  }
  const distance = req.tier - baseline;
  if (req.status === "not_met") {
    return distance <= 1 ? "high" : distance === 2 ? "medium" : "low";
  }
  // unknown
  if (distance <= 1) return result.status === "INDETERMINATE" ? "high" : "medium";
  return "low";
}

export function generateRecommendations(result: EvaluationResult): Recommendation[] {
  const pending = [...result.notMet, ...result.unknown];

  const recs: Recommendation[] = pending.map((req) => {
    const entry = RECOMMENDATION_CATALOG[req.id];
    const priority = computePriority(req, result);

    if (req.status === "not_met" && entry) {
      return {
        id: `rec-${req.id}`,
        requirementId: req.id,
        kind: "gap",
        priority,
        category: req.category,
        problem: entry.problem,
        consequence: entry.consequence,
        recommendation: entry.recommendation,
        benefit: entry.benefit,
      };
    }

    return {
      id: `rec-${req.id}`,
      requirementId: req.id,
      kind: "verify",
      priority,
      category: req.category,
      problem: `No se ha verificado: ${lowerFirst(req.title)}.`,
      consequence:
        "Mientras no se verifique, esta condición no puede considerarse cumplida y puede impedir estimar un nivel superior.",
      recommendation: `Verificar con los responsables técnicos y documentar la situación real de: ${lowerFirst(req.title)}.`,
      benefit:
        "Reduce la incertidumbre y permite una estimación más precisa del nivel preliminar.",
    };
  });

  const reqCritical = new Map(pending.map((r) => [r.id, r]));
  return recs.sort((a, b) => {
    const byPriority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (byPriority !== 0) return byPriority;
    const ra = reqCritical.get(a.requirementId);
    const rb = reqCritical.get(b.requirementId);
    if (ra && rb) {
      if (ra.critical !== rb.critical) return ra.critical ? -1 : 1;
      if (ra.tier !== rb.tier) return ra.tier - rb.tier;
    }
    return a.requirementId.localeCompare(b.requirementId);
  });
}
