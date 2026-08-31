/**
 * services/catalogService.js
 * Fuente de verdad del catalogo — ahora sobre PostgreSQL via Prisma.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  API PUBLICA                                                    │
 * │                                                                 │
 * │  [PRISMA — async]                                               │
 * │    getAllPosters(opts)          → Poster[] con sizes + franchise │
 * │    getPosterById(idOrLegacyId) → Poster | null                  │
 * │    updatePosterStatus(id, st)  → Poster actualizado             │
 * │    upsertPosterFromAdmin(data) → Poster creado o actualizado    │
 * │    deletePoster(id)            → void                           │
 * │                                                                 │
 * │  [JSON legacy — sync, para rutas admin y settings]              │
 * │    getCatalogData()            → objeto catalogo completo       │
 * │    saveCatalog(dataObject)     → persiste JSON atomicamente     │
 * └─────────────────────────────────────────────────────────────────┘
 */

import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { CATALOG_FILE } from '../config/paths.js';

// ── Singleton Prisma ──────────────────────────────────────────────────────────
// Una sola instancia compartida por toda la vida del proceso Node.
// Esto evita saturar el pool de conexiones de PostgreSQL.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']   // En dev: muestra todas las queries SQL
    : ['warn', 'error'],           // En prod: solo errores y advertencias
});

// ── Includes reutilizables ────────────────────────────────────────────────────
// Centralizar los `include` evita inconsistencias entre funciones.

/** Include completo: sizes ordenados + franchise. Usado en lecturas publicas. */
const POSTER_INCLUDE_FULL = {
  sizes: {
    where:   { isActive: true },
    orderBy: { precio: 'asc' },    // MINI → GIGANTE por precio ascendente
  },
  franchise: true,
};

/** Include ligero: solo franchise, sin sizes. Usado en listados de admin. */
const POSTER_INCLUDE_LIGHT = {
  franchise: true,
};

/** Mapeo y normalización de categoría a enum de Prisma Category */
const VALID_CATEGORIES = [
  'AUTOS',
  'SUPERHEROES',
  'ANIME',
  'MUSICA',
  'SERIESYPELICULAS',
  'OBRASDEARTE',
  'INFANTILYDIBUJOSANIMADOS',
  'CINE'
];

export function normalizeCategory(catStr) {
  if (!catStr) return 'AUTOS';
  const clean = String(catStr).toUpperCase().replace(/[^A-Z]/g, '');
  if (VALID_CATEGORIES.includes(clean)) return clean;

  // Mapeos comunes por si viene en minúsculas, con espacios o tildes
  const lower = String(catStr).toLowerCase();
  if (lower.includes('auto') || lower.includes('car')) return 'AUTOS';
  if (lower.includes('superh') || lower.includes('hero')) return 'SUPERHEROES';
  if (lower.includes('anim')) return 'ANIME';
  if (lower.includes('music')) return 'MUSICA';
  if (lower.includes('serie') || lower.includes('pelicula')) return 'SERIESYPELICULAS';
  if (lower.includes('obra') || lower.includes('arte')) return 'OBRASDEARTE';
  if (lower.includes('infantil') || lower.includes('dibujo')) return 'INFANTILYDIBUJOSANIMADOS';
  if (lower.includes('cine') || lower.includes('movie')) return 'CINE';

  return 'AUTOS';
}

/**
 * Normaliza un póster de PostgreSQL / Prisma para que sea 100% compatible
 * con el frontend existente de React (que consume propiedades en inglés)
 * y con cualquier controlador que espere los campos en español.
 *
 * @param {object} poster
 * @returns {object|null}
 */
