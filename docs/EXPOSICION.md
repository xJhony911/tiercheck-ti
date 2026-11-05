# Guion para explicar la arquitectura en una exposición

Duración sugerida: 12-15 minutos. Orden: problema → demo → arquitectura → motor → IA → pruebas → límites.

## 1. Problema y objetivo (1 min)

- Muchas organizaciones no saben qué nivel Tier podría corresponder a su infraestructura.
- TierCheck TI da una **estimación preliminar y orientativa**, explica brechas y recomienda mejoras.
- **Mensaje clave:** no es una certificación ni reemplaza una auditoría.

## 2. Demostración en vivo (3 min)

1. Inicio → advertencia visible → **Demostración**.
2. Abrir el escenario "Infraestructura básica" (datos **simulados**): resultado Tier I.
3. Abrir "Mantenimiento concurrente": Tier III. Mostrar qué impide Tier IV.
4. En el cuestionario, **cambiar una respuesta** (por ejemplo E4 a "No") y ver cómo baja a Tier II.
5. Marcar "No sé" en un requisito crítico: el nivel no sube (información no verificada).
6. Mostrar el PDF y el historial.

## 3. Arquitectura en capas (3 min)

Mostrar el diagrama de `docs/ARQUITECTURA.md`.

- **Dominio** (`src/domain`): lógica pura, sin React ni red. Es lo más importante y lo más probado.
- **Servicio de IA** (`src/lib/ai`): solo en el servidor.
- **Interfaz** (`src/components`): presenta el resultado, no lo calcula.
- **Persistencia** detrás de una interfaz: hoy `localStorage`, mañana una base de datos sin tocar la UI.

Frase para recordar: *"La IA explica; el motor decide."*

## 4. El motor de reglas (3 min)

- La matriz está **centralizada** en `requirements.ts`: cada requisito tiene nivel, criticidad, preguntas y una función `evaluate`.
- Niveles **acumulativos** con requisitos **críticos** verificables.
- **No se usa un porcentaje de respuestas afirmativas.** Prueba: con más de 80 % de requisitos cumplidos pero sin generador, el resultado es "por debajo de Tier I".
- "No sé" = `unknown` ≠ cumplimiento.
- Contradicciones → "Nivel preliminar indeterminado" indicando qué revisar.
- Separación explícita de Uptime Tier I-IV y ANSI/TIA-942 Rated-1…4.

## 5. Inteligencia artificial responsable (2 min)

- Gemini se llama desde el backend con `GEMINI_API_KEY` en `.env.local` (nunca en el navegador ni en el repositorio).
- El servidor **recalcula** el resultado: el cliente no puede mandar un resultado falso.
- La IA recibe solo datos técnicos (sin nombre ni observaciones). Su salida se valida; si menciona un nivel imposible o afirma certificación, se descarta.
- Si no hay clave, falla o se acaba la cuota: aviso claro y resultados deterministas. **No se simulan respuestas de IA.**
- Límite de solicitudes, validación Zod y timeout.

## 6. Calidad y pruebas (1 min)

- Pruebas Vitest: incompletas, no cumplidas, desconocidas, niveles I-IV, contradicciones, fallos de API, sin IA.
- Prueba de coherencia: cada pregunta ↔ requisito ↔ recomendación.
- Verificación de tipos, lint, compilación y recorrido automatizado en navegador.

## 7. Limitaciones y trabajo futuro (1 min)

- Respuestas autodeclaradas; criterios públicos y simplificados.
- Sin usuarios ni base de datos; limitador en memoria.
- Futuro: autenticación, base de datos, más preguntas condicionales, revisión de la matriz con un especialista, más idiomas.

## Preguntas frecuentes del jurado

| Pregunta | Respuesta breve |
|---|---|
| ¿Por qué no dejar que la IA decida el Tier? | No es verificable ni reproducible; el motor da el mismo resultado siempre y se puede auditar |
| ¿Cómo sabe que las reglas son correctas? | Se basan en descripciones públicas, están centralizadas, versionadas y probadas; se declara su limitación |
| ¿Qué pasa si falla Gemini? | La plataforma sigue mostrando resultados y recomendaciones; se informa que la IA no está disponible |
| ¿Dónde se guardan los datos? | Solo en el navegador del usuario (`localStorage`) |
| ¿Se puede cambiar un criterio? | Sí: se edita `requirements.ts`, se sube `RULES_VERSION` y se corren las pruebas |
