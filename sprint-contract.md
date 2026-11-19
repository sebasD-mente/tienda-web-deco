# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)** en **Deco Vintage Guate (`deco-vintage-web`)**. Esta sesión planificadora deja pre-acordado el alcance, las alertas forenses y los criterios verificables para que la **Sesión Ejecutora** arranque directamente por `feat-002` bajo `WIP = 1`.

---

## Estado Actual del Contrato (`WIP = 0` — Planificado para Ejecución en Siguiente Sesión)
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0`).
- **Cola secuencial planificada (`not-started`):**
  1. **`feat-002`** (*Unificación matemática de Medidas Especiales: `+Q25` corte MDF, decimales `step="0.01"` y paridad J.A.R.V.I.S.*) -> **PRIMERA TAREA A ACTIVAR (`in-progress`) EN LA SESIÓN EJECUTORA**.
  2. **`feat-003`** (*Migración aditiva de `CustomOrder` y contrato S2S con `Modulo_Ventas`: Push Webhook + Pull Inbox + Status Callback*, depende de `feat-002`).
  3. **`feat-004`** (*Captura estructurada de cliente en los 3 flujos de venta web y estado `IMPORTADO` en panel Admin*, depende de `feat-003`).
- **Especificación técnica canónica obligatoria:** `docs/product-specs/web-orders-and-custom-pricing-s2s.md`.

## Alcance Incluido por Ronda Secuencial (`Fair game` — Ejecutar UNA tarea a la vez bajo `WIP = 1`)
- **Al activar `feat-002`**: `utils/customPricing.js` (**en `utils/` de la raíz**, copiado en `Dockerfile` `production`), `src/pages/CustomPostersPage.jsx`, `services/customOrderService.js`, `services/jarvisService.js`, `src/data/storeKnowledge.js`, `data/jarvisConfig.json`, `tests/backend-security-catalog.test.js` (actualizar vector `50x70 MDF` a `193` / `386`), `tests/custom-pricing-parity.test.js` y `package.json` (`test:unit`).
- **Al activar `feat-003`** (solo tras cerrar `feat-002` en `done`): `prisma/schema.prisma`, nueva migración SQL aditiva idempotente en `prisma/migrations/`, `validators/adminSchemas.js`, `middleware/auth.js`, `services/customOrderService.js`, `routes/customOrderRoutes.js` (rutas `/integration/*` declaradas **antes** de `/:id`), `.env.example`, `tests/web-orders-s2s-integration.test.js` y `package.json` (`test:unit`).
- **Al activar `feat-004`** (solo tras cerrar `feat-003` en `done`): `src/components/CartDrawer.jsx`, `src/pages/CustomPostersPage.jsx`, `src/components/ProductModal.jsx`, `src/App.jsx` (si se ajusta `onQuickWhatsApp`), `src/components/admin/AdminCustomOrdersTab.jsx` y `tests/frontend-contracts.test.js`.

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- **PROHIBIDO conectar bases de datos cruzadas** entre `deco-vintage-web` y `Modulo_Ventas`.
- **PROHIBIDO leer, editar o versionar `.env` o `.env.local`** (documentar variables nuevas únicamente en `.env.example` con placeholders seguros).
- **PROHIBIDO colocar `customPricing.js` únicamente dentro de `src/utils/`** (porque `Dockerfile` `production` no copia `src/` y rompería el arranque de `server.js` en producción).
- **PROHIBIDO usar sentencias SQL destructivas o no idempotentes** en `prisma/migrations/` (usar siempre `ADD COLUMN IF NOT EXISTS` y `CREATE INDEX IF NOT EXISTS` para proteger `entrypoint.sh` bajo `set -e`).
- **PROHIBIDO saltar el orden secuencial DAG** (`feat-002 -> feat-003 -> feat-004`) o poner más de 1 tarea en `in-progress` (`WIP = 1`).
- **PROHIBIDO autogenerar `posters.tags`**, usar `window.confirm` nativo o debilitar validadores del arnés (`init.sh`, `scripts/validate-harness.mjs`, `scripts/check-architecture.sh`, `scripts/harness-hooks.mjs`).

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. **En `feat-002`**: Los 7 Vectores Dorados de `docs/product-specs/web-orders-and-custom-pricing-s2s.md` pasan al centavo exacto en `tests/custom-pricing-parity.test.js` (paridad entre `utils/customPricing.js`, `calculateAuthoritativeOrderTotals` y `calculateCustomPrice` de J.A.R.V.I.S.).
2. **En `feat-003`**: `npx prisma generate` actualiza el cliente sin errores y `tests/web-orders-s2s-integration.test.js` certifica `HTTP 401`/`503` en `requireIntegrationSecret`, URLs absolutas de imágenes, esquema `WebOrderPayload`, `GET /api/custom-orders/integration/inbox` y `PATCH /api/custom-orders/integration/:orderNumber/status`.
3. **En `feat-004`**: Los 3 flujos (`WEB_CART`, `WEB_CUSTOM`, `WEB_QUICK_POSTER`) capturan cliente y código `#CP-XXXX`, `AdminCustomOrdersTab.jsx` soporta `IMPORTADO` + `externalSaleNumber`, y `tests/frontend-contracts.test.js` + `npm run build` pasan sin advertencias ni regresiones.
4. **Al cierre de cada tarea**: `bash ./init.sh`, `node scripts/validate-harness.mjs --min-score 100` y `npm run harness:check` devuelven código `0` con evidencia real documentada en `feature_list.json` y `progress.md`.
