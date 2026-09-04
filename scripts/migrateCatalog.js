/**
 * scripts/migrateCatalog.js
 * Script de migración de datos — UN SOLO USO
 *
 * Lee el catálogo JSON y lo inserta en PostgreSQL via Prisma.
 * Es idempotente: usa upsert basado en legacyId, no falla si ya existe.
 *
 * Ejecución:
 *   node --env-file=.env scripts/migrateCatalog.js
 *
 * Prerrequisitos:
 *   1. DATABASE_URL configurada en .env
 *   2. npx prisma migrate deploy (tablas creadas en la BD)
 *   3. npx prisma generate (cliente generado)
 */

import { prisma } from '../config/prisma.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

// ── Configuración ─────────────────────────────────────────────────────────────
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ← Cambia esta ruta si tu JSON está en otro lugar
const CATALOG_PATH = path.resolve(__dirname, '../data/catalogStore.json');

// ── Tabla de precios base por tamaño (para posters con availableSizes) ────────
// Refleja los precios estándar del catálogo actual
const DEFAULT_SIZE_CATALOG = {
  MINI:         { nombre: 'Mini',      dimensiones: '14 x 21 cm', anchoCm: 14,  altoCm: 21,  precio: 25,  badge: 'Ideal para coleccionar y escritorios' },
  PEQUENO:      { nombre: 'Pequeño',   dimensiones: '21 x 27 cm', anchoCm: 21,  altoCm: 27,  precio: 35,  badge: 'Espacios reducidos y cabeceras' },
  MEDIANO:      { nombre: 'Mediano',   dimensiones: '30 x 45 cm', anchoCm: 30,  altoCm: 45,  precio: 65,  badge: '⭐ El más vendido para habitaciones' },
  GRANDE:       { nombre: 'Grande',    dimensiones: '45 x 60 cm', anchoCm: 45,  altoCm: 60,  precio: 125, badge: 'Protagonista para salas y oficinas' },
  GIGANTE:      { nombre: 'Gigante',   dimensiones: '60 x 100 cm', anchoCm: 60, altoCm: 100, precio: 210, badge: 'Impacto visual monumental' },
  PERSONALIZADO:{ nombre: 'Personalizado', dimensiones: 'A convenir', anchoCm: null, altoCm: null, precio: 250, badge: 'Medida especial negociada' },
};

// Tamaños del JSON que no están en nuestro enum — se mapean a PERSONALIZADO
const SIZE_FALLBACK_MAP = {
  PORTADA_ALBUM: 'PERSONALIZADO',
};

// ── Mapeo de categorías ───────────────────────────────────────────────────────
// Garantiza que el valor del JSON coincida con el enum de Prisma
const VALID_CATEGORIES = new Set([
  'AUTOS', 'SUPERHEROES', 'ANIME', 'MUSICA',
  'SERIESYPELICULAS', 'OBRASDEARTE', 'INFANTILYDIBUJOSANIMADOS', 'CINE',
]);

function mapCategory(raw) {
  if (!raw) return 'OBRASDEARTE'; // fallback seguro
  const upper = raw.toUpperCase().trim();
  if (VALID_CATEGORIES.has(upper)) return upper;
  console.warn(`  ⚠ Categoría desconocida "${raw}" → usando OBRASDEARTE`);
  return 'OBRASDEARTE';
}

