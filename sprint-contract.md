# Sprint Contract (Contrato de Ejecución de Tarea)

Este documento materializa la **Observabilidad de Proceso (Antes de Codificar)** en **Deco Vintage Guate (`deco-vintage-web`)**. Registra el cierre verificado de **`feat-004`** completando la serie completa `SPEC-2026-11-18-WEB-ORDERS-S2S` (`feat-002` -> `feat-003` -> `feat-004`) en estado limpio (`WIP = 0`).

---

## Estado Actual del Contrato (`WIP = 0` — Serie `feat-001`..`feat-004` Completada)
- **Tareas certificadas (`done`):**
  - **`feat-001`** (*Adaptar e integrar la Plantilla Maestra del Arnés en Deco Vintage Guate*).
  - **`feat-002`** (*Unificación matemática de Medidas Especiales: `+Q25` corte MDF, decimales `step="0.01"` y paridad J.A.R.V.I.S.*).
  - **`feat-003`** (*Migración aditiva de `CustomOrder` y contrato S2S con `Modulo_Ventas`: Push Webhook + Pull Inbox + Status Callback*).
  - **`feat-004`** (*Captura estructurada de cliente en los 3 flujos de venta web y estado `IMPORTADO` en panel Admin*).
- **Tarea activa (`in-progress`):** Ninguna (`WIP = 0`).
- **Cola secuencial pendiente (`not-started`):** Ninguna pendiente.
- **Especificación técnica canónica certificada:** `docs/product-specs/web-orders-and-custom-pricing-s2s.md` (§1–§4).

## Alcance Certificado en `feat-004`
- **`src/components/CartDrawer.jsx` (`WEB_CART`)**: Envío de `orderSource: 'WEB_CART'`, `customerName`, `customerPhone`, `customerAddress`, `customerDepartment` e ítems enriquecidos (`isCustom: false`, `posterId`, `legacyId`, `sku: 'WEB-...'`, `sizeMode: 'standard'`, `selectedStandardSize` completo y URLs absolutas), etiquetas accesibles WCAG 2.1 AA (`<label htmlFor>`, `autoComplete`, `role="alert"`) y preservación de `registeredOrderNumber`, `data.orderNumber` y `onClearCart()`.
- **`src/pages/CustomPostersPage.jsx` (`WEB_CUSTOM`)**: Sección de **Datos de Contacto y Entrega** (`Nombre Completo *`, `Teléfono / WhatsApp *`, `Dirección, Zona o Municipio` opcional y `Departamento` con los 22 departamentos de Guatemala), validación accesible previa, adjunto en `FormData` (`orderSource = 'WEB_CUSTOM'`, `image_${idx}` indexado por póster e `isCustom: true`) e inyección de cliente + `#CP-XXXX` en WhatsApp.
- **`src/components/ProductModal.jsx` + `src/App.jsx` (`WEB_QUICK_POSTER`)**: Mini-formulario compacto desplegable dentro del modal (`aria-expanded` / `aria-controls`), registro previo en `POST /api/custom-orders` (`orderSource: 'WEB_QUICK_POSTER'`) con `AbortController` (`4000ms`) y fallback seguro hacia WhatsApp si falla la red.
- **`src/components/admin/AdminCustomOrdersTab.jsx` y `tests/frontend-contracts.test.js`**: Soporte completo para estado `'IMPORTADO'` (filtro, badge violeta de alto contraste y `<select>`), insignia `order.externalSaleNumber` (`Venta: VTA-...`), canal (`orderSource`), panel estructurado de cliente y suite `tests/frontend-contracts.test.js` ampliada a `8/8` pruebas en verde.

## Exclusiones Explícitas Respetadas
- **Cero conexión de bases de datos cruzadas** entre `deco-vintage-web` y `Modulo_Ventas`.
- **Cero lectura, edición o versionado de `.env` o `.env.local`**.
- **Cero `window.confirm` o `alert()` nativos bloqueantes** en los flujos intervenidos y cumplimiento WCAG 2.1 AA.
- **Cero autogeneración de `posters.tags`** y cero debilitamiento de validadores del arnés.

## Estándares de Verificación ("Hecho" certificado)
1. `node --test tests/frontend-contracts.test.js` -> `8/8 PASS`.
2. `npm run build` -> `vite build` limpio (`dist/` generado sin errores).
3. `npm run harness:check` y `bash ./init.sh` -> `Exit code 0` (`CLEAN STATE`, `Overall: 100/100`, `84/84` pruebas automatizadas en verde).
