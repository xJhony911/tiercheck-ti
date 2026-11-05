import type {
  Answers,
  Requirement,
  RequirementStatus,
} from "../types";

/**
 * MATRIZ CENTRALIZADA DE REQUISITOS
 * ===========================================================================
 * Aquí se define QUÉ condiciones verifica el motor y a qué nivel pertenecen.
 * Para modificar un criterio basta con editar esta lista (ver docs/REGLAS.md).
 *
 * Marco conceptual: descripción pública de los niveles Tier I-IV de
 * Uptime Institute. Los niveles son ACUMULATIVOS: Tier III exige también
 * lo de Tier I y II.
 *
 *   Tier I   Capacidad básica: espacio dedicado, UPS, refrigeración dedicada,
 *            generador.
 *   Tier II  Componentes de capacidad redundantes (N+1) en UPS, generador y
 *            refrigeración.
 *   Tier III Mantenimiento concurrente: múltiples rutas de distribución
 *            (una activa), equipos con doble alimentación y mantenimiento sin
 *            apagar la carga.
 *   Tier IV  Tolerancia a fallas: rutas activas independientes y
 *            compartimentadas, respuesta autónoma y refrigeración continua.
 *
 * LIMITACIONES (importante):
 *  - Es una estimación ORIENTATIVA sobre respuestas AUTODECLARADAS.
 *  - Solo se usan criterios descritos públicamente. El estándar completo de
 *    Uptime Institute es de acceso restringido y NO se reproduce ni se infiere.
 *  - La certificación oficial se otorga por Uptime Institute tras una
 *    evaluación de diseño, construcción y sostenibilidad operativa.
 *  - Uptime Institute (Tier I-IV) y ANSI/TIA-942 (Rated-1 a Rated-4) son
 *    sistemas distintos; esta herramienta NO los equipara.
 *
 * Requisito "critical": determina el nivel preliminar.
 * Requisito no crítico: no cambia el nivel, solo genera recomendaciones.
 */

/** Versión de la matriz. Increméntela cuando cambie cualquier regla. */
export const RULES_VERSION = "1.0.0";

/** Cobertura mínima de requisitos críticos verificados para emitir un nivel. */
export const MIN_CRITICAL_COVERAGE_PCT = 50;

// ----------------------------------------------------------------------------
// Utilidades de evaluación (puras y reutilizables)
// ----------------------------------------------------------------------------

/** "Sí" = met, "No" = not_met. "No sé" o sin respuesta = unknown. */
export function yes(a: Answers, q: string): RequirementStatus {
  const v = a[q];
  if (v === "yes") return "met";
  if (v === "no") return "not_met";
  return "unknown";
}

/** met si la respuesta está en `metValues`; unknown si falta o es "No sé"; si no, not_met. */
export function oneOf(a: Answers, q: string, metValues: string[]): RequirementStatus {
  const v = a[q];
  if (v === undefined || v === "unknown") return "unknown";
  return metValues.includes(v) ? "met" : "not_met";
}

/**
 * Para preguntas condicionales: si el padre es "No" el requisito no se cumple
 * (no existe el componente); si el padre es "Sí" se evalúa la pregunta hija;
 * si el padre es desconocido, el requisito queda sin verificar.
 */
export function withParent(
  a: Answers,
  parentQuestion: string,
  child: () => RequirementStatus,
): RequirementStatus {
  const parent = a[parentQuestion];
  if (parent === "no") return "not_met";
  if (parent === "yes") return child();
  return "unknown";
}

/** Combina estados: cualquier not_met => not_met; si no, cualquier unknown => unknown. */
export function all(...statuses: RequirementStatus[]): RequirementStatus {
  if (statuses.includes("not_met")) return "not_met";
  if (statuses.includes("unknown")) return "unknown";
  return "met";
}

const REDUNDANT = ["n1", "2n", "2n1"];
const TWO_N = ["2n", "2n1"];
const MULTI_PATH = ["two_standby", "two_active"];

// ----------------------------------------------------------------------------
// Matriz de requisitos
// ----------------------------------------------------------------------------

