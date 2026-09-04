/**
 * services/catalogService.js
 * Fuente de verdad ÚNICA del catálogo — 100% sobre PostgreSQL vía Prisma.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  ARQUITECTURA ZERO SPLIT-BRAIN (POSTGRESQL + PRISMA)            │
 * │                                                                 │
 * │  - Eliminados todos los métodos síncronos de archivos (fs.*Sync)│
 * │  - Paginación basada en cursores (cursor + take) para LCP/INP   │
 * │  - PostgreSQL es la única fuente de verdad para el catálogo     │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { prisma } from '../config/prisma.js';

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

/**
 * Proyección selectiva para consultas de catálogo público y clientes.
 * Excluye explícitamente el vector RAG `embedding` (768 flotantes), reduciendo
 * drásticamente la transferencia desde PostgreSQL y la memoria de Node.js.
 */
export const POSTER_SELECT_CLIENT = {
  id:            true,
  legacyId:      true,
  titulo:        true,
  subtitulo:     true,
  descripcion:   true,
  categoria:     true,
  franchiseId:   true,
  tags:          true,
  imageUrl:      true,
  thumbUrl:      true,
  precioMinimo:  true,
  precioDisplay: true,
  estado:        true,
  isPublished:   true,
  isFeatured:    true,
  rating:        true,
  reviewsCount:  true,
  createdAt:     true,
  updatedAt:     true,
  sizes: {
    where:   { isActive: true },
    orderBy: { precio: 'asc' },
  },
  franchise:     true,
};

/** Include ligero: solo franchise, sin sizes. Usado en listados de admin. */
const POSTER_INCLUDE_LIGHT = {
  franchise: true,
};

/**
 * Invalida de forma segura la caché en memoria de vectores RAG tras mutaciones en BD.
 */
async function safeInvalidateEmbeddingsCache() {
  try {
    const { invalidateEmbeddingsCache } = await import('./embeddingService.js');
    if (typeof invalidateEmbeddingsCache === 'function') {
      invalidateEmbeddingsCache();
    }
  } catch (err) {
    console.warn('[Deco Catalog] No se pudo invalidar la caché de embeddings:', err.message);
  }
}

