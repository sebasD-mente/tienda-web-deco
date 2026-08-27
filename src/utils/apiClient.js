/**
 * Deco Vintage Guate - Centralized API Client
 * Manages all network communications with the VPS Hostinger backend.
 */

const TOKEN_KEY = 'deco_admin_auth_token_v1';

export function getAuthToken() {
  try {
    if (typeof localStorage !== 'undefined') {
      const tok = localStorage.getItem(TOKEN_KEY);
      if (tok) return tok;
    }
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem(TOKEN_KEY) || '';
    }
  } catch (e) {}
  return '';
}

export function setAuthToken(token) {
  try {
    if (typeof localStorage !== 'undefined') {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
    if (typeof sessionStorage !== 'undefined') {
      if (token) {
        sessionStorage.setItem(TOKEN_KEY, token);
      } else {
        sessionStorage.removeItem(TOKEN_KEY);
      }
    }
  } catch (e) {}
}

export function clearAuthToken() {
  setAuthToken('');
}

function getHeaders(isJson = true) {
  const headers = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// 1. Get Master Catalog from Server
export async function apiGetCatalog() {
  try {
    const res = await fetch('/api/catalog', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[API Client] Falling back to local catalog:', err.message);
    return null;
  }
}

// 2. Save Master Catalog to Server
export async function apiSaveCatalog(catalogPayload) {
  try {
    const res = await fetch('/api/catalog/save', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(catalogPayload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || `HTTP Error ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error('[API Client] Error saving catalog to server:', err);
    throw err;
  }
}

// 3. Upload and Optimize Image on Server (WebP Full + Thumb)
export async function apiUploadPosterImage(dataUrl, posterId) {
  try {
    const res = await fetch('/api/catalog/upload', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ dataUrl, posterId })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || `HTTP Error ${res.status}`);
    }
    return data; // { success: true, image: '/posters/uploads/full/...', thumb: '/posters/uploads/thumb/...' }
  } catch (err) {
    console.error('[API Client] Error uploading poster image:', err);
    throw err;
  }
}

// 4. Admin Authentication
export async function apiAdminLogin(username, password) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok && data.success && data.token) {
      setAuthToken(data.token);
      return { success: true, user: data.user };
    }
    return { success: false, error: data.error || 'Credenciales incorrectas' };
  } catch (err) {
    console.error('[API Client] Login error:', err);
    return { success: false, error: 'Error de conexión con el servidor.' };
  }
}

// 5. Admin Verification
export async function apiAdminVerify() {
  const token = getAuthToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: getHeaders(true)
    });
    const data = await res.json();
    return data.valid === true;
  } catch (e) {
    return false;
  }
}

// 6. Save Store Settings (WhatsApp Phone, etc.)
export async function apiSaveSettings(settingsPayload) {
  try {
    const res = await fetch('/api/settings/save', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(settingsPayload)
    });
    return await res.json();
  } catch (err) {
    console.error('[API Client] Error saving settings:', err);
    throw err;
  }
}

// 7. J.A.R.V.I.S. Secure AI Query
export async function apiAskJarvis(prompt, history = []) {
  try {
    let clientKey = '';
    try {
      if (typeof localStorage !== 'undefined') {
        clientKey = localStorage.getItem('deco_gemini_api_key_v1') || '';
      }
    } catch (e) {}

    const headers = { 'Content-Type': 'application/json' };
    if (clientKey) {
      headers['x-gemini-key'] = clientKey;
    }

    const res = await fetch('/api/jarvis/chat', {
      method: 'POST',
      headers,
      body: JSON.stringify({ prompt, history, apiKey: clientKey })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    return await res.json(); // { replyText, actions }
  } catch (err) {
    console.error('[API Client] Jarvis API error:', err);
    return {
      replyText: 'No pude conectar con el cerebro principal en este momento. Por favor escríbenos directamente a WhatsApp.',
      actions: []
    };
  }
}
