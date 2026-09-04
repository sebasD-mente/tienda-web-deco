/**
 * test/adversarial-security-challenge.test.js
 * Adversarial empirical challenge tests by Challenger 1.
 * Tests:
 *  1. Path traversal fuzzing & boundary evasion attacks on /api/catalog/delete-image
 *  2. Rate limiting stress testing on /api/auth/login
 *  3. Fail-fast verification without ADMIN_SECRET under production environment
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import catalogRoutes from '../routes/catalogRoutes.js';
import authRoutes from '../routes/authRoutes.js';
import { generateAuthToken } from '../middleware/auth.js';
import { UPLOADS_DIR } from '../config/paths.js';
import {
  rateLimitLogin,
  recordLoginFailure,
  resetLoginFailures
} from '../middleware/rateLimit.js';

describe('Adversarial Security Challenge Suite — Challenger 1', () => {

  let server;
  let baseUrl;
  let validToken;
  const adminSecret = 'adversarial_challenger_secret_99999';

  before(async () => {
    process.env.ADMIN_SECRET = adminSecret;
    process.env.ADMIN_USER = 'admin_challenger';
    process.env.ADMIN_PASSWORD = 'super_secret_password_123';

    validToken = generateAuthToken();

    const app = express();
    app.set('trust proxy', true); // Align with server.js trust proxy setting for client IP tracking
    app.use(express.json());
    app.use('/api', catalogRoutes);
    app.use('/api', authRoutes);

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
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // CHALLENGE 1: Path Traversal Fuzzing on POST /api/catalog/delete-image
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Challenge 1: Path Traversal Fuzzing on /api/catalog/delete-image', () => {

    async function sendDeleteImage(payload, token = validToken) {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${baseUrl}/api/catalog/delete-image`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      let body;
      try {
        body = await res.json();
      } catch (e) {
        body = await res.text();
      }
      return { status: res.status, body };
    }

    it('requires authentication (401 when token missing or invalid)', async () => {
      const resNoAuth = await sendDeleteImage({ imagePath: '/posters/uploads/test.webp' }, null);
      assert.strictEqual(resNoAuth.status, 401, 'Unauthenticated request must receive 401');

      const resBadAuth = await sendDeleteImage({ imagePath: '/posters/uploads/test.webp' }, 'bad.token');
      assert.strictEqual(resBadAuth.status, 401, 'Forged token request must receive 401');
    });

    const traversalVectors = [
      { name: 'Standard relative traversal (../)', path: '/posters/uploads/../secret.txt', expectedStatus: 400 },
      { name: 'Bare relative traversal (../)', path: '../secret.txt', expectedStatus: 400 },
      { name: 'Backslash traversal (..\\)', path: '/posters/uploads/..\\secret.txt', expectedStatus: 400 },
      { name: 'Bare backslash traversal (..\\)', path: '..\\secret.txt', expectedStatus: 400 },
      { name: 'Multiple dot sequence (....//)', path: '/posters/uploads/....//secret.txt', expectedStatus: 400 },
      { name: 'URL-encoded traversal (%2e%2e%2f)', path: '/posters/uploads/%2e%2e%2fsecret.txt', expectedStatus: 400 },
      { name: 'Bare URL-encoded traversal (%2e%2e%2f)', path: '%2e%2e%2fsecret.txt', expectedStatus: 400 },
      { name: 'Null byte injection (\\0)', path: '/posters/uploads/image.webp\0.txt', expectedStatus: 400 },
      { name: 'Encoded null byte (%00)', path: '/posters/uploads/image.webp%00.txt', expectedStatus: 400 },
      { name: 'Windows drive root under prefix', path: '/posters/uploads/C:\\Windows\\System32\\cmd.exe', expectedStatus: 403 },
      { name: 'Unix root under prefix', path: '/posters/uploads//etc/passwd', expectedStatus: 403 },
      { name: 'Traversal in thumbPath field', path: '/posters/uploads/valid.webp', thumbPath: '/posters/uploads/../../etc/shadow', expectedStatus: 400 }
    ];

    for (const vector of traversalVectors) {
      it(`blocks traversal attempt: ${vector.name}`, async () => {
        const payload = vector.thumbPath 
          ? { imagePath: vector.path, thumbPath: vector.thumbPath }
          : { imagePath: vector.path };

        const res = await sendDeleteImage(payload);
        assert.strictEqual(
          res.status,
          vector.expectedStatus,
          `Vector "${vector.name}" (${vector.path}) must be rejected with ${vector.expectedStatus}. Received: ${res.status} body: ${JSON.stringify(res.body)}`
        );
      });
    }

    it('probes bare absolute paths and analyzes behavioral boundaries', async () => {
      // Probing paths without /posters/uploads/ prefix
      const bareVectors = [
        'C:\\Windows\\System32\\cmd.exe',
        '/etc/passwd',
        '\\Windows\\System32\\cmd.exe'
      ];

      for (const barePath of bareVectors) {
        const res = await sendDeleteImage({ imagePath: barePath });
        // Document empirical result:
        // When bare path is sent without /posters/uploads/ prefix, sanitizeAndValidateLocalPath returns null.
        // File is NOT deleted (protected from fs.unlinkSync), but returns 200 no-op.
        assert.ok(
          res.status === 200 || res.status === 400 || res.status === 403,
          `Bare path probe returned unexpected status: ${res.status}`
        );
      }
    });

    it('allows legitimate deletion of files strictly located inside UPLOADS_DIR', async () => {
      if (!fs.existsSync(UPLOADS_DIR)) {
        fs.mkdirSync(UPLOADS_DIR, { recursive: true });
      }
      const testFileName = `test_legit_delete_${Date.now()}.webp`;
      const fullPath = path.resolve(UPLOADS_DIR, testFileName);
      fs.writeFileSync(fullPath, 'dummy-test-image-content');

      assert.ok(fs.existsSync(fullPath), 'Test file must exist before deletion test');

      const res = await sendDeleteImage({ imagePath: `/posters/uploads/${testFileName}` });
      assert.strictEqual(res.status, 200, 'Legitimate file within UPLOADS_DIR must return 200');
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(fs.existsSync(fullPath), false, 'Legitimate file must be deleted from disk');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // CHALLENGE 2: Rate Limiting Stress Testing on POST /api/auth/login
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Challenge 2: Rate Limiting Stress Testing on POST /api/auth/login', () => {

    const testClientIp = '192.168.100.42';

    it('allows 5 failed attempts, blocks 6th with HTTP 429, and resets on valid login', async () => {
      // Step 1: Send 5 failed login attempts with bad credentials
      for (let i = 1; i <= 5; i++) {
        const res = await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Forwarded-For': testClientIp
          },
          body: JSON.stringify({
            username: 'admin_challenger',
            password: `wrong_attempt_${i}`
          })
        });

        assert.strictEqual(
          res.status,
          401,
          `Attempt ${i} should be allowed through rate limiter and return 401 Unauthorized`
        );
        const data = await res.json();
        assert.strictEqual(data.success, false);
      }

      // Step 2: Send 6th attempt (even with CORRECT credentials) -> must be blocked with HTTP 429
      const res6 = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': testClientIp
        },
        body: JSON.stringify({
          username: 'admin_challenger',
          password: 'super_secret_password_123'
        })
      });

      assert.strictEqual(
        res6.status,
        429,
        'The 6th attempt must be blocked with HTTP 429 Too Many Requests'
      );
      const data6 = await res6.json();
      assert.ok(
        data6.error && data6.error.includes('Demasiados intentos'),
        `Error message must warn about too many attempts. Received: ${data6.error}`
      );

      // Step 3: Unblock IP via resetLoginFailures
      resetLoginFailures({ ip: testClientIp });

      // Step 4: Verify IP is unblocked and can successfully login
      const resAfterReset = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': testClientIp
        },
        body: JSON.stringify({
          username: 'admin_challenger',
          password: 'super_secret_password_123'
        })
      });

      assert.strictEqual(
        resAfterReset.status,
        200,
        'After reset, login with correct credentials must succeed with HTTP 200'
      );
      const dataSuccess = await resAfterReset.json();
      assert.strictEqual(dataSuccess.success, true);
      assert.ok(dataSuccess.token, 'Must return signed auth token');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // CHALLENGE 3: Fail-Fast Verification
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Challenge 3: Fail-Fast Verification without ADMIN_SECRET', () => {

    it('running Node without ADMIN_SECRET in production triggers immediate fatal error and aborts process', () => {
      // Execute a separate Node process in production mode without ADMIN_SECRET
      // Stub process.loadEnvFile so it doesn't reload .env from the local dev folder
      const testScript = `
        process.loadEnvFile = undefined;
        delete process.env.ADMIN_SECRET;
        process.env.NODE_ENV = 'production';
        await import('./middleware/auth.js');
      `;

      const result = spawnSync('node', ['--input-type=module', '-e', testScript], {
        cwd: process.cwd(),
        env: {
          ...process.env,
          NODE_ENV: 'production',
          ADMIN_SECRET: ''
        },
        encoding: 'utf8'
      });

      assert.strictEqual(
        result.status,
        1,
        'Process must exit with fatal code 1 when ADMIN_SECRET is missing in production'
      );
      const combinedOutput = (result.stdout || '') + (result.stderr || '');
      assert.ok(
        combinedOutput.includes('FATAL') && combinedOutput.includes('ADMIN_SECRET'),
        `Output must contain fatal error message. Received: ${combinedOutput}`
      );
    });

    it('getAuthSecret throws descriptive fatal error when secret is missing', async () => {
      const { getAuthSecret } = await import('../middleware/auth.js');
      const originalSecret = process.env.ADMIN_SECRET;
      try {
        delete process.env.ADMIN_SECRET;
        assert.throws(
          () => getAuthSecret(),
          /ADMIN_SECRET/,
          'Must throw descriptive fatal error mentioning ADMIN_SECRET'
        );
      } finally {
        process.env.ADMIN_SECRET = originalSecret;
      }
    });

    it('repo-wide verification: deco_vintage_default_jwt_secret_key_2026 does not exist in any production/config file', () => {
      const filesToCheck = [
        'middleware/auth.js',
        'middleware/rateLimit.js',
        'server.js',
        'routes/authRoutes.js',
        'routes/catalogRoutes.js',
        'routes/customOrderRoutes.js',
        'routes/jarvisRoutes.js',
        'services/catalogService.js',
        'config/paths.js'
      ];

      for (const relPath of filesToCheck) {
        if (fs.existsSync(relPath)) {
          const content = fs.readFileSync(relPath, 'utf8');
          assert.strictEqual(
            content.includes('deco_vintage_default_jwt_secret_key_2026'),
            false,
            `File ${relPath} must NOT contain the default secret string!`
          );
        }
      }
    });
  });

});
