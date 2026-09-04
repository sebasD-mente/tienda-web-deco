import { apiAskJarvis } from './apiClient.js';
import { getStoredPosters } from './catalogStorage.js';

const API_KEY_STORAGE_KEY = 'deco_gemini_api_key_v1';

// Purgado defensivo automático contra XSS: jamás persistir claves API en almacenamiento de navegador
if (typeof localStorage !== 'undefined') {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    localStorage.removeItem('deco_gemini_api_key');
  } catch (e) {}
}

/**
 * El frontend jamás debe gestionar o leer claves de API de Gemini;
 * el backend en VPS Hostinger / Dokploy es el único custodio autorizado.
 */
export function getGeminiApiKey() {
  return '';
}

/**
 * No-op de seguridad: el guardado de claves se realiza exclusivamente
 * mediante la ruta autenticada de administración /api/jarvis/save-key.
 */
export function saveGeminiApiKey() {
  return true;
}



/**
 * Main J.A.R.V.I.S. Query Function
 * Calls the secure backend proxy on the Hostinger VPS with zero client-side key exposure.
 */
export async function askJarvis(queryOrOptions, history = []) {
  let userQuery = '';
  let conversationHistory = history;
  let onExecuteTool = null;

  if (typeof queryOrOptions === 'string') {
    userQuery = queryOrOptions;
    conversationHistory = history;
  } else if (queryOrOptions && typeof queryOrOptions === 'object') {
    userQuery = queryOrOptions.userMessage || queryOrOptions.prompt || queryOrOptions.query || '';
    conversationHistory = queryOrOptions.conversationHistory || history;
    onExecuteTool = queryOrOptions.onExecuteTool || null;
  }

  userQuery = (userQuery || '').trim();
  const posters = getStoredPosters();

  try {
    // 1. Call Secure VPS Backend
    const serverResponse = await apiAskJarvis(userQuery, conversationHistory);
    let replyText = serverResponse.replyText || '';
    let executedActions = serverResponse.actions || [];

    // If server returned matching posters, ensure they preserve full live DB properties
    for (const action of executedActions) {
      if (action.type === 'catalog_matches' && Array.isArray(action.posters)) {
        action.posters = action.posters.map(p => {
          const found = (posters || []).find(local => local && local.id === p.id);
          return { ...(found || {}), ...p };
        });
      }
    }

    return {
      text: replyText,
      actions: executedActions,
      poweredBy: serverResponse.poweredBy || 'gemini-3.6-flash',
      isFallback: serverResponse.isFallback || false
    };
  } catch (err) {
    console.error('[ERROR CRÍTICO J.A.R.V.I.S. Brain] Error querying server:', err);
    return {
      text: 'El asistente J.A.R.V.I.S. no se encuentra disponible temporalmente. Por favor contáctanos vía WhatsApp.',
      actions: [],
      isFallback: true
    };
  }
}
