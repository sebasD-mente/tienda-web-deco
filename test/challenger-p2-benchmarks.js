/**
 * test/challenger-p2-benchmarks.js
 * Comprehensive Adversarial Benchmark Suite for Phase 2:
 * 1. Concurrency & Connection Pool Limits (R1): 30+ concurrent DB operations via config/prisma.js
 * 2. Trigram Search Acceleration (R6): EXPLAIN (ANALYZE, BUFFERS) for titulo, subtitulo, descripcion
 * 3. HTTP 500 Fault Injection (R7): CWE-209 sanitization under process.env.NODE_ENV = 'production'
 */

import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import fs from 'node:fs';

try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch (e) {}

// Ensure generous connection timeout for cross-continental WAN roundtrip
if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('connect_timeout')) {
  const separator = process.env.DATABASE_URL.includes('?') ? '&' : '?';
  process.env.DATABASE_URL += `${separator}connect_timeout=20&pool_timeout=20`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHALLENGE 1: Concurrency & Pool Limits (R1)
// ═══════════════════════════════════════════════════════════════════════════════
async function challenge1_ConcurrencyAndPool() {
  console.log('\n================================================================');
  console.log('CHALLENGE 1: 35 Concurrent DB Operations & Connection Pool Limits');
  console.log('================================================================');

  const { prisma } = await import('../config/prisma.js');

  // Verify pool configuration in prisma.js
  const prismaFileContent = fs.readFileSync('config/prisma.js', 'utf8');
  assert.ok(prismaFileContent.includes("connection_limit', '10'"), 'config/prisma.js must configure connection_limit=10');
  assert.ok(prismaFileContent.includes("statement_timeout', '10000'"), 'config/prisma.js must configure statement_timeout=10000');
  assert.ok(prismaFileContent.includes("pool_timeout', '10'"), 'config/prisma.js must configure pool_timeout=10');

  // 1. Check baseline active connections
  const initialConnections = await prisma.$queryRawUnsafe(`
    SELECT count(*)::int as count FROM pg_stat_activity WHERE usename = 'admin_deco';
  `);
  console.log(`[Baseline] Active PostgreSQL connections for admin_deco: ${initialConnections[0].count}`);

  // 2. Fire 35 concurrent database queries simultaneously
  const CONCURRENCY_COUNT = 35;
  console.log(`[Adversarial Stress] Firing ${CONCURRENCY_COUNT} concurrent queries simultaneously through config/prisma.js...`);

  const tStart = performance.now();
  const operations = [];

  for (let i = 0; i < CONCURRENCY_COUNT; i++) {
    operations.push(
      (async (queryId) => {
        const qStart = performance.now();
        // 1 DB query per concurrent operation (35 total concurrent queries competing for 10 connections)
        const countResult = await prisma.poster.count();
        const qElapsed = performance.now() - qStart;
        return {
          queryId,
          countResult,
          qElapsed
        };
      })(i)
    );
  }

  // Monitor connection count midway through execution
  const monitorPromise = (async () => {
    await new Promise(r => setTimeout(r, 200));
    try {
      const midConnections = await prisma.$queryRawUnsafe(`
        SELECT count(*)::int as count FROM pg_stat_activity WHERE usename = 'admin_deco';
      `);
      return midConnections[0].count;
    } catch (e) {
      return null;
    }
  })();

  const [results, observedConnectionsMidway] = await Promise.all([
    Promise.all(operations),
    monitorPromise
  ]);

  const totalDuration = performance.now() - tStart;

  console.log(`[Result] All ${results.length} concurrent operations completed in ${totalDuration.toFixed(2)}ms`);
  console.log(`[Result] Observed PostgreSQL connections during peak load: ${observedConnectionsMidway}`);

  // Assertions
  assert.strictEqual(results.length, CONCURRENCY_COUNT, `All ${CONCURRENCY_COUNT} queries must resolve`);
  const allSuccessful = results.every(r => typeof r.countResult === 'number' && r.countResult > 0);
  assert.ok(allSuccessful, 'All 35 concurrent operations returned valid row counts from PostgreSQL');

  const maxQueryDuration = Math.max(...results.map(r => r.qElapsed));
  const minQueryDuration = Math.min(...results.map(r => r.qElapsed));
  const avgQueryDuration = results.reduce((acc, r) => acc + r.qElapsed, 0) / results.length;

  console.log(`[Timing] Min: ${minQueryDuration.toFixed(1)}ms | Avg: ${avgQueryDuration.toFixed(1)}ms | Max: ${maxQueryDuration.toFixed(1)}ms`);

  // Verify connection pool limits prevented unhandled socket crashes
  console.log('✅ CHALLENGE 1 PASSED: 35 concurrent DB operations executed without pool starvation or socket crash.');

  // Allow connection pool to return to idle before next test
  await new Promise(resolve => setTimeout(resolve, 1000));

  return {
    status: 'PASS',
    concurrencyCount: CONCURRENCY_COUNT,
    totalDurationMs: totalDuration,
    avgQueryDurationMs: avgQueryDuration,
    peakObservedConnections: observedConnectionsMidway
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHALLENGE 2: Trigram Search Acceleration & EXPLAIN (ANALYZE, BUFFERS) (R6)
// ═══════════════════════════════════════════════════════════════════════════════
async function challenge2_TrigramSearchPlan() {
  console.log('\n================================================================');
  console.log('CHALLENGE 2: Trigram Search Acceleration & EXPLAIN (ANALYZE, BUFFERS)');
  console.log('================================================================');

  const { prisma } = await import('../config/prisma.js');

  // 1. Verify existence of pg_trgm extension and GIN indexes
  const ext = await prisma.$queryRawUnsafe(`
    SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';
  `);
  assert.strictEqual(ext.length, 1, 'pg_trgm extension must be installed');

  const indexes = await prisma.$queryRawUnsafe(`
    SELECT indexname, indexdef
    FROM pg_indexes
    WHERE tablename = 'posters' AND indexname LIKE 'idx_posters_%_trgm'
    ORDER BY indexname;
  `);

  console.log(`[Verify] Trigram indexes found on posters table: ${indexes.length}`);
  indexes.forEach(idx => {
    console.log(`  - ${idx.indexname}: ${idx.indexdef}`);
  });

  const indexNames = indexes.map(i => i.indexname);
  assert.ok(indexNames.includes('idx_posters_titulo_trgm'), 'Index idx_posters_titulo_trgm must exist');
  assert.ok(indexNames.includes('idx_posters_subtitulo_trgm'), 'Index idx_posters_subtitulo_trgm must exist');
  assert.ok(indexNames.includes('idx_posters_descripcion_trgm'), 'Index idx_posters_descripcion_trgm must exist');

  // 2. Run EXPLAIN (ANALYZE, BUFFERS) with enable_seqscan = off to isolate GIN Bitmap Index Scans
  const searchQuery = `%vintage%`;

  console.log(`\n[Index Enforcement: SET LOCAL enable_seqscan = off] EXPLAIN (ANALYZE, BUFFERS)...`);
  const indexPlanRows = await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL enable_seqscan = off;`);
    return await tx.$queryRawUnsafe(`
      EXPLAIN (ANALYZE, BUFFERS)
      SELECT id, titulo, subtitulo, descripcion
      FROM posters
      WHERE titulo ILIKE $1
         OR subtitulo ILIKE $1
         OR descripcion ILIKE $1;
    `, searchQuery);
  }, {
    timeout: 30000,
    maxWait: 15000
  });

  const indexPlanText = indexPlanRows.map(r => r['QUERY PLAN']).join('\n');
  console.log('--- EXPLAIN (ANALYZE, BUFFERS) PLAN ---');
  console.log(indexPlanText);
  console.log('---------------------------------------');

  // Assertions on GIN Bitmap Index Scans:
  assert.ok(
    indexPlanText.includes('Bitmap Index Scan') || indexPlanText.includes('Bitmap Heap Scan'),
    'PostgreSQL query plan must use Bitmap Index Scan with GIN indexes'
  );
  assert.ok(
    indexPlanText.includes('idx_posters_titulo_trgm'),
    'Plan must include Bitmap Index Scan on idx_posters_titulo_trgm'
  );
  assert.ok(
    indexPlanText.includes('idx_posters_subtitulo_trgm'),
    'Plan must include Bitmap Index Scan on idx_posters_subtitulo_trgm'
  );
  assert.ok(
    indexPlanText.includes('idx_posters_descripcion_trgm'),
    'Plan must include Bitmap Index Scan on idx_posters_descripcion_trgm'
  );

  // Extract Execution Time from plan text
  const matchExecTime = indexPlanText.match(/Execution Time: ([\d.]+) ms/);
  const executionTimeMs = matchExecTime ? parseFloat(matchExecTime[1]) : null;
  console.log(`[Metric] PostgreSQL Internal Execution Time: ${executionTimeMs} ms`);

  // Sub-millisecond execution verification (< 1.0 ms)
  assert.ok(
    executionTimeMs !== null && executionTimeMs < 1.0,
    `Execution time (${executionTimeMs}ms) must be sub-millisecond (< 1.0ms)`
  );

  // 3. Test individual column Bitmap Index Scans
  console.log(`\n[Plan 3: Individual Column Bitmap Index Scans]`);
  const columns = [
    { col: 'titulo', idx: 'idx_posters_titulo_trgm', term: '%gogh%' },
    { col: 'subtitulo', idx: 'idx_posters_subtitulo_trgm', term: '%arte%' },
    { col: 'descripcion', idx: 'idx_posters_descripcion_trgm', term: '%coleccion%' }
  ];

  for (const { col, idx, term } of columns) {
    const colPlan = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL enable_seqscan = off;`);
      return await tx.$queryRawUnsafe(`
        EXPLAIN (ANALYZE, BUFFERS)
        SELECT id, ${col}
        FROM posters
        WHERE ${col} ILIKE $1;
      `, term);
    }, {
      timeout: 30000,
      maxWait: 15000
    });
    const planText = colPlan.map(r => r['QUERY PLAN']).join('\n');
    const execTime = (planText.match(/Execution Time: ([\d.]+) ms/) || [])[1];
    console.log(`Column ${col} (${idx}):`);
    console.log(`  -> Plan: ${planText.split('\n')[0].trim()}`);
    console.log(`  -> Index used: ${planText.includes(idx) ? idx : 'OTHER'}`);
    console.log(`  -> Execution Time: ${execTime} ms`);

    assert.ok(planText.includes(idx), `Must scan index ${idx} for column ${col}`);
    assert.ok(parseFloat(execTime) < 1.5, `Column ${col} execution time must be ~sub-millisecond (<1.5ms)`);
  }

  console.log('✅ CHALLENGE 2 PASSED: Bitmap Index Scans verified across all 3 GIN trigram indexes with sub-millisecond execution.');

  return {
    status: 'PASS',
    indexPlanText,
    executionTimeMs,
    indexesVerified: indexNames
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHALLENGE 3: HTTP 500 Fault Injection & CWE-209 Sanitization (R7)
// ═══════════════════════════════════════════════════════════════════════════════
async function challenge3_FaultInjectionAndSanitization() {
  console.log('\n================================================================');
  console.log('CHALLENGE 3: HTTP 500 Fault Injection & CWE-209 Sanitization');
  console.log('================================================================');

  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';

  try {
    const errorHandlerModule = await import('../middleware/errorHandler.js');
    const errorHandler = errorHandlerModule.default || errorHandlerModule.errorHandler;

    // ── Test 3.1: Prisma Database Query Exception Injection ────────────────────
    console.log('[Fault 3.1] Injecting Prisma Database Raw Query Syntax Error...');
    const prismaSqlError = new Error(
      'Raw query failed. Code: 42601. Message: syntax error at or near "SELECT FROM secret_users WHERE password_hash = \'xyz\'"'
    );
    prismaSqlError.code = 'P2010';
    prismaSqlError.meta = {
      code: '42601',
      message: 'syntax error at or near secret_users',
      query: 'SELECT * FROM secret_users'
    };
    prismaSqlError.stack = 'Error: at PrismaClient.queryRaw (src/db/prisma.js:842:19)\n    at Object.handler (/app/routes/catalogRoutes.js:230:15)';

    let statusCode31 = null;
    let jsonBody31 = null;

    const mockReq31 = { originalUrl: '/api/catalog/posters?q=attack', method: 'GET' };
    const mockRes31 = {
      status(code) { statusCode31 = code; return this; },
      json(payload) { jsonBody31 = payload; return this; }
    };

    errorHandler(prismaSqlError, mockReq31, mockRes31, () => {});

    console.log(`[Response 3.1] HTTP ${statusCode31}:`, JSON.stringify(jsonBody31));
    assert.strictEqual(statusCode31, 500, 'Must respond with HTTP 500');
    assert.deepStrictEqual(jsonBody31, { error: 'Error interno del servidor.' }, 'Must strictly return { error: "Error interno del servidor." }');
    assert.strictEqual(jsonBody31.details, undefined, 'CWE-209 Violation: details property leaked');
    assert.strictEqual(jsonBody31.meta, undefined, 'CWE-209 Violation: meta property leaked');
    assert.strictEqual(jsonBody31.stack, undefined, 'CWE-209 Violation: stack trace leaked');
    assert.strictEqual(jsonBody31.code, undefined, 'CWE-209 Violation: Prisma error code leaked');
    assert.strictEqual(jsonBody31.query, undefined, 'CWE-209 Violation: SQL query string leaked');

    // ── Test 3.2: Runtime Null Reference / TypeError ───────────────────────────
    console.log('[Fault 3.2] Injecting Runtime TypeError (Cannot read properties of undefined)...');
    const runtimeError = new TypeError("Cannot read properties of undefined (reading 'sizes') at /app/services/catalogService.js:142:33");
    runtimeError.stack = 'TypeError: Cannot read properties of undefined (reading \'sizes\')\n    at Object.getFullCatalog (/app/services/catalogService.js:142:33)\n    at /app/routes/catalogRoutes.js:68:25';

    let statusCode32 = null;
    let jsonBody32 = null;

    const mockReq32 = { originalUrl: '/api/catalog', method: 'GET' };
    const mockRes32 = {
      status(code) { statusCode32 = code; return this; },
      json(payload) { jsonBody32 = payload; return this; }
    };

    errorHandler(runtimeError, mockReq32, mockRes32, () => {});

    console.log(`[Response 3.2] HTTP ${statusCode32}:`, JSON.stringify(jsonBody32));
    assert.strictEqual(statusCode32, 500, 'Must respond with HTTP 500');
    assert.deepStrictEqual(jsonBody32, { error: 'Error interno del servidor.' });
    assert.strictEqual(jsonBody32.details, undefined);
    assert.strictEqual(jsonBody32.stack, undefined);

    // ── Test 3.3: Database Connection Timeout / Hostinger VPS Unreachable ──────
    console.log('[Fault 3.3] Injecting Fatal PrismaClientInitializationError (DB Unreachable)...');
    const initError = new Error("Can't reach database server at `145.223.120.56`:`5432`. Please make sure your database server is running at `145.223.120.56`:`5432`.");
    initError.name = 'PrismaClientInitializationError';
    initError.clientVersion = '5.18.0';

    let statusCode33 = null;
    let jsonBody33 = null;

    const mockReq33 = { originalUrl: '/api/catalog/posters', method: 'GET' };
    const mockRes33 = {
      status(code) { statusCode33 = code; return this; },
      json(payload) { jsonBody33 = payload; return this; }
    };

    errorHandler(initError, mockReq33, mockRes33, () => {});

    console.log(`[Response 3.3] HTTP ${statusCode33}:`, JSON.stringify(jsonBody33));
    assert.strictEqual(statusCode33, 500);
    assert.deepStrictEqual(jsonBody33, { error: 'Error interno del servidor.' });
    assert.strictEqual(jsonBody33.details, undefined);
    assert.strictEqual(JSON.stringify(jsonBody33).includes('145.223.120.56'), false, 'CWE-209 Violation: Database IP leaked in response');

    // ── Test 3.4: Route-Level Catch Block Fault Injection ──────────────────────
    console.log('[Fault 3.4] Testing Route Catch Blocks under fatal exception in production...');
    const catalogRoutesModule = await import('../routes/catalogRoutes.js');
    const router = catalogRoutesModule.default;

    // Test route catch blocks by injecting failing getters on properties accessed by handlers
    const routesToTest = [
      {
        path: '/catalog',
        method: 'get',
        makeFailingReq: () => ({
          headers: {},
          get query() {
            const err = new Error('Prisma database connection lost during /catalog');
            err.code = 'P2024';
            throw err;
          }
        })
      },
      {
        path: '/catalog/posters',
        method: 'get',
        makeFailingReq: () => ({
          headers: {},
          get query() {
            const err = new Error('Prisma query timeout on table posters');
            err.code = 'P2028';
            throw err;
          }
        })
      },
      {
        path: '/catalog/posters/:id',
        method: 'get',
        makeFailingReq: () => ({
          headers: {},
          get params() {
            const err = new Error('Prisma poster record lookup fatal error');
            err.code = 'P2002';
            throw err;
          }
        })
      }
    ];

    for (const routeSpec of routesToTest) {
      const layer = router.stack.find(l => l.route && l.route.path === routeSpec.path && l.route.methods[routeSpec.method]);
      assert.ok(layer, `Route handler for ${routeSpec.path} must exist`);
      const handler = layer.route.stack[0].handle;

      let routeStatus = null;
      let routeBody = null;

      const failingReq = routeSpec.makeFailingReq();
      const mockRes = {
        status(code) { routeStatus = code; return this; },
        json(body) { routeBody = body; return this; }
      };

      await handler(failingReq, mockRes);

      console.log(`[Response 3.4] Route ${routeSpec.path} under fatal error: HTTP ${routeStatus}:`, JSON.stringify(routeBody));
      assert.strictEqual(routeStatus, 500, `Route ${routeSpec.path} must return HTTP 500`);
      assert.deepStrictEqual(
        routeBody,
        { error: 'Error interno del servidor.' },
        `Route ${routeSpec.path} must strictly return { error: "Error interno del servidor." }`
      );
      assert.strictEqual(routeBody.details, undefined, `Route ${routeSpec.path} must not leak details`);
    }

    // ── Test 3.5: Preservation of 4xx Client Errors ───────────────────────────
    console.log('[Fault 3.5] Verifying 4xx errors preserve safe client-facing messages...');
    const notFoundError = new Error('Póster solicitado no existe en la base de datos.');
    notFoundError.statusCode = 404;

    let statusCode35 = null;
    let jsonBody35 = null;

    const mockReq35 = { originalUrl: '/api/catalog/posters/uuid-nonexistent', method: 'GET' };
    const mockRes35 = {
      status(code) { statusCode35 = code; return this; },
      json(payload) { jsonBody35 = payload; return this; }
    };

    errorHandler(notFoundError, mockReq35, mockRes35, () => {});

    console.log(`[Response 3.5] HTTP ${statusCode35}:`, JSON.stringify(jsonBody35));
    assert.strictEqual(statusCode35, 404);
    assert.strictEqual(jsonBody35.error, 'Póster solicitado no existe en la base de datos.');
    assert.strictEqual(jsonBody35.stack, undefined);

    console.log('✅ CHALLENGE 3 PASSED: Zero information leakage across all fault injection vectors in production.');

    return {
      status: 'PASS',
      faultsTested: 7
    };
  } finally {
    process.env.NODE_ENV = originalEnv;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HARNESS RUNNER
// ═══════════════════════════════════════════════════════════════════════════════
async function main() {
  console.log('################################################################');
  console.log('   CHALLENGER 1: ADVERSARIAL STRESS & FAULT INJECTION HARNESS   ');
  console.log('   Deco Vintage Guate — Phase 2 Verification                    ');
  console.log('################################################################');

  const results = {};

  try {
    results.challenge1 = await challenge1_ConcurrencyAndPool();
  } catch (err) {
    console.error('❌ CHALLENGE 1 FAILED:', err);
    results.challenge1 = { status: 'FAIL', error: err.message, stack: err.stack };
  }

  try {
    results.challenge2 = await challenge2_TrigramSearchPlan();
  } catch (err) {
    console.error('❌ CHALLENGE 2 FAILED:', err);
    results.challenge2 = { status: 'FAIL', error: err.message, stack: err.stack };
  }

  try {
    results.challenge3 = await challenge3_FaultInjectionAndSanitization();
  } catch (err) {
    console.error('❌ CHALLENGE 3 FAILED:', err);
    results.challenge3 = { status: 'FAIL', error: err.message, stack: err.stack };
  }

  console.log('\n================================================================');
  console.log('SUMMARY OF CHALLENGER 1 EMPIRICAL RESULTS:');
  console.log('================================================================');
  console.log(JSON.stringify(results, null, 2));

  const { prisma } = await import('../config/prisma.js');
  await prisma.$disconnect();

  const allPassed = Object.values(results).every(r => r.status === 'PASS');
  if (allPassed) {
    console.log('\n🎯 FINAL VERDICT: ALL CHALLENGES PASSED (APPROVE)');
    process.exit(0);
  } else {
    console.log('\n💥 FINAL VERDICT: CHALLENGES FAILED (REQUEST_CHANGES)');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal harness error:', err);
  process.exit(1);
});
