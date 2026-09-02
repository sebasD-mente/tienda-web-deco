/**
 * Deco Vintage Guate — Centralized API Client
 * Manages all network communications with the VPS Hostinger backend.
 *
 * Endpoints:
 *   Auth:
 *     POST /api/auth/login
 *     POST /api/auth/verify
 *
 *   Catálogo (lectura pública):
 *     GET  /api/catalog                  → catálogo completo (posters PG + meta JSON)
 *     GET  /api/catalog/posters          → listado de pósters (PG)
 *     GET  /api/catalog/posters/:id      → detalle de un póster
 *
 *   Pósters (admin — requiere token):
 *     POST   /api/catalog/posters        → crear póster → { poster }
 *     PUT    /api/catalog/posters/:id    → actualizar completo → { poster }
 *     PATCH  /api/catalog/posters/:id    → actualizar parcial → { poster }
 *     DELETE /api/catalog/posters/:id    → eliminar → { success }
 *
 *   Imagen (admin):
 *     POST /api/catalog/upload           → subir imagen → { image, thumb }
 *     POST /api/catalog/delete-image     → eliminar imagen del disco
 *
 *   Metadatos (admin — monolito JSON para cats / franquicias / settings):
 *     POST /api/catalog/save             → persiste catálogo completo → { catalog }
 *     POST /api/settings/save            → persiste solo settings
 *
 *   J.A.R.V.I.S.:
 *     POST /api/jarvis/chat
 */

const TOKEN_KEY = 'deco_admin_auth_token_v1';

// ── Token helpers ─────────────────────────────────────────────────────────────

export function getAuthToken() {
  try {
    // Purgar claves residuales de localStorage si existiesen
    if (typeof localStorage !== 'undefined' && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('deco_admin_auth');
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
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('deco_admin_auth');
      localStorage.removeItem('deco_admin_token');
    }
    if (typeof sessionStorage !== 'undefined') {
      if (token) {
        sessionStorage.setItem(TOKEN_KEY, token);
      } else {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem('deco_admin_auth');
        sessionStorage.removeItem('deco_admin_token');
      }
    }
  } catch (e) {}
}

export function clearAuthToken() {
  setAuthToken('');
}

