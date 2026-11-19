# Session Handoff

## Current Objective
- **Goal:** Ejecutar y certificar `feat-003` (Migración aditiva de `CustomOrder` y contrato S2S con `Modulo_Ventas`: Push Webhook asíncrono + Pull `/integration/inbox` + Callback `/integration/:orderNumber/status`).
- **Current status:** `clean-state` (`WIP = 0`; `feat-001`, `feat-002` y `feat-003` en `done`; `feat-004` en `not-started`; `Overall: 100/100`)
- **Branch / commit:** `main` (sobre `3b4dcf8` + `feat-003` completada)

## Completed This Session
- [x] Extensión aditiva de `model CustomOrder` en `prisma/schema.prisma` (`orderSource`, `customerName`, `customerAddress`, `customerDepartment`, `externalSaleNumber`, `importedAt` e índice `@@index([orderSource])`) y migración SQL idempotente `prisma/migrations/20261118203500_add_web_order_integration_fields/migration.sql` con `npx prisma generate`.
- [x] Actualización de `validators/adminSchemas.js` añadiendo `'IMPORTADO'` a `CUSTOM_ORDER_STATUSES` y exportando `INTEGRATION_ORDER_STATUSES` + `integrationOrderStatusPatchSchema`.
- [x] Implementación de `getIntegrationSecret` y `requireIntegrationSecret` en `middleware/auth.js` con comparación en tiempo constante (`safeCompare`), `503` fail-closed sin secreto configurado y `401` ante secreto inválido/ausente.
- [x] Implementación en `services/customOrderService.js` y `routes/customOrderRoutes.js` de `toAbsolutePublicUrl`, `mapCanonicalMaterial`, `buildWebOrderPayload`, Push no bloqueante `notifySalesModuleNewOrder` (`AbortController` `5000ms`), `GET /api/custom-orders/integration/inbox` y `PATCH /api/custom-orders/integration/:orderNumber/status` declarados antes de `/:id`.
- [x] Documentación de `PUBLIC_WEB_URL`, `WEB_ORDERS_WEBHOOK_SECRET`, `CATALOG_WEBHOOK_SECRET` y `VENTAS_API_URL` en `.env.example` y certificación con `tests/web-orders-s2s-integration.test.js` (`9/9` pruebas nuevas; `79/79` pruebas automatizadas totales en verde).

## Verification Evidence

| Check | Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| Cliente Prisma | `npx prisma generate` | `PASS` | `@prisma/client` v6.9.0 regenerado con campos S2S de `CustomOrder` |
| Suite S2S Bandeja Web | `node --test tests/web-orders-s2s-integration.test.js` | `PASS (9/9)` | DDL idempotente, `503`/`401`/`200`, URLs absolutas HTTPS, Push no bloqueante, Pull inbox y Callback `IMPORTADO` |
| Compuerta Unificada Deko Labs | `npm run harness:check` | `PASS (HARNESS_PASS)` | `Overall: 100/100`, 0 secretos, 59 archivos JS limpios, `79/79` tests PASS y `vite build` limpio |
| Inicialización Integral en 3 Puertas | `bash ./init.sh` | `PASS (Exit code 0)` | Confirmado `CLEAN STATE` en Puertas 1, 2 y 3 con `Pass-State Gating` activo sobre `feat-003` |

## Files Changed
- `prisma/schema.prisma`
- `prisma/migrations/20261118203500_add_web_order_integration_fields/migration.sql`
- `validators/adminSchemas.js`
- `middleware/auth.js`
- `services/customOrderService.js`
- `routes/customOrderRoutes.js`
- `.env.example`
- `tests/web-orders-s2s-integration.test.js`
- `package.json`
- `ARCHITECTURE.md`
- `feature_list.json`
- `sprint-contract.md`
- `progress.md`
- `session-handoff.md`

## Decisions Made
- **Respeto direccional `Service -> Runtime`**: `services/customOrderService.js` no importa `middleware/auth.js`, manteniendo intacta la separación de las 6 capas.
- **Normalización de URLs absolutas en `buildWebOrderPayload`**: Asegura URLs `https://decovintage.online/...` o GCS para `Modulo_Ventas` tanto en órdenes nuevas como históricas sin romper CSP `'self'` en `www.decovintage.online` o `localhost`.

## Blockers / Risks
- Ninguno activo. Para `feat-004`, preservar `registeredOrderNumber`, `data.orderNumber` y `onClearCart()` en `CartDrawer.jsx`, cero `window.confirm` nativos y accesibilidad WCAG.

## Next Session Startup
1. Confirmar `pwd`.
2. Leer `AGENTS.md`, `progress.md`, `session-handoff.md`, `memory/INDEX.md` y `feature_list.json`.
3. Leer `docs/product-specs/web-orders-and-custom-pricing-s2s.md` (§4) y `sprint-contract.md`.
4. Ejecutar `bash ./init.sh` antes de modificar código.

## Recommended Next Step
- Activar **`feat-004`** (`status: "in-progress"`, `WIP = 1`) e implementar la captura estructurada de cliente en `CartDrawer.jsx` (`WEB_CART`), `CustomPostersPage.jsx` (`WEB_CUSTOM`), `ProductModal.jsx` (`WEB_QUICK_POSTER`) y el estado `'IMPORTADO'` + `externalSaleNumber` en `AdminCustomOrdersTab.jsx`.
