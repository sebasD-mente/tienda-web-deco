# Especificación de Producto e Integración S2S: Cotizador Canónico de Medidas Especiales y Bandeja de Pedidos Web (`deco-vintage-web` <-> `Modulo_Ventas`)

- **ID de Especificación:** `SPEC-2026-11-18-WEB-ORDERS-S2S`
- **Estado:** Planificado y listo para ejecución secuencial (`feat-002` -> `feat-003` -> `feat-004`)
- **Repositorios involucrados:** `Web Deco Vintage Proyect` (`https://decovintage.online`) -> `Modulo_Ventas` (`https://ventas.decovintage.online`)
- **Regla de Oro de Frontera:** **PROHIBIDO conectar bases de datos cruzadas** o leer/modificar `.env` / `.env.local`. Toda comunicación entre sistemas ocurre exclusivamente vía HTTPS Server-to-Server (`x-webhook-secret` comparado con `safeCompare` en tiempo constante).

---

## 1. Alertas Forenses del Repositorio para la Sesión Ejecutora (Lecciones Críticas Pre-Auditadas)

Antes de escribir código, el Agente Ejecutor DEBE respetar estos **4 hallazgos específicos** verificados sobre el código real de `deco-vintage-web`:

1. **ALERTA CRÍTICA DOCKER (`utils/customPricing.js` en raíz, NUNCA solo en `src/utils/`)**:
   - En `Dockerfile` (etapa `production`, líneas 40–50), el contenedor de producción copia `/app/dist` y `/app/utils/`, pero **NO copia `/app/src/`**.
   - Si `services/customOrderService.js` o `services/jarvisService.js` importaran desde `../src/utils/customPricing.js`, `vite build` y los tests locales pasarían, pero **el contenedor de producción caería al arrancar con `ERR_MODULE_NOT_FOUND`**.
   - **Solución obligatoria**: Crear el módulo puro canónico en **`utils/customPricing.js`** (carpeta `utils/` de la raíz). Tanto `services/*.js` (`../utils/customPricing.js`) como el frontend Vite (`../../utils/customPricing.js` desde `src/pages/CustomPostersPage.jsx`) pueden importarlo directamente sin duplicar lógica.
2. **Tercer Motor Desfasado Detectado en `services/jarvisService.js` y `data/jarvisConfig.json`**:
   - Además de `CustomPostersPage.jsx`, `customOrderService.js` y `src/data/storeKnowledge.js`, el repositorio contiene:
     - `services/jarvisService.js` (`calculateCustomPrice` en líneas 150–170, invocada en líneas 856 y 1016): usa una fórmula antigua (`Math.ceil(rawPrice / 5) * 5` y `* 1.25` en PVC), carece de soporte `vinyl_only`, trunca decimales con `parseInt` en el regex `(\d{2,3})` de la línea 1009 y concatena `.00` fijo en líneas 647 y 1019–1020. Debe delegar en `calculateCanonicalPosterItemPrice` de `utils/customPricing.js`, aceptar decimales en el regex (ej. `(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:x|\*|por)\s*(\d{1,3}(?:[.,]\d{1,2})?)`) y formatear precios con `.toFixed(2)`.
     - `data/jarvisConfig.json` (líneas 57 y 176): semilla backend de `doc-personalizados` y `customPricingFormula`; debe actualizarse en paridad exacta con `src/data/storeKnowledge.js` (líneas 64 y 162).
3. **Actualización Autorizada de Regla de Negocio en `tests/backend-security-catalog.test.js` (líneas 91–110)**:
   - El test existente prueba `50 x 70 cm` (`3500 cm² * 0.048 = Q 168.00`) en `mdf` con cantidad `2` esperando `unitPrice: 168` y `totalPrice: 336` (fórmula antigua sin recargo de corte MDF).
   - Con la nueva regla oficial aprobada por el propietario (`+ Q 25.00` corte especial en MDF para `sizeMode === 'custom'`), `feat-002` **tiene autorización explícita** para actualizar ese test manteniendo el vector anti-manipulación (`unitPrice: 10` ignorado) hacia los nuevos valores exactos: **`unitPrice: 193`** (`168 + 25`) y **`totalPrice: 386`** (`193 * 2`).
4. **Migración Prisma 100% Idempotente para `entrypoint.sh` (`set -e`)**:
   - `entrypoint.sh` ejecuta `npx prisma migrate deploy` en modo *fail-fast* antes de levantar `server.js`.
   - La nueva migración SQL en `prisma/migrations/<timestamp>_add_web_order_integration_fields/migration.sql` debe usar exclusivamente `ALTER TABLE "custom_orders" ADD COLUMN IF NOT EXISTS ...` y `CREATE INDEX IF NOT EXISTS ...`, seguido de `npx prisma generate` local para actualizar `@prisma/client`.

