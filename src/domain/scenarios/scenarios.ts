import type { Answers, EntityInfo, TierLevel } from "../types";

/**
 * ESCENARIOS DE DEMOSTRACIÓN
 * ---------------------------------------------------------------------------
 * Todos los datos son SIMULADOS y no representan a ninguna organización real.
 * Sirven para mostrar el comportamiento real del motor de reglas.
 */

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  /** Siempre true: los datos son ficticios. */
  simulated: true;
  entity: EntityInfo;
  answers: Answers;
  /** Nivel que el motor debe estimar (verificado por pruebas automatizadas). */
  expectedTier: TierLevel;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "basic",
    name: "Infraestructura básica",
    description:
      "Sala pequeña con UPS, generador y refrigeración dedicada, pero sin redundancia ni rutas alternas.",
    simulated: true,
    entity: {
      organizationName: "Organización simulada A",
      entityType: "empresa",
      facilityType: "Sala de servidores (simulada)",
      observations: "DATOS SIMULADOS para demostración.",
    },
    answers: {
      A1: "yes", A2: "yes", A3: "one", A4: "yes", A5: "no",
      B1: "yes", B2: "5to15", B3: "yes", B4: "lt12h", B5: "no", B6: "no",
      C1: "yes", C2: "no", C3: "no", C4: "yes",
      D1: "n", D2: "n", D3: "n", D4: "none",
      E1: "one", E2: "one", E3: "no", E4: "no", E5: "no",
      F1: "no", F2: "no", F3: "no", F4: "no", F5: "4to24h",
    },
    expectedTier: 1,
  },
  {
    id: "redundant",
    name: "Infraestructura con capacidad redundante",
    description:
      "Componentes N+1 en UPS, generadores y refrigeración, con una única ruta de distribución.",
    simulated: true,
    entity: {
      organizationName: "Universidad simulada B",
      entityType: "universidad",
      facilityType: "Centro de datos institucional (simulado)",
      observations: "DATOS SIMULADOS para demostración.",
    },
    answers: {
      A1: "yes", A2: "yes", A3: "two_standby", A4: "yes", A5: "yes",
      B1: "yes", B2: "5to15", B3: "yes", B4: "12to24h", B5: "yes", B6: "yes",
      C1: "yes", C2: "yes", C3: "yes", C4: "yes",
      D1: "n1", D2: "n1", D3: "n1", D4: "some",
      E1: "one", E2: "one", E3: "no", E4: "no", E5: "no",
      F1: "no", F2: "no", F3: "yes", F4: "no", F5: "lt4h",
    },
    expectedTier: 2,
  },
  {
    id: "concurrent",
    name: "Infraestructura con mantenimiento concurrente",
    description:
      "Redundancia N+1, rutas duales, equipos con doble alimentación y mantenimiento sin apagar la carga; sin compartimentación completa.",
    simulated: true,
    entity: {
      organizationName: "Institución pública simulada C",
      entityType: "institucion_publica",
      facilityType: "Centro de datos principal (simulado)",
      observations: "DATOS SIMULADOS para demostración.",
    },
    answers: {
      A1: "yes", A2: "yes", A3: "two_active", A4: "yes", A5: "yes",
      B1: "yes", B2: "gt15", B3: "yes", B4: "24to72h", B5: "yes", B6: "yes",
      C1: "yes", C2: "yes", C3: "yes", C4: "yes",
      D1: "n1", D2: "n1", D3: "n1", D4: "all_critical",
      E1: "two_standby", E2: "two_standby", E3: "yes", E4: "yes", E5: "no",
      F1: "no", F2: "yes", F3: "yes", F4: "yes", F5: "none",
    },
    expectedTier: 3,
  },
];

export function getScenario(id: string): DemoScenario | undefined {
  return DEMO_SCENARIOS.find((s) => s.id === id);
}
