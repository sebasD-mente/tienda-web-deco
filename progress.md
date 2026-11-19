# Session Progress Log

## Current State

**Last Updated:** 2026-11-18 20:44
**Session ID:** sesion-003 (Ejecución y certificación de `feat-003` — Migración aditiva de `CustomOrder` y Contrato S2S con `Modulo_Ventas`)
**Active Feature:** Ninguna (`WIP = 0`; `feat-001`, `feat-002` y `feat-003` en `done`; `feat-004` en `not-started`)
**Standard Startup Path:** `bash ./init.sh`
**Standard Verification Path:** `bash ./init.sh`

## Status

### What's Done
- [x] `feat-001`: Adaptación e integración completa de `Plantilla-Maestra-Arnes` en `deco-vintage-web` (`Overall: 100/100`, commit `3dccb63`).
- [x] `feat-002`: Unificación matemática de Medidas Especiales (`+Q25.00` corte especial MDF en `sizeMode === 'custom'`, `+Q15.00` PVC, `50%` `vinyl_only`, decimales `step="0.01"` y `parseDecimalCm`) mediante `utils/customPricing.js` compartido en `utils/` raíz (`70/70 tests PASS`, commit `3b4dcf8`).
- [x] `feat-003`: Extensión aditiva retrocompatible de `model CustomOrder` (`orderSource`, `customerName`, `customerAddress`, `customerDepartment`, `externalSaleNumber`, `importedAt`) + migración SQL idempotente (`20261118203500_add_web_order_integration_fields`), `requireIntegrationSecret` con `safeCompare` (`503`/`401`/`200`), `toAbsolutePublicUrl` + `buildWebOrderPayload`, Push asíncrono no bloqueante `notifySalesModuleNewOrder` (`AbortController` `5000ms`), `GET /api/custom-orders/integration/inbox`, `PATCH /api/custom-orders/integration/:orderNumber/status` y suite `tests/web-orders-s2s-integration.test.js` (`79/79 tests PASS`).

### What's In Progress
- Ninguna tarea en curso (`WIP = 0`).

### What's Next
1. Activar **`feat-004`** (`status: "in-progress"`, `WIP = 1`) previa actualización de `sprint-contract.md`: implementar captura estructurada de cliente en los 3 flujos web (`CartDrawer.jsx` -> `WEB_CART`, `CustomPostersPage.jsx` -> `WEB_CUSTOM`, `ProductModal.jsx` -> `WEB_QUICK_POSTER`) y soporte de estado `'IMPORTADO'` + `externalSaleNumber` en `AdminCustomOrdersTab.jsx`, ampliando `tests/frontend-contracts.test.js`.

## Blockers / Risks
- Ninguno activo.
- **Salvaguardas vigentes para `feat-004`**:
  1. Preservar `registeredOrderNumber`, `data.orderNumber` y `onClearCart()` en `CartDrawer.jsx`.
  2. Mantener fallback seguro hacia WhatsApp en `ProductModal.jsx` si falla o hace timeout la red al registrar `WEB_QUICK_POSTER`.
  3. Cero `window.confirm` nativos, cero lectura/edición de `.env` y cumplimiento WCAG 2.1 AA.

## Decisions Made
- **Separación estricta de capas (`Service` vs `Runtime`) en la lectura del secreto S2S**:
  - Context: `services/customOrderService.js` pertenece a la Capa 4 (`Service`) mientras `middleware/auth.js` pertenece a la Capa 5 (`Runtime`).
  - Alternatives considered: Importar `getIntegrationSecret` desde `middleware/auth.js` hacia `services/customOrderService.js`; descartado porque violaría la Regla Dura #1 de `ARCHITECTURE.md` (`No Backward Dependencies`: `Service` nunca puede importar de `Runtime`). En su lugar, `notifySalesModuleNewOrder` lee `WEB_ORDERS_WEBHOOK_SECRET || CATALOG_WEBHOOK_SECRET` directamente desde el entorno/opciones sin acoplar `middleware/`.