export function normalizeCategory(catStr) {
  if (!catStr) return 'GENERAL';
  const raw = String(catStr).trim();
  if (!raw) return 'GENERAL';

  // Desaccentuar mediante Unicode NFD y normalizar a minúsculas
  const clean = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  // Mapeos canónicos conocidos para mantener compatibilidad histórica y sincronización con PostgreSQL
  if (clean === 'futbol' || clean.includes('futbol') || clean.includes('soccer')) return 'FUTBOL';
  if (clean.includes('f1') || clean.includes('formula 1') || clean.includes('formula uno') || clean.includes('basketball') || clean.includes('baloncesto') || clean.includes('nba')) return 'BASKETBALL_Y_FORMULA_1';
  if (clean === 'autos' || clean === 'auto' || clean.includes('automov') || clean.includes('coches') || clean.includes('carro')) return 'AUTOS';
  if (clean.includes('videojuego') || clean.includes('video juego') || clean.includes('gaming') || clean.includes('gamer')) return 'VIDEO_JUEGOS';
  if (clean === 'vintage' || clean.includes('retro') || clean.includes('antiguo')) return 'VINTAGE';
  if (clean === 'superheroes' || clean.includes('superh') || clean.includes('super heroe')) return 'SUPERHEROES';
  if (clean === 'anime' || clean.includes('manga') || clean.includes('otaku')) return 'ANIME';
  if (clean === 'musica' || clean.includes('rock') || clean.includes('banda')) return 'MUSICA';
  if (clean === 'seriesypeliculas' || clean.includes('serie') || clean.includes('pelicula')) return 'SERIESYPELICULAS';
  if (clean === 'obrasdearte' || clean.includes('obra de arte') || clean.includes('cuadro clasico')) return 'OBRASDEARTE';
  if (clean === 'infantilydibujosanimados' || clean.includes('infantil') || clean.includes('dibujo animado')) return 'INFANTILYDIBUJOSANIMADOS';
  if (clean === 'cine' || clean.includes('cinema')) return 'CINE';
  if (clean.includes('bebida') || clean.includes('bar') || clean.includes('licor') || clean.includes('trago')) return 'BEBIDAS_Y_BAR';

  // Para cualquier categoría personalizada nueva
  return clean.toUpperCase().replace(/[\s-]+/g, '_').replace(/[^A-Z0-9_]/g, '') || 'GENERAL';
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
  const { embedding: _rawEmbedding, ...cleanPoster } = poster;
  const rawCat = poster.categoria || poster.category || 'GENERAL';

  return {
    ...cleanPoster,
    // ── Propiedades canónicas en inglés (requeridas por la UI de React) ──────
    title:          poster.titulo || poster.title || '',
    subtitle:       poster.subtitulo ?? poster.subtitle ?? null,
    description:    poster.descripcion ?? poster.description ?? '',
    category:       rawCat,
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
    categoria:      rawCat,
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

export function isUUID(str) {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

// =============================================================================
//  SECCION 1 — API PRISMA (PostgreSQL) — Async con Paginación por Cursor
// =============================================================================

/**
 * Retorna posters desde PostgreSQL con soporte para paginación basada en cursor.
 *
 * @param {object} opts
 * @param {string}  [opts.categoria]   - Filtrar por categoria (enum Category)
 * @param {string}  [opts.franchiseId] - Filtrar por franchise ID o slug
 * @param {string}  [opts.search]      - Búsqueda textual
 * @param {boolean} [opts.onlyFeatured] - Solo posters destacados
 * @param {boolean} [opts.includeUnpublished] - Incluir no publicados (admin)
 * @param {'titulo'|'createdAt'|'precioMinimo'} [opts.orderBy='createdAt']
 * @param {'asc'|'desc'} [opts.order='desc']
 * @param {string}  [opts.cursor]      - UUID del último poster de la página anterior
 * @param {number|string} [opts.take]  - Cantidad de registros a solicitar
 * @returns {Promise<object[]|{ posters: object[], nextCursor: string|null, hasMore: boolean, count: number }>}
 */
export async function getAllPosters(opts = {}) {
  const {
    categoria,
    franchiseId,
    search,
    onlyFeatured       = false,
    includeUnpublished = false,
    orderBy            = 'createdAt',
    order              = 'desc',
    cursor,
    take,
  } = opts;

  // Si franchiseId es un slug y no un UUID, lo resolvemos
  let resolvedFranchiseId = franchiseId;
  if (franchiseId && !isUUID(franchiseId)) {
    const fr = await prisma.franchise.findUnique({ where: { slug: franchiseId } });
    if (fr) resolvedFranchiseId = fr.id;
  }

  const where = {
    // Por defecto solo mostramos posters publicados al publico
    ...(!includeUnpublished && { isPublished: true }),
    // Estado excluye descontinuados del catalogo publico
    ...(!includeUnpublished && { estado: { not: 'DESCONTINUADO' } }),
    ...(categoria           && { categoria: normalizeCategory(categoria) }),
    ...(resolvedFranchiseId && { franchiseId: resolvedFranchiseId }),
    ...(onlyFeatured        && { isFeatured: true }),
    ...(search && {
      OR: [
        { titulo:      { contains: search, mode: 'insensitive' } },
        { subtitulo:   { contains: search, mode: 'insensitive' } },
        { descripcion: { contains: search, mode: 'insensitive' } },
      ]
    })
  };

  // Si se solicita paginación explícita con take
  if (take !== undefined && take !== 'all') {
    const takeNumber = Math.min(Math.max(parseInt(take, 10) || 24, 1), 100);
    const queryArgs = {
      where,
      select: POSTER_SELECT_CLIENT,
      orderBy: [{ [orderBy]: order }, { id: 'desc' }],
      take: takeNumber + 1, // Tomamos 1 extra para determinar hasMore
    };

    if (cursor && isUUID(cursor)) {
      queryArgs.cursor = { id: cursor };
      queryArgs.skip = 1; // Saltamos el cursor
    }

    const rawPosters = await prisma.poster.findMany(queryArgs);
    const hasMore = rawPosters.length > takeNumber;
    const items = hasMore ? rawPosters.slice(0, takeNumber) : rawPosters;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    return {
      posters: items.map(formatPosterForClient),
      nextCursor,
      hasMore,
      count: items.length,
    };
  }

  // Consulta regular sin paginación (para exports internos, JARVIS o panel completo)
  const posters = await prisma.poster.findMany({
    where,
    select: POSTER_SELECT_CLIENT,
    orderBy: [{ [orderBy]: order }, { id: 'desc' }],
  });

  return posters.map(formatPosterForClient);
}

/**
 * Busca un poster por UUID (id) o por legacyId (el ID del JSON original).
 *
 * @param {string} idOrLegacyId
 * @returns {Promise<object | null>}
 */
export async function getPosterById(idOrLegacyId) {
  if (!idOrLegacyId) return null;

  let poster = null;
  if (isUUID(idOrLegacyId)) {
    poster = await prisma.poster.findUnique({
      where:   { id: idOrLegacyId },
      select:  POSTER_SELECT_CLIENT,
    });
  } else {
    poster = await prisma.poster.findUnique({
      where:   { legacyId: idOrLegacyId },
      select:  POSTER_SELECT_CLIENT,
    });
  }

  return formatPosterForClient(poster);
}

/**
 * Actualiza el estado de produccion/venta de un poster.
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

  try {
    const updated = await prisma.poster.update({
      where:   { id },
      data:    { estado: newStatus, updatedAt: new Date() },
      include: POSTER_INCLUDE_LIGHT,
    });

    await safeInvalidateEmbeddingsCache();
    return formatPosterForClient(updated);
  } catch (error) {
    if (error.code === 'P2025') {
      const err = new Error(`No se encontró la obra con ID "${id}".`);
      err.statusCode = 404;
      throw err;
    }
    throw error;
  }
}

/**
 * Crea o actualiza un poster en PostgreSQL usando Prisma.
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

  // Resuelve el franchiseId (soporta CUID directo o slug como 'dc', 'marvel')
  let finalFranchiseId = null;
  const rawFranchiseKey = inputFranchiseId || franchise || null;
  if (rawFranchiseKey) {
    const byId = await prisma.franchise.findUnique({ where: { id: rawFranchiseKey } });
    if (byId) {
      finalFranchiseId = byId.id;
    } else {
      const bySlug = await prisma.franchise.findUnique({ where: { slug: rawFranchiseKey } });
      finalFranchiseId = bySlug?.id || null;
    }
  }

  const sizesData = buildSizesForUpsert(sizes, availableSizes);

  // Generar vector de embedding semántico de 768 dimensiones (RAG)
  let embeddingVector = undefined;
  try {
    const { generatePosterEmbedding } = await import('./embeddingService.js');
    embeddingVector = await generatePosterEmbedding({
      titulo: finalTitle,
      categoria: finalCategory,
      subtitulo: subtitle ?? subtitulo,
      descripcion: description ?? descripcion,
      tags: Array.isArray(tags) ? tags : [],
      franchise: rawFranchiseKey
    });
  } catch (embErr) {
    console.warn('[Deco Catalog] No se pudo generar embedding en tiempo real para la obra:', embErr.message);
  }

  // Determina si existe por id (UUID) o por legacyId
  let existingPoster = null;
  if (inputId && isUUID(inputId)) {
    existingPoster = await prisma.poster.findUnique({ where: { id: inputId } });
  }
  if (!existingPoster && finalLegacyId) {
    existingPoster = await prisma.poster.findUnique({ where: { legacyId: finalLegacyId } });
  }

  if (existingPoster) {
    // Transacción para renovar tamaños
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
          ...(embeddingVector && embeddingVector.length === 768 && {
            embedding:  embeddingVector
          }),
          ...(sizesData.length > 0 && {
            sizes: { create: sizesData }
          })
        },
        select: POSTER_SELECT_CLIENT,
      });
    }, {
      maxWait: 15000,
      timeout: 30000,
    });
    await safeInvalidateEmbeddingsCache();
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
      ...(embeddingVector && embeddingVector.length === 768 && {
        embedding:  embeddingVector
      }),
      sizes: { create: sizesData.length > 0 ? sizesData : buildSizesForUpsert(null, ['MINI', 'PEQUENO', 'MEDIANO', 'GRANDE', 'GIGANTE']) },
    },
    select: POSTER_SELECT_CLIENT,
  });

  await safeInvalidateEmbeddingsCache();
  return formatPosterForClient(created);
}

/**
 * Elimina un poster y sus sizes en cascada.
 *
 * @param {string} id - UUID del poster
 * @returns {Promise<void>}
 */
export async function deletePoster(id) {
  try {
    await prisma.poster.delete({ where: { id } });
    await safeInvalidateEmbeddingsCache();
  } catch (error) {
    if (error.code === 'P2025') {
      const err = new Error(`No se encontró la obra con ID "${id}".`);
      err.statusCode = 404;
      throw err;
    }
    throw error;
  }
}

export const DEFAULT_CATEGORIES = [
  { id: 'SUPERHEROES', name: 'SUPER HÉROES', icon: '⚡' },
  { id: 'ANIME', name: 'ANIME', icon: '⛩️' },
  { id: 'AUTOS', name: 'AUTOS', icon: '🚗' },
  { id: 'MUSICA', name: 'MÚSICA', icon: '🎵' },
  { id: 'SERIESYPELICULAS', name: 'SERIES Y PELÍCULAS', icon: '🎬' },
  { id: 'BASKETBALL_Y_FORMULA_1', name: 'FÓRMULA 1 Y BASKETBALL', icon: '🏎️' },
  { id: 'FUTBOL', name: 'FÚTBOL', icon: '⚽' },
  { id: 'INFANTILYDIBUJOSANIMADOS', name: 'INFANTIL Y DIBUJOS ANIMADOS', icon: '🧸' },
  { id: 'BEBIDAS_Y_BAR', name: 'BEBIDAS Y BAR', icon: '🍸' },
  { id: 'OBRASDEARTE', name: 'OBRAS DE ARTE', icon: '🖼️' },
  { id: 'VIDEO_JUEGOS', name: 'VIDEOJUEGOS', icon: '🎮' },
  { id: 'VINTAGE', name: 'VINTAGE & RETRO', icon: '🕰️' }
];

const CATEGORY_DISPLAY_NAMES = {
  SUPERHEROES: 'SUPER HÉROES',
  ANIME: 'ANIME',
  AUTOS: 'AUTOS',
  MUSICA: 'MÚSICA',
  SERIESYPELICULAS: 'SERIES Y PELÍCULAS',
  OBRASDEARTE: 'OBRAS DE ARTE',
  INFANTILYDIBUJOSANIMADOS: 'INFANTIL Y DIBUJOS ANIMADOS',
  CINE: 'CINE',
  BEBIDAS_Y_BAR: 'BEBIDAS Y BAR',
  BASKETBALL_Y_FORMULA_1: 'FÓRMULA 1 Y BASKETBALL',
  FUTBOL: 'FÚTBOL',
  VIDEO_JUEGOS: 'VIDEOJUEGOS',
  VINTAGE: 'VINTAGE & RETRO'
};

const CATEGORY_ICONS = {
  SUPERHEROES: '⚡',
  ANIME: '⛩️',
  AUTOS: '🚗',
  MUSICA: '🎵',
  SERIESYPELICULAS: '🎬',
  OBRASDEARTE: '🖼️',
  INFANTILYDIBUJOSANIMADOS: '🧸',
  CINE: '🎥',
  BEBIDAS_Y_BAR: '🍸',
  BASKETBALL_Y_FORMULA_1: '🏎️',
  FUTBOL: '⚽',
  VIDEO_JUEGOS: '🎮',
  VINTAGE: '🕰️'
};

// ── Categorías y Franquicias en PostgreSQL ────────────────────────────────────

/**
 * Obtiene la lista de categorías con conteo dinámico de obras activas en PostgreSQL.
 * @returns {Promise<Array<{ id: string, name: string, count: number }>>}
 */
export async function getAllCategories() {
  const counts = await prisma.poster.groupBy({
    by: ['categoria'],
    _count: { id: true },
    where: { isPublished: true, estado: { not: 'DESCONTINUADO' } }
  });

  const countMap = {};
  counts.forEach(c => { countMap[c.categoria] = c._count.id; });

  let dbCategories = [];
  try {
    dbCategories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
  } catch (err) {
    console.warn('[Categories] Could not load custom categories from prisma.category:', err.message);
  }

  let savedCategories = null;
  try {
    const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
    if (Array.isArray(settings?.categories) && settings.categories.length > 0) {
      savedCategories = settings.categories;
    }
  } catch (err) {
    console.warn('[Categories] Could not load custom categories from storeSettings:', err.message);
  }

  const baseList = dbCategories.length > 0 ? dbCategories : (savedCategories || DEFAULT_CATEGORIES);

  const categoryMap = new Map();
  baseList.forEach(cat => {
    const id = (typeof cat === 'string' ? cat : cat.id || '').toUpperCase().trim();
    if (id && id !== 'TODOS') {
      categoryMap.set(id, {
        id,
        name: typeof cat === 'object' && cat.name ? cat.name : (CATEGORY_DISPLAY_NAMES[id] || id.replace(/_/g, ' ')),
        icon: typeof cat === 'object' && cat.icon && cat.icon !== '🏷️' ? cat.icon : (CATEGORY_ICONS[id] || '🏷️')
      });
    }
  });

  // Asegurar que si una categoría tiene pósters reales en BD, aparezca
  counts.forEach(c => {
    const id = c.categoria;
    if (id && !categoryMap.has(id)) {
      categoryMap.set(id, {
        id,
        name: CATEGORY_DISPLAY_NAMES[id] || id.replace(/_/g, ' '),
        icon: CATEGORY_ICONS[id] || '🏷️'
      });
    }
  });

  const categoryList = Array.from(categoryMap.values()).map(cat => ({
    ...cat,
    count: countMap[cat.id] || 0
  }));

  const totalActive = Object.values(countMap).reduce((a, b) => a + b, 0);

  return [
    { id: 'TODOS', name: 'TODAS LAS OBRAS', icon: '🎨', count: totalActive },
    ...categoryList
  ];
}

/**
 * Crea o actualiza una categoría en PostgreSQL (prisma.category y store_settings.categories).
 */
export async function upsertCategory({ id, name, icon }) {
  const cleanId = (id || name).toUpperCase().replace(/\s+/g, '_');
  const cleanName = (name || id).trim().toUpperCase();
  const cleanIcon = icon || CATEGORY_ICONS[cleanId] || '🏷️';

  // 1. Mutar en tabla relacional categories
  try {
    await prisma.category.upsert({
      where: { id: cleanId },
      update: { name: cleanName, icon: cleanIcon },
      create: { id: cleanId, name: cleanName, icon: cleanIcon }
    });
  } catch (err) {
    console.warn('[Categories] Could not persist in prisma.category:', err.message);
  }

  // 2. Sincronizar store_settings.categories
  const current = await getAllCategories();
  const currentFiltered = current
    .filter(c => c.id !== 'TODOS')
    .map(c => ({ id: c.id, name: c.name, icon: c.icon || '🏷️' }));

  const existingIdx = currentFiltered.findIndex(c => c.id === cleanId);
  const newEntry = { id: cleanId, name: cleanName, icon: cleanIcon };

  if (existingIdx > -1) {
    currentFiltered[existingIdx] = newEntry;
  } else {
    currentFiltered.push(newEntry);
  }

  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: { categories: currentFiltered },
    create: { id: 'default', categories: currentFiltered }
  });

  return await getAllCategories();
}

/**
 * Elimina una categoría si no contiene pósters activos.
 */
export async function deleteCategory(categoryId) {
  const cleanId = categoryId.toUpperCase().trim();

  // Validar que no tenga obras activas sin violar el enum estático de Prisma
  const counts = await prisma.poster.groupBy({
    by: ['categoria'],
    _count: { id: true },
    where: { isPublished: true, estado: { not: 'DESCONTINUADO' } }
  });

  const activeCount = counts.find(c => c.categoria === cleanId)?._count?.id || 0;
  if (activeCount > 0) {
    throw new Error(`No se puede eliminar la categoría "${cleanId}" porque contiene ${activeCount} obra(s).`);
  }

  // 1. Eliminar de tabla relacional categories
  try {
    await prisma.category.delete({
      where: { id: cleanId }
    });
  } catch (err) {
    console.warn('[Categories] Could not delete from prisma.category:', err.message);
  }

  // 2. Sincronizar store_settings.categories
  const current = await getAllCategories();
  const updatedCategories = current
    .filter(c => c.id !== 'TODOS' && c.id !== cleanId)
    .map(c => ({
      id: c.id,
      name: c.name,
      icon: c.icon || CATEGORY_ICONS[c.id] || '🏷️'
    }));

  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: { categories: updatedCategories },
    create: { id: 'default', categories: updatedCategories }
  });

  return await getAllCategories();
}

