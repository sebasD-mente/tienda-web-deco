import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
const posters = await prisma.poster.findMany({
  where: { categoria: 'OBRASDEARTE' },
  select: { id: true, titulo: true, subtitulo: true, imageUrl: true, thumbUrl: true }
});
console.log(JSON.stringify(posters, null, 2));
await prisma.$disconnect();
