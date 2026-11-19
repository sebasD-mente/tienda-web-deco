# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)** en **Deco Vintage Guate (`deco-vintage-web`)**. El Planificador y el Ejecutor (*Maker*) acuerdan el alcance exacto y los criterios verificables de éxito antes de modificar el sistema, evitando desviaciones de alcance (*Scope Creep*) o regresiones en producción.

---

## Estado Actual del Contrato (`WIP = 0` — `feat-001` Completada y Lista para Siguiente Tarea)
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0`).
- **Última tarea cerrada (`done`):** `feat-001` (*Adaptación e integración integral de la Plantilla Maestra del Arnés en Deco Vintage Guate*).
- **Siguiente tarea secuencial:** Pendiente de acordar con el usuario en lenguaje natural (`WIP = 1`).

## Alcance Incluido (`Fair game`)
- En `feat-001` (completada): Incorporación y adaptación de los artefactos del Arnés Maestro (`AGENTS.md`, `ARCHITECTURE.md`, `init.sh`, `scripts/`, `docs/`, `memory/`, `.agents/`, `.gitignore`, `.gitattributes`, `.dockerignore` y scripts de verificación en `package.json` / `scripts/audit-harness.js`) preservando intactos todos los módulos productivos de `server.js`, `routes/`, `services/`, `prisma/` y `src/`.
- Para la próxima tarea activa: Listar aquí los archivos o módulos exactos antes de codificar.

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- Prohibido modificar módulos fuera del alcance de la tarea activa (`WIP = 1`).
- Prohibido alterar `Dockerfile`, `entrypoint.sh`, migraciones aplicadas en `prisma/migrations/` o flujos pausados (`Modulo_Ventas`) sin autorización explícita del usuario.
- Prohibido autogenerar con IA el campo `posters.tags` (uso exclusivo para apodos internos manuales de taller).
- Prohibido debilitar, comentar o relajar validaciones en `init.sh`, `scripts/validate-harness.mjs`, `scripts/lib/harness-utils.mjs`, `scripts/check-architecture.sh`, `scripts/harness-hooks.mjs`, `scripts/audit-*.js` o `tests/*.test.js`.
- Prohibido que el agente Constructor (*Maker*) rellene `evaluator-rubric.md` o reutilice vía `send_message` un sub-agente *Checker* previo (`1 Checker = 1 sola auditoría / one-shot`).

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. Todos los archivos declarados en `required_files` de la tarea activa existen físicamente en disco y no están vacíos (`0 CRLF` en scripts `.sh` y `.mjs` del arnés).
2. `bash ./init.sh`, `bash scripts/check-architecture.sh`, `node scripts/validate-harness.mjs --min-score 100` y `npm run harness:check` devuelven código `0`, `Overall: 100/100`, `65/65 tests PASS` y `vite build` limpio.
3. En **Modo Crítico / Loop (`/goal`)** o cierres de hito, una instancia *Checker* `one-shot` completamente nueva (`zero-inheritance`) audita la entrega en `evaluator-rubric.md` con puntuación `>= 11/12` (`ACEPTAR`).
