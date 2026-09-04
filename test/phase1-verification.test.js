/**
 * test/phase1-verification.test.js
 * Verification test suite for Phase 1 (R1 Security Hardening + R2 Performance Optimization).
 * Executed via native Node.js test runner: node --test test/phase1-verification.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Phase 1 Verification Suite — Deco Vintage Guate', () => {

  // ── R1.1 Fail-Fast in middleware/auth.js ────────────────────────────────────
  describe('R1.1: Fail-Fast Auth & Default Secret Eradication', () => {
    it('middleware/auth.js must not contain hardcoded default secret string', () => {
      const authSource = fs.readFileSync('middleware/auth.js', 'utf8');
      assert.ok(
        !authSource.includes('deco_vintage_default_jwt_secret_key_2026'),
        'Hardcoded fallback secret "deco_vintage_default_jwt_secret_key_2026" must be eradicated'
      );
    });

    it('getAuthSecret throws descriptive fatal error when ADMIN_SECRET is missing or empty', async () => {
      const { getAuthSecret } = await import('../middleware/auth.js');
      const originalSecret = process.env.ADMIN_SECRET;
      try {
        delete process.env.ADMIN_SECRET;
        assert.throws(
          () => getAuthSecret(),
          /ADMIN_SECRET/,
          'getAuthSecret must throw a fatal error mentioning ADMIN_SECRET'
        );
        process.env.ADMIN_SECRET = '   ';
        assert.throws(
          () => getAuthSecret(),
          /ADMIN_SECRET/,
          'getAuthSecret must throw a fatal error when ADMIN_SECRET is whitespace'
        );
      } finally {
        process.env.ADMIN_SECRET = originalSecret;
      }
    });

    it('generateAuthToken generates valid HMAC token and verifyAuthToken validates it', async () => {
      process.env.ADMIN_SECRET = 'test_secret_for_phase1_verification_12345';
      process.env.ADMIN_USER = 'admin_test';
      const { generateAuthToken, verifyAuthToken } = await import('../middleware/auth.js');
      const token = generateAuthToken();
      assert.ok(typeof token === 'string' && token.includes('.'), 'Token must be header.signature');
      assert.strictEqual(verifyAuthToken(token), true, 'verifyAuthToken must return true for valid token');
      assert.strictEqual(verifyAuthToken('invalid.token'), false, 'verifyAuthToken must reject forged tokens');
    });

    it('auth error messages properly refer to ADMIN_SECRET rather than legacy AUTH_SECRET', () => {
      const authSource = fs.readFileSync('middleware/auth.js', 'utf8');
      assert.ok(
        !authSource.includes('AUTH_SECRET and ADMIN_USER'),
        'Error messages must refer to ADMIN_SECRET, not AUTH_SECRET'
      );
      assert.ok(
        authSource.includes('ADMIN_SECRET and ADMIN_USER'),
        'Error messages must refer to ADMIN_SECRET and ADMIN_USER'
      );
    });
  });

  // ── R1.2 Login Rate Limiting ───────────────────────────────────────────────
  describe('R1.2: Login Rate Limiting in middleware/rateLimit.js & routes/authRoutes.js', () => {
    it('exports rateLimitLogin, recordLoginFailure, resetLoginFailures and loginRateLimiter', async () => {
      const rateLimitModule = await import('../middleware/rateLimit.js');
      assert.strictEqual(typeof rateLimitModule.rateLimitLogin, 'function');
      assert.strictEqual(typeof rateLimitModule.recordLoginFailure, 'function');
      assert.strictEqual(typeof rateLimitModule.resetLoginFailures, 'function');
      assert.strictEqual(typeof rateLimitModule.loginRateLimiter, 'function');
    });

    it('enforces 5 failed attempts limit per IP with HTTP 429 response', async () => {
      const { rateLimitLogin, recordLoginFailure, resetLoginFailures } = await import('../middleware/rateLimit.js');
      const testIp = '10.99.88.77';
      const mockReq = { ip: testIp };
      let statusCode = null;
      let jsonBody = null;
      let nextCalled = false;

      const mockRes = {
        status(code) {
          statusCode = code;
          return {
            json(body) { jsonBody = body; }
          };
        }
      };

      // Reset initial state
      resetLoginFailures(mockReq);

      // Attempt 1: should pass
      nextCalled = false;
      rateLimitLogin(mockReq, mockRes, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, true, 'First login check must call next()');

      // Record 5 failures
      for (let i = 0; i < 5; i++) {
        recordLoginFailure(mockReq);
      }

      // Attempt 6: should be blocked with 429
      nextCalled = false;
      statusCode = null;
      rateLimitLogin(mockReq, mockRes, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, false, 'Blocked request must not call next()');
      assert.strictEqual(statusCode, 429, 'Excessive failed logins must return HTTP 429');
      assert.ok(
        jsonBody?.error?.includes('Demasiados intentos'),
        'Response must contain friendly rate limit message'
      );

      // Reset failures on successful login
      resetLoginFailures(mockReq);
      nextCalled = false;
      statusCode = null;
      rateLimitLogin(mockReq, mockRes, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, true, 'After reset, next() must be called');
      assert.strictEqual(statusCode, null, 'After reset, no error status should be set');
    });

    it('routes/authRoutes.js binds rateLimitLogin middleware to POST /api/auth/login', () => {
      const authRoutesSource = fs.readFileSync('routes/authRoutes.js', 'utf8');
      assert.ok(
        authRoutesSource.includes('rateLimitLogin') && authRoutesSource.includes("router.post('/auth/login', rateLimitLogin"),
        'authRoutes.js must mount rateLimitLogin middleware on /auth/login'
      );
      assert.ok(
        authRoutesSource.includes('recordLoginFailure(req)'),
        'authRoutes.js must call recordLoginFailure on invalid credentials'
      );
      assert.ok(
        authRoutesSource.includes('resetLoginFailures(req)'),
        'authRoutes.js must call resetLoginFailures on valid credentials'
      );
    });
  });

  // ── R1.3 Path Traversal Patch in routes/catalogRoutes.js ────────────────────
  describe('R1.3: Path Traversal Patch in routes/catalogRoutes.js', () => {
    it('routes/catalogRoutes.js imports UPLOADS_DIR and implements boundary validation', () => {
      const catalogRoutesSource = fs.readFileSync('routes/catalogRoutes.js', 'utf8');
      assert.ok(
        catalogRoutesSource.includes('UPLOADS_DIR'),
        'catalogRoutes.js must import UPLOADS_DIR'
      );
      assert.ok(
        catalogRoutesSource.includes('path.relative') && catalogRoutesSource.includes('path.resolve'),
        'catalogRoutes.js must use canonical path.relative and path.resolve boundary checks'
      );
      assert.ok(
        catalogRoutesSource.includes('fs.statSync') && catalogRoutesSource.includes('.isFile()'),
        'catalogRoutes.js must verify stat.isFile() before deletion'
      );
    });

    it('rejects path traversal sequences (../, encoded %2e%2e, null bytes) with HTTP 400', () => {
      const catalogRoutesSource = fs.readFileSync('routes/catalogRoutes.js', 'utf8');
      // Assert that traversal sequences are detected and trigger error with status 400
      assert.ok(
        catalogRoutesSource.includes("rawPath.includes('..')"),
        'Must detect ".." in rawPath'
      );
      assert.ok(
        catalogRoutesSource.includes("rawPath.includes('\\0')"),
        'Must detect null bytes in rawPath'
      );
      assert.ok(
        catalogRoutesSource.includes('decodeURIComponent(rawPath)'),
        'Must decode URI component to prevent encoded traversal evasion'
      );
      assert.ok(
        catalogRoutesSource.includes('err.statusCode = 400'),
        'Traversal attempts must set statusCode 400'
      );
      assert.ok(
        catalogRoutesSource.includes('err.statusCode = 403'),
        'Out-of-boundary paths must set statusCode 403'
      );
    });
  });

  // ── R1.4 Multer Hardening in routes/customOrderRoutes.js & CustomPostersPage ──
  describe('R1.4: Multer Hardening on Custom Orders', () => {
    it('routes/customOrderRoutes.js enforces 10MB limit and 5 files max', () => {
      const customOrderRoutesSource = fs.readFileSync('routes/customOrderRoutes.js', 'utf8');
      assert.ok(
        customOrderRoutesSource.includes('10 * 1024 * 1024'),
        'File size limit must be set to 10 MB'
      );
      assert.ok(
        customOrderRoutesSource.includes('files: 5') || customOrderRoutesSource.includes('maxCount: 5'),
        'Max files limit must be set to 5'
      );
    });

    it('routes/customOrderRoutes.js validates binary signatures (magic bytes) for JPEG, PNG, WebP', () => {
      const customOrderRoutesSource = fs.readFileSync('routes/customOrderRoutes.js', 'utf8');
      assert.ok(
        customOrderRoutesSource.includes('isValidImageSignature'),
        'Must define and invoke isValidImageSignature'
      );
      assert.ok(
        customOrderRoutesSource.includes('0xFF') && customOrderRoutesSource.includes('0xD8'),
        'Must check JPEG magic bytes FF D8'
      );
      assert.ok(
        customOrderRoutesSource.includes('0x89') && customOrderRoutesSource.includes('0x50'),
        'Must check PNG magic bytes 89 50 4E 47'
      );
      assert.ok(
        customOrderRoutesSource.includes('RIFF') && customOrderRoutesSource.includes('WEBP'),
        'Must check WebP magic bytes RIFF...WEBP'
      );
    });

    it('CustomPostersPage.jsx appends files to "images" field name', () => {
      const pageSource = fs.readFileSync('src/pages/CustomPostersPage.jsx', 'utf8');
      assert.ok(
        pageSource.includes("formData.append('images', p.imageFile)"),
        'CustomPostersPage.jsx must append to images field'
      );
    });
  });

  // ── R2.1 Request Deduplication in src/utils/catalogStorage.js ───────────────
  describe('R2.1: Request Deduplication in src/utils/catalogStorage.js', () => {
    it('exports syncCatalogFromServer and syncCatalogFromApi as identical references', async () => {
      const storageModule = await import('../src/utils/catalogStorage.js');
      assert.strictEqual(typeof storageModule.syncCatalogFromServer, 'function');
      assert.strictEqual(typeof storageModule.syncCatalogFromApi, 'function');
      assert.strictEqual(
        storageModule.syncCatalogFromServer,
        storageModule.syncCatalogFromApi,
        'syncCatalogFromApi must be an alias for syncCatalogFromServer'
      );
    });

    it('shares in-flight promise during concurrent syncCatalogFromServer executions', async () => {
      const storageModule = await import('../src/utils/catalogStorage.js');
      // Fire two concurrent calls
      const p1 = storageModule.syncCatalogFromServer();
      const p2 = storageModule.syncCatalogFromServer();
      assert.strictEqual(p1, p2, 'Concurrent calls to syncCatalogFromServer must return the same Promise');
      await Promise.all([p1, p2]);
    });
  });

  // ── R2.2 Selective Projection in services/catalogService.js ─────────────────
  describe('R2.2: Selective Projection in services/catalogService.js', () => {
    it('exports POSTER_SELECT_CLIENT excluding embedding vector', async () => {
      const { POSTER_SELECT_CLIENT } = await import('../services/catalogService.js');
      assert.ok(POSTER_SELECT_CLIENT, 'POSTER_SELECT_CLIENT must be exported');
      assert.strictEqual(POSTER_SELECT_CLIENT.id, true);
      assert.strictEqual(POSTER_SELECT_CLIENT.titulo, true);
      assert.ok(POSTER_SELECT_CLIENT.sizes, 'Must include sizes relation');
      assert.ok(POSTER_SELECT_CLIENT.franchise, 'Must include franchise relation');
      assert.strictEqual(
        'embedding' in POSTER_SELECT_CLIENT,
        false,
        'POSTER_SELECT_CLIENT must NOT project the 768-float embedding column'
      );
    });

    it('getAllPosters returns poster objects without embedding property', async () => {
      const { getAllPosters, prisma } = await import('../services/catalogService.js');
      const result = await getAllPosters({ take: 2 });
      const posters = Array.isArray(result) ? result : result.posters;
      assert.ok(posters.length > 0, 'Catalog should return posters');
      for (const poster of posters) {
        assert.strictEqual(
          'embedding' in poster,
          false,
          `Poster ${poster.id} must not leak embedding vector to client`
        );
      }
      await prisma.$disconnect();
    });
  });

  // ── R2.3 Health Check Optimization in routes/jarvisRoutes.js ────────────────
  describe('R2.3: Health Check Optimization in routes/jarvisRoutes.js', () => {
    it('routes/jarvisRoutes.js imports prisma and does not invoke getAllPosters for health check', () => {
      const jarvisRoutesSource = fs.readFileSync('routes/jarvisRoutes.js', 'utf8');
      assert.ok(
        jarvisRoutesSource.includes('prisma.poster.count()'),
        'Health check must use prisma.poster.count()'
      );
      assert.ok(
        !jarvisRoutesSource.includes('getAllPosters({ includeUnpublished: true })'),
        'Health check must NOT load entire catalog with getAllPosters'
      );
    });

    it('prisma.poster.count() resolves quickly and returns integer count', async () => {
      const { prisma } = await import('../services/catalogService.js');
      // Warm query (initial remote SSL handshake over internet)
      await prisma.poster.count();
      const start = Date.now();
      const count = await prisma.poster.count();
      const elapsed = Date.now() - start;
      assert.ok(typeof count === 'number' && count >= 0, 'Posters count must be a non-negative number');
      assert.ok(elapsed < 2000, `Health check count query took ${elapsed}ms on warm connection, should be fast`);
      await prisma.$disconnect();
    });
  });

});
