/**
 * validators/adminSchemas.js
 * Declarative Zod schemas for administrative API endpoints.
 * Enforces strict input validation to reject invalid/malicious payloads with HTTP 400.
 */

import { z } from 'zod';

export const CANONICAL_CATEGORIES = [
  'SUPERHEROES',
  'INFANTILYDIBUJOSANIMADOS',
  'BASKETBALL_Y_FORMULA_1',
  'ANIME',
  'SERIESYPELICULAS',
  'MUSICA',
  'FUTBOL',
  'BEBIDAS_Y_BAR',
  'OBRASDEARTE',
  'VIDEO_JUEGOS',
  'AUTOS',
  'VINTAGE'
];

export const POSTER_STATUSES = [
  'DISPONIBLE',
  'SEPARADO',
  'PENDIENTE_PRODUCCION',
  'EN_PRODUCCION',
  'LISTO_PARA_ENTREGA',
  'ENTREGADO',
  'DESCONTINUADO'
];

export const CUSTOM_ORDER_STATUSES = [
  'PENDIENTE',
  'COTIZADO',
  'EN_PROCESO',
  'EN_PRODUCCION',
  'LISTO',
  'COMPLETADO',
  'ENTREGADO',
  'CANCELADO'
];

function isValidCategory(val) {
  if (!val || typeof val !== 'string') return false;
  const upper = val.toUpperCase().trim();
  return CANONICAL_CATEGORIES.includes(upper);
}

/**
 * Schema for creating a poster (POST /api/catalog/posters)
 */
export const posterCreateSchema = z.object({
  id: z.string().optional(),
  legacyId: z.string().optional(),
  titulo: z.string().trim().min(1, 'El título del póster es obligatorio.').optional(),
  title: z.string().trim().min(1, 'El título del póster es obligatorio.').optional(),
  subtitulo: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  categoria: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number({ invalid_type_error: 'El precio mínimo debe ser un número.' })
    .min(0, 'El precio mínimo no puede ser negativo.')
    .nullable()
    .optional(),
  precioMinimo: z.number({ invalid_type_error: 'El precio mínimo debe ser un número.' })
    .min(0, 'El precio mínimo no puede ser negativo.')
    .nullable()
    .optional(),
  franchiseId: z.string().nullable().optional(),
  franchise: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  thumb: z.string().nullable().optional(),
  thumbUrl: z.string().nullable().optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  availableSizes: z.array(z.string()).optional(),
  sizes: z.array(z.any()).optional(),
  estado: z.enum(POSTER_STATUSES).optional(),
  status: z.enum(POSTER_STATUSES).optional(),
  rating: z.number().optional(),
  reviewsCount: z.number().int().optional()
}).passthrough()
.superRefine((data, ctx) => {
  const hasTitle = (data.titulo && data.titulo.trim().length > 0) || (data.title && data.title.trim().length > 0);
  if (!hasTitle) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El título del póster es obligatorio.',
      path: ['titulo']
    });
  }

  const cat = data.categoria || data.category;
  if (!cat || !isValidCategory(cat)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Categoría no válida.',
      path: ['categoria']
    });
  }
});

/**
 * Schema for updating a poster (PUT /api/catalog/posters/:id)
 */