// ── Construye el array de PosterSize a partir de cualquier formato del JSON ───
function buildSizes(poster) {
  const sizesData = [];

  // FORMATO A: Array `sizes` con info completa (los primeros posters del JSON)
  if (poster.sizes && Array.isArray(poster.sizes) && poster.sizes.length > 0) {
    for (const s of poster.sizes) {
      const sizeId = SIZE_FALLBACK_MAP[s.id] || s.id;
      if (!DEFAULT_SIZE_CATALOG[sizeId]) {
        console.warn(`  ⚠ Tamaño desconocido "${s.id}" en poster "${poster.id}" — omitido`);
        continue;
      }
      sizesData.push({
        sizeId,
        nombre:      s.name         || DEFAULT_SIZE_CATALOG[sizeId].nombre,
        dimensiones: s.dimensions   || DEFAULT_SIZE_CATALOG[sizeId].dimensiones,
        anchoCm:     s.widthCm  != null ? s.widthCm  : DEFAULT_SIZE_CATALOG[sizeId].anchoCm,
        altoCm:      s.heightCm != null ? s.heightCm : DEFAULT_SIZE_CATALOG[sizeId].altoCm,
        precio:      s.price        || DEFAULT_SIZE_CATALOG[sizeId].precio,
        badge:       s.badge        || null,
        isActive:    true,
      });
    }
    return sizesData;
  }

  // FORMATO B: Array `availableSizes` con solo IDs — usamos precios base
  if (poster.availableSizes && Array.isArray(poster.availableSizes) && poster.availableSizes.length > 0) {
    for (const rawId of poster.availableSizes) {
      const sizeId = SIZE_FALLBACK_MAP[rawId] || rawId;
      if (!DEFAULT_SIZE_CATALOG[sizeId]) {
        console.warn(`  ⚠ Tamaño desconocido "${rawId}" en poster "${poster.id}" — omitido`);
        continue;
      }
      sizesData.push({
        sizeId,
        ...DEFAULT_SIZE_CATALOG[sizeId],
        isActive: true,
      });
    }
    return sizesData;
  }

  // FORMATO C: Sin sizes — poster sin tamaños definidos (solo datos base)
  console.warn(`  ⚠ Poster "${poster.id}" sin sizes definidos — se migrará sin tamaños`);
  return [];
}

