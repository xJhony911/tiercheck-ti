import type { TierLevel } from "./types";

export const TIER_ROMAN: Record<TierLevel, string> = {
  1: "I",
  2: "II",
  3: "III",
  4: "IV",
};

export function tierLabel(tier: TierLevel): string {
  return `Tier ${TIER_ROMAN[tier]}`;
}

export interface TierInfo {
  level: TierLevel;
  name: string;
  headline: string;
  description: string;
  /** Disponibilidad comúnmente citada de forma pública. Es referencial, no una garantía. */
  citedAvailability: string;
  keyPoints: string[];
}

/**
 * Descripción informativa de los niveles Tier (contenido público y conceptual).
 * Se usa en la página de inicio y en el informe. No sustituye al estándar oficial.
 */
export const TIER_INFO: TierInfo[] = [
  {
    level: 1,
    name: "Capacidad básica",
    headline: "Infraestructura básica sin redundancia",
    description:
      "Cuenta con los componentes esenciales para soportar la carga de TI, pero cualquier falla o mantenimiento puede requerir una interrupción.",
    citedAvailability: "≈ 99,671 %",
    keyPoints: [
      "Espacio dedicado para TI",
      "UPS y generador",
      "Refrigeración dedicada",
    ],
  },
  {
    level: 2,
    name: "Componentes redundantes",
    headline: "Capacidad redundante en componentes clave",
    description:
      "Añade capacidad adicional (N+1) en UPS, generadores y refrigeración, con una única ruta de distribución.",
    citedAvailability: "≈ 99,741 %",
    keyPoints: [
      "UPS, generador y refrigeración N+1",
      "Una sola ruta de distribución",
      "Menor riesgo por falla de un componente",
    ],
  },
  {
    level: 3,
    name: "Mantenimiento concurrente",
    headline: "Mantenimiento sin apagar la carga de TI",
    description:
      "Múltiples rutas de distribución (una activa) permiten mantener o reemplazar cualquier componente sin detener los equipos.",
    citedAvailability: "≈ 99,982 %",
    keyPoints: [
      "Rutas de distribución múltiples",
      "Equipos con doble alimentación",
      "Mantenimiento sin interrupción",
    ],
  },
  {
    level: 4,
    name: "Tolerancia a fallas",
    headline: "Una falla única no afecta la operación",
    description:
      "Rutas activas independientes y compartimentadas con respuesta autónoma: una falla de un componente o ruta no interrumpe la carga de TI.",
    citedAvailability: "≈ 99,995 %",
    keyPoints: [
      "Rutas activas independientes (2N)",
      "Compartimentación física",
      "Respuesta autónoma ante fallas",
    ],
  },
];

/** Texto fijo sobre las limitaciones de la evaluación. */
export const DISCLAIMER_SHORT =
  "TierCheck TI es una herramienta orientativa. No otorga certificaciones oficiales ni reemplaza una auditoría profesional.";

export const LIMITATIONS: string[] = [
  "El resultado es una estimación preliminar basada en respuestas autodeclaradas, que no se verifican con mediciones ni inspección.",
  "No constituye una certificación de Uptime Institute ni de ninguna otra entidad, y no reemplaza una auditoría profesional.",
  "Se usan únicamente criterios descritos públicamente; el estándar oficial completo de Uptime Institute es de acceso restringido y no se reproduce aquí.",
  "El sistema Tier I-IV de Uptime Institute y las clasificaciones Rated-1 a Rated-4 de ANSI/TIA-942 son distintos; esta herramienta no los presenta como equivalentes.",
  "Una respuesta “No sé” se trata como información no verificada, nunca como cumplimiento.",
  "La certificación oficial evalúa diseño, construcción y sostenibilidad operativa, aspectos que este cuestionario cubre solo parcialmente.",
];
