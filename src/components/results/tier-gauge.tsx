import { Check } from "lucide-react";
import type { EvaluationResult } from "@/domain/types";
import { TIER_ROMAN } from "@/domain/tiers";
import { cn } from "@/lib/utils";

/** Escala visual I-IV. Marca los niveles alcanzados y el siguiente de referencia. */
export function TierGauge({ result, className }: { result: EvaluationResult; className?: string }) {
  const tier = result.tier ?? 0;
  const levels = [1, 2, 3, 4] as const;
  return (
    <div className={cn("grid grid-cols-4 gap-2", className)} role="img" aria-label={`Escala de niveles. ${result.label}`}>
      {levels.map((l) => {
        const reached = result.status === "TIER" && l <= tier;
        const isCurrent = result.status === "TIER" && l === tier;
        const isNext = result.nextTier === l;
        return (
          <div
            key={l}
            className={cn(
              "relative rounded-xl border px-2 py-3 text-center transition-all",
              reached ? "border-electric/60 bg-electric/10" : "bg-muted/40",
              isCurrent && "ring-2 ring-electric shadow-md shadow-electric/20",
              isNext && !reached && "border-dashed border-amber-500/60",
            )}
          >
            <div className={cn("text-xs text-muted-foreground", isCurrent && "font-semibold text-electric")}>Tier</div>
            <div className={cn("text-2xl font-bold", reached ? "text-electric" : "text-muted-foreground/60")}>
              {TIER_ROMAN[l]}
            </div>
            <div className="mt-0.5 h-4 text-[11px]">
              {reached ? (
                <span className="inline-flex items-center gap-0.5 text-electric"><Check className="size-3" aria-hidden />{isCurrent ? "Estimado" : "Compatible"}</span>
              ) : isNext ? (
                <span className="text-amber-700 dark:text-amber-400">Siguiente</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
