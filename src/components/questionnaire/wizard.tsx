"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, FlaskConical, RotateCcw, Send } from "lucide-react";
import { CATEGORIES } from "@/domain/questionnaire/categories";
import {
  computeProgress,
  getVisibleQuestions,
  pruneHiddenAnswers,
} from "@/domain/questionnaire/visibility";
import { DEMO_SCENARIOS } from "@/domain/scenarios/scenarios";
import type { Answers, EntityInfo } from "@/domain/types";
import { Button } from "@/components/ui/button";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { DisclaimerBanner } from "@/components/layout/disclaimer-banner";
import { getDraftStore, getRepository } from "@/lib/storage/client";
import { createRecord } from "@/lib/storage/repository";
import { resultsHref } from "@/lib/routes";
import { EntityInfoSchema, validateEntity } from "@/lib/validation/entity";
import { EntityForm, type EntityDraft } from "./entity-form";
import { QuestionCard } from "./question-card";
import { ReviewStep } from "./review-step";
import { STEP_IDS, Stepper, stepTitle, type StepId } from "./stepper";

function isStepId(value: string): value is StepId {
  return (STEP_IDS as string[]).includes(value);
}

export function Wizard() {
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);
  const [entity, setEntity] = useState<EntityDraft>({});
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState<StepId>("entity");
  const [simulated, setSimulated] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Recupera el borrador guardado (conservación temporal de respuestas).
  useEffect(() => {
    const draft = getDraftStore().load();
    /* eslint-disable react-hooks/set-state-in-effect -- lectura única de localStorage tras montar */
    if (draft) {
      setEntity(draft.entity);
      setAnswers(pruneHiddenAnswers(draft.answers));
      setStep(isStepId(draft.step) ? draft.step : "entity");
      setSimulated(draft.simulated === true);
    }
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Guarda el borrador ante cada cambio.
  useEffect(() => {
    if (!loaded) return;
    getDraftStore().save({ entity, answers, step, simulated });
  }, [loaded, entity, answers, step, simulated]);

  const entityErrors = useMemo(() => validateEntity(entity), [entity]);
  const entityValid = Object.keys(entityErrors).length === 0;
  const progress = useMemo(() => computeProgress(answers), [answers]);

  const completed = useMemo(() => {
    const set = new Set<StepId>();
    if (entityValid) set.add("entity");
    const visible = getVisibleQuestions(answers);
    for (const cat of CATEGORIES) {
      const qs = visible.filter((q) => q.category === cat.id);
      if (qs.length > 0 && qs.every((q) => answers[q.id] !== undefined)) set.add(cat.id);
    }
    if (progress.complete && entityValid) set.add("review");
    return set;
  }, [answers, entityValid, progress.complete]);

  // Primer paso incompleto: los posteriores permanecen bloqueados (validación de avance).
  const firstIncompleteIndex = useMemo(() => {
    const idx = STEP_IDS.findIndex((id) => id !== "review" && !completed.has(id));
    return idx === -1 ? STEP_IDS.length - 1 : idx;
  }, [completed]);

  const stepIndex = STEP_IDS.indexOf(step);

  function goTo(next: StepId) {
    setShowErrors(false);
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => headingRef.current?.focus(), 50);
  }

  function handleNext() {
    if (step !== "review" && !completed.has(step)) {
      setShowErrors(true);
      const firstMissing = step === "entity" ? null : getVisibleQuestions(answers).find((q) => q.category === step && answers[q.id] === undefined);
      if (firstMissing) document.getElementById(`q-${firstMissing.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    goTo(STEP_IDS[Math.min(stepIndex + 1, STEP_IDS.length - 1)]);
  }

  function handleAnswer(qid: string, value: string) {
    setAnswers((prev) => pruneHiddenAnswers({ ...prev, [qid]: value }));
  }

  function loadScenario(id: string) {
    const s = DEMO_SCENARIOS.find((x) => x.id === id);
    if (!s) return;
    setEntity({ ...s.entity });
    setAnswers({ ...s.answers });
    setSimulated(true);
    goTo("review");
  }

  function resetAll() {
    if (!window.confirm("¿Borrar los datos y respuestas actuales y empezar de nuevo?")) return;
    getDraftStore().clear();
    setEntity({});
    setAnswers({});
    setSimulated(false);
    setShowErrors(false);
    setStep("entity");
  }

  function finish() {
    const parsed = EntityInfoSchema.safeParse(entity);
    if (!parsed.success || !progress.complete) {
      setSaveError("Complete los datos generales y todas las preguntas antes de finalizar.");
      return;
    }
    try {
      const info: EntityInfo = {
        ...parsed.data,
        organizationName: parsed.data.organizationName || undefined,
        observations: parsed.data.observations || undefined,
      };
      const record = createRecord(info, pruneHiddenAnswers(answers), { simulated });
      getRepository().save(record);
      getDraftStore().clear();
      router.push(resultsHref(record.id));
    } catch {
      setSaveError("No se pudo guardar la evaluación en el almacenamiento local del navegador.");
    }
  }

  if (!loaded) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground" aria-busy>
        Cargando cuestionario…
      </div>
    );
  }

  const category = CATEGORIES.find((c) => c.id === step);
  const visibleInStep = category ? getVisibleQuestions(answers).filter((q) => q.category === category.id) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Evaluación preliminar</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <FlaskConical className="size-3.5" aria-hidden /> Datos de ejemplo (simulados):
            </span>
            {DEMO_SCENARIOS.map((s) => (
              <Button key={s.id} variant="outline" size="sm" onClick={() => loadScenario(s.id)} title={s.description}>
                {s.id === "basic" ? "Básica" : s.id === "redundant" ? "Redundante" : "Concurrente"}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={resetAll}>
              <RotateCcw aria-hidden /> Reiniciar
            </Button>
          </div>
        </div>

        {simulated && (
          <div role="status" className="rounded-xl border border-electric/40 bg-accent px-4 py-2 text-sm">
            <strong>DATOS SIMULADOS:</strong> las respuestas provienen de un escenario de demostración. Puede
            modificarlas antes de finalizar.
          </div>
        )}

        <Progress value={progress.pct} className="gap-2">
          <ProgressLabel>Avance del cuestionario ({progress.answered} de {progress.total} preguntas)</ProgressLabel>
          <ProgressValue>{() => `${progress.pct} %`}</ProgressValue>
        </Progress>
        <p className="text-xs text-muted-foreground">
          El avance mide cuántas preguntas respondió. No es el nivel Tier ni la cobertura de información: esos se calculan al finalizar.
        </p>
      </div>

      <Stepper
        current={step}
        firstIncompleteIndex={firstIncompleteIndex}
        completed={completed}
        onSelect={goTo}
      />

      <section aria-labelledby="step-title" className="animate-in fade-in slide-in-from-bottom-2 space-y-4 duration-300" key={step}>
        <div>
          <h2 id="step-title" ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">
            {step === "entity" ? "Datos generales de la entidad" : step === "review" ? "Revise sus respuestas" : `${step}. ${stepTitle(step)}`}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {step === "entity"
              ? "Esta información solo contextualiza el informe."
              : step === "review"
                ? "Puede modificar cualquier respuesta antes de finalizar."
                : category?.description}
          </p>
        </div>

        {step === "entity" && <EntityForm value={entity} onChange={setEntity} errors={showErrors ? entityErrors : {}} />}

        {category &&
          visibleInStep.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              value={answers[q.id]}
              onChange={(v) => handleAnswer(q.id, v)}
              showError={showErrors}
            />
          ))}

        {step === "review" && <ReviewStep answers={answers} onEdit={goTo} />}
      </section>

      {saveError && (
        <p role="alert" className="text-sm font-medium text-destructive">{saveError}</p>
      )}

      <div className="sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t bg-background/90 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-xl sm:border">
        <Button variant="outline" size="lg" onClick={() => goTo(STEP_IDS[Math.max(stepIndex - 1, 0)])} disabled={stepIndex === 0}>
          <ArrowLeft aria-hidden /> Anterior
        </Button>
        <span className="hidden text-sm text-muted-foreground sm:block">
          Sección {stepIndex + 1} de {STEP_IDS.length}
        </span>
        {step === "review" ? (
          <Button size="lg" onClick={finish} disabled={!progress.complete || !entityValid}>
            <Send aria-hidden /> Finalizar y ver resultados
          </Button>
        ) : (
          <Button size="lg" onClick={handleNext}>
            Siguiente <ArrowRight aria-hidden />
          </Button>
        )}
      </div>

      <DisclaimerBanner compact />
    </div>
  );
}
