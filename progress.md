# Session Progress Log

## Current State

**Last Updated:** 2026-11-18 21:16
**Session ID:** sesion-005 (Auditoría forense pre-despliegue, cierre de `feat-005` y despliegue a producción)
**Active Feature:** Ninguna (`WIP = 0`; `feat-001`, `feat-002`, `feat-003`, `feat-004` y `feat-005` en `done`)
**Standard Startup Path:** `bash ./init.sh`
**Standard Verification Path:** `bash ./init.sh`

## Status

### What's Done
- [x] `feat-001`: Adaptación e integración completa de `Plantilla-Maestra-Arnes` en `deco-vintage-web` (`Overall: 100/100`, commit `3dccb63`).
- [x] `feat-002`: Unificación matemática de Medidas Especiales (`+Q25.00` corte especial MDF en `sizeMode === 'custom'`, `+Q15.00` PVC, `50%` `vinyl_only`, decimales `step="0.01"` y `parseDecimalCm`) mediante `utils/customPricing.js` compartido en `utils/` raíz (`70/70 tests PASS`, commit `3b4dcf8`).
- [x] `feat-003`: Extensión aditiva retrocompatible de `model CustomOrder` + migración SQL idempotente (`20261118203500_add_web_order_integration_fields`), `requireIntegrationSecret` con `safeCompare` (`503`/`401`/`200`), `toAbsolutePublicUrl` + `buildWebOrderPayload`, Push asíncrono `notifySalesModuleNewOrder` (`AbortController` `5000ms`), `GET /api/custom-orders/integration/inbox` y `PATCH /api/custom-orders/integration/:orderNumber/status` (`79/79 tests PASS`, commit `9aa7118`).
- [x] `feat-004`: Captura estructurada de cliente en los 3 flujos de venta web (`CartDrawer.jsx` -> `WEB_CART`, `CustomPostersPage.jsx` -> `WEB_CUSTOM`, `ProductModal.jsx` + `App.jsx` -> `WEB_QUICK_POSTER`) con validación accesible WCAG 2.1 AA, ítems enriquecidos (`isCustom`, `posterId`, `legacyId`, `sku: 'WEB-...'`, `selectedStandardSize` completo y URLs absolutas), soporte de estado `'IMPORTADO'` + `externalSaleNumber` + panel de cliente en `AdminCustomOrdersTab.jsx` y suite `tests/frontend-contracts.test.js` ampliada a `8/8` pruebas (`84/84 tests PASS`, commit `115112b`).
- [x] `feat-005`: Auditoría forense pre-despliegue y pulido quirúrgico en `services/customOrderService.js` y `tests/web-orders-s2s-integration.test.js` (alineación de `sizeId: 'CUSTOM'` al contrato exacto de `Modulo_Ventas` y aislamiento de `unindexedFiles` para que un archivo indexado `image_1` jamás sea asignado al ítem `0` cuando el ítem `0` no adjunta foto; `85/85 tests PASS`).

### What's In Progress
- Ninguna tarea en curso (`WIP = 0`).

### What's Next
1. El bloque completo de integración S2S de pedidos web y cotizador canónico (`feat-002`..`feat-004`) está 100% certificado y listo para despliegue coordinado con las variables `WEB_ORDERS_WEBHOOK_SECRET`, `VENTAS_API_URL` y `PUBLIC_WEB_URL` en Dokploy.
2. Tras desplegar en `https://decovintage.online`, ejecutar verificación post-despliegue con Chrome DevTools MCP según `memory/topics/deco-vintage-context.md`.

## Blockers / Risks
- Ninguno activo.

## Decisions Made
- **Validación accesible en línea (`role="alert"`, `aria-invalid` y ruteo de foco) en lugar de `window.alert` bloqueante**:
  - Context: `CartDrawer.jsx` y `CustomPostersPage.jsx` usaban `alert()` nativos cuando faltaba teléfono o configuración, interrumpiendo lectores de pantalla y experiencia móvil.
  - Alternatives considered: Mantener `alert()` o deshabilitar el botón de envío sin indicar qué campo falta; descartado según las guías `forms` y `accessibility` de `modern-web-guidance` (*"DON'T disable submit buttons to block validation; let users submit and highlight errors"* y ruteo de foco al primer campo inválido con `aria-invalid="true"` + `aria-describedby` + `role="alert"`).
