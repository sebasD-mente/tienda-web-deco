# Loop State Tracker (loop-state.md)

> **Propósito en el Arnés (`Loop Engineering — Memoria entre Rondas`)**: Memoria externa persistente entre rondas del loop autónomo en **Deco Vintage Guate (`deco-vintage-web`)**, monitor del **Disyuntor de 4 Candados (`4-Lock Circuit Breaker`)** y registro completo del **Trinquete (`Ratchet`)**.
> Al iniciar cada ronda y cada evaluación del Checker (`one-shot` con ventana virgen, `0` reutilizaciones por `send_message`) leyendo únicamente este archivo en lugar de acumular el historial conversacional de 15 rondas, el arnés elimina la **Explosión Cuadrática de Tokens ($O(N^2)$)** y el sesgo de co-autoría.

## Basic Info & Circuit Breaker Monitor
- **Loop Name:** `deco-vintage-maker-checker-loop`
- **Active Target:** `Idle (WIP = 0; feat-001 completada en estado limpio)`
- **Started At:** `Pendiente (Modo Diario Ágil activo por defecto)`
- **Current Round:** `0 / 15 (Max — Candado 1)`
- **Current Status:** `Idle` (`Idle` | `In Progress` | `Completed` | `BLOCKED - Circuit Breaker Tripped`)
- **Elapsed Time / Cap:** `0m / 90m Max (15m Max per Round / $5 USD / 250,000 tokens — Candado 2)`
- **Net Passing Checks (Ratchet):** `Baseline: 25/25 arnés + 65/65 app tests -> Current: 25/25 (100/100) + 65/65 PASS`
- **Consecutive Stagnant Rounds:** `0 / 3 Max (Candado 3)`
- **Oscillating Tests Detected (`PASS -> FAIL -> PASS -> FAIL`):** `None (Candado 4)`

---

## Round Log

### Round 0 (Baseline Inicializada en `deco-vintage-web`)
- **Maker Approach:** Adaptación integral de la Plantilla Maestra del Arnés sobre `Web Deco Vintage Proyect` preservando el 100% de la arquitectura de producción (Express 5 + Prisma 6 + Sharp + React 18 + Vite 5 + Docker) y fusionando las compuertas Zero-Trust de Deko Labs en las 3 Puertas.
- **Basic Check (`bash ./init.sh`):** `Pass (Exit code 0 — 3 Puertas + 65/65 tests + vite build en verde)`
- **Independent Checker Verdict:** `Baseline ready`
- **Net Passing Checks Count:** `25 / 25 arnés (Overall: 100/100) + 65 / 65 tests de aplicación`
- **Issues Found by Checker:** `None`
- **Human intervention needed:** `No`
- **Git Action (Ratchet):** `Baseline initialized (feat-001)`
- **Next Round Adjustment:** `Listo para iniciar Round 1 cuando se active Modo Crítico / Loop (/goal).`

---

## Cumulative Stats

| Metric | Value |
| :--- | :--- |
| **Rounds completed** | `0` (`Round 0` baseline lista) |
| **Passed rounds** | `0` |
| **Failed rounds** | `0` |
| **Total issues found** | `0` |
| **Human interventions** | `0` |
| **Files changed** | `32` (instalación y adaptación inicial del arnés en `feat-001`) |

---

## Experiment History (`results.tsv` — Registro Completo del Ratchet, estilo `autoresearch`)

> **Invariante del Registro Completo (`Karpathy autoresearch`)**: Mientras `git log` conserva únicamente los commits que superaron todas las puertas y avanzaron el *Ratchet*, esta tabla registra **cada experimento sin excepción** —tanto mejoras conservadas como intentos fallidos marcados con `(reverted)`— bajo el mismo presupuesto fijo de verificación, garantizando que ninguna sesión futura repita un experimento descartado.
>
> **Convención Determinista de `commit_hash` (`Anti-Paradoja SHA-1`)**: La columna `commit_hash` usa **exclusivamente** uno de estos 4 formatos:
> 1. `<sha7>` (ej. `df3a546`): SHA-1 corto real de `git log`, sellado para todas las rondas previas ya confirmadas al abrir o cerrar la siguiente ronda.
> 2. `HEAD->commit(feat-00X)`: Marcador transitorio determinista registrado durante el cierre previo al `git commit` de la tarea activa `feat-00X` cuando el *Ratchet* avanza (`ratchet_status = kept`).
> 3. `(reverted)`: Experimento descartado cuyo árbol se restauró al último commit verde con `git restore --worktree --staged .` (o `git checkout -- .`) y `ratchet_status = reverted`.
> 4. `(revised-in-place)`: Pasada intermedia con veredicto `REVISAR` (`ratchet_status = revised`) corregida dentro de la tarea activa antes de lanzar una nueva instancia `Checker` `one-shot`.

```tsv
timestamp	commit_hash	harness_score	checks_passed	ratchet_status	description
2026-11-18T19:30	HEAD->commit(feat-001)	100/100	25/25+65/65	kept	baseline: adaptar e integrar Plantilla-Maestra-Arnes en deco-vintage-web (WIP=0)
```

---

## Blocker List & Tripped Circuit Breakers
- `Ninguno activo (0 candados disparados).`

---

## Final Result

- **Final status:** `Idle` (`Completed` | `Failed` | `Manually stopped` | `In Progress` | `Idle`)
- **Finished at:** `N/A`
- **Summary:** `Arnés Maestro adaptado e integrado al 100% en Deco Vintage Guate, listo para operar en Modo Diario Ágil o bajo /goal.`

---

## Protocolo de Auditoría Semanal: Los 4 Costes Silenciosos de los Loops
1. **Deuda de Verificación**: ¿El loop está cerrando tareas con pruebas débiles? -> Endurecer las reglas mecánicas en `scripts/check-architecture.sh` y `tests/`.
2. **Deterioro de la Comprensión**: ¿El loop avanza más rápido de lo que el humano comprende? -> Revisar siempre los resúmenes de decisiones (`Context` + `Alternatives considered`) en `progress.md`.
3. **Rendición Cognitiva**: ¿Se está aceptando todo sin juicio crítico? -> Mantener los Archivos de Dirección (`goal.md`, `AGENTS.md`, `feature_list.json`) bajo control humano exclusivo.
4. **Explosión Cuadrática de Tokens ($O(N^2)$)**: ¿Se están acumulando múltiples rondas en la misma sesión? -> Ejecutar cada ronda y cada evaluación Checker en ventanas frescas leyendo únicamente `loop-state.md`.