export function formatPosterForClient(poster) {
  if (!poster) return null;

  const rawSizes = poster.sizes || [];
  const mappedSizes = Array.isArray(rawSizes) ? rawSizes.map(s => ({
    id:          s.sizeId || s.id,
    sizeId:      s.sizeId || s.id,
    name:        s.nombre || s.name || s.sizeId || s.id,
    nombre:      s.nombre || s.name || s.sizeId || s.id,
    dimensions:  s.dimensiones || s.dimensions || '',
    dimensiones: s.dimensiones || s.dimensions || '',
    widthCm:     s.anchoCm != null ? Number(s.anchoCm) : (s.widthCm != null ? Number(s.widthCm) : null),
    anchoCm:     s.anchoCm != null ? Number(s.anchoCm) : (s.widthCm != null ? Number(s.widthCm) : null),
    heightCm:    s.altoCm != null ? Number(s.altoCm) : (s.heightCm != null ? Number(s.heightCm) : null),
    altoCm:      s.altoCm != null ? Number(s.altoCm) : (s.heightCm != null ? Number(s.heightCm) : null),
    price:       s.precio != null ? Number(s.precio) : (s.price != null ? Number(s.price) : 25),
    precio:      s.precio != null ? Number(s.precio) : (s.price != null ? Number(s.price) : 25),
    badge:       s.badge || null,
    isActive:    s.isActive !== false,
  })) : [];

  const availableSizes = mappedSizes.length > 0
    ? mappedSizes.filter(s => s.isActive !== false).map(s => s.id)
    : (Array.isArray(poster.availableSizes) && poster.availableSizes.length > 0
        ? poster.availableSizes
        : ['MINI', 'PEQUENO', 'MEDIANO', 'GRANDE', 'GIGANTE']);

  const finalMinPrice = poster.precioMinimo != null
    ? Number(poster.precioMinimo)
    : (poster.minPrice != null ? Number(poster.minPrice) : (poster.price != null ? Number(poster.price) : 25));

  const finalPriceDisplay = poster.precioDisplay || poster.priceDisplay || (finalMinPrice ? `Desde Q ${finalMinPrice.toFixed(2)}` : 'Desde Q 25.00');

  const franchiseSlug = poster.franchise?.slug || (typeof poster.franchise === 'string' ? poster.franchise : null) || poster.franchiseId || null;

  return {
    ...poster,
    // ── Propiedades canónicas en inglés (requeridas por la UI de React) ──────
    title:          poster.titulo || poster.title || '',
    subtitle:       poster.subtitulo ?? poster.subtitle ?? null,
    description:    poster.descripcion ?? poster.description ?? '',
    category:       poster.categoria || poster.category || 'AUTOS',
    franchise:      franchiseSlug,
    image:          poster.imageUrl || poster.image || null,
    thumb:          poster.thumbUrl || poster.thumb || null,
    minPrice:       finalMinPrice,
    price:          finalMinPrice,
    priceDisplay:   finalPriceDisplay,
    availableSizes,
    sizes:          mappedSizes,

    // ── Propiedades en español de PostgreSQL (compatibilidad backend) ─────────
    titulo:         poster.titulo || poster.title || '',
    subtitulo:      poster.subtitulo ?? poster.subtitle ?? null,
    descripcion:    poster.descripcion ?? poster.description ?? '',
    categoria:      poster.categoria || poster.category || 'AUTOS',
    imageUrl:       poster.imageUrl || poster.image || null,
    thumbUrl:       poster.thumbUrl || poster.thumb || null,
    precioMinimo:   finalMinPrice,
    precioDisplay:  finalPriceDisplay,
    rating:         poster.rating != null ? Number(poster.rating) : 5.0,
    reviewsCount:   poster.reviewsCount != null ? Number(poster.reviewsCount) : 0,
    isFeatured:     Boolean(poster.isFeatured),
    isPublished:    poster.isPublished !== false,
  };
}

// =============================================================================
//  SECCION 1 — API PRISMA (PostgreSQL) — Async
// =============================================================================

/**
 * Retorna todos los posters publicados con sus sizes y franchise.
 *
 * @param {object} opts
 * @param {string}  [opts.categoria]   - Filtrar por categoria (enum Category)
 * @param {string}  [opts.franchiseId] - Filtrar por franchise ID
 * @param {boolean} [opts.onlyFeatured] - Solo posters destacados
 * @param {boolean} [opts.includeUnpublished] - Incluir no publicados (admin)
 * @param {'titulo'|'createdAt'|'precioMinimo'} [opts.orderBy='createdAt']
 * @param {'asc'|'desc'} [opts.order='desc']
 * @returns {Promise<object[]>}
 */
