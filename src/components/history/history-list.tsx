"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardCheck, FlaskConical, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DisclaimerBanner } from "@/components/layout/disclaimer-banner";
import { formatDateEs } from "@/lib/report/data";
import { getRepository } from "@/lib/storage/client";
import { resultsHref } from "@/lib/routes";
import type { EvaluationRecord } from "@/lib/validation/records";
import { cn } from "@/lib/utils";

const ENTITY_LABEL: Record<string, string> = {
  empresa: "Empresa",
  universidad: "Universidad",
  institucion_publica: "Institución pública",
  otra: "Otra",
};

export function HistoryList() {
  const [records, setRecords] = useState<EvaluationRecord[] | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmAll, setConfirmAll] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de localStorage tras montar
    setRecords(getRepository().list());
  }, []);

  function remove(id: string) {
    getRepository().remove(id);
    setRecords(getRepository().list());
    setConfirmId(null);
  }

  function removeAll() {
    getRepository().clear();
    setRecords([]);
    setConfirmAll(false);
  }

  if (records === null) {
    return <div className="py-12 text-center text-muted-foreground" aria-busy>Cargando historial…</div>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Las evaluaciones se guardan <strong>solo en este navegador</strong> (almacenamiento local). No se envían a ningún servidor.
      </p>

      {records.length === 0 ? (
        <div className="space-y-3 rounded-2xl border border-dashed p-10 text-center">
          <ClipboardCheck className="mx-auto size-9 text-muted-foreground" aria-hidden />
          <p className="font-medium">Todavía no hay evaluaciones guardadas</p>
          <div className="flex justify-center gap-2">
            <Link prefetch={false} href="/evaluacion" className={buttonVariants()}>Iniciar evaluación</Link>
            <Link prefetch={false} href="/demo" className={buttonVariants({ variant: "outline" })}>Ver demostración</Link>
          </div>
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {records.map((r) => (
              <li key={r.id}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardHeader className="flex-row flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                        {r.result.label}
                        {r.simulated && (
                          <Badge variant="outline" className="gap-1 border-electric/50 text-electric"><FlaskConical aria-hidden /> Simulado</Badge>
                        )}
                        {r.ai && <Badge variant="secondary">Con IA</Badge>}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {r.entity.organizationName || "Organización sin nombre"} · {ENTITY_LABEL[r.entity.entityType]} · {r.entity.facilityType}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateEs(r.createdAt)} · reglas v{r.result.rulesVersion}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link prefetch={false} href={resultsHref(r.id)} className={buttonVariants({ size: "lg" })}>Ver resultados</Link>
                      {confirmId === r.id ? (
                        <span className="flex items-center gap-1.5">
                          <Button variant="destructive" size="lg" onClick={() => remove(r.id)}>Confirmar</Button>
                          <Button variant="ghost" size="lg" onClick={() => setConfirmId(null)}>Cancelar</Button>
                        </span>
                      ) : (
                        <Button variant="outline" size="lg" onClick={() => setConfirmId(r.id)} aria-label={`Eliminar evaluación del ${formatDateEs(r.createdAt)}`}>
                          <Trash2 aria-hidden /> Eliminar
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Avance {r.result.coverage.progressPct} % · cobertura de información {r.result.coverage.coveragePct} % · {r.result.met.length} cumplidos, {r.result.notMet.length} faltantes, {r.result.unknown.length} sin verificar
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>

          <div className={cn("flex justify-end")}>
            {confirmAll ? (
              <span className="flex items-center gap-2 text-sm">
                ¿Eliminar TODO el historial?
                <Button variant="destructive" onClick={removeAll}>Sí, eliminar todo</Button>
                <Button variant="ghost" onClick={() => setConfirmAll(false)}>Cancelar</Button>
              </span>
            ) : (
              <Button variant="ghost" onClick={() => setConfirmAll(true)}>
                <Trash2 aria-hidden /> Borrar todo el historial
              </Button>
            )}
          </div>
        </>
      )}
      <DisclaimerBanner compact />
    </div>
  );
}
