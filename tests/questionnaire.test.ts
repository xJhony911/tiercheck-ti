import { describe, expect, it } from "vitest";
import { QUESTIONS } from "@/domain/questionnaire/questions";
import { CATEGORIES } from "@/domain/questionnaire/categories";
import {
  computeProgress,
  getVisibleQuestions,
  isValidAnswer,
  pruneHiddenAnswers,
} from "@/domain/questionnaire/visibility";
import { REQUIREMENTS, REQUIREMENT_BY_ID } from "@/domain/rules/requirements";
import { RECOMMENDATION_CATALOG } from "@/domain/recommendations/catalog";
import { DEMO_SCENARIOS } from "@/domain/scenarios/scenarios";

describe("Definición del cuestionario", () => {
  it("tiene entre 20 y 30 preguntas con identificadores únicos", () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(20);
    expect(QUESTIONS.length).toBeLessThanOrEqual(30);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
  });

  it("cubre las categorías A-F y cada pregunta pertenece a una", () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(ids).toEqual(["A", "B", "C", "D", "E", "F"]);
    for (const q of QUESTIONS) expect(ids).toContain(q.category);
    for (const id of ids) {
      expect(QUESTIONS.some((q) => q.category === id)).toBe(true);
    }
  });

  it("cada pregunta tiene texto, opciones únicas y la opción 'No sé' (unknown)", () => {
    for (const q of QUESTIONS) {
      expect(q.text.length).toBeGreaterThan(10);
      const values = q.options.map((o) => o.value);
      expect(new Set(values).size).toBe(values.length);
      expect(values).toContain("unknown");
    }
  });

  it("las reglas de cada pregunta coinciden con la matriz de requisitos", () => {
    for (const q of QUESTIONS) {
      const fromMatrix = REQUIREMENTS.filter((r) => r.questionIds.includes(q.id))
        .map((r) => r.id)
        .sort();
      expect([...q.rules].sort()).toEqual(fromMatrix);
      for (const ruleId of q.rules) expect(REQUIREMENT_BY_ID[ruleId]).toBeDefined();
    }
  });

  it("una pregunta es crítica si y solo si alimenta algún requisito crítico", () => {
    for (const q of QUESTIONS) {
      const feedsCritical = q.rules.some((id) => REQUIREMENT_BY_ID[id].critical);
      expect(q.critical).toBe(feedsCritical);
    }
  });

  it("todo requisito referencia preguntas existentes y tiene recomendación en el catálogo", () => {
    const qIds = new Set(QUESTIONS.map((q) => q.id));
    for (const r of REQUIREMENTS) {
      for (const qid of r.questionIds) expect(qIds.has(qid)).toBe(true);
      expect(RECOMMENDATION_CATALOG[r.id]).toBeDefined();
    }
    expect(new Set(REQUIREMENTS.map((r) => r.id)).size).toBe(REQUIREMENTS.length);
  });

  it("cada nivel tiene al menos un requisito crítico", () => {
    for (const t of [1, 2, 3, 4]) {
      expect(REQUIREMENTS.some((r) => r.tier === t && r.critical)).toBe(true);
    }
  });

  it("las respuestas de los escenarios de demostración son válidas", () => {
    for (const s of DEMO_SCENARIOS) {
      for (const [qid, value] of Object.entries(s.answers)) {
        const q = QUESTIONS.find((x) => x.id === qid);
        expect(q, `pregunta ${qid}`).toBeDefined();
        expect(isValidAnswer(q!, value), `${s.id}:${qid}=${value}`).toBe(true);
      }
      expect(computeProgress(s.answers).complete).toBe(true);
    }
  });
});

describe("Preguntas condicionales y avance", () => {
  it("las preguntas hijas se ocultan hasta que el padre lo permite", () => {
    const ids = (a: Record<string, string>) => getVisibleQuestions(a).map((q) => q.id);
    expect(ids({})).not.toContain("D1");
    expect(ids({ B1: "no" })).not.toContain("D1");
    expect(ids({ B1: "yes" })).toContain("D1");
    expect(ids({ B1: "yes" })).toContain("B2");
  });

  it("elimina respuestas obsoletas cuando el padre cambia", () => {
    const pruned = pruneHiddenAnswers({ B1: "no", B2: "gt15", D1: "n1", A1: "yes" });
    expect(pruned).toEqual({ B1: "no", A1: "yes" });
  });

  it("calcula el avance solo sobre preguntas visibles", () => {
    const p0 = computeProgress({});
    expect(p0.pct).toBe(0);
    expect(p0.complete).toBe(false);
    const p1 = computeProgress({ A1: "yes", B1: "no" });
    expect(p1.answered).toBe(2);
    expect(p1.unansweredIds).not.toContain("D1");
  });
});
