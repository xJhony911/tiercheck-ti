import { ArrowRight, Lightbulb, SearchCheck, TriangleAlert } from "lucide-react";
import { CATEGORY_BY_ID } from "@/domain/questionnaire/categories";
import { priorityLabel } from "@/domain/recommendations/generate";
import type { Recommendation, RecommendationPriority } from "@/domain/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRIORITY_STYLE: Record<RecommendationPriority, string> = {
  high: "border-rose-500/40 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  low: "border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-300",
};

const GROUPS: RecommendationPriority[] = ["high", "medium", "low"];

export function RecommendationsPanel({ recommendations }: { recommendations: Recommendation[] }) {
  if (recommendations.length === 0) {
    return (
      <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        No se identificaron deficiencias con las respuestas proporcionadas.
      </p>
    );
  }
  return (
    <div className="space-y-6">
      {GROUPS.map((p) => {
        const items = recommendations.filter((r) => r.priority === p);
        if (items.length === 0) return null;
        return (
          <section key={p} aria-label={priorityLabel(p)} className="space-y-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <Badge variant="outline" className={cn("h-6", PRIORITY_STYLE[p])}>{priorityLabel(p)}</Badge>
              <span className="text-sm font-normal text-muted-foreground">{items.length} recomendación(es)</span>
            </h3>
            {items.map((r) => (
              <article key={r.id} className="space-y-3 rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {r.kind === "verify" ? (
                    <Badge variant="secondary" className="gap-1"><SearchCheck aria-hidden /> Verificar</Badge>
                  ) : (
                    <Badge variant="secondary" className="gap-1"><TriangleAlert aria-hidden /> Brecha</Badge>
                  )}
                  <span>{CATEGORY_BY_ID[r.category]?.name}</span>
                  <span className="font-mono">{r.requirementId}</span>
                </div>
                <dl className="grid gap-3 text-sm md:grid-cols-2">
                  <div>
                    <dt className="font-semibold">Problema</dt>
                    <dd className="text-muted-foreground">{r.problem}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Consecuencia</dt>
                    <dd className="text-muted-foreground">{r.consequence}</dd>
                  </div>
                  <div className="rounded-lg bg-accent/60 p-3 md:col-span-2">
                    <dt className="flex items-center gap-1.5 font-semibold"><ArrowRight className="size-4 text-electric" aria-hidden /> Recomendación</dt>
                    <dd>{r.recommendation}</dd>
                  </div>
                  <div className="md:col-span-2">
                    <dt className="flex items-center gap-1.5 font-semibold"><Lightbulb className="size-4 text-amber-500" aria-hidden /> Beneficio técnico</dt>
                    <dd className="text-muted-foreground">{r.benefit}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </section>
        );
      })}
    </div>
  );
}
