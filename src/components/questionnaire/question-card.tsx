"use client";

import { useState } from "react";
import { ChevronDown, CircleHelp, FileText, ShieldAlert } from "lucide-react";
import { CATEGORY_BY_ID } from "@/domain/questionnaire/categories";
import { REQUIREMENT_BY_ID } from "@/domain/rules/requirements";
import type { Question } from "@/domain/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  question: Question;
  value: string | undefined;
  onChange: (value: string) => void;
  showError: boolean;
}

export function QuestionCard({ question, value, onChange, showError }: Props) {
  const [open, setOpen] = useState(false);
  const missing = showError && value === undefined;
  const hasDetails = Boolean(question.help || question.reference || question.rules.length);

  return (
    <fieldset
      id={`q-${question.id}`}
      className={cn(
        "rounded-2xl border bg-card p-5 shadow-xs transition-colors scroll-mt-28",
        missing && "border-destructive/60 bg-destructive/5",
      )}
      aria-describedby={missing ? `err-${question.id}` : undefined}
    >
      <legend className="sr-only">
        Pregunta {question.id}: {question.text}
      </legend>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="font-mono">{question.id}</Badge>
        <span className="text-xs text-muted-foreground">{CATEGORY_BY_ID[question.category].name}</span>
        {question.critical && (
          <Badge variant="outline" className="gap-1 border-electric/40 text-electric" title="Esta pregunta alimenta requisitos críticos para la clasificación">
            <ShieldAlert aria-hidden /> Crítica
          </Badge>
        )}
        {question.showIf && <Badge variant="ghost" className="text-muted-foreground">Profundización</Badge>}
      </div>

      <p className="text-base font-medium text-balance">{question.text}</p>

      {hasDetails && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="inline-flex items-center gap-1.5 text-sm text-electric hover:underline"
          >
            <CircleHelp className="size-4" aria-hidden /> Explicación técnica
            <ChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden />
          </button>
          {open && (
            <div className="animate-in fade-in slide-in-from-top-1 mt-2 space-y-2 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
              {question.help && <p>{question.help}</p>}
              {question.reference && (
                <p className="flex items-start gap-1.5">
                  <FileText className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span><strong>Referencia:</strong> {question.reference}</span>
                </p>
              )}
              {question.rules.length > 0 && (
                <div>
                  <p className="font-medium text-foreground">Requisitos que dependen de esta respuesta:</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5">
                    {question.rules.map((id) => (
                      <li key={id}>
                        <span className="font-mono text-xs">{id}</span>: {REQUIREMENT_BY_ID[id]?.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div
        role="radiogroup"
        aria-label={`Opciones de la pregunta ${question.id}`}
        className={cn("mt-4 grid gap-2", question.options.length <= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}
      >
        {question.options.map((opt) => {
          const selected = value === opt.value;
          const isUnknown = opt.value === "unknown";
          return (
            <label
              key={opt.value}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-all hover:border-electric/50 hover:bg-accent/50 has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                selected && "border-electric bg-accent font-medium shadow-sm",
                isUnknown && !selected && "text-muted-foreground",
              )}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <span
                aria-hidden
                className={cn(
                  "grid size-4.5 shrink-0 place-items-center rounded-full border-2 border-input",
                  selected && "border-electric",
                )}
              >
                {selected && <span className="size-2 rounded-full bg-electric" />}
              </span>
              <span>{opt.label}</span>
            </label>
          );
        })}
      </div>

      {value === "unknown" && (
        <p className="mt-3 text-xs text-muted-foreground">
          “No sé” se tratará como información <strong>no verificada</strong>, no como cumplimiento.
        </p>
      )}
      {missing && (
        <p id={`err-${question.id}`} role="alert" className="mt-3 text-sm font-medium text-destructive">
          Seleccione una respuesta para continuar.
        </p>
      )}
    </fieldset>
  );
}
