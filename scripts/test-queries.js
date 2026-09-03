import { chatWithJarvis, getJarvisApiKey, getJarvisMemory } from '../services/jarvisService.js';
import { getFullCatalog } from '../services/catalogService.js';

async function test() {
  const key = getJarvisApiKey();
  const memory = await getJarvisMemory();
  const catalog = await getFullCatalog();
  
  const testCases = [
    'tenes algo del patron?',
    'tenes cuadros del bicho?',
    'busco algo de la pulga',
    'algo de tony montana o scarface',
    'cuadros de goku'
  ];

  for (const query of testCases) {
    console.log(`\n======================================================`);
    console.log(`🔍 PROBANDO QUERY: "${query}"`);
    const start = Date.now();
    const res = await chatWithJarvis(query, [], [key], catalog, memory);
    const duration = Date.now() - start;
    console.log(`⏱️  Tiempo: ${duration}ms | Modelo: ${res.poweredBy}`);
    console.log(`💬 Respuesta: ${res.replyText}`);
    const posters = res.actions?.[0]?.posters?.map(p => `${p.title} (${p.subtitle || ''})`) || [];
    console.log(`🖼️  Obras entregadas (${posters.length}):`, posters);
  }
}

test().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
