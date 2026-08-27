/**
 * Deco Vintage Guate - Configuración Global y Constantes
 */

export const DEFAULT_WHATSAPP_PHONE = '50238375078';
export const WHATSAPP_STORAGE_KEY = 'deco_store_whatsapp_phone_v1';

/**
 * Obtiene el número de WhatsApp oficial configurado en la tienda
 */
export function getStoreWhatsAppPhone() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(WHATSAPP_STORAGE_KEY);
      if (saved && saved.trim().length >= 8) {
        return saved.trim().replace(/[^0-9]/g, '');
      }
    }
  } catch (e) {}
  return DEFAULT_WHATSAPP_PHONE;
}

/**
 * Guarda y actualiza reactivamente el número de WhatsApp de la tienda
 */
export function saveStoreWhatsAppPhone(phoneNumber) {
  try {
    if (!phoneNumber) return false;
    const clean = phoneNumber.toString().trim().replace(/[^0-9]/g, '');
    if (clean.length < 8) return false;

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(WHATSAPP_STORAGE_KEY, clean);
      window.dispatchEvent(new CustomEvent('deco-whatsapp-updated', { detail: clean }));
      return true;
    }
  } catch (e) {
    console.error('Error saving WhatsApp phone:', e);
  }
  return false;
}

/**
 * Genera el enlace directo a WhatsApp con número y mensaje codificado
 */
export function generateWhatsAppLink(message, overridePhone = null) {
  const phone = overridePhone ? overridePhone.replace(/[^0-9]/g, '') : getStoreWhatsAppPhone();
  const encodedText = encodeURIComponent(message || '');
  return `https://wa.me/${phone}?text=${encodedText}`;
}
