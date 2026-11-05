import { describe, expect, it } from "vitest";
import { fetchConcept, fetchExplanation } from "@/lib/ai/client";
import { scenarioAnswers } from "./helpers";

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));

describe("Cliente de IA del navegador: fallos de API", () => {
  it("devuelve 'no disponible' si la red falla (sin lanzar)", async () => {
    const out = await fetchExplanation("empresa", scenarioAnswers("basic"), () => Promise.reject(new TypeError("network")));
    expect(out).toMatchObject({ available: false, reason: "error" });
  });

  it("devuelve 'no disponible' si la respuesta no es JSON", async () => {
    const out = await fetchExplanation("empresa", {}, () => Promise.resolve(new Response("<html>", { status: 502 })));
    expect(out.available).toBe(false);
  });

  it("propaga el motivo 'not_configured' del servidor", async () => {
    const out = await fetchExplanation("empresa", {}, () =>
      json({ available: false, reason: "not_configured", message: "La personalización con IA no está disponible: sin clave." }),
    );
    expect(out).toMatchObject({ available: false, reason: "not_configured" });
  });

  it("traduce HTTP 429 a 'rate_limited'", async () => {
    const out = await fetchConcept("¿Qué es UPS?", undefined, () =>
      json({ available: false, reason: "rate_limited", message: "x" }, 429),
    );
    expect(out).toMatchObject({ available: false, reason: "rate_limited" });
  });

  it("trata errores 400 del servidor como no disponibles", async () => {
    const out = await fetchConcept("ab", undefined, () => json({ error: "Datos de entrada inválidos." }, 400));
    expect(out.available).toBe(false);
  });

  it("devuelve los datos cuando el servidor responde con éxito", async () => {
    const out = await fetchConcept("¿Qué es N+1?", "empresa", () =>
      json({ available: true, data: { explanation: "Un componente extra de respaldo." }, model: "m" }),
    );
    expect(out).toMatchObject({ available: true, data: { explanation: "Un componente extra de respaldo." } });
  });

  it("ignora motivos desconocidos y no fabrica contenido", async () => {
    const out = await fetchExplanation("empresa", {}, () => json({ available: false, reason: "raro", message: "m" }));
    expect(out).toMatchObject({ available: false, reason: "error" });
    expect("data" in out).toBe(false);
  });
});
