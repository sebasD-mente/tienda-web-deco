/**
 * middleware/auth.js
 * Stateless HMAC Token System — survives server restarts and container reloads.
 * Extracted from server.js lines 57–93.
 */

import crypto from 'crypto';

try {
  if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
  }
} catch (e) {}

// ── Dynamic Secret Getters (Reads from process.env on every call) ─────────────
export function getAdminUser() {
  return (process.env.ADMIN_USER || '').trim();
}

export function getAdminPass() {
  return (process.env.ADMIN_PASSWORD || '').trim();
}

export function getAuthSecret() {
  return (process.env.ADMIN_SECRET || 'deco_vintage_default_jwt_secret_key_2026').trim();
}

export const ADMIN_USER = getAdminUser();
export const ADMIN_PASS = getAdminPass();

/**
 * Compares two strings in constant time using crypto.timingSafeEqual (CWE-208 mitigation).
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length === 0 || bufB.length === 0) return false;

  const equalLength = bufA.length === bufB.length;
  const bufToCompare = equalLength ? bufB : bufA;
  const isEqual = crypto.timingSafeEqual(bufA, bufToCompare);

  return equalLength && isEqual;
}

// ── Token generation ─────────────────────────────────────────────────────────

/**
 * Generates a signed HMAC token valid for 30 days.
 * @returns {string} hex-encoded token in the form `<payload>.<signature>`
 */
export function generateAuthToken() {
  const adminUser = getAdminUser();
  const authSecret = getAuthSecret();
  if (!authSecret || !adminUser) {
    throw new Error('AUTH_SECRET and ADMIN_USER environment variables must be set.');
  }
  const payload = JSON.stringify({ user: adminUser, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  const b64 = Buffer.from(payload).toString('hex');
  const sig = crypto.createHmac('sha256', authSecret).update(b64).digest('hex');
  return `${b64}.${sig}`;
}

// ── Token verification ───────────────────────────────────────────────────────

/**
 * Verifies a token's signature and expiry using constant-time safeCompare (CWE-208 mitigation).
 * @param {string} token
 * @returns {boolean}
 */
export function verifyAuthToken(token) {
  const adminUser = getAdminUser();
  const authSecret = getAuthSecret();
  if (!authSecret || !adminUser) return false;
  if (!token || typeof token !== 'string' || !token.includes('.')) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const b64 = parts[0];
  const sig = parts[1];
  const expectedSig = crypto.createHmac('sha256', authSecret).update(b64).digest('hex');

  // Constant-time comparison for HMAC signature (CWE-208)
  if (!safeCompare(sig, expectedSig)) return false;

  try {
    const payload = JSON.parse(Buffer.from(b64, 'hex').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return false;

    // Constant-time comparison for user name (CWE-208)
    return payload && safeCompare(payload.user, adminUser);
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
