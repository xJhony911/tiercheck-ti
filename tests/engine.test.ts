import { describe, expect, it } from "vitest";
import { evaluateTier } from "@/domain/rules/engine";
import { DEMO_SCENARIOS } from "@/domain/scenarios/scenarios";
import { scenarioAnswers, tier4Answers, withAnswers } from "./helpers";

describe("Motor Tier: niveles orientativos", () => {
  it.each(DEMO_SCENARIOS)(
    "el escenario simulado '$name' produce Tier esperado",
    (s) => {
      const r = evaluateTier(s.answers);
      expect(r.status).toBe("TIER");
      expect(r.tier).toBe(s.expectedTier);
    },
  );

  it("los escenarios están marcados como simulados", () => {
    for (const s of DEMO_SCENARIOS) expect(s.simulated).toBe(true);
  });

  it("estima Tier IV con rutas activas, compartimentación y tolerancia a fallas", () => {
    const r = evaluateTier(tier4Answers());
    expect(r.tier).toBe(4);
    expect(r.nextTierState).toBe("not_applicable");
    expect(r.nextTier).toBeUndefined();
    expect(r.blockersNextTier).toHaveLength(0);
  });

  it("es determinista: mismas respuestas, mismo resultado", () => {
    const a = scenarioAnswers("concurrent");
    expect(evaluateTier(a)).toEqual(evaluateTier({ ...a }));
  });

  it("incluye la versión de reglas y el texto del resultado", () => {
    const r = evaluateTier(scenarioAnswers("redundant"));
    expect(r.rulesVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(r.label).toBe("Tier II preliminar");
    expect(r.summary).toContain("Tier II");
  });
});

describe("Motor Tier: condiciones no cumplidas", () => {
  it("falta de mantenimiento concurrente de refrigeración limita a Tier II", () => {
    const r = evaluateTier(withAnswers(scenarioAnswers("concurrent"), { E4: "no" }));
    expect(r.tier).toBe(2);
    expect(r.nextTier).toBe(3);
    expect(r.nextTierState).toBe("blocked");
    expect(r.blockersNextTier.map((b) => b.id)).toEqual(["R-T3-MAINT-COOL"]);
    expect(r.summary).toContain("Tier III");
  });

  it("sin redundancia de UPS no se supera Tier I", () => {
    const r = evaluateTier(withAnswers(scenarioAnswers("redundant"), { D1: "n" }));
    expect(r.tier).toBe(1);
    expect(r.blockersNextTier.map((b) => b.id)).toContain("R-T2-UPS-N1");
  });

  it("sin generador el resultado queda por debajo de Tier I", () => {
    const r = evaluateTier(
      withAnswers(tier4Answers(), {
        B3: "no",
        D2: undefined,
        B4: undefined,
        B6: undefined,
      }),
    );
    expect(r.status).toBe("BELOW_TIER_1");
    expect(r.tier).toBeUndefined();
    expect(r.blockersNextTier.map((b) => b.id)).toContain("R-T1-GEN");
  });

  it("un alto porcentaje de respuestas afirmativas NO sube el nivel si falta un crítico", () => {
    const r = evaluateTier(
      withAnswers(tier4Answers(), {
        B3: "no",
        D2: undefined,
        B4: undefined,
        B6: undefined,
      }),
    );
    const metCount = r.met.length;
    const total = r.met.length + r.notMet.length + r.unknown.length;
    expect(metCount / total).toBeGreaterThan(0.8);
    expect(r.status).toBe("BELOW_TIER_1");
  });

  it("los niveles son acumulativos: criterios de Tier III sin Tier II no dan Tier III", () => {
    const r = evaluateTier(withAnswers(scenarioAnswers("concurrent"), { D2: "n" }));
    expect(r.tier).toBe(1);
    expect(r.notes.some((n) => n.includes("Tier III"))).toBe(true);
  });

  it("una falta en Tier IV con todo lo demás cumplido da Tier III", () => {
    const r = evaluateTier(withAnswers(tier4Answers(), { F2: "no" }));
    expect(r.tier).toBe(3);
    expect(r.blockersNextTier.map((b) => b.id)).toEqual(["R-T4-AUTO"]);
  });
});

describe("Motor Tier: respuestas incompletas y 'No sé'", () => {
  it("sin respuestas devuelve nivel indeterminado", () => {
    const r = evaluateTier({});
    expect(r.status).toBe("INDETERMINATE");
    expect(r.label).toBe("Nivel preliminar indeterminado");
    expect(r.tier).toBeUndefined();
    expect(r.missingInformation.length).toBeGreaterThan(0);
    expect(r.coverage.progressPct).toBe(0);
  });

  it("respuestas incompletas con baja cobertura son indeterminadas aunque Tier I esté cumplido", () => {
    const partial = {
      A1: "yes", A4: "yes", B1: "yes", B3: "yes", C1: "yes", C4: "yes",
    };
    const r = evaluateTier(partial);
    expect(r.status).toBe("INDETERMINATE");
    expect(r.indeterminateReason).toContain("low_coverage");
    expect(r.coverage.coveragePct).toBeLessThan(50);
  });

  it("un requisito crítico de Tier I desconocido deja el resultado indeterminado", () => {
    const r = evaluateTier(withAnswers(scenarioAnswers("basic"), { A4: "unknown" }));
    expect(r.status).toBe("INDETERMINATE");
    expect(r.indeterminateReason).toContain("tier1_unverified");
    expect(r.missingInformation.map((m) => m.id)).toContain("R-T1-POWER-CAP");
    expect(r.summary).toContain("capacidad eléctrica");
  });

  it("'No sé' en un requisito crítico de Tier II NO cuenta como cumplimiento", () => {
    const r = evaluateTier(withAnswers(scenarioAnswers("redundant"), { D1: "unknown" }));
    expect(r.tier).toBe(1);
    expect(r.nextTierState).toBe("unverified");
    expect(r.unverifiedNextTier.map((u) => u.id)).toEqual(["R-T2-UPS-N1"]);
    expect(r.unknown.map((u) => u.id)).toContain("R-T2-UPS-N1");
    expect(r.met.map((m) => m.id)).not.toContain("R-T2-UPS-N1");
  });

  it("un requisito crítico sin responder se trata como desconocido, no como cumplido", () => {
    const r = evaluateTier(withAnswers(scenarioAnswers("redundant"), { D3: undefined }));
    expect(r.tier).toBe(1);
    expect(r.unverifiedNextTier.map((u) => u.id)).toContain("R-T2-COOL-N1");
  });

  it("varios 'No sé' en niveles altos mantienen el nivel inferior con información faltante", () => {
    const r = evaluateTier(
      withAnswers(scenarioAnswers("concurrent"), { E1: "unknown", E2: "unknown" }),
    );
    expect(r.tier).toBe(2);
    expect(r.nextTierState).toBe("unverified");
    expect(r.unverifiedNextTier.map((u) => u.id)).toEqual(
      expect.arrayContaining(["R-T3-PATHS-ELEC", "R-T3-PATHS-COOL"]),
    );
  });

  it("diferencia avance del cuestionario de la cobertura de información", () => {
    const answers = scenarioAnswers("redundant");
    const a = evaluateTier(answers);
    const b = evaluateTier(withAnswers(answers, { E1: "unknown", E2: "unknown", E3: "unknown" }));
    expect(a.coverage.progressPct).toBe(100);
    expect(b.coverage.progressPct).toBe(100); // todo respondido…
    expect(b.coverage.coveragePct).toBeLessThan(a.coverage.coveragePct); // …pero menos verificado
  });
});

describe("Motor Tier: puntajes por categoría", () => {
  it("devuelve un puntaje por cada categoría A-F con totales coherentes", () => {
    const r = evaluateTier(scenarioAnswers("concurrent"));
    expect(r.categoryScores.map((c) => c.category)).toEqual(["A", "B", "C", "D", "E", "F"]);
    for (const c of r.categoryScores) {
      expect(c.met + c.notMet + c.unknown).toBe(c.total);
      expect(c.percentMet).toBeGreaterThanOrEqual(0);
      expect(c.percentMet).toBeLessThanOrEqual(100);
    }
  });
});
