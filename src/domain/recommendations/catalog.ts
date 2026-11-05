import type { RecommendationPriority } from "../types";

/**
 * CATÁLOGO DE RECOMENDACIONES
 * ---------------------------------------------------------------------------
 * Una entrada por requisito de la matriz (`domain/rules/requirements.ts`).
 * Las recomendaciones se DERIVAN de las reglas incumplidas; la IA solo puede
 * reformularlas, nunca añadir otras.
 *
 * `basePriority` aplica solo a requisitos NO críticos. Para los críticos, la
 * prioridad se calcula según su cercanía al nivel estimado (ver generate.ts).
 */

export interface CatalogEntry {
  problem: string;
  consequence: string;
  recommendation: string;
  benefit: string;
  basePriority?: RecommendationPriority;
}

export const RECOMMENDATION_CATALOG: Record<string, CatalogEntry> = {
  // ---- Tier I ----
  "R-T1-SPACE": {
    problem: "Los equipos de TI no están en un espacio dedicado.",
    consequence:
      "El acceso, la temperatura y la energía no se pueden controlar; otras actividades pueden afectar a los equipos críticos.",
    recommendation:
      "Consolidar los equipos críticos en una sala o gabinete cerrado con acceso controlado, separado de oficinas y bodegas.",
    benefit:
      "Reduce riesgos de acceso no autorizado y permite dimensionar energía y refrigeración para la carga real.",
  },
  "R-T1-POWER-CAP": {
    problem: "La capacidad eléctrica instalada no cubre (o no se ha comprobado que cubra) la carga de TI.",
    consequence:
      "Una sobrecarga puede disparar protecciones y causar interrupciones, además de impedir el crecimiento.",
    recommendation:
      "Medir la carga de TI (kW) y compararla con la capacidad de acometida, tableros y UPS; ampliar si el margen es insuficiente.",
    benefit: "Evita sobrecargas y brinda margen para crecer con seguridad.",
  },
  "R-T1-UPS": {
    problem: "No se cuenta con UPS para la carga de TI.",
    consequence:
      "Cualquier microcorte o variación eléctrica puede reiniciar o dañar los equipos.",
    recommendation:
      "Evaluar la instalación de un UPS dimensionado según la carga de TI y la autonomía requerida.",
    benefit: "Protege los equipos de cortes breves y da tiempo al arranque del generador.",
  },
  "R-T1-GEN": {
    problem: "No existe generador de respaldo para cortes prolongados.",
    consequence:
      "Un corte eléctrico que supere la autonomía del UPS detendría los servicios.",
    recommendation:
      "Evaluar un generador dimensionado para la carga de TI y la refrigeración, con transferencia al sistema eléctrico.",
    benefit: "Permite continuidad ante cortes prolongados de la red eléctrica.",
  },
  "R-T1-COOL": {
    problem: "La refrigeración de la sala de TI no es dedicada o no opera de forma continua.",
    consequence:
      "Si el aire acondicionado se apaga fuera de horario, los equipos pueden sobrecalentarse y fallar.",
    recommendation:
      "Instalar o reasignar refrigeración propia de la sala de TI, independiente del aire de oficinas y operando 24x7.",
    benefit: "Mantiene temperatura estable y reduce fallas por calor.",
  },
  "R-T1-COOL-CAP": {
    problem: "La capacidad de refrigeración no cubre (o no se ha comprobado que cubra) la carga térmica.",
    consequence: "Puntos calientes y apagados térmicos pueden afectar la continuidad.",
    recommendation:
      "Calcular la carga térmica de TI y comparar con la capacidad instalada; ajustar o ampliar la refrigeración.",
    benefit: "Evita sobrecalentamiento y alarga la vida útil de los equipos.",
  },
  "R-T1-DIST": {
    problem: "La distribución eléctrica de TI no está separada de otras cargas.",
    consequence: "Una falla en cargas ajenas puede disparar protecciones que alimentan equipos críticos.",
    recommendation:
      "Dedicar circuitos y tableros a la carga de TI, identificándolos claramente.",
    benefit: "Aísla fallas y facilita el mantenimiento y la medición.",
    basePriority: "medium",
  },
  "R-T1-MON-POWER": {
    problem: "No hay monitoreo de la energía de la sala de TI.",
    consequence: "Las degradaciones eléctricas se detectan tarde, normalmente cuando ya hubo una falla.",
    recommendation:
      "Incorporar medición y alarmas de energía (por ejemplo, en UPS y tableros) con notificación al personal.",
    benefit: "Permite actuar de forma preventiva y conocer el consumo real.",
    basePriority: "low",
  },
  "R-T1-UPS-RUNTIME": {
    problem: "La autonomía del UPS es menor a 5 minutos (o se desconoce).",
    consequence:
      "Puede no alcanzar para el arranque del generador ni para un apagado ordenado de los equipos.",
    recommendation:
      "Revisar la autonomía real a plena carga y, si es corta, evaluar ampliar baterías o reducir la carga protegida.",
    benefit: "Reduce el riesgo de apagados abruptos durante cortes.",
    basePriority: "medium",
  },
  "R-T1-ATS": {
    problem: "La transferencia al generador no es automática.",
    consequence: "Depender de una acción humana prolonga el corte y aumenta el riesgo de error.",
    recommendation:
      "Evaluar un sistema de transferencia automática con pruebas periódicas.",
    benefit: "Acorta el tiempo de respuesta ante cortes y reduce errores operativos.",
    basePriority: "medium",
  },
  "R-T1-MON-ENV": {
    problem: "No hay monitoreo ambiental con alarmas.",
    consequence: "Un aumento de temperatura o humedad puede pasar inadvertido hasta causar daños.",
    recommendation:
      "Instalar sensores de temperatura y humedad con alarmas y notificación.",
    benefit: "Alerta tempranamente de fallas de refrigeración.",
    basePriority: "low",
  },

  // ---- Tier II ----
  "R-T2-UPS-N1": {
    problem: "El UPS no tiene capacidad redundante (N+1).",
    consequence:
      "La falla de un módulo UPS podría dejar la carga sin protección o provocar una interrupción.",
    recommendation:
      "Evaluar un UPS modular o en paralelo con al menos un módulo adicional de respaldo (N+1).",
    benefit: "Una falla de un módulo ya no compromete la protección eléctrica.",
  },
  "R-T2-GEN-N1": {
    problem: "Los generadores no tienen capacidad redundante (N+1).",
    consequence:
      "Si el único generador (o el necesario) falla durante un corte, la carga queda sin respaldo prolongado.",
    recommendation:
      "Evaluar un generador adicional o una configuración en paralelo que mantenga la capacidad ante la falla de una unidad.",
    benefit: "Mantiene el respaldo ante la falla de un generador.",
  },
  "R-T2-COOL-N1": {
    problem: "La refrigeración no tiene redundancia de capacidad (N+1).",
    consequence:
      "Una falla del sistema de climatización podría afectar la continuidad del servicio.",
    recommendation:
      "Evaluar redundancia y capacidad térmica según la infraestructura disponible, por ejemplo una unidad adicional de enfriamiento.",
    benefit: "La falla de una unidad no reduce la capacidad térmica por debajo de la carga.",
  },

  // ---- Tier III ----
  "R-T3-PATHS-ELEC": {
    problem: "Solo hay una ruta de distribución eléctrica hacia la carga.",
    consequence:
      "Cualquier mantenimiento o falla en esa ruta obliga a interrumpir los equipos.",
    recommendation:
      "Evaluar una segunda ruta eléctrica (tableros, transferencias y cableado) hasta la carga crítica.",
    benefit: "Permite mantener o reparar una ruta mientras la otra alimenta la carga.",
  },
  "R-T3-PATHS-COOL": {
    problem: "Solo existe una ruta de distribución de refrigeración.",
    consequence:
      "El mantenimiento de tuberías, válvulas o ductos puede obligar a detener el enfriamiento.",
    recommendation:
      "Evaluar rutas alternas de refrigeración (lazos o circuitos secundarios) hacia la sala de TI.",
    benefit: "Permite intervenir la refrigeración sin afectar la carga.",
  },
  "R-T3-DUALPSU": {
    problem: "No todos los equipos críticos tienen doble fuente de alimentación.",
    consequence:
      "Los equipos con fuente única dependen de una sola ruta y se apagan si esta se interrumpe.",
    recommendation:
      "Priorizar equipos con doble fuente conectados a rutas distintas; para equipos de fuente única, evaluar conmutadores estáticos de transferencia.",
    benefit: "Los equipos siguen operando durante el mantenimiento o falla de una ruta.",
  },
  "R-T3-MAINT-POWER": {
    problem: "No se demuestra mantenimiento eléctrico sin afectar la carga.",
    consequence:
      "Las intervenciones programadas requieren ventanas de apagado, o se posterga el mantenimiento y aumenta el riesgo de falla.",
    recommendation:
      "Analizar el esquema eléctrico para identificar qué componentes obligan a apagar; incorporar bypass y rutas alternas.",
    benefit: "Facilita el mantenimiento preventivo sin interrumpir los servicios.",
  },
  "R-T3-MAINT-COOL": {
    problem: "No se demuestra mantenimiento de refrigeración sin afectar la carga.",
    consequence:
      "El mantenimiento de unidades o circuitos de enfriamiento puede obligar a reducir carga o apagar equipos.",
    recommendation:
      "Evaluar redundancia y seccionamiento (válvulas, bombas, unidades) que permitan aislar componentes sin perder capacidad.",
    benefit: "Hace posible el mantenimiento preventivo sin riesgo térmico.",
  },
  "R-T3-UTILITY": {
    problem: "La instalación depende de una sola acometida eléctrica.",
    consequence: "Una falla del suministro externo exige operar con generador de forma inmediata y prolongada.",
    recommendation:
      "Consultar con la empresa eléctrica la viabilidad de una segunda acometida independiente.",
    benefit: "Reduce la dependencia del respaldo local.",
    basePriority: "low",
  },
  "R-T3-FUEL": {
    problem: "La autonomía de combustible del generador es menor a 12 horas (o se desconoce).",
    consequence: "Un corte largo podría agotar el combustible antes de restablecerse el suministro.",
    recommendation:
      "Ampliar el almacenamiento de combustible o establecer un contrato de reabastecimiento con tiempos garantizados.",
    benefit: "Extiende la continuidad ante cortes prolongados.",
    basePriority: "medium",
  },

  // ---- Tier IV ----
  "R-T4-ACTIVE-PATHS": {
    problem: "No hay rutas activas simultáneas e independientes de energía y refrigeración.",
    consequence:
      "Una falla en la ruta activa puede interrumpir la carga mientras se conmuta a la alterna.",
    recommendation:
      "Evaluar un diseño con dos rutas activas simultáneas (por ejemplo, 2N) para energía y refrigeración.",
    benefit: "Una falla en una ruta no afecta a la carga porque la otra ya la alimenta.",
  },
  "R-T4-POWER-2N": {
    problem: "El UPS no tiene redundancia 2N.",
    consequence: "Una falla en el sistema UPS o su distribución podría interrumpir la carga.",
    recommendation:
      "Evaluar dos sistemas UPS completos e independientes alimentando rutas separadas.",
    benefit: "Tolera la falla total de uno de los sistemas UPS.",
  },
  "R-T4-COMPARTMENT": {
    problem: "Las rutas no están compartimentadas o comparten puntos únicos de falla.",
    consequence:
      "Un incendio, inundación o falla localizada puede afectar a ambas rutas a la vez.",
    recommendation:
      "Separar físicamente los componentes de cada ruta (salas, ductos, tableros) y eliminar elementos compartidos.",
    benefit: "Limita el alcance de un evento a una sola ruta.",
  },
  "R-T4-FAULT": {
    problem: "No se demuestra que una falla única no afecte la carga.",
    consequence: "Una falla individual puede interrumpir los servicios.",
    recommendation:
      "Realizar un análisis de puntos únicos de falla (SPOF) de energía y refrigeración y corregirlos según su criticidad.",
    benefit: "Identifica los puntos que realmente limitan la continuidad.",
  },
  "R-T4-AUTO": {
    problem: "La respuesta ante fallas no es completamente automática.",
    consequence: "La intervención humana añade retardo y riesgo de error ante una falla.",
    recommendation:
      "Evaluar automatización de transferencias y conmutaciones, con alarmas y pruebas periódicas.",
    benefit: "Reduce el tiempo de reacción y los errores operativos.",
  },
  "R-T4-COOL-CONT": {
    problem: "La refrigeración no se mantiene continua durante cortes eléctricos.",
    consequence:
      "Durante un corte, la temperatura puede subir en pocos minutos y forzar el apagado de equipos.",
    recommendation:
      "Respaldar la refrigeración con UPS o generador y evaluar almacenamiento térmico para cubrir la transferencia.",
    benefit: "Evita el sobrecalentamiento mientras arranca el generador.",
  },

  // ---- Operación ----
  "R-OPS-TESTS": {
    problem: "No se prueban periódicamente el UPS y el generador.",
    consequence: "Un respaldo no probado puede fallar justo cuando se necesita.",
    recommendation:
      "Establecer un calendario de pruebas (con carga y de transferencia) y registrar los resultados.",
    benefit: "Aumenta la confianza en que el respaldo funcionará.",
    basePriority: "medium",
  },
  "R-OPS-PROCEDURES": {
    problem: "No hay procedimientos documentados de operación y emergencia.",
    consequence: "La respuesta depende de personas concretas y se vuelve lenta e inconsistente.",
    recommendation:
      "Documentar procedimientos de operación, mantenimiento y respuesta a emergencias, y capacitar al personal.",
    benefit: "Respuestas más rápidas y consistentes ante incidentes.",
    basePriority: "medium",
  },
  "R-OPS-FAULT-TEST": {
    problem: "No se han realizado pruebas de falla o cortes simulados recientemente.",
    consequence: "Se desconoce si la infraestructura reaccionará como se espera ante una falla real.",
    recommendation:
      "Planificar pruebas controladas de falla con ventanas acordadas y plan de reversión.",
    benefit: "Descubre debilidades de forma controlada.",
    basePriority: "low",
  },
  "R-OPS-DOWNTIME": {
    problem: "Las fallas de infraestructura causaron indisponibilidad relevante en el último año.",
    consequence: "Indica debilidades reales que afectan el servicio.",
    recommendation:
      "Analizar las causas raíz de cada incidente y corregir primero las que se repiten.",
    benefit: "Reduce incidentes recurrentes y mejora la disponibilidad.",
    basePriority: "medium",
  },
};
