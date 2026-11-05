import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "TierCheck TI — Evaluación preliminar de nivel Tier de centros de datos",
    template: "%s · TierCheck TI",
  },
  description:
    "Plataforma orientativa para estimar de forma preliminar el nivel Tier (I a IV) de un centro de datos, con motor de reglas, recomendaciones técnicas, informe PDF y explicaciones con IA. No es una certificación oficial.",
  keywords: [
    "Tier centro de datos",
    "Uptime Institute",
    "evaluación Tier",
    "data center",
    "redundancia N+1",
    "mantenimiento concurrente",
    "tolerancia a fallas",
    "TierCheck TI",
  ],
  openGraph: {
    type: "website",
    locale: "es_EC",
    siteName: "TierCheck TI",
    title: "TierCheck TI — Evaluación preliminar de nivel Tier",
    description:
      "Estime de forma orientativa el nivel Tier de su centro de datos y obtenga recomendaciones y un informe PDF.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" suppressHydrationWarning className="h-full">
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <a
            href="#contenido"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
          >
            Saltar al contenido
          </a>
          <SiteHeader />
          <main id="contenido" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
