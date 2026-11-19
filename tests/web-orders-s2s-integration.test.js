/**
 * tests/web-orders-s2s-integration.test.js
 * Suite de certificación S2S para feat-003:
 *  - Migración aditiva idempotente de CustomOrder + esquema Prisma + .env.example
 *  - requireIntegrationSecret con safeCompare constante (503 / 401 / 200 + fallback CATALOG_WEBHOOK_SECRET)
 *  - Normalización de imageUrl / thumbUrl a URLs absolutas HTTPS y mapeo de materiales en WebOrderPayload
 *  - Push asíncrono no bloqueante notifySalesModuleNewOrder (AbortController 5000ms)
 *  - Pull S2S GET /api/custom-orders/integration/inbox (declarado antes de /:id, tope limit <= 200)
 *  - Callback S2S PATCH /api/custom-orders/integration/:orderNumber/status (400 Zod, 404, preservación de importedAt)
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { fileURLToPath } from 'node:url';

import customOrderRoutes from '../routes/customOrderRoutes.js';
import { generateAuthToken } from '../middleware/auth.js';
import {
  CUSTOM_ORDER_STATUSES,
  INTEGRATION_ORDER_STATUSES,
  integrationOrderStatusPatchSchema,
} from '../validators/adminSchemas.js';
import {
  toAbsolutePublicUrl,
  mapCanonicalMaterial,
  buildWebOrderPayload,
  notifySalesModuleNewOrder,
  __setCustomOrderDbForTests,
  __setWebhookFetchForTests,
} from '../services/customOrderService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../');

function createInMemoryOrderDb(initialOrders = []) {
  const store = new Map();
  let autoSeq = 1;

  for (const seed of initialOrders) {
    const id = seed.id || `ord-seed-${autoSeq++}`;
    store.set(id, { ...seed, id });
  }

  return {
    _store: store,
    storeSettings: {
      async findUnique() {
        return { id: 'default', customCm2Price: 0.048 };
      },
    },
    customOrder: {
      async create({ data }) {
        const now = new Date();
        const record = {
          id: `uuid-ord-${autoSeq++}`,
          orderNumber: data.orderNumber,
          orderSource: data.orderSource ?? 'WEB_CUSTOM',
          totalPrice: data.totalPrice,
          totalUnits: data.totalUnits ?? 1,
          items: data.items ?? [],
          status: data.status ?? 'PENDIENTE',
          customerName: data.customerName ?? null,
          customerPhone: data.customerPhone ?? null,
          customerAddress: data.customerAddress ?? null,
          customerDepartment: data.customerDepartment ?? null,
          customerNotes: data.customerNotes ?? null,
          externalSaleNumber: data.externalSaleNumber ?? null,
          importedAt: data.importedAt ?? null,
          createdAt: now,
          updatedAt: now,
        };
        store.set(record.id, record);
        return { ...record };
      },
      async findMany({ where = {}, orderBy, take } = {}) {
        let rows = Array.from(store.values());

        if (where.status) {
          if (typeof where.status === 'string') {
            rows = rows.filter((r) => r.status === where.status);
          } else if (Array.isArray(where.status.in)) {
            rows = rows.filter((r) => where.status.in.includes(r.status));
          }
        }

        if (orderBy?.createdAt === 'desc') {
          rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (orderBy?.createdAt === 'asc') {
          rows.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        }

        if (typeof take === 'number' && take > 0) {
          rows = rows.slice(0, take);
        }

        return rows.map((r) => ({ ...r }));
      },
      async findUnique({ where = {} } = {}) {
        if (where.id) {
          const hit = store.get(where.id);
          return hit ? { ...hit } : null;
        }
        if (where.orderNumber) {
          for (const row of store.values()) {
            if (row.orderNumber === where.orderNumber) {
              return { ...row };
            }
          }
        }
        return null;
      },
      async update({ where = {}, data = {} } = {}) {
        let target = null;
        if (where.id) {
          target = store.get(where.id) || null;
        } else if (where.orderNumber) {
          for (const row of store.values()) {
            if (row.orderNumber === where.orderNumber) {
              target = row;
              break;
            }
          }
        }
        if (!target) {
          throw new Error('Record to update not found.');
        }
        const updated = {
          ...target,
          ...data,
          updatedAt: new Date(),
        };
        store.set(target.id, updated);
        return { ...updated };
      },
      async delete({ where = {} } = {}) {
        const hit = store.get(where.id);
        if (!hit) return null;
        store.delete(where.id);
        return { ...hit };
      },
    },
  };
}

describe('🔗 Suite S2S: Bandeja de Pedidos Web y Sincronización con Modulo_Ventas (feat-003)', () => {
  const savedEnv = {};
  const ENV_KEYS = [
    'ADMIN_SECRET',
    'ADMIN_USER',
    'ADMIN_PASSWORD',
    'WEB_ORDERS_WEBHOOK_SECRET',
    'CATALOG_WEBHOOK_SECRET',
    'VENTAS_API_URL',
    'SALES_WEBHOOK_BASE_URL',
    'PUBLIC_WEB_URL',
  ];

  let server;
  let baseUrl;
  let adminToken;
  let mockDb;
  let capturedWebhooks = [];

  before(async () => {
    for (const k of ENV_KEYS) {
      savedEnv[k] = process.env[k];
    }

    process.env.ADMIN_SECRET = 'test_s2s_admin_secret_key_for_hmac_verification';
    process.env.ADMIN_USER = 'admin_s2s_tester';
    process.env.ADMIN_PASSWORD = 'admin_s2s_tester_password_long';
    process.env.WEB_ORDERS_WEBHOOK_SECRET = 's2s_shared_secret_deco_ventas_2026';
    delete process.env.CATALOG_WEBHOOK_SECRET;
    process.env.VENTAS_API_URL = 'https://ventas.decovintage.online';
    process.env.PUBLIC_WEB_URL = 'https://decovintage.online';

    adminToken = generateAuthToken();

    const app = express();
    app.set('trust proxy', true);
    app.use(express.json());
    app.use('/api/custom-orders', customOrderRoutes);

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
      });
    });
  });

  beforeEach(() => {
    capturedWebhooks = [];
    mockDb = createInMemoryOrderDb();
    __setCustomOrderDbForTests(mockDb);
    __setWebhookFetchForTests(async (url, init) => {
      capturedWebhooks.push({
        url,
        method: init.method,
        headers: init.headers,
        body: JSON.parse(init.body),
      });
      return { ok: true, status: 201 };
    });

    process.env.WEB_ORDERS_WEBHOOK_SECRET = 's2s_shared_secret_deco_ventas_2026';
    delete process.env.CATALOG_WEBHOOK_SECRET;
    process.env.VENTAS_API_URL = 'https://ventas.decovintage.online';
    process.env.PUBLIC_WEB_URL = 'https://decovintage.online';
  });

  after(async () => {
    __setCustomOrderDbForTests(null);
    __setWebhookFetchForTests(null);

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    for (const k of ENV_KEYS) {
      if (savedEnv[k] === undefined) {
        delete process.env[k];
      } else {
        process.env[k] = savedEnv[k];
      }
    }
  });

  describe('1. Esquema Prisma, Migración SQL Idempotente y Plantilla .env.example', () => {
    it('Verifica campos aditivos en prisma/schema.prisma y DDL 100% idempotente (IF NOT EXISTS)', () => {
      const schemaPrisma = fs.readFileSync(path.join(projectRoot, 'prisma', 'schema.prisma'), 'utf8');
      for (const field of [
        'orderSource',
        'customerName',
        'customerAddress',
        'customerDepartment',
        'externalSaleNumber',
        'importedAt',
        '@@index([orderSource])',
      ]) {
        assert.ok(schemaPrisma.includes(field), `prisma/schema.prisma debe incluir '${field}'`);
      }

      const migrationFile = path.join(
        projectRoot,
        'prisma',
        'migrations',
        '20261118203500_add_web_order_integration_fields',
        'migration.sql'
      );
      assert.equal(fs.existsSync(migrationFile), true, 'Debe existir la migración aditiva de feat-003');
      const sql = fs.readFileSync(migrationFile, 'utf8');

      for (const col of [
        '"orderSource"',
        '"customerName"',
        '"customerAddress"',
        '"customerDepartment"',
        '"externalSaleNumber"',
        '"importedAt"',
      ]) {
        assert.ok(
          sql.includes(`ADD COLUMN IF NOT EXISTS ${col}`),
          `La migración debe usar ADD COLUMN IF NOT EXISTS para ${col}`
        );
      }
      assert.ok(sql.includes('CREATE INDEX IF NOT EXISTS "custom_orders_orderSource_idx"'));
      assert.equal(/\b(DROP|TRUNCATE|DELETE)\b/i.test(sql), false, 'Prohibido SQL destructivo en migración');

      const envExample = fs.readFileSync(path.join(projectRoot, '.env.example'), 'utf8');
      assert.ok(envExample.includes('WEB_ORDERS_WEBHOOK_SECRET='));
      assert.ok(envExample.includes('VENTAS_API_URL='));
      assert.ok(envExample.includes('PUBLIC_WEB_URL='));

      assert.ok(CUSTOM_ORDER_STATUSES.includes('IMPORTADO'));
      assert.deepEqual(INTEGRATION_ORDER_STATUSES, [
        'IMPORTADO',
        'EN_PRODUCCION',
        'COMPLETADO',
        'CANCELADO',
        'PENDIENTE',
      ]);
      assert.equal(integrationOrderStatusPatchSchema.safeParse({ status: 'IMPORTADO' }).success, true);
    });
  });

  describe('2. Normalización de URLs Absolutas y Contrato WebOrderPayload', () => {
    it('Normaliza rutas relativas sin barras duplicadas y respeta URLs HTTPS de GCS', () => {
      assert.equal(
        toAbsolutePublicUrl('/posters/uploads/full/obra-1.webp', 'https://decovintage.online/'),
        'https://decovintage.online/posters/uploads/full/obra-1.webp'
      );
      assert.equal(
        toAbsolutePublicUrl('posters/uploads/custom/foto.webp', 'https://decovintage.online'),
        'https://decovintage.online/posters/uploads/custom/foto.webp'
      );
      assert.equal(
        toAbsolutePublicUrl('https://storage.googleapis.com/decovintage-master-media/posters/full/1.webp'),
        'https://storage.googleapis.com/decovintage-master-media/posters/full/1.webp'
      );
      assert.equal(toAbsolutePublicUrl('blob:https://decovintage.online/123'), null);
      assert.equal(toAbsolutePublicUrl('data:image/png;base64,AAAA'), null);
      assert.equal(toAbsolutePublicUrl(''), null);

      assert.equal(mapCanonicalMaterial('mdf'), 'MDF_5_5MM');
      assert.equal(mapCanonicalMaterial('pvc'), 'PVC_5MM');
      assert.equal(mapCanonicalMaterial('vinyl_only'), 'VINILO_SOLO');
    });

    it('Construye WebOrderPayload con estructura exacta para ítems de catálogo y personalizados', () => {
      const sampleOrder = {
        id: 'ord-uuid-001',
        orderNumber: 'CP-9012',
        orderSource: 'WEB_CART',
        status: 'PENDIENTE',
        customerName: 'María López',
        customerPhone: '50255554444',
        customerAddress: 'Zona 10, Ciudad de Guatemala',
        customerDepartment: 'Guatemala',
        customerNotes: 'Entregar en recepción',
        totalUnits: 3,
        totalPrice: 236.54,
        createdAt: new Date('2026-11-18T20:00:00.000Z'),
        items: [
          {
            isCustom: false,
            posterId: 'uuid-poster-77',
            legacyId: 'DV-077',
            title: 'Porsche 911 Turbo',
            sizeMode: 'standard',
            selectedStandardSize: { id: 'MEDIANO', name: 'Mediano', dimensions: '30 x 45 cm', price: 65 },
            baseMaterial: 'mdf',
            quantity: 1,
            unitPrice: 65,
            totalPrice: 65,
            imageUrl: '/posters/uploads/full/porsche-911.webp',
            thumbUrl: '/posters/uploads/thumb/porsche-911.webp',
          },
          {
            isCustom: true,
            title: 'Foto Familiar Especial',
            sizeMode: 'custom',
            customWidth: 42.2,
            customHeight: 30,
            customArea: 1266,
            baseMaterial: 'mdf',
            quantity: 2,
            unitPrice: 85.77,
            totalPrice: 171.54,
            imageUrl: 'https://storage.googleapis.com/decovintage-master-media/custom/fam.webp',
            customNote: 'Borde limpio sin texto',
          },
        ],
      };

      const payload = buildWebOrderPayload(sampleOrder, { publicWebUrl: 'https://decovintage.online/' });

      assert.equal(payload.externalOrderId, 'ord-uuid-001');
      assert.equal(payload.orderNumber, 'CP-9012');
      assert.equal(payload.orderSource, 'WEB_CART');
      assert.equal(payload.status, 'PENDIENTE');
      assert.deepEqual(payload.customer, {
        fullName: 'María López',
        phone: '50255554444',
        address: 'Zona 10, Ciudad de Guatemala',
        department: 'Guatemala',
        notes: 'Entregar en recepción',
      });
      assert.equal(payload.totalUnits, 3);
      assert.equal(payload.quotedTotal, 236.54);
      assert.equal(payload.createdAt, '2026-11-18T20:00:00.000Z');
      assert.equal(payload.items.length, 2);

      assert.deepEqual(payload.items[0], {
        isCustom: false,
        posterId: 'uuid-poster-77',
        legacyId: 'DV-077',
        sku: 'WEB-DV-077',
        title: 'Porsche 911 Turbo',
        sizeMode: 'standard',
        sizeId: 'MEDIANO',
        sizeLabel: 'Mediano (30 x 45 cm)',
        customWidth: null,
        customHeight: null,
        customArea: null,
        material: 'MDF_5_5MM',
        baseMaterial: 'mdf',
        quantity: 1,
        unitPrice: 65,
        subtotal: 65,
        imageUrl: 'https://decovintage.online/posters/uploads/full/porsche-911.webp',
        thumbUrl: 'https://decovintage.online/posters/uploads/thumb/porsche-911.webp',
        customNote: null,
      });

      assert.deepEqual(payload.items[1], {
        isCustom: true,
        posterId: null,
        legacyId: null,
        sku: null,
        title: 'Foto Familiar Especial',
        sizeMode: 'custom',
        sizeId: 'PERSONALIZADO',
        sizeLabel: '42.2 x 30 cm',
        customWidth: 42.2,
        customHeight: 30,
        customArea: 1266,
        material: 'MDF_5_5MM',
        baseMaterial: 'mdf',
        quantity: 2,
        unitPrice: 85.77,
        subtotal: 171.54,
        imageUrl: 'https://storage.googleapis.com/decovintage-master-media/custom/fam.webp',
        thumbUrl: 'https://storage.googleapis.com/decovintage-master-media/custom/fam.webp',
        customNote: 'Borde limpio sin texto',
      });
    });
  });

  describe('3. Seguridad Zero-Trust S2S en requireIntegrationSecret (503 / 401 / 200)', () => {
    it('Devuelve HTTP 503 cuando no existe secreto S2S configurado en el servidor', async () => {
      delete process.env.WEB_ORDERS_WEBHOOK_SECRET;
      delete process.env.CATALOG_WEBHOOK_SECRET;

      const res = await fetch(`${baseUrl}/api/custom-orders/integration/inbox`, {
        headers: { 'x-webhook-secret': 'cualquier_secreto' },
      });
      assert.equal(res.status, 503);
      const body = await res.json();
      assert.equal(body.success, false);
    });

    it('Rechaza con HTTP 401 peticiones sin secreto, con secreto incorrecto o solo con token Admin normal', async () => {
      const noHeader = await fetch(`${baseUrl}/api/custom-orders/integration/inbox`);
      assert.equal(noHeader.status, 401);

      const wrongSecret = await fetch(`${baseUrl}/api/custom-orders/integration/inbox`, {
        headers: { 'x-webhook-secret': 'secreto_incorrecto' },
      });
      assert.equal(wrongSecret.status, 401);

      // Verifica además que /integration/inbox NO fue interceptado por /:id (que aceptaría adminToken y daría 404)
      const adminBearerOnly = await fetch(`${baseUrl}/api/custom-orders/integration/inbox`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.equal(adminBearerOnly.status, 401);
    });

    it('Acepta x-webhook-secret, Authorization Bearer S2S y fallback a CATALOG_WEBHOOK_SECRET', async () => {
      const resHeader = await fetch(`${baseUrl}/api/custom-orders/integration/inbox`, {
        headers: { 'x-webhook-secret': 's2s_shared_secret_deco_ventas_2026' },
      });
      assert.equal(resHeader.status, 200);

      const resBearer = await fetch(`${baseUrl}/api/custom-orders/integration/inbox`, {
        headers: { Authorization: 'Bearer s2s_shared_secret_deco_ventas_2026' },
      });
      assert.equal(resBearer.status, 200);

      delete process.env.WEB_ORDERS_WEBHOOK_SECRET;
      process.env.CATALOG_WEBHOOK_SECRET = 'fallback_catalog_s2s_secret_777';

      const resFallback = await fetch(`${baseUrl}/api/custom-orders/integration/inbox`, {
        headers: { 'x-webhook-secret': 'fallback_catalog_s2s_secret_777' },
      });
      assert.equal(resFallback.status, 200);
    });
  });

  describe('4. Flujo Completo Push + Pull Inbox + Callback de Estado IMPORTADO', () => {
    it('POST /api/custom-orders persiste metadatos, recalcula precios y emite Push S2S con URLs absolutas', async () => {
      const createRes = await fetch(`${baseUrl}/api/custom-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '190.148.10.21',
        },
        body: JSON.stringify({
          orderSource: 'WEB_CUSTOM',
          customerName: 'Carlos Méndez',
          customerPhone: '50241239876',
          customerAddress: 'Antigua Guatemala, Calle del Arco',
          customerDepartment: 'Sacatepéquez',
          customerNotes: 'Empaque para regalo',
          totalPrice: 5, // Manipulado desde cliente; servidor debe recalcular a Q85.77
          items: [
            {
              isCustom: true,
              title: 'Ilustración Arquitectónica',
              sizeMode: 'custom',
              customWidth: '42.2',
              customHeight: '30',
              baseMaterial: 'mdf',
              quantity: 1,
              unitPrice: 5,
              imageUrl: '/posters/uploads/custom/arco.webp',
            },
          ],
        }),
      });

      assert.equal(createRes.status, 201);
      const createBody = await createRes.json();
      assert.equal(createBody.success, true);
      assert.match(createBody.orderNumber, /^CP-\d{6}$/);
      assert.equal(createBody.order.orderSource, 'WEB_CUSTOM');
      assert.equal(createBody.order.customerName, 'Carlos Méndez');
      assert.equal(createBody.order.customerDepartment, 'Sacatepéquez');
      assert.equal(createBody.order.totalPrice, 85.77);

      // Esperar microtask del Push asíncrono
      await new Promise((r) => setTimeout(r, 25));

      assert.equal(capturedWebhooks.length, 1);
      assert.equal(capturedWebhooks[0].url, 'https://ventas.decovintage.online/api/webhooks/web-orders');
      assert.equal(capturedWebhooks[0].headers['x-webhook-secret'], 's2s_shared_secret_deco_ventas_2026');
      assert.equal(capturedWebhooks[0].body.event, 'web_order.created');
      assert.equal(capturedWebhooks[0].body.order.orderNumber, createBody.orderNumber);
      assert.equal(capturedWebhooks[0].body.order.quotedTotal, 85.77);
      assert.equal(
        capturedWebhooks[0].body.order.items[0].imageUrl,
        'https://decovintage.online/posters/uploads/custom/arco.webp'
      );

      // Pull Inbox S2S recupera la orden PENDIENTE
      const inboxRes = await fetch(`${baseUrl}/api/custom-orders/integration/inbox?status=PENDIENTE&limit=500`, {
        headers: { 'x-webhook-secret': 's2s_shared_secret_deco_ventas_2026' },
      });
      assert.equal(inboxRes.status, 200);
      const inboxBody = await inboxRes.json();
      assert.equal(inboxBody.success, true);
      assert.equal(inboxBody.count, 1);
      assert.equal(inboxBody.data[0].orderNumber, createBody.orderNumber);

      // Callback S2S marca la orden como IMPORTADO y asigna externalSaleNumber
      const patchImportRes = await fetch(
        `${baseUrl}/api/custom-orders/integration/${createBody.orderNumber}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': 's2s_shared_secret_deco_ventas_2026',
          },
          body: JSON.stringify({
            status: 'IMPORTADO',
            externalSaleNumber: 'VTA-2026-0451',
          }),
        }
      );
      assert.equal(patchImportRes.status, 200);
      const patchImportBody = await patchImportRes.json();
      assert.equal(patchImportBody.success, true);
      assert.equal(patchImportBody.data.status, 'IMPORTADO');
      assert.equal(patchImportBody.data.externalSaleNumber, 'VTA-2026-0451');
      assert.ok(patchImportBody.data.importedAt, 'Debe registrar importedAt al importar');

      const firstImportedAt = patchImportBody.data.importedAt;

      // La bandeja PENDIENTE ahora queda vacía
      const inboxAfterRes = await fetch(`${baseUrl}/api/custom-orders/integration/inbox?status=PENDIENTE`, {
        headers: { 'x-webhook-secret': 's2s_shared_secret_deco_ventas_2026' },
      });
      const inboxAfterBody = await inboxAfterRes.json();
      assert.equal(inboxAfterBody.count, 0);

      // Segunda transición a EN_PRODUCCION preserva el importedAt original
      await new Promise((r) => setTimeout(r, 15));
      const patchProdRes = await fetch(
        `${baseUrl}/api/custom-orders/integration/${createBody.orderNumber}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': 's2s_shared_secret_deco_ventas_2026',
          },
          body: JSON.stringify({ status: 'EN_PRODUCCION' }),
        }
      );
      assert.equal(patchProdRes.status, 200);
      const patchProdBody = await patchProdRes.json();
      assert.equal(patchProdBody.data.status, 'EN_PRODUCCION');
      assert.equal(patchProdBody.data.externalSaleNumber, 'VTA-2026-0451');
      assert.equal(
        patchProdBody.data.importedAt,
        firstImportedAt,
        'Debe preservar el timestamp importedAt previo'
      );
    });

    it('Valida errores 400 (estado inválido Zod) y 404 (orden inexistente) en Callback S2S', async () => {
      const badStatusRes = await fetch(`${baseUrl}/api/custom-orders/integration/CP-000000/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': 's2s_shared_secret_deco_ventas_2026',
        },
        body: JSON.stringify({ status: 'ESTADO_INVENTADO' }),
      });
      assert.equal(badStatusRes.status, 400);

      const notFoundRes = await fetch(`${baseUrl}/api/custom-orders/integration/CP-999999/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': 's2s_shared_secret_deco_ventas_2026',
        },
        body: JSON.stringify({ status: 'IMPORTADO' }),
      });
      assert.equal(notFoundRes.status, 404);
      const notFoundBody = await notFoundRes.json();
      assert.equal(notFoundBody.success, false);
      assert.equal(notFoundBody.error, 'Orden no encontrada.');
    });

    it('Garantiza que fallos de red o timeout en Modulo_Ventas NUNCA bloqueen el 201 Created del cliente web', async () => {
      __setWebhookFetchForTests(async (_url, init) => {
        return await new Promise((_resolve, reject) => {
          init.signal.addEventListener('abort', () => {
            const abortErr = new Error('The operation was aborted');
            abortErr.name = 'AbortError';
            reject(abortErr);
          });
        });
      });

      const abortResult = await notifySalesModuleNewOrder(
        {
          id: 'ord-timeout-1',
          orderNumber: 'CP-111122',
          orderSource: 'WEB_QUICK_POSTER',
          totalPrice: 65,
          totalUnits: 1,
          items: [],
        },
        { timeoutMs: 40 }
      );
      assert.equal(abortResult.sent, false);

      __setWebhookFetchForTests(async () => {
        throw new Error('ECONNREFUSED ventas.decovintage.online');
      });

      const res = await fetch(`${baseUrl}/api/custom-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': '190.148.10.22',
        },
        body: JSON.stringify({
          orderSource: 'WEB_QUICK_POSTER',
          customerName: 'Ana Gómez',
          customerPhone: '50233332222',
          items: [
            {
              isCustom: false,
              posterId: 'uuid-p-1',
              title: 'Starry Night',
              sizeMode: 'standard',
              selectedStandardSize: { id: 'PEQUENO', name: 'Pequeño', dimensions: '21 x 27 cm', price: 35 },
              baseMaterial: 'mdf',
              quantity: 1,
            },
          ],
        }),
      });

      assert.equal(res.status, 201);
      const body = await res.json();
      assert.equal(body.success, true);
      assert.equal(body.order.totalPrice, 35);
    });
  });
});