export const posterUpdateSchema = z.object({
  id: z.string().optional(),
  legacyId: z.string().optional(),
  titulo: z.string().trim().min(1, 'El título del póster no puede estar vacío.').optional(),
  title: z.string().trim().min(1, 'El título del póster no puede estar vacío.').optional(),
  subtitulo: z.string().nullable().optional(),
  subtitle: z.string().nullable().optional(),
  descripcion: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  categoria: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number({ invalid_type_error: 'El precio mínimo debe ser un número.' })
    .min(0, 'El precio mínimo no puede ser negativo.')
    .nullable()
    .optional(),
  precioMinimo: z.number({ invalid_type_error: 'El precio mínimo debe ser un número.' })
    .min(0, 'El precio mínimo no puede ser negativo.')
    .nullable()
    .optional(),
  franchiseId: z.string().nullable().optional(),
  franchise: z.string().nullable().optional(),
  image: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  thumb: z.string().nullable().optional(),
  thumbUrl: z.string().nullable().optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  availableSizes: z.array(z.string()).optional(),
  sizes: z.array(z.any()).optional(),
  estado: z.enum(POSTER_STATUSES).optional(),
  status: z.enum(POSTER_STATUSES).optional(),
  rating: z.number().optional(),
  reviewsCount: z.number().int().optional()
}).passthrough()
.superRefine((data, ctx) => {
  if (data.titulo !== undefined && data.titulo.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El título del póster no puede estar vacío.',
      path: ['titulo']
    });
  }
  if (data.title !== undefined && data.title.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El título del póster no puede estar vacío.',
      path: ['title']
    });
  }

  const cat = data.categoria || data.category;
  if (cat !== undefined && !isValidCategory(cat)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Categoría no válida.',
      path: ['categoria']
    });
  }
});

/**
 * Schema for partial status/visibility update of a poster (PATCH /api/catalog/posters/:id)
 */
export const posterPatchSchema = z.object({
  estado: z.enum(POSTER_STATUSES, {
    errorMap: () => ({ message: 'Estado del póster no válido.' })
  }).optional(),
  status: z.enum(POSTER_STATUSES, {
    errorMap: () => ({ message: 'Estado del póster no válido.' })
  }).optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional()
}).passthrough()
.superRefine((data, ctx) => {
  const keys = Object.keys(data);
  if (keys.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'El cuerpo de la petición no puede estar vacío.',
      path: ['body']
    });
  }
});

/**
 * Schema for creating a category (POST /api/catalog/categories)
 */
export const categoryCreateSchema = z.object({
  id: z.string().optional(),
  name: z.string({
    required_error: 'El nombre de la categoría es obligatorio.'
  }).trim().min(1, 'El nombre de la categoría no puede estar vacío.'),
  icon: z.string().optional()
}).passthrough();

/**
 * Schema for creating a franchise (POST /api/catalog/franchises)
 */
export const franchiseCreateSchema = z.object({
  id: z.string().optional(),
  name: z.string({
    required_error: 'El nombre de la franquicia es obligatorio.'
  }).trim().min(1, 'El nombre de la franquicia no puede estar vacío.'),
  slug: z.string().optional(),
  img: z.string().optional(),
  imageUrl: z.string().optional(),
  category: z.string().optional()
}).passthrough();

/**
 * Schema for updating store settings (PUT /api/settings and POST /api/settings/save)
 */
export const settingsUpdateSchema = z.object({
  whatsappPhone: z.string().optional(),
  storeName: z.string().optional(),
  deliveryMinDays: z.number({
    invalid_type_error: 'deliveryMinDays debe ser un número entero.'
  }).int('deliveryMinDays debe ser un número entero.')
    .min(0, 'deliveryMinDays no puede ser negativo.')
    .optional(),
  deliveryMaxDays: z.number({
    invalid_type_error: 'deliveryMaxDays debe ser un número entero.'
  }).int('deliveryMaxDays debe ser un número entero.')
    .min(0, 'deliveryMaxDays no puede ser negativo.')
    .optional(),
  customCm2Price: z.number({
    invalid_type_error: 'customCm2Price debe ser un número.'
  }).min(0, 'customCm2Price debe ser un número positivo.')
    .optional(),
  categories: z.any().optional()
}).passthrough();

/**
 * Schema for updating custom order status (PATCH /api/custom-orders/:id/status and /orders/:id/status)
 */
export const orderStatusPatchSchema = z.object({
  status: z.enum(CUSTOM_ORDER_STATUSES, {
    errorMap: () => ({ message: 'Estado de la orden personalizado no válido.' })
  })
}).passthrough();