---

## 2. Bloque A (`feat-002`) — Fórmula Canónica de Medidas Especiales y Decimales

### 2.1 Constantes y Función Pura Canónica (`utils/customPricing.js`)
- **Tasa por $\text{cm}^2$ (`cm2Rate`)**: `Number(storeSettings.customCm2Price) || 0.048`.
- **Recargo Corte Especial Madera MDF (`WOOD_CUSTOM_CUT_SURCHARGE`)**: **`25.00`** *(aplica **ÚNICAMENTE** cuando `sizeMode === 'custom'` y `baseMaterial === 'mdf'`; los tamaños estándar `OFFICIAL_SIZES` ya vienen precortados y NO llevan este recargo)*.
- **Recargo PVC 5 mm (`PVC_SURCHARGE`)**: **`15.00`** *(aplica tanto en `standard` como en `custom`)*.
- **Factor Solo Vinil Adhesivo (`VINYL_DISCOUNT_FACTOR`)**: **`0.50`** *(exactamente 50% de `basePrint` en `custom` o 50% de `standardSizePrice` en `standard`; sin recargo de corte)*.

```js
export const DEFAULT_CM2_RATE = 0.048;
export const WOOD_CUSTOM_CUT_SURCHARGE = 25.00;
export const PVC_SURCHARGE = 15.00;
export const VINYL_DISCOUNT_FACTOR = 0.50;

export function parseDecimalCm(raw) {
  if (raw === null || raw === undefined || raw === '') return 0;
  const normalized = String(raw).trim().replace(',', '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
}

export function calculateCanonicalPosterItemPrice({
  sizeMode = 'standard',
  standardSizePrice = 0,
  customWidth = 0,
  customHeight = 0,
  baseMaterial = 'mdf',
  quantity = 1,
  cm2Rate = DEFAULT_CM2_RATE,
  woodCustomCutSurcharge = WOOD_CUSTOM_CUT_SURCHARGE,
  pvcSurcharge = PVC_SURCHARGE,
  vinylFactor = VINYL_DISCOUNT_FACTOR,
}) {
  const qty = Math.max(1, Math.min(500, Math.floor(Number(quantity) || 1)));
  const mat = String(baseMaterial || 'mdf').toLowerCase();

  let customArea = 0;
  let basePrint = 0;
  let rawUnitPrice = 0;

  if (sizeMode === 'custom') {
    const w = parseDecimalCm(customWidth);
    const h = parseDecimalCm(customHeight);
    if (w <= 0 || h <= 0) {
      return { customArea: 0, basePrint: 0, unitPrice: 0, totalPrice: 0, quantity: qty };
    }
    customArea = Number((w * h).toFixed(2));
    basePrint = customArea * (Number(cm2Rate) > 0 ? Number(cm2Rate) : DEFAULT_CM2_RATE);

    if (mat === 'pvc') {
      rawUnitPrice = basePrint + pvcSurcharge;
    } else if (mat === 'vinyl_only') {
      rawUnitPrice = basePrint * vinylFactor;
    } else {
      rawUnitPrice = basePrint + woodCustomCutSurcharge;
    }
  } else {
    const stdBase = Number(standardSizePrice) || 0;
    if (stdBase <= 0) {
      return { customArea: 0, basePrint: 0, unitPrice: 0, totalPrice: 0, quantity: qty };
    }
    basePrint = stdBase;
    if (mat === 'pvc') {
      rawUnitPrice = stdBase + pvcSurcharge;
    } else if (mat === 'vinyl_only') {
      rawUnitPrice = stdBase * vinylFactor;
    } else {
      rawUnitPrice = stdBase;
    }
  }

  const unitPrice = Number(rawUnitPrice.toFixed(2));
  const totalPrice = Number((unitPrice * qty).toFixed(2));

  return {
    customArea,
    basePrint: Number(basePrint.toFixed(2)),
    unitPrice,
    totalPrice,
    quantity: qty,
  };
}
```

### 2.2 Vectores Dorados Obligatorios (`tests/custom-pricing-parity.test.js`)
Con `cm2Rate = 0.048`:

