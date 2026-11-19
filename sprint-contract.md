# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)** en **Deco Vintage Guate (`deco-vintage-web`)**. Registra el cierre verificado de **`feat-003`** y deja lista la activación de **`feat-004`** bajo `WIP = 1`.

---

## Estado Actual del Contrato (`WIP = 0` — `feat-003` Completada; `feat-004` Lista para Activar)
- **Tareas certificadas (`done`):**
  - **`feat-001`** (*Adaptar e integrar la Plantilla Maestra del Arnés en Deco Vintage Guate*).
  - **`feat-002`** (*Unificación matemática de Medidas Especiales: `+Q25` corte MDF, decimales `step="0.01"` y paridad J.A.R.V.I.S.*).
  - **`feat-003`** (*Migración aditiva de `CustomOrder` y contrato S2S con `Modulo_Ventas`: Push Webhook + Pull Inbox + Status Callback*).
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0`).
- **Cola secuencial pendiente (`not-started`):**
  1. **`feat-004`** (*Captura estructurada de cliente en los 3 flujos de venta web y estado `IMPORTADO` en panel Admin*, depende de `feat-003`) -> **SIGUIENTE TAREA A ACTIVAR (`in-progress`)**.
- **Especificación técnica canónica obligatoria:** `docs/product-specs/web-orders-and-custom-pricing-s2s.md` (§4).

## Alcance Incluido para la Siguiente Ronda (`feat-004` bajo `WIP = 1`)
- **`src/components/CartDrawer.jsx`**: Enviar `orderSource: 'WEB_CART'`, `customerName`, `customerPhone`, `customerAddress`, `customerDepartment` e ítems enriquecidos (`isCustom: false`, `posterId`, `legacyId`, `sku: 'WEB-...'`, `sizeMode: 'standard'`, `selectedStandardSize` completo y URLs absolutas), preservando `registeredOrderNumber`, `data.orderNumber` y `onClearCart()`.
- **`src/pages/CustomPostersPage.jsx`**: Incorporar sección obligatoria de **Datos de Contacto y Entrega** (`Nombre Completo *`, `Teléfono / WhatsApp *`, `Dirección, Zona o Municipio` opcional, `Departamento` default `'Guatemala'`), validación previa, envío `orderSource: 'WEB_CUSTOM'` en `FormData` e inyección de datos del cliente + `#CP-XXXX` en WhatsApp.
- **`src/components/ProductModal.jsx` (+ `src/App.jsx` si aplica)**: Desplegar mini-formulario rápido dentro del mismo modal al pulsar `"WhatsApp"`, registrando `POST /api/custom-orders` con `orderSource: 'WEB_QUICK_POSTER'` antes de abrir WhatsApp (con fallback seguro si falla la red).
- **`src/components/admin/AdminCustomOrdersTab.jsx` y `tests/frontend-contracts.test.js`**: Soportar badge/filtro/selector `'IMPORTADO'`, mostrar `externalSaleNumber`, `orderSource` y datos estructurados del cliente, y ampliar `tests/frontend-contracts.test.js`.

## Exclusiones Explícitas (Qué NO se va a tocar bajo ninguna circunstancia)
- **PROHIBIDO conectar bases de datos cruzadas** entre `deco-vintage-web` y `Modulo_Ventas`.
- **PROHIBIDO leer, editar o versionar `.env` o `.env.local`**.
- **PROHIBIDO usar `window.confirm` nativo** o degradar accesibilidad WCAG 2.1 AA.
- **PROHIBIDO autogenerar `posters.tags`** o debilitar validadores del arnés (`init.sh`, `scripts/validate-harness.mjs`, `scripts/check-architecture.sh`, `scripts/harness-hooks.mjs`).

## Estándares de Verificación ("Hecho" significa exactamente esto)
1. **En `feat-003` (Certificado)**: `npx prisma generate` y `tests/web-orders-s2s-integration.test.js` (`9/9 PASS`) certifican DDL idempotente, `requireIntegrationSecret` (`503`/`401`/`200`), URLs absolutas HTTPS, `WebOrderPayload`, Push no bloqueante, Pull `/integration/inbox` y Callback `IMPORTADO` preservando `importedAt`.
2. **En `feat-004` (Pendiente)**: Los 3 flujos (`WEB_CART`, `WEB_CUSTOM`, `WEB_QUICK_POSTER`) capturan cliente y código `#CP-XXXX`, `AdminCustomOrdersTab.jsx` soporta `IMPORTADO` + `externalSaleNumber`, y `tests/frontend-contracts.test.js` + `npm run build` + `bash ./init.sh` pasan sin advertencias ni regresiones.
