/**
 * Tipos centrales del dominio de TierCheck TI.
 *
 * Este módulo es TypeScript puro: no importa React, Next.js ni servicios externos.
 * Lo consumen el cuestionario, el motor de reglas, las recomendaciones,
 * la capa de IA y el exportador de informes.
 */

/** Categorías del cuestionario (A-F). */
export type CategoryId = "A" | "B" | "C" | "D" | "E" | "F";

/** Niveles Tier de Uptime Institute (referencia conceptual). */
export type TierLevel = 1 | 2 | 3 | 4;

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
}

export interface QuestionOption {
  /** Valor almacenado en las respuestas. */
  value: string;
  /** Texto mostrado al usuario. */
  label: string;
}

/** Condición para mostrar una pregunta de profundización. */
export interface ShowIfCondition {
  questionId: string;
  /** La pregunta se muestra si la respuesta del padre está en esta lista. */
  anyOf: string[];
}

export interface Question {
  /** Identificador único, p. ej. "B1". */
  id: string;
  category: CategoryId;
  text: string;
  /** Explicación técnica breve (opcional). */
  help?: string;
  options: QuestionOption[];
  /** Indica si la pregunta alimenta al menos un requisito crítico de algún nivel. */
  critical: boolean;
  /** Identificadores de requisitos (matriz de reglas) que dependen de esta pregunta. */
  rules: string[];
  /** Referencia técnica pública cuando corresponde. */
  reference?: string;
  /** Pregunta condicional: solo profundiza, nunca omite un requisito esencial. */
  showIf?: ShowIfCondition;
}

/** Respuestas: id de pregunta -> valor de la opción elegida. */
export type Answers = Record<string, string>;

/** Estado de verificación de un requisito. "unknown" NUNCA equivale a cumplimiento. */
export type RequirementStatus = "met" | "not_met" | "unknown";

export interface Requirement {
  /** Identificador estable, p. ej. "R-T2-UPS-N1". */
  id: string;
  /** Nivel Tier al que pertenece el requisito. */
  tier: TierLevel;
  category: CategoryId;
  /** Si es crítico, determina el nivel preliminar. Si no, solo genera recomendaciones. */
  critical: boolean;
  title: string;
  description: string;
  /** Referencia pública y/o aclaración sobre su alcance. */
  reference: string;
  /** Preguntas de las que depende. */
  questionIds: string[];
  /** Función pura que evalúa el requisito a partir de las respuestas. */
  evaluate: (answers: Answers) => RequirementStatus;
}

export interface EvaluatedRequirement {
  id: string;
  tier: TierLevel;
  category: CategoryId;
  critical: boolean;
  title: string;
  description: string;
  reference: string;
  questionIds: string[];
  status: RequirementStatus;
}

export interface Contradiction {
  id: string;
  message: string;
  questionIds: string[];
}

/**
 * Estado global del resultado:
 * - TIER: nivel preliminar estimado (ver campo `tier`).
 * - BELOW_TIER_1: hay requisitos críticos de Tier I declarados como no cumplidos.
 * - INDETERMINATE: datos insuficientes o contradictorios.
 */
export type ResultStatus = "TIER" | "BELOW_TIER_1" | "INDETERMINATE";

export type IndeterminateReason =
  | "contradictions"
  | "tier1_unverified"
  | "low_coverage";

export type NextTierState = "blocked" | "unverified" | "not_applicable";

export interface CategoryScore {
  category: CategoryId;
  name: string;
  met: number;
  notMet: number;
  unknown: number;
  total: number;
  /** Porcentaje de requisitos cumplidos. Solo informativo: NO determina el Tier. */
  percentMet: number;
}

export interface CoverageInfo {
  /** Preguntas visibles contestadas / preguntas visibles (avance del cuestionario). */
  answeredQuestions: number;
  totalQuestions: number;
  progressPct: number;
  /** Requisitos críticos verificados (met / not_met) / requisitos críticos (cobertura de información). */
  criticalKnown: number;
  criticalTotal: number;
  coveragePct: number;
}

export interface EvaluationResult {
  rulesVersion: string;
  status: ResultStatus;
  /** Nivel preliminar. Solo existe cuando status === "TIER". */
  tier?: TierLevel;
  indeterminateReason?: IndeterminateReason[];
  /** Texto corto del resultado, p. ej. "Tier II preliminar". */
  label: string;
  /** Explicación determinista de por qué se obtuvo el resultado. */
  summary: string;
  met: EvaluatedRequirement[];
  notMet: EvaluatedRequirement[];
  unknown: EvaluatedRequirement[];
  /** Información faltante para poder emitir una estimación (casos indeterminados). */
  missingInformation: EvaluatedRequirement[];
  nextTier?: TierLevel;
  nextTierState: NextTierState;
  /** Requisitos críticos del siguiente nivel declarados como no cumplidos. */
  blockersNextTier: EvaluatedRequirement[];
  /** Requisitos críticos del siguiente nivel sin verificar. */
  unverifiedNextTier: EvaluatedRequirement[];
  contradictions: Contradiction[];
  categoryScores: CategoryScore[];
  coverage: CoverageInfo;
  /** Observaciones adicionales (p. ej. criterios superiores cumplidos sin base inferior). */
  notes: string[];
}

export type EntityType = "empresa" | "universidad" | "institucion_publica" | "otra";

export interface EntityInfo {
  organizationName?: string;
  entityType: EntityType;
  facilityType: string;
  observations?: string;
}

export type RecommendationPriority = "high" | "medium" | "low";

export interface Recommendation {
  id: string;
  requirementId: string;
  kind: "gap" | "verify";
  priority: RecommendationPriority;
  category: CategoryId;
  problem: string;
  consequence: string;
  recommendation: string;
  benefit: string;
}
