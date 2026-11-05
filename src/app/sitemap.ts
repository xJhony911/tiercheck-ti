import type { MetadataRoute } from "next";

export const dynamic = "force-static";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/evaluacion", "/demo", "/historial"];
  return pages.map((p) => ({
    url: `${SITE}${p}${p ? "/" : ""}`,
    changeFrequency: "monthly",
    priority: p === "" ? 1 : 0.7,
  }));
}
