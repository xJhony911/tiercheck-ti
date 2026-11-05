"use client";

import { CircleAlert, Pencil, TriangleAlert } from "lucide-react";
import { CATEGORIES } from "@/domain/questionnaire/categories";
import { getVisibleQuestions } from "@/domain/questionnaire/visibility";
import type { Answers } from "@/domain/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { StepId } from "./stepper";

interface Props {
  answers: Answers;
  onEdit: (step: StepId) => void;
}

export function ReviewStep({ answers, onEdit }: Props) {
  const visible = getVisibleQuestions(answers);
  const unknownCount = visible.filter((q) => answers[q.id] === "unknown").length;
  const unanswered = visible.filter((q) => answers[q.id] === undefined).length;

  return (
    <div className="space-y-5">
      {unanswered > 0 && (
        <div role="alert" className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
          Faltan {unanswered} pregunta(s) por responder. Use “Editar” para completarlas.
        </div>
      )}
      {unknownCount > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-500/10 dark:text-amber-100">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
          <span>
            Marcó <strong>{unknownCount}</strong> respuesta(s) como “No sé”. Se tratarán como información no verificada y
            pueden impedir estimar un nivel. Puede modificarlas antes de finalizar.
          </span>
        </div>
      )}

      {CATEGORIES.map((cat) => {
        const qs = visible.filter((q) => q.category === cat.id);
        return (
          <section key={cat.id} className="rounded-2xl border bg-card">
            <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
              <h3 className="font-semibold">
                <span className="mr-2 font-mono text-electric">{cat.id}</span>
                {cat.name}
              </h3>
              <Button variant="outline" size="sm" onClick={() => onEdit(cat.id)}>
                <Pencil aria-hidden /> Editar
              </Button>
            </div>
            <ul className="divide-y">
              {qs.map((q) => {
                const opt = q.options.find((o) => o.value === answers[q.id]);
                return (
                  <li key={q.id} className="flex flex-col gap-1 px-4 py-2.5 text-sm sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                    <span className="text-muted-foreground">
                      <span className="mr-1.5 font-mono text-xs">{q.id}</span>
                      {q.text}
                    </span>
                    {opt ? (
                      <Badge variant={opt.value === "unknown" ? "outline" : "secondary"} className="h-auto max-w-full shrink-0 py-1 whitespace-normal">
                        {opt.label}
                      </Badge>
                    ) : (
                      <Badge variant="destructive">Sin responder</Badge>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
