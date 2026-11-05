"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, FlaskConical, ListChecks } from "lucide-react";
import { DEMO_SCENARIOS } from "@/domain/scenarios/scenarios";
import { evaluateTier } from "@/domain/rules/engine";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDraftStore, getRepository } from "@/lib/storage/client";
import { createRecord } from "@/lib/storage/repository";
import { resultsHref } from "@/lib/routes";

export function DemoPanel() {
  const router = useRouter();
  // El resultado se calcula en vivo con el motor real (no está escrito a mano).
  const previews = useMemo(
    () => DEMO_SCENARIOS.map((s) => ({ scenario: s, result: evaluateTier(s.answers) })),
    [],
  );

  function loadInQuestionnaire(id: string) {
    const s = DEMO_SCENARIOS.find((x) => x.id === id);
    if (!s) return;
    getDraftStore().save({ entity: { ...s.entity }, answers: { ...s.answers }, step: "review", simulated: true });
    router.push("/evaluacion");
  }

  function viewResults(id: string) {
    const s = DEMO_SCENARIOS.find((x) => x.id === id);
    if (!s) return;
    const record = createRecord(s.entity, s.answers, { simulated: true });
    getRepository().save(record);
    router.push(resultsHref(record.id));
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {previews.map(({ scenario, result }) => (
        <Card key={scenario.id} className="flex flex-col">
          <CardHeader>
            <Badge variant="outline" className="w-fit gap-1 border-electric/50 text-electric">
              <FlaskConical aria-hidden /> DATOS SIMULADOS
            </Badge>
            <CardTitle className="mt-1 text-lg">{scenario.name}</CardTitle>
            <CardDescription>{scenario.description}</CardDescription>
          </CardHeader>
          <CardContent className="mt-auto space-y-3">
            <div className="rounded-xl bg-accent/60 p-3 text-sm">
              <p className="text-xs text-muted-foreground">Resultado calculado por el motor</p>
              <p className="text-lg font-semibold">{result.label}</p>
              <p className="text-xs text-muted-foreground">
                {result.met.length} cumplidos · {result.notMet.length} faltantes · {result.unknown.length} sin verificar
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Button onClick={() => viewResults(scenario.id)}>
                <BarChart3 aria-hidden /> Ver resultados completos
              </Button>
              <Button variant="outline" onClick={() => loadInQuestionnaire(scenario.id)}>
                <ListChecks aria-hidden /> Cargar en el cuestionario
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
