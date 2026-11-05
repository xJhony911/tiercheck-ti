# Matriz de reglas y algoritmo del motor Tier

Fuente única de verdad: [`src/domain/rules/requirements.ts`](../src/domain/rules/requirements.ts) (versión de reglas `RULES_VERSION`).

## Alcance y limitaciones

- Marco conceptual: descripción **pública** de los niveles Tier I-IV de Uptime Institute. No se reproducen ni infieren requisitos del estándar restringido.
- Es una **estimación orientativa** sobre respuestas **autodeclaradas**. No es certificación ni auditoría.
- La certificación oficial de Uptime Institute evalúa diseño, construcción y sostenibilidad operativa; este cuestionario lo cubre solo parcialmente.
- **Tier (Uptime Institute) ≠ Rated-1…4 (ANSI/TIA-942).** Son sistemas distintos; la herramienta no estima niveles Rated ni los equipara.
- Los niveles son **acumulativos**: Tier III exige también lo de Tier I y II.

## Estados de un requisito

| Estado | Significado |
|---|---|
| `met` | Cumplido según la respuesta |
| `not_met` | Declarado como no cumplido |
| `unknown` | "No sé" o sin responder. **Información no verificada: nunca equivale a cumplimiento** |

## Algoritmo (sin porcentajes)

1. Se evalúa cada requisito (`met` / `not_met` / `unknown`).
2. Un nivel `L` se **demuestra** si TODOS los requisitos **críticos** de los niveles `1..L` están `met`.
3. Orden de decisión del resultado:

| # | Condición | Resultado |
|---|---|---|
| 1 | Existe alguna contradicción | `INDETERMINATE` (nivel indeterminado) |
| 2 | Algún crítico de Tier I está `not_met` | `BELOW_TIER_1` |
| 3 | Algún crítico de Tier I está `unknown` | `INDETERMINATE` (falta información) |
| 4 | Cobertura de críticos verificados < 50 % (`MIN_CRITICAL_COVERAGE_PCT`) | `INDETERMINATE` |
| 5 | Otro caso | `TIER`: mayor nivel consecutivo demostrado |

4. Para el siguiente nivel se informan los **bloqueos** (`not_met`) y lo **sin verificar** (`unknown`). Estado `blocked` si hay bloqueos; `unverified` si solo falta información.
5. El porcentaje por categoría (gráficos) es **solo informativo** y nunca decide el nivel.
6. Tres métricas separadas: **avance del cuestionario**, **cobertura de información** (críticos verificados) y **nivel Tier estimado**.

## Preguntas condicionales

Solo profundizan (p. ej. la configuración del UPS se pregunta si hay UPS). Si el padre es "No", el requisito dependiente se considera `not_met`; si es desconocido, `unknown`. Los requisitos esenciales siempre se evalúan.

## Requisitos críticos (determinan el nivel)

| ID | Nivel | Categoría | Preguntas | Condición para `met` |
|---|---|---|---|---|
| R-T1-SPACE | I | A | A1 | Espacio dedicado para TI |
| R-T1-POWER-CAP | I | A | A4 | Capacidad eléctrica cubre la carga de TI |
| R-T1-UPS | I | B | B1 | Existe UPS |
| R-T1-GEN | I | B | B3 | Existe generador |
| R-T1-COOL | I | C | C1 | Refrigeración dedicada 24x7 |
| R-T1-COOL-CAP | I | C | C4 | Capacidad de refrigeración suficiente |
| R-T2-UPS-N1 | II | D | B1, D1 | UPS en N+1, 2N o 2N+1 |
| R-T2-GEN-N1 | II | D | B3, D2 | Generadores en N+1 o superior |
| R-T2-COOL-N1 | II | D | C1, D3 | Refrigeración en N+1 o superior |
| R-T3-PATHS-ELEC | III | E | E1 | Dos rutas eléctricas (alterna o activas) |
| R-T3-PATHS-COOL | III | E | E2 | Dos rutas de refrigeración |
| R-T3-DUALPSU | III | D | D4 | Doble alimentación en todos los equipos críticos |
| R-T3-MAINT-POWER | III | E | E3 | Mantenimiento eléctrico sin afectar la carga |
| R-T3-MAINT-COOL | III | E | E4 | Mantenimiento de refrigeración sin afectar la carga |
| R-T4-ACTIVE-PATHS | IV | E | E1, E2 | Rutas activas simultáneas (energía y refrigeración) |
| R-T4-POWER-2N | IV | D | B1, D1 | UPS en 2N o superior |
| R-T4-COMPARTMENT | IV | E | E5 | Rutas compartimentadas |
| R-T4-FAULT | IV | F | F1 | Falla única no afecta la carga |
| R-T4-AUTO | IV | F | F2 | Respuesta autónoma ante fallas |
| R-T4-COOL-CONT | IV | C | C1, C2 | Refrigeración continua durante cortes |

## Requisitos no críticos (solo generan recomendaciones)

R-T1-DIST (A2), R-T1-MON-POWER (A5), R-T1-UPS-RUNTIME (B1, B2), R-T1-ATS (B3, B6), R-T1-MON-ENV (C3), R-T3-UTILITY (A3), R-T3-FUEL (B3, B4), R-OPS-TESTS (B5), R-OPS-PROCEDURES (F3), R-OPS-FAULT-TEST (F4), R-OPS-DOWNTIME (F5).

## Contradicciones (`contradictions.ts`)

| ID | Se dispara cuando |
|---|---|
| K-UPS-REDUNDANT-WITHOUT-UPS | Sin UPS (B1=No) pero UPS redundante (D1) |
| K-GEN-REDUNDANT-WITHOUT-GEN | Sin generador (B3=No) pero generadores redundantes (D2) |
| K-COOL-REDUNDANT-WITHOUT-COOL | Sin refrigeración dedicada (C1=No) pero redundante (D3) |
| K-MAINT-POWER-WITHOUT-REDUNDANCY | Mantenimiento eléctrico sin afectar carga (E3=Sí) con UPS sin redundancia (D1=N) |
| K-MAINT-COOL-WITHOUT-REDUNDANCY | Mantenimiento de refrigeración (E4=Sí) con refrigeración sin redundancia (D3=N) |
| K-FAULT-TOLERANT-SINGLE-PATH | Tolerancia a fallas (F1=Sí) con una sola ruta (E1 o E2 = una) |
| K-FAULT-TOLERANT-NO-REDUNDANCY | Tolerancia a fallas (F1=Sí) con D1, D2 o D3 = N |

## Prioridad de recomendaciones

Distancia = nivel del requisito − nivel estimado (0 si no hay estimación).

| Requisito | `not_met` | `unknown` |
|---|---|---|
| Crítico, distancia ≤ 1 | Alta | Media (Alta si el resultado es indeterminado) |
| Crítico, distancia 2 | Media | Baja |
| Crítico, distancia > 2 | Baja | Baja |
| No crítico | Prioridad base del catálogo (media o baja) | Baja |

## Cómo modificar una regla

1. Edite el requisito en `requirements.ts` (su función `evaluate`, su nivel o `critical`).
2. Añada/ajuste su entrada en `domain/recommendations/catalog.ts`.
3. Si cambia las preguntas, edite `domain/questionnaire/questions.ts` y su campo `rules`.
4. Incremente `RULES_VERSION` y corra `npm test` (verifica coherencia entre preguntas, matriz y catálogo).
