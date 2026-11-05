import { describe, expect, it } from "vitest";
import { evaluateTier } from "@/domain/rules/engine";
import { getConfiguredClient, type LlmClient } from "@/lib/ai/gemini-client";
import { explainConcept, explainResult, classifyError } from "@/lib/ai/service";
import { SYSTEM_PROMPT } from "@/lib/ai/prompt";
import { RateLimiter } from "@/lib/rate-limit";
import { handleConcept, handleExplain, type HandlerDeps } from "@/lib/ai/handlers";
import {
  containsForbiddenClaim,
  containsSecretPattern,
  isConsistentWithEngine,
  mentionedTiers,
} from "@/lib/ai/sanitize";
import { scenarioAnswers } from "./helpers";

const goodExplanation = {
  executiveSummary:
    "La infraestructura muestra características compatibles de forma preliminar con Tier II.",
  explanation:
    "El motor determinó el nivel según las respuestas. Para Tier III faltan rutas alternas.",
  prioritizedActions: [
    { title: "Evaluar rutas alternas", detail: "Permite mantenimiento sin apagar la carga." },
  ],
  uncertainty: "Las respuestas son autodeclaradas y no se han verificado.",
};

function fakeClient(impl: (user: string, system: string) => Promise<string>): LlmClient & {
  calls: Array<{ system: string; user: string }>;
} {
  const calls: Array<{ system: string; user: string }> = [];
  return {
    model: "modelo-simulado",
    calls,
    generate: async ({ system, user }) => {
      calls.push({ system, user });
      return impl(user, system);
    },
  };
}

const request = {
  entityType: "universidad" as const,
  answers: scenarioAnswers("redundant"),
};

describe("Servicio de IA: funcionamiento sin API", () => {
  it("sin clave configurada devuelve 'no disponible' sin lanzar errores", async () => {
    const out = await explainResult(request, { client: null });
    expect(out.available).toBe(false);
    if (!out.available) {
      expect(out.reason).toBe("not_configured");
      expect(out.message).toMatch(/no está disponible/);
    }
  });

  it("getConfiguredClient devuelve null sin GEMINI_API_KEY o con el marcador de ejemplo", () => {
    expect(getConfiguredClient({})).toBeNull();
    expect(getConfiguredClient({ GEMINI_API_KEY: "   " })).toBeNull();
    expect(getConfiguredClient({ GEMINI_API_KEY: "tu_clave_aqui" })).toBeNull();
  });

  it("el resultado determinista no depende de la IA", async () => {
    const before = evaluateTier(request.answers);
    await explainResult(request, { client: null });
    await explainResult(request, {
      client: fakeClient(async () => {
        throw new Error("boom");
      }),
    });
    expect(evaluateTier(request.answers)).toEqual(before);
  });

  it("el concepto sin clave también degrada con elegancia", async () => {
    const out = await explainConcept("¿Qué es N+1?", undefined, { client: null });
    expect(out.available).toBe(false);
  });
});

