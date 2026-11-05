import type { Metadata } from "next";
import { DemoPanel } from "@/components/demo/demo-panel";
import { DisclaimerBanner } from "@/components/layout/disclaimer-banner";

export const metadata: Metadata = { title: "Demostración" };

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Demostración con escenarios simulados</h1>
        <p className="max-w-3xl text-muted-foreground">
          Tres escenarios <strong>ficticios</strong> para ver el comportamiento real del motor de reglas. Puede ver los
          resultados completos o cargar las respuestas en el cuestionario y modificarlas para observar cómo cambia el nivel.
        </p>
      </div>
      <DisclaimerBanner compact />
      <DemoPanel />
    </div>
  );
}
