/**
 * scripts/sanitize-catalog-and-franchises.js
 * 
 * CIRUGÍA TÉCNICA #08: Saneamiento de Catálogo, Franquicias Oficiales & Reparación de Medios
 * 
 * Objetivos:
 * 1. Subir logos oficiales de franquicias desde public/franchises/ a Google Cloud Storage (franchises/[slug].webp).
 * 2. En PostgreSQL (Franchises):
 *    - Desvincular obras de 'porsche' y eliminar la franquicia fantasma.
 *    - Actualizar 'dc-comics' -> 'dc' con logo GCS oficial y categoría SUPERHEROES.
 *    - Upsert de franquicias oficiales: 'marvel', 'dragon-ball', 'star-wars', 'disney' con URLs GCS.
 * 3. En PostgreSQL (Posters):
 *    - Purgar pósters de prueba temporales ('prueva', 'TEST DE ALMACENAMIENTO').
 *    - Vincular todas las obras de Spider-Man e Iron Man a 'marvel'.
 *    - Vincular la obra de Batman a 'dc'.
 *    - Reparar imágenes de obras que tenían imagen duplicada/errónea (Van Gogh, Batman).
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { prisma } from '../services/catalogService.js';
import { uploadBufferToGCS, BUCKET_NAME } from '../services/gcsService.js';
import { PROJECT_ROOT } from '../config/paths.js';

console.log('═══════════════════════════════════════════════════════════════════════════════');
console.log('🛡️ INICIANDO CIRUGÍA TÉCNICA #08: SANEAMIENTO DE CATÁLOGO & FRANQUICIAS');
console.log('═══════════════════════════════════════════════════════════════════════════════\n');

async function uploadFranchiseLogos() {
  console.log('📁 1. Subiendo logos oficiales de franquicias a Google Cloud Storage...');
  
  const franchiseLogos = [
    { slug: 'dc', file: 'dc.webp' },
    { slug: 'marvel', file: 'marvel.webp' },
    { slug: 'dragon-ball', file: 'dragon-ball.webp' },
    { slug: 'star-wars', file: 'star-wars.webp' },
    { slug: 'disney', file: 'disney.webp' }
  ];

  const uploadedUrls = {};

  for (const item of franchiseLogos) {
    const localPath = path.resolve(PROJECT_ROOT, 'public/franchises', item.file);
    if (!fs.existsSync(localPath)) {
      throw new Error(`Archivo local no encontrado: ${localPath}`);
    }

    const rawBuffer = await fs.promises.readFile(localPath);
    // Optimizar a WebP
    const webpBuffer = await sharp(rawBuffer)
      .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toBuffer();

    const destPath = `franchises/${item.slug}.webp`;
    const publicUrl = await uploadBufferToGCS(webpBuffer, destPath, 'image/webp');
    uploadedUrls[item.slug] = publicUrl;
    console.log(`   ✅ Logo subido [${item.slug}]: ${publicUrl}`);
  }

  return uploadedUrls;
}

async function sanitizeFranchises(logoUrls) {
  console.log('\n🏛️ 2. Saneando tabla `franchises` en PostgreSQL...');

  // A. Desvincular obras de la franquicia fantasma 'porsche'
  const porsche = await prisma.franchise.findUnique({ where: { slug: 'porsche' } });
  if (porsche) {
    const unlinked = await prisma.poster.updateMany({
      where: { franchiseId: porsche.id },
      data: { franchiseId: null }
    });
    console.log(`   🚗 Obras de autos desvinculadas de 'porsche': ${unlinked.count}`);
    await prisma.franchise.delete({ where: { id: porsche.id } });
    console.log(`   🗑️ Franquicia fantasma 'porsche' eliminada exitosamente.`);
  } else {
    console.log(`   ⏭️ Franquicia 'porsche' ya no existía en la base de datos.`);
  }

  // B. Actualizar o crear 'dc' (migrar de 'dc-comics' si existe)
  const dcComics = await prisma.franchise.findUnique({ where: { slug: 'dc-comics' } });
  let dcFranchise;
  if (dcComics) {
    dcFranchise = await prisma.franchise.update({
      where: { id: dcComics.id },
      data: {
        slug: 'dc',
        name: 'DC Comics',
        category: 'SUPERHEROES',
        imageUrl: logoUrls['dc'] || `https://storage.googleapis.com/${BUCKET_NAME}/franchises/dc.webp`
      }
    });
    console.log(`   ✅ Franquicia 'dc-comics' renombrada y actualizada a 'dc' (DC Comics).`);
  } else {
    dcFranchise = await prisma.franchise.upsert({
      where: { slug: 'dc' },
      update: {
        name: 'DC Comics',
        category: 'SUPERHEROES',
        imageUrl: logoUrls['dc'] || `https://storage.googleapis.com/${BUCKET_NAME}/franchises/dc.webp`
      },
      create: {
        slug: 'dc',
        name: 'DC Comics',
        category: 'SUPERHEROES',
        imageUrl: logoUrls['dc'] || `https://storage.googleapis.com/${BUCKET_NAME}/franchises/dc.webp`
      }
    });
    console.log(`   ✅ Franquicia 'dc' asegurada en PostgreSQL.`);
  }

  // C. Asegurar Marvel
  const marvelFranchise = await prisma.franchise.upsert({
    where: { slug: 'marvel' },
    update: {
      name: 'Marvel',
      category: 'SUPERHEROES',
      imageUrl: logoUrls['marvel'] || `https://storage.googleapis.com/${BUCKET_NAME}/franchises/marvel.webp`
    },
    create: {
      slug: 'marvel',
      name: 'Marvel',
      category: 'SUPERHEROES',
      imageUrl: logoUrls['marvel'] || `https://storage.googleapis.com/${BUCKET_NAME}/franchises/marvel.webp`
    }
  });
  console.log(`   ✅ Franquicia 'marvel' asegurada con logo oficial GCS.`);

  // D. Asegurar Dragon Ball
  const dragonBallFranchise = await prisma.franchise.upsert({
    where: { slug: 'dragon-ball' },
    update: {
      name: 'Dragon Ball',
      category: 'ANIME',
      imageUrl: logoUrls['dragon-ball'] || `https://storage.googleapis.com/${BUCKET_NAME}/franchises/dragon-ball.webp`
    },
    create: {
      slug: 'dragon-ball',
      name: 'Dragon Ball',
      category: 'ANIME',
      imageUrl: logoUrls['dragon-ball'] || `https://storage.googleapis.com/${BUCKET_NAME}/franchises/dragon-ball.webp`
    }
  });
  console.log(`   ✅ Franquicia 'dragon-ball' asegurada con logo oficial GCS.`);

  // E. Asegurar Star Wars
  const starWarsFranchise = await prisma.franchise.upsert({
    where: { slug: 'star-wars' },
    update: {
      name: 'Star Wars',
      category: 'SERIESYPELICULAS',
      imageUrl: logoUrls['star-wars'] || `https://storage.googleapis.com/${BUCKET_NAME}/franchises/star-wars.webp`
    },
    create: {
      slug: 'star-wars',
      name: 'Star Wars',
      category: 'SERIESYPELICULAS',
      imageUrl: logoUrls['star-wars'] || `https://storage.googleapis.com/${BUCKET_NAME}/franchises/star-wars.webp`
    }
  });
  console.log(`   ✅ Franquicia 'star-wars' asegurada con logo oficial GCS.`);

  // F. Asegurar Disney
  const disneyFranchise = await prisma.franchise.upsert({
    where: { slug: 'disney' },
    update: {
      name: 'Disney',
      category: 'INFANTILYDIBUJOSANIMADOS',
      imageUrl: logoUrls['disney'] || `https://storage.googleapis.com/${BUCKET_NAME}/franchises/disney.webp`
    },
    create: {
      slug: 'disney',
      name: 'Disney',
      category: 'INFANTILYDIBUJOSANIMADOS',
      imageUrl: logoUrls['disney'] || `https://storage.googleapis.com/${BUCKET_NAME}/franchises/disney.webp`
    }
  });
  console.log(`   ✅ Franquicia 'disney' asegurada con logo oficial GCS.`);

  return {
    dc: dcFranchise,
    marvel: marvelFranchise,
    dragonBall: dragonBallFranchise,
    starWars: starWarsFranchise,
    disney: disneyFranchise
  };
}

async function sanitizePosters(franchises) {
  console.log('\n🎨 3. Saneando obras y relaciones en PostgreSQL...');

  // A. Purgar pósters temporales de prueba
  const testPosters = await prisma.poster.findMany({
    where: {
      OR: [
        { titulo: { equals: 'prueva', mode: 'insensitive' } },
        { titulo: { equals: 'TEST DE ALMACENAMIENTO', mode: 'insensitive' } }
      ]
    }
  });

  if (testPosters.length > 0) {
    const testIds = testPosters.map(p => p.id);
    await prisma.posterSize.deleteMany({ where: { posterId: { in: testIds } } });
    await prisma.poster.deleteMany({ where: { id: { in: testIds } } });
    console.log(`   🗑️ ${testPosters.length} pósters de prueba purgados correctamente.`);
  } else {
    console.log(`   ⏭️ No se encontraron pósters de prueba huérfanos.`);
  }

  // B. Vincular obras de Spider-Man e Iron Man a 'marvel'
  const marvelPosters = await prisma.poster.updateMany({
    where: {
      OR: [
        { titulo: { contains: 'Spider', mode: 'insensitive' } },
        { titulo: { contains: 'Miles Morales', mode: 'insensitive' } },
        { titulo: { contains: 'Iron Man', mode: 'insensitive' } },
        { legacyId: { contains: 'spiderman' } },
        { legacyId: { contains: 'iron-man' } }
      ]
    },
    data: {
      franchiseId: franchises.marvel.id
    }
  });
  console.log(`   🕷️/🤖 Obras vinculadas a franquicia 'marvel': ${marvelPosters.count}`);

  // C. Vincular obra de Batman a 'dc'
  const batmanPosters = await prisma.poster.updateMany({
    where: {
      OR: [
        { titulo: { contains: 'Batman', mode: 'insensitive' } },
        { legacyId: { contains: 'batman' } }
      ]
    },
    data: {
      franchiseId: franchises.dc.id
    }
  });
  console.log(`   🦇 Obras vinculadas a franquicia 'dc': ${batmanPosters.count}`);

  // D. Reparar imágenes de obras afectadas
  console.log('\n🖼️ 4. Reparando imágenes de obras con artes específicos en GCS...');

  // 1. Batman The Dark Knight Retro Art
  const batmanArtworkPath = path.resolve('C:/Users/sebas/.gemini/antigravity-ide/brain/59204f18-98d0-4b6e-84db-a4acfeab8e83/batman_dark_knight_art_1788275279624.jpg');
  if (fs.existsSync(batmanArtworkPath)) {
    const rawBatman = await fs.promises.readFile(batmanArtworkPath);
    const fullWebp = await sharp(rawBatman).resize(1400, 1400, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 86 }).toBuffer();
    const thumbWebp = await sharp(rawBatman).resize(480, 480, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();

    const [fullUrl, thumbUrl] = await Promise.all([
      uploadBufferToGCS(fullWebp, 'posters/full/batman-dark-knight-retro-art-1787885238498.webp', 'image/webp'),
      uploadBufferToGCS(thumbWebp, 'posters/thumb/batman-dark-knight-retro-art-1787885238498.webp', 'image/webp')
    ]);

    await prisma.poster.updateMany({
      where: { legacyId: 'batman-dark-knight-retro-art-1787885238498' },
      data: { imageUrl: fullUrl, thumbUrl: thumbUrl }
    });
    console.log(`   ✅ Arte de Batman The Dark Knight actualizado a obra única en GCS.`);
  }

  // 2. Van Gogh: Noche Estrellada sobre el Ródano (1c871d25-2a9d-499d-866c-3781d6cc4fa7)
  const rhoneLocalPath = path.resolve(PROJECT_ROOT, 'public/posters/uploads/full/van-gogh-2098-2112.webp');
  if (fs.existsSync(rhoneLocalPath)) {
    const rawRhone = await fs.promises.readFile(rhoneLocalPath);
    const fullWebp = await sharp(rawRhone).resize(1400, 1400, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 86 }).toBuffer();
    const thumbWebp = await sharp(rawRhone).resize(480, 480, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();

    const [fullUrl, thumbUrl] = await Promise.all([
      uploadBufferToGCS(fullWebp, 'posters/full/van-gogh-noche-estrellada-rodano.webp', 'image/webp'),
      uploadBufferToGCS(thumbWebp, 'posters/thumb/van-gogh-noche-estrellada-rodano.webp', 'image/webp')
    ]);

    await prisma.poster.update({
      where: { id: '1c871d25-2a9d-499d-866c-3781d6cc4fa7' },
      data: {
        imageUrl: fullUrl,
        thumbUrl: thumbUrl,
        legacyId: 'van-gogh-noche-estrellada-rodano'
      }
    });
    console.log(`   ✅ Obra "Van Gogh - Noche Estrellada sobre el Ródano" reparada con arte único en GCS.`);
  }

  // 3. Van Gogh: Los Girasoles (e40d6394-f185-42d5-a4d9-b5dd5713a104)
  const sunflowersArtworkPath = path.resolve('C:/Users/sebas/.gemini/antigravity-ide/brain/59204f18-98d0-4b6e-84db-a4acfeab8e83/van_gogh_girasoles_canvas_1788275300305.jpg');
  if (fs.existsSync(sunflowersArtworkPath)) {
    const rawSunflowers = await fs.promises.readFile(sunflowersArtworkPath);
    const fullWebp = await sharp(rawSunflowers).resize(1400, 1400, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 86 }).toBuffer();
    const thumbWebp = await sharp(rawSunflowers).resize(480, 480, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();

    const [fullUrl, thumbUrl] = await Promise.all([
      uploadBufferToGCS(fullWebp, 'posters/full/van-gogh-los-girasoles.webp', 'image/webp'),
      uploadBufferToGCS(thumbWebp, 'posters/thumb/van-gogh-los-girasoles.webp', 'image/webp')
    ]);

    await prisma.poster.update({
      where: { id: 'e40d6394-f185-42d5-a4d9-b5dd5713a104' },
      data: {
        imageUrl: fullUrl,
        thumbUrl: thumbUrl,
        legacyId: 'van-gogh-los-girasoles'
      }
    });
    console.log(`   ✅ Obra "Van Gogh - Los Girasoles" reparada con arte único en GCS.`);
  }
}

async function main() {
  const startTime = Date.now();
  try {
    const logoUrls = await uploadFranchiseLogos();
    const franchises = await sanitizeFranchises(logoUrls);
    await sanitizePosters(franchises);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('\n═══════════════════════════════════════════════════════════════════════════════');
    console.log(`✨ CIRUGÍA TÉCNICA #08 COMPLETADA CON ÉXITO EN ${elapsed}s`);
    console.log('═══════════════════════════════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('💥 Error durante la ejecución de la cirugía:', err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