export async function getAllPosters(opts = {}) {
  const {
    categoria,
    franchiseId,
    onlyFeatured       = false,
    includeUnpublished = false,
    orderBy            = 'createdAt',
    order              = 'desc',
  } = opts;

  const where = {
    // Por defecto solo mostramos posters publicados al publico
    ...(!includeUnpublished && { isPublished: true }),
    // Estado excluye descontinuados del catalogo publico
    ...(!includeUnpublished && { estado: { not: 'DESCONTINUADO' } }),
    ...(categoria    && { categoria: normalizeCategory(categoria) }),
    ...(franchiseId  && { franchiseId }),
    ...(onlyFeatured && { isFeatured: true }),
  };

  const posters = await prisma.poster.findMany({
    where,
    include: POSTER_INCLUDE_FULL,
    orderBy: { [orderBy]: order },
  });

  return posters.map(formatPosterForClient);
}

/**
 * Busca un poster por UUID (id) o por legacyId (el ID del JSON original).
 * Acepta cualquiera de los dos formatos para no romper las URLs del frontend.
 *
 * @param {string} idOrLegacyId
 * @returns {Promise<object | null>}
 */
export async function getPosterById(idOrLegacyId) {
  if (!idOrLegacyId) return null;

  // Intentamos primero por UUID nativo (36 chars con guiones)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrLegacyId);

  let poster = null;
  if (isUUID) {
    poster = await prisma.poster.findUnique({
      where:   { id: idOrLegacyId },
      include: POSTER_INCLUDE_FULL,
    });
  } else {
    // Si no es UUID, buscamos por legacyId (ej: "deco-mtdamr8z-px9v")
    poster = await prisma.poster.findUnique({
      where:   { legacyId: idOrLegacyId },
      include: POSTER_INCLUDE_FULL,
    });
  }

  return formatPosterForClient(poster);
}

/**
 * Actualiza el estado de produccion/venta de un poster.
 * Valida que el estado sea un valor permitido antes de persistir.
 *
 * @param {string} id - UUID del poster en la BD
 * @param {import('@prisma/client').PosterStatus} newStatus
 * @returns {Promise<object>}
 */
