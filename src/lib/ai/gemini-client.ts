import { GoogleGenAI } from "@google/genai";

/**
 * Cliente de bajo nivel para Gemini. SOLO se usa en el servidor
 * (rutas /api/ai/*). La clave se lee de variables de entorno y nunca se
 * envía al navegador.
 */

export interface LlmRequest {
  system: string;
  user: string;
  signal?: AbortSignal;
}

/** Abstracción mínima del modelo; permite sustituirla por un simulacro en pruebas. */
export interface LlmClient {
  readonly model: string;
  generate(req: LlmRequest): Promise<string>;
}

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export function createGeminiClient(apiKey: string, model: string): LlmClient {
  const ai = new GoogleGenAI({ apiKey });
  return {
    model,
    async generate({ system, user, signal }) {
      const response = await ai.models.generateContent({
        model,
        contents: user,
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
          temperature: 0.3,
          maxOutputTokens: 2048,
          abortSignal: signal,
        },
      });
      const text = response.text;
      if (!text) throw new Error("Respuesta vacía de Gemini.");
      return text;
    },
  };
}

/**
 * Devuelve un cliente configurado o `null` si GEMINI_API_KEY no está definida.
 * (No lanza error: la plataforma sigue funcionando sin IA.)
 */
export function getConfiguredClient(
  env: Record<string, string | undefined> = process.env,
): LlmClient | null {
  const key = env.GEMINI_API_KEY?.trim();
  if (!key || key === "tu_clave_aqui") return null;
  const model = env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODEL;
  return createGeminiClient(key, model);
}
