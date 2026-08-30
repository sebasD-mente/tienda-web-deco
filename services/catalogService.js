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
 * @returns {Promise<import('@prisma/client').Poster[]>}
 */
export async function getAllPosters(opts = {}) {
  const {
    categoria,
    franchiseId,
    onlyFeatured    = false,
    includeUnpublished = false,
    orderBy         = 'createdAt',
    order           = 'desc',
  } = opts;

  const where = {
    // Por defecto solo mostramos posters publicados al publico
    ...(!includeUnpublished && { isPublished: true }),
    // Estado excluye descontinuados del catalogo publico
    ...(!includeUnpublished && { estado: { not: 'DESCONTINUADO' } }),
    ...(categoria    && { categoria }),
    ...(franchiseId  && { franchiseId }),
    ...(onlyFeatured && { isFeatured: true }),
  };

  return prisma.poster.findMany({
    where,
    include: POSTER_INCLUDE_FULL,
    orderBy: { [orderBy]: order },
  });
}

/**
 * Busca un poster por UUID (id) o por legacyId (el ID del JSON original).
 * Acepta cualquiera de los dos formatos para no romper las URLs del frontend.
 *
 * @param {string} idOrLegacyId
 * @returns {Promise<import('@prisma/client').Poster | null>}
 */
export async function getPosterById(idOrLegacyId) {
  if (!idOrLegacyId) return null;

  // Intentamos primero por UUID nativo (36 chars con guiones)
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrLegacyId);

  if (isUUID) {
    return prisma.poster.findUnique({
      where:   { id: idOrLegacyId },
      include: POSTER_INCLUDE_FULL,
    });
  }

  // Si no es UUID, buscamos por legacyId (ej: "deco-mtdamr8z-px9v")
  return prisma.poster.findUnique({
    where:   { legacyId: idOrLegacyId },
    include: POSTER_INCLUDE_FULL,
  });
}

/**
 * Actualiza el estado de produccion/venta de un poster.
 * Valida que el estado sea un valor permitido antes de persistir.
 *
 * @param {string} id - UUID del poster en la BD
 * @param {import('@prisma/client').PosterStatus} newStatus
 * @returns {Promise<import('@prisma/client').Poster>}
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

  return prisma.poster.update({
    where:   { id },
    data:    { estado: newStatus, updatedAt: new Date() },
    include: POSTER_INCLUDE_LIGHT,
  });
}

/**
 * Crea o actualiza un poster desde el panel de administracion.
 * Si `legacyId` ya existe en BD → actualiza. Si no → crea nuevo.
 *
 * @param {object} data - Datos del poster tal como vienen del admin
 * @returns {Promise<import('@prisma/client').Poster>}
 */
export async function upsertPosterFromAdmin(data) {
  const {
    id: legacyId,
    title,
    subtitle,
    description,
    category,
    franchise,
    tags          = [],
    image,
    thumb,
    minPrice,
    priceDisplay,
    isFeatured    = false,
    rating,
    reviewsCount  = 0,
    availableSizes,
    sizes,
  } = data;

  // Resuelve el franchiseId si la franquicia existe en BD
  let franchiseId = null;
  if (franchise) {
    const fr = await prisma.franchise.findUnique({ where: { slug: franchise } });
    franchiseId = fr?.id || null;
  }

  // Construye los sizes para upsert anidado
  const sizesForCreate = buildSizesForUpsert(sizes, availableSizes);

  return prisma.poster.upsert({
    where:  { legacyId: legacyId || '__new__' },
    update: {
      titulo:       title       || '',
      subtitulo:    subtitle    || null,
      descripcion:  description || null,
      categoria:    category,
      franchiseId,
      tags:         Array.isArray(tags) ? tags : [],
      imageUrl:     image       || null,
      thumbUrl:     thumb       || null,
      precioMinimo: minPrice    != null ? minPrice : undefined,
      precioDisplay:priceDisplay|| null,
      isFeatured:   isFeatured  ?? false,
      rating:       rating      != null ? rating   : undefined,
      reviewsCount: reviewsCount ?? 0,
      updatedAt:    new Date(),
    },
    create: {
      legacyId,
      titulo:       title        || '',
      subtitulo:    subtitle     || null,
      descripcion:  description  || null,
      categoria:    category,
      franchiseId,
      tags:         Array.isArray(tags) ? tags : [],
      imageUrl:     image        || null,
      thumbUrl:     thumb        || null,
      precioMinimo: minPrice     != null ? minPrice : undefined,
      precioDisplay:priceDisplay || null,
      estado:       'DISPONIBLE',
      isPublished:  true,
      isFeatured:   isFeatured   ?? false,
      rating:       rating       != null ? rating  : undefined,
      reviewsCount: reviewsCount ?? 0,
      sizes: { create: sizesForCreate },
    },
    include: POSTER_INCLUDE_FULL,
  });
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