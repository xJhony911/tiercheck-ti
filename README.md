# TierCheck TI

Plataforma web de **evaluación preliminar del nivel Tier** de centros de datos, con motor de reglas determinista, recomendaciones técnicas priorizadas, explicaciones personalizadas con IA (Gemini) e informe PDF descargable.

> ⚠️ **Herramienta orientativa.** TierCheck TI no otorga certificaciones oficiales ni reemplaza una auditoría profesional. El resultado es una estimación basada en respuestas **autodeclaradas** y en criterios **públicos** del sistema Tier I-IV de Uptime Institute. Este sistema es distinto de las clasificaciones Rated-1 a Rated-4 de ANSI/TIA-942; la herramienta **no** las presenta como equivalentes.

Proyecto técnico universitario de Ingeniería en Tecnologías de la Información.

## Funcionalidades

| Módulo | Descripción |
|---|---|
| Inicio | Presentación, proceso, niveles Tier I-IV, ventajas y límites, advertencia visible |
| Datos generales | Nombre (opcional), tipo de entidad, tipo de instalación y observaciones (sin datos sensibles) |
| Cuestionario | 29 preguntas en 6 categorías (A-F), barra de avance, navegación, validación, preguntas condicionales, borrador conservado y revisión editable |
| Motor Tier | Reglas centralizadas y deterministas; "No sé" ≠ cumplimiento; detección de contradicciones; resultado "indeterminado" si faltan datos |
| Resultados | Nivel preliminar, explicación, requisitos cumplidos/faltantes/sin verificar, bloqueos del siguiente nivel, gráficos por categoría |
| Recomendaciones | Derivadas de las reglas (problema, consecuencia, acción, beneficio) con prioridad alta/media/baja |
| IA (Gemini) | Resumen ejecutivo, explicación, priorización y conceptos técnicos. **Nunca decide el Tier** |
| Informe PDF | Datos generales, fecha, nivel, resumen, requisitos, recomendaciones y limitaciones |
| Historial | Evaluaciones en `localStorage`: consultar y eliminar |
| Demostración | 3 escenarios **simulados** (básica, redundante, mantenimiento concurrente) |

## Requisitos

- **Windows 11** (también funciona en macOS/Linux)
- **Node.js 20.9 o superior** (probado con Node 24 LTS)
- Navegador moderno (Edge, Chrome, Firefox)

Instalar Node.js en Windows 11 (PowerShell):

```powershell
winget install OpenJS.NodeJS.LTS
```

Cierre y vuelva a abrir la terminal después de instalarlo.

## Instalación y ejecución (Windows 11)

Abra **PowerShell** en la carpeta del proyecto:

```powershell
cd ruta\a\tiercheck-ti
npm install
npm run dev
```

Abra <http://localhost:3000>.

> **Si PowerShell muestra "la ejecución de scripts está deshabilitada"** (error con `npm.ps1`), use una de estas opciones:
> - Ejecutar con `npm.cmd` en lugar de `npm` (por ejemplo `npm.cmd run dev`), o
> - Usar el **Símbolo del sistema (cmd)**, o
> - Habilitar scripts solo para su usuario: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### Versión de producción

```powershell
npm run build
npm start
```

## Configurar la IA (Gemini)

La plataforma **funciona sin IA**. Para activar la personalización:

1. Obtenga una clave en <https://aistudio.google.com/apikey>.
2. Copie el archivo de ejemplo:
   ```powershell
   Copy-Item .env.example .env.local
   ```
3. Edite `.env.local` y escriba su clave:
   ```
   GEMINI_API_KEY=su_clave_real
   GEMINI_MODEL=gemini-2.5-flash
   ```
4. Reinicie el servidor (`npm run dev`).

Seguridad:

- La clave se lee **solo en el servidor** (`src/lib/ai/gemini-client.ts`, rutas `/api/ai/*`). Nunca llega al navegador.
- `.env.local` está en `.gitignore`. Solo se versiona `.env.example`, sin claves.
- Si no hay clave, se agota la cuota o la API falla, la interfaz muestra el aviso **"La personalización con IA no está disponible"** y mantiene los resultados y recomendaciones deterministas. **Nunca se simula una respuesta de IA.**
- Límite: 10 solicitudes por minuto por IP, validación Zod, cuerpo máximo de 20 KB, tiempo máximo de 20 s.

## Pruebas y verificación

```powershell
npm test            # pruebas automatizadas (Vitest)
npm run typecheck   # verificación de tipos (TypeScript estricto)
npm run lint        # análisis estático (ESLint)
npm run build       # compilación de producción
```

Las pruebas cubren: respuestas incompletas, condiciones no cumplidas, requisitos críticos desconocidos, niveles Tier I-IV, respuestas contradictorias, fallos de la API de IA (cuota, tiempo de espera, red, respuesta inválida), funcionamiento sin IA, límite de solicitudes, privacidad del contenido enviado a la IA, historial y generación del PDF.

## Estructura del proyecto

```
src/
├─ app/                  Rutas (inicio, evaluacion, resultados/[id], historial, demo, api/ai/*)
├─ components/           Interfaz (layout, landing, questionnaire, results, history, demo, ui/shadcn)
├─ domain/               Lógica pura, sin React ni red
│  ├─ questionnaire/     Categorías, preguntas y visibilidad condicional
│  ├─ rules/             requirements.ts (MATRIZ), engine.ts, contradictions.ts
│  ├─ recommendations/   catalog.ts y generate.ts
│  └─ scenarios/         Escenarios de demostración simulados
└─ lib/
   ├─ ai/                Cliente Gemini, prompts, validación, saneamiento, rutas
   ├─ report/            Modelo del informe y exportación PDF (jsPDF)
   ├─ storage/           Historial y borrador (localStorage)
   ├─ validation/        Esquemas Zod
   └─ rate-limit.ts      Limitador de solicitudes
tests/                   Pruebas Vitest
docs/                    ARQUITECTURA.md, REGLAS.md, EXPOSICION.md, SCRUM.md
```

## Cómo modificar las reglas

Todo criterio Tier está en [`src/domain/rules/requirements.ts`](src/domain/rules/requirements.ts). Cada requisito declara su nivel, si es crítico, las preguntas de las que depende y una función `evaluate`. Para cambiarlo:

1. Edite o añada el requisito en `requirements.ts` (y su recomendación en `domain/recommendations/catalog.ts`).
2. Si agrega una pregunta, defínala en `domain/questionnaire/questions.ts` con las reglas que dependen de ella.
3. Incremente `RULES_VERSION`.
4. Ejecute `npm test`: las pruebas verifican que preguntas, reglas y catálogo sean coherentes.

Más detalle en [`docs/REGLAS.md`](docs/REGLAS.md).

## Documentación adicional

- [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md): decisiones técnicas y flujo de datos
- [`docs/REGLAS.md`](docs/REGLAS.md): matriz de requisitos, algoritmo y limitaciones
- [`docs/EXPOSICION.md`](docs/EXPOSICION.md): guion para explicar la arquitectura en una exposición
- [`docs/SCRUM.md`](docs/SCRUM.md): organización por sprints (Scrum adaptado)

## Limitaciones conocidas

- Sin autenticación ni base de datos: el historial vive en el navegador (se pierde si se borra el almacenamiento).
- El limitador de solicitudes es en memoria (una sola instancia del servidor).
- La matriz de reglas usa únicamente criterios públicos y es una simplificación; no sustituye el estándar oficial.
- Los porcentajes de disponibilidad mostrados en la página de inicio son referencias públicas, no garantías.
