/**
 * test/phase3-verification.test.js
 * Comprehensive Automated Verification Test Suite for Phase 3 (R1 to R6).
 *
 * Requirements Covered:
 * - R1: Declarative Zod Validation on Admin Endpoints (HTTP 400 + structured error)
 * - R2: JSON API Contract Standardization ({ success: true, data: ..., ...legacy })
 * - R3: Accessible <ConfirmDialog> Component & Zero window.confirm Calls
 * - R4: WCAG 2.1 AA Accessibility in Admin Forms & Modals
 * - R5: HTTP Cache-Control Headers & Search Input Debounce
 * - R6: Relational Category Normalization in PostgreSQL & Prisma
 *
 * Executed via native Node.js test runner:
 * node --env-file=.env --test test/phase3-verification.test.js
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { generateAuthToken } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';

describe('Phase 3 Verification Suite — Deco Vintage Guate', () => {
  let app;
  let server;
  let baseUrl;
  const createdPosterIds = [];
  const createdCategoryIds = [];
  const createdFranchiseIds = [];
  const createdOrderIds = [];

  // Helper: Auth header generator
  function getAuthHeaders() {
    const token = generateAuthToken();
    return {
      authorization: `Bearer ${token}`
    };
  }

  // Helper: Ephemeral test categories cleaner
  async function cleanTestCategories() {
    await prisma.$executeRawUnsafe("DELETE FROM categories WHERE id LIKE 'TEST_CAT_%';").catch(() => {});
    const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
    if (settings && Array.isArray(settings.categories)) {
      const filtered = settings.categories.filter(c => {
        const id = typeof c === 'string' ? c : c.id;
        return !id || !id.startsWith('TEST_CAT_');
      });
      await prisma.storeSettings.update({
        where: { id: 'default' },
        data: { categories: filtered }
      }).catch(() => {});
    }
  }

  // Helper: Recursive file scanner for static code audits
  function scanFiles(dir, extensions = ['.js', '.jsx']) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git') {
          results = results.concat(scanFiles(fullPath, extensions));
        }
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        results.push(fullPath);
      }
    }
    return results;
  }

  // Setup ephemeral test HTTP server mounting all relevant API routes
  before(async () => {
    const expressModule = await import('express');
    const express = expressModule.default;
    const catalogRoutesModule = await import('../routes/catalogRoutes.js');
    const settingsRoutesModule = await import('../routes/settingsRoutes.js');
    const customOrderRoutesModule = await import('../routes/customOrderRoutes.js');
    const errorHandlerModule = await import('../middleware/errorHandler.js');
    const errorHandler = errorHandlerModule.default || errorHandlerModule.errorHandler;

    app = express();
    app.use(express.json({ limit: '50mb' }));
    app.use('/api', catalogRoutesModule.default);
    app.use('/api', settingsRoutesModule.default);
    app.use('/api/settings', settingsRoutesModule.default);
    app.use('/api/custom-orders', customOrderRoutesModule.default);
    app.use(errorHandler);

    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  // Teardown: close server and clean up any lingering test records
  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    // Clean up created test posters
    for (const id of createdPosterIds) {
      await prisma.poster.delete({ where: { id } }).catch(() => {});
    }

    // Clean up created test categories
    await cleanTestCategories();

    // Clean up created test franchises
    for (const id of createdFranchiseIds) {
      await prisma.franchise.delete({ where: { id } }).catch(() => {});
    }

    // Clean up created test orders
    for (const id of createdOrderIds) {
      await prisma.customOrder.delete({ where: { id } }).catch(() => {});
    }

    await prisma.$disconnect().catch(() => {});
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 1: R1 — Declarative Zod Validation on Admin Endpoints
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Suite 1: R1 — Declarative Zod Validation on Admin Endpoints', () => {

    it('1.1 validators/adminSchemas.js exists and exports required Zod schemas', async () => {
      const schemasPath = path.resolve('validators/adminSchemas.js');
      assert.ok(fs.existsSync(schemasPath), 'validators/adminSchemas.js must exist');

      const schemas = await import('../validators/adminSchemas.js');
      assert.ok(schemas.posterCreateSchema, 'Must export posterCreateSchema');
      assert.ok(schemas.posterUpdateSchema, 'Must export posterUpdateSchema');
      assert.ok(schemas.posterPatchSchema, 'Must export posterPatchSchema');
      assert.ok(schemas.categoryCreateSchema, 'Must export categoryCreateSchema');
      assert.ok(schemas.franchiseCreateSchema, 'Must export franchiseCreateSchema');
      assert.ok(schemas.settingsUpdateSchema, 'Must export settingsUpdateSchema');
      assert.ok(schemas.orderStatusPatchSchema, 'Must export orderStatusPatchSchema');
    });

    it('1.2 middleware/validate.js exists and formats Zod validation errors to contract specification', async () => {
      const validatePath = path.resolve('middleware/validate.js');
      assert.ok(fs.existsSync(validatePath), 'middleware/validate.js must exist');

      const validateModule = await import('../middleware/validate.js');
      const validate = validateModule.default || validateModule.validate;
      assert.strictEqual(typeof validate, 'function', 'middleware/validate.js must export validate function');

      const { z } = await import('zod');
      const testSchema = z.object({
        name: z.string({ required_error: 'El nombre es obligatorio.' }).min(1, 'El nombre no puede estar vacío.')
      });

      const middleware = validate(testSchema);
      let statusCode = null;
      let jsonResponse = null;
      let nextCalled = false;

      const mockReq = { body: {} };
      const mockRes = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonResponse = data;
          return this;
        }
      };
      const mockNext = () => { nextCalled = true; };

      await middleware(mockReq, mockRes, mockNext);

      assert.strictEqual(statusCode, 400, 'Invalid schema must yield HTTP 400');
      assert.strictEqual(nextCalled, false, 'next() must NOT be called on validation error');
      assert.strictEqual(jsonResponse.success, false, 'Response must have success: false');
      assert.strictEqual(jsonResponse.error, 'Datos de entrada inválidos.', 'Error message must be "Datos de entrada inválidos."');
      assert.ok(Array.isArray(jsonResponse.details), 'details must be an array');
      assert.ok(jsonResponse.details.length > 0, 'details array must contain error entries');
      assert.strictEqual(jsonResponse.details[0].field, 'name', 'details item must specify the invalid field');
    });

    it('1.3 POST /api/catalog/posters rejects invalid payloads with HTTP 400 and structured error', async () => {
      // Missing title
      const resMissingTitle = await fetch(`${baseUrl}/api/catalog/posters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          categoria: 'VINTAGE',
          minPrice: 50
        })
      });
      const dataMissingTitle = await resMissingTitle.json();
      assert.strictEqual(resMissingTitle.status, 400, 'POST /posters without title must return HTTP 400');
      assert.strictEqual(dataMissingTitle.success, false);
      assert.strictEqual(dataMissingTitle.error, 'Datos de entrada inválidos.');
      assert.ok(Array.isArray(dataMissingTitle.details));
      assert.ok(dataMissingTitle.details.some(d => d.field === 'titulo' || d.field === 'title'));

      // Negative price
      const resNegPrice = await fetch(`${baseUrl}/api/catalog/posters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          titulo: 'Póster Precio Negativo',
          categoria: 'VINTAGE',
          minPrice: -25
        })
      });
      const dataNegPrice = await resNegPrice.json();
      assert.strictEqual(resNegPrice.status, 400, 'POST /posters with negative price must return HTTP 400');
      assert.strictEqual(dataNegPrice.success, false);
      assert.strictEqual(dataNegPrice.error, 'Datos de entrada inválidos.');
      assert.ok(Array.isArray(dataNegPrice.details));

      // Invalid category
      const resInvalidCat = await fetch(`${baseUrl}/api/catalog/posters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          titulo: 'Póster Categoría Inválida',
          categoria: 'CATEGORIA_INEXISTENTE_XYZ',
          minPrice: 50
        })
      });
      const dataInvalidCat = await resInvalidCat.json();
      assert.strictEqual(resInvalidCat.status, 400, 'POST /posters with invalid category must return HTTP 400');
      assert.strictEqual(dataInvalidCat.success, false);
      assert.strictEqual(dataInvalidCat.error, 'Datos de entrada inválidos.');
    });

    it('1.4 POST /api/catalog/posters accepts valid poster payload with HTTP 201', async () => {
      const validPayload = {
        titulo: 'Obra de Prueba Validación Zod',
        subtitulo: 'Edición Limitada',
        descripcion: 'Póster verificado en suite Phase 3.',
        categoria: 'VINTAGE',
        minPrice: 65,
        isFeatured: false,
        isPublished: true,
        tags: ['prueba', 'vintage', 'zod']
      };

      const res = await fetch(`${baseUrl}/api/catalog/posters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(validPayload)
      });
      const body = await res.json();

      assert.strictEqual(res.status, 201, `Expected HTTP 201, got ${res.status}: ${JSON.stringify(body)}`);
      assert.strictEqual(body.success, true);
      const createdPoster = body.data || body.poster;
      assert.ok(createdPoster && createdPoster.id, 'Must return created poster with ID');
      createdPosterIds.push(createdPoster.id);
    });

    it('1.5 PUT /api/catalog/posters/:id rejects invalid payloads with HTTP 400', async () => {
      // First ensure a target poster exists
      const testId = crypto.randomUUID();
      await prisma.poster.create({
        data: {
          id: testId,
          titulo: 'Póster Para Prueba PUT',
          categoria: 'VINTAGE',
          isPublished: true
        }
      });
      createdPosterIds.push(testId);

      // Attempt PUT with negative price and empty title
      const res = await fetch(`${baseUrl}/api/catalog/posters/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          titulo: '',
          minPrice: -100
        })
      });
      const body = await res.json();

      assert.strictEqual(res.status, 400, 'PUT /posters/:id with invalid payload must return HTTP 400');
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error, 'Datos de entrada inválidos.');
    });

    it('1.6 PATCH /api/catalog/posters/:id rejects invalid status or empty body with HTTP 400', async () => {
      const testId = crypto.randomUUID();
      await prisma.poster.create({
        data: {
          id: testId,
          titulo: 'Póster Para Prueba PATCH',
          categoria: 'VINTAGE',
          isPublished: true
        }
      });
      createdPosterIds.push(testId);

      // Invalid status
      const resInvalidStatus = await fetch(`${baseUrl}/api/catalog/posters/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ estado: 'ESTADO_INVENTADO_NO_PERMITIDO' })
      });
      const bodyInvalidStatus = await resInvalidStatus.json();
      assert.strictEqual(resInvalidStatus.status, 400, 'PATCH /posters/:id with invalid status must return HTTP 400');
      assert.strictEqual(bodyInvalidStatus.success, false);
      assert.strictEqual(bodyInvalidStatus.error, 'Datos de entrada inválidos.');

      // Empty body
      const resEmpty = await fetch(`${baseUrl}/api/catalog/posters/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({})
      });
      const bodyEmpty = await resEmpty.json();
      assert.strictEqual(resEmpty.status, 400, 'PATCH /posters/:id with empty body must return HTTP 400');
      assert.strictEqual(bodyEmpty.success, false);
      assert.strictEqual(bodyEmpty.error, 'Datos de entrada inválidos.');
    });

    it('1.7 POST /api/catalog/categories rejects empty or missing name with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/catalog/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: '' })
      });
      const body = await res.json();

      assert.strictEqual(res.status, 400, 'POST /categories with empty name must return HTTP 400');
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error, 'Datos de entrada inválidos.');
      assert.ok(Array.isArray(body.details));
    });

    it('1.8 POST /api/catalog/categories accepts valid category payload with HTTP 200/201', async () => {
      const catId = 'TEST_CAT_' + Date.now();
      createdCategoryIds.push(catId);

      const res = await fetch(`${baseUrl}/api/catalog/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ id: catId, name: `Categoría Test ${Date.now()}`, icon: '🏷️' })
      });
      const body = await res.json();

      assert.ok(res.status === 200 || res.status === 201, `Expected HTTP 200/201, got ${res.status}`);
      assert.strictEqual(body.success, true);
      // Direct test cleanup
      await cleanTestCategories();
    });

    it('1.9 POST /api/catalog/franchises rejects empty or missing name with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/catalog/franchises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: '' })
      });
      const body = await res.json();

      assert.strictEqual(res.status, 400, 'POST /franchises with empty name must return HTTP 400');
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error, 'Datos de entrada inválidos.');
    });

    it('1.10 POST /api/catalog/franchises accepts valid franchise payload with HTTP 200/201', async () => {
      const slug = 'test-franchise-' + Date.now();
      const res = await fetch(`${baseUrl}/api/catalog/franchises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: `Colección Test ${Date.now()}`, slug })
      });
      const body = await res.json();

      assert.ok(res.status === 200 || res.status === 201, `Expected HTTP 200/201, got ${res.status}`);
      assert.strictEqual(body.success, true);
      const franchise = body.data || body.franchise;
      if (franchise && franchise.id) {
        createdFranchiseIds.push(franchise.id);
      }
    });

    it('1.11 PUT /api/settings and POST /api/settings/save reject invalid values with HTTP 400', async () => {
      // Invalid negative delivery days
      const invalidPayload = { deliveryMinDays: -5, customCm2Price: 'no-es-numero' };

      const resPut = await fetch(`${baseUrl}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(invalidPayload)
      });
      const bodyPut = await resPut.json();
      assert.strictEqual(resPut.status, 400, 'PUT /api/settings with invalid values must return HTTP 400');
      assert.strictEqual(bodyPut.success, false);
      assert.strictEqual(bodyPut.error, 'Datos de entrada inválidos.');

      const resSave = await fetch(`${baseUrl}/api/settings/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(invalidPayload)
      });
      const bodySave = await resSave.json();
      assert.strictEqual(resSave.status, 400, 'POST /api/settings/save with invalid values must return HTTP 400');
      assert.strictEqual(bodySave.success, false);
      assert.strictEqual(bodySave.error, 'Datos de entrada inválidos.');
    });

    it('1.12 PATCH /api/custom-orders/:id/status rejects missing or invalid status with HTTP 400', async () => {
      const orderId = crypto.randomUUID();
      const orderNumber = 'COT-' + Date.now();
      await prisma.customOrder.create({
        data: {
          id: orderId,
          orderNumber,
          totalPrice: 150.00,
          status: 'PENDIENTE'
        }
      });
      createdOrderIds.push(orderId);

      // Missing status
      const resMissing = await fetch(`${baseUrl}/api/custom-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({})
      });
      const bodyMissing = await resMissing.json();
      assert.strictEqual(resMissing.status, 400, 'PATCH /custom-orders/:id/status without status must return HTTP 400');
      assert.strictEqual(bodyMissing.success, false);
      assert.strictEqual(bodyMissing.error, 'Datos de entrada inválidos.');

      // Invalid status enum
      const resInvalid = await fetch(`${baseUrl}/api/custom-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: 'ESTADO_NO_VALIDO' })
      });
      const bodyInvalid = await resInvalid.json();
      assert.strictEqual(resInvalid.status, 400, 'PATCH /custom-orders/:id/status with invalid enum must return HTTP 400');
      assert.strictEqual(bodyInvalid.success, false);
      assert.strictEqual(bodyInvalid.error, 'Datos de entrada inválidos.');
    });

    it('1.13 PATCH /api/custom-orders/orders/:id/status is supported and validates status with HTTP 400/200', async () => {
      const orderId = crypto.randomUUID();
      const orderNumber = 'COT-ALIAS-' + Date.now();
      await prisma.customOrder.create({
        data: {
          id: orderId,
          orderNumber,
          totalPrice: 200.00,
          status: 'PENDIENTE'
        }
      });
      createdOrderIds.push(orderId);

      // Invalid status on alias route
      const resInvalid = await fetch(`${baseUrl}/api/custom-orders/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: 'INVALIDO' })
      });
      assert.strictEqual(resInvalid.status, 400, 'Alias route /orders/:id/status must reject invalid status with HTTP 400');

      // Valid status on alias route
      const resValid = await fetch(`${baseUrl}/api/custom-orders/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: 'COTIZADO' })
      });
      const bodyValid = await resValid.json();
      assert.strictEqual(resValid.status, 200, 'Alias route /orders/:id/status must accept valid status with HTTP 200');
      assert.strictEqual(bodyValid.success, true);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 2: R2 — JSON API Contract Standardization & Backward Compatibility
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Suite 2: R2 — JSON API Contract Standardization & Backward Compatibility', () => {

    it('2.1 GET /api/catalog returns canonical data AND root legacy properties (posters, categories, franchises, settings, count)', async () => {
      const res = await fetch(`${baseUrl}/api/catalog`);
      const body = await res.json();

      assert.strictEqual(res.status, 200, 'GET /api/catalog must return HTTP 200');
      assert.strictEqual(body.success, true, 'Response must have success: true');
      assert.ok(body.data, 'Response must contain canonical data envelope');
      assert.ok(Array.isArray(body.posters), 'Response must contain legacy root property "posters" as Array');
      assert.ok(Array.isArray(body.categories), 'Response must contain legacy root property "categories" as Array');
      assert.ok(Array.isArray(body.franchises), 'Response must contain legacy root property "franchises" as Array');
      assert.ok(typeof body.settings === 'object' && body.settings !== null, 'Response must contain legacy root property "settings"');
      assert.strictEqual(typeof body.count, 'number', 'Response must contain legacy root property "count" as number');

      // Canonical data contains or mirrors the same arrays
      assert.ok(Array.isArray(body.data.posters) || Array.isArray(body.data), 'data must contain or represent catalog');
    });

    it('2.2 GET /api/catalog/posters returns canonical data AND legacy posters array & count', async () => {
      const res = await fetch(`${baseUrl}/api/catalog/posters`);
      const body = await res.json();

      assert.strictEqual(res.status, 200, 'GET /api/catalog/posters must return HTTP 200');
      assert.strictEqual(body.success, true);
      assert.ok(body.data, 'Response must contain canonical data property');
      assert.ok(Array.isArray(body.posters), 'Response must preserve legacy root "posters" array');
      assert.strictEqual(typeof body.count, 'number', 'Response must preserve legacy root "count" number');
      assert.strictEqual(Array.isArray(body.data), true, 'Canonical data must be the array of posters');
      assert.strictEqual(body.data.length, body.posters.length, 'data and posters lengths must match');
    });

    it('2.3 GET /api/catalog/posters/:id returns canonical data AND legacy poster object', async () => {
      // Find an existing published poster ID
      const existing = await prisma.poster.findFirst({ where: { isPublished: true } });
      assert.ok(existing, 'At least one published poster must exist in the database');

      const res = await fetch(`${baseUrl}/api/catalog/posters/${existing.id}`);
      const body = await res.json();

      assert.strictEqual(res.status, 200, 'GET /api/catalog/posters/:id must return HTTP 200');
      assert.strictEqual(body.success, true);
      assert.ok(body.data, 'Response must contain canonical data object');
      assert.ok(body.poster, 'Response must preserve legacy root "poster" object');
      assert.strictEqual(body.data.id, existing.id);
      assert.strictEqual(body.poster.id, existing.id);
    });

    it('2.4 POST, PUT, and PATCH /api/catalog/posters return canonical data AND legacy poster object', async () => {
      // 1. POST (create)
      const resPost = await fetch(`${baseUrl}/api/catalog/posters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          titulo: 'Póster Dual Envelope',
          categoria: 'VINTAGE',
          minPrice: 75
        })
      });
      const bodyPost = await resPost.json();
      assert.strictEqual(resPost.status, 201);
      assert.strictEqual(bodyPost.success, true);
      assert.ok(bodyPost.data, 'POST response must contain canonical data');
      assert.ok(bodyPost.poster, 'POST response must preserve legacy root poster');
      assert.strictEqual(bodyPost.data.id, bodyPost.poster.id);
      const testId = bodyPost.data.id;
      createdPosterIds.push(testId);

      // 2. PUT (update)
      const resPut = await fetch(`${baseUrl}/api/catalog/posters/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          titulo: 'Póster Dual Envelope Actualizado',
          categoria: 'VINTAGE',
          minPrice: 85
        })
      });
      const bodyPut = await resPut.json();
      assert.strictEqual(resPut.status, 200);
      assert.strictEqual(bodyPut.success, true);
      assert.ok(bodyPut.data, 'PUT response must contain canonical data');
      assert.ok(bodyPut.poster, 'PUT response must preserve legacy root poster');
      assert.strictEqual(bodyPut.data.id, testId);

      // 3. PATCH (partial update)
      const resPatch = await fetch(`${baseUrl}/api/catalog/posters/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ estado: 'SEPARADO' })
      });
      const bodyPatch = await resPatch.json();
      assert.strictEqual(resPatch.status, 200);
      assert.strictEqual(bodyPatch.success, true);
      assert.ok(bodyPatch.data, 'PATCH response must contain canonical data');
      assert.ok(bodyPatch.poster, 'PATCH response must preserve legacy root poster');
      assert.strictEqual(bodyPatch.data.estado, 'SEPARADO');
    });

    it('2.5 GET /api/catalog/categories returns canonical data AND legacy categories array & count', async () => {
      const res = await fetch(`${baseUrl}/api/catalog/categories`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.data, 'Must contain canonical data');
      assert.ok(Array.isArray(body.categories), 'Must preserve legacy categories array');
      assert.strictEqual(typeof body.count, 'number', 'Must preserve legacy count');
      assert.strictEqual(Array.isArray(body.data), true, 'Canonical data must be the categories array');
      assert.strictEqual(body.data.length, body.categories.length);
    });

    it('2.6 POST /api/catalog/categories returns canonical data AND legacy categories property', async () => {
      const catId = 'TEST_CAT_ENV_' + Date.now();
      createdCategoryIds.push(catId);

      const res = await fetch(`${baseUrl}/api/catalog/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ id: catId, name: `Categoría Envelope ${Date.now()}`, icon: '🏷️' })
      });
      const body = await res.json();

      assert.ok(res.status === 200 || res.status === 201);
      assert.strictEqual(body.success, true);
      assert.ok(body.data, 'POST /categories must contain canonical data');
      assert.ok(body.categories || body.category, 'POST /categories must preserve legacy categories property');
      // Direct test cleanup
      await cleanTestCategories();
    });

    it('2.7 GET and POST /api/catalog/franchises return canonical data AND legacy franchise(s) property', async () => {
      // GET
      const resGet = await fetch(`${baseUrl}/api/catalog/franchises`);
      const bodyGet = await resGet.json();
      assert.strictEqual(resGet.status, 200);
      assert.strictEqual(bodyGet.success, true);
      assert.ok(bodyGet.data, 'GET /franchises must contain canonical data');
      assert.ok(Array.isArray(bodyGet.franchises), 'GET /franchises must preserve legacy franchises array');
      assert.strictEqual(typeof bodyGet.count, 'number');

      // POST
      const slug = 'franchise-env-' + Date.now();
      const resPost = await fetch(`${baseUrl}/api/catalog/franchises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: `Colección Envelope ${Date.now()}`, slug })
      });
      const bodyPost = await resPost.json();
      assert.ok(resPost.status === 200 || resPost.status === 201);
      assert.strictEqual(bodyPost.success, true);
      assert.ok(bodyPost.data, 'POST /franchises must contain canonical data');
      assert.ok(bodyPost.franchise, 'POST /franchises must preserve legacy franchise object');
      if (bodyPost.data.id) {
        createdFranchiseIds.push(bodyPost.data.id);
      }
    });

    it('2.8 GET /api/settings returns canonical data AND legacy settings object and spread root properties', async () => {
      const res = await fetch(`${baseUrl}/api/settings`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.data, 'GET /settings must return canonical data');
      assert.ok(body.settings, 'GET /settings must preserve legacy root settings property');
      assert.ok(body.whatsappPhone !== undefined || body.settings.whatsappPhone !== undefined, 'WhatsApp phone must be present');
    });

    it('2.9 PUT /api/settings and POST /api/settings/save return canonical data AND legacy settings object', async () => {
      const updatePayload = {
        deliveryMinDays: 2,
        deliveryMaxDays: 5,
        customCm2Price: 0.048
      };

      const resPut = await fetch(`${baseUrl}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updatePayload)
      });
      const bodyPut = await resPut.json();
      assert.strictEqual(resPut.status, 200);
      assert.strictEqual(bodyPut.success, true);
      assert.ok(bodyPut.data, 'PUT /settings must return canonical data');
      assert.ok(bodyPut.settings, 'PUT /settings must return legacy settings object');

      const resSave = await fetch(`${baseUrl}/api/settings/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updatePayload)
      });
      const bodySave = await resSave.json();
      assert.strictEqual(resSave.status, 200);
      assert.strictEqual(bodySave.success, true);
      assert.ok(bodySave.data, 'POST /settings/save must return canonical data');
      assert.ok(bodySave.settings, 'POST /settings/save must return legacy settings object');
    });

    it('2.10 GET /api/custom-orders returns canonical data AND legacy orders property', async () => {
      const res = await fetch(`${baseUrl}/api/custom-orders`, {
        headers: getAuthHeaders()
      });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.data, 'GET /custom-orders must return canonical data');
      assert.ok(Array.isArray(body.orders) || Array.isArray(body.data), 'orders must be accessible as array');
    });

    it('2.11 PATCH /api/custom-orders/:id/status returns canonical data AND legacy order property', async () => {
      const orderId = crypto.randomUUID();
      await prisma.customOrder.create({
        data: {
          id: orderId,
          orderNumber: 'COT-ENV-' + Date.now(),
          totalPrice: 250.00,
          status: 'PENDIENTE'
        }
      });
      createdOrderIds.push(orderId);

      const res = await fetch(`${baseUrl}/api/custom-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: 'EN_PROCESO' })
      });
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.data, 'PATCH /custom-orders/:id/status must return canonical data');
      assert.ok(body.order, 'PATCH /custom-orders/:id/status must return legacy order');
      assert.strictEqual(body.data.id, orderId);
      assert.strictEqual(body.order.status, 'EN_PROCESO');
    });

    it('2.12 Error responses across all endpoints adhere to standardized error envelope { success: false, error: ... }', async () => {
      // 401 Unauthorized
      const res401 = await fetch(`${baseUrl}/api/catalog/posters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: 'Test Sin Auth' })
      });
      const body401 = await res401.json();
      assert.strictEqual(res401.status, 401);
      assert.strictEqual(body401.success, false);
      assert.strictEqual(typeof body401.error, 'string');

      // 404 Not Found
      const res404 = await fetch(`${baseUrl}/api/catalog/posters/id-que-no-existe-nunca-12345`);
      const body404 = await res404.json();
      assert.strictEqual(res404.status, 404);
      assert.strictEqual(body404.success, false);
      assert.strictEqual(typeof body404.error, 'string');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 3: R3 — Accessible ConfirmDialog & window.confirm Eradication
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Suite 3: R3 — Accessible ConfirmDialog & window.confirm Eradication', () => {

    it('3.1 src/components/common/ConfirmDialog.jsx exists', () => {
      const dialogPath = path.resolve('src/components/common/ConfirmDialog.jsx');
      assert.ok(fs.existsSync(dialogPath), 'src/components/common/ConfirmDialog.jsx must exist');
    });

    it('3.2 ConfirmDialog.jsx implements role="alertdialog" and aria-modal="true"', () => {
      const dialogPath = path.resolve('src/components/common/ConfirmDialog.jsx');
      assert.ok(fs.existsSync(dialogPath), 'ConfirmDialog.jsx must exist to verify ARIA attributes');
      const source = fs.readFileSync(dialogPath, 'utf8');

      assert.ok(
        source.includes('role="alertdialog"') || source.includes("role='alertdialog'"),
        'ConfirmDialog must specify role="alertdialog"'
      );
      assert.ok(
        source.includes('aria-modal="true"') || source.includes("aria-modal='true'") || source.includes('aria-modal={true}'),
        'ConfirmDialog must specify aria-modal="true"'
      );
    });

    it('3.3 ConfirmDialog.jsx implements aria-labelledby and aria-describedby for assistive tech', () => {
      const dialogPath = path.resolve('src/components/common/ConfirmDialog.jsx');
      const source = fs.readFileSync(dialogPath, 'utf8');

      assert.ok(source.includes('aria-labelledby'), 'ConfirmDialog must specify aria-labelledby');
      assert.ok(source.includes('aria-describedby'), 'ConfirmDialog must specify aria-describedby');
    });

    it('3.4 ConfirmDialog.jsx implements keyboard dismissal via Escape key listener', () => {
      const dialogPath = path.resolve('src/components/common/ConfirmDialog.jsx');
      const source = fs.readFileSync(dialogPath, 'utf8');

      assert.ok(
        source.includes('Escape') && (source.includes('keydown') || source.includes('onKeyDown')),
        'ConfirmDialog must implement an Escape key listener to close the modal'
      );
    });

    it('3.5 ConfirmDialog.jsx implements focus management or focus trapping', () => {
      const dialogPath = path.resolve('src/components/common/ConfirmDialog.jsx');
      const source = fs.readFileSync(dialogPath, 'utf8');

      assert.ok(
        source.includes('focus()') || source.includes('autoFocus') || source.includes('useRef'),
        'ConfirmDialog must manage focus on initial render and focus restoration'
      );
    });

    it('3.6 Zero occurrences of window.confirm in src/pages/AdminDashboard.jsx', () => {
      const source = fs.readFileSync('src/pages/AdminDashboard.jsx', 'utf8');
      assert.ok(!source.includes('window.confirm'), 'AdminDashboard.jsx must not contain window.confirm');
      assert.ok(!source.match(/\bconfirm\s*\(/), 'AdminDashboard.jsx must not call confirm()');
    });

    it('3.7 Zero occurrences of window.confirm in src/components/admin/AdminSettingsTab.jsx', () => {
      const source = fs.readFileSync('src/components/admin/AdminSettingsTab.jsx', 'utf8');
      assert.ok(!source.includes('window.confirm'), 'AdminSettingsTab.jsx must not contain window.confirm');
      assert.ok(!source.match(/\bconfirm\s*\(/), 'AdminSettingsTab.jsx must not call confirm()');
    });

    it('3.8 Zero occurrences of window.confirm in src/components/admin/AdminJarvisTab.jsx', () => {
      const source = fs.readFileSync('src/components/admin/AdminJarvisTab.jsx', 'utf8');
      assert.ok(!source.includes('window.confirm'), 'AdminJarvisTab.jsx must not contain window.confirm');
      assert.ok(!source.match(/\bconfirm\s*\(/), 'AdminJarvisTab.jsx must not call confirm()');
    });

    it('3.9 Zero occurrences of window.confirm in src/components/admin/AdminCustomOrdersTab.jsx', () => {
      const source = fs.readFileSync('src/components/admin/AdminCustomOrdersTab.jsx', 'utf8');
      assert.ok(!source.includes('window.confirm'), 'AdminCustomOrdersTab.jsx must not contain window.confirm');
      assert.ok(!source.match(/\bconfirm\s*\(/), 'AdminCustomOrdersTab.jsx must not call confirm()');
    });

    it('3.10 Zero occurrences of window.confirm in src/components/admin/AdminCategoriesTab.jsx', () => {
      const source = fs.readFileSync('src/components/admin/AdminCategoriesTab.jsx', 'utf8');
      assert.ok(!source.includes('window.confirm'), 'AdminCategoriesTab.jsx must not contain window.confirm');
      assert.ok(!source.match(/\bconfirm\s*\(/), 'AdminCategoriesTab.jsx must not call confirm()');
    });

    it('3.11 Zero occurrences of window.confirm in src/components/admin/AdminFranchisesTab.jsx', () => {
      const source = fs.readFileSync('src/components/admin/AdminFranchisesTab.jsx', 'utf8');
      assert.ok(!source.includes('window.confirm'), 'AdminFranchisesTab.jsx must not contain window.confirm');
      assert.ok(!source.match(/\bconfirm\s*\(/), 'AdminFranchisesTab.jsx must not call confirm()');
    });

    it('3.12 Comprehensive audit: exactly zero occurrences of window.confirm or raw confirm() in entire src/ directory', () => {
      const srcFiles = scanFiles('src', ['.js', '.jsx', '.ts', '.tsx']);
      const violations = [];

      for (const file of srcFiles) {
        const content = fs.readFileSync(file, 'utf8');
        // Check for window.confirm or calls to confirm(
        if (content.includes('window.confirm') || content.match(/\bconfirm\s*\(/)) {
          violations.push(file);
        }
      }

      assert.strictEqual(
        violations.length,
        0,
        `Found native confirm dialog occurrences in: ${violations.join(', ')}`
      );
    });

    it('3.13 Admin modules import and integrate <ConfirmDialog> component', () => {
      const requiredModules = [
        'src/pages/AdminDashboard.jsx',
        'src/components/admin/AdminSettingsTab.jsx',
        'src/components/admin/AdminJarvisTab.jsx',
        'src/components/admin/AdminCustomOrdersTab.jsx',
        'src/components/admin/AdminCategoriesTab.jsx',
        'src/components/admin/AdminFranchisesTab.jsx',
      ];

      for (const mod of requiredModules) {
        const content = fs.readFileSync(mod, 'utf8');
        assert.ok(
          content.includes('ConfirmDialog'),
          `Module ${mod} must import and use <ConfirmDialog>`
        );
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 4: R4 — WCAG 2.1 AA in Forms & Modals
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Suite 4: R4 — WCAG 2.1 AA in Forms & Modals', () => {

    it('4.1 AdminLoginModal.jsx specifies role="dialog" and aria-modal="true"', () => {
      const source = fs.readFileSync('src/components/AdminLoginModal.jsx', 'utf8');
      assert.ok(
        source.includes('role="dialog"') || source.includes("role='dialog'"),
        'AdminLoginModal must specify role="dialog"'
      );
      assert.ok(
        source.includes('aria-modal="true"') || source.includes("aria-modal='true'") || source.includes('aria-modal={true}'),
        'AdminLoginModal must specify aria-modal="true"'
      );
    });

    it('4.2 AdminLoginModal.jsx contains aria-labelledby linked to dialog title', () => {
      const source = fs.readFileSync('src/components/AdminLoginModal.jsx', 'utf8');
      assert.ok(source.includes('aria-labelledby'), 'AdminLoginModal must specify aria-labelledby');
    });

    it('4.3 AdminLoginModal.jsx implements Escape key listener for closing', () => {
      const source = fs.readFileSync('src/components/AdminLoginModal.jsx', 'utf8');
      assert.ok(
        source.includes('Escape') && (source.includes('keydown') || source.includes('onKeyDown')),
        'AdminLoginModal must listen for Escape key to close modal'
      );
    });

    it('4.4 AdminLoginModal.jsx username input specifies id, name, and autoComplete="username"', () => {
      const source = fs.readFileSync('src/components/AdminLoginModal.jsx', 'utf8');
      assert.ok(
        source.includes('autoComplete="username"') || source.includes('autocomplete="username"'),
        'Username input must have autoComplete="username"'
      );
      assert.ok(source.match(/id=["']admin-username["']/i) || source.match(/id=["']username["']/i), 'Username input must have unique id');
      assert.ok(source.match(/name=["']username["']/i), 'Username input must have name="username"');
    });

    it('4.5 AdminLoginModal.jsx password input specifies id, name, and autoComplete="current-password"', () => {
      const source = fs.readFileSync('src/components/AdminLoginModal.jsx', 'utf8');
      assert.ok(
        source.includes('autoComplete="current-password"') || source.includes('autocomplete="current-password"'),
        'Password input must have autoComplete="current-password"'
      );
      assert.ok(source.match(/id=["']admin-password["']/i) || source.match(/id=["']password["']/i), 'Password input must have unique id');
      assert.ok(source.match(/name=["']password["']/i), 'Password input must have name="password"');
    });

    it('4.6 AdminLoginModal.jsx labels specify htmlFor matching the input ids', () => {
      const source = fs.readFileSync('src/components/AdminLoginModal.jsx', 'utf8');
      assert.ok(
        source.includes('htmlFor="admin-username"') || source.includes('htmlFor="username"'),
        'Username label must have htmlFor attribute'
      );
      assert.ok(
        source.includes('htmlFor="admin-password"') || source.includes('htmlFor="password"'),
        'Password label must have htmlFor attribute'
      );
    });

    it('4.7 AdminCreatePosterTab.jsx sizes items have role="checkbox" and aria-checked', () => {
      const source = fs.readFileSync('src/components/admin/AdminCreatePosterTab.jsx', 'utf8');
      assert.ok(
        source.includes('role="checkbox"') || source.includes("role='checkbox'"),
        'Size matrix items must specify role="checkbox"'
      );
      assert.ok(
        source.includes('aria-checked'),
        'Size matrix items must specify dynamic aria-checked attribute'
      );
    });

    it('4.8 AdminCreatePosterTab.jsx sizes items have tabIndex={0}', () => {
      const source = fs.readFileSync('src/components/admin/AdminCreatePosterTab.jsx', 'utf8');
      assert.ok(
        source.includes('tabIndex={0}') || source.includes('tabIndex="0"') || source.includes("tabIndex='0'"),
        'Size matrix items must specify tabIndex={0} for keyboard focusability'
      );
    });

    it('4.9 AdminCreatePosterTab.jsx sizes items handle Space and Enter key events', () => {
      const source = fs.readFileSync('src/components/admin/AdminCreatePosterTab.jsx', 'utf8');
      const hasSpace = source.includes("' '") || source.includes('" "') || source.includes('Space');
      const hasEnter = source.includes('Enter');
      assert.ok(
        hasSpace && hasEnter,
        'Size matrix items must support both Space and Enter keys for keyboard toggling'
      );
    });

    it('4.10 AdminCreatePosterTab.jsx form inputs have associated <label htmlFor="..."> tags', () => {
      const source = fs.readFileSync('src/components/admin/AdminCreatePosterTab.jsx', 'utf8');
      assert.ok(source.includes('htmlFor="poster-title"') || source.includes('htmlFor="title"'), 'Title input must have linked label');
      assert.ok(source.includes('htmlFor="poster-category"') || source.includes('htmlFor="category"'), 'Category input must have linked label');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 5: R5 — HTTP Cache & Search Debounce
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Suite 5: R5 — HTTP Cache & Search Debounce', () => {

    it('5.1 GET /api/catalog without includeUnpublished sets Cache-Control: public, max-age=120, stale-while-revalidate=600', async () => {
      const res = await fetch(`${baseUrl}/api/catalog`);
      assert.strictEqual(res.status, 200);

      const cacheControl = res.headers.get('cache-control') || '';
      assert.ok(cacheControl.includes('public'), `Cache-Control must contain "public", got: "${cacheControl}"`);
      assert.ok(cacheControl.includes('max-age=120'), `Cache-Control must contain "max-age=120", got: "${cacheControl}"`);
      assert.ok(cacheControl.includes('stale-while-revalidate=600'), `Cache-Control must contain "stale-while-revalidate=600", got: "${cacheControl}"`);
    });

    it('5.2 GET /api/catalog?includeUnpublished=true with admin token sets Cache-Control: no-store, private', async () => {
      const res = await fetch(`${baseUrl}/api/catalog?includeUnpublished=true`, {
        headers: getAuthHeaders()
      });
      assert.strictEqual(res.status, 200);

      const cacheControl = res.headers.get('cache-control') || '';
      assert.ok(cacheControl.includes('no-store'), `Cache-Control for unpublished catalog must contain "no-store", got: "${cacheControl}"`);
      assert.ok(cacheControl.includes('private'), `Cache-Control for unpublished catalog must contain "private", got: "${cacheControl}"`);
    });

    it('5.3 AdminInventoryTab.jsx implements 300ms debounce on search filter input', () => {
      const source = fs.readFileSync('src/components/admin/AdminInventoryTab.jsx', 'utf8');

      const has300ms = source.includes('300');
      const hasDebounceLogic = source.includes('debounce') || source.includes('setTimeout') || source.includes('useDebounce');

      assert.ok(
        has300ms && hasDebounceLogic,
        'AdminInventoryTab.jsx must implement 300ms debounce timer on search filter input'
      );
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 6: R6 — Relational Category Normalization in PostgreSQL & Prisma
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Suite 6: R6 — Relational Category Normalization in PostgreSQL & Prisma', () => {
    before(async () => {
      // Guarantee zero test category pollution before checking canonical count
      await cleanTestCategories();
    });

    it('6.1 prisma/schema.prisma defines model Category with posters relation', () => {
      const schemaSource = fs.readFileSync('prisma/schema.prisma', 'utf8');

      assert.ok(schemaSource.includes('model Category'), 'prisma/schema.prisma must define model Category');
      assert.ok(schemaSource.includes('posters   Poster[]') || schemaSource.includes('posters Poster[]'), 'Category model must define posters relation');
      assert.ok(schemaSource.includes('@@map("categories")'), 'Category model must map to "categories" table');
    });

    it('6.2 prisma/schema.prisma defines Poster.category relation referencing Category.id with Cascade/Restrict', () => {
      const schemaSource = fs.readFileSync('prisma/schema.prisma', 'utf8');

      assert.ok(
        schemaSource.includes('category') &&
        schemaSource.includes('Category') &&
        schemaSource.includes('fields: [categoria]') &&
        schemaSource.includes('references: [id]'),
        'Poster model must define relation category Category @relation(fields: [categoria], references: [id])'
      );
      assert.ok(schemaSource.includes('onDelete: Restrict'), 'Relation must enforce onDelete: Restrict');
    });

    it('6.3 Migration file in prisma/migrations/ contains DDL for categories, seed, and posters_categoria_fkey', () => {
      const migrationsDir = path.resolve('prisma/migrations');
      assert.ok(fs.existsSync(migrationsDir), 'prisma/migrations directory must exist');

      const entries = fs.readdirSync(migrationsDir);
      const normalizeMigration = entries.find(e => e.includes('normalize_categories'));
      assert.ok(normalizeMigration, 'Migration directory containing "normalize_categories" must exist in prisma/migrations/');

      const migrationSqlPath = path.join(migrationsDir, normalizeMigration, 'migration.sql');
      assert.ok(fs.existsSync(migrationSqlPath), 'migration.sql must exist inside migration directory');

      const sqlContent = fs.readFileSync(migrationSqlPath, 'utf8');
      assert.ok(sqlContent.includes('CREATE TABLE') && sqlContent.includes('"categories"'), 'Must create categories table');
      assert.ok(sqlContent.includes('posters_categoria_fkey'), 'Must create foreign key constraint posters_categoria_fkey');
      assert.ok(sqlContent.includes('ON DELETE RESTRICT'), 'Constraint must be ON DELETE RESTRICT');
      assert.ok(sqlContent.includes('ON UPDATE CASCADE'), 'Constraint must be ON UPDATE CASCADE');

      // Check all 12 categories are seeded in migration
      const expectedCategories = [
        'SUPERHEROES',
        'INFANTILYDIBUJOSANIMADOS',
        'BASKETBALL_Y_FORMULA_1',
        'ANIME',
        'SERIESYPELICULAS',
        'MUSICA',
        'FUTBOL',
        'BEBIDAS_Y_BAR',
        'OBRASDEARTE',
        'VIDEO_JUEGOS',
        'AUTOS',
        'VINTAGE'
      ];
      for (const cat of expectedCategories) {
        assert.ok(sqlContent.includes(cat), `Migration SQL must seed category "${cat}"`);
      }
    });

    it('6.4 PostgreSQL categories table exists and contains exactly 12 records', async () => {
      const tables = await prisma.$queryRaw`
        SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename = 'categories';
      `;
      assert.strictEqual(tables.length, 1, 'categories table must exist in public schema');

      const categories = await prisma.$queryRaw`
        SELECT id, name FROM categories ORDER BY id ASC;
      `;
      assert.strictEqual(categories.length, 12, `categories table must contain exactly 12 records, found ${categories.length}`);

      const categoryIds = categories.map(c => c.id);
      const required = [
        'SUPERHEROES',
        'INFANTILYDIBUJOSANIMADOS',
        'BASKETBALL_Y_FORMULA_1',
        'ANIME',
        'SERIESYPELICULAS',
        'MUSICA',
        'FUTBOL',
        'BEBIDAS_Y_BAR',
        'OBRASDEARTE',
        'VIDEO_JUEGOS',
        'AUTOS',
        'VINTAGE'
      ];
      for (const req of required) {
        assert.ok(categoryIds.includes(req), `Category ${req} must exist in PostgreSQL categories table`);
      }
    });

    it('6.5 Foreign key constraint posters_categoria_fkey is active on posters table', async () => {
      const constraints = await prisma.$queryRaw`
        SELECT conname, contype, confdeltype, confupdtype
        FROM pg_constraint
        WHERE conname = 'posters_categoria_fkey';
      `;
      assert.strictEqual(constraints.length, 1, 'Constraint posters_categoria_fkey must exist in pg_constraint');
      assert.strictEqual(constraints[0].contype, 'f', 'Constraint must be of type foreign key (f)');
      assert.strictEqual(constraints[0].confdeltype, 'r', 'Constraint onDelete action must be RESTRICT (r)');
      assert.strictEqual(constraints[0].confupdtype, 'c', 'Constraint onUpdate action must be CASCADE (c)');
    });

    it('6.6 Inserting a poster with invalid category is rejected by foreign key constraint', async () => {
      const testId = crypto.randomUUID();
      let rejected = false;
      try {
        await prisma.poster.create({
          data: {
            id: testId,
            titulo: 'Póster FK Test',
            categoria: 'CATEGORIA_INEXISTENTE_99999',
            isPublished: false
          }
        });
      } catch (err) {
        rejected = err.code === 'P2003' || err.message.includes('foreign key') || err.message.includes('violates foreign key');
      } finally {
        await prisma.poster.delete({ where: { id: testId } }).catch(() => {});
      }

      assert.strictEqual(rejected, true, 'Inserting poster with non-existent category must trigger foreign key constraint violation');
    });

    it('6.7 Deleting a category with active posters is blocked by RESTRICT constraint', async () => {
      let blocked = false;
      try {
        // SUPERHEROES has active posters in the database
        await prisma.$executeRaw`DELETE FROM categories WHERE id = 'SUPERHEROES';`;
      } catch (err) {
        blocked = err.code === '23001' || err.code === '23503' || err.code === 'P2003' || err.message.includes('foreign key constraint') || err.message.includes('RESTRICT');
      }

      assert.strictEqual(blocked, true, 'Deleting a category with active posters must be blocked by ON DELETE RESTRICT');
    });

    it('6.8 services/catalogService.js synchronizes categories with prisma.category and store_settings', () => {
      const serviceSource = fs.readFileSync('services/catalogService.js', 'utf8');

      assert.ok(
        serviceSource.includes('prisma.category') || serviceSource.includes('Category'),
        'services/catalogService.js must query and mutate prisma.category'
      );
      assert.ok(
        serviceSource.includes('store_settings') || serviceSource.includes('StoreSettings') || serviceSource.includes('updateStoreSettings'),
        'services/catalogService.js must synchronize categories with store_settings for backward compatibility'
      );
    });
  });

});
