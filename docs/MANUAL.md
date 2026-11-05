# Manual de usuario de TierCheck TI

TierCheck TI es una herramienta **orientativa** que estima de forma **preliminar** el nivel Tier (I a IV) de la infraestructura de un centro de datos a partir de un cuestionario. **No es una certificación oficial ni reemplaza una auditoría profesional.**

## 1. Acceso

- **Versión en línea (GitHub Pages):** el enlace está en el [README](../README.md). Funciona en cualquier navegador moderno, sin instalar nada. La explicación con IA **no** está disponible en esa versión (ver sección 8).
- **Versión local (completa):** siga las instrucciones de instalación del README. Permite usar la IA si configura `GEMINI_API_KEY`.

## 2. Flujo general

1. **Inicio:** lea qué hace la herramienta, los niveles Tier y sus límites. Pulse **Iniciar evaluación**.
2. **Datos generales:** nombre (opcional), tipo de entidad, tipo de instalación y observaciones (opcional). No escriba información sensible (contraseñas, claves, direcciones internas, planos).
3. **Cuestionario:** 6 secciones (A a F) con 29 preguntas. Algunas aparecen solo si la anterior lo requiere (por ejemplo, la redundancia del UPS se pregunta si hay UPS).
4. **Revisión:** puede modificar cualquier respuesta antes de finalizar.
5. **Resultados:** nivel preliminar, explicación, requisitos, recomendaciones y gráficos.
6. **Informe PDF** e **historial** de evaluaciones.

## 3. El cuestionario

- **Barra de avance:** cuántas preguntas respondió. No es el nivel Tier.
- **Navegación:** use las pestañas de sección o los botones Anterior/Siguiente. No puede avanzar si hay preguntas sin responder en la sección actual.
- **Explicación técnica:** cada pregunta tiene un desplegable con ayuda, referencia pública y los requisitos que dependen de ella.
- **Pregunta crítica:** la etiqueta "Crítica" indica que la respuesta influye directamente en la clasificación.
- **"No sé":** es válido, pero se trata como **información no verificada**, nunca como cumplimiento. Puede impedir estimar un nivel.
- **Borrador:** sus respuestas se guardan automáticamente en su navegador. Si cierra la pestaña y vuelve, continúan ahí. El botón **Reiniciar** las borra.
- **Datos de ejemplo:** los botones Básica / Redundante / Concurrente cargan respuestas **simuladas** para probar la herramienta.

## 4. Cómo interpretar los resultados

| Resultado | Significado |
|---|---|
| **Tier I a IV preliminar** | Se declaran cumplidos todos los requisitos críticos de ese nivel y de los inferiores |
| **Por debajo de Tier I** | Algún requisito básico de Tier I se declaró como no cumplido |
| **Nivel preliminar indeterminado** | Faltan datos críticos, hay "No sé" en requisitos básicos, o hay respuestas contradictorias. Se indica qué falta |

Tres métricas distintas:

- **Avance del cuestionario:** preguntas respondidas.
- **Cobertura de información:** requisitos críticos verificados (excluye "No sé").
- **Nivel Tier estimado:** se decide por requisitos críticos, **no** por porcentajes.

Secciones del dashboard:

- **Qué impide alcanzar el siguiente nivel:** requisitos no cumplidos y por verificar.
- **Respuestas desconocidas:** todo lo que marcó "No sé".
- **Requisitos:** cumplidos, faltantes y sin verificar.
- **Recomendaciones:** con problema, consecuencia, acción y beneficio técnico, ordenadas por prioridad alta, media y baja. Se derivan de las reglas, no de la IA.
- **Gráficos:** cumplimiento por categoría (informativo).

> Uptime Institute (Tier I-IV) y ANSI/TIA-942 (Rated-1 a Rated-4) son sistemas **distintos**. La herramienta no estima niveles Rated ni los presenta como equivalentes.

## 5. Informe PDF

En la página de resultados pulse **Descargar informe PDF**. Incluye datos generales, fecha, nivel preliminar, resumen, requisitos cumplidos y pendientes, recomendaciones priorizadas y limitaciones. Si generó una explicación con IA, se incluye marcada como tal.

## 6. Historial

Menú **Historial**: lista sus evaluaciones (más recientes primero), permite abrirlas y eliminarlas. Se guardan **solo en su navegador** (almacenamiento local); no se envían a ningún servidor. Si borra los datos del navegador o usa otro equipo, no las verá.

## 7. Demostración

Menú **Demostración**: tres escenarios **simulados** (infraestructura básica, con capacidad redundante, y con mantenimiento concurrente). Puede ver los resultados completos o cargarlos en el cuestionario, modificarlos y observar cómo cambia el nivel.

## 8. Inteligencia artificial (solo versión local o con servidor)

En la página de resultados, el panel **Explicación personalizada con IA** permite:

- Generar un resumen ejecutivo, una explicación del diagnóstico y acciones priorizadas.
- Preguntar por un concepto técnico (por ejemplo "¿Qué es N+1?").

Reglas: la IA **nunca decide ni modifica el nivel Tier**, no recibe su nombre ni sus observaciones, y puede equivocarse. Si no está configurada, falla o se acaba la cuota, verá un aviso y los resultados y recomendaciones siguen disponibles. No escriba claves ni datos confidenciales.

Configuración: ver "Configurar la IA (Gemini)" en el [README](../README.md).

## 9. Preguntas frecuentes

**¿Puedo decir que mi centro de datos es Tier X?** No. El resultado es una estimación orientativa. La certificación oficial la otorga Uptime Institute tras una evaluación formal.

**¿Por qué me sale "indeterminado"?** Porque faltan datos de requisitos básicos, marcó "No sé" en ellos, o hay respuestas contradictorias. Revise la sección "Información que falta" o "Respuestas contradictorias".

**¿Por qué mi nivel es bajo si respondí casi todo "Sí"?** El nivel no se calcula por porcentaje: basta que falte un requisito crítico de un nivel para no alcanzarlo.

**¿Se guardan mis datos en internet?** No. Todo queda en su navegador.

**La página dice que la IA no está disponible.** En la versión publicada en GitHub Pages es normal (no hay servidor). En la versión local, revise que `GEMINI_API_KEY` esté en `.env.local` y reinicie.
