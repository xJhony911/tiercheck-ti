import type { Answers, Question } from "../types";
import { QUESTIONS } from "./questions";

/** Indica si una pregunta se muestra con las respuestas actuales. */
export function isQuestionVisible(question: Question, answers: Answers): boolean {
  if (!question.showIf) return true;
  const parent = answers[question.showIf.questionId];
  return parent !== undefined && question.showIf.anyOf.includes(parent);
}

/** Preguntas visibles (incluye condicionales cuyo padre habilita la profundización). */
export function getVisibleQuestions(answers: Answers): Question[] {
  return QUESTIONS.filter((q) => isQuestionVisible(q, answers));
}

/**
 * Elimina respuestas de preguntas que dejaron de ser visibles
 * (p. ej. el usuario cambió "UPS: Sí" a "No"), evitando datos obsoletos.
 */
export function pruneHiddenAnswers(answers: Answers): Answers {
  let current: Answers = { ...answers };
  let changed = true;
  while (changed) {
    changed = false;
    for (const q of QUESTIONS) {
      if (current[q.id] !== undefined && !isQuestionVisible(q, current)) {
        const { [q.id]: _removed, ...rest } = current;
        void _removed;
        current = rest;
        changed = true;
      }
    }
  }
  return current;
}

/** Valida que una respuesta pertenezca a las opciones de la pregunta. */
export function isValidAnswer(question: Question, value: string): boolean {
  return question.options.some((o) => o.value === value);
}

export interface QuestionnaireProgress {
  answered: number;
  total: number;
  pct: number;
  /** Ids de preguntas visibles sin responder. */
  unansweredIds: string[];
  complete: boolean;
}

/** Avance del cuestionario: no confundir con la cobertura de información ni con el Tier. */
export function computeProgress(answers: Answers): QuestionnaireProgress {
  const visible = getVisibleQuestions(answers);
  const unansweredIds = visible
    .filter((q) => answers[q.id] === undefined)
    .map((q) => q.id);
  const answered = visible.length - unansweredIds.length;
  return {
    answered,
    total: visible.length,
    pct: visible.length === 0 ? 0 : Math.round((answered / visible.length) * 100),
    unansweredIds,
    complete: unansweredIds.length === 0,
  };
}
