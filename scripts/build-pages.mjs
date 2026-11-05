// Compila el sitio como exportación estática (GitHub Pages).
// Las rutas /api requieren servidor, así que se apartan temporalmente durante la compilación
// y se restauran siempre al terminar (incluso si la compilación falla).
import { existsSync, renameSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const apiDir = path.join("src", "app", "api");
const stash = ".pages-stash-api";

if (existsSync(stash)) {
  console.error(`Existe ${stash} de una ejecución interrumpida. Restáurela manualmente a ${apiDir} y reintente.`);
  process.exit(1);
}

const hadApi = existsSync(apiDir);
if (hadApi) renameSync(apiDir, stash);
// Evita tipos obsoletos de compilaciones anteriores (rutas que ya no existen).
rmSync(".next", { recursive: true, force: true });
rmSync("out", { recursive: true, force: true });

let status = 1;
try {
  const result = spawnSync(
    process.execPath,
    [path.join("node_modules", "next", "dist", "bin", "next"), "build"],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        NEXT_PUBLIC_STATIC_EXPORT: "true",
        NEXT_PUBLIC_BASE_PATH: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
      },
    },
  );
  status = result.status ?? 1;
} finally {
  if (hadApi) renameSync(stash, apiDir);
}
process.exit(status);
