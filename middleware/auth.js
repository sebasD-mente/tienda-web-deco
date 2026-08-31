/**
 * middleware/auth.js
 * Stateless HMAC Token System — Zero-Trust hardened with Fail-Fast checks and timingSafeEqual.
 */

import crypto from 'crypto';

// ── Secrets & Environment Validation (Fail-Fast Zero-Trust Pattern) ───────────
const ADMIN_USER  = process.env.ADMIN_USER || 'SebasDmente';
const ADMIN_PASS  = process.env.ADMIN_PASSWORD;
const AUTH_SECRET = process.env.ADMIN_SECRET;

if (!AUTH_SECRET || !ADMIN_PASS) {
  console.error('❌ [FATAL SECURITY ERROR] Blindaje Zero-Trust: ADMIN_SECRET o ADMIN_PASSWORD no están configurados en las variables de entorno.');
  process.exit(1);
}

// Export credentials so other modules (e.g. authRoutes) can validate login
export { ADMIN_USER, ADMIN_PASS, AUTH_SECRET };

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
 * Verifies a token's signature using constant-time comparison (timingSafeEqual) and checks expiry.
 * @param {string} token
 * @returns {boolean}
 */
export function verifyAuthToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const b64 = parts[0];
  const sig = parts[1];

  try {
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(b64).digest('hex');
    const sigBuffer = Buffer.from(sig, 'utf8');
    const expectedSigBuffer = Buffer.from(expectedSig, 'utf8');

    // Constant-time signature comparison to prevent timing attacks
    if (sigBuffer.length !== expectedSigBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedSigBuffer)) {
      return false;
    }

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
