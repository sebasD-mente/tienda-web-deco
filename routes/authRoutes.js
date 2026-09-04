/**
 * routes/authRoutes.js
 * Authentication endpoints.
 * Extracted from server.js lines 152–178.
 */

import { Router } from 'express';
import {
  getAdminUser,
  getAdminPass,
  safeCompare,
  generateAuthToken,
  verifyAuthToken
} from '../middleware/auth.js';
import {
  rateLimitLogin,
  recordLoginFailure,
  resetLoginFailures
} from '../middleware/rateLimit.js';

const router = Router();

// POST /api/auth/login (Protegido con rate limiting contra ataques de fuerza bruta)
router.post('/auth/login', rateLimitLogin, (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    recordLoginFailure(req);
    return res.status(400).json({ success: false, error: 'Usuario y contraseña requeridos.' });
  }

  const expectedUser = getAdminUser();
  const expectedPass = getAdminPass();

  const userMatch = safeCompare(username.trim(), expectedUser);
  const passMatch = safeCompare(password.trim(), expectedPass);

  if (userMatch && passMatch) {
    resetLoginFailures(req);
    const token = generateAuthToken();
    console.log('[Deco Auth] Admin authenticated successfully.');
    return res.status(200).json({
      success: true,
      token,
      user: { username: expectedUser, role: 'admin' }
    });
  }

  recordLoginFailure(req);
  return res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos.' });
});

// POST /api/auth/verify
router.post('/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  if (token && verifyAuthToken(token)) {
    return res.status(200).json({ valid: true, user: getAdminUser() });
  }
  return res.status(401).json({ valid: false });
});

export default router;
