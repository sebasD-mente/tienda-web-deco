/**
 * middleware/auth.js
 * Stateless HMAC Token System — survives server restarts and container reloads.
 * Extracted from server.js lines 57–93.
 */

import crypto from 'crypto';

// ── Secrets ──────────────────────────────────────────────────────────────────
const ADMIN_USER  = process.env.ADMIN_USER     || 'SebasDmente';
const ADMIN_PASS  = process.env.ADMIN_PASSWORD || '4214294880101';
const AUTH_SECRET = process.env.ADMIN_SECRET   || 'deco_vintage_guate_secret_2026_master_key';

// Export credentials so other modules (e.g. authRoutes) can validate login
export { ADMIN_USER, ADMIN_PASS };

// ── Token generation ─────────────────────────────────────────────────────────

/**
 * Generates a signed HMAC token valid for 30 days.
 * @returns {string} hex-encoded token in the form `<payload>.<signature>`
 */
export function generateAuthToken() {
  const payload = JSON.stringify({ user: ADMIN_USER, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  const b64 = Buffer.from(payload).toString('hex');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(b64).digest('hex');
  return `${b64}.${sig}`;
}

// ── Token verification ───────────────────────────────────────────────────────

/**
 * Verifies a token's signature and expiry.
 * @param {string} token
 * @returns {boolean}
 */
export function verifyAuthToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const b64 = parts[0];
  const sig = parts[1];
  const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(b64).digest('hex');
  if (sig !== expectedSig) return false;
  try {
    const payload = JSON.parse(Buffer.from(b64, 'hex').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return false;
    return payload && payload.user === ADMIN_USER;
  } catch (e) {
    return false;
  }
}

// ── Express middleware ───────────────────────────────────────────────────────

/**
 * Express middleware — rejects requests without a valid Bearer token.
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/, '').trim();

  if (token && verifyAuthToken(token)) {
    return next();
  }
  return res.status(401).json({ success: false, error: 'Acceso no autorizado. Inicie sesión nuevamente.' });
}
