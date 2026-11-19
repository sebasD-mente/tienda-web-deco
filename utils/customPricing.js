/**
 * utils/customPricing.js
 * Motor puro canónico compartido (Frontend Vite + Backend Express/Docker)
 * para cálculo de precios de pósters estándar y medidas especiales con soporte decimal.
 * Paridad matemática exacta al centavo (Q 0.00 de diferencia) con Modulo_Ventas.
 */

export const DEFAULT_CM2_RATE = 0.048;
export const WOOD_CUSTOM_CUT_SURCHARGE = 25.00;
export const PVC_SURCHARGE = 15.00;
export const VINYL_DISCOUNT_FACTOR = 0.50;

/**
 * Parsea dimensiones en centímetros admitiendo punto o coma decimal (ej. "42.2", "48,5", 68.25).
 * @param {string|number|null|undefined} raw
 * @returns {number}
 */
export function parseDecimalCm(raw) {
  if (raw === null || raw === undefined || raw === '') return 0;
  const normalized = String(raw).trim().replace(',', '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
}

/**
 * Calcula de forma canónica el área, impresión base, precio unitario y total de un ítem.
 * - sizeMode === 'custom':
 *     mdf        -> (area * cm2Rate) + Q 25.00 (corte especial MDF)
 *     pvc        -> (area * cm2Rate) + Q 15.00
 *     vinyl_only -> (area * cm2Rate) * 0.50
 * - sizeMode === 'standard' (tamaños precortados OFFICIAL_SIZES):
 *     mdf        -> standardSizePrice (sin recargo de corte especial)
 *     pvc        -> standardSizePrice + Q 15.00
 *     vinyl_only -> standardSizePrice * 0.50
 */
export function calculateCanonicalPosterItemPrice({
  sizeMode = 'standard',
  standardSizePrice = 0,
  customWidth = 0,
  customHeight = 0,
  baseMaterial = 'mdf',
  quantity = 1,
  cm2Rate = DEFAULT_CM2_RATE,
  woodCustomCutSurcharge = WOOD_CUSTOM_CUT_SURCHARGE,
  pvcSurcharge = PVC_SURCHARGE,
  vinylFactor = VINYL_DISCOUNT_FACTOR,
} = {}) {
  const qty = Math.max(1, Math.min(500, Math.floor(Number(quantity) || 1)));
  const mat = String(baseMaterial || 'mdf').toLowerCase();

  let customArea = 0;
  let basePrint = 0;
  let rawUnitPrice = 0;

  if (sizeMode === 'custom') {
    const w = parseDecimalCm(customWidth);
    const h = parseDecimalCm(customHeight);
    if (w <= 0 || h <= 0) {
      return { customArea: 0, basePrint: 0, unitPrice: 0, totalPrice: 0, quantity: qty };
    }
    customArea = Number((w * h).toFixed(2));
    basePrint = customArea * (Number(cm2Rate) > 0 ? Number(cm2Rate) : DEFAULT_CM2_RATE);

    if (mat === 'pvc') {
      rawUnitPrice = basePrint + pvcSurcharge;
    } else if (mat === 'vinyl_only') {
      rawUnitPrice = basePrint * vinylFactor;
    } else {
      rawUnitPrice = basePrint + woodCustomCutSurcharge;
    }
  } else {
    const stdBase = Number(standardSizePrice) || 0;
    if (stdBase <= 0) {
      return { customArea: 0, basePrint: 0, unitPrice: 0, totalPrice: 0, quantity: qty };
    }
    basePrint = stdBase;
    if (mat === 'pvc') {
      rawUnitPrice = stdBase + pvcSurcharge;
    } else if (mat === 'vinyl_only') {
      rawUnitPrice = stdBase * vinylFactor;
    } else {
      rawUnitPrice = stdBase;
    }
  }

  const unitPrice = Number(rawUnitPrice.toFixed(2));
  const totalPrice = Number((unitPrice * qty).toFixed(2));

  return {
    customArea,
    basePrint: Number(basePrint.toFixed(2)),
    unitPrice,
    totalPrice,
    quantity: qty,
  };
}
