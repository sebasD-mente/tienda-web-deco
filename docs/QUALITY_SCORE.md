# QUALITY_SCORE.md (Mapa de Salud, Estabilidad y Evolución del Sistema — Deco Vintage Guate)

Este documento proporciona **Observabilidad de Proceso a Largo Plazo** para **`deco-vintage-web`**. Mientras `evaluator-rubric.md` responde *"¿Hizo buen trabajo el agente en esta sesión?"*, `docs/QUALITY_SCORE.md` responde *"¿El repositorio y la plataforma en producción se están fortaleciendo o debilitando con el tiempo?"*, permitiendo que cualquier sesión nueva identifique de inmediato qué dominios o capas son sólidos (`A`) y cuáles requieren cautela (`B`, `C` o `D`).

**Cadencia de Actualización:**
- Después de cada sesión o entrega significativa en `feature_list.json`.
- Antes y después de ejecutar comparaciones de benchmark o estudios de ablación.
- Después de pases de limpieza estructural, endurecimiento de seguridad o migración de capas.

**Escala de Calificación:**
- **A**: Toda la verificación pasando, límites arquitectónicos impuestos mecánicamente, legible para el agente y tests estables.
- **B**: Funcionando correctamente en producción con mapeo *Brownfield* documentado o brechas menores de cobertura/estructura.
- **C**: Parcialmente funcional, difícil de entender para el agente o con inestabilidad notable en tests (*flaky*).
- **D**: Roto, inseguro o estructuralmente confuso (prioridad máxima de reparación antes de expandir alcance).

---

## 1. Dominios del Proyecto (`deco-vintage-web`)

| Dominio / Área | Calificación (A-D) | Verificación | Legibilidad para el Agente | Estabilidad de Tests | Brechas Principales / Notas Brownfield | Última Actualización |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Aplicación / Producto (`app`: Catálogo, Órdenes, J.A.R.V.I.S., Admin, SEO)** | B | Pasa Puerta 3 completa: `npm run check`, `65/65 tests` (10 suites) y `vite build` | Alta (`ARCHITECTURE.md` mapea backend Express/Prisma y frontend React/Vite; contratos API en `PROJECT.md`) | Estable (`65/65 PASS` sin dependencias externas en CI local) | Estructura *Brownfield* (`routes/`, `services/`, `src/components/`, `src/pages/`); 3 componentes importan `generateWhatsAppLink` desde `src/config/constants.js` (extraer a `src/service/` si se migra a `src/ui/`) | 2026-11-18 |
| **Gobernanza, Instrucciones y Grafos (`instructions`)** | A | Pasa `bash ./init.sh` (`5/5`) y `scripts/check-architecture.sh` | Alta (`AGENTS.md` conciso, `ARCHITECTURE.md`, `goal.md`, `maker-prompt.md`, `checker-prompt.md`, `SKILL.md`, `graph.md`) | Estable (`100%` determinista, `0` enlaces muertos) | Ninguna | 2026-11-18 |
| **Estado, Alcance y Ciclo de Vida (`state`, `scope`, `lifecycle`)** | A | Pasa `node scripts/validate-harness.mjs --min-score 100` (`15/15`) y esquema JSON | Alta (`feature_list.json`, `scripts/feature-list.schema.json`, `progress.md`, `session-handoff.md`, `sprint-contract.md`, `loop-state.md`, `clean-state-checklist.md`) | Estable (`Pass-State Gating`, `WIP <= 1`, DAG y `deprecated_files`) | Ninguna | 2026-11-18 |
| **Auto-Memoria Persistente (`memory`)** | A | Pasa `bash scripts/check-architecture.sh` (Sección 3) | Alta (`memory/INDEX.md` + `harness-rules.md` + `deco-vintage-context.md` con reglas soberanas no derivables) | Estable (guardado en dos pasos y detector de huérfanos activo) | Ninguna | 2026-11-18 |
| **Verificación, Seguridad Zero-Trust y Observabilidad Dual (`verification`)** | A | Pasa las 3 Puertas (`100/100`), `npm run harness:check`, `cleanup-scanner`, Bolígrafo Rojo y hooks nativos | Alta (`audit-secrets.js`, `audit-syntax.js`, `verify-gemini-models.js`, `.agents/hooks.json`, `scripts/harness-hooks.mjs`, `docs/SECURITY.md`, `docs/RELIABILITY.md`) | Estable (`25/25` checks del arnés + `65/65` tests de aplicación/seguridad) | Ninguna | 2026-11-18 |

---

## 2. Capas Arquitectónicas (`Types -> Config -> Repo -> Service -> Runtime -> UI`)