describe("Servicio de IA: respuestas y fallos de la API", () => {
  it("acepta una respuesta válida y consistente con el motor", async () => {
    const client = fakeClient(async () => JSON.stringify(goodExplanation));
    const out = await explainResult(request, { client });
    expect(out.available).toBe(true);
    if (out.available) {
      expect(out.model).toBe("modelo-simulado");
      expect(out.data.prioritizedActions).toHaveLength(1);
    }
  });

  it("tolera cercos de markdown ```json", async () => {
    const client = fakeClient(async () => "```json\n" + JSON.stringify(goodExplanation) + "\n```");
    expect((await explainResult(request, { client })).available).toBe(true);
  });

  it("cuota excedida (HTTP 429) => 'quota'", async () => {
    const client = fakeClient(async () => {
      throw Object.assign(new Error("RESOURCE_EXHAUSTED: quota exceeded"), { status: 429 });
    });
    const out = await explainResult(request, { client });
    expect(out).toMatchObject({ available: false, reason: "quota" });
  });

  it("tiempo de espera agotado => 'timeout'", async () => {
    const client = fakeClient(() => new Promise<string>(() => {}));
    const out = await explainResult(request, { client, timeoutMs: 20 });
    expect(out).toMatchObject({ available: false, reason: "timeout" });
  });

  it("error genérico de red => 'error'", async () => {
    const client = fakeClient(async () => {
      throw new Error("fallo de red");
    });
    expect(await explainResult(request, { client })).toMatchObject({
      available: false,
      reason: "error",
    });
  });

  it("respuesta que no es JSON => 'invalid_response'", async () => {
    const client = fakeClient(async () => "Hola, soy una respuesta sin formato");
    expect(await explainResult(request, { client })).toMatchObject({
      available: false,
      reason: "invalid_response",
    });
  });

  it("JSON con estructura incorrecta => 'invalid_response'", async () => {
    const client = fakeClient(async () => JSON.stringify({ foo: "bar" }));
    expect(await explainResult(request, { client })).toMatchObject({
      available: false,
      reason: "invalid_response",
    });
  });

  it("descarta respuestas que mencionan un Tier superior al siguiente nivel", async () => {
    // El escenario 'redundant' es Tier II: solo se admite mencionar Tier II o III.
    const bad = {
      ...goodExplanation,
      executiveSummary: "Su infraestructura es en realidad compatible con Tier IV.",
    };
    const client = fakeClient(async () => JSON.stringify(bad));
    expect(await explainResult(request, { client })).toMatchObject({
      available: false,
      reason: "invalid_response",
    });
  });

  it("descarta respuestas que afirman certificación oficial", async () => {
    const bad = { ...goodExplanation, explanation: "Su centro de datos está certificado y cumple oficialmente." };
    const client = fakeClient(async () => JSON.stringify(bad));
    expect(await explainResult(request, { client })).toMatchObject({
      available: false,
      reason: "invalid_response",
    });
  });

  it("classifyError distingue cuota, tiempo de espera y otros errores", () => {
    expect(classifyError({ status: 429 })).toBe("quota");
    expect(classifyError({ message: "Quota exceeded for metric" })).toBe("quota");
    expect(classifyError({ name: "AbortError" })).toBe("timeout");
    expect(classifyError(new Error("x"))).toBe("error");
  });
});

describe("Servicio de IA: contenido enviado al modelo", () => {
  it("envía resultado, requisitos y recomendaciones, y el tipo general de organización", async () => {
    const client = fakeClient(async () => JSON.stringify(goodExplanation));
    await explainResult(request, { client });
    const prompt = client.calls[0].user;
    expect(prompt).toContain("universidad");
    expect(prompt).toContain("Tier II preliminar");
    expect(prompt).toContain("metRequirements");
    expect(prompt).toContain("recommendations");
    expect(prompt).toContain("technicalAnswers");
  });

  it("el prompt de sistema prohíbe decidir el Tier, inventar normas y afirmar certificación", () => {
    expect(SYSTEM_PROMPT).toMatch(/NUNCA decides/);
    expect(SYSTEM_PROMPT).toMatch(/No inventes/);
    expect(SYSTEM_PROMPT).toMatch(/No afirmes cumplimiento oficial/);
    expect(SYSTEM_PROMPT).toMatch(/ANSI\/TIA-942/);
  });
});

describe("Saneamiento", () => {
  it("detecta patrones de claves y secretos", () => {
    expect(containsSecretPattern("mi clave es AIzaSyA1234567890abcdefghijklmnop")).toBe(true);
    expect(containsSecretPattern("password: hunter2")).toBe(true);
    expect(containsSecretPattern("contraseña=abc123")).toBe(true);
    expect(containsSecretPattern("sk-abcdefghijklmnopqrstuvwxyz")).toBe(true);
    expect(containsSecretPattern("¿Qué es la redundancia N+1?")).toBe(false);
  });

  it("detecta niveles Tier mencionados", () => {
    expect(mentionedTiers("Tier II y tier 3, no TIER IV")).toEqual([2, 3, 4]);
    expect(mentionedTiers("sin niveles")).toEqual([]);
  });

  it("verifica consistencia con el nivel estimado", () => {
    expect(isConsistentWithEngine("Tier II ahora; Tier III requiere rutas.", 2)).toBe(true);
    expect(isConsistentWithEngine("Tier IV es posible.", 2)).toBe(false);
    expect(isConsistentWithEngine("Para Tier I faltan requisitos.", 0)).toBe(true);
    expect(isConsistentWithEngine("Tier III.", 0)).toBe(false);
    expect(containsForbiddenClaim("Está certificado Tier III")).toBe(true);
  });
});