function getHeaders(isJson = true) {
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  const token = getAuthToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/** Manejo centralizado de respuestas. Lanza si la respuesta no es OK. */
async function handleResponse(res) {
  const data = await res.json();
  if (res.status === 401) {
    clearAuthToken();
    throw new Error('Tu sesión de administrador ha expirado. Por favor vuelve a iniciar sesión.');
  }
  if (!res.ok) {
    throw new Error(data.error || data.details || `HTTP Error ${res.status}`);
  }
  return data;
}

// ── Catálogo — Lectura pública ─────────────────────────────────────────────────

/**
 * Obtiene el catálogo completo del servidor.
 * El backend intenta servir pósters desde PostgreSQL y usa JSON como fallback.
 * @returns {Promise<{ posters, categories, franchises, settings } | null>}
 */
export async function apiGetCatalog() {
  try {
    const res = await fetch('/api/catalog', {
      method:  'GET',
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return res.json();
  } catch (err) {
    console.warn('[API Client] apiGetCatalog falló, usando datos locales:', err.message);
    return null;
  }
}

// ── Pósters — Admin CRUD ───────────────────────────────────────────────────────

/**
 * Crea un nuevo póster en PostgreSQL.
 * El ID lo asigna el servidor (UUID). Si la imagen viene como base64 en el payload,
 * el backend la convierte a WebP automáticamente via Sharp.
 *
 * @param {object} posterData - Datos del póster desde el formulario.
 * @returns {Promise<{ success: boolean, poster: object }>}
 */
export async function apiCreatePoster(posterData) {
  const res = await fetch('/api/catalog/posters', {
    method:  'POST',
    headers: getHeaders(true),
    body:    JSON.stringify(posterData)
  });
  return handleResponse(res);
}

/**
 * Actualiza un póster existente (reemplazo completo).
 * @param {string} posterId - UUID del póster en PostgreSQL.
 * @param {object} posterData - Datos actualizados.
 * @returns {Promise<{ success: boolean, poster: object }>}
 */
export async function apiUpdatePoster(posterId, posterData) {
  const res = await fetch(`/api/catalog/posters/${posterId}`, {
    method:  'PUT',
    headers: getHeaders(true),
    body:    JSON.stringify(posterData)
  });
  return handleResponse(res);
}

/**
 * Actualiza parcialmente un póster (solo campos específicos).
 * Usado para toggle de isFeatured, cambio de estado, etc.
 * @param {string} posterId - UUID del póster.
 * @param {object} patch - Campos a actualizar (ej: { isFeatured: true }).
 * @returns {Promise<{ success: boolean, poster: object }>}
 */
export async function apiPatchPoster(posterId, patch) {
  const res = await fetch(`/api/catalog/posters/${posterId}`, {
    method:  'PATCH',
    headers: getHeaders(true),
    body:    JSON.stringify(patch)
  });
  return handleResponse(res);
}

/**
 * Elimina el registro de un póster en PostgreSQL.
 * @param {string} posterId - UUID del póster.
 * @returns {Promise<{ success: boolean }>}
 */
export async function apiDeletePosterRecord(posterId) {
  const res = await fetch(`/api/catalog/posters/${posterId}`, {
    method:  'DELETE',
    headers: getHeaders(false)
  });
  return handleResponse(res);
}

// ── Imagen — Upload y Delete ───────────────────────────────────────────────────

/**
 * Sube una imagen (dataUrl base64) al VPS SSD.
 * El backend la convierte a WebP via Sharp y guarda en /posters/uploads/.
 * @param {string} dataUrl - Imagen en formato data:image/... base64.
 * @param {string} posterId - ID usado para nombrar el archivo (puede ser el UUID de PG).
 * @returns {Promise<{ success: boolean, image: string, thumb: string }>}
 */
export async function apiUploadPosterImage(dataUrl, posterId) {
  const res = await fetch('/api/catalog/upload', {
    method:  'POST',
    headers: getHeaders(true),
    body:    JSON.stringify({ dataUrl, posterId })
  });
  return handleResponse(res);
}

/**
 * Elimina los archivos físicos .webp de un póster del disco VPS SSD.
 * @param {string} imagePath - Ruta relativa al full image (ej: /posters/uploads/full/...)
 * @param {string} thumbPath - Ruta relativa al thumbnail.
 * @returns {Promise<{ success: boolean }>}
 */
export async function apiDeletePosterImage(imagePath, thumbPath) {
  try {
    const res = await fetch('/api/catalog/delete-image', {
      method:  'POST',
      headers: getHeaders(true),
      body:    JSON.stringify({ imagePath, thumbPath })
    });
    return res.json();
  } catch (err) {
    console.warn('[API Client] apiDeletePosterImage falló (no crítico):', err.message);
    return { success: false };
  }
}

// ── Catálogo — Monolito (categorías / franquicias / settings) ─────────────────

/**
 * Persiste el catálogo completo en el VPS JSON (categorías, franquicias, settings).
 * Usado solo para metadatos que aún no tienen tabla en PostgreSQL.
 * @param {object} catalogPayload - { posters, categories, franchises, settings }
 * @returns {Promise<{ success: boolean, catalog: object }>}
 */
export async function apiSaveCatalog(catalogPayload) {
  const res = await fetch('/api/catalog/save', {
    method:  'POST',
    headers: getHeaders(true),
    body:    JSON.stringify(catalogPayload)
  });
  return handleResponse(res);
}

/**
 * Crea o actualiza una franquicia en PostgreSQL (Admin).
 * @param {object} franchisePayload - { id, slug, name, img, category }
 * @returns {Promise<{ success: boolean, franchise: object }>}
 */
export async function apiCreateFranchise(franchisePayload) {
  const res = await fetch('/api/catalog/franchises', {
    method:  'POST',
    headers: getHeaders(true),
    body:    JSON.stringify(franchisePayload)
  });
  return handleResponse(res);
}

/**
 * Elimina una franquicia en PostgreSQL (Admin).
 * @param {string} franchiseId - ID o slug de la franquicia.
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function apiDeleteFranchise(franchiseId) {
  const res = await fetch(`/api/catalog/franchises/${encodeURIComponent(franchiseId)}`, {
    method:  'DELETE',
    headers: getHeaders(true)
  });
  return handleResponse(res);
}

// ── Settings ──────────────────────────────────────────────────────────────────

/**
 * Persiste solo la configuración de la tienda (WhatsApp, etc.) en el backend.
 * @param {{ whatsappPhone: string }} settingsPayload
 * @returns {Promise<{ success: boolean, settings: object }>}
 */
export async function apiSaveSettings(settingsPayload) {
  const res = await fetch('/api/settings/save', {
    method:  'POST',
    headers: getHeaders(true),
    body:    JSON.stringify(settingsPayload)
  });
  return handleResponse(res);
}

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * Autentica al administrador con usuario y contraseña.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ success: boolean, user?: object, error?: string }>}
 */
export async function apiAdminLogin(username, password) {
  try {
    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password })
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

/**
 * Verifica si el token de sesión actual es válido en el servidor.
 * @returns {Promise<boolean>}
 */
export async function apiAdminVerify() {
  const token = getAuthToken();
  if (!token) return false;
  try {
    const res = await fetch('/api/auth/verify', {
      method:  'POST',
      headers: getHeaders(true)
    });
    if (!res.ok) {
      clearAuthToken();
      return false;
    }
    const data = await res.json();
    if (data.valid === true) {
      return true;
    }
    clearAuthToken();
    return false;
  } catch (e) {
    clearAuthToken();
    return false;
  }
}

// ── J.A.R.V.I.S. ─────────────────────────────────────────────────────────────

/**
 * Envía un prompt al backend de J.A.R.V.I.S. (Gemini AI).
 * @param {string} prompt
 * @param {Array} history
 * @returns {Promise<{ replyText: string, actions: Array }>}
 */
export async function apiAskJarvis(prompt, history = []) {
  const targetUrl = '/api/jarvis/chat';
  console.log(`[J.A.R.V.I.S. Network] 📡 Enviando consulta a: "${targetUrl}" (Proxy local: http://localhost:3000/api/jarvis/chat) | Prompt: "${prompt?.slice(0, 50)}..."`);

  try {
    const res = await fetch(targetUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ prompt, history }),
      signal:  AbortSignal.timeout(30000)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errorMsg = errData.error || errData.message || `HTTP ${res.status} (${res.statusText})`;
      console.error(`[ERROR CRÍTICO J.A.R.V.I.S. HTTP ${res.status}] ❌ Falló el endpoint ${targetUrl}:`, {
        status: res.status,
        statusText: res.statusText,
        error: errorMsg,
        url: res.url
      });
      throw new Error(errorMsg);
    }

    const data = await res.json();
    console.log(`[J.A.R.V.I.S. Network] ✅ Respuesta exitosa 200 OK recibida (${data.poweredBy || 'Motor IA'}):`, data);
    return data;

  } catch (err) {
    const isTimeout = err.name === 'TimeoutError' || err.name === 'AbortError';
    console.error('[ERROR CRÍTICO J.A.R.V.I.S.] 💥 Causa real de la desconexión:', {
      errorName: err.name,
      errorMessage: err.message,
      targetUrl,
      isTimeout,
      stack: err.stack
    });

    return {
      isFallback: true,
      replyText: 'No pude conectar con el cerebro principal en este momento. Por favor escríbenos directamente a WhatsApp.',
      actions: []
    };
  }
}
