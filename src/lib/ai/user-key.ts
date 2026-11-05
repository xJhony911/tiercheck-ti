/**
 * Almacenamiento seguro en el cliente (localStorage) para la clave de API de Gemini.
 * La clave NUNCA se envía a ningún servidor intermedio; solo se utiliza para
 * consultar directamente los endpoints oficiales de Google AI Studio desde el navegador.
 */

const STORAGE_KEY = "tiercheck_gemini_api_key";
const PRIMARY_MODEL = "gemini-3.1-flash-lite";
const FALLBACK_MODEL = "gemini-3.5-flash-lite";

export function getUserApiKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const key = localStorage.getItem(STORAGE_KEY)?.trim();
    return key && key.length > 10 ? key : null;
  } catch {
    return null;
  }
}

export function setUserApiKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, key.trim());
    window.dispatchEvent(new CustomEvent("tiercheck:api-key-updated"));
  } catch {
    // Si localStorage está bloqueado, no lanza error fatal
  }
}

export function removeUserApiKey(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("tiercheck:api-key-updated"));
  } catch {
    // Silencioso
  }
}

export async function testGeminiApiKey(
  apiKey: string,
): Promise<{ ok: boolean; message: string; model?: string }> {
  const cleanKey = apiKey.trim();
  if (!cleanKey) return { ok: false, message: "La clave no puede estar vacía." };

  const models = [PRIMARY_MODEL, FALLBACK_MODEL];
  let lastError = "No se pudo conectar con Google Gemini.";

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Responde {\"status\": \"ok\"}" }] }],
          generationConfig: {
            responseMimeType: "application/json",
            maxOutputTokens: 20,
          },
        }),
      });

      if (res.ok) {
        return { ok: true, message: `Conexión exitosa con ${model}`, model };
      }

      const data = await res.json().catch(() => ({}));
      const apiMsg = (data as { error?: { message?: string } })?.error?.message;
      if (res.status === 400 || res.status === 403) {
        return {
          ok: false,
          message: apiMsg ? `Clave inválida: ${apiMsg}` : "Clave de API inválida o sin permisos.",
        };
      }
      if (apiMsg) lastError = apiMsg;
    } catch {
      lastError = "Error de red al conectar con Google AI Studio.";
    }
  }

  return { ok: false, message: lastError };
}