| Ancho (`cm`) | Alto (`cm`) | Material | Cantidad | Área (`cm²`) | Impresión Base (`Q`) | Precio Unitario (`Q`) | Total Ítem (`Q`) |
| :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `42.2` | `30` | `mdf` | `1` | `1266` | `60.77` | **`85.77`** | **`85.77`** |
| `42.2` | `30` | `mdf` | `2` | `1266` | `60.77` | **`85.77`** | **`171.54`** |
| `42.2` | `30` | `pvc` | `1` | `1266` | `60.77` | **`75.77`** | **`75.77`** |
| `42.2` | `30` | `vinyl_only` | `1` | `1266` | `60.77` | **`30.38`** | **`30.38`** |
| `42.2` | `58.5` | `mdf` | `1` | `2468.7` | `118.50` | **`143.50`** | **`143.50`** |
| `48.5` | `68.25` | `mdf` | `3` | `3310.13` | `158.89` | **`183.89`** | **`551.67`** |
| `40` | `50` | `mdf` | `1` | `2000` | `96.00` | **`121.00`** | **`121.00`** |

### 2.3 Ajustes de UI y Conocimiento en `feat-002`
- **`src/pages/CustomPostersPage.jsx`**:
  - `getPosterPrice(poster)` consume `calculateCanonicalPosterItemPrice` y `parseDecimalCm`.
  - Inputs de `customWidth` y `customHeight`: `min="5"`, `max="300"`, `step="0.01"`, `inputMode="decimal"`, `placeholder="Ej. 42.2"` y `"Ej. 68.5"`.
  - Banner de desglose de Medida Especial: mostrar desglose transparente según material (`Base impresión Q XX.XX + Q 25.00 corte especial MDF`, `Base Q XX.XX + Q 15.00 PVC` o `50% solo vinil`).
- **`services/customOrderService.js`**:
  - `calculateAuthoritativeOrderTotals` usa `parseDecimalCm` (acotando dimensiones en `[1, 500]` o `[5, 500]` sin truncar decimales) y `calculateCanonicalPosterItemPrice`.
- **`services/jarvisService.js`**, **`src/data/storeKnowledge.js`** y **`data/jarvisConfig.json`**:
  - Unificar `calculateCustomPrice` y textos de `doc-personalizados` / `customPricingFormula` explicando `(Ancho × Alto × Q 0.048) + Q 25.00 de corte especial en MDF 5.5mm; + Q 15.00 en PVC 5mm; o 50% de la base en solo vinil adhesivo`.

---

## 3. Bloque B (`feat-003`) — Esquema Aditivo `CustomOrder` y Capa S2S con `Modulo_Ventas`

### 3.1 Evolución Aditiva en `prisma/schema.prisma` y Migración SQL
Extender `model CustomOrder` manteniendo compatibilidad total con registros existentes:
- `orderSource String @default("WEB_CUSTOM")` (`"WEB_CART" | "WEB_CUSTOM" | "WEB_QUICK_POSTER"`)
- `customerName String?`
- `customerAddress String? @db.Text`
- `customerDepartment String?`
- `externalSaleNumber String?`
- `importedAt DateTime?`
- Índices: `@@index([status])`, `@@index([orderSource])`, `@@index([createdAt])`.
- En `validators/adminSchemas.js`: incluir `'IMPORTADO'` en `CUSTOM_ORDER_STATUSES` y crear esquema Zod `integrationOrderStatusPatchSchema` para `PATCH /api/custom-orders/integration/:orderNumber/status` (`status` en `['IMPORTADO', 'EN_PRODUCCION', 'COMPLETADO', 'CANCELADO', 'PENDIENTE']` + `externalSaleNumber` opcional).

### 3.2 Variables de Entorno (Documentar en `.env.example` únicamente)
- `WEB_ORDERS_WEBHOOK_SECRET` (prioridad; fallback a `CATALOG_WEBHOOK_SECRET`).
- `VENTAS_API_URL` (prioridad; fallback a `SALES_WEBHOOK_BASE_URL` o `'https://ventas.decovintage.online'`).
- `PUBLIC_WEB_URL` (default `'https://decovintage.online'`).

### 3.3 Normalización de URLs Absolutas y `WebOrderPayload`
- Toda `imageUrl` y `thumbUrl` emitida en `WebOrderPayload` debe ser absoluta (`https://...`): si comienza con `http://` o `https://` se respeta; si es ruta relativa (`/posters/...`), se prefija con `PUBLIC_WEB_URL` sin barras duplicadas.
- Mapeo canónico de `material`: `'mdf' -> 'MDF_5_5MM'`, `'pvc' -> 'PVC_5MM'`, `'vinyl_only' -> 'VINILO_SOLO'`.
- Estructura exacta de `WebOrderPayload`:
  `{ externalOrderId, orderNumber, orderSource, status, customer: { fullName, phone, address, department, notes }, totalUnits, quotedTotal, createdAt, items: [{ isCustom, posterId, legacyId, sku, title, sizeMode, sizeId, sizeLabel, customWidth, customHeight, customArea, material, baseMaterial, quantity, unitPrice, subtotal, imageUrl, thumbUrl, customNote }] }`.

