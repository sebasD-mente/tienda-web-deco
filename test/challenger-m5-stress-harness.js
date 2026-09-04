/**
 * test/challenger-m5-stress-harness.js
 * Targeted Empirical Stress Harness for Milestone M5 (Iteration 2)
 *
 * Scopes:
 * 1. Scope 3: Multi-statement transaction load test on upsertPosterFromAdmin (P2028 verification)
 * 2. Scope 4: PostgreSQL foreign key constraint verification (ON DELETE RESTRICT, confdeltype='r')
 */

import { prisma } from '../config/prisma.js';
import { generateAuthToken } from '../middleware/auth.js';
import express from 'express';
import catalogRoutes from '../routes/catalogRoutes.js';
import { errorHandler } from '../middleware/errorHandler.js';

async function runHarness() {
  console.log('>>> STARTING CHALLENGER M5 ITERATION 2 STRESS HARNESS <<<');

  // --- PART 1: Database Catalog Constraint Check ---
  console.log('\n[1] Checking pg_constraint catalog for posters_categoria_fkey:');
  const constraints = await prisma.$queryRaw`
    SELECT conname, contype, confdeltype, confupdtype 
    FROM pg_constraint 
    WHERE conname = 'posters_categoria_fkey';
  `;
  console.log('Constraint details:', JSON.stringify(constraints, null, 2));

  if (!constraints.length || constraints[0].confdeltype !== 'r' || constraints[0].confupdtype !== 'c') {
    throw new Error(`Constraint verification failed: expected confdeltype='r', confupdtype='c', got: ${JSON.stringify(constraints)}`);
  }
  console.log('CONFIRMED: posters_categoria_fkey has confdeltype = "r" (RESTRICT) and confupdtype = "c" (CASCADE).');

  // --- PART 2: Express Server Setup ---
  const app = express();
  app.use(express.json());
  app.use('/api', catalogRoutes);
  app.use(errorHandler);

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${generateAuthToken()}`
  };

  // --- PART 3: Scope 3 Multi-Statement Transaction Stress ---
  console.log('\n[2] Scope 3: Testing upsertPosterFromAdmin under multi-statement load:');
  const createRes = await fetch(`${baseUrl}/api/catalog/posters`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      titulo: 'Challenger Stress Poster M5-R2',
      categoria: 'VINTAGE',
      minPrice: 50,
      availableSizes: ['MINI', 'MEDIANO']
    })
  });
  const createBody = await createRes.json();
  if (createRes.status !== 201 || !createBody.success) {
    throw new Error(`Failed to create base poster: ${JSON.stringify(createBody)}`);
  }
  const testPosterId = createBody.data.id;
  console.log(`Base poster created successfully (id: ${testPosterId})`);

  const updateCount = 5;
  const durations = [];
  let p2028Failures = 0;
  let successes = 0;

  for (let i = 1; i <= updateCount; i++) {
    const t0 = performance.now();
    const updateRes = await fetch(`${baseUrl}/api/catalog/posters/${testPosterId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        titulo: `Challenger Stress Poster Update #${i}`,
        categoria: 'VINTAGE',
        minPrice: 50 + i * 5,
        availableSizes: ['MINI', 'PEQUENO', 'MEDIANO', 'GRANDE']
      })
    });
    const duration = performance.now() - t0;
    durations.push(duration);
    const updateBody = await updateRes.json();

    if (updateRes.status === 200 && updateBody.success === true) {
      successes++;
      console.log(`  -> Update ${i}/${updateCount} SUCCESS in ${duration.toFixed(2)}ms (canonical data.id: ${updateBody.data.id})`);
    } else {
      console.error(`  -> Update ${i}/${updateCount} FAILED with status ${updateRes.status}:`, updateBody);
      if (JSON.stringify(updateBody).includes('P2028') || JSON.stringify(updateBody).includes('Transaction already closed')) {
        p2028Failures++;
      }
    }
  }

  // Cleanup test poster
  await prisma.poster.delete({ where: { id: testPosterId } });
  console.log(`Poster cleanup complete. Result: ${successes}/${updateCount} updates passed. P2028 errors: ${p2028Failures}`);
  console.log(`Duration stats: min=${Math.min(...durations).toFixed(2)}ms, max=${Math.max(...durations).toFixed(2)}ms, avg=${(durations.reduce((a,b)=>a+b,0)/durations.length).toFixed(2)}ms`);

  if (p2028Failures > 0 || successes !== updateCount) {
    throw new Error(`Scope 3 failed: ${p2028Failures} P2028 errors detected, ${successes}/${updateCount} successful`);
  }

  // --- PART 4: Scope 4 Category Foreign Key Rejection ---
  console.log('\n[3] Scope 4: Testing Category ON DELETE RESTRICT behavior:');
  
  // 4A: API deletion rejection with active posters
  const apiDelRes = await fetch(`${baseUrl}/api/catalog/categories/SUPERHEROES`, {
    method: 'DELETE',
    headers: authHeaders
  });
  const apiDelBody = await apiDelRes.json();
  console.log(`  -> API DELETE /api/catalog/categories/SUPERHEROES status: ${apiDelRes.status}`);
  console.log(`  -> API response body:`, apiDelBody);
  if (apiDelRes.status !== 400 || apiDelBody.success !== false) {
    throw new Error(`Expected HTTP 400 rejection from API, got ${apiDelRes.status}`);
  }

  // 4B: Raw PostgreSQL SQL deletion rejection with active posters
  console.log('  -> Executing raw SQL DELETE FROM categories WHERE id = \'SUPERHEROES\':');
  let rawBlocked = false;
  let rawCode = null;
  let rawMsg = null;
  try {
    await prisma.$executeRawUnsafe("DELETE FROM categories WHERE id = 'SUPERHEROES';");
  } catch (err) {
    rawBlocked = true;
    rawCode = err.code;
    rawMsg = err.message;
    console.log(`  -> Raw SQL correctly rejected by PostgreSQL! Code: ${rawCode}`);
    console.log(`  -> Error detail snippet: ${rawMsg.split('\n')[0]}`);
  }

  if (!rawBlocked) {
    throw new Error('Raw SQL DELETE was NOT blocked by PostgreSQL RESTRICT constraint!');
  }

  // 4C: Category lifecycle with zero posters (create -> delete allowed)
  console.log('  -> Testing category lifecycle with 0 posters:');
  const tempCatId = `CHALLENGER_CLEAN_${Date.now()}`;
  await prisma.$executeRawUnsafe(`INSERT INTO categories (id, name, "createdAt", "updatedAt") VALUES ('${tempCatId}', 'Temp Category ${tempCatId}', NOW(), NOW());`);
  const delEmptyRes = await fetch(`${baseUrl}/api/catalog/categories/${tempCatId}`, {
    method: 'DELETE',
    headers: authHeaders
  });
  const delEmptyBody = await delEmptyRes.json();
  console.log(`  -> API DELETE empty category status: ${delEmptyRes.status}, success: ${delEmptyBody.success}`);
  if (delEmptyRes.status !== 200 || !delEmptyBody.success) {
    throw new Error(`Failed to delete clean category: ${JSON.stringify(delEmptyBody)}`);
  }

  server.close();
  await prisma.$disconnect();
  console.log('\n>>> ALL EMPIRICAL CHALLENGER STRESS HARNESS TESTS PASSED SUCCESSFULLY <<<');
}

runHarness().catch((err) => {
  console.error('STRESS HARNESS FAILED:', err);
  process.exit(1);
});
