import { findSimilarPosters } from '../services/embeddingService.js';
import { chatWithJarvis, getJarvisApiKey, getJarvisMemory } from '../services/jarvisService.js';
import { getFullCatalog, prisma } from '../services/catalogService.js';

async function testQuery(userQuery) {
  console.log(`\n======================================================`);
  console.log(`🔍 PROBANDO CONSULTA: "${userQuery}"`);
  console.log(`======================================================`);
  
  const matches = await findSimilarPosters(userQuery, 4);
  console.log(`📦 Obras recuperadas por RAG Híbrido (${matches.length}):`);
  matches.forEach((m, idx) => {
    console.log(`  ${idx + 1}. [Score: ${m.score.toFixed(3)}] ${m.poster.title} (${m.poster.category}) - ${m.poster.priceDisplay}`);
  });

  const liveCatalog = await getFullCatalog();
  const jarvisMemory = await getJarvisMemory();
  const apiKey = getJarvisApiKey();

  const response = await chatWithJarvis(userQuery, [], [apiKey], liveCatalog, jarvisMemory);
  console.log(`\n🤖 RESPUESTA DE J.A.R.V.I.S. (${response.poweredBy}):`);
  console.log(`Texto:\n${response.replyText}`);
  if (response.actions && response.actions.length > 0) {
    console.log(`\nAcciones ejecutadas (${response.actions.length}):`, JSON.stringify(response.actions, null, 2));
  }
}

async function runAllTests() {
  await testQuery('¿Tienen cuadros de Mario Bros o Princesa Peach?');
  await testQuery('Quiero ver pósters de Sonic');
  await testQuery('Muéstrame opciones de Rayo McQueen');
  await testQuery('¿Qué tienen de Elsa y Frozen?');
}

runAllTests()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
