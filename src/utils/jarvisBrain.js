import { apiAskJarvis } from './apiClient.js';
import { getStoredPosters, getStoredCategories } from './catalogStorage.js';
import { getStoreKnowledge } from '../data/storeKnowledge.js';
import { getStoreWhatsAppPhone } from '../config/constants.js';

const API_KEY_STORAGE_KEY = 'deco_gemini_api_key_v1';

export function getGeminiApiKey() {
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(API_KEY_STORAGE_KEY);
      if (saved && !saved.startsWith('AIzaSyD0nw') && saved.trim().length >= 20) return saved.trim();
      if (saved && (saved.startsWith('AIzaSyD0nw') || saved.trim().length < 20)) {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
      }
    }
  } catch (e) {}
  return '';
}

export function saveGeminiApiKey(apiKey) {
  try {
    if (!apiKey) {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    } else {
      localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('deco-gemini-key-updated', { detail: apiKey }));
    }
    return true;
  } catch (e) {
    console.error('Failed to save API key:', e);
    return false;
  }
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