/**
 * Obtiene todas las franquicias desde la base de datos PostgreSQL.
 * @returns {Promise<Array>}
 */
export async function getAllFranchises() {
  const franchises = await prisma.franchise.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          posters: {
            where: { isPublished: true, estado: { not: 'DESCONTINUADO' } }
          }
        }
      }
    }
  });

  return franchises.map(f => ({
    id: f.slug || f.id,
    dbId: f.id,
    slug: f.slug,
    name: f.name,
    img: f.imageUrl || `/franchises/${f.slug}.webp`,
    imageUrl: f.imageUrl || `/franchises/${f.slug}.webp`,
    category: f.category,
    postersCount: f._count?.posters || 0,
  }));
}

/**
 * Crea o actualiza una franquicia en PostgreSQL (categoría opcional/independiente).
 */
export async function upsertFranchise({ id, slug, name, img, imageUrl, category }) {
  const cleanSlug = (slug || id || name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const validCategory = category ? normalizeCategory(category) : null;
  let image = imageUrl || img || `/franchises/${cleanSlug}.webp`;

  if (typeof image === 'string' && image.startsWith('data:image/')) {
    try {
      const { dataUrlToBuffer, processImageBuffer } = await import('./imageService.js');
      const buffer = dataUrlToBuffer(image);
      const processed = await processImageBuffer(buffer, `franchise-${cleanSlug}`);
      image = processed.image;
    } catch (e) {
      console.warn(`[CatalogService] Warning: Failed to convert base64 image for franchise ${cleanSlug}:`, e.message);
    }
  }

  return await prisma.franchise.upsert({
    where: { slug: cleanSlug },
    update: {
      name,
      imageUrl: image,
      category: validCategory,
    },
    create: {
      slug: cleanSlug,
      name,
      imageUrl: image,
      category: validCategory,
    }
  });
}

/**
 * Elimina una franquicia en PostgreSQL desvinculando pósters asociados.
 */
export async function deleteFranchise(slugOrId) {
  const franchise = await prisma.franchise.findFirst({
    where: {
      OR: [
        { slug: slugOrId },
        { id: slugOrId }
      ]
    }
  });
  if (!franchise) return false;

  await prisma.poster.updateMany({
    where: { franchiseId: franchise.id },
    data: { franchiseId: null }
  });

  await prisma.franchise.delete({
    where: { id: franchise.id }
  });

  return true;
}

// ── Configuraciones de Tienda (100% Persistidas en PostgreSQL vía Prisma) ──────

export async function getStoreSettings() {
  try {
    let settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.storeSettings.create({
        data: { id: 'default' }
      });
    }
    return {
      whatsappPhone: settings.whatsappPhone,
      storeName: settings.storeName,
      deliveryMinDays: settings.deliveryMinDays,
      deliveryMaxDays: settings.deliveryMaxDays,
      customCm2Price: Number(settings.customCm2Price),
      updatedAt: settings.updatedAt.toISOString()
    };
  } catch (err) {
    console.warn('[StoreSettings] Fallback safe recovery:', err.message);
    return {
      whatsappPhone: '50238375078',
      storeName: 'Deco Vintage Guate',
      deliveryMinDays: 2,
      deliveryMaxDays: 4,
      customCm2Price: 0.048,
      updatedAt: new Date().toISOString()
    };
  }
}

export async function updateStoreSettings(newSettings = {}) {
  try {
    const updateData = {};
    if (newSettings.whatsappPhone !== undefined) {
      updateData.whatsappPhone = String(newSettings.whatsappPhone).replace(/[^0-9]/g, '');
    }
    if (newSettings.storeName !== undefined) updateData.storeName = String(newSettings.storeName);
    if (newSettings.deliveryMinDays !== undefined) updateData.deliveryMinDays = parseInt(newSettings.deliveryMinDays, 10);
    if (newSettings.deliveryMaxDays !== undefined) updateData.deliveryMaxDays = parseInt(newSettings.deliveryMaxDays, 10);
    if (newSettings.customCm2Price !== undefined) updateData.customCm2Price = parseFloat(newSettings.customCm2Price);

    const settings = await prisma.storeSettings.upsert({
      where: { id: 'default' },
      update: updateData,
      create: {
        id: 'default',
        ...updateData,
      }
    });

    return {
      whatsappPhone: settings.whatsappPhone,
      storeName: settings.storeName,
      deliveryMinDays: settings.deliveryMinDays,
      deliveryMaxDays: settings.deliveryMaxDays,
      customCm2Price: Number(settings.customCm2Price),
      updatedAt: settings.updatedAt.toISOString()
    };
  } catch (err) {
    console.error('[StoreSettings Error] Failed updating store settings in PostgreSQL:', err.message);
    throw err;
  }
}

/**
 * Retorna el catálogo maestro completo unificado desde PostgreSQL.
 * @param {object} [options]
 * @param {boolean} [options.includeUnpublished=false] - Si es false, excluye borradores y descontinuados.
 * @returns {Promise<{ categories: Array, franchises: Array, settings: object, posters: Array, count: number, updatedAt: string }>}
 */
export async function getFullCatalog(options = {}) {
  const { includeUnpublished = false } = options;
  const [categories, franchises, settings, posters] = await Promise.all([
    getAllCategories(),
    getAllFranchises(),
    getStoreSettings(),
    getAllPosters({ includeUnpublished })
  ]);

  return {
    categories,
    franchises,
    settings,
    posters,
    count: posters.length,
    updatedAt: new Date().toISOString()
  };
}

// ── Helper privado ────────────────────────────────────────────────────────────

/** Tabla de precios base por tamano. */
const DEFAULT_SIZE_CATALOG = {
  MINI:          { nombre: 'Mini',             dimensiones: '14 x 21 cm',  anchoCm: 14,  altoCm: 21,  precio: 25,  badge: 'Ideal para coleccionar y escritorios' },
  PEQUENO:       { nombre: 'Pequeño',          dimensiones: '21 x 27 cm',  anchoCm: 21,  altoCm: 27,  precio: 35,  badge: 'Espacios reducidos y cabeceras' },
  PORTADA_ALBUM: { nombre: 'Portada de Álbum', dimensiones: '30 x 30 cm',  anchoCm: 30,  altoCm: 30,  precio: 55,  badge: 'Formato vinilo cuadrado para música' },
  MEDIANO:       { nombre: 'Mediano',          dimensiones: '30 x 45 cm',  anchoCm: 30,  altoCm: 45,  precio: 65,  badge: '⭐ El más vendido para habitaciones' },
  GRANDE:        { nombre: 'Grande',           dimensiones: '45 x 60 cm',  anchoCm: 45,  altoCm: 60,  precio: 125, badge: 'Protagonista para salas y oficinas' },
  GIGANTE:       { nombre: 'Gigante',          dimensiones: '60 x 100 cm', anchoCm: 60,  altoCm: 100, precio: 210, badge: 'Impacto visual monumental' },
  PERSONALIZADO: { nombre: 'Personalizado',    dimensiones: 'A convenir',  anchoCm: null,altoCm: null,precio: 250, badge: 'Medida especial negociada' },
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

// ── Exportar cliente Prisma para uso directo si fuera necesario ────────────────
export { prisma };