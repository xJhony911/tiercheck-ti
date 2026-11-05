import { Info } from "lucide-react";
import { Logo } from "./logo";
import { DISCLAIMER_SHORT } from "@/domain/tiers";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t bg-card/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Logo href={null} />
          <p className="max-w-md text-sm text-muted-foreground">
            Proyecto universitario de Ingeniería en Tecnologías de la Información.
          </p>
        </div>
        <p className="flex max-w-xl items-start gap-2 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0 text-electric" aria-hidden />
          <span>
            <strong className="text-foreground">Aviso:</strong> {DISCLAIMER_SHORT} Los niveles Tier I-IV de
            Uptime Institute y las clasificaciones Rated-1 a Rated-4 de ANSI/TIA-942 son sistemas distintos.
          </span>
        </p>
      </div>
    </footer>
  );
}