### 3.4 Los 3 Puntos de Conexión S2S
1. **Webhook Push no bloqueante (`services/customOrderService.js`)**:
   - Tras `prisma.customOrder.create(...)`, disparar en segundo plano `notifySalesModuleNewOrder(createdOrder)` hacia `POST ${VENTAS_API_URL}/api/webhooks/web-orders` con cabecera `x-webhook-secret`, body `{ event: "web_order.created", order: WebOrderPayload }`, `AbortController` de `5000ms` y `try/catch` que nunca interrumpa el `201 Created` del cliente web.
2. **Endpoint Pull S2S (`GET /api/custom-orders/integration/inbox`)**:
   - Declarado en `routes/customOrderRoutes.js` **antes** de `router.get('/:id', ...)`.
   - Protegido por `requireIntegrationSecret` (`x-webhook-secret` o `Authorization: Bearer <secret>` comparado con `safeCompare`; devuelve `503` si no hay secreto configurado en servidor y `401` si no coincide).
   - Soporta `?status=PENDIENTE&limit=100` (default `PENDIENTE`, tope `200`) y responde `{ success: true, data: [...], count }`.
3. **Endpoint Callback S2S (`PATCH /api/custom-orders/integration/:orderNumber/status`)**:
   - Declarado antes de `/:id`, protegido por `requireIntegrationSecret` y validado con Zod.
   - Busca por `orderNumber`; si no existe responde `404 { success: false, error: 'Orden no encontrada.' }`; actualiza `status`, `externalSaleNumber` (si viene) e `importedAt = new Date()` (al pasar a `IMPORTADO` o `EN_PRODUCCION`, preservando `importedAt` previo si ya existía).

---

## 4. Bloque C (`feat-004`) — Captura en los 3 Flujos de Venta Web y Estado `IMPORTADO` en Admin

1. **Carrito de Compras (`src/components/CartDrawer.jsx`)**:
   - Enviar en `POST /api/custom-orders`: `orderSource: 'WEB_CART'`, `customerName: customerName.trim() || 'Cliente Web'`, `customerPhone: customerPhone.trim()`, `customerAddress: customerAddress.trim() || null`, `customerDepartment: customerDept || 'Guatemala'`, e ítems enriquecidos con `isCustom: false`, `posterId: it.poster?.id`, `legacyId: it.poster?.legacyId || null`, `sku: 'WEB-' + (it.poster?.legacyId || it.poster?.id)`, `sizeMode: 'standard'`, `selectedStandardSize: { id: it.size?.id, name: it.size?.name, dimensions: it.size?.dimensions, price: Number(it.price) || 0 }` y URLs absolutas. Preservar intactos `registeredOrderNumber`, `data.orderNumber` y `onClearCart()`.
2. **Cotizador Personalizado (`src/pages/CustomPostersPage.jsx`)**:
   - Añadir sección de **Datos de Contacto y Entrega** antes del bloque final de resumen/botón WhatsApp: `Nombre Completo *` (mín. 2 caracteres), `Teléfono / WhatsApp *` (mín. 8 dígitos), `Dirección, Zona o Municipio` (opcional) y `Departamento` (default `'Guatemala'`).
   - Validar nombre y teléfono antes de enviar; incluir en `FormData`: `orderSource = 'WEB_CUSTOM'`, `customerName`, `customerPhone`, `customerAddress`, `customerDepartment`, ítems con `isCustom: true` y decimales exactos, e inyectar datos del cliente + `#CP-XXXX` en el mensaje de WhatsApp.
3. **Compra Rápida en Ficha de Póster (`src/components/ProductModal.jsx` + `src/App.jsx`)**:
   - Al pulsar `"WhatsApp"` en `ProductModal.jsx`, desplegar mini-formulario compacto dentro del mismo modal (`Tu Nombre *`, `Tu WhatsApp *`, `Dirección / Departamento` opcional y botón `"Confirmar y Abrir WhatsApp"`).
   - Registrar primero en `POST /api/custom-orders` con `orderSource: 'WEB_QUICK_POSTER'` (con timeout/fallback seguro a WhatsApp si falla la red) e incluir el código `#CP-XXXX`, cantidad y datos del cliente en el mensaje de WhatsApp.
4. **Panel Administrativo (`src/components/admin/AdminCustomOrdersTab.jsx`)**:
   - Soportar filtro, color/badge y opción de selector para el estado `'IMPORTADO'`, mostrando `order.externalSaleNumber` (ej. venta vinculada en `Modulo_Ventas`), canal (`orderSource`) y datos estructurados del cliente (`customerName`, `customerPhone`, `customerDepartment`, `customerAddress`).
