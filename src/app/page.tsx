import Link from "next/link";
import {
  ArrowRight,
  Bot,
  Check,
  ClipboardList,
  FileDown,
  FlaskConical,
  Gauge,
  Server,
  ShieldAlert,
  Snowflake,
  X,
  Zap,
  Activity,
  Cpu,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DisclaimerBanner } from "@/components/layout/disclaimer-banner";
import { StandardsNote } from "@/components/results/standards-note";
import { TIER_INFO, tierLabel } from "@/domain/tiers";
import { QUESTIONS } from "@/domain/questionnaire/questions";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: ClipboardList,
    title: "1. Datos generales",
    text: "Indique el tipo de organización e instalación. Sin datos sensibles.",
  },
  {
    icon: Gauge,
    title: "2. Cuestionario técnico",
    text: `${QUESTIONS.length} preguntas en 6 categorías: energía, respaldo, climatización, redundancia, rutas y continuidad.`,
  },
  {
    icon: Cpu,
    title: "3. Motor de reglas",
    text: "Un motor determinista verifica requisitos críticos por nivel. No usa porcentajes ni IA para decidir.",
  },
  {
    icon: FileDown,
    title: "4. Resultados e informe",
    text: "Nivel preliminar, brechas, recomendaciones priorizadas, explicación con IA opcional e informe PDF.",
  },
];

const PROS = [
  "Identifica brechas de forma rápida y sin costo.",
  "Cada resultado se explica con requisitos cumplidos, faltantes y sin verificar.",
  "Reglas transparentes, centralizadas y verificables con pruebas automáticas.",
  "Recomendaciones priorizadas derivadas de las reglas, no inventadas.",
  "Funciona sin IA: la personalización con Gemini es opcional.",
];

const LIMITS = [
  "No es una certificación ni reemplaza una auditoría profesional.",
  "Se basa en respuestas autodeclaradas, sin mediciones ni inspección.",
  "Usa solo criterios públicos; no reproduce el estándar restringido de Uptime Institute.",
  "“No sé” se trata como información no verificada, nunca como cumplimiento.",
  "Si faltan datos o hay contradicciones, el nivel queda indeterminado.",
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="bg-grid absolute inset-0 -z-10" aria-hidden />
        <div className="absolute -top-32 left-1/2 -z-10 h-80 w-xl -translate-x-1/2 rounded-full bg-electric/20 blur-3xl" aria-hidden />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="animate-in fade-in slide-in-from-bottom-3 space-y-6 duration-700">
            <Badge variant="secondary" className="h-6 gap-1.5 px-3">
              <Activity className="text-electric" aria-hidden /> Evaluación preliminar de infraestructura TI
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              ¿Qué nivel <span className="bg-linear-to-r from-electric to-sky-400 bg-clip-text text-transparent">Tier</span>{" "}
              podría corresponder a su centro de datos?
            </h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              <strong className="text-foreground">TierCheck TI</strong> analiza la infraestructura de energía,
              respaldo, climatización y redundancia de su organización con un motor de reglas técnico y entrega un
              nivel Tier <em>preliminar</em>, brechas, recomendaciones priorizadas e informe descargable.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link prefetch={false} href="/evaluacion" className={cn(buttonVariants({ size: "lg" }), "h-11 px-5 text-base animate-pulse-ring")}>
                Iniciar evaluación <ArrowRight aria-hidden />
              </Link>
              <Link prefetch={false} href="/demo" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-11 px-5 text-base")}>
                <FlaskConical aria-hidden /> Ver demostración
              </Link>
            </div>
            <DisclaimerBanner compact />
          </div>

          {/* Ilustración decorativa (sin datos reales) */}
          <div className="relative hidden lg:block" aria-hidden>
            <div className="animate-float-soft rounded-2xl border bg-card p-5 shadow-xl shadow-electric/10">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold">Panel de infraestructura</span>
                <span className="flex gap-1">
                  <span className="size-2 rounded-full bg-rose-400" />
                  <span className="size-2 rounded-full bg-amber-400" />
                  <span className="size-2 rounded-full bg-emerald-400" />
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Zap, label: "Energía" },
                  { icon: Snowflake, label: "Refrigeración" },
                  { icon: Activity, label: "Disponibilidad" },
                  { icon: Server, label: "Servidores" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="rounded-xl border bg-muted/50 p-3">
                    <Icon className="mb-2 size-5 text-electric" />
                    <div className="text-sm font-medium">{label}</div>
                    <div className="mt-2 h-1.5 w-full rounded-full bg-border">
                      <div className="h-full w-2/3 rounded-full bg-electric/70" />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">Ilustración decorativa</p>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESO */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="proceso">
        <h2 id="proceso" className="text-2xl font-bold tracking-tight">Cómo funciona</h2>
        <p className="mt-1 text-muted-foreground">Cuatro pasos, aproximadamente 10 minutos.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <Card key={title} className="transition-all hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader>
                <div className="mb-2 grid size-10 place-items-center rounded-xl bg-accent text-electric">
                  <Icon className="size-5" aria-hidden />
                </div>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{text}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* TIERS */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="tiers">
        <h2 id="tiers" className="text-2xl font-bold tracking-tight">Los niveles Tier (Uptime Institute)</h2>
        <p className="mt-1 max-w-3xl text-muted-foreground">
          Descripción conceptual basada en información pública. Los niveles son acumulativos: cada uno incluye lo del
          anterior. La disponibilidad citada es una referencia comúnmente publicada, no una garantía.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TIER_INFO.map((t) => (
            <Card key={t.level} className="relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-electric to-navy" style={{ opacity: 0.35 + t.level * 0.16 }} aria-hidden />
              <CardHeader>
                <Badge variant="outline" className="w-fit">{tierLabel(t.level)}</Badge>
                <CardTitle className="text-lg">{t.name}</CardTitle>
                <CardDescription>{t.headline}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">{t.description}</p>
                <ul className="space-y-1.5">
                  {t.keyPoints.map((k) => (
                    <li key={k} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-electric" aria-hidden /> {k}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">Disponibilidad citada: {t.citedAvailability}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <StandardsNote className="mt-6" />
      </section>

      {/* VENTAJAS Y LIMITES */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6" aria-labelledby="limites">
        <h2 id="limites" className="text-2xl font-bold tracking-tight">Ventajas y límites de la evaluación</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Check className="size-5 text-emerald-600" aria-hidden /> Ventajas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {PROS.map((p) => (
                  <li key={p} className="flex items-start gap-2"><Check className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />{p}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldAlert className="size-5 text-amber-600" aria-hidden /> Límites</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {LIMITS.map((l) => (
                  <li key={l} className="flex items-start gap-2"><X className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />{l}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-linear-to-br from-navy to-[oklch(0.32_0.14_262)] p-8 text-white md:flex-row md:items-center">
          <div>
            <h2 className="flex items-center gap-2 text-2xl font-bold"><Bot aria-hidden /> Comience su evaluación preliminar</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Responda el cuestionario y obtenga un diagnóstico técnico. La explicación con IA es opcional y nunca decide el nivel.
            </p>
          </div>
          <Link prefetch={false} href="/evaluacion" className={cn(buttonVariants({ size: "lg" }), "h-11 bg-white px-5 text-base text-navy hover:bg-white/90")}>
            Iniciar evaluación <ArrowRight aria-hidden />
          </Link>
        </div>
      </section>
    </>
  );
}
