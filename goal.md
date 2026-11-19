# Goal Loop Specification (goal.md)

> **Propósito en el Arnés (`Loop Engineering — Objetivo y Disyuntores`)**: Este documento pertenece a la categoría **Archivos de Dirección (Solo los edita el Humano / Sesión Planificadora)** en **Deco Vintage Guate (`deco-vintage-web`)** y define la línea de meta verificable por máquina, las fronteras de actuación (`Fair game` vs `Hands off`) y los **4 Candados del Disyuntor (`4-Lock Circuit Breaker`)** que impiden bucles infinitos o fallas oscilantes (`Bug A <-> Bug B`).

## Regla de Oro para Elegir el Tipo de Loop (`/goal` vs `/loop`)
- **¿Esta tarea tiene una línea de meta final?**
  - **SÍ tiene final** (completar la cadena secuencial `feat-002 -> feat-003 -> feat-004` en `feature_list.json` con todas las puertas en verde) -> Usa **Modo Diario Ágil** tarea por tarea o un **Loop Basado en Objetivo (`/goal`)** gobernado por este archivo.
  - **NO tiene final, es vigilancia continua** -> Usa un **Loop Basado en Tiempo (`/loop` o `/schedule`)**.

---

## Goal
Implementar y certificar secuencialmente en `deco-vintage-web` las tareas **`feat-002`**, **`feat-003`** y **`feat-004`** especificadas en `docs/product-specs/web-orders-and-custom-pricing-s2s.md` (unificación matemática de Medidas Especiales con `+Q 25.00` de corte MDF y decimales `step="0.01"`, migración aditiva de `CustomOrder`, contrato S2S `Push + Pull + Callback` con `Modulo_Ventas` y captura de cliente en los 3 puntos de venta web + estado `IMPORTADO` en Admin) cumpliendo estrictamente `WIP = 1` y orden DAG.

## Acceptance Criteria (Verificables por Máquina)
- [ ] `feat-002`, `feat-003` y `feat-004` alcanzan estado `"done"` en `feature_list.json` respetando orden secuencial estricto (`WIP = 1` en cada paso) y evidencia ejecutable real.
- [ ] `tests/custom-pricing-parity.test.js` valida al centavo los 7 Vectores Dorados compartidos con `Modulo_Ventas` y `utils/customPricing.js` reside en `utils/` de la raíz (seguro para `Dockerfile` `production`).
- [ ] `tests/web-orders-s2s-integration.test.js` valida autenticación constante `x-webhook-secret` (`401`/`503`), URLs absolutas HTTPS, `WebOrderPayload`, `GET /api/custom-orders/integration/inbox` y `PATCH /api/custom-orders/integration/:orderNumber/status`.
- [ ] `bash ./init.sh`, `bash scripts/check-architecture.sh`, `node scripts/validate-harness.mjs --min-score 100` y `npm run harness:check` terminan con código `0` (`Overall: 100/100` y `vite build` limpio).
- [ ] Cuando se ejecute en Modo Crítico / Loop (`/goal`), el agente Checker (instancia efímera `one-shot` con ventana virgen `zero-inheritance`, cero `send_message` de reutilización) otorga veredicto `✅ Pass` (`11-12 / 12` sin ceros) en `evaluator-rubric.md`.

## Scope (Límites de Actuación y División en 3 Categorías)

### 1. Archivos de Dirección (Solo los edita el Humano / Planificador — `Hands off` para el Ejecutor)
- `goal.md`, `AGENTS.md` (reglas núcleo), `docs/product-specs/web-orders-and-custom-pricing-s2s.md` y estructura DAG en `feature_list.json`.

### 2. Archivos de Trabajo (`Fair game` — Permitido modificar por el Agente Maker según la tarea activa)
- Archivos declarados en `required_files` de la tarea actualmente en `in-progress` (`feat-002`, `feat-003` o `feat-004`), más la migración aditiva en `prisma/migrations/` durante `feat-003` y `src/App.jsx` si se requiere en `feat-004`.
- Campos de estado y evidencia en `feature_list.json`, `sprint-contract.md`, `progress.md`, `session-handoff.md` y `loop-state.md`.

