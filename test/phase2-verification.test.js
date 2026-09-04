/**
 * test/phase2-verification.test.js
 * Comprehensive Verification Test Suite for Phase 2 (R1 to R7).
 *
 * Requirements:
 * - R1: Centralized PrismaClient Singleton & Controlled Connection Pool
 * - R2: Formal Prisma Migration Reconciliation
 * - R6: PostgreSQL pg_trgm & GIN Indexes on posters
 * - R3: Strict Privacy for Unpublished Posters
 * - R4: Eradication of Base64 Asset Storage in DB & localStorage
 * - R5: Unified Single-Pass DOM Rendering Tree in Admin Inventory
 * - R7: Global Sanitization of HTTP 500 Errors (CWE-209 Information Exposure)
 *
 * Executed via native Node.js test runner:
 * node --env-file=.env --test test/phase2-verification.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { generateAuthToken } from '../middleware/auth.js';

describe('Phase 2 Verification Suite — Deco Vintage Guate', () => {

  // ── R1: Centralized PrismaClient Singleton & Controlled Pool ───────────────
  describe('R1: Centralized PrismaClient Singleton & Connection Pool', () => {
    it('config/prisma.js exists and exports singleton prisma instance', async () => {
      const configPrisma = await import('../config/prisma.js');
      assert.ok(configPrisma.default, 'config/prisma.js must export default prisma client');
      assert.ok(configPrisma.prisma, 'config/prisma.js must export named prisma client');
      assert.strictEqual(configPrisma.default, configPrisma.prisma, 'Default and named export must refer to the exact same instance');
    });

    it('services/catalogService.js re-exports the exact same prisma singleton', async () => {
      const configPrisma = await import('../config/prisma.js');
      const catalogService = await import('../services/catalogService.js');
      assert.strictEqual(
        catalogService.prisma,
        configPrisma.prisma,
        'catalogService.prisma must be the exact same singleton instance as config/prisma.js'
      );
    });

    it('config/prisma.js configures pool constraints and timeout limits', () => {
      const prismaSource = fs.readFileSync('config/prisma.js', 'utf8');
      assert.ok(prismaSource.includes('connection_limit'), 'connection_limit parameter must be set');
      assert.ok(prismaSource.includes('pool_timeout'), 'pool_timeout parameter must be set');
      assert.ok(prismaSource.includes('connect_timeout'), 'connect_timeout parameter must be set');
      assert.ok(prismaSource.includes('statement_timeout'), 'statement_timeout parameter must be set');
      assert.ok(prismaSource.includes('10000'), 'statement_timeout must be configured to 10s');
    });

    it('zero rogue new PrismaClient() calls in services, routes, scripts, or server.js', () => {
      const targetDirs = ['services', 'routes', 'scripts'];
      const targetFiles = ['server.js'];

      const checkFile = (filePath) => {
        if (!filePath.endsWith('.js')) return;
        const content = fs.readFileSync(filePath, 'utf8');
        const matches = content.match(/new\s+PrismaClient\s*\(/g);
        if (matches) {
          assert.fail(`Rogue new PrismaClient() found in ${filePath}`);
        }
      };

      for (const dir of targetDirs) {
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          for (const file of files) {
            checkFile(path.join(dir, file));
          }
        }
      }

      for (const file of targetFiles) {
        if (fs.existsSync(file)) {
          checkFile(file);
        }
      }
    });

    it('server.js registers graceful shutdown closing idle connections and disconnecting prisma', () => {
      const serverSource = fs.readFileSync('server.js', 'utf8');
      assert.ok(
        serverSource.includes('closeIdleConnections()'),
        'server.js must call server.closeIdleConnections() during shutdown'
      );
      assert.ok(
        serverSource.includes('prisma.$disconnect()'),
        'server.js must cleanly await prisma.$disconnect() during shutdown'
      );
    });
  });

  // ── R2: Formal Prisma Migration Reconciliation ─────────────────────────────
  describe('R2: Formal Prisma Migration Reconciliation', () => {
    it('migration file 20260904183000_reconcile_schema/migration.sql exists and is populated', () => {
      const migrationPath = 'prisma/migrations/20260904183000_reconcile_schema/migration.sql';
      assert.ok(fs.existsSync(migrationPath), `Migration file must exist at ${migrationPath}`);
      const sql = fs.readFileSync(migrationPath, 'utf8');
      assert.ok(sql.includes('CREATE EXTENSION IF NOT EXISTS pg_trgm;'), 'Must enable pg_trgm extension');
      assert.ok(sql.includes('idx_posters_titulo_trgm'), 'Must create GIN index on titulo');
      assert.ok(sql.includes('idx_posters_subtitulo_trgm'), 'Must create GIN index on subtitulo');
      assert.ok(sql.includes('idx_posters_descripcion_trgm'), 'Must create GIN index on descripcion');
    });

    it('entrypoint.sh includes npx prisma migrate deploy before node server.js', () => {
      const entrypointSource = fs.readFileSync('entrypoint.sh', 'utf8');
      assert.ok(
        entrypointSource.includes('prisma migrate deploy'),
        'entrypoint.sh must execute npx prisma migrate deploy'
      );
    });

    it('database _prisma_migrations table records 20260904183000_reconcile_schema as finished', async () => {
      const { prisma } = await import('../config/prisma.js');
      const migrations = await prisma.$queryRaw`
        SELECT migration_name, finished_at, rolled_back_at
        FROM _prisma_migrations
        WHERE migration_name = '20260904183000_reconcile_schema';
      `;
      assert.ok(migrations.length > 0, 'Migration 20260904183000_reconcile_schema must be registered in _prisma_migrations');
      assert.ok(migrations[0].finished_at !== null, 'Migration finished_at timestamp must not be null');
      assert.strictEqual(migrations[0].rolled_back_at, null, 'Migration must not be rolled back');
    });
  });

  // ── R6: PostgreSQL pg_trgm & GIN Indexes on posters ───────────────────────
  describe('R6: Text Search Acceleration via pg_trgm & GIN Indexes', () => {
    it('pg_trgm extension is active in PostgreSQL', async () => {
      const { prisma } = await import('../config/prisma.js');
      const extensions = await prisma.$queryRaw`
        SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';
      `;
      assert.strictEqual(extensions.length, 1, 'pg_trgm extension must be installed in PostgreSQL');
      assert.strictEqual(extensions[0].extname, 'pg_trgm');
    });

    it('three GIN indexes exist on posters table (titulo, subtitulo, descripcion)', async () => {
      const { prisma } = await import('../config/prisma.js');
      const indexes = await prisma.$queryRaw`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'posters' AND indexname LIKE 'idx_posters_%_trgm';
      `;
      const indexNames = indexes.map(idx => idx.indexname);
      assert.ok(indexNames.includes('idx_posters_titulo_trgm'), 'idx_posters_titulo_trgm must exist');
      assert.ok(indexNames.includes('idx_posters_subtitulo_trgm'), 'idx_posters_subtitulo_trgm must exist');
      assert.ok(indexNames.includes('idx_posters_descripcion_trgm'), 'idx_posters_descripcion_trgm must exist');

      // Verify each index definition uses gin and gin_trgm_ops
      for (const idx of indexes) {
        assert.ok(idx.indexdef.includes('USING gin'), `Index ${idx.indexname} must use GIN`);
        assert.ok(idx.indexdef.includes('gin_trgm_ops'), `Index ${idx.indexname} must use gin_trgm_ops`);
      }
    });

    it('text search query executes efficiently without syntax error using trigrams', async () => {
      const { prisma } = await import('../config/prisma.js');
      const startTime = performance.now();
      const results = await prisma.poster.findMany({
        where: {
          OR: [
            { titulo: { contains: 'vintage', mode: 'insensitive' } },
            { subtitulo: { contains: 'vintage', mode: 'insensitive' } },
            { descripcion: { contains: 'vintage', mode: 'insensitive' } }
          ]
        },
        take: 10
      });
      const duration = performance.now() - startTime;
      assert.ok(Array.isArray(results), 'Query must return results array');
      assert.ok(duration < 2500, `Text search query completed in ${duration.toFixed(2)}ms`);
    });
  });

  // ── R3: Strict Privacy for Unpublished Posters ─────────────────────────────
  describe('R3: Strict Privacy for Unpublished Posters', () => {
    it('services/catalogService.js getFullCatalog defaults includeUnpublished to false', async () => {
      const { getFullCatalog } = await import('../services/catalogService.js');
      const catalogDefault = await getFullCatalog();
      const anyUnpublished = catalogDefault.posters.some(p => p.isPublished === false);
      assert.strictEqual(
        anyUnpublished,
        false,
        'Default getFullCatalog() call must not include unpublished posters'
      );
    });

    it('GET /api/catalog rejects includeUnpublished=true with HTTP 401 without admin token', async () => {
      const catalogRoutesModule = await import('../routes/catalogRoutes.js');
      const router = catalogRoutesModule.default;

      const routeLayer = router.stack.find(layer => layer.route && (layer.route.path === '/catalog' || layer.route.path === '/'));
      assert.ok(routeLayer, 'Route handler for /catalog must exist');

      const handler = routeLayer.route.stack[0].handle;

      let statusCode = null;
      let jsonResponse = null;

      const mockReq = {
        query: { includeUnpublished: 'true' },
        headers: {}
      };
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

      await handler(mockReq, mockRes);

      assert.strictEqual(statusCode, 401, 'Must reject includeUnpublished=true with HTTP 401 when unauthorized');
      assert.ok(
        jsonResponse?.error?.includes('administrador') || jsonResponse?.error?.includes('admin'),
        'Must specify admin authorization required in error message'
      );
    });

    it('GET /api/catalog allows includeUnpublished=true with valid admin token', async () => {
      const catalogRoutesModule = await import('../routes/catalogRoutes.js');
      const router = catalogRoutesModule.default;
      const routeLayer = router.stack.find(layer => layer.route && (layer.route.path === '/catalog' || layer.route.path === '/'));
      const handler = routeLayer.route.stack[0].handle;

      const validToken = generateAuthToken();
      let statusCode = null;
      let jsonResponse = null;

      const mockReq = {
        query: { includeUnpublished: 'true' },
        headers: {
          authorization: `Bearer ${validToken}`
        }
      };
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

      await handler(mockReq, mockRes);

      assert.strictEqual(statusCode, 200, 'Must allow authorized admin to query unpublished catalog');
      assert.ok(jsonResponse?.posters, 'Response must contain posters catalog');
    });

    it('GET /api/catalog/posters/:id protects unpublished posters from public clients and permits admins', async () => {
      const { prisma } = await import('../config/prisma.js');
      const catalogRoutesModule = await import('../routes/catalogRoutes.js');
      const router = catalogRoutesModule.default;
      const crypto = await import('node:crypto');

      const posterLayer = router.stack.find(layer => layer.route && layer.route.path === '/catalog/posters/:id');
      assert.ok(posterLayer, 'Route handler for /catalog/posters/:id must exist');
      const handler = posterLayer.route.stack[0].handle;

      // Create a temporary unpublished poster in PostgreSQL with valid UUID
      const testPosterId = crypto.randomUUID();
      const createdPoster = await prisma.poster.create({
        data: {
          id: testPosterId,
          titulo: 'Póster Inédito de Prueba',
          categoria: 'RETRO',
          isPublished: false
        }
      });

      try {
        // 1. Public client request without admin credentials -> expect HTTP 404
        let publicStatus = null;
        let publicJson = null;

        const publicReq = {
          params: { id: testPosterId },
          headers: {}
        };
        const publicRes = {
          status(code) {
            publicStatus = code;
            return this;
          },
          json(data) {
            publicJson = data;
            return this;
          }
        };

        await handler(publicReq, publicRes);
        assert.strictEqual(publicStatus, 404, 'Public request for unpublished poster must return HTTP 404');
        assert.ok(publicJson?.error?.includes('no encontrado') || publicJson?.error?.includes('no disponible'));

        // 2. Admin client request with valid HMAC token -> expect HTTP 200
        const validToken = generateAuthToken();
        let adminStatus = null;
        let adminJson = null;

        const adminReq = {
          params: { id: testPosterId },
          headers: {
            authorization: `Bearer ${validToken}`
          }
        };
        const adminRes = {
          status(code) {
            adminStatus = code;
            return this;
          },
          json(data) {
            adminJson = data;
            return this;
          }
        };

        await handler(adminReq, adminRes);
        assert.strictEqual(adminStatus, 200, 'Admin request for unpublished poster must return HTTP 200');
        const returnedPoster = adminJson?.poster || adminJson;
        assert.strictEqual(returnedPoster?.id, testPosterId, 'Admin response must return the requested unpublished poster');
      } finally {
        // Cleanup test poster
        await prisma.poster.delete({ where: { id: testPosterId } }).catch(() => {});
      }
    });
  });

  // ── R4: Eradication of Base64 Asset Storage ───────────────────────────────
  describe('R4: Eradication of Base64 Asset Storage', () => {
    it('database franchises table contains 0 Base64 imageUrl entries', async () => {
      const { prisma } = await import('../config/prisma.js');
      const base64Franchises = await prisma.$queryRaw`
        SELECT id, name, "imageUrl"
        FROM franchises
        WHERE "imageUrl" LIKE 'data:image/%';
      `;
      assert.strictEqual(
        base64Franchises.length,
        0,
        `Franchises table must contain 0 Base64 entries, found ${base64Franchises.length}`
      );
    });

    it('sanitizeKnowledgeForLocalStorage recursively strips data:image/ URIs across nested objects and arrays', async () => {
      const { sanitizeKnowledgeForLocalStorage } = await import('../src/data/storeKnowledge.js');
      assert.strictEqual(typeof sanitizeKnowledgeForLocalStorage, 'function', 'Must export sanitizeKnowledgeForLocalStorage');

      const mockDirtyKnowledge = {
        storeName: 'Deco Vintage',
        categories: [
          { name: 'Vintage', logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' }
        ],
        faq: [
          { q: 'Delivery?', a: 'Yes', image: 'https://storage.googleapis.com/decovintage-master-media/sample.webp' }
        ],
        promotions: [
          { banner: 'data:image/jpeg;base64,/9j/4AAQSkZJRg==' }
        ],
        nested: {
          deep: {
            pic: 'data:image/webp;base64,UklGRg==',
            cleanUrl: 'https://decovintage.online/assets/img.webp'
          }
        }
      };

      const sanitized = sanitizeKnowledgeForLocalStorage(mockDirtyKnowledge);
      const jsonSanitized = JSON.stringify(sanitized);

      assert.ok(!jsonSanitized.includes('data:image/'), 'Sanitized knowledge must not contain any data:image/ string');
      assert.ok(jsonSanitized.includes('https://storage.googleapis.com/decovintage-master-media/sample.webp'), 'Canonical URLs must be preserved');
      assert.ok(jsonSanitized.includes('https://decovintage.online/assets/img.webp'), 'Nested canonical URLs must be preserved');
      assert.strictEqual(sanitized.categories[0].logo, '', 'Base64 image in array must be replaced with empty string');
      assert.strictEqual(sanitized.nested.deep.pic, '', 'Deeply nested base64 image must be replaced with empty string');
    });

    it('AdminFranchisesTab.jsx uses apiUploadPosterImage and does not store base64 strings', () => {
      const source = fs.readFileSync('src/components/admin/AdminFranchisesTab.jsx', 'utf8');
      assert.ok(source.includes('apiUploadPosterImage'), 'AdminFranchisesTab must import and call apiUploadPosterImage');
      assert.ok(!source.includes('newFranchise.imageUrl = base64'), 'Must not assign raw base64 to newFranchise.imageUrl');
    });

    it('AdminJarvisTab.jsx uploads reference images via apiUploadPosterImage', () => {
      const source = fs.readFileSync('src/components/admin/AdminJarvisTab.jsx', 'utf8');
      assert.ok(source.includes('apiUploadPosterImage'), 'AdminJarvisTab must import and call apiUploadPosterImage');
      assert.ok(source.includes('addReferenceImage'), 'AdminJarvisTab must persist reference images via addReferenceImage');
    });
  });

  // ── R5: Unified Single-Pass DOM Tree in Admin Inventory ────────────────────
  describe('R5: Unified Single-Pass DOM Tree in Admin Inventory', () => {
    it('AdminInventoryTab.jsx renders posters in a single unified loop', () => {
      const source = fs.readFileSync('src/components/admin/AdminInventoryTab.jsx', 'utf8');
      const mapMatches = source.match(/filteredPosters\.map\s*\(\s*\(?poster/g) || [];
      assert.strictEqual(
        mapMatches.length,
        1,
        `AdminInventoryTab must contain exactly 1 poster mapping loop, found ${mapMatches.length}`
      );
    });

    it('src/index.css has replaced duplicate classes with unified responsive classes', () => {
      const cssSource = fs.readFileSync('src/index.css', 'utf8');
      assert.ok(!cssSource.includes('.admin-mobile-cards'), '.admin-mobile-cards must be removed from src/index.css');
      assert.ok(!cssSource.includes('.admin-desktop-table'), '.admin-desktop-table must be removed from src/index.css');
      assert.ok(cssSource.includes('.admin-inv-row'), '.admin-inv-row must exist in src/index.css');
      assert.ok(cssSource.includes('.admin-inv-thumb-box'), '.admin-inv-thumb-box must exist in src/index.css');
      assert.ok(cssSource.includes('.admin-inv-actions-wrapper'), '.admin-inv-actions-wrapper must exist in src/index.css');
    });

    it('AdminInventoryTab.jsx preserves all interactive handlers (edit, delete, featured, create)', () => {
      const source = fs.readFileSync('src/components/admin/AdminInventoryTab.jsx', 'utf8');
      assert.ok(source.includes('onEditPoster'), 'Must preserve onEditPoster');
      assert.ok(source.includes('onDeletePoster'), 'Must preserve onDeletePoster');
      assert.ok(source.includes('onToggleFeatured'), 'Must preserve onToggleFeatured');
      assert.ok(source.includes('onCreateNew'), 'Must preserve onCreateNew');
    });
  });

  // ── R7: Global Sanitization of HTTP 500 Errors (CWE-209) ───────────────────
  describe('R7: Global Sanitization of HTTP 500 Errors (CWE-209)', () => {
    it('middleware/errorHandler.js strictly returns generic message for status >= 500 in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        const errorHandlerModule = await import('../middleware/errorHandler.js');
        const errorHandler = errorHandlerModule.default || errorHandlerModule.errorHandler;

        const mockErr = new Error('PrismaClientKnownRequestError: SELECT * FROM posters WHERE id = $1 syntax error');
        mockErr.stack = 'Error: at PrismaClient.query (prisma/client.js:1234:56)';
        mockErr.code = 'P2002';

        let statusCode = null;
        let jsonResponse = null;

        const mockReq = { originalUrl: '/api/catalog/fail', method: 'GET' };
        const mockRes = {
          headersSent: false,
          status(code) {
            statusCode = code;
            return this;
          },
          json(data) {
            jsonResponse = data;
            return this;
          }
        };

        errorHandler(mockErr, mockReq, mockRes, () => {});

        assert.strictEqual(statusCode, 500, 'Status code must be 500');
        assert.deepStrictEqual(
          jsonResponse,
          { error: 'Error interno del servidor.' },
          'Production 500 response must strictly be { error: "Error interno del servidor." }'
        );
        assert.strictEqual(jsonResponse.details, undefined, 'Must not expose details');
        assert.strictEqual(jsonResponse.stack, undefined, 'Must not expose stack trace');
        assert.strictEqual(jsonResponse.code, undefined, 'Must not expose DB error code');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('middleware/errorHandler.js preserves client error messages for 4xx status codes in production', async () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        const errorHandlerModule = await import('../middleware/errorHandler.js');
        const errorHandler = errorHandlerModule.default || errorHandlerModule.errorHandler;

        const mockErr = new Error('Poster no encontrado');
        mockErr.statusCode = 404;

        let statusCode = null;
        let jsonResponse = null;

        const mockReq = { originalUrl: '/api/catalog/posters/999', method: 'GET' };
        const mockRes = {
          headersSent: false,
          status(code) {
            statusCode = code;
            return this;
          },
          json(data) {
            jsonResponse = data;
            return this;
          }
        };

        errorHandler(mockErr, mockReq, mockRes, () => {});

        assert.strictEqual(statusCode, 404, 'Status code must be 404');
        assert.strictEqual(
          jsonResponse.error,
          'Poster no encontrado',
          '4xx client error message must be preserved for the client'
        );
        assert.strictEqual(jsonResponse.stack, undefined, 'Stack must still be stripped');
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    it('routes catch blocks sanitize production 500 responses', () => {
      const catalogRoutesSource = fs.readFileSync('routes/catalogRoutes.js', 'utf8');
      assert.ok(
        catalogRoutesSource.includes("process.env.NODE_ENV === 'production'") &&
        catalogRoutesSource.includes("'Error interno del servidor.'"),
        'catalogRoutes.js catch blocks must sanitize 500 errors in production'
      );

      const customOrderRoutesSource = fs.readFileSync('routes/customOrderRoutes.js', 'utf8');
      assert.ok(
        customOrderRoutesSource.includes("process.env.NODE_ENV === 'production'") &&
        customOrderRoutesSource.includes("'Error interno del servidor.'"),
        'customOrderRoutes.js catch blocks must sanitize 500 errors in production'
      );
    });
  });

});
