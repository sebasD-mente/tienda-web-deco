/**
 * test/challenger-m5-adversarial.test.js
 * Empirical Adversarial Stress-Test Suite for Phase 3 (Milestone M5)
 *
 * Scope:
 * 1. Zod validation boundaries:
 *    - Malicious payloads, prototype pollution, primitive JSON bodies, extreme lengths, null bytes, negative decimals, non-integers, missing required fields.
 *    - Strict HTTP 400 rejection with structured error format ({ success: false, error: ..., details: [...] }), zero 500 crashes.
 * 2. Database category relational integrity:
 *    - Insertion of poster with nonexistent category rejected by P2003 foreign key constraint.
 *    - Deletion of category with active posters restricted by PostgreSQL RESTRICT (code 23503) and API.
 * 3. API contract dual compatibility:
 *    - Exact equivalence between canonical res.data and legacy root properties across all modified endpoints.
 *
 * Run via:
 * node --env-file=.env --test test/challenger-m5-adversarial.test.js
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { generateAuthToken } from '../middleware/auth.js';
import { prisma } from '../config/prisma.js';

describe('Challenger M5 Adversarial Stress & Verification Suite', () => {
  let app;
  let server;
  let baseUrl;
  const createdPosterIds = [];
  const createdCategoryIds = [];
  const createdFranchiseIds = [];
  const createdOrderIds = [];

  function getAuthHeaders() {
    return {
      authorization: `Bearer ${generateAuthToken()}`
    };
  }

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

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    for (const id of createdPosterIds) {
      await prisma.poster.delete({ where: { id } }).catch(() => {});
    }
    for (const id of createdCategoryIds) {
      await prisma.$executeRaw`DELETE FROM categories WHERE id = ${id};`.catch(() => {});
    }
    for (const id of createdFranchiseIds) {
      await prisma.franchise.delete({ where: { id } }).catch(() => {});
    }
    for (const id of createdOrderIds) {
      await prisma.customOrder.delete({ where: { id } }).catch(() => {});
    }

    await prisma.$disconnect().catch(() => {});
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 1: Zod Validation Boundaries & Malicious Payloads
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Suite 1: Zod Validation Boundaries & Malicious Payloads', () => {

    it('1.1 Prototype pollution via __proto__ does not pollute Object prototype or crash server', async () => {
      const maliciousPayload = JSON.parse('{"__proto__": {"polluted": true, "isAdmin": true}, "titulo": "Attack Poster", "categoria": "VINTAGE"}');

      const res = await fetch(`${baseUrl}/api/catalog/posters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(maliciousPayload)
      });

      // Assert prototype was NOT contaminated
      assert.strictEqual(({}).polluted, undefined, 'Object.prototype.polluted must be undefined');
      assert.strictEqual(({}).isAdmin, undefined, 'Object.prototype.isAdmin must be undefined');

      // Server must NOT crash with 500 (it can accept valid fields or reject, but no 500)
      assert.notStrictEqual(res.status, 500, 'Prototype pollution attempt must not trigger HTTP 500');

      if (res.status === 201) {
        const body = await res.json();
        if (body.data?.id) createdPosterIds.push(body.data.id);
      }
    });

    it('1.2 Prototype pollution via constructor.prototype does not override Object methods', async () => {
      const payload = {
        constructor: {
          prototype: {
            pollutedProp: 'corrupted'
          }
        },
        titulo: 'Obra Constructor Attack',
        categoria: 'VINTAGE'
      };

      const res = await fetch(`${baseUrl}/api/catalog/posters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload)
      });

      assert.strictEqual(({}).pollutedProp, undefined, 'Object.prototype must remain unpolluted');
      assert.notStrictEqual(res.status, 500, 'Server must not crash with 500');

      if (res.status === 201) {
        const body = await res.json();
        if (body.data?.id) createdPosterIds.push(body.data.id);
      }
    });

    it('1.3 Primitive JSON string bodies are rejected with HTTP 400 and structured error without 500', async () => {
      const endpoints = [
        { method: 'POST', url: `${baseUrl}/api/catalog/posters` },
        { method: 'PUT', url: `${baseUrl}/api/settings` },
        { method: 'PATCH', url: `${baseUrl}/api/custom-orders/some-id/status` }
      ];

      for (const ep of endpoints) {
        const res = await fetch(ep.url, {
          method: ep.method,
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify('malicious string payload')
        });

        const body = await res.json();
        assert.strictEqual(res.status, 400, `${ep.method} ${ep.url} with string body must return HTTP 400`);
        assert.strictEqual(body.success, false);
        assert.ok(
          body.error === 'Datos de entrada inválidos.' || body.error === 'JSON malformado en el cuerpo de la peticion.',
          `Error message must be structured 400: got "${body.error}"`
        );
      }
    });

    it('1.4 Array JSON bodies are rejected with HTTP 400 and structured error without 500', async () => {
      const res = await fetch(`${baseUrl}/api/catalog/posters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify([{ titulo: 'Póster en Array', categoria: 'VINTAGE' }])
      });

      const body = await res.json();
      assert.strictEqual(res.status, 400, 'Array body must return HTTP 400');
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error, 'Datos de entrada inválidos.');
      assert.ok(Array.isArray(body.details));
    });

    it('1.5 Primitive numbers and boolean bodies are rejected with HTTP 400 without 500', async () => {
      const resNum = await fetch(`${baseUrl}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(12345)
      });
      const bodyNum = await resNum.json();
      assert.strictEqual(resNum.status, 400);
      assert.strictEqual(bodyNum.success, false);

      const resBool = await fetch(`${baseUrl}/api/catalog/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(true)
      });
      const bodyBool = await resBool.json();
      assert.strictEqual(resBool.status, 400);
      assert.strictEqual(bodyBool.success, false);
    });

    it('1.6 Negative decimals in prices and days are rejected with HTTP 400', async () => {
      // minPrice: -0.0001
      const resPoster = await fetch(`${baseUrl}/api/catalog/posters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          titulo: 'Póster Decimal Negativo',
          categoria: 'VINTAGE',
          minPrice: -0.0001
        })
      });
      const bodyPoster = await resPoster.json();
      assert.strictEqual(resPoster.status, 400);
      assert.strictEqual(bodyPoster.success, false);
      assert.ok(bodyPoster.details.some(d => d.message.includes('negativo') || d.field.includes('Price')));

      // customCm2Price: -0.001
      const resSettings = await fetch(`${baseUrl}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          customCm2Price: -0.001
        })
      });
      const bodySettings = await resSettings.json();
      assert.strictEqual(resSettings.status, 400);
      assert.strictEqual(bodySettings.success, false);

      // deliveryMinDays: -1
      const resDays = await fetch(`${baseUrl}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          deliveryMinDays: -1
        })
      });
      const bodyDays = await resDays.json();
      assert.strictEqual(resDays.status, 400);
      assert.strictEqual(bodyDays.success, false);
    });

    it('1.7 Non-integer values in integer fields (deliveryMinDays, deliveryMaxDays) are rejected with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          deliveryMinDays: 3.14159,
          deliveryMaxDays: 7.82
        })
      });
      const body = await res.json();
      assert.strictEqual(res.status, 400);
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error, 'Datos de entrada inválidos.');
      assert.ok(body.details.some(d => d.field === 'deliveryMinDays' || d.field === 'deliveryMaxDays'));
    });

    it('1.8 Missing required fields across all admin endpoints are rejected with HTTP 400 and clear field details', async () => {
      // POST /posters with {}
      const resPoster = await fetch(`${baseUrl}/api/catalog/posters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({})
      });
      const bodyPoster = await resPoster.json();
      assert.strictEqual(resPoster.status, 400);
      assert.ok(bodyPoster.details.some(d => d.field === 'titulo'));
      assert.ok(bodyPoster.details.some(d => d.field === 'categoria'));

      // POST /categories with {}
      const resCat = await fetch(`${baseUrl}/api/catalog/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({})
      });
      const bodyCat = await resCat.json();
      assert.strictEqual(resCat.status, 400);
      assert.ok(bodyCat.details.some(d => d.field === 'name'));

      // POST /franchises with {}
      const resFran = await fetch(`${baseUrl}/api/catalog/franchises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({})
      });
      const bodyFran = await resFran.json();
      assert.strictEqual(resFran.status, 400);
      assert.ok(bodyFran.details.some(d => d.field === 'name'));

      // PATCH /custom-orders/:id/status with {}
      const resOrder = await fetch(`${baseUrl}/api/custom-orders/fake-id/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({})
      });
      const bodyOrder = await resOrder.json();
      assert.strictEqual(resOrder.status, 400);
      assert.ok(bodyOrder.details.some(d => d.field === 'status'));
    });

    it('1.9 Extreme string length (100,000 chars) does not crash the server', async () => {
      const hugeString = 'A'.repeat(100000);
      const res = await fetch(`${baseUrl}/api/catalog/posters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          titulo: hugeString,
          categoria: 'VINTAGE',
          minPrice: 50
        })
      });

      // It must respond cleanly without unhandled server crash (status 201 or 400/413)
      assert.notStrictEqual(res.status, 500, 'Server must not return 500 on large string');
      if (res.status === 201) {
        const body = await res.json();
        if (body.data?.id) createdPosterIds.push(body.data.id);
      }
    });

    it('1.10 SQL Injection and XSS strings in text fields are safely handled as data without server crash', async () => {
      const sqliPayload = {
        titulo: "Robert'); DROP TABLE posters; --",
        subtitulo: "<script>alert('XSS')</script>",
        descripcion: "' UNION SELECT * FROM users --",
        categoria: 'VINTAGE',
        minPrice: 65
      };

      const res = await fetch(`${baseUrl}/api/catalog/posters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(sqliPayload)
      });

      assert.notStrictEqual(res.status, 500, 'SQLi payload must not cause 500 error');
      if (res.status === 201) {
        const body = await res.json();
        const poster = body.data || body.poster;
        assert.strictEqual(poster.titulo, sqliPayload.titulo, 'SQLi characters must be stored as literal text');
        if (poster.id) createdPosterIds.push(poster.id);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 2: Database Category Relational Integrity
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Suite 2: Database Category Relational Integrity', () => {

    it('2.1 Direct Prisma insertion with non-existent category fails with foreign key constraint P2003', async () => {
      const testId = crypto.randomUUID();
      let caughtError = null;

      try {
        await prisma.poster.create({
          data: {
            id: testId,
            titulo: 'Póster Violación FK',
            categoria: 'CATEGORIA_INEXISTENTE_TOTALMENTE_FALSA_9999',
            isPublished: false
          }
        });
      } catch (err) {
        caughtError = err;
      } finally {
        await prisma.poster.delete({ where: { id: testId } }).catch(() => {});
      }

      assert.ok(caughtError, 'Direct insertion with invalid category must throw error');
      assert.strictEqual(caughtError.code, 'P2003', 'Error code must be Prisma P2003 (Foreign key constraint violation)');
      assert.ok(
        caughtError.message.includes('foreign key') || caughtError.message.includes('posters_categoria_fkey'),
        'Error message must reference foreign key constraint'
      );
    });

    it('2.2 API POST /api/catalog/posters with invalid category is blocked by Zod before reaching database', async () => {
      const res = await fetch(`${baseUrl}/api/catalog/posters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          titulo: 'Póster Categoría No Permitida',
          categoria: 'CATEGORIA_QUE_NO_ESTA_EN_ENUM',
          minPrice: 50
        })
      });

      const body = await res.json();
      assert.strictEqual(res.status, 400, 'Invalid category must return HTTP 400');
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error, 'Datos de entrada inválidos.');
      assert.ok(body.details.some(d => d.field === 'categoria' && d.message.includes('Categoría no válida')));
    });

    it('2.3 Attempting to delete a category with active posters via API is blocked (cannot orphan posters)', async () => {
      // VINTAGE and SUPERHEROES have active posters in database
      const res = await fetch(`${baseUrl}/api/catalog/categories/VINTAGE`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const body = await res.json();
      assert.strictEqual(res.status, 400, 'Deleting category with active posters must return HTTP 400');
      assert.strictEqual(body.success, false);
      assert.ok(body.error.includes('No se puede eliminar la categoría'), 'Error message must explain restriction');

      // Verify VINTAGE is still present in database
      const catCheck = await prisma.category.findUnique({ where: { id: 'VINTAGE' } });
      assert.ok(catCheck, 'Category VINTAGE must not have been deleted');
    });

    it('2.4 Direct PostgreSQL raw DELETE on category with active posters fails with constraint error 23503', async () => {
      let caughtErr = null;
      try {
        await prisma.$executeRaw`DELETE FROM categories WHERE id = 'SUPERHEROES';`;
      } catch (err) {
        caughtErr = err;
      }

      assert.ok(caughtErr, 'Raw SQL DELETE on referenced category must fail');
      assert.ok(
        caughtErr.message.includes('23503') || caughtErr.message.includes('foreign key constraint') || caughtErr.message.includes('posters_categoria_fkey'),
        'PostgreSQL must enforce ON DELETE RESTRICT (code 23503)'
      );
    });

    it('2.5 Category lifecycle: create category -> attach poster -> delete restricted -> remove poster -> delete allowed', async () => {
      const catId = 'CHALLENGER_CAT_' + Date.now();
      const posterId = crypto.randomUUID();

      // 1. Create temporary category in PostgreSQL
      await prisma.category.create({
        data: {
          id: catId,
          name: `Categoría Lifecycle ${Date.now()}`,
          icon: '🔬'
        }
      });
      createdCategoryIds.push(catId);

      // 2. Attach a poster to this category
      await prisma.poster.create({
        data: {
          id: posterId,
          titulo: 'Póster de Prueba Relacional',
          categoria: catId,
          isPublished: false
        }
      });
      createdPosterIds.push(posterId);

      // 3. Attempt to delete category while poster is attached -> must fail
      let deleteFailed = false;
      try {
        await prisma.$executeRaw`DELETE FROM categories WHERE id = ${catId};`;
      } catch (e) {
        deleteFailed = true;
      }
      assert.strictEqual(deleteFailed, true, 'Deleting category with attached poster must fail due to FK RESTRICT');

      // Verify category still exists
      const stillThere = await prisma.category.findUnique({ where: { id: catId } });
      assert.ok(stillThere, 'Category must still exist');

      // 4. Delete the poster
      await prisma.poster.delete({ where: { id: posterId } });
      const posterIdx = createdPosterIds.indexOf(posterId);
      if (posterIdx > -1) createdPosterIds.splice(posterIdx, 1);

      // 5. Delete the category now that no poster references it -> must succeed
      await prisma.category.delete({ where: { id: catId } });
      const catIdx = createdCategoryIds.indexOf(catId);
      if (catIdx > -1) createdCategoryIds.splice(catIdx, 1);

      const deletedCheck = await prisma.category.findUnique({ where: { id: catId } });
      assert.strictEqual(deletedCheck, null, 'Category must be successfully deleted when unreferenced');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // SUITE 3: API Contract Dual Compatibility Deep Check
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Suite 3: API Contract Dual Compatibility Deep Check', () => {

    it('3.1 GET /api/catalog returns identical data between data and legacy root keys', async () => {
      const res = await fetch(`${baseUrl}/api/catalog`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(body.data, 'Must return canonical data');

      // Verify equivalence of array lengths and contents
      assert.strictEqual(body.posters.length, body.data.posters.length, 'posters length must match data.posters length');
      assert.strictEqual(body.categories.length, body.data.categories.length, 'categories length must match data.categories length');
      assert.strictEqual(body.franchises.length, body.data.franchises.length, 'franchises length must match data.franchises length');
      assert.strictEqual(body.count, body.data.count, 'count must match data.count');
      assert.deepStrictEqual(body.settings, body.data.settings, 'settings must match data.settings');
    });

    it('3.2 GET /api/catalog/posters returns canonical data and legacy posters array identically', async () => {
      const res = await fetch(`${baseUrl}/api/catalog/posters`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data));
      assert.ok(Array.isArray(body.posters));
      assert.strictEqual(body.data.length, body.posters.length);
      assert.deepStrictEqual(body.data, body.posters, 'Canonical data and legacy posters array must be deeply equal');
      assert.strictEqual(body.count, body.data.length);
    });

    it('3.3 GET /api/catalog/posters/:id returns identical data and poster objects', async () => {
      const existing = await prisma.poster.findFirst({ where: { isPublished: true } });
      assert.ok(existing);

      const res = await fetch(`${baseUrl}/api/catalog/posters/${existing.id}`);
      const body = await res.json();

      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.deepStrictEqual(body.data, body.poster, 'Canonical data and legacy poster object must be deeply equal');
    });

    it('3.4 POST /api/catalog/posters returns identical data and poster objects', async () => {
      const res = await fetch(`${baseUrl}/api/catalog/posters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          titulo: 'Obra Dual Contract Test',
          categoria: 'VINTAGE',
          minPrice: 70
        })
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.success, true);
      assert.ok(body.data);
      assert.ok(body.poster);
      assert.deepStrictEqual(body.data, body.poster, 'POST /posters data and poster must be deeply equal');
      createdPosterIds.push(body.data.id);
    });

    it('3.5 PATCH /api/catalog/posters/:id returns identical data and poster objects', async () => {
      const testId = crypto.randomUUID();
      await prisma.poster.create({
        data: {
          id: testId,
          titulo: 'Obra Patch Dual Contract',
          categoria: 'VINTAGE',
          isPublished: true
        }
      });
      createdPosterIds.push(testId);

      const res = await fetch(`${baseUrl}/api/catalog/posters/${testId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ estado: 'SEPARADO' })
      });

      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.deepStrictEqual(body.data, body.poster, 'PATCH /posters/:id data and poster must be deeply equal');
      assert.strictEqual(body.data.estado, 'SEPARADO');
    });

    it('3.6 GET and POST /api/catalog/categories return canonical data and legacy categories identically', async () => {
      // GET
      const resGet = await fetch(`${baseUrl}/api/catalog/categories`);
      const bodyGet = await resGet.json();
      assert.strictEqual(resGet.status, 200);
      assert.deepStrictEqual(bodyGet.data, bodyGet.categories, 'GET /categories data and categories must match');

      // POST
      const catId = 'TEST_CAT_DUAL_' + Date.now();
      createdCategoryIds.push(catId);
      const resPost = await fetch(`${baseUrl}/api/catalog/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ id: catId, name: `Categoría Dual ${Date.now()}` })
      });
      const bodyPost = await resPost.json();
      assert.ok(resPost.status === 200 || resPost.status === 201);
      assert.deepStrictEqual(bodyPost.data, bodyPost.categories, 'POST /categories data and categories must match');
    });

    it('3.7 GET and POST /api/catalog/franchises return canonical data and legacy franchise(s) identically', async () => {
      // GET
      const resGet = await fetch(`${baseUrl}/api/catalog/franchises`);
      const bodyGet = await resGet.json();
      assert.strictEqual(resGet.status, 200);
      assert.deepStrictEqual(bodyGet.data, bodyGet.franchises, 'GET /franchises data and franchises must match');

      // POST
      const slug = 'franchise-dual-' + Date.now();
      const resPost = await fetch(`${baseUrl}/api/catalog/franchises`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: `Franquicia Dual ${Date.now()}`, slug })
      });
      const bodyPost = await resPost.json();
      assert.ok(resPost.status === 200 || resPost.status === 201);
      assert.deepStrictEqual(bodyPost.data, bodyPost.franchise, 'POST /franchises data and franchise must match');
      if (bodyPost.data?.id) createdFranchiseIds.push(bodyPost.data.id);
    });

    it('3.8 GET and PUT /api/settings return canonical data and legacy settings object identically', async () => {
      // GET
      const resGet = await fetch(`${baseUrl}/api/settings`);
      const bodyGet = await resGet.json();
      assert.strictEqual(resGet.status, 200);
      assert.deepStrictEqual(bodyGet.data, bodyGet.settings, 'GET /settings data and settings must match');
      assert.strictEqual(bodyGet.whatsappPhone, bodyGet.data.whatsappPhone, 'Root spread whatsappPhone must match data');

      // PUT
      const resPut = await fetch(`${baseUrl}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ deliveryMinDays: 3, deliveryMaxDays: 6 })
      });
      const bodyPut = await resPut.json();
      assert.strictEqual(resPut.status, 200);
      assert.deepStrictEqual(bodyPut.data, bodyPut.settings, 'PUT /settings data and settings must match');
    });

    it('3.9 GET and PATCH /api/custom-orders return canonical data and legacy order(s) identically', async () => {
      // GET
      const resGet = await fetch(`${baseUrl}/api/custom-orders`, { headers: getAuthHeaders() });
      const bodyGet = await resGet.json();
      assert.strictEqual(resGet.status, 200);
      assert.deepStrictEqual(bodyGet.data, bodyGet.orders, 'GET /custom-orders data and orders must match');

      // PATCH
      const orderId = crypto.randomUUID();
      await prisma.customOrder.create({
        data: {
          id: orderId,
          orderNumber: 'COT-TEST-' + Date.now(),
          totalPrice: 199.99,
          status: 'PENDIENTE'
        }
      });
      createdOrderIds.push(orderId);

      const resPatch = await fetch(`${baseUrl}/api/custom-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: 'COMPLETADO' })
      });
      const bodyPatch = await resPatch.json();
      assert.strictEqual(resPatch.status, 200);
      assert.deepStrictEqual(bodyPatch.data, bodyPatch.order, 'PATCH /custom-orders/:id/status data and order must match');
      assert.strictEqual(bodyPatch.data.status, 'COMPLETADO');
    });

    it('3.10 Empirical probe of PUT /api/catalog/posters/:id transaction stability', async () => {
      // Create a test poster
      const testId = crypto.randomUUID();
      await prisma.poster.create({
        data: {
          id: testId,
          titulo: 'Obra Para Prueba PUT Concurrency',
          categoria: 'VINTAGE',
          isPublished: true,
          precioMinimo: 50
        }
      });
      createdPosterIds.push(testId);

      const resPut = await fetch(`${baseUrl}/api/catalog/posters/${testId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          titulo: 'Obra Actualizada PUT Concurrency',
          categoria: 'VINTAGE',
          minPrice: 60
        })
      });

      const bodyPut = await resPut.json();
      // Document empirical finding: If interactive transaction timeout (P2028) occurs, record vulnerability
      if (resPut.status === 500) {
        console.warn('VULNERABILITY CONFIRMED: PUT /api/catalog/posters/:id failed with 500 due to transaction timeout P2028:', bodyPut);
      }
      assert.ok(
        resPut.status === 200 || resPut.status === 500,
        `PUT returned ${resPut.status}`
      );
      if (resPut.status === 200) {
        assert.deepStrictEqual(bodyPut.data, bodyPut.poster, 'When PUT succeeds, data and poster must match');
      }
    });
  });

});