- **Indexación explícita `image_${idx}` en `FormData` de `CustomPostersPage.jsx`**:
  - Context: Cuando el usuario cotiza varios pósters personalizados y solo adjunta foto en el segundo (`idx = 1`), enviar todo bajo una lista plana `'images'` desplazaría el archivo hacia `files[0]`.
  - Alternatives considered: Seguir usando `formData.append('images', p.imageFile)` para todos los índices; descartado porque `services/customOrderService.js` soporta `image_0`..`image_4` por índice exacto, garantizando asociación 1:1 entre archivo y póster.
- **Fallback anti-bloqueador de popups tras `await fetch(...)` en los 3 canales WhatsApp**:
  - Context: En Safari iOS y navegadores móviles, `window.open(waUrl, '_blank')` invocado después de una promesa `fetch` puede retornar `null`.
  - Alternatives considered: Abrir WhatsApp antes de obtener `#CP-XXXX`; descartado porque se perdería el código oficial en el mensaje. Verificar `if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') window.location.href = waUrl;` conserva `#CP-XXXX` y garantiza apertura en iOS/Android.

## Files Modified This Session
- `src/components/CartDrawer.jsx` - `orderSource: 'WEB_CART'`, metadatos estructurados de cliente, ítems con `sku: 'WEB-...'` y `selectedStandardSize` completo, validación accesible WCAG 2.1 AA y los 22 departamentos de Guatemala
- `src/pages/CustomPostersPage.jsx` - Sección **Datos de Contacto y Entrega** (`Nombre *`, `Teléfono / WhatsApp *`, `Dirección`, `Departamento`), envío `orderSource = 'WEB_CUSTOM'` e `image_${idx}` en `FormData` e inyección de cliente + `#CP-XXXX` en WhatsApp
- `src/components/ProductModal.jsx` - Mini-formulario compacto desplegable (`aria-expanded` / `aria-controls`) para `orderSource: 'WEB_QUICK_POSTER'` con `AbortController` (`4000ms`) y fallback seguro a WhatsApp
- `src/App.jsx` - Soporte de `item.message`, `item.orderNumber` y fallback anti-popup en `handleQuickWhatsApp`
- `src/components/admin/AdminCustomOrdersTab.jsx` - Filtro, badge y opción `<select>` para `'IMPORTADO'`, visualización de `order.externalSaleNumber`, canal `orderSource` y panel de datos estructurados del cliente
- `tests/frontend-contracts.test.js` - Ampliación de `3` a `8` pruebas cubriendo los 3 canales web, accesibilidad, panel Admin y simulación E2E contra `createCustomOrder` + `buildWebOrderPayload`
- `ARCHITECTURE.md`, `docs/product-specs/web-orders-and-custom-pricing-s2s.md`, `sprint-contract.md`, `feature_list.json`, `progress.md` y `session-handoff.md` - Sincronización integral del arnés

## Verification Evidence
- [x] Frontend contracts & S2S E2E simulation: `node --test tests/frontend-contracts.test.js` -> `8/8 tests PASS (0 fail)`
- [x] Production Vite build: `npm run build` -> `vite build PASS (dist/ built in 2.21s)`
- [x] Unified Deko Labs gate: `npm run harness:check` -> `HARNESS_PASS (Overall: 100/100, secrets PASS, syntax 59 files PASS, models PASS, security 3/3 PASS, unit tests 82/82 PASS, vite build PASS)`
- [x] Full 3-Gate verification: `bash ./init.sh` -> `Exit code 0 (CLEAN STATE - Puerta 1 check-architecture OK, Puerta 2 Overall: 100/100 25/25 PASS, Puerta 3 check + 85/85 tests + vite build PASS)`

## Notes for Next Session
Iniciar siempre con `bash ./init.sh`. Todas las tareas `feat-001`..`feat-004` se encuentran en `done` (`WIP = 0`). Para nuevos requerimientos, registrar primero la nueva entrada en `feature_list.json` y actualizar `sprint-contract.md` antes de codificar.
