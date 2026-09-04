/**
 * Deco Vintage Guate — Poster Helper Utilities
 * Centralized logic for computing accurate sizes, badges, and pricing displays across all components.
 */

import { OFFICIAL_SIZES } from '../data/catalogData.js';

/**
 * Resolves the array of available sizes for a given poster.
 * Handles both object-based `poster.sizes` and ID-based `poster.availableSizes`.
 *
 * @param {object} poster
 * @returns {Array<object>} Normalized list of size objects
 */
export function getPosterAvailableSizes(poster) {
  if (!poster) return OFFICIAL_SIZES;

  // 1. If poster has structured sizes objects
  if (Array.isArray(poster.sizes) && poster.sizes.length > 0) {
    const activeSizes = poster.sizes.filter(s => s && s.isActive !== false);
    if (activeSizes.length > 0) {
      return activeSizes.map(ps => {
        const off = OFFICIAL_SIZES.find(o => o.id === (ps.sizeId || ps.id));
        return {
          id: ps.sizeId || ps.id || off?.id,
          sizeId: ps.sizeId || ps.id || off?.id,
          name: ps.name || ps.nombre || off?.name || 'Estándar',
          nombre: ps.name || ps.nombre || off?.name || 'Estándar',
          dimensions: ps.dimensions || ps.dimensiones || off?.dimensions || '',
          dimensiones: ps.dimensions || ps.dimensiones || off?.dimensions || '',
          widthCm: ps.widthCm != null ? Number(ps.widthCm) : (ps.anchoCm != null ? Number(ps.anchoCm) : (off?.widthCm || 0)),
          heightCm: ps.heightCm != null ? Number(ps.heightCm) : (ps.altoCm != null ? Number(ps.altoCm) : (off?.heightCm || 0)),
          price: Number(ps.price || ps.precio || off?.price || 25),
          precio: Number(ps.price || ps.precio || off?.price || 25),
          badge: ps.badge || off?.badge || null
        };
      });
    }
  }

  // 2. If poster has availableSizes array of IDs
  if (Array.isArray(poster.availableSizes) && poster.availableSizes.length > 0) {
    const matched = OFFICIAL_SIZES.filter(s => poster.availableSizes.includes(s.id));
    if (matched.length > 0) {
      return matched;
    }
  }

  // 3. Fallback: default 5 standard rectangular sizes
  return OFFICIAL_SIZES.filter(s => ['MINI', 'PEQUENO', 'MEDIANO', 'GRANDE', 'GIGANTE'].includes(s.id));
}

/**
 * Returns the dynamic size badge string for a poster card.
 * (e.g. "30 x 30 cm" for square 1-size artwork, "5 Tamaños" for standard rectangular posters).
 *
 * @param {object} poster
 * @returns {string}
 */
export function getPosterSizeBadge(poster) {
  if (!poster) return '5 Tamaños';
  if (poster.sizeBadge && typeof poster.sizeBadge === 'string' && poster.sizeBadge.trim()) {
    return poster.sizeBadge;
  }

  const sizes = getPosterAvailableSizes(poster);
  if (sizes.length === 1) {
    const single = sizes[0];
    return single.dimensions || single.dimensiones || single.name || single.nombre || '1 Tamaño';
  }

  return `${sizes.length} Tamaños`;
}

/**
 * Returns the dynamic price display string for a poster card.
 * (e.g. "Q 55.00" for 1-size artwork, "Desde Q 25.00" for multiple sizes).
 *
 * @param {object} poster
 * @returns {string}
 */
export function getPosterPriceDisplay(poster) {
  if (!poster) return 'Desde Q 25.00';
  if (poster.priceDisplay && typeof poster.priceDisplay === 'string' && poster.priceDisplay.trim()) {
    return poster.priceDisplay;
  }

  const sizes = getPosterAvailableSizes(poster);
  if (sizes.length === 1) {
    const single = sizes[0];
    return `Q ${single.price.toFixed(2)}`;
  }

  if (sizes.length > 1) {
    const minPrice = Math.min(...sizes.map(s => s.price));
    return `Desde Q ${minPrice.toFixed(2)}`;
  }

  if (poster.minPrice != null && Number(poster.minPrice) > 0) {
    return `Desde Q ${Number(poster.minPrice).toFixed(2)}`;
  }

  return 'Desde Q 25.00';
}