| Capa | Calificación (A-D) | Enforcement de Límites | Legibilidad para el Agente | Brechas Principales | Última Actualización |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Definiciones (`Types`)** | A | Zod (`validators/adminSchemas.js`), `prisma/schema.prisma`, `scripts/feature-list.schema.json` y vigilancia en `src/types/` | Alta (contratos de entrada/salida y errores explícitos) | Ninguna | 2026-11-18 |
| **Ajustes (`Config`)** | A | Vigilado mecánicamente por `scripts/check-architecture.sh` (`src/config/` con `0` imports superiores) + `config/paths.js` y `config/prisma.js` | Alta (rutas de volúmenes Docker y constantes aisladas) | Extraer helper `generateWhatsAppLink` a `Service` si en el futuro se mueve `UI` bajo `src/ui/` | 2026-11-18 |
| **Datos / Archivos (`Repo`)** | A | Prisma ORM 6 (`posters_categoria_fkey`), `gcsService.js`, `apiClient.js`, `catalogStorage.js` y `scripts/lib/harness-utils.mjs` | Alta (fronteras de almacenamiento GCS/local bien acotadas) | Ninguna | 2026-11-18 |
| **Lógica (`Service`)** | A | `services/*.js` (caché RAM, precios autoritativos, anti-SSRF/traversal, visión/RAG) + `searchEngine.js` + `harness-utils.mjs` (`sin process.exit`) | Alta (cubierta por suites unitarias y adversariales dedicadas) | Ninguna | 2026-11-18 |
| **Ejecución (`Runtime`)** | A | `server.js`, `entrypoint.sh` (`set -e`), `init.sh` (`set -euo pipefail`), `harness-hooks.mjs <= 280L` y compuerta `pre-push` | Alta (arranque contenedorizado reproducible y cierre *graceful*) | Ninguna | 2026-11-18 |
| **Salida / Interfaz (`UI`)** | B | `src/pages/` y `src/components/` con `<ConfirmDialog>` accesible, WCAG 2.1 AA y validación Chrome DevTools | Alta (componentes modulares por pestaña admin y galería pública) | Mantenida en carpetas *Brownfield* `src/pages/` y `src/components/` para cero disrupción en producción | 2026-11-18 |

---

## 3. Instantáneas de Benchmark y Registro de Simplificación (Estudios de Ablación)

Las instantáneas de benchmark y los estudios de ablación operan como un único ciclo empírico: se toma una instantánea de línea base (`3.1`), se pone a prueba o simplifica un componente en aislamiento y se registra la evidencia y la decisión (`Mantener` o `Eliminar`) en la tabla de ablación (`3.2`), manteniendo sincronizada esta **Sección 3** con el protocolo de `docs/GOTCHAS.md`.

### 3.1 Instantáneas de Benchmark (`Benchmark Snapshots`)

| Fecha | Variante del Harness | Tasa de Completitud | Reintentos | Defectos Antes de Revisión | Notas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-11-18 | `deco-vintage-master-harness-v1` (Adaptación integral sobre `deco-vintage-web`) | `100%` en Puertas 1-3 (`25/25` arnés + `65/65` tests + `vite build`) | `0` | `0` | Fusión sin fricción del Arnés Maestro con las suites Zero-Trust de Deko Labs, protección LF en `.gitattributes`, multi-workspace `resolveTargetRoot` y preservación de memoria no derivable |

### 3.2 Registro de Simplificación del Arnés (Estudios de Ablación)

> **Propósito**: Cada componente del arnés codifica un supuesto sobre lo que el modelo aún no garantiza por sí solo. Para verificar periódicamente si una restricción sigue aportando valor: (1) toma una instantánea de este documento (`3.1`), (2) desactiva temporalmente un único componente en un entorno aislado, (3) ejecuta el benchmark, (4) toma otra instantánea y (5) compara y registra aquí la decisión (`docs/GOTCHAS.md`).

| Fecha | Componente / Regla Puesta a Prueba | Comando / Experimento de Ablación Ejecutado | Resultado Empírico al Quitarlo / Violarlo | Decisión Final |
| :--- | :--- | :--- | :--- | :--- |
| 2026-10-28 | Vigilante de enlaces muertos en `AGENTS.md` (`scripts/check-architecture.sh`) | Prueba de referencia en `Required Artifacts` hacia ruta inexistente | Bloquea en Puerta 1 con Bolígrafo Rojo si se enlaza un archivo aún no creado (`degraded` sin el candado) | **Mantener** |
| 2026-10-28 | Detector de archivos huérfanos en `memory/topics/` (`Gotcha #15`) | Prueba de archivo en `memory/topics/` no registrado en `memory/INDEX.md` | Bloquea en Puerta 1 con `Exit code 1` evitando pérdida de memoria en dos pasos (`degraded` sin el candado) | **Mantener** |
| 2026-10-28 | Compuerta `Pass-State Gating` en `feature_list.json` (`scripts/lib/harness-utils.mjs`) | Prueba de tarea en `done` sin `evidence` o sin `required_files` físicos | Reduce el puntaje por debajo de `100/100` y rechaza el cierre falso en Puerta 2 (`degraded` sin el candado) | **Mantener** |
| 2026-10-30 | Bloqueo de dependencias `blocked` en el DAG (`scripts/lib/harness-utils.mjs`) | Prueba aislada marcando una dependencia como `blocked` e iniciando la tarea hija | Impide saltar dependencias bloqueadas reduciendo `scope` bajo `5/5` (`degraded` sin el candado) | **Mantener** |
| 2026-11-18 | Prioridad `REPO_ROOT` en `resolveTargetRoot` para sesiones multi-workspace (`scripts/harness-hooks.mjs`) | Inspección de `workspacePaths` con múltiples carpetas abiertas en Antigravity (`Trabajos Graficos` + `Web Deco Vintage Proyect`) | Evita que el hook `Stop`/`PostToolUse` apunte a otro workspace vecino si ambos instalan el arnés | **Mantener** |
