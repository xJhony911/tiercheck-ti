import type { Metadata } from "next";
import { HistoryList } from "@/components/history/history-list";

export const metadata: Metadata = { title: "Historial" };

export default function HistorialPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Historial de evaluaciones</h1>
      <HistoryList />
    </div>
  );
}