- **Normalización de URLs absolutas en `buildWebOrderPayload` preservando rutas relativas locales en BD interna**:
  - Context: La política CSP en `server.js` define `imgSrc: ["'self'", "data:", "blob:", "https://storage.googleapis.com", ...]`. Si se sobreescribieran rutas locales `/posters/...` en la base de datos interna con `https://decovintage.online/posters/...`, las visitas al panel Admin desde `https://www.decovintage.online` o `http://localhost:3000` chocarían con `'self'`.
  - Alternatives considered: Sobreescribir `item.imageUrl` relativo en BD al guardar; descartado. Normalizar `imageUrl` y `thumbUrl` mediante `toAbsolutePublicUrl` al construir `WebOrderPayload` garantiza URLs HTTPS 100% absolutas para `Modulo_Ventas` (tanto en Push como en Pull `/integration/inbox` e incluso para órdenes históricas) sin romper `'self'` en subdominios locales o `www`.
- **Costuras de capacidad (`__setCustomOrderDbForTests` y `__setWebhookFetchForTests`) en `services/customOrderService.js`**:
  - Context: Las pruebas CI/locales corren sin depender de una instancia PostgreSQL viva ni tráfico saliente hacia `ventas.decovintage.online`.
  - Alternatives considered: Mockear prototipos globales de `@prisma/client` o `globalThis.fetch`; descartado por fragilidad entre suites. Inyectar costuras limpias en `customOrderService.js` permite certificar todo el router Express real sobre sockets HTTP loopback con 0 efectos colaterales.

## Files Modified This Session
- `prisma/schema.prisma` - Columnas aditivas e índice `@@index([orderSource])` en `model CustomOrder`
- `prisma/migrations/20261118203500_add_web_order_integration_fields/migration.sql` - DDL idempotente (`ADD COLUMN IF NOT EXISTS` y `CREATE INDEX IF NOT EXISTS`)
- `validators/adminSchemas.js` - Estado `'IMPORTADO'` en `CUSTOM_ORDER_STATUSES` y nuevo `integrationOrderStatusPatchSchema`
- `middleware/auth.js` - `getIntegrationSecret` y `requireIntegrationSecret` con `safeCompare` constante (`503`/`401`)
- `services/customOrderService.js` - Persistencia de cliente/canal, `toAbsolutePublicUrl`, `buildWebOrderPayload`, `notifySalesModuleNewOrder` (`AbortController` `5000ms`), `getIntegrationInboxOrders` y `updateCustomOrderIntegrationStatus`
- `routes/customOrderRoutes.js` - Captura de metadatos de cliente en `POST /` y rutas S2S `/integration/inbox` y `/integration/:orderNumber/status` declaradas antes de `/:id`
- `.env.example` - Documentación de `PUBLIC_WEB_URL`, `WEB_ORDERS_WEBHOOK_SECRET`, `CATALOG_WEBHOOK_SECRET` y `VENTAS_API_URL`
- `tests/web-orders-s2s-integration.test.js` y `package.json` - Nueva suite S2S de 9 pruebas end-to-end (`76` unit + `3` security = `79` tests totales)
- `ARCHITECTURE.md`, `sprint-contract.md`, `feature_list.json`, `progress.md` y `session-handoff.md` - Sincronización de estado y evidencia del arnés

## Verification Evidence
- [x] Prisma Client generation: `npx prisma generate` -> `Generated Prisma Client (v6.9.0) in 63ms`
- [x] S2S integration suite: `node --test tests/web-orders-s2s-integration.test.js` -> `9/9 tests PASS (0 fail)`
- [x] Unified Deko Labs gate: `npm run harness:check` -> `HARNESS_PASS (Overall: 100/100, secrets PASS, syntax 59 files PASS, models PASS, security 3/3 PASS, unit tests 76/76 PASS, vite build PASS)`
- [x] Full 3-Gate verification: `bash ./init.sh` -> `Exit code 0 (CLEAN STATE - Puerta 1 check-architecture OK, Puerta 2 Overall: 100/100 25/25 PASS, Puerta 3 check + 79/79 tests + vite build PASS)`

## Notes for Next Session
Iniciar con `bash ./init.sh`, releer `docs/product-specs/web-orders-and-custom-pricing-s2s.md` §4, actualizar `sprint-contract.md` y pasar **`feat-004`** a `"in-progress"` (`WIP = 1`).
