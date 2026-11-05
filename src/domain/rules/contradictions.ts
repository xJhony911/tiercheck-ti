import type { Answers, Contradiction } from "../types";

/**
 * REGLAS DE CONTRADICCIÓN
 * ---------------------------------------------------------------------------
 * Detectan combinaciones de respuestas que son lógicamente incompatibles.
 * Si existe alguna, el motor devuelve "Nivel preliminar indeterminado" y pide
 * revisar las preguntas involucradas.
 */

interface ContradictionRule {
  id: string;
  message: string;
  questionIds: string[];
  /** Devuelve true cuando las respuestas son contradictorias. */
  test: (a: Answers) => boolean;
}

const REDUNDANT = ["n1", "2n", "2n1"];

export const CONTRADICTION_RULES: ContradictionRule[] = [
  {
    id: "K-UPS-REDUNDANT-WITHOUT-UPS",
    message:
      "Se indica que no hay UPS (B1) pero se declara una configuración redundante de UPS (D1).",
    questionIds: ["B1", "D1"],
    test: (a) => a.B1 === "no" && REDUNDANT.includes(a.D1 ?? ""),
  },
  {
    id: "K-GEN-REDUNDANT-WITHOUT-GEN",
    message:
      "Se indica que no hay generador (B3) pero se declara una configuración redundante de generadores (D2).",
    questionIds: ["B3", "D2"],
    test: (a) => a.B3 === "no" && REDUNDANT.includes(a.D2 ?? ""),
  },
  {
    id: "K-COOL-REDUNDANT-WITHOUT-COOL",
    message:
      "Se indica que no hay refrigeración dedicada (C1) pero se declara una configuración redundante de refrigeración (D3).",
    questionIds: ["C1", "D3"],
    test: (a) => a.C1 === "no" && REDUNDANT.includes(a.D3 ?? ""),
  },
  {
    id: "K-MAINT-POWER-WITHOUT-REDUNDANCY",
    message:
      "Se declara mantenimiento eléctrico sin afectar la carga (E3) pero el UPS no tiene redundancia (D1 = N).",
    questionIds: ["E3", "D1"],
    test: (a) => a.E3 === "yes" && a.D1 === "n",
  },
  {
    id: "K-MAINT-COOL-WITHOUT-REDUNDANCY",
    message:
      "Se declara mantenimiento de refrigeración sin afectar la carga (E4) pero la refrigeración no tiene redundancia (D3 = N).",
    questionIds: ["E4", "D3"],
    test: (a) => a.E4 === "yes" && a.D3 === "n",
  },
  {
    id: "K-FAULT-TOLERANT-SINGLE-PATH",
    message:
      "Se declara tolerancia a fallas (F1) pero existe una sola ruta eléctrica (E1) o de refrigeración (E2).",
    questionIds: ["F1", "E1", "E2"],
    test: (a) => a.F1 === "yes" && (a.E1 === "one" || a.E2 === "one"),
  },
  {
    id: "K-FAULT-TOLERANT-NO-REDUNDANCY",
    message:
      "Se declara tolerancia a fallas (F1) pero UPS, generadores o refrigeración no tienen redundancia (D1, D2 o D3 = N).",
    questionIds: ["F1", "D1", "D2", "D3"],
    test: (a) =>
      a.F1 === "yes" && (a.D1 === "n" || a.D2 === "n" || a.D3 === "n"),
  },
];

export function detectContradictions(answers: Answers): Contradiction[] {
  return CONTRADICTION_RULES.filter((r) => r.test(answers)).map((r) => ({
    id: r.id,
    message: r.message,
    questionIds: r.questionIds,
  }));
}