describe("Rutas de API: validación, límites y errores", () => {
  const makeDeps = (client: LlmClient | null, limit = 100): HandlerDeps => ({
    getClient: () => client,
    limiter: new RateLimiter(limit, 60_000),
    timeoutMs: 50,
  });
  const post = (body: unknown, headers: Record<string, string> = {}) =>
    new Request("http://localhost/api/ai/explain", {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });

  it("sin clave responde 200 con available:false y motivo not_configured", async () => {
    const res = await handleExplain(post(request), makeDeps(null));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ available: false, reason: "not_configured" });
  });

  it("con cliente válido responde available:true", async () => {
    const client = fakeClient(async () => JSON.stringify(goodExplanation));
    const res = await handleExplain(post(request), makeDeps(client));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.available).toBe(true);
  });

  it("rechaza JSON mal formado (400)", async () => {
    const res = await handleExplain(post("{no es json"), makeDeps(null));
    expect(res.status).toBe(400);
  });

  it("rechaza preguntas o respuestas inexistentes (400)", async () => {
    const bad1 = await handleExplain(
      post({ entityType: "empresa", answers: { ZZ9: "yes" } }),
      makeDeps(null),
    );
    expect(bad1.status).toBe(400);
    const bad2 = await handleExplain(
      post({ entityType: "empresa", answers: { A1: "quizas" } }),
      makeDeps(null),
    );
    expect(bad2.status).toBe(400);
    const bad3 = await handleExplain(post({ entityType: "otro", answers: {} }), makeDeps(null));
    expect(bad3.status).toBe(400);
  });

  it("rechaza cuerpos demasiado grandes (413)", async () => {
    const res = await handleExplain(
      post({ entityType: "empresa", answers: {}, extra: "x".repeat(25_000) }),
      makeDeps(null),
    );
    expect(res.status).toBe(413);
  });

  it("aplica el límite de solicitudes por IP (429 con Retry-After)", async () => {
    const deps = makeDeps(null, 2);
    const h = { "x-forwarded-for": "10.0.0.1" };
    expect((await handleExplain(post(request, h), deps)).status).toBe(200);
    expect((await handleExplain(post(request, h), deps)).status).toBe(200);
    const blocked = await handleExplain(post(request, h), deps);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
    expect(await blocked.json()).toMatchObject({ reason: "rate_limited" });
    // Otra IP no está limitada
    const other = await handleExplain(post(request, { "x-forwarded-for": "10.0.0.2" }), deps);
    expect(other.status).toBe(200);
  });

  it("no reenvía al modelo el nombre ni las observaciones aunque lleguen en la solicitud", async () => {
    const client = fakeClient(async () => JSON.stringify(goodExplanation));
    await handleExplain(
      post({
        ...request,
        organizationName: "Universidad Secreta XYZ",
        observations: "Nuestra clave wifi es SuperSecreta123",
      }),
      makeDeps(client),
    );
    const sent = client.calls[0].user + client.calls[0].system;
    expect(sent).not.toContain("Secreta");
    expect(sent).not.toContain("SuperSecreta123");
  });

  it("el concepto rechaza textos con claves o secretos (400) y nunca los envía", async () => {
    const client = fakeClient(async () => JSON.stringify({ explanation: "Explicación válida de prueba." }));
    const res = await handleConcept(
      post({ concept: "mi api_key=AIzaSyA1234567890abcdefghijklmnop ¿qué es UPS?" }),
      makeDeps(client),
    );
    expect(res.status).toBe(400);
    expect(client.calls).toHaveLength(0);
  });

  it("el concepto responde con una explicación válida", async () => {
    const client = fakeClient(async () =>
      JSON.stringify({ explanation: "N+1 significa un componente adicional de respaldo." }),
    );
    const res = await handleConcept(post({ concept: "¿Qué es N+1?" }), makeDeps(client));
    const json = await res.json();
    expect(json.available).toBe(true);
    expect(json.data.explanation).toContain("N+1");
  });
});

describe("Limitador de solicitudes", () => {
  it("permite hasta el límite y libera cupos al pasar la ventana", () => {
    let now = 1_000;
    const limiter = new RateLimiter(2, 1000, () => now);
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(true);
    const denied = limiter.check("a");
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSeconds).toBeGreaterThanOrEqual(1);
    now += 1001;
    expect(limiter.check("a").allowed).toBe(true);
  });
});
