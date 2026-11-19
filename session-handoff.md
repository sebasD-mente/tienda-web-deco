# Session Handoff

## Current Objective
- **Goal:** Ejecutar y certificar `feat-002` (Unificación matemática de Medidas Especiales con `+Q25.00` corte MDF, decimales `step="0.01"` y paridad exacta `Q 0.00` entre Cotizador Web, Backend Autoritativo, J.A.R.V.I.S. y `Modulo_Ventas`).
- **Current status:** `clean-state` (`WIP = 0`; `feat-001` y `feat-002` en `done`; `feat-003` y `feat-004` en `not-started`; `Overall: 100/100`)
- **Branch / commit:** `main` (sobre `87162a2` + `feat-002` completada)

## Completed This Session
- [x] Creación de `utils/customPricing.js` en `utils/` de la raíz (compatible con `Dockerfile` `production` y Vite) exportando `DEFAULT_CM2_RATE`, `WOOD_CUSTOM_CUT_SURCHARGE` (`25.00`), `PVC_SURCHARGE` (`15.00`), `VINYL_DISCOUNT_FACTOR` (`0.50`), `parseDecimalCm` y `calculateCanonicalPosterItemPrice`.
- [x] Actualización de `src/pages/CustomPostersPage.jsx` con inputs decimales (`min="5"`, `max="300"`, `step="0.01"`, `inputMode="decimal"`, placeholders `Ej. 42.2` / `Ej. 68.5`), cálculo canónico y banner transparente de desglose por material.
- [x] Unificación de `services/customOrderService.js` (`calculateAuthoritativeOrderTotals`), `services/jarvisService.js` (`calculateCustomPrice`, soporte `vinyl_only`, regex decimal `[5..300]` y formato `.toFixed(2)`), `src/data/storeKnowledge.js` y `data/jarvisConfig.json`.
- [x] Actualización del vector `50x70 MDF` (`Q193.00` / `Q386.00`) en `tests/backend-security-catalog.test.js` y creación de `tests/custom-pricing-parity.test.js` verificando los 7 Vectores Dorados en los 3 motores (`70/70` pruebas automatizadas en verde).

## Verification Evidence

| Check | Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| Paridad de Precios y Seguridad | `node --test tests/custom-pricing-parity.test.js tests/backend-security-catalog.test.js` | `PASS (9/9)` | 7 Vectores Dorados exactos al centavo en `customPricing`, `customOrderService` y `jarvisService` |
| Compuerta Unificada Deko Labs | `npm run harness:check` | `PASS (HARNESS_PASS)` | `Overall: 100/100`, 0 secretos, 58 archivos JS limpios, `70/70` tests PASS y `vite build` limpio |
| Inicialización Integral en 3 Puertas | `bash ./init.sh` | `PASS (Exit code 0)` | Confirmado `CLEAN STATE` en Puertas 1, 2 y 3 con `Pass-State Gating` activo sobre `feat-002` |

## Files Changed
- `utils/customPricing.js`
- `src/pages/CustomPostersPage.jsx`
- `services/customOrderService.js`
- `services/jarvisService.js`
- `src/data/storeKnowledge.js`
- `data/jarvisConfig.json`
- `tests/backend-security-catalog.test.js`
- `tests/custom-pricing-parity.test.js`
- `package.json`
- `ARCHITECTURE.md`
- `feature_list.json`
- `sprint-contract.md`
- `progress.md`
- `session-handoff.md`

## Decisions Made
- **Módulo único `utils/customPricing.js` en raíz**: Garantiza cero duplicación de lógica y compatibilidad total con el stage `production` de `Dockerfile` (que copia `utils/` pero no `src/`).
- **Filtro numérico `[5, 300]` en `runFallbackEngine` de J.A.R.V.I.S.**: Permite cotizar cualquier medida con decimales desde `5 cm` hasta `300 cm` (punto o coma) evitando falsos positivos en frases como `"2x1"`.

## Blockers / Risks
- Ninguno activo. Para `feat-003`, respetar estrictamente DDL idempotente (`IF NOT EXISTS`), prohibición de tocar `.env` / `.env.local` y aislamiento total de bases de datos.

## Next Session Startup
1. Confirmar `pwd`.
2. Leer `AGENTS.md`, `progress.md`, `session-handoff.md`, `memory/INDEX.md` y `feature_list.json`.
3. Leer `docs/product-specs/web-orders-and-custom-pricing-s2s.md` (§3) y `sprint-contract.md`.
4. Ejecutar `bash ./init.sh` antes de modificar código.

## Recommended Next Step
- Activar **`feat-003`** (`status: "in-progress"`, `WIP = 1`) e implementar la migración aditiva de `CustomOrder` y los 3 puntos de conexión S2S con `Modulo_Ventas` (`Push` webhook asíncrono, `GET /api/custom-orders/integration/inbox` y `PATCH /api/custom-orders/integration/:orderNumber/status`).
