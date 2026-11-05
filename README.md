# TierCheck TI — Evaluador Preliminar de Centros de Datos

[![Desplegar en GitHub Pages](https://github.com/xJhony911/tiercheck-ti/actions/workflows/pages.yml/badge.svg)](https://github.com/xJhony911/tiercheck-ti/actions/workflows/pages.yml)
[![Sitio Web en Vivo](https://img.shields.io/badge/Demo%20en%20Vivo-GitHub%20Pages-blue?style=flat&logo=github)](https://xjhony911.github.io/tiercheck-ti/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Google Gemini API](https://img.shields.io/badge/Google%20Gemini-Flash%20AI-8E75B2?logo=google)](https://ai.google.dev/)

Plataforma web moderna para la **evaluación técnica orientativa del nivel Tier (I a IV)** de infraestructura de centros de datos según los criterios públicos del estándar de **Uptime Institute**, con motor determinista de reglas, detección de contradicciones, recomendaciones técnicas priorizadas, explicaciones personalizadas con Inteligencia Artificial (**Google Gemini**) y exportación de informes ejecutivos en PDF.

---

### 🌐 Acceso Inmediato

👉 **Sitio desplegado públicamente:** **[https://xjhony911.github.io/tiercheck-ti/](https://xjhony911.github.io/tiercheck-ti/)**

> ⚠️ **Aviso de alcance y responsabilidad:** TierCheck TI es una **herramienta técnica orientativa y académica**. No otorga certificaciones oficiales ni sustituye una auditoría presencial ni el estándar propietario de Uptime Institute ni la norma ANSI/TIA-942. El cálculo se fundamenta en las respuestas técnicas declaradas por el usuario.

---

## 🌟 Funcionalidades Principales

| Módulo | Descripción Técnica |
|---|---|
| **Página de Inicio** | Introducción a los niveles Tier I-IV, proceso de evaluación, alcances, ventajas y limitaciones transparentes. |
| **Datos Generales** | Información contextual de la instalación (organización, tipo de edificio, observaciones). Sin datos sensibles ni contraseñas. |
| **Cuestionario Guiado** | 29 preguntas técnicas en 6 categorías (A-F: Energía, Respaldo, Climatización, Redundancia, Rutas y Continuidad), lógica condicional y guardado de borrador. |
| **Motor de Reglas Determinista** | 20 requisitos críticos + 11 operativos. Lógica de cuello de botella: el componente más débil limita el nivel final. "No sé" jamás suma como cumplimiento. |
| **Detector de Contradicciones** | 7 reglas que detectan inconsistencias técnicas (ej. declarar 2N con una sola acometida o generador de arranque manual). |
| **Resultados y Métricas** | Indicador velocímetro Tier, desglose de requisitos cumplidos/faltantes, bloqueos para el siguiente nivel y gráficos de radar por subsistema. |
| **Recomendaciones Técnicas** | Acciones correctivas priorizadas (alta, media, baja) con problema identificado, impacto y beneficio técnico. |
| **IA con Google Gemini** | Resumen ejecutivo, glosario interactivo y explicaciones personalizadas. **La IA nunca decide ni altera el nivel Tier**. |
| **Informe PDF Profesional** | Generación 100% en el cliente con jsPDF: membrete, metadatos, tabla de requisitos y recomendaciones descargables. |
| **Escenarios de Demostración** | 3 casos reales simulados (Básica Tier I, Redundante Tier II y Mantenimiento Concurrente Tier III) para pruebas inmediatas. |
| **Historial Local** | Almacenamiento privado en `localStorage` del navegador para consultar o eliminar evaluaciones anteriores. |

---

## 🤖 Uso de la IA (Google Gemini) en la Web y en Local

TierCheck TI cuenta con soporte dual para la IA:

### 1. En la versión publicada (GitHub Pages) — "Bring Your Own Key" (BYOK)
Cualquier usuario o evaluador puede activar la IA directamente en su navegador:
1. Haga clic en el botón **"Configurar IA"** en la barra superior o en el panel de resultados.
2. Ingrese una clave gratuita obtenida en [Google AI Studio](https://aistudio.google.com/apikey).
3. Presione **"Probar y Guardar"**.
> 🔒 **Privacidad:** La clave se almacena exclusivamente en el `localStorage` de su navegador y las consultas van directo a los servidores de Google. Nunca viajan por servidores intermedios.

### 2. En tu computadora (Ejecución Local)
Puede configurar la clave en el archivo `.env.local` para que el servidor Node.js la utilice automáticamente:
```bash
# Copie el archivo de ejemplo
copy .env.example .env.local
```
Edite `.env.local`:
```env
GEMINI_API_KEY=su_clave_aqui
GEMINI_MODEL=gemini-3.1-flash-lite
```

---

## 💻 Ejecución en Local (Windows 11 / Linux / macOS)

### Requisitos previos
- **Node.js 20 LTS o superior** (probado en Node 22 y 24 LTS).
- **Git** instalado.

### Pasos de instalación y arranque
```powershell
# 1. Clonar el repositorio
git clone https://github.com/xJhony911/tiercheck-ti.git
cd tiercheck-ti

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```

Abra su navegador en **`http://localhost:3000`**.

> **Nota para PowerShell:** Si surge la alerta de directiva de ejecución en Windows, use `npm.cmd run dev` o habilite scripts locales con `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

---

## 🧪 Pruebas Automatizadas y Calidad de Código

El proyecto cuenta con 104 pruebas unitarias automatizadas con **Vitest**:

```powershell
npm test            # Ejecutar las 104 pruebas unitarias (100% pasando)
npm run typecheck   # Verificación estricta de TypeScript (tsc --noEmit)
npm run lint        # Análisis estático de código con ESLint 9
npm run build:pages # Compilación y exportación estática para GitHub Pages
```

---

## 📁 Documentación Académica y Técnica

- 📖 **[Manual de Usuario (`docs/MANUAL.md`)](docs/MANUAL.md)**: Guía completa paso a paso para usuarios finales.
- 📐 **[Matriz de Reglas y Algoritmo (`docs/REGLAS.md`)](docs/REGLAS.md)**: Detalle matemático y lógico de cada requisito y contradicción técnica.
- 🏗️ **[Arquitectura de Software (`docs/ARQUITECTURA.md`)](docs/ARQUITECTURA.md)**: Capas de dominio desacopladas, flujo de datos y patrones de diseño.
- 🎤 **[Guion de Exposición (`docs/EXPOSICION.md`)](docs/EXPOSICION.md)**: Libreto preparado para la defensa universitaria del proyecto.
- 📋 **[Gestión Ágil Scrum (`docs/SCRUM.md`)](docs/SCRUM.md)**: Backlog, historias de usuario e iteraciones de desarrollo.

---

## 🛠️ Tecnologías Utilizadas

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19).
- **Estilos y Componentes:** [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + Lucide Icons.
- **Gráficos:** [Recharts](https://recharts.org/) (Radar y barras de capacidad por subsistema).
- **IA:** [Google Gen AI SDK](https://ai.google.dev/) + REST Fallback (`gemini-3.1-flash-lite` y `gemini-3.5-flash-lite`).
- **Generación PDF:** [jsPDF](https://github.com/parallax/jsPDF) + [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable).
- **Validación:** [Zod](https://zod.dev/) para esquemas de datos e integridad estricta.
- **Testing:** [Vitest](https://vitest.dev/).
- **CI/CD:** [GitHub Actions](https://github.com/features/actions) desplegando automáticamente en [GitHub Pages](https://pages.github.com/).
