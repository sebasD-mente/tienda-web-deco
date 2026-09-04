/**
 * scripts/enrich-poster-tags.js
 * 
 * Script seguro de mantenimiento para enriquecer las etiquetas (tags: []) 
 * de las obras del catálogo en PostgreSQL vía Prisma.
 * 
 * PROTOCOLO DE SEGURIDAD:
 * - Modo Seguro por defecto: ejecutar con `--dry-run` muestra los cambios sin tocar la BD.
 * - Solo modifica el campo `tags` de los pósters que tengan tags vacíos o incompletos.
 * - No altera IDs, imágenes, precios, descripciones ni estados.
 * - Al finalizar la ejecución real, invalida automáticamente la caché vectorial RAG.
 * 
 * USO:
 *   node scripts/enrich-poster-tags.js --dry-run   (Previsualización segura sin escribir en BD)
 *   node scripts/enrich-poster-tags.js --apply     (Aplica los cambios directamente en PostgreSQL)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapeo cultural de entidades y términos canónicos para enriquecimiento preciso
const CULTURAL_TAG_RULES = [
  {
    matches: (p) => /cristiano|ronaldo|cr7/i.test(p.titulo),
    tags: ['Cristiano Ronaldo', 'CR7', 'El Bicho', 'Fútbol', 'Real Madrid', 'Portugal', 'Champions']
  },
  {
    matches: (p) => /messi|pulga/i.test(p.titulo),
    tags: ['Lionel Messi', 'Messi', 'La Pulga', 'Fútbol', 'Argentina', 'Barcelona', 'Inter Miami', 'D10S']
  },
  {
    matches: (p) => /jordan/i.test(p.titulo),
    tags: ['Michael Jordan', 'Jordan', 'NBA', 'Chicago Bulls', 'Basketball', '23']
  },
  {
    matches: (p) => /ferrari/i.test(p.titulo),
    tags: ['Ferrari', 'Fórmula 1', 'F1', 'Scuderia Ferrari', 'Carreras', 'Autos', 'Automovilismo']
  },
  {
    matches: (p) => /red bull|bull racing/i.test(p.titulo),
    tags: ['Red Bull Racing', 'Red Bull', 'Fórmula 1', 'F1', 'Carreras', 'Autos', 'Automovilismo']
  },
  {
    matches: (p) => /checo|p[eé]rez/i.test(p.titulo),
    tags: ['Checo Pérez', 'Sergio Pérez', 'Red Bull', 'Fórmula 1', 'F1', 'Carreras', 'Autos']
  },
  {
    matches: (p) => /hamilton/i.test(p.titulo),
    tags: ['Lewis Hamilton', 'Mercedes', 'Fórmula 1', 'F1', 'Carreras', 'Autos']
  },
  {
    matches: (p) => /leclerc/i.test(p.titulo),
    tags: ['Charles Leclerc', 'Ferrari', 'Fórmula 1', 'F1', 'Carreras', 'Autos']
  },
  {
    matches: (p) => /sainz/i.test(p.titulo),
    tags: ['Carlos Sainz', 'Ferrari', 'Fórmula 1', 'F1', 'Carreras', 'Autos']
  },
  {
    matches: (p) => /verstappen/i.test(p.titulo),
    tags: ['Max Verstappen', 'Red Bull', 'Fórmula 1', 'F1', 'Carreras', 'Autos', 'Campeón']
  },
  {
    matches: (p) => /five nights|freddy/i.test(p.titulo),
    tags: ["Five Nights at Freddy's", 'FNAF', 'Freddy Fazbear', 'Videojuegos', 'Terror', 'Gamer']
  },
  {
    matches: (p) => /jack daniel/i.test(p.titulo),
    tags: ["Jack Daniel's", 'Whiskey', 'Bar', 'Bebidas', 'Old No 7', 'Vintage']
  },
  {
    matches: (p) => /mona lisa|gioconda|vinci/i.test(p.titulo),
    tags: ['La Mona Lisa', 'Leonardo da Vinci', 'Obras de Arte', 'Arte Clásico', 'Renacimiento']
  },
  {
    matches: (p) => /van gogh|noche estrellada/i.test(p.titulo),
    tags: ['Vincent van Gogh', 'La Noche Estrellada', 'Obras de Arte', 'Postimpresionismo']
  },
  {
    matches: (p) => /spider-man|spiderman/i.test(p.titulo),
    tags: ['Spider-Man', 'Hombre Araña', 'Peter Parker', 'Marvel', 'Superhéroes', 'Vengadores']
  },
  {
    matches: (p) => /iron man|ironman/i.test(p.titulo),
    tags: ['Iron Man', 'Tony Stark', 'Marvel', 'Superhéroes', 'Vengadores']
  },
  {
    matches: (p) => /batman|dark knight/i.test(p.titulo),
    tags: ['Batman', 'El Caballero de la Noche', 'Bruce Wayne', 'DC Comics', 'Gotham', 'Superhéroes']
  },
  {
    matches: (p) => /dragon ball|goku|vegeta/i.test(p.titulo),
    tags: ['Dragon Ball', 'Goku', 'DBZ', 'Anime', 'Manga', 'Saiyajin']
  },
  {
    matches: (p) => /naruto/i.test(p.titulo),
    tags: ['Naruto', 'Shippuden', 'Anime', 'Manga', 'Ninja', 'Konoha']
  },
  {
    matches: (p) => /one piece|luffy/i.test(p.titulo),
    tags: ['One Piece', 'Luffy', 'Anime', 'Manga', 'Piratas', 'Sombrero de Paja']
  },
  {
    matches: (p) => /star wars|vader/i.test(p.titulo),
    tags: ['Star Wars', 'Darth Vader', 'Cine', 'Jedi', 'Sith', 'Películas']
  }
];

function generateEnrichedTags(poster) {
  const tagSet = new Set(Array.isArray(poster.tags) ? poster.tags : []);

  // 1. Tags basados en Reglas Culturales
  for (const rule of CULTURAL_TAG_RULES) {
    if (rule.matches(poster)) {
      rule.tags.forEach(t => tagSet.add(t));
    }
  }

  // 2. Tags basados en Categoría
  const cat = poster.categoria || '';
  if (cat === 'BASKETBALL_Y_FORMULA_1') {
    if (!tagSet.has('Basketball') && !tagSet.has('NBA')) {
      tagSet.add('Fórmula 1');
      tagSet.add('Carreras');
      tagSet.add('Autos');
    }
  } else if (cat === 'FUTBOL') {
    tagSet.add('Fútbol');
    tagSet.add('Deportes');
  } else if (cat === 'SUPERHEROES') {
    tagSet.add('Superhéroes');
  } else if (cat === 'ANIME') {
    tagSet.add('Anime');
    tagSet.add('Manga');
  } else if (cat === 'VIDEO_JUEGOS') {
    tagSet.add('Videojuegos');
    tagSet.add('Gaming');
  } else if (cat === 'BEBIDAS_Y_BAR') {
    tagSet.add('Bebidas y Bar');
    tagSet.add('Vintage');
  } else if (cat === 'OBRASDEARTE') {
    tagSet.add('Obras de Arte');
    tagSet.add('Pintura Clásica');
  }

  // 3. Incluir Franquicia si existe
  if (poster.franchise && poster.franchise.name) {
    tagSet.add(poster.franchise.name);
  }

  return Array.from(tagSet);
}

async function main() {
  const isApply = process.argv.includes('--apply');
  const isDryRun = !isApply;

  console.log('===============================================================');
  console.log('  DECO VINTAGE — ENRIQUECIMIENTO SEGURO DE TAGS EN POSTGRESQL  ');
  console.log(`  MODO: ${isDryRun ? 'DRY-RUN (SIMULACIÓN SEGURA)' : 'APLICACIÓN REAL (--apply)'}`);
  console.log('===============================================================\n');

  const posters = await prisma.poster.findMany({
    include: { franchise: true },
    orderBy: { titulo: 'asc' }
  });

  console.log(`Total de obras analizadas: ${posters.length}`);

  let eligibleCount = 0;
  const updates = [];

  for (const p of posters) {
    const currentTags = Array.isArray(p.tags) ? p.tags : [];
    if (currentTags.length === 0) {
      eligibleCount++;
      const newTags = generateEnrichedTags(p);
      updates.push({
        id: p.id,
        titulo: p.titulo,
        categoria: p.categoria,
        oldTags: currentTags,
        newTags
      });
    }
  }

  console.log(`Obras con tags vacíos identificadas: ${eligibleCount}\n`);

  for (const u of updates) {
    console.log(`[${u.id}] ${u.titulo} (${u.categoria})`);
    console.log(`  -> Tags sugeridos (${u.newTags.length}): [${u.newTags.join(', ')}]`);
  }

  if (isDryRun) {
    console.log('\n[SIMULACIÓN COMPLETADA] Cero escrituras realizadas en la base de datos.');
    console.log('Para aplicar estos cambios en PostgreSQL, ejecute:');
    console.log('  node scripts/enrich-poster-tags.js --apply\n');
  } else {
    console.log('\n[APLICANDO CAMBIOS EN POSTGRESQL]...');
    for (const u of updates) {
      await prisma.poster.update({
        where: { id: u.id },
        data: { tags: u.newTags }
      });
    }
    console.log(`[EXITO] Se actualizaron los tags de ${updates.length} obras en PostgreSQL.`);

    // Invalidar caché RAG
    try {
      const { invalidateEmbeddingsCache } = await import('../services/embeddingService.js');
      invalidateEmbeddingsCache();
      console.log('[RAG] Caché vectorial en memoria invalidada exitosamente.');
    } catch (e) {}
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('Error durante la ejecución del script:', e);
  await prisma.$disconnect();
  process.exit(1);
});