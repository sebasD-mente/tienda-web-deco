/**
 * services/catalogService.js
 * Fuente de verdad del catálogo — 100% PostgreSQL vía Prisma Client.
 * Cero Split-Brain (sin catalogStore.json) y Cero I/O Bloqueante.
 */

import { PrismaClient } from '@prisma/client';

// ── Singleton Prisma Client ───────────────────────────────────────────────────
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']
    : ['warn', 'error'],
});

/** Include completo: sizes ordenados por precio ascendente + franchise. */
const POSTER_INCLUDE_FULL = {
  sizes: {
    where:   { isActive: true },
    orderBy: { precio: 'asc' },
  },
  franchise: true,
};

/** Include ligero: solo franchise, sin sizes. Usado en operaciones admin. */
const POSTER_INCLUDE_LIGHT = {
  franchise: true,
};

/** Categorías oficiales enum */
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
 * Normaliza un póster de PostgreSQL / Prisma para compatibilidad con la UI de React.
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
//  PRISMA POSTGRESQL API (100% Async & Non-blocking)
// =============================================================================

/**
 * Retorna pósters de PostgreSQL con soporte para filtrado y paginación Prisma (take, cursor, skip).
 *
 * @param {object} opts
 * @param {string}  [opts.categoria]
 * @param {string}  [opts.franchiseId]
 * @param {boolean} [opts.onlyFeatured]
 * @param {boolean} [opts.includeUnpublished]
 * @param {'titulo'|'createdAt'|'precioMinimo'} [opts.orderBy='createdAt']
 * @param {'asc'|'desc'} [opts.order='desc']
 * @param {number|string} [opts.take] - Cantidad de registros a retornar (paginación)
 * @param {string}  [opts.cursor] - ID del cursor para paginación basada en cursor
 * @param {number|string} [opts.skip] - Registros a omitir (offset)
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
    take,
    cursor,
    skip,
  } = opts;

  const where = {
    ...(!includeUnpublished && { isPublished: true }),
    ...(!includeUnpublished && { estado: { not: 'DESCONTINUADO' } }),
    ...(categoria    && { categoria: normalizeCategory(categoria) }),
    ...(franchiseId  && { franchiseId }),
    ...(onlyFeatured && { isFeatured: true }),
  };

  const takeNum = take != null ? Math.max(1, Math.min(200, parseInt(take, 10))) : undefined;
  const skipNum = skip != null ? parseInt(skip, 10) : undefined;

  let cursorObj = undefined;
  if (cursor) {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cursor);
    cursorObj = isUUID ? { id: cursor } : { legacyId: cursor };
  }

  const queryOptions = {
    where,
    include: POSTER_INCLUDE_FULL,
    orderBy: { [orderBy]: order },
    ...(takeNum != null && { take: takeNum }),
    ...(skipNum != null && { skip: skipNum }),
    ...(cursorObj && { cursor: cursorObj, skip: cursorObj ? 1 : skipNum }),
  };

  const posters = await prisma.poster.findMany(queryOptions);
  return posters.map(formatPosterForClient);
}

/**
 * Busca un póster por UUID o legacyId en PostgreSQL.
 * @param {string} idOrLegacyId
 * @returns {Promise<object | null>}
 */
export async function getPosterById(idOrLegacyId) {
  if (!idOrLegacyId) return null;
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrLegacyId);

  let poster = null;
  if (isUUID) {
    poster = await prisma.poster.findUnique({
      where:   { id: idOrLegacyId },
      include: POSTER_INCLUDE_FULL,
    });
  } else {
    poster = await prisma.poster.findUnique({
      where:   { legacyId: idOrLegacyId },
      include: POSTER_INCLUDE_FULL,
    });
  }

  return formatPosterForClient(poster);
}

/**
 * Actualiza el estado de producción/venta de un póster en PostgreSQL.
 * @param {string} id
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
 * Crea o actualiza un póster en PostgreSQL usando Prisma.
 * @param {object} data
 * @returns {Promise<object>}
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

  let finalFranchiseId = inputFranchiseId || null;
  if (!finalFranchiseId && franchise) {
    const fr = await prisma.franchise.findUnique({ where: { slug: franchise } });
    finalFranchiseId = fr?.id || null;
  }

  const sizesData = buildSizesForUpsert(sizes, availableSizes);

  let existingPoster = null;
  if (inputId && isUUID(inputId)) {
    existingPoster = await prisma.poster.findUnique({ where: { id: inputId } });
  }
  if (!existingPoster && finalLegacyId) {
    existingPoster = await prisma.poster.findUnique({ where: { legacyId: finalLegacyId } });
  }

  if (existingPoster) {
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
 * Elimina un póster de PostgreSQL.
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deletePoster(id) {
  await prisma.poster.delete({ where: { id } });
}

// ── Franchises & Categories API (100% Prisma) ─────────────────────────────────

export async function getAllFranchises() {
  return prisma.franchise.findMany({
    orderBy: { name: 'asc' }
  });
}

export async function getAllCategories() {
  return [
    { id: 'AUTOS', name: 'Autos & Motor' },
    { id: 'SUPERHEROES', name: 'Superhéroes Marvel & DC' },
    { id: 'ANIME', name: 'Anime & Manga' },
    { id: 'MUSICA', name: 'Música & Álbumes' },
    { id: 'SERIESYPELICULAS', name: 'Series & Películas' },
    { id: 'OBRASDEARTE', name: 'Obras de Arte' },
    { id: 'INFANTILYDIBUJOSANIMADOS', name: 'Infantil & Dibujos Animados' },
    { id: 'CINE', name: 'Cine Clásico' }
  ];
}

// ── Store Settings API (100% Prisma - Zero JSON Split Brain) ──────────────────

export async function getStoreSettings() {
  try {
    const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
    if (settings) {
      return { whatsappPhone: settings.whatsappPhone, updatedAt: settings.updatedAt.toISOString() };
    }
  } catch (e) {
    console.warn('[Prisma StoreSettings] Warning fetching settings from DB:', e.message);
  }
  return { whatsappPhone: '50238375078' };
}

export async function saveStoreSettings(whatsappPhone) {
  const cleanPhone = (whatsappPhone || '50238375078').replace(/[^0-9]/g, '');
  try {
    const settings = await prisma.storeSettings.upsert({
      where:  { id: 'default' },
      update: { whatsappPhone: cleanPhone },
      create: { id: 'default', whatsappPhone: cleanPhone },
    });
    return { whatsappPhone: settings.whatsappPhone, updatedAt: settings.updatedAt.toISOString() };
  } catch (e) {
    console.warn('[Prisma StoreSettings] Warning saving settings to DB:', e.message);
    return { whatsappPhone: cleanPhone };
  }
}

// ── Helper de tamaños ─────────────────────────────────────────────────────────

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

export { prisma };
