# Organización del proyecto (Scrum adaptado)

Cuatro etapas, cada una con entregables y verificación.

| Etapa | Objetivo | Entregables | Verificación |
|---|---|---|---|
| 1. Análisis de criterios técnicos | Definir qué se evalúa y con qué fuentes públicas | Descripción de niveles I-IV, lista de requisitos críticos, límites del alcance (`docs/REGLAS.md`) | Revisión de la matriz |
| 2. Diseño de interfaz, cuestionario y reglas | Diseñar el flujo y los datos | 29 preguntas A-F, matriz de requisitos, catálogo de recomendaciones, escenarios simulados, sistema visual | Pruebas de coherencia (`questionnaire.test.ts`) |
| 3. Programación de la plataforma y API de IA | Implementar | Motor, interfaz, historial, PDF, rutas `/api/ai/*` | Vitest, `tsc`, ESLint, `next build` |
| 4. Validación mediante pruebas funcionales | Comprobar el recorrido completo | Pruebas automatizadas y recorrido de navegador | Resultados abajo |

## Backlog por historias (producto)

| Historia | Estado |
|---|---|
| Como usuario quiero conocer la plataforma y sus límites | Hecho |
| Como usuario quiero ingresar datos generales sin información sensible | Hecho |
| Como usuario quiero responder un cuestionario con avance, validación y borrador | Hecho |
| Como usuario quiero un nivel Tier preliminar justificado, o "indeterminado" | Hecho |
| Como usuario quiero ver requisitos cumplidos, faltantes y desconocidos | Hecho |
| Como usuario quiero recomendaciones priorizadas derivadas de las reglas | Hecho |
| Como usuario quiero una explicación con IA sin que esta decida el Tier | Hecho (probada con simulacros y con clave falsa; ver nota) |
| Como usuario quiero descargar un informe PDF | Hecho |
| Como usuario quiero consultar y eliminar evaluaciones anteriores | Hecho |
| Como presentador quiero escenarios simulados para demostrar el motor | Hecho |

## Resultados de validación

| Verificación | Resultado |
|---|---|
| `npm test` (Vitest) | 104 pruebas en 8 archivos, todas correctas |
| `npm run typecheck` | Sin errores |
| `npm run lint` | Sin avisos |
| `npm run build` | Compila correctamente |
| Recorrido automatizado en Microsoft Edge (Playwright) | 39 comprobaciones correctas: inicio → datos → cuestionario → validaciones → borrador → modificar respuestas → resultados → gráficos → PDF → historial → demostración → casos indeterminado y contradictorio → modo oscuro → móvil, sin errores de consola |
| API sin clave | 200 con `available:false` / `not_configured`; entradas inválidas 400; límite de solicitudes 429 tras 10 por minuto |
| API con clave inválida (real, no simulada) | El SDK de Gemini intenta la llamada, falla y la plataforma responde `available:false`, `reason:error` sin romper los resultados |
| La clave no está en el bundle del cliente | Verificado (0 archivos de `.next/static` la contienen) |

> **Nota honesta:** no se dispuso de una `GEMINI_API_KEY` real durante el desarrollo, por lo que **no se probó una respuesta exitosa de Gemini**. La ruta exitosa está cubierta con un cliente simulado (pruebas unitarias) y debe validarse manualmente con su clave siguiendo el README.

## Pendiente / mejoras futuras

- Probar la explicación con IA usando una clave real y ajustar los prompts según la calidad observada.
- Revisión de la matriz de reglas con un especialista en centros de datos.
- Autenticación y base de datos si se requiere multiusuario.
