import { CircleCheck, CircleHelp, CircleX, ShieldAlert } from "lucide-react";
import { CATEGORY_BY_ID } from "@/domain/questionnaire/categories";
import { tierLabel } from "@/domain/tiers";
import type { EvaluatedRequirement } from "@/domain/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_UI = {
  met: { icon: CircleCheck, color: "text-emerald-600", label: "Cumplido" },
  not_met: { icon: CircleX, color: "text-rose-600", label: "No cumplido" },
  unknown: { icon: CircleHelp, color: "text-amber-600", label: "Sin verificar" },
} as const;

export function RequirementList({
  items,
  emptyText,
}: {
  items: EvaluatedRequirement[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">{emptyText}</p>;
  }
  const sorted = [...items].sort((a, b) => a.tier - b.tier || Number(b.critical) - Number(a.critical));
  return (
    <ul className="space-y-2">
      {sorted.map((r) => {
        const ui = STATUS_UI[r.status];
        const Icon = ui.icon;
        return (
          <li key={r.id} className="flex items-start gap-3 rounded-xl border bg-card p-3.5">
            <Icon className={cn("mt-0.5 size-5 shrink-0", ui.color)} aria-label={ui.label} />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{r.title}</span>
                {r.critical && (
                  <Badge variant="outline" className="gap-1 border-electric/40 text-electric">
                    <ShieldAlert aria-hidden /> Crítico
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{r.description}</p>
              <p className="text-xs text-muted-foreground">
                {tierLabel(r.tier)} · {CATEGORY_BY_ID[r.category]?.name} · preguntas {r.questionIds.join(", ")}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
