"use client";

import { useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryScore } from "@/domain/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const subscribe = () => () => {};

const SHORT: Record<string, string> = {
  A: "A. Eléctrica",
  B: "B. UPS/Gen.",
  C: "C. Clima",
  D: "D. Redundancia",
  E: "E. Rutas",
  F: "F. Continuidad",
};

export function CategoryCharts({ scores }: { scores: CategoryScore[] }) {
  // Recharts necesita medir el contenedor: se renderiza solo en el cliente.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const data = scores.map((s) => ({
    name: SHORT[s.category] ?? s.category,
    fullName: s.name,
    percent: s.percentMet,
    Cumplidos: s.met,
    "No cumplidos": s.notMet,
    "Sin verificar": s.unknown,
  }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Cumplimiento por categoría</CardTitle>
          <CardDescription>% de requisitos cumplidos. Es informativo: el Tier se decide por requisitos críticos, no por porcentaje.</CardDescription>
        </CardHeader>
        <CardContent className="h-80" role="img" aria-label="Gráfico de radar del cumplimiento por categoría">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={data} outerRadius="72%">
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                <Radar name="% cumplido" dataKey="percent" stroke="var(--electric)" fill="var(--electric)" fillOpacity={0.3} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }}
                  formatter={(v) => [`${v} %`, "Cumplido"]}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Estado de requisitos por categoría</CardTitle>
          <CardDescription>Cantidad de requisitos cumplidos, no cumplidos y sin verificar.</CardDescription>
        </CardHeader>
        <CardContent className="h-80" role="img" aria-label="Gráfico de barras apiladas de requisitos por categoría">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 10, right: 16 }}>
                <CartesianGrid stroke="var(--border)" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 }}
                  cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Cumplidos" stackId="s" fill="#10b981" radius={[4, 0, 0, 4]} />
                <Bar dataKey="No cumplidos" stackId="s" fill="#f43f5e" />
                <Bar dataKey="Sin verificar" stackId="s" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
