import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Aclaración fija: Uptime Institute (Tier I-IV) y ANSI/TIA-942 (Rated-1 a Rated-4)
 * son sistemas distintos. No se presentan como equivalentes.
 */
export function StandardsNote({ className }: { className?: string }) {
  return (
    <aside
      className={cn("flex items-start gap-3 rounded-xl border bg-card p-4 text-sm", className)}
      aria-label="Aclaración sobre estándares"
    >
      <Scale className="mt-0.5 size-5 shrink-0 text-electric" aria-hidden />
      <div className="space-y-1">
        <p className="font-semibold">Tier (Uptime Institute) no es lo mismo que Rated (ANSI/TIA-942)</p>
        <p className="text-muted-foreground">
          Esta herramienta usa como referencia conceptual el sistema <strong>Tier I-IV de Uptime Institute</strong>.
          Las clasificaciones <strong>Rated-1 a Rated-4 de ANSI/TIA-942</strong> pertenecen a otro estándar, con
          criterios y procesos de evaluación propios. No se presentan como equivalentes ni se estima ningún nivel
          Rated.
        </p>
      </div>
    </aside>
  );
}