export async function updatePosterStatus(id, newStatus) {
  const VALID_STATUSES = [
    'DISPONIBLE', 'SEPARADO', 'PENDIENTE_PRODUCCION',
    'EN_PRODUCCION', 'LISTO_PARA_ENTREGA', 'ENTREGADO', 'DESCONTINUADO',
  ];

  if (!VALID_STATUSES.includes(newStatus)) {
    const err = new Error(`Estado inválido: "${newStatus}". Valores permitidos: ${VALID_STATUSES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const updated = await prisma.poster.update({
    where:   { id },
    data:    { estado: newStatus, updatedAt: new Date() },
    include: POSTER_INCLUDE_LIGHT,
  });

  return formatPosterForClient(updated);
}

/**
 * Crea o actualiza un poster desde el panel de administracion.
 * Si `legacyId` ya existe en BD → actualiza. Si no → crea nuevo.
 *
 * @param {object} data - Datos del poster tal como vienen del admin
 * @returns {Promise<import('@prisma/client').Poster>}
 */
/**
 * Crea o actualiza un poster en PostgreSQL usando Prisma.
 * Maneja tanto la clave primaria UUID `id` como `legacyId`.
 *
 * @param {object} data - Datos del poster tal como vienen del admin o cliente
 * @returns {Promise<import('@prisma/client').Poster>}
 */
export async function upsertPosterFromAdmin(data) {
  const {
    id: inputId,
    legacyId: inputLegacyId,
    title,
    titulo,
    subtitle,
    subtitulo,
    description,
    descripcion,
    category,
    categoria,
    franchise,
    franchiseId: inputFranchiseId,
    tags          = [],
    image,
    imageUrl,
    thumb,
    thumbUrl,
    minPrice,
    precioMinimo,
    priceDisplay,
    precioDisplay,
    isFeatured    = false,
    isPublished   = true,
    estado,
    rating,
    reviewsCount  = 0,
    availableSizes,
    sizes,
  } = data;

  const finalTitle = title || titulo || '';
  const finalCategory = normalizeCategory(category || categoria);
  const finalImage = image || imageUrl || null;
  const finalThumb = thumb || thumbUrl || null;
  const finalMinPrice = minPrice ?? precioMinimo ?? null;
  const finalPriceDisplay = priceDisplay || precioDisplay || (finalMinPrice ? `Desde Q ${parseFloat(finalMinPrice).toFixed(2)}` : 'Desde Q 25.00');
  const finalLegacyId = inputLegacyId || (inputId && !isUUID(inputId) ? inputId : null);

  // Resuelve el franchiseId
  let finalFranchiseId = inputFranchiseId || null;
  if (!finalFranchiseId && franchise) {
    const fr = await prisma.franchise.findUnique({ where: { slug: franchise } });
    finalFranchiseId = fr?.id || null;
  }

  const sizesData = buildSizesForUpsert(sizes, availableSizes);

  // Determina si existe por id (UUID) o por legacyId
  let existingPoster = null;
  if (inputId && isUUID(inputId)) {
    existingPoster = await prisma.poster.findUnique({ where: { id: inputId } });
  }
  if (!existingPoster && finalLegacyId) {
    existingPoster = await prisma.poster.findUnique({ where: { legacyId: finalLegacyId } });
  }

  if (existingPoster) {
    // Si se actualiza, se usa transacción para renovar tamaños si vienen especificados
    const updated = await prisma.$transaction(async (tx) => {
      if (sizesData.length > 0) {
        await tx.posterSize.deleteMany({ where: { posterId: existingPoster.id } });
      }

      return tx.poster.update({
        where: { id: existingPoster.id },
        data: {
          titulo:       finalTitle || existingPoster.titulo,
          subtitulo:    subtitle ?? subtitulo ?? existingPoster.subtitulo,
          descripcion:  description ?? descripcion ?? existingPoster.descripcion,
          categoria:    finalCategory,
          franchiseId:  finalFranchiseId,
          tags:         Array.isArray(tags) ? tags : existingPoster.tags,
          imageUrl:     finalImage ?? existingPoster.imageUrl,
          thumbUrl:     finalThumb ?? existingPoster.thumbUrl,
          precioMinimo: finalMinPrice != null ? finalMinPrice : existingPoster.precioMinimo,
          precioDisplay:finalPriceDisplay,
          isFeatured:   isFeatured ?? existingPoster.isFeatured,
          isPublished:  isPublished ?? existingPoster.isPublished,
          estado:       estado || existingPoster.estado,
          rating:       rating != null ? rating : existingPoster.rating,
          reviewsCount: reviewsCount ?? existingPoster.reviewsCount,
          updatedAt:    new Date(),
          ...(sizesData.length > 0 && {
            sizes: { create: sizesData }
          })
        },
        include: POSTER_INCLUDE_FULL,
      });
    });
    return formatPosterForClient(updated);
  }

  // Crear nuevo póster
  const created = await prisma.poster.create({
    data: {
      legacyId:     finalLegacyId,
      titulo:       finalTitle,
      subtitulo:    subtitle || subtitulo || null,
      descripcion:  description || descripcion || null,
      categoria:    finalCategory,
      franchiseId:  finalFranchiseId,
      tags:         Array.isArray(tags) ? tags : [],
      imageUrl:     finalImage,
      thumbUrl:     finalThumb,
      precioMinimo: finalMinPrice != null ? finalMinPrice : 25.00,
      precioDisplay:finalPriceDisplay,
      estado:       estado || 'DISPONIBLE',
      isPublished:  isPublished ?? true,
      isFeatured:   isFeatured ?? false,
      rating:       rating != null ? rating : null,
      reviewsCount: reviewsCount ?? 0,
      sizes: { create: sizesData.length > 0 ? sizesData : buildSizesForUpsert(null, ['MINI', 'PEQUENO', 'MEDIANO', 'GRANDE', 'GIGANTE']) },
    },
    include: POSTER_INCLUDE_FULL,
  });
  return formatPosterForClient(created);
}

function isUUID(str) {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

/**
 * Elimina un poster y sus sizes (Cascade definido en el schema).
 *
 * @param {string} id - UUID del poster
 * @returns {Promise<void>}
 */
export async function deletePoster(id) {
  await prisma.poster.delete({ where: { id } });
}

// ── Helper privado ────────────────────────────────────────────────────────────

/** Tabla de precios base por tamano (mirror de migrateCatalog.js). */
const DEFAULT_SIZE_CATALOG = {
  MINI:          { nombre: 'Mini',          dimensiones: '14 x 21 cm',  anchoCm: 14,  altoCm: 21,  precio: 25,  badge: 'Ideal para coleccionar y escritorios' },
  PEQUENO:       { nombre: 'Pequeño',       dimensiones: '21 x 27 cm',  anchoCm: 21,  altoCm: 27,  precio: 35,  badge: 'Espacios reducidos y cabeceras' },
  MEDIANO:       { nombre: 'Mediano',       dimensiones: '30 x 45 cm',  anchoCm: 30,  altoCm: 45,  precio: 65,  badge: '⭐ El más vendido para habitaciones' },
  GRANDE:        { nombre: 'Grande',        dimensiones: '45 x 60 cm',  anchoCm: 45,  altoCm: 60,  precio: 125, badge: 'Protagonista para salas y oficinas' },
  GIGANTE:       { nombre: 'Gigante',       dimensiones: '60 x 100 cm', anchoCm: 60,  altoCm: 100, precio: 210, badge: 'Impacto visual monumental' },
  PERSONALIZADO: { nombre: 'Personalizado', dimensiones: 'A convenir',  anchoCm: null,altoCm: null,precio: 250, badge: 'Medida especial negociada' },
};

function buildSizesForUpsert(sizes, availableSizes) {
  if (sizes && Array.isArray(sizes) && sizes.length > 0) {
    return sizes.map(s => ({
      sizeId:      s.id || s.sizeId,
      nombre:      s.name       || DEFAULT_SIZE_CATALOG[s.id]?.nombre      || s.id,
      dimensiones: s.dimensions || DEFAULT_SIZE_CATALOG[s.id]?.dimensiones || '',
      anchoCm:     s.widthCm    ?? DEFAULT_SIZE_CATALOG[s.id]?.anchoCm     ?? null,
      altoCm:      s.heightCm   ?? DEFAULT_SIZE_CATALOG[s.id]?.altoCm      ?? null,
      precio:      s.price      ?? DEFAULT_SIZE_CATALOG[s.id]?.precio       ?? 25,
      badge:       s.badge      || null,
      isActive:    true,
    }));
  }
  if (availableSizes && Array.isArray(availableSizes)) {
    return availableSizes
      .filter(sid => DEFAULT_SIZE_CATALOG[sid])
      .map(sid => ({ sizeId: sid, ...DEFAULT_SIZE_CATALOG[sid], isActive: true }));
  }
  return [];
}

// =============================================================================
//  SECCION 2 — API JSON LEGACY (sincrona)
//  Mantenida para: settingsRoutes y catalogRoutes POST /save
//  mientras se completa la migracion del panel admin.
// =============================================================================

/**
 * Lee y parsea catalogStore.json desde el SSD del VPS.
 * Maneja BOM (0xFEFF) y retorna un objeto seguro si el archivo falta o esta corrupto.
 *
 * @returns {{ categories: any[], franchises: any[], posters: any[], settings: object }}
 */
export function getCatalogData() {
  if (fs.existsSync(CATALOG_FILE)) {
    try {
      let raw = fs.readFileSync(CATALOG_FILE, 'utf-8');
      if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
      return JSON.parse(raw.trim());
    } catch (err) {
      console.error('[Deco Catalog] Error parsing catalog JSON:', err.message);
    }
  }
  return { categories: [], franchises: [], posters: [], settings: { whatsappPhone: '50238375078' } };
}

/**
 * Persiste atomicamente un objeto catalogo en disco (tmp → rename).
 * Garantiza que el archivo nunca quede en estado corrupto/parcial.
 *
 * @param {object} dataObject - Catalogo completo a guardar.
 * @returns {void}
 */
export function saveCatalog(dataObject) {
  const tmpFile = `${CATALOG_FILE}.tmp`;
  fs.writeFileSync(tmpFile, JSON.stringify(dataObject, null, 2), 'utf-8');
  fs.renameSync(tmpFile, CATALOG_FILE);
}

// ── Exportar cliente Prisma para uso directo si fuera necesario ────────────────
export { prisma };