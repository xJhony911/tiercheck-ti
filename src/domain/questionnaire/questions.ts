import type { Question, QuestionOption } from "../types";

/**
 * DEFINICIÓN DEL CUESTIONARIO
 * ---------------------------------------------------------------------------
 * Solo datos. La lógica de evaluación vive en `domain/rules/requirements.ts`.
 * El campo `rules` indica qué requisitos de la matriz consumen cada respuesta
 * (se verifica por prueba automatizada que coincida con la matriz).
 *
 * Preguntas condicionales (`showIf`): solo profundizan en un tema cuando la
 * pregunta padre lo permite. Los requisitos esenciales siempre se evalúan:
 * si el padre es "No", el requisito dependiente se considera no cumplido.
 */

const YES_NO_UNKNOWN: QuestionOption[] = [
  { value: "yes", label: "Sí" },
  { value: "no", label: "No" },
  { value: "unknown", label: "No sé" },
];

/** Configuración de redundancia de un sistema (N, N+1, 2N, 2N+1). */
const REDUNDANCY_CONFIG: QuestionOption[] = [
  { value: "n", label: "N: solo la capacidad necesaria, sin redundancia" },
  { value: "n1", label: "N+1: un módulo adicional de respaldo" },
  { value: "2n", label: "2N: dos sistemas completos e independientes" },
  { value: "2n1", label: "2N+1 o superior" },
  { value: "unknown", label: "No sé" },
];

/** Rutas de distribución. */
const PATH_OPTIONS: QuestionOption[] = [
  { value: "one", label: "Una sola ruta" },
  {
    value: "two_standby",
    label: "Dos rutas: una activa y otra alterna (en espera)",
  },
  {
    value: "two_active",
    label: "Dos o más rutas activas simultáneas e independientes",
  },
  { value: "unknown", label: "No sé" },
];

const REF_UPTIME =
  "Uptime Institute, descripción pública de la clasificación Tier (uptimeinstitute.com/tiers).";

export const QUESTIONS: Question[] = [
  // ---------------------------------------------------------------- A
  {
    id: "A1",
    category: "A",
    text: "¿Los equipos de TI críticos están en un espacio dedicado (sala o área exclusiva para servidores y redes), separado de oficinas y bodegas?",
    help: "Un espacio dedicado permite controlar acceso, ambiente y distribución eléctrica para la carga de TI.",
    options: YES_NO_UNKNOWN,
    critical: true,
    rules: ["R-T1-SPACE"],
    reference: REF_UPTIME + " Tier I: espacio dedicado para sistemas de TI.",
  },
  {
    id: "A2",
    category: "A",
    text: "¿La sala de TI tiene circuitos y tableros de distribución eléctrica dedicados a la carga de TI?",
    help: "Evita que cargas ajenas (iluminación, oficinas) compartan los circuitos de los equipos críticos.",
    options: YES_NO_UNKNOWN,
    critical: false,
    rules: ["R-T1-DIST"],
  },
  {
    id: "A3",
    category: "A",
    text: "¿Cuántas acometidas (suministros) de la red eléctrica pública alimentan la instalación?",
    help: "Una segunda acometida reduce la dependencia de una única fuente externa.",
    options: [
      { value: "one", label: "Una sola acometida" },
      { value: "two_standby", label: "Dos: una principal y otra de respaldo" },
      { value: "two_active", label: "Dos o más activas simultáneamente" },
      { value: "unknown", label: "No sé" },
    ],
    critical: false,
    rules: ["R-T3-UTILITY"],
  },
  {
    id: "A4",
    category: "A",
    text: "¿La capacidad eléctrica instalada cubre la carga de TI actual con margen de crecimiento razonable?",
    help: "Compare la carga medida o estimada (kW) con la capacidad de transformador, tableros y UPS.",
    options: YES_NO_UNKNOWN,
    critical: true,
    rules: ["R-T1-POWER-CAP"],
    reference: REF_UPTIME + " Tier I: capacidad básica para soportar la carga de TI.",
  },
  {
    id: "A5",
    category: "A",
    text: "¿Existe monitoreo del estado y consumo de la energía de la sala de TI (medidores, alarmas o software)?",
    options: YES_NO_UNKNOWN,
    critical: false,
    rules: ["R-T1-MON-POWER"],
  },

  // ---------------------------------------------------------------- B
  {
    id: "B1",
    category: "B",
    text: "¿La carga de TI está protegida por un sistema UPS (energía ininterrumpible)?",
    help: "El UPS cubre cortes breves y las transiciones mientras arranca el generador.",
    options: YES_NO_UNKNOWN,
    critical: true,
    rules: ["R-T1-UPS", "R-T1-UPS-RUNTIME", "R-T2-UPS-N1", "R-T4-POWER-2N"],
    reference: REF_UPTIME + " Tier I: UPS para cortes breves.",
  },
  {
    id: "B2",
    category: "B",
    text: "¿Cuál es la autonomía aproximada del UPS a plena carga de TI?",
    help: "Debe cubrir al menos el arranque y la transferencia al generador, o el apagado ordenado.",
    options: [
      { value: "lt5", label: "Menos de 5 minutos" },
      { value: "5to15", label: "Entre 5 y 15 minutos" },
      { value: "gt15", label: "Más de 15 minutos" },
      { value: "unknown", label: "No sé" },
    ],
    critical: false,
    rules: ["R-T1-UPS-RUNTIME"],
    showIf: { questionId: "B1", anyOf: ["yes"] },
  },
  {
    id: "B3",
    category: "B",
    text: "¿Existe un generador de respaldo (motor/generador) para cortes eléctricos prolongados?",
    options: YES_NO_UNKNOWN,
    critical: true,
    rules: ["R-T1-GEN", "R-T1-ATS", "R-T2-GEN-N1", "R-T3-FUEL"],
    reference:
      REF_UPTIME + " Tier I: generador para proteger las funciones de TI ante cortes prolongados.",
  },
  {
    id: "B4",
    category: "B",
    text: "¿Cuánta autonomía de combustible tiene el generador a plena carga, sin reabastecimiento?",
    help: "Referencia orientativa: se suele recomendar al menos 12 horas para niveles altos; verifique el estándar vigente.",
    options: [
      { value: "lt12h", label: "Menos de 12 horas" },
      { value: "12to24h", label: "Entre 12 y 24 horas" },
      { value: "24to72h", label: "Entre 24 y 72 horas" },
      { value: "gt72h", label: "Más de 72 horas" },
      { value: "unknown", label: "No sé" },
    ],
    critical: false,
    rules: ["R-T3-FUEL"],
    showIf: { questionId: "B3", anyOf: ["yes"] },
  },
  {
    id: "B5",
    category: "B",
    text: "¿Se prueban periódicamente el UPS y el generador (con carga o simulando un corte)?",
    help: "Las pruebas periódicas demuestran que el respaldo funcionará cuando se necesite.",
    options: YES_NO_UNKNOWN,
    critical: false,
    rules: ["R-OPS-TESTS"],
  },
  {
    id: "B6",
    category: "B",
    text: "¿La transferencia al generador es automática (sin intervención humana)?",
    options: YES_NO_UNKNOWN,
    critical: false,
    rules: ["R-T1-ATS"],
    showIf: { questionId: "B3", anyOf: ["yes"] },
  },

  // ---------------------------------------------------------------- C
  {
    id: "C1",
    category: "C",
    text: "¿La sala de TI cuenta con refrigeración dedicada que opera de forma continua (24x7), independiente del aire acondicionado de oficinas?",
    help: "El enfriamiento no debe apagarse al terminar el horario de oficina.",
    options: YES_NO_UNKNOWN,
    critical: true,
    rules: ["R-T1-COOL", "R-T2-COOL-N1", "R-T4-COOL-CONT"],
    reference: REF_UPTIME + " Tier I: refrigeración dedicada que no se apaga fuera del horario de oficina.",
  },
  {
    id: "C2",
    category: "C",
    text: "¿La refrigeración sigue funcionando durante un corte eléctrico y la transferencia al generador (respaldada por UPS o generador)?",
    help: "Los equipos de TI generan calor aunque haya un corte; la refrigeración sin respaldo puede causar sobrecalentamiento en minutos.",
    options: YES_NO_UNKNOWN,
    critical: true,
    rules: ["R-T4-COOL-CONT"],
    showIf: { questionId: "C1", anyOf: ["yes"] },
  },
  {
    id: "C3",
    category: "C",
    text: "¿Hay monitoreo de temperatura y humedad de la sala de TI con alarmas?",
    options: YES_NO_UNKNOWN,
    critical: false,
    rules: ["R-T1-MON-ENV"],
  },
  {
    id: "C4",
    category: "C",
    text: "¿La capacidad de refrigeración instalada cubre la carga térmica de TI actual?",
    help: "Compare la capacidad de enfriamiento (kW térmicos) con la carga de TI en kW.",
    options: YES_NO_UNKNOWN,
    critical: true,
    rules: ["R-T1-COOL-CAP"],
    reference: REF_UPTIME + " Tier I: capacidad básica para soportar la carga de TI.",
  },

  // ---------------------------------------------------------------- D
  {
    id: "D1",
    category: "D",
    text: "¿Qué configuración de redundancia tiene el sistema UPS?",
    help: "N+1 significa que la falla de un módulo no reduce la capacidad por debajo de la carga.",
    options: REDUNDANCY_CONFIG,
    critical: true,
    rules: ["R-T2-UPS-N1", "R-T4-POWER-2N"],
    reference: REF_UPTIME + " Tier II: componentes de capacidad redundantes.",
    showIf: { questionId: "B1", anyOf: ["yes"] },
  },
  {
    id: "D2",
    category: "D",
    text: "¿Qué configuración de redundancia tiene el sistema de generadores?",
    options: REDUNDANCY_CONFIG,
    critical: true,
    rules: ["R-T2-GEN-N1"],
    reference: REF_UPTIME + " Tier II: componentes de capacidad redundantes.",
    showIf: { questionId: "B3", anyOf: ["yes"] },
  },
  {
    id: "D3",
    category: "D",
    text: "¿Qué configuración de redundancia tiene la refrigeración?",
    options: REDUNDANCY_CONFIG,
    critical: true,
    rules: ["R-T2-COOL-N1"],
    reference: REF_UPTIME + " Tier II: componentes de capacidad redundantes.",
    showIf: { questionId: "C1", anyOf: ["yes"] },
  },
  {
    id: "D4",
    category: "D",
    text: "¿Los equipos de TI críticos tienen doble fuente de alimentación conectada a dos circuitos o rutas distintas?",
    help: "Permite que un equipo siga operando si una ruta eléctrica queda fuera de servicio.",
    options: [
      { value: "all_critical", label: "Sí, todos los equipos críticos" },
      { value: "some", label: "Solo algunos equipos" },
      { value: "none", label: "No, fuente única" },
      { value: "unknown", label: "No sé" },
    ],
    critical: true,
    rules: ["R-T3-DUALPSU"],
    reference: REF_UPTIME + " Tier III: equipos de TI con doble alimentación.",
  },

  // ---------------------------------------------------------------- E
  {
    id: "E1",
    category: "E",
    text: "¿Cuántas rutas de distribución eléctrica llevan la energía hasta la carga de TI?",
    help: "Una ruta incluye tableros, transferencias y cableado desde la fuente hasta los equipos.",
    options: PATH_OPTIONS,
    critical: true,
    rules: ["R-T3-PATHS-ELEC", "R-T4-ACTIVE-PATHS"],
    reference: REF_UPTIME + " Tier III: múltiples rutas, una activa. Tier IV: múltiples rutas activas.",
  },
  {
    id: "E2",
    category: "E",
    text: "¿Cuántas rutas de distribución de refrigeración (tuberías, ductos o circuitos de enfriamiento) sirven a la sala de TI?",
    options: PATH_OPTIONS,
    critical: true,
    rules: ["R-T3-PATHS-COOL", "R-T4-ACTIVE-PATHS"],
    reference: REF_UPTIME + " Tier III y IV: múltiples rutas de distribución.",
  },
  {
    id: "E3",
    category: "E",
    text: "¿Se puede dar mantenimiento o reemplazar cualquier componente de la ruta eléctrica (UPS, tableros, transferencias) sin apagar ni afectar la carga de TI?",
    help: "Es la esencia del mantenimiento concurrente. Responda “Sí” solo si se ha planificado o demostrado.",
    options: YES_NO_UNKNOWN,
    critical: true,
    rules: ["R-T3-MAINT-POWER"],
    reference: REF_UPTIME + " Tier III: mantenimiento concurrente.",
  },
  {
    id: "E4",
    category: "E",
    text: "¿Se puede dar mantenimiento a cualquier componente de refrigeración sin afectar la operación de la carga de TI?",
    options: YES_NO_UNKNOWN,
    critical: true,
    rules: ["R-T3-MAINT-COOL"],
    reference: REF_UPTIME + " Tier III: mantenimiento concurrente.",
  },
  {
    id: "E5",
    category: "E",
    text: "¿Las rutas están físicamente separadas (compartimentadas) y sin puntos únicos de falla compartidos entre ellas?",
    help: "Un incendio, inundación o falla localizada en una ruta no debería afectar a la otra.",
    options: YES_NO_UNKNOWN,
    critical: true,
    rules: ["R-T4-COMPARTMENT"],
    reference: REF_UPTIME + " Tier IV: sistemas compartimentados.",
  },

  // ---------------------------------------------------------------- F
  {
    id: "F1",
    category: "F",
    text: "¿La falla de un solo componente o ruta puede ocurrir sin afectar la carga de TI (tolerancia a fallas)?",
    help: "Responda “Sí” solo si el diseño lo contempla y se ha verificado, no solo si es probable.",
    options: YES_NO_UNKNOWN,
    critical: true,
    rules: ["R-T4-FAULT"],
    reference: REF_UPTIME + " Tier IV: tolerancia a fallas.",
  },
  {
    id: "F2",
    category: "F",
    text: "¿La infraestructura responde de forma automática a una falla (transferencias y conmutaciones sin intervención humana)?",
    options: YES_NO_UNKNOWN,
    critical: true,
    rules: ["R-T4-AUTO"],
    reference: REF_UPTIME + " Tier IV: respuesta autónoma ante fallas.",
  },
  {
    id: "F3",
    category: "F",
    text: "¿Existen procedimientos documentados de operación, mantenimiento y respuesta a emergencias de la infraestructura?",
    options: YES_NO_UNKNOWN,
    critical: false,
    rules: ["R-OPS-PROCEDURES"],
  },
  {
    id: "F4",
    category: "F",
    text: "¿Se han realizado en los últimos 12 meses pruebas de falla o cortes simulados de la infraestructura?",
    options: YES_NO_UNKNOWN,
    critical: false,
    rules: ["R-OPS-FAULT-TEST"],
  },
  {
    id: "F5",
    category: "F",
    text: "En los últimos 12 meses, ¿cuánto tiempo de indisponibilidad de TI causaron fallas de la infraestructura (energía o refrigeración)?",
    options: [
      { value: "none", label: "Ninguna" },
      { value: "lt4h", label: "Menos de 4 horas" },
      { value: "4to24h", label: "Entre 4 y 24 horas" },
      { value: "gt24h", label: "Más de 24 horas" },
      { value: "unknown", label: "No sé" },
    ],
    critical: false,
    rules: ["R-OPS-DOWNTIME"],
  },
];

export const QUESTION_BY_ID: Record<string, Question> = Object.fromEntries(
  QUESTIONS.map((q) => [q.id, q]),
);

export function getQuestionsByCategory(categoryId: string): Question[] {
  return QUESTIONS.filter((q) => q.category === categoryId);
}
