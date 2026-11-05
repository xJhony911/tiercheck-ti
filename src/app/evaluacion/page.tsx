import type { Metadata } from "next";
import { Wizard } from "@/components/questionnaire/wizard";

export const metadata: Metadata = { title: "Evaluación" };

export default function EvaluacionPage() {
  return <Wizard />;
}
