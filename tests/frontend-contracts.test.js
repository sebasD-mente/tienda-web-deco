import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createCustomOrder,
  buildWebOrderPayload,
  __setCustomOrderDbForTests,
  __setWebhookFetchForTests,
} from '../services/customOrderService.js';
import { orderStatusPatchSchema } from '../validators/adminSchemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../');

describe('💻 Suite de Integridad de Contratos React y Flujo de Checkout (Harness² Web Lens)', () => {
  it('1. AdminSettingsTab.jsx no debe contener llamadas al setter huérfano inexistente setServerStatus', () => {
    const content = fs.readFileSync(
      path.join(projectRoot, 'src', 'components', 'admin', 'AdminSettingsTab.jsx'),
      'utf-8'
    );
    assert.equal(
      content.includes('setServerStatus'),
      false,
      'AdminSettingsTab.jsx no debe invocar setServerStatus sin declaración de useState'
    );
  });

  it('2. resetCatalogToDefault en catalogStorage.js no debe sobrescribir _cachedPosters con BASE_POSTERS vacío', () => {
    const content = fs.readFileSync(
      path.join(projectRoot, 'src', 'utils', 'catalogStorage.js'),
      'utf-8'
    );
    const resetFnMatch = content.match(/export async function resetCatalogToDefault\(\)\s*\{[\s\S]*?\}/);
    assert.ok(resetFnMatch, 'Debe existir resetCatalogToDefault en catalogStorage.js');
    assert.equal(
      resetFnMatch[0].includes('_cachedPosters    = [...BASE_POSTERS]') ||
      resetFnMatch[0].includes('_cachedPosters = [...BASE_POSTERS]'),
      false,
      'resetCatalogToDefault NUNCA debe vaciar _cachedPosters asignándole BASE_POSTERS'
    );
  });

  it('3. CartDrawer.jsx debe capturar orderNumber (CP-XXXX) de /api/custom-orders, incluirlo en el mensaje de WhatsApp y limpiar el carrito', () => {
    const content = fs.readFileSync(
      path.join(projectRoot, 'src', 'components', 'CartDrawer.jsx'),
      'utf-8'
    );
    assert.ok(
      content.includes('registeredOrderNumber') && content.includes('data.orderNumber'),
      'CartDrawer.jsx debe capturar data.orderNumber al registrar el pedido en /api/custom-orders'
    );
    assert.ok(
      content.includes('onClearCart()'),
      'CartDrawer.jsx debe invocar onClearCart() tras completar el checkout por WhatsApp'
    );
  });

  it('4. CartDrawer.jsx (WEB_CART) envía cliente estructurado, ítems enriquecidos con SKU WEB-*, etiquetas accesibles y cero window.confirm/alert', () => {
    const content = fs.readFileSync(
      path.join(projectRoot, 'src', 'components', 'CartDrawer.jsx'),
      'utf-8'
    );

    assert.ok(content.includes("orderSource: 'WEB_CART'"), "CartDrawer.jsx debe enviar orderSource: 'WEB_CART'");
    assert.ok(content.includes('customerName:'), 'CartDrawer.jsx debe enviar customerName estructurado');
    assert.ok(content.includes('customerPhone:'), 'CartDrawer.jsx debe enviar customerPhone estructurado');
    assert.ok(content.includes('customerAddress:'), 'CartDrawer.jsx debe enviar customerAddress estructurado');
    assert.ok(content.includes('customerDepartment:'), 'CartDrawer.jsx debe enviar customerDepartment estructurado');

    assert.ok(content.includes('isCustom: false'), 'Ítems del carrito deben marcar isCustom: false');
    assert.ok(content.includes('posterId:'), 'Ítems del carrito deben incluir posterId');
    assert.ok(content.includes('legacyId:'), 'Ítems del carrito deben incluir legacyId');
    assert.ok(content.includes("'WEB-'"), 'Ítems del carrito deben construir sku con prefijo WEB-');
    assert.ok(content.includes("sizeMode: 'standard'"), "Ítems del carrito deben declarar sizeMode: 'standard'");
    assert.ok(content.includes('id: it.size?.id'), 'selectedStandardSize debe incluir id del tamaño oficial');

    // Accesibilidad WCAG 2.1 AA y prohibición de diálogos nativos bloqueantes
    assert.ok(content.includes('htmlFor='), 'CartDrawer.jsx debe vincular etiquetas <label htmlFor>');
    assert.ok(content.includes('autoComplete="tel"'), 'CartDrawer.jsx debe declarar autoComplete="tel"');
    assert.ok(content.includes('role="alert"'), 'CartDrawer.jsx debe anunciar errores accesibles con role="alert"');
    assert.equal(content.includes('window.confirm'), false, 'CartDrawer.jsx no debe usar window.confirm');
    assert.equal(/\balert\s*\(/.test(content), false, 'CartDrawer.jsx no debe usar alert() bloqueante');
  });

  it('5. CustomPostersPage.jsx (WEB_CUSTOM) captura Datos de Contacto obligatorios, adjunta FormData S2S e inyecta cliente + #CP-XXXX en WhatsApp', () => {
    const content = fs.readFileSync(
      path.join(projectRoot, 'src', 'pages', 'CustomPostersPage.jsx'),
      'utf-8'
    );

    assert.ok(content.includes('Datos de Contacto y Entrega'), 'CustomPostersPage.jsx debe mostrar la sección Datos de Contacto y Entrega');
    assert.ok(content.includes("formData.append('orderSource', 'WEB_CUSTOM')"), "CustomPostersPage.jsx debe enviar orderSource = 'WEB_CUSTOM' en FormData");
    assert.ok(content.includes("formData.append('customerName'"), 'CustomPostersPage.jsx debe adjuntar customerName en FormData');
    assert.ok(content.includes("formData.append('customerPhone'"), 'CustomPostersPage.jsx debe adjuntar customerPhone en FormData');
    assert.ok(content.includes("formData.append('customerAddress'"), 'CustomPostersPage.jsx debe adjuntar customerAddress en FormData');
    assert.ok(content.includes("formData.append('customerDepartment'"), 'CustomPostersPage.jsx debe adjuntar customerDepartment en FormData');
    assert.ok(content.includes('isCustom: true'), 'CustomPostersPage.jsx debe marcar isCustom: true en itemsPayload');

    // Validación previa (mín. 2 caracteres nombre y mín. 8 dígitos teléfono) + inyección WhatsApp
    assert.ok(content.includes('< 2') && content.includes('< 8'), 'CustomPostersPage.jsx debe validar nombre (>=2) y teléfono (>=8 dígitos)');
    assert.ok(content.includes('Código de Orden:') && content.includes('registeredOrderNumber'), 'CustomPostersPage.jsx debe inyectar #CP-XXXX en el mensaje de WhatsApp');
    assert.ok(content.includes('htmlFor=') && content.includes('role="alert"'), 'CustomPostersPage.jsx debe usar <label htmlFor> y role="alert"');
    assert.equal(content.includes('window.confirm'), false, 'CustomPostersPage.jsx no debe usar window.confirm');
    assert.equal(/\balert\s*\(/.test(content), false, 'CustomPostersPage.jsx no debe usar alert() bloqueante');
  });

  it('6. ProductModal.jsx + App.jsx (WEB_QUICK_POSTER) despliegan mini-formulario rápido en modal con fallback seguro a WhatsApp', () => {
    const modalContent = fs.readFileSync(
      path.join(projectRoot, 'src', 'components', 'ProductModal.jsx'),
      'utf-8'
    );
    const appContent = fs.readFileSync(
      path.join(projectRoot, 'src', 'App.jsx'),
      'utf-8'
    );

    assert.ok(modalContent.includes("orderSource: 'WEB_QUICK_POSTER'"), "ProductModal.jsx debe registrar orderSource: 'WEB_QUICK_POSTER'");
    assert.ok(modalContent.includes('Confirmar y Abrir WhatsApp'), 'ProductModal.jsx debe incluir el botón Confirmar y Abrir WhatsApp dentro del modal');
    assert.ok(modalContent.includes("fetch('/api/custom-orders'"), 'ProductModal.jsx debe registrar la orden en POST /api/custom-orders antes de abrir WhatsApp');
    assert.ok(modalContent.includes('AbortController'), 'ProductModal.jsx debe proteger el registro con AbortController para no bloquear al usuario');
    assert.ok(modalContent.includes("'WEB-'"), 'ProductModal.jsx debe enviar SKU con prefijo WEB-');
    assert.ok(modalContent.includes('registeredOrderNumber') && modalContent.includes('data.orderNumber'), 'ProductModal.jsx debe capturar #CP-XXXX e inyectarlo en WhatsApp');
    assert.ok(modalContent.includes('aria-expanded=') && modalContent.includes('aria-controls='), 'ProductModal.jsx debe exponer aria-expanded y aria-controls en el disparador del mini-formulario');
    assert.equal(modalContent.includes('window.confirm'), false, 'ProductModal.jsx no debe usar window.confirm');
    assert.equal(/\balert\s*\(/.test(modalContent), false, 'ProductModal.jsx no debe usar alert() bloqueante');

    assert.ok(appContent.includes('item?.message') && appContent.includes('item?.orderNumber'), 'App.jsx handleQuickWhatsApp debe soportar el mensaje enriquecido y código #CP-XXXX');
  });

  it('7. AdminCustomOrdersTab.jsx soporta estado IMPORTADO, externalSaleNumber, canal orderSource, datos del cliente y cero window.confirm', () => {
    const adminContent = fs.readFileSync(
      path.join(projectRoot, 'src', 'components', 'admin', 'AdminCustomOrdersTab.jsx'),
      'utf-8'
    );

    assert.ok(adminContent.includes("id: 'IMPORTADO'"), 'AdminCustomOrdersTab.jsx debe incluir filtro de estado IMPORTADO');
    assert.ok(adminContent.includes("case 'IMPORTADO':"), 'AdminCustomOrdersTab.jsx debe definir estilo visual para el estado IMPORTADO');
    assert.ok(adminContent.includes('value="IMPORTADO"'), 'AdminCustomOrdersTab.jsx debe incluir opción IMPORTADO en el selector de estado');
    assert.ok(adminContent.includes('order.externalSaleNumber'), 'AdminCustomOrdersTab.jsx debe mostrar order.externalSaleNumber vinculado con Modulo_Ventas');
    assert.ok(adminContent.includes('order.orderSource') && adminContent.includes('WEB_CART') && adminContent.includes('WEB_QUICK_POSTER'), 'AdminCustomOrdersTab.jsx debe distinguir el canal orderSource');
    assert.ok(
      adminContent.includes('order.customerName') &&
      adminContent.includes('order.customerPhone') &&
      adminContent.includes('order.customerDepartment') &&
      adminContent.includes('order.customerAddress'),
      'AdminCustomOrdersTab.jsx debe renderizar los datos estructurados del cliente'
    );
    assert.ok(adminContent.includes('ConfirmDialog'), 'AdminCustomOrdersTab.jsx debe usar ConfirmDialog accesible');
    assert.equal(adminContent.includes('window.confirm'), false, 'AdminCustomOrdersTab.jsx tiene prohibido usar window.confirm nativo');

    // Verifica que el esquema Zod administrativo también acepta el cambio manual a IMPORTADO desde el <select>
    const parsedAdminPatch = orderStatusPatchSchema.safeParse({ status: 'IMPORTADO' });
    assert.equal(parsedAdminPatch.success, true, 'orderStatusPatchSchema debe aceptar el estado IMPORTADO enviado por AdminCustomOrdersTab');
  });

  it('8. Simulación E2E de los 3 contratos de canal (WEB_CART, WEB_CUSTOM, WEB_QUICK_POSTER) contra createCustomOrder + buildWebOrderPayload', async () => {
    const createdRecords = [];
    const emittedWebhooks = [];
    const prevSecret = process.env.WEB_ORDERS_WEBHOOK_SECRET;
    process.env.WEB_ORDERS_WEBHOOK_SECRET = 'test-frontend-contract-s2s-secret';

    __setCustomOrderDbForTests({
      storeSettings: {
        async findUnique() {
          return { id: 'default', customCm2Price: 0.048 };
        },
      },
      customOrder: {
        async create({ data }) {
          const rec = {
            id: `ord-${createdRecords.length + 1}`,
            ...data,
            externalSaleNumber: null,
            importedAt: null,
            createdAt: new Date('2026-11-18T21:00:00.000Z'),
            updatedAt: new Date('2026-11-18T21:00:00.000Z'),
          };
          createdRecords.push(rec);
          return rec;
        },
      },
    });

    __setWebhookFetchForTests(async (_url, init) => {
      emittedWebhooks.push(JSON.parse(init.body));
      return { ok: true, status: 200 };
    });

    try {
      // Canal 1: WEB_CART (como lo construye CartDrawer.jsx)
      const cartOrder = await createCustomOrder({
        orderSource: 'WEB_CART',
        customerName: 'María Fernanda López',
        customerPhone: '5544 3322',
        customerAddress: 'Zona 10, Ciudad de Guatemala',
        customerDepartment: 'Guatemala',
        customerNotes: 'Cliente: María Fernanda López | Entrega: Zona 10, Ciudad de Guatemala (Guatemala)',
        items: [
          {
            isCustom: false,
            posterId: 'uuid-spiderman',
            legacyId: 'spiderman-miles',
            sku: 'WEB-spiderman-miles',
            title: 'Spider-Man Miles Morales',
            sizeMode: 'standard',
            selectedStandardSize: { id: 'GRANDE', name: 'Grande', dimensions: '40 x 60 cm', price: 125 },
            baseMaterial: 'mdf',
            quantity: 2,
            unitPrice: 125,
            imageUrl: 'https://decovintage.online/posters/uploads/full/spiderman.webp',
            thumbUrl: 'https://decovintage.online/posters/uploads/thumb/spiderman.webp',
          },
        ],
      });

      // Canal 2: WEB_CUSTOM (como lo construye CustomPostersPage.jsx con decimales)
      const customOrder = await createCustomOrder({
        orderSource: 'WEB_CUSTOM',
        customerName: 'Carlos Hernández',
        customerPhone: '4433-2211',
        customerAddress: 'Antigua Guatemala',
        customerDepartment: 'Sacatepéquez',
        customerNotes: 'Cliente: Carlos Hernández | Entrega: Antigua Guatemala (Sacatepéquez)',
        items: [
          {
            isCustom: true,
            title: 'Póster Personalizado (familia.jpg)',
            sizeMode: 'custom',
            customWidth: 42.2,
            customHeight: 30,
            customArea: 1266,
            baseMaterial: 'mdf',
            quantity: 1,
            unitPrice: 85.77,
            totalPrice: 85.77,
            customNote: 'Vertical con margen limpio',
            imageUrl: '/posters/uploads/custom/familia.webp',
            thumbUrl: '/posters/uploads/custom/familia.webp',
          },
        ],
      });

      // Canal 3: WEB_QUICK_POSTER (como lo construye ProductModal.jsx)
      const quickOrder = await createCustomOrder({
        orderSource: 'WEB_QUICK_POSTER',
        customerName: 'Andrea Morales',
        customerPhone: '33221100',
        customerAddress: null,
        customerDepartment: 'Quetzaltenango',
        customerNotes: 'Compra rápida web | Cliente: Andrea Morales | Entrega: Por coordinar (Quetzaltenango)',
        items: [
          {
            isCustom: false,
            posterId: 'uuid-porsche',
            legacyId: 'porsche-911-gt3',
            sku: 'WEB-porsche-911-gt3',
            title: 'Porsche 911 GT3 RS',
            sizeMode: 'standard',
            selectedStandardSize: { id: 'MEDIANO', name: 'Mediano', dimensions: '30 x 45 cm', price: 65 },
            baseMaterial: 'mdf',
            quantity: 1,
            unitPrice: 65,
            imageUrl: 'https://decovintage.online/posters/uploads/full/porsche.webp',
            thumbUrl: 'https://decovintage.online/posters/uploads/thumb/porsche.webp',
          },
        ],
      });

      // Esperar microtask del Push S2S no bloqueante
      await new Promise((r) => setTimeout(r, 20));

      assert.equal(emittedWebhooks.length, 3, 'Los 3 flujos web deben disparar Push S2S hacia Modulo_Ventas');

      const cartPayload = buildWebOrderPayload(cartOrder);
      assert.equal(cartPayload.orderSource, 'WEB_CART');
      assert.equal(cartPayload.quotedTotal, 250);
      assert.equal(cartPayload.items[0].isCustom, false);
      assert.equal(cartPayload.items[0].sku, 'WEB-spiderman-miles');
      assert.equal(cartPayload.items[0].sizeId, 'GRANDE');
      assert.equal(cartPayload.items[0].material, 'MDF_5_5MM');

      const customPayload = buildWebOrderPayload(customOrder, { publicWebUrl: 'https://decovintage.online' });
      assert.equal(customPayload.orderSource, 'WEB_CUSTOM');
      assert.equal(customPayload.quotedTotal, 85.77);
      assert.equal(customPayload.customer.department, 'Sacatepéquez');
      assert.equal(customPayload.items[0].isCustom, true);
      assert.equal(customPayload.items[0].customWidth, 42.2);
      assert.equal(customPayload.items[0].imageUrl, 'https://decovintage.online/posters/uploads/custom/familia.webp');

      const quickPayload = buildWebOrderPayload(quickOrder);
      assert.equal(quickPayload.orderSource, 'WEB_QUICK_POSTER');
      assert.equal(quickPayload.quotedTotal, 65);
      assert.equal(quickPayload.customer.fullName, 'Andrea Morales');
      assert.equal(quickPayload.items[0].sku, 'WEB-porsche-911-gt3');
      assert.equal(quickPayload.items[0].sizeId, 'MEDIANO');
    } finally {
      __setCustomOrderDbForTests(null);
      __setWebhookFetchForTests(null);
      if (prevSecret === undefined) {
        delete process.env.WEB_ORDERS_WEBHOOK_SECRET;
      } else {
        process.env.WEB_ORDERS_WEBHOOK_SECRET = prevSecret;
      }
    }
  });
});
