# Arquitectura de TierCheck TI

## Visión general

```mermaid
flowchart LR
  U[Usuario] --> UI[Interfaz Next.js\ncomponents/ + app/]
  UI --> Q[Cuestionario\ndomain/questionnaire]
  UI --> E[Motor de reglas\ndomain/rules]
  E --> R[Recomendaciones\ndomain/recommendations]
  UI --> S[(localStorage\nlib/storage)]
  UI --> P[Informe PDF\nlib/report]
  UI -- POST --> API[/api/ai/*\nroutes + handlers]
  API --> E
  API --> G[Gemini\nlib/ai/gemini-client]
```

Principio: **el motor de reglas es independiente de la interfaz y de la IA**. La IA solo recibe el resultado ya calculado y nunca lo modifica.

## Capas

| Capa | Carpeta | Responsabilidad | Depende de |
|---|---|---|---|
| Dominio | `src/domain` | Preguntas, matriz de reglas, motor, recomendaciones, escenarios. TypeScript puro | nada |
| Validación | `src/lib/validation` | Esquemas Zod (datos generales, registros guardados) | dominio |
| Servicio de IA | `src/lib/ai` | Prompts, cliente Gemini, saneamiento, validación de salida, rutas | dominio |
| Informe | `src/lib/report` | Modelo de informe + render PDF (jsPDF) | dominio |
| Persistencia | `src/lib/storage` | Historial y borrador en `localStorage` tras una interfaz de repositorio | dominio, validación |
| Interfaz | `src/components`, `src/app` | Presentación y navegación | todas |

`domain` no importa nada de `components`, `app` ni `lib` (salvo utilidades propias).

## Flujo de una evaluación

1. El usuario completa datos generales y cuestionario. El borrador se guarda en `localStorage` (`DraftStore`).
2. Al finalizar, `createRecord` ejecuta `evaluateTier(answers)` (puro, determinista) y guarda el registro (`LocalEvaluationRepository`).
3. La página de resultados lee el registro, calcula recomendaciones (`generateRecommendations`) y muestra el dashboard.
4. **Opcional:** el usuario pide la explicación con IA. El navegador envía solo `entityType` y `answers` a `/api/ai/explain`. El **servidor recalcula** el resultado con el mismo motor (el cliente no puede inyectar uno falso) y arma el contenido para Gemini.
5. La salida de la IA se valida (Zod + coherencia con el motor + sin afirmaciones de certificación). Si no pasa, se descarta.
6. El PDF se genera en el navegador con el registro (y el texto de IA solo si existe).

## Seguridad y privacidad de la IA

- `GEMINI_API_KEY` solo se lee en el servidor (`getConfiguredClient`). `src/lib/ai/runtime.ts` usa `server-only`. Verificado: el bundle de cliente no contiene la clave.
- Contenido enviado a la IA: tipo general de organización, respuestas técnicas, resultado del motor, requisitos y recomendaciones. **No** se envían nombre ni observaciones.
- Entrada validada con Zod (`ExplainRequestSchema`, `ConceptRequestSchema`); se rechazan textos con patrón de clave/secreto.
- Límite de 10 solicitudes/min por IP (`RateLimiter`), cuerpo máximo de 20 KB, timeout de 20 s.
- Degradación: `{ available: false, reason }` con motivos `not_configured`, `quota`, `timeout`, `invalid_response`, `rate_limited`, `error`. La UI mantiene los resultados deterministas.

## Decisiones técnicas

| Decisión | Razón |
|---|---|
| Next.js App Router + TypeScript estricto | Un solo proyecto con interfaz y API |
| Reglas como datos + funciones puras | Fáciles de revisar, modificar y probar |
| `localStorage` detrás de `EvaluationRepository` | Alcance universitario; reemplazable por BD |
| jsPDF en el navegador | Sin servidor ni Chromium, fácil de demostrar |
| Handlers de API separados de `route.ts` | Se prueban sin levantar el servidor |
| Recomendaciones desde catálogo | La IA no inventa acciones; solo reformula |
| Selector nativo `<select>` y radios propios | Accesibilidad y robustez en móviles |
| Fuente del sistema (Segoe UI) | Sin dependencia de red en la compilación |
| `cacheComponents` desactivado | Modo experimental incompatible con las rutas API dinámicas |

## Pruebas

`npm test` ejecuta Vitest sobre el dominio, la IA (con cliente simulado), el limitador, el almacenamiento, la validación y el PDF. La interfaz se verificó con un recorrido automatizado de navegador (ver `docs/SCRUM.md`).
