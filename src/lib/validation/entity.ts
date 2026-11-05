import { z } from "zod";
import { containsSecretPattern } from "@/lib/ai/sanitize";

export const ENTITY_TYPE_OPTIONS = [
  { value: "empresa", label: "Empresa" },
  { value: "universidad", label: "Universidad" },
  { value: "institucion_publica", label: "Institución pública" },
  { value: "otra", label: "Otra" },
] as const;

export const FACILITY_TYPE_OPTIONS = [
  "Sala de servidores",
  "Centro de datos corporativo",
  "Centro de datos institucional",
  "Sala técnica / closet de comunicaciones",
  "Centro de datos en colocación",
  "Otra instalación",
] as const;

const noSecrets = (label: string) => (text: string | undefined) =>
  text === undefined || !containsSecretPattern(text)
    ? true
    : `${label}: parece contener una clave o dato sensible. Por favor no lo incluya.`;

/**
 * Datos generales de la entidad. No se solicita información sensible:
 * los textos libres se rechazan si parecen contener claves o secretos.
 */
export const EntityInfoSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .max(100, "El nombre no puede superar 100 caracteres.")
    .optional()
    .refine((v) => noSecrets("Nombre")(v) === true, {
      message: "Nombre: parece contener una clave o dato sensible.",
    }),
  entityType: z.enum(["empresa", "universidad", "institucion_publica", "otra"], {
    error: "Seleccione el tipo de entidad.",
  }),
  facilityType: z
    .string()
    .trim()
    .min(2, "Indique el tipo de instalación evaluada.")
    .max(100, "El tipo de instalación no puede superar 100 caracteres."),
  observations: z
    .string()
    .trim()
    .max(500, "Las observaciones no pueden superar 500 caracteres.")
    .optional()
    .refine((v) => noSecrets("Observaciones")(v) === true, {
      message: "Observaciones: parece contener una clave o dato sensible.",
    }),
});

export type EntityFormValues = z.infer<typeof EntityInfoSchema>;

/** Devuelve un mapa campo -> mensaje de error (vacío si es válido). */
export function validateEntity(values: unknown): Record<string, string> {
  const parsed = EntityInfoSchema.safeParse(values);
  if (parsed.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of parsed.error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