export const REQUIREMENTS: Requirement[] = [
  // ======================= TIER I — capacidad básica =======================
  {
    id: "R-T1-SPACE",
    tier: 1,
    category: "A",
    critical: true,
    title: "Espacio dedicado para equipos de TI",
    description: "Los equipos críticos se alojan en un espacio exclusivo y controlado.",
    reference: "Uptime Institute, descripción pública de Tier I.",
    questionIds: ["A1"],
    evaluate: (a) => yes(a, "A1"),
  },
  {
    id: "R-T1-POWER-CAP",
    tier: 1,
    category: "A",
    critical: true,
    title: "Capacidad eléctrica suficiente para la carga de TI",
    description: "La capacidad eléctrica instalada cubre la carga de TI actual.",
    reference: "Uptime Institute, descripción pública de Tier I (capacidad básica).",
    questionIds: ["A4"],
    evaluate: (a) => yes(a, "A4"),
  },
  {
    id: "R-T1-UPS",
    tier: 1,
    category: "B",
    critical: true,
    title: "UPS para cortes eléctricos breves",
    description: "La carga de TI está protegida por un sistema UPS.",
    reference: "Uptime Institute, descripción pública de Tier I.",
    questionIds: ["B1"],
    evaluate: (a) => yes(a, "B1"),
  },
  {
    id: "R-T1-GEN",
    tier: 1,
    category: "B",
    critical: true,
    title: "Generador para cortes eléctricos prolongados",
    description: "Existe un generador de respaldo para cortes prolongados.",
    reference: "Uptime Institute, descripción pública de Tier I.",
    questionIds: ["B3"],
    evaluate: (a) => yes(a, "B3"),
  },
  {
    id: "R-T1-COOL",
    tier: 1,
    category: "C",
    critical: true,
    title: "Refrigeración dedicada y continua (24x7)",
    description: "La sala de TI tiene refrigeración propia que no se apaga fuera del horario de oficina.",
    reference: "Uptime Institute, descripción pública de Tier I.",
    questionIds: ["C1"],
    evaluate: (a) => yes(a, "C1"),
  },
  {
    id: "R-T1-COOL-CAP",
    tier: 1,
    category: "C",
    critical: true,
    title: "Capacidad de refrigeración suficiente",
    description: "La capacidad térmica instalada cubre la carga de TI actual.",
    reference: "Uptime Institute, descripción pública de Tier I (capacidad básica).",
    questionIds: ["C4"],
    evaluate: (a) => yes(a, "C4"),
  },

  // Tier I — no críticos (buenas prácticas que generan recomendaciones)
  {
    id: "R-T1-DIST",
    tier: 1,
    category: "A",
    critical: false,
    title: "Circuitos y tableros dedicados a la carga de TI",
    description: "La distribución eléctrica de TI está separada de otras cargas.",
    reference: "Buena práctica operativa; no es un criterio de clasificación por sí misma.",
    questionIds: ["A2"],
    evaluate: (a) => yes(a, "A2"),
  },
  {
    id: "R-T1-MON-POWER",
    tier: 1,
    category: "A",
    critical: false,
    title: "Monitoreo de energía",
    description: "Hay medición y alarmas del estado de la energía de TI.",
    reference: "Buena práctica operativa.",
    questionIds: ["A5"],
    evaluate: (a) => yes(a, "A5"),
  },
  {
    id: "R-T1-UPS-RUNTIME",
    tier: 1,
    category: "B",
    critical: false,
    title: "Autonomía del UPS adecuada (≥ 5 minutos)",
    description: "El UPS cubre al menos el arranque del generador o un apagado ordenado.",
    reference: "Valor orientativo definido por el equipo; ajustar según el diseño real.",
    questionIds: ["B1", "B2"],
    evaluate: (a) =>
      withParent(a, "B1", () => oneOf(a, "B2", ["5to15", "gt15"])),
  },
  {
    id: "R-T1-ATS",
    tier: 1,
    category: "B",
    critical: false,
    title: "Transferencia automática al generador",
    description: "El generador asume la carga sin intervención humana.",
    reference: "Buena práctica operativa.",
    questionIds: ["B3", "B6"],
    evaluate: (a) => withParent(a, "B3", () => yes(a, "B6")),
  },
  {
    id: "R-T1-MON-ENV",
    tier: 1,
    category: "C",
    critical: false,
    title: "Monitoreo ambiental con alarmas",
    description: "Temperatura y humedad se monitorean con alarmas.",
    reference: "Buena práctica operativa.",
    questionIds: ["C3"],
    evaluate: (a) => yes(a, "C3"),
  },

  // ===================== TIER II — componentes redundantes ====================
  {
    id: "R-T2-UPS-N1",
    tier: 2,
    category: "D",
    critical: true,
    title: "UPS con capacidad redundante (N+1 o superior)",
    description: "La falla de un módulo UPS no deja la capacidad por debajo de la carga.",
    reference: "Uptime Institute, descripción pública de Tier II (componentes de capacidad redundantes).",
    questionIds: ["B1", "D1"],
    evaluate: (a) => withParent(a, "B1", () => oneOf(a, "D1", REDUNDANT)),
  },
  {
    id: "R-T2-GEN-N1",
    tier: 2,
    category: "D",
    critical: true,
    title: "Generadores con capacidad redundante (N+1 o superior)",
    description: "La falla de un generador no deja la capacidad por debajo de la carga.",
    reference: "Uptime Institute, descripción pública de Tier II (componentes de capacidad redundantes).",
    questionIds: ["B3", "D2"],
    evaluate: (a) => withParent(a, "B3", () => oneOf(a, "D2", REDUNDANT)),
  },
  {
    id: "R-T2-COOL-N1",
    tier: 2,
    category: "D",
    critical: true,
    title: "Refrigeración con capacidad redundante (N+1 o superior)",
    description: "La falla de una unidad de refrigeración no deja la capacidad térmica por debajo de la carga.",
    reference: "Uptime Institute, descripción pública de Tier II (componentes de capacidad redundantes).",
    questionIds: ["C1", "D3"],
    evaluate: (a) => withParent(a, "C1", () => oneOf(a, "D3", REDUNDANT)),
  },

  // ================== TIER III — mantenimiento concurrente ===================
  {
    id: "R-T3-PATHS-ELEC",
    tier: 3,
    category: "E",
    critical: true,
    title: "Múltiples rutas de distribución eléctrica",
    description: "Existe más de una ruta eléctrica hacia la carga (al menos una alterna).",
    reference: "Uptime Institute, descripción pública de Tier III.",
    questionIds: ["E1"],
    evaluate: (a) => oneOf(a, "E1", MULTI_PATH),
  },
  {
    id: "R-T3-PATHS-COOL",
    tier: 3,
    category: "E",
    critical: true,
    title: "Múltiples rutas de distribución de refrigeración",
    description: "Existe más de una ruta de distribución de refrigeración (al menos una alterna).",
    reference: "Uptime Institute, descripción pública de Tier III.",
    questionIds: ["E2"],
    evaluate: (a) => oneOf(a, "E2", MULTI_PATH),
  },
  {
    id: "R-T3-DUALPSU",
    tier: 3,
    category: "D",
    critical: true,
    title: "Equipos de TI críticos con doble alimentación",
    description: "Todos los equipos críticos pueden alimentarse desde dos rutas distintas.",
    reference: "Uptime Institute, descripción pública de Tier III.",
    questionIds: ["D4"],
    evaluate: (a) => oneOf(a, "D4", ["all_critical"]),
  },
  {
    id: "R-T3-MAINT-POWER",
    tier: 3,
    category: "E",
    critical: true,
    title: "Mantenimiento concurrente de la ruta eléctrica",
    description: "Cualquier componente eléctrico puede mantenerse sin apagar la carga de TI.",
    reference: "Uptime Institute, descripción pública de Tier III (mantenimiento concurrente).",
    questionIds: ["E3"],
    evaluate: (a) => yes(a, "E3"),
  },
  {
    id: "R-T3-MAINT-COOL",
    tier: 3,
    category: "E",
    critical: true,
    title: "Mantenimiento concurrente de la refrigeración",
    description: "Cualquier componente de refrigeración puede mantenerse sin afectar la carga de TI.",
    reference: "Uptime Institute, descripción pública de Tier III (mantenimiento concurrente).",
    questionIds: ["E4"],
    evaluate: (a) => yes(a, "E4"),
  },

  // Tier III — no críticos
  {
    id: "R-T3-UTILITY",
    tier: 3,
    category: "A",
    critical: false,
    title: "Más de una acometida eléctrica",
    description: "La instalación no depende de una única fuente externa.",
    reference: "Práctica de resiliencia; no es un criterio crítico de clasificación en esta matriz.",
    questionIds: ["A3"],
    evaluate: (a) => oneOf(a, "A3", ["two_standby", "two_active"]),
  },
  {
    id: "R-T3-FUEL",
    tier: 3,
    category: "B",
    critical: false,
    title: "Autonomía de combustible de al menos 12 horas",
    description: "El combustible almacenado permite operar el generador a plena carga durante al menos 12 horas.",
    reference: "Valor orientativo frecuente en niveles altos; verificar con el estándar vigente.",
    questionIds: ["B3", "B4"],
    evaluate: (a) =>
      withParent(a, "B3", () => oneOf(a, "B4", ["12to24h", "24to72h", "gt72h"])),
  },

  // ================== TIER IV — tolerancia a fallas =========================
  {
    id: "R-T4-ACTIVE-PATHS",
    tier: 4,
    category: "E",
    critical: true,
    title: "Rutas activas simultáneas e independientes (energía y refrigeración)",
    description: "Hay al menos dos rutas activas de energía y de refrigeración al mismo tiempo.",
    reference: "Uptime Institute, descripción pública de Tier IV.",
    questionIds: ["E1", "E2"],
    evaluate: (a) =>
      all(oneOf(a, "E1", ["two_active"]), oneOf(a, "E2", ["two_active"])),
  },
  {
    id: "R-T4-POWER-2N",
    tier: 4,
    category: "D",
    critical: true,
    title: "UPS con redundancia 2N o superior",
    description: "Dos sistemas UPS completos e independientes alimentan la carga.",
    reference: "Uptime Institute, descripción pública de Tier IV (tolerancia a fallas).",
    questionIds: ["B1", "D1"],
    evaluate: (a) => withParent(a, "B1", () => oneOf(a, "D1", TWO_N)),
  },
  {
    id: "R-T4-COMPARTMENT",
    tier: 4,
    category: "E",
    critical: true,
    title: "Rutas compartimentadas sin puntos únicos de falla compartidos",
    description: "Las rutas están físicamente separadas; un evento en una no afecta a la otra.",
    reference: "Uptime Institute, descripción pública de Tier IV.",
    questionIds: ["E5"],
    evaluate: (a) => yes(a, "E5"),
  },
  {
    id: "R-T4-FAULT",
    tier: 4,
    category: "F",
    critical: true,
    title: "Una falla única no afecta la carga de TI",
    description: "El diseño tolera la falla de un componente o ruta sin interrumpir la carga.",
    reference: "Uptime Institute, descripción pública de Tier IV (tolerancia a fallas).",
    questionIds: ["F1"],
    evaluate: (a) => yes(a, "F1"),
  },
  {
    id: "R-T4-AUTO",
    tier: 4,
    category: "F",
    critical: true,
    title: "Respuesta autónoma ante fallas",
    description: "Las transferencias y conmutaciones ocurren sin intervención humana.",
    reference: "Uptime Institute, descripción pública de Tier IV.",
    questionIds: ["F2"],
    evaluate: (a) => yes(a, "F2"),
  },
  {
    id: "R-T4-COOL-CONT",
    tier: 4,
    category: "C",
    critical: true,
    title: "Refrigeración continua durante cortes eléctricos",
    description: "La refrigeración sigue operando durante el corte y la transferencia al generador.",
    reference: "Uptime Institute, descripción pública de Tier IV (refrigeración continua).",
    questionIds: ["C1", "C2"],
    evaluate: (a) => withParent(a, "C1", () => yes(a, "C2")),
  },

  // ===================== Operación (no crítica, transversal) =================
  {
    id: "R-OPS-TESTS",
    tier: 2,
    category: "B",
    critical: false,
    title: "Pruebas periódicas de UPS y generador",
    description: "El respaldo se prueba con regularidad para demostrar que funcionará.",
    reference: "Buena práctica de sostenibilidad operativa.",
    questionIds: ["B5"],
    evaluate: (a) => yes(a, "B5"),
  },
  {
    id: "R-OPS-PROCEDURES",
    tier: 2,
    category: "F",
    critical: false,
    title: "Procedimientos operativos y de emergencia documentados",
    description: "Existen procedimientos escritos de operación, mantenimiento y emergencia.",
    reference: "Buena práctica de sostenibilidad operativa.",
    questionIds: ["F3"],
    evaluate: (a) => yes(a, "F3"),
  },
  {
    id: "R-OPS-FAULT-TEST",
    tier: 3,
    category: "F",
    critical: false,
    title: "Pruebas de falla o cortes simulados en el último año",
    description: "La respuesta de la infraestructura ante fallas se ha probado recientemente.",
    reference: "Buena práctica de sostenibilidad operativa.",
    questionIds: ["F4"],
    evaluate: (a) => yes(a, "F4"),
  },
  {
    id: "R-OPS-DOWNTIME",
    tier: 2,
    category: "F",
    critical: false,
    title: "Indisponibilidad por infraestructura menor a 4 horas al año",
    description: "Las fallas de energía o refrigeración causaron poca o ninguna indisponibilidad.",
    reference: "Indicador histórico orientativo; no equivale a una medición certificada.",
    questionIds: ["F5"],
    evaluate: (a) => oneOf(a, "F5", ["none", "lt4h"]),
  },
];

export const REQUIREMENT_BY_ID: Record<string, Requirement> = Object.fromEntries(
  REQUIREMENTS.map((r) => [r.id, r]),
);
