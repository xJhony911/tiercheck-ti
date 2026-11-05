import type { Category } from "../types";

/** Categorías del cuestionario, en el orden en que se presentan. */
export const CATEGORIES: Category[] = [
  {
    id: "A",
    name: "Infraestructura eléctrica",
    description:
      "Espacio dedicado, capacidad y distribución de energía para la carga de TI.",
  },
  {
    id: "B",
    name: "UPS, generadores y respaldo",
    description:
      "Sistemas que mantienen la energía durante cortes breves y prolongados.",
  },
  {
    id: "C",
    name: "Climatización y control ambiental",
    description:
      "Refrigeración dedicada, capacidad térmica y monitoreo del ambiente.",
  },
  {
    id: "D",
    name: "Redundancia de componentes",
    description:
      "Capacidad adicional para tolerar la salida de un componente (N, N+1, 2N).",
  },
  {
    id: "E",
    name: "Rutas de distribución y mantenimiento",
    description:
      "Rutas de energía y refrigeración, y posibilidad de mantenimiento sin apagar la carga.",
  },
  {
    id: "F",
    name: "Continuidad operativa y tolerancia a fallas",
    description:
      "Comportamiento ante fallas, respuesta automática y prácticas operativas.",
  },
];

export const CATEGORY_BY_ID: Record<string, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c]),
);
