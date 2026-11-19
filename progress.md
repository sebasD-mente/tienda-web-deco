# Session Progress Log

## Current State

**Last Updated:** 2026-11-18 20:30
**Session ID:** sesion-002 (Ejecución y certificación de `feat-002` — Paridad Matemática Canónica de Medidas Especiales)
**Active Feature:** Ninguna (`WIP = 0`; `feat-001` y `feat-002` en `done`; `feat-003` y `feat-004` en `not-started`)
**Standard Startup Path:** `bash ./init.sh`
**Standard Verification Path:** `bash ./init.sh`

## Status

### What's Done
- [x] `feat-001`: Adaptación e integración completa de `Plantilla-Maestra-Arnes` en `deco-vintage-web` (`Overall: 100/100`, commit `3dccb63`).
- [x] `feat-002`: Unificación matemática de Medidas Especiales (`+Q25.00` corte especial MDF en `sizeMode === 'custom'`, `+Q15.00` PVC, `50%` `vinyl_only`, decimales `step="0.01"` y `parseDecimalCm`) mediante `utils/customPricing.js` compartido en `utils/` raíz (seguro para `Dockerfile` `production`), alineando `src/pages/CustomPostersPage.jsx`, `services/customOrderService.js`, `services/jarvisService.js`, `src/data/storeKnowledge.js` y `data/jarvisConfig.json`, y certificando los 7 Vectores Dorados en `tests/custom-pricing-parity.test.js` (`70/70 tests PASS`).

### What's In Progress
- Ninguna tarea en curso (`WIP = 0`).

### What's Next
1. Activar **`feat-003`** (`status: "in-progress"`, `WIP = 1`) previa actualización de `sprint-contract.md`: extender `model CustomOrder` en `prisma/schema.prisma` + migración SQL aditiva idempotente (`ADD COLUMN IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`), `requireIntegrationSecret` con `safeCompare`, `WebOrderPayload` con URLs absolutas, webhook Push no bloqueante (`AbortController` `5000ms`), `GET /api/custom-orders/integration/inbox` y `PATCH /api/custom-orders/integration/:orderNumber/status` declarados antes de `/:id`, y suite `tests/web-orders-s2s-integration.test.js`.
2. Tras certificar `feat-003` en `done`, continuar con **`feat-004`** (captura estructurada de cliente en `CartDrawer.jsx`, `CustomPostersPage.jsx`, `ProductModal.jsx` y estado `'IMPORTADO'` en `AdminCustomOrdersTab.jsx`).

## Blockers / Risks
- Ninguno activo.
- **Salvaguardas vigentes para `feat-003`**:
  1. **PROHIBIDO leer o editar `.env` / `.env.local`** ni conectar bases de datos cruzadas entre `deco-vintage-web` y `Modulo_Ventas`.
  2. **Migración Prisma idempotente para `entrypoint.sh` (`set -e`)**: Usar `ALTER TABLE "custom_orders" ADD COLUMN IF NOT EXISTS ...` y `CREATE INDEX IF NOT EXISTS ...`, seguido de `npx prisma generate`.
  3. **Orden de rutas Express en `routes/customOrderRoutes.js`**: Declarar `/integration/inbox` y `/integration/:orderNumber/status` estrictamente **antes** de `router.get('/:id', ...)`.

## Decisions Made
- **Ubicación canónica de `utils/customPricing.js` en `utils/` de la raíz**:
  - Context: El stage `production` de `Dockerfile` copia `/app/utils/` y `/app/dist/`, pero NO copia `/app/src/`. Colocar `utils/customPricing.js` en `utils/` permite que Vite lo empaquete en `dist/` para `CustomPostersPage.jsx` y que Node.js en contenedor de producción lo importe directamente desde `services/customOrderService.js` y `services/jarvisService.js`.
  - Alternatives considered: Duplicar el archivo en `src/utils/` y `utils/`; descartado porque introduce riesgo de deriva matemática entre frontend y backend.
- **Acotado seguro `[5, 300]` en el regex decimal de `runFallbackEngine` (`services/jarvisService.js`)**:
  - Context: Al ampliar el regex a `(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:x|\*|por)\s*(\d{1,3}(?:[.,]\d{1,2})?)` para aceptar medidas de 1 a 3 dígitos con punto o coma decimal, expresiones conversacionales como `"promoción 2x1"` coincidirían sintácticamente con el patrón.
  - Alternatives considered: Restringir el entero a `\d{2,3}`; descartado porque bloquearía medidas válidas de 5 a 9.99 cm (el cotizador permite `min="5"`). Validar `rawW >= 5 && rawH >= 5 && rawW <= 300 && rawH <= 300` preserva medidas desde `5 cm` y descarta `"2x1"`.

## Files Modified This Session
- `utils/customPricing.js` - Motor puro canónico (`parseDecimalCm`, `calculateCanonicalPosterItemPrice` y constantes oficiales)
- `src/pages/CustomPostersPage.jsx` - Integración de `calculateCanonicalPosterItemPrice`, inputs decimales (`step="0.01"`, `inputMode="decimal"`, `min="5"`, `max="300"`) y banner de desglose por material
- `services/customOrderService.js` - Delegación de `calculateAuthoritativeOrderTotals` al motor canónico con soporte decimal
- `services/jarvisService.js` - Delegación de `calculateCustomPrice`, soporte `vinyl_only`, regex decimal `[5..300]` y formato `.toFixed(2)`
- `src/data/storeKnowledge.js` y `data/jarvisConfig.json` - Paridad documental de `doc-personalizados` y `customPricingFormula` (`+Q25.00` corte MDF, `+Q15.00` PVC, `50%` solo vinil)
- `tests/backend-security-catalog.test.js` - Actualización autorizada del vector `50x70 MDF` (`unitPrice: 193`, `totalPrice: 386`) manteniendo prueba anti-manipulación
- `tests/custom-pricing-parity.test.js` y `package.json` - Nueva suite automatizada de los 7 Vectores Dorados en los 3 motores (`67` unit + `3` security = `70` tests)
- `ARCHITECTURE.md`, `sprint-contract.md`, `feature_list.json`, `progress.md` y `session-handoff.md` - Sincronización de estado y evidencia del arnés

## Verification Evidence
- [x] Pricing parity & backend security suites: `node --test tests/custom-pricing-parity.test.js tests/backend-security-catalog.test.js` -> `9/9 tests PASS (0 fail)`
- [x] Unified Deko Labs gate: `npm run harness:check` -> `HARNESS_PASS (Overall: 100/100, secrets PASS, syntax 58 files PASS, models PASS, security 3/3 PASS, unit tests 67/67 PASS, vite build PASS)`
- [x] Full 3-Gate verification: `bash ./init.sh` -> `Exit code 0 (CLEAN STATE - Puerta 1 check-architecture OK, Puerta 2 Overall: 100/100 25/25 PASS, Puerta 3 check + 70/70 tests + vite build PASS)`
- [x] Harness mathematical validation: `node scripts/validate-harness.mjs --min-score 100` -> `Overall: 100/100 (25/25 checks PASS)`

## Notes for Next Session
Iniciar con `bash ./init.sh`, releer `docs/product-specs/web-orders-and-custom-pricing-s2s.md` §3, actualizar `sprint-contract.md` y pasar **`feat-003`** a `"in-progress"` (`WIP = 1`).
