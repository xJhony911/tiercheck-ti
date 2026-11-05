"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  CircleAlert,
  ClipboardCheck,
  FileDown,
  FlaskConical,
  History,
  Loader2,
  ShieldCheck,
  ShieldQuestion,
  TrendingUp,
} from "lucide-react";
import { QUESTION_BY_ID } from "@/domain/questionnaire/questions";
import { generateRecommendations } from "@/domain/recommendations/generate";
import { LIMITATIONS, tierLabel } from "@/domain/tiers";
import type { EvaluationResult } from "@/domain/types";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DisclaimerBanner } from "@/components/layout/disclaimer-banner";
import { getRepository } from "@/lib/storage/client";
import { buildReportData, formatDateEs } from "@/lib/report/data";
import type { EvaluationRecord, StoredAi } from "@/lib/validation/records";
import { cn } from "@/lib/utils";
import { AiPanel } from "./ai-panel";
import { CategoryCharts } from "./category-charts";
import { RecommendationsPanel } from "./recommendations-panel";
import { RequirementList } from "./requirement-list";
import { StandardsNote } from "./standards-note";
import { TierGauge } from "./tier-gauge";

const ENTITY_LABEL: Record<string, string> = {
  empresa: "Empresa",
  universidad: "Universidad",
  institucion_publica: "Institución pública",
  otra: "Otra",
};

function Metric({
  icon: Icon,
  title,
  value,
  caption,
  pct,
}: {
  icon: typeof Activity;
  title: string;
  value: string;
  caption: string;
  pct?: number;
}) {
  return (
    <div className="rounded-xl border bg-card/80 p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4 text-electric" aria-hidden /> {title}
      </div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {pct !== undefined && <Progress value={pct} className="mt-2" aria-label={title} />}
      <p className="mt-2 text-xs text-muted-foreground">{caption}</p>
    </div>
  );
}

function statusStyle(result: EvaluationResult): string {
  if (result.status === "TIER") return "from-electric/15 to-card border-electric/40";
  if (result.status === "BELOW_TIER_1") return "from-amber-500/15 to-card border-amber-500/40";
  return "from-slate-500/15 to-card border-slate-500/40";
}