### 3. Archivos de Infraestructura Fija (`Hands off` — Prohibido debilitar o tocar durante la Ejecución)
- `init.sh`, `scripts/validate-harness.mjs`, `scripts/lib/harness-utils.mjs`, `scripts/check-architecture.sh`, `scripts/harness-hooks.mjs`, `evaluator-rubric.md` (exclusivo del Checker aislado), `goal.md`.
- `Dockerfile`, `entrypoint.sh`, migraciones históricas ya existentes en `prisma/migrations/` y rutas protegidas (`.git/**`, `.env`, `.env.local`, `google-service-account*.json`, `node_modules/**`).

## Verification Method (Orden Estricto en cada Ronda)
1. Ejecutar `bash ./init.sh` (incluye `bash scripts/check-architecture.sh`, `npm run check`, `npm test` y `npm run build`).
2. Ejecutar `node scripts/validate-harness.mjs --min-score 100` y `npm run harness:check`.
3. En Modo Crítico / Loop (`/goal`), entregar el resultado a una instancia completamente nueva del sub-agente **Checker independiente (`one-shot` + `zero-inheritance`)** para auditoría con `evaluator-rubric.md` y `checker-prompt.md` (`1 Checker = 1 sola auditoría / one-shot`; prohibido `send_message` a Checkers previos).
4. **Mecanismo de Trinquete (`Ratchet`)**:
   - **Si aprueba (`✅ Pass`)**: Actualizar `loop-state.md`, `progress.md`, `feature_list.json` y `session-handoff.md` y avanzar con un `git commit` atómico por tarea completada.
   - **Si rechaza (`❌ Fail` / `REVISAR`)**:
     - **Caso A (Rollback limpio)**: Restaurar con `git restore --worktree --staged .`, registrar `(reverted)` en `loop-state.md` e intentar un enfoque distinto.
     - **Caso B (Iteración correctiva acotada)**: Registrar `revised` en `loop-state.md`, corregir dentro del alcance, re-ejecutar las 3 puertas y lanzar un **nuevo** `invoke_subagent` `one-shot` virgen.

## Circuit Breakers (Disyuntor de 4 Candados — Condiciones Duras de Parada Automática)
> **Prohibición de `"Nunca te detengas"` sin Disyuntores**: Un loop sin candados que cae en una falla oscilante (`Bug A <-> Bug B`) provoca una explosión cuadrática de tokens ($O(N^2)$).

El loop debe detenerse **INMEDIATAMENTE** cuando ocurra cualquiera de las siguientes condiciones:
1. **Éxito Total**: Todos los criterios de aceptación están en `PASS` y el Checker independiente aprueba `✅ Pass`.
2. **Candado 1 — Tope Duro de Rondas (`Max Rounds`)**: Se alcanza el límite duro de `15 rondas` totales por ejecución.
3. **Candado 2 — Tope Duro de Presupuesto y Tiempo Reloj (`Budget & Wall-Clock Cap`)**: El tiempo acumulado supera `90 minutos` (máx. `15 min` por ronda) o el consumo acumulado supera `$5 USD` / `250,000 tokens`.
4. **Candado 3 — Disyuntor por Estancamiento (`Stagnation Breaker`)**: El mismo error o fallo se repite durante `3 rondas consecutivas`.
5. **Candado 4 — Disyuntor Anti-Oscilación y Regresión (`Oscillation Breaker A↔B`)**: El número neto de pruebas aprobadas no aumenta durante `3 rondas`, o cualquier prueba que ya estaba en `PASS` vuelve a caer en `FAIL` en dos rondas distintas.
   - *Acción obligatoria al saltar los Candados 1, 2, 3 o 4*: Revertir cambios no verificados al último commit limpio (`git restore --worktree --staged .`), registrar la causa exacta en `loop-state.md` bajo `Blocker List & Tripped Circuit Breakers` y detener el loop con estado `BLOCKED - Circuit Breaker Tripped`.
