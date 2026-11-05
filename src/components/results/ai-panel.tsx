"use client";

import { useState } from "react";
import { Bot, CircleAlert, Loader2, MessageCircleQuestion, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchConcept, fetchExplanation } from "@/lib/ai/client";
import type { AiOutcome } from "@/lib/ai/schemas";
import type { StoredAi } from "@/lib/validation/records";
import type { EvaluationRecord } from "@/lib/validation/records";

interface Props {
  record: EvaluationRecord;
  onSaved: (ai: StoredAi) => void;
}

const SUGGESTIONS = ["¿Qué es N+1?", "¿Qué es mantenimiento concurrente?", "¿Diferencia entre UPS y generador?"];

export function AiPanel({ record, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const [unavailableMsg, setUnavailableMsg] = useState<string | null>(null);

  const [concept, setConcept] = useState("");
  const [conceptLoading, setConceptLoading] = useState(false);
  const [conceptAnswer, setConceptAnswer] = useState<{ q: string; a: string } | null>(null);
  const [conceptError, setConceptError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setUnavailableMsg(null);
    const outcome = await fetchExplanation(record.entity.entityType, record.answers);
    setLoading(false);
    if (outcome.available) {
      const stored: StoredAi = {
        model: outcome.model,
        generatedAt: new Date().toISOString(),
        ...outcome.data,
      };
      onSaved(stored);
    } else {
      setUnavailableMsg(outcome.message);
    }
  }

  async function ask(text: string) {
    const q = text.trim();
    if (q.length < 3) return;
    setConceptLoading(true);
    setConceptError(null);
    const outcome: AiOutcome<{ explanation: string }> = await fetchConcept(q, record.entity.entityType);
    setConceptLoading(false);
    if (outcome.available) setConceptAnswer({ q, a: outcome.data.explanation });
    else {
      setConceptAnswer(null);
      setConceptError(outcome.message);
    }
  }

  const ai = record.ai;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-electric" aria-hidden /> Explicación personalizada con IA
        </CardTitle>
        <CardDescription>
          Opcional y complementaria. La IA (Gemini) solo recibe el resultado del motor, los requisitos, las
          recomendaciones, las respuestas técnicas y el tipo general de organización. <strong>Nunca decide ni modifica el nivel Tier.</strong>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {ai ? (
          <div className="animate-in fade-in space-y-4 rounded-xl border bg-accent/40 p-4 text-sm">
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Bot className="size-4" aria-hidden /> Texto generado por IA ({ai.model}) · puede contener imprecisiones
            </p>
            <div>
              <h4 className="font-semibold">Resumen ejecutivo</h4>
              <p className="mt-1">{ai.executiveSummary}</p>
            </div>
            <div>
              <h4 className="font-semibold">Explicación del diagnóstico</h4>
              <p className="mt-1">{ai.explanation}</p>
            </div>
            {ai.prioritizedActions.length > 0 && (
              <div>
                <h4 className="font-semibold">Acciones priorizadas</h4>
                <ol className="mt-1 list-decimal space-y-1.5 pl-5">
                  {ai.prioritizedActions.map((a) => (
                    <li key={a.title}><strong>{a.title}.</strong> {a.detail}</li>
                  ))}
                </ol>
              </div>
            )}
            <div>
              <h4 className="font-semibold">Incertidumbre</h4>
              <p className="mt-1 text-muted-foreground">{ai.uncertainty}</p>
            </div>
          </div>
        ) : null}

        {unavailableMsg && (
          <div role="alert" className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">
            <CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
            <span>
              {unavailableMsg} <strong>El diagnóstico, los requisitos y las recomendaciones de arriba siguen siendo válidos</strong>: provienen del motor de reglas, no de la IA.
            </span>
          </div>
        )}

        <Button onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
          {ai ? "Regenerar explicación con IA" : "Generar explicación con IA"}
        </Button>

        <div className="space-y-3 border-t pt-5">
          <h4 className="flex items-center gap-2 font-semibold">
            <MessageCircleQuestion className="size-5 text-electric" aria-hidden /> Pregunte por un concepto técnico
          </h4>
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void ask(concept);
            }}
          >
            <Input
              value={concept}
              maxLength={200}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej.: ¿Qué significa redundancia 2N?"
              aria-label="Concepto técnico a explicar"
            />
            <Button type="submit" variant="secondary" disabled={conceptLoading || concept.trim().length < 3}>
              {conceptLoading ? <Loader2 className="animate-spin" aria-hidden /> : null} Explicar
            </Button>
          </form>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                onClick={() => {
                  setConcept(s);
                  void ask(s);
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">No escriba claves, contraseñas ni datos confidenciales.</p>
          {conceptAnswer && (
            <div className="animate-in fade-in rounded-xl border bg-muted/50 p-3 text-sm">
              <p className="font-medium">{conceptAnswer.q}</p>
              <p className="mt-1">{conceptAnswer.a}</p>
              <p className="mt-2 text-xs text-muted-foreground">Respuesta generada por IA; verifique con fuentes oficiales.</p>
            </div>
          )}
          {conceptError && (
            <p role="alert" className="text-sm text-amber-700 dark:text-amber-300">{conceptError}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