export function ResultsView() {
  const id = useSearchParams().get("id") ?? "";
  const [record, setRecord] = useState<EvaluationRecord | null | undefined>(undefined);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de localStorage tras montar
    setRecord(getRepository().get(id) ?? null);
  }, [id]);

  const recommendations = useMemo(() => (record ? generateRecommendations(record.result) : []), [record]);

  async function downloadPdf() {
    if (!record) return;
    setPdfLoading(true);
    setPdfError(null);
    try {
      const { downloadReportPdf } = await import("@/lib/report/pdf");
      const date = new Date(record.createdAt).toISOString().slice(0, 10);
      downloadReportPdf(buildReportData(record), `TierCheckTI-informe-${date}.pdf`);
    } catch {
      setPdfError("No se pudo generar el PDF. Intente de nuevo.");
    } finally {
      setPdfLoading(false);
    }
  }

  function saveAi(ai: StoredAi) {
    if (!record) return;
    getRepository().update(record.id, { ai });
    setRecord({ ...record, ai });
  }

  if (record === undefined) {
    return <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground" aria-busy>Cargando resultados…</div>;
  }
  if (record === null) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 py-20 text-center">
        <CircleAlert className="mx-auto size-10 text-amber-500" aria-hidden />
        <h1 className="text-2xl font-bold">Evaluación no encontrada</h1>
        <p className="text-muted-foreground">
          No existe una evaluación con este identificador en el almacenamiento local de este navegador. Es posible que se haya eliminado.
        </p>
        <div className="flex justify-center gap-2">
          <Link prefetch={false} href="/historial" className={buttonVariants({ variant: "outline" })}>Ver historial</Link>
          <Link prefetch={false} href="/evaluacion" className={buttonVariants()}>Nueva evaluación</Link>
        </div>
      </div>
    );
  }

  const { result } = record;
  const unknownAnswers = Object.entries(record.answers)
    .filter(([, v]) => v === "unknown")
    .map(([qid]) => QUESTION_BY_ID[qid])
    .filter(Boolean);
  const nextLabel = result.nextTier ? tierLabel(result.nextTier) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Resultados de la evaluación</h1>
          <p className="text-sm text-muted-foreground">
            {record.entity.organizationName || "Organización sin nombre"} · {ENTITY_LABEL[record.entity.entityType]} ·{" "}
            {record.entity.facilityType} · {formatDateEs(record.createdAt)}
          </p>
          {record.simulated && (
            <Badge variant="outline" className="gap-1 border-electric/50 text-electric">
              <FlaskConical aria-hidden /> DATOS SIMULADOS
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={downloadPdf} disabled={pdfLoading}>
            {pdfLoading ? <Loader2 className="animate-spin" aria-hidden /> : <FileDown aria-hidden />} Descargar informe PDF
          </Button>
          <Link prefetch={false} href="/historial" className={buttonVariants({ variant: "outline" })}>
            <History aria-hidden /> Historial
          </Link>
          <Link prefetch={false} href="/evaluacion" className={buttonVariants({ variant: "outline" })}>
            <ClipboardCheck aria-hidden /> Nueva
          </Link>
        </div>
      </div>
      {pdfError && <p role="alert" className="text-sm text-destructive">{pdfError}</p>}

      <DisclaimerBanner />

      {/* Resultado principal */}
      <section aria-labelledby="resultado" className={cn("animate-in fade-in slide-in-from-bottom-2 space-y-5 rounded-2xl border bg-linear-to-br p-5 duration-500 sm:p-7", statusStyle(result))}>
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Nivel Tier preliminar estimado</p>
          <h2 id="resultado" className="text-3xl font-bold tracking-tight sm:text-4xl">{result.label}</h2>
          <p className="max-w-3xl text-base">{result.summary}</p>
        </div>

        <TierGauge result={result} />

        <div className="grid gap-3 md:grid-cols-3">
          <Metric
            icon={Activity}
            title="Avance del cuestionario"
            value={`${result.coverage.progressPct} %`}
            pct={result.coverage.progressPct}
            caption={`${result.coverage.answeredQuestions} de ${result.coverage.totalQuestions} preguntas respondidas.`}
          />
          <Metric
            icon={ShieldQuestion}
            title="Cobertura de información"
            value={`${result.coverage.coveragePct} %`}
            pct={result.coverage.coveragePct}
            caption={`${result.coverage.criticalKnown} de ${result.coverage.criticalTotal} requisitos críticos verificados (excluye “No sé”).`}
          />
          <Metric
            icon={ShieldCheck}
            title="Nivel Tier estimado"
            value={result.status === "TIER" && result.tier ? tierLabel(result.tier) : result.status === "BELOW_TIER_1" ? "< Tier I" : "Indeterminado"}
            caption="Se decide por requisitos críticos, no por porcentajes."
          />
        </div>
        <p className="text-xs text-muted-foreground">Motor de reglas v{result.rulesVersion} · resultado determinista calculado sin IA.</p>
      </section>

      {/* Contradicciones e información faltante */}
      {result.contradictions.length > 0 && (
        <Card className="border-rose-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CircleAlert className="size-5 text-rose-600" aria-hidden /> Respuestas contradictorias</CardTitle>
            <CardDescription>Revise estas respuestas: mientras existan contradicciones el nivel permanece indeterminado.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {result.contradictions.map((c) => (
                <li key={c.id} className="rounded-lg bg-rose-500/5 p-3">
                  {c.message} <span className="text-muted-foreground">(preguntas {c.questionIds.join(", ")})</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {result.status === "INDETERMINATE" && result.missingInformation.length > 0 && (
        <Card className="border-amber-500/40">
          <CardHeader>
            <CardTitle>Información que falta para estimar un nivel</CardTitle>
            <CardDescription>Requisitos críticos sin verificar.</CardDescription>
          </CardHeader>
          <CardContent><RequirementList items={result.missingInformation} emptyText="" /></CardContent>
        </Card>
      )}

      {/* Siguiente nivel */}
      {nextLabel && (result.blockersNextTier.length > 0 || result.unverifiedNextTier.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="size-5 text-electric" aria-hidden /> Qué impide alcanzar {nextLabel}</CardTitle>
            <CardDescription>
              {result.nextTierState === "blocked"
                ? "Hay requisitos críticos declarados como no cumplidos."
                : "No hay evidencia suficiente: faltan requisitos críticos por verificar."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.blockersNextTier.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">No cumplidos</h3>
                <RequirementList items={result.blockersNextTier} emptyText="" />
              </div>
            )}
            {result.unverifiedNextTier.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Sin verificar</h3>
                <RequirementList items={result.unverifiedNextTier} emptyText="" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {result.notes.length > 0 && (
        <ul className="space-y-2 text-sm">
          {result.notes.map((n) => (
            <li key={n} className="rounded-xl border bg-muted/50 p-3">{n}</li>
          ))}
        </ul>
      )}

      {/* Respuestas desconocidas */}
      <Card>
        <CardHeader>
          <CardTitle>Respuestas desconocidas</CardTitle>
          <CardDescription>
            Las respuestas “No sé” son información no verificada y nunca cuentan como cumplimiento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unknownAnswers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No marcó respuestas como “No sé”.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {unknownAnswers.map((q) => (
                <li key={q.id} className="flex gap-2">
                  <Badge variant="secondary" className="font-mono">{q.id}</Badge>
                  <span>{q.text}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Detalle */}
      <Tabs defaultValue="requisitos">
        <TabsList className="h-auto flex-wrap">
          <TabsTrigger value="requisitos">Requisitos</TabsTrigger>
          <TabsTrigger value="recomendaciones">Recomendaciones ({recommendations.length})</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
        </TabsList>

        <TabsContent value="requisitos" className="mt-4 space-y-6">
          <section className="space-y-2" aria-label="Requisitos cumplidos">
            <h3 className="font-semibold">Cumplidos ({result.met.length})</h3>
            <RequirementList items={result.met} emptyText="No se declararon requisitos cumplidos." />
          </section>
          <section className="space-y-2" aria-label="Requisitos faltantes">
            <h3 className="font-semibold">Faltantes ({result.notMet.length})</h3>
            <RequirementList items={result.notMet} emptyText="No hay requisitos declarados como no cumplidos." />
          </section>
          <section className="space-y-2" aria-label="Requisitos sin verificar">
            <h3 className="font-semibold">Sin verificar ({result.unknown.length})</h3>
            <RequirementList items={result.unknown} emptyText="No hay requisitos sin verificar." />
          </section>
        </TabsContent>

        <TabsContent value="recomendaciones" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Derivadas directamente de las reglas no cumplidas o sin verificar (no son generadas por la IA).
          </p>
          <RecommendationsPanel recommendations={recommendations} />
        </TabsContent>

        <TabsContent value="graficos" className="mt-4">
          <CategoryCharts scores={result.categoryScores} />
        </TabsContent>
      </Tabs>

      <AiPanel record={record} onSaved={saveAi} />

      <StandardsNote />

      <Card>
        <CardHeader><CardTitle>Limitaciones de la evaluación</CardTitle></CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {LIMITATIONS.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </CardContent>
      </Card>

      <DisclaimerBanner />
    </div>
  );
}
