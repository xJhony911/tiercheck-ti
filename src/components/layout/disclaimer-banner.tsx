import { TriangleAlert } from "lucide-react";
import { DISCLAIMER_SHORT } from "@/domain/tiers";
import { cn } from "@/lib/utils";

/** Advertencia visible de que la herramienta es orientativa. */
export function DisclaimerBanner({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:bg-amber-500/10 dark:text-amber-100",
        className,
      )}
    >
      <TriangleAlert className="mt-0.5 size-4.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
      <p>
        <strong>Evaluación orientativa, no oficial. </strong>
        {compact
          ? "No es una certificación ni reemplaza una auditoría profesional."
          : `${DISCLAIMER_SHORT} El resultado se basa en respuestas autodeclaradas y no se verifica con mediciones.`}
      </p>
    </div>
  );
}
