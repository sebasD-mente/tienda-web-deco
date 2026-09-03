import { prisma } from '../services/catalogService.js';
import { getJarvisApiKey } from '../services/jarvisService.js';

async function main() {
  const all = await prisma.poster.findMany({
    select: { id: true, titulo: true, embedding: true, categoria: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });
  console.log('Total posters in DB:', all.length);
  const withEmb = all.filter(p => Array.isArray(p.embedding) && p.embedding.length === 768);
  const withoutEmb = all.filter(p => !Array.isArray(p.embedding) || p.embedding.length !== 768);
  console.log('With 768d embedding:', withEmb.length);
  console.log('Without embedding (pending):', withoutEmb.length);
  if (withoutEmb.length > 0) {
    console.log('Sample without embedding (first 10):');
    withoutEmb.slice(0, 10).forEach(p => {
      console.log(` - [${p.categoria}] ${p.titulo} (ID: ${p.id})`);
    });
  }
  const key = getJarvisApiKey();
  console.log('Has Jarvis API key:', !!key, key ? `(${key.slice(0, 8)}...)` : '');
}

main().catch(console.error).finally(() => prisma.$disconnect());
