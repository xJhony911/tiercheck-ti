import { describe, expect, it } from "vitest";
import { evaluateTier } from "@/domain/rules/engine";
import { CONTRADICTION_RULES, detectContradictions } from "@/domain/rules/contradictions";
import { scenarioAnswers, tier4Answers, withAnswers } from "./helpers";

describe("Respuestas contradictorias", () => {
  const cases: Array<{ id: string; overrides: Record<string, string | undefined> }> = [
    { id: "K-UPS-REDUNDANT-WITHOUT-UPS", overrides: { B1: "no", D1: "n1" } },
    { id: "K-GEN-REDUNDANT-WITHOUT-GEN", overrides: { B3: "no", D2: "2n" } },
    { id: "K-COOL-REDUNDANT-WITHOUT-COOL", overrides: { C1: "no", D3: "n1" } },
    { id: "K-MAINT-POWER-WITHOUT-REDUNDANCY", overrides: { E3: "yes", D1: "n" } },
    { id: "K-MAINT-COOL-WITHOUT-REDUNDANCY", overrides: { E4: "yes", D3: "n" } },
    { id: "K-FAULT-TOLERANT-SINGLE-PATH", overrides: { F1: "yes", E1: "one" } },
    { id: "K-FAULT-TOLERANT-NO-REDUNDANCY", overrides: { F1: "yes", D2: "n" } },
  ];

  it("hay un caso de prueba por cada regla de contradicción", () => {
    expect(cases.map((c) => c.id).sort()).toEqual(
      CONTRADICTION_RULES.map((r) => r.id).sort(),
    );
  });

  it.each(cases)("detecta $id y devuelve nivel indeterminado", ({ id, overrides }) => {
    const answers = withAnswers(scenarioAnswers("concurrent"), overrides);
    expect(detectContradictions(answers).map((c) => c.id)).toContain(id);
    const r = evaluateTier(answers);
    expect(r.status).toBe("INDETERMINATE");
    expect(r.indeterminateReason).toContain("contradictions");
    expect(r.tier).toBeUndefined();
    expect(r.contradictions.length).toBeGreaterThan(0);
    expect(r.summary).toMatch(/contradictoria/);
  });

  it("las respuestas coherentes no generan contradicciones", () => {
    expect(detectContradictions(tier4Answers())).toHaveLength(0);
    expect(detectContradictions(scenarioAnswers("basic"))).toHaveLength(0);
  });

  it("una contradicción prevalece incluso si el resto sugeriría un nivel alto", () => {
    const r = evaluateTier(withAnswers(tier4Answers(), { E1: "one" }));
    expect(r.status).toBe("INDETERMINATE");
  });
});
