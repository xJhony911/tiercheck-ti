import { describe, expect, it } from "vitest";
import { evaluateTier } from "@/domain/rules/engine";
import { generateRecommendations } from "@/domain/recommendations/generate";
import { scenarioAnswers, tier4Answers, withAnswers } from "./helpers";

describe("Recomendaciones derivadas de las reglas", () => {
  it("genera una recomendación por cada requisito no cumplido o sin verificar", () => {
    const r = evaluateTier(scenarioAnswers("basic"));
    const recs = generateRecommendations(r);
    expect(recs).toHaveLength(r.notMet.length + r.unknown.length);
    const ids = new Set(recs.map((x) => x.requirementId));
    for (const req of [...r.notMet, ...r.unknown]) expect(ids.has(req.id)).toBe(true);
  });

  it("no genera recomendaciones cuando todo se cumple", () => {
    const r = evaluateTier(tier4Answers());
    expect(r.notMet.length + r.unknown.length).toBe(0);
    expect(generateRecommendations(r)).toHaveLength(0);
  });

  it("cada recomendación incluye problema, consecuencia, acción y beneficio", () => {
    const recs = generateRecommendations(evaluateTier(scenarioAnswers("basic")));
    for (const rec of recs) {
      expect(rec.problem.length).toBeGreaterThan(5);
      expect(rec.consequence.length).toBeGreaterThan(5);
      expect(rec.recommendation.length).toBeGreaterThan(5);
      expect(rec.benefit.length).toBeGreaterThan(5);
    }
  });

  it("la ausencia de redundancia de refrigeración se explica con su consecuencia", () => {
    const recs = generateRecommendations(evaluateTier(scenarioAnswers("basic")));
    const cool = recs.find((x) => x.requirementId === "R-T2-COOL-N1");
    expect(cool?.kind).toBe("gap");
    expect(cool?.priority).toBe("high"); // bloquea el siguiente nivel (Tier II)
    expect(cool?.consequence).toMatch(/continuidad/);
  });

  it("ordena por prioridad: alta antes que media antes que baja", () => {
    const recs = generateRecommendations(evaluateTier(scenarioAnswers("basic")));
    const order = { high: 0, medium: 1, low: 2 } as const;
    for (let i = 1; i < recs.length; i++) {
      expect(order[recs[i - 1].priority]).toBeLessThanOrEqual(order[recs[i].priority]);
    }
  });

  it("los requisitos de niveles lejanos tienen prioridad menor que los del siguiente nivel", () => {
    const recs = generateRecommendations(evaluateTier(scenarioAnswers("basic")));
    const next = recs.find((x) => x.requirementId === "R-T2-UPS-N1");
    const far = recs.find((x) => x.requirementId === "R-T4-POWER-2N");
    expect(next?.priority).toBe("high");
    expect(far?.priority).toBe("low");
  });

  it("los 'No sé' generan recomendaciones de verificación, no de brecha", () => {
    const r = evaluateTier(withAnswers(scenarioAnswers("redundant"), { D1: "unknown" }));
    const rec = generateRecommendations(r).find((x) => x.requirementId === "R-T2-UPS-N1");
    expect(rec?.kind).toBe("verify");
    expect(rec?.recommendation).toMatch(/Verificar/);
  });

  it("en un resultado indeterminado los críticos de Tier I sin verificar son prioridad alta", () => {
    const r = evaluateTier(withAnswers(scenarioAnswers("basic"), { A4: "unknown" }));
    const rec = generateRecommendations(r).find((x) => x.requirementId === "R-T1-POWER-CAP");
    expect(rec?.priority).toBe("high");
  });
});
