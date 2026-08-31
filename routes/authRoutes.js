/**
 * routes/authRoutes.js
 * Authentication endpoints.
 * Extracted from server.js lines 152–178.
 */

import { Router } from 'express';
import crypto from 'crypto';
import {
  ADMIN_USER,
  ADMIN_PASS,
  generateAuthToken,
  verifyAuthToken
} from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Usuario y contraseña requeridos.' });
  }

  const userMatches = typeof username === 'string' && username.trim() === ADMIN_USER;
  const passBuffer = Buffer.from(typeof password === 'string' ? password.trim() : '', 'utf8');
  const adminPassBuffer = Buffer.from(ADMIN_PASS || '', 'utf8');
  const passMatches = passBuffer.length === adminPassBuffer.length && crypto.timingSafeEqual(passBuffer, adminPassBuffer);

  if (userMatches && passMatches) {
    const token = generateAuthToken();
    console.log(`[Deco Auth] Admin "${username}" authenticated successfully.`);
    return res.status(200).json({
      success: true,
      token,
      user: { username: ADMIN_USER, role: 'admin' }
    });
  }

  return res.status(401).json({ success: false, error: 'Usuario o contraseña incorrectos.' });
});

// POST /api/auth/verify
router.post('/auth/verify', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  if (token && verifyAuthToken(token)) {
    return res.status(200).json({ valid: true, user: ADMIN_USER });
  }
  return res.status(401).json({ valid: false });
});

export default router;
