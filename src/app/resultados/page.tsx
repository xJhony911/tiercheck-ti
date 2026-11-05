import { Suspense } from "react";
import type { Metadata } from "next";
import { ResultsView } from "@/components/results/results-view";

export const metadata: Metadata = { title: "Resultados", robots: { index: false } };

export default function ResultadosPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-16 text-center text-muted-foreground" aria-busy>
          Cargando resultados…
        </div>
      }
    >
      <ResultsView />
    </Suspense>
  );
}
