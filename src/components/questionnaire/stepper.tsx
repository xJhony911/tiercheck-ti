"use client";

import { Check, Lock } from "lucide-react";
import { CATEGORIES } from "@/domain/questionnaire/categories";
import { cn } from "@/lib/utils";

export type StepId = "entity" | "A" | "B" | "C" | "D" | "E" | "F" | "review";

export const STEP_IDS: StepId[] = ["entity", ...CATEGORIES.map((c) => c.id), "review"];

export function stepTitle(id: StepId): string {
  if (id === "entity") return "Datos generales";
  if (id === "review") return "Revisión";
  return CATEGORIES.find((c) => c.id === id)?.name ?? id;
}

interface Props {
  current: StepId;
  /** Índice del primer paso no completado: los posteriores quedan bloqueados. */
  firstIncompleteIndex: number;
  completed: Set<StepId>;
  onSelect: (id: StepId) => void;
}

export function Stepper({ current, firstIncompleteIndex, completed, onSelect }: Props) {
  return (
    <nav aria-label="Secciones del cuestionario" className="-mx-4 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      <ol className="flex min-w-max gap-2">
        {STEP_IDS.map((id, index) => {
          const isCurrent = id === current;
          const isDone = completed.has(id);
          const locked = index > firstIncompleteIndex;
          return (
            <li key={id}>
              <button
                type="button"
                disabled={locked}
                aria-current={isCurrent ? "step" : undefined}
                onClick={() => onSelect(id)}
                title={locked ? "Complete las secciones anteriores" : stepTitle(id)}
                className={cn(
                  "flex h-10 items-center gap-2 rounded-full border px-3 text-sm transition-all",
                  isCurrent
                    ? "border-electric bg-electric text-white shadow-sm"
                    : isDone
                      ? "border-emerald-500/40 bg-emerald-500/10 text-foreground hover:bg-emerald-500/15"
                      : "bg-card text-muted-foreground hover:bg-accent",
                  locked && "cursor-not-allowed opacity-50 hover:bg-card",
                )}
              >
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full text-[11px] font-bold",
                    isCurrent ? "bg-white/25" : isDone ? "bg-emerald-500 text-white" : "bg-muted",
                  )}
                >
                  {isDone && !isCurrent ? <Check className="size-3" aria-hidden /> : locked ? <Lock className="size-3" aria-hidden /> : id === "entity" ? "0" : id === "review" ? "✓" : id}
                </span>
                <span className="hidden md:inline">{stepTitle(id)}</span>
                <span className="md:hidden">{id === "entity" ? "Datos" : id === "review" ? "Revisión" : `Sec. ${id}`}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