// ── Función principal de migración ───────────────────────────────────────────
async function migrate() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  🚀 Deco Vintage — Script de Migración de Catálogo');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`📂 Leyendo JSON desde: ${CATALOG_PATH}`);

  const raw = readFileSync(CATALOG_PATH, 'utf-8');
  const catalog = JSON.parse(raw);
  const posters = catalog.posters;

  console.log(`📋 Total de posters encontrados en JSON: ${posters.length}`);
  console.log('');

  // ── Paso 1: Migrar Franchises ─────────────────────────────────────────────
  console.log('── Paso 1/2: Migrando Franchises ────────────────────');
  const franchiseSlugsInJSON = new Set();

  for (const p of posters) {
    if (p.franchise) franchiseSlugsInJSON.add(p.franchise);
  }

  // También cargamos las franchises del JSON raíz
  const franchisesFromJSON = catalog.franchises || [];
  const franchiseMap = {}; // slug → id en BD

  for (const fSlug of franchiseSlugsInJSON) {
    // Busca datos enriquecidos en el array de franchises del JSON
    const fData = franchisesFromJSON.find(f => f.id === fSlug);

    const upserted = await prisma.franchise.upsert({
      where:  { slug: fSlug },
      update: {},
      create: {
        slug:     fSlug,
        name:     fData?.name     || fSlug,
        imageUrl: fData?.img      || null,
        category: fData?.category ? mapCategory(fData.category) : null,
      },
    });

    franchiseMap[fSlug] = upserted.id;
    console.log(`  ✅ Franchise: ${fSlug} (id: ${upserted.id})`);
  }

  console.log(`\n  Total franchises migradas: ${Object.keys(franchiseMap).length}`);
  console.log('');

  // ── Paso 2: Migrar Posters ────────────────────────────────────────────────
  console.log('── Paso 2/2: Migrando Posters ───────────────────────');

  let created = 0;
  let updated = 0;
  let failed  = 0;
  const errors = [];

  for (const poster of posters) {
    try {
      process.stdout.write(`  • [${posters.indexOf(poster) + 1}/${posters.length}] ${poster.title} ... `);

      const sizes = buildSizes(poster);
      const categoria = mapCategory(poster.category);

      // Precio mínimo: del JSON o calculado desde sizes
      const precioMinimo = poster.minPrice != null
        ? poster.minPrice
        : (sizes.length > 0 ? Math.min(...sizes.map(s => Number(s.precio))) : null);

      // Usamos upsert para que el script sea idempotente (re-ejecutable sin duplicar)
      const result = await prisma.poster.upsert({
        where: { legacyId: poster.id },

        // Si ya existe → actualizar campos que puedan haber cambiado
        update: {
          titulo:       poster.title       || '',
          subtitulo:    poster.subtitle    || null,
          descripcion:  poster.description || null,
          categoria,
          franchiseId:  poster.franchise ? (franchiseMap[poster.franchise] || null) : null,
          tags:         Array.isArray(poster.tags) ? poster.tags : [],
          imageUrl:     poster.image       || null,
          thumbUrl:     poster.thumb       || null,
          precioMinimo: precioMinimo != null ? precioMinimo : undefined,
          precioDisplay:poster.priceDisplay || null,
          isFeatured:   poster.isFeatured  ?? false,
          rating:       poster.rating      != null ? poster.rating : null,
          reviewsCount: poster.reviewsCount ?? 0,
        },

        // Si NO existe → crear con todos los datos incluyendo sizes anidados
        create: {
          legacyId:     poster.id,
          titulo:       poster.title       || '',
          subtitulo:    poster.subtitle    || null,
          descripcion:  poster.description || null,
          categoria,
          franchiseId:  poster.franchise ? (franchiseMap[poster.franchise] || null) : null,
          tags:         Array.isArray(poster.tags) ? poster.tags : [],
          imageUrl:     poster.image       || null,
          thumbUrl:     poster.thumb       || null,
          precioMinimo: precioMinimo != null ? precioMinimo : undefined,
          precioDisplay:poster.priceDisplay || null,
          estado:       'DISPONIBLE',
          isPublished:  true,
          isFeatured:   poster.isFeatured  ?? false,
          rating:       poster.rating      != null ? poster.rating : null,
          reviewsCount: poster.reviewsCount ?? 0,
          sizes: {
            create: sizes,
          },
        },
      });

      if (result) {
        // Si ya existía, actualizamos sus sizes (delete + re-create para sincronizar)
        const existing = await prisma.posterSize.findMany({ where: { posterId: result.id } });
        if (existing.length === 0 && sizes.length > 0) {
          await prisma.posterSize.createMany({
            data: sizes.map(s => ({ ...s, posterId: result.id })),
            skipDuplicates: true,
          });
          updated++;
          console.log(`✅ creado`);
        } else {
          updated++;
          console.log(`♻️  ya existía (actualizado)`);
        }
        created++;
      }

    } catch (err) {
      failed++;
      console.log(`❌ ERROR`);
      const errorInfo = { posterId: poster.id, title: poster.title, error: err.message };
      errors.push(errorInfo);
      console.error(`     → ${err.message}`);
    }
  }

  // ── Reporte final ─────────────────────────────────────────────────────────
  console.log('');
  console.log('═══════════════════════════════════════════════════════');
  console.log('  📊 REPORTE FINAL DE MIGRACIÓN');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  ✅ Posters procesados: ${created}`);
  console.log(`  ❌ Posters fallidos:   ${failed}`);

  if (errors.length > 0) {
    console.log('\n  🔴 Detalle de errores:');
    errors.forEach(e => console.log(`     - [${e.posterId}] ${e.title}: ${e.error}`));
  }

  // Verificación en BD
  const totalEnBD = await prisma.poster.count();
  const totalSizes = await prisma.posterSize.count();
  const totalFranchises = await prisma.franchise.count();

  console.log('');
  console.log('  📦 Estado actual de la base de datos:');
  console.log(`     Posters en BD:    ${totalEnBD}`);
  console.log(`     PosterSizes en BD: ${totalSizes}`);
  console.log(`     Franchises en BD: ${totalFranchises}`);
  console.log('═══════════════════════════════════════════════════════');

  if (failed === 0) {
    console.log('\n  🎉 Migración completada SIN errores.');
  } else {
    console.log(`\n  ⚠️  Migración completada con ${failed} error(es). Revisa arriba.`);
    process.exit(1);
  }
}

// ── Entrypoint con manejo de errores globales ─────────────────────────────────
migrate()
  .catch(err => {
    console.error('\n🔴 ERROR FATAL en la migración:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log('\n🔌 Prisma Client desconectado. Script finalizado.');
  });