/**
 * middleware/rateLimit.js
 * In-memory rate limiter for the AI /api/jarvis/chat endpoint.
 * Max 30 requests per minute per IP with automated TTL cleanup to prevent memory leaks.
 */

// ── State (module-level, survives across requests within a process) ───────────
const ipRequestCounts = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 30;
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // Run cleanup every 5 minutes

// Periodic garbage collection to eradicate memory leak from accumulated IPs
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequestCounts.entries()) {
    if (now > record.resetTime) {
      ipRequestCounts.delete(ip);
    }
  }
}, CLEANUP_INTERVAL_MS);

// Allow Node process to exit gracefully without being kept alive by the interval
if (cleanupTimer && cleanupTimer.unref) {
  cleanupTimer.unref();
}

/**
 * Rate-limits requests to a maximum of 30 per minute per IP address.
 * Resets the counter automatically after each 60-second window.
 */
export function rateLimitAI(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();

  const record = ipRequestCounts.get(ip);
  if (!record || now > record.resetTime) {
    ipRequestCounts.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return next();
  }

  record.count++;
  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Límite de mensajes alcanzado. Por favor espera unos momentos.' });
  }

  next();
}

// ── Rate Limiter para Login Admin (Protección anti fuerza bruta) ──────────────
const loginFailures = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const MAX_LOGIN_FAILURES = 5;

// Periodic garbage collection para limpiar registros expirados de login cada 5 minutos
const loginCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginFailures.entries()) {
    if (now > record.resetTime) {
      loginFailures.delete(ip);
    }
  }
}, 5 * 60 * 1000);

if (loginCleanupTimer && loginCleanupTimer.unref) {
  loginCleanupTimer.unref();
}

/**
 * Middleware: Bloquea IPs que alcancen 5 o más intentos fallidos en una ventana de 15 minutos.
 */
export function rateLimitLogin(req, res, next) {
  const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginFailures.get(ip);

  if (record && now < record.resetTime && record.count >= MAX_LOGIN_FAILURES) {
    return res.status(429).json({
      error: 'Demasiados intentos de inicio de sesión. Por favor intenta de nuevo en 15 minutos.'
    });
  }

  next();
}

/**
 * Registra un fallo de login para la IP del cliente.
 */
export function recordLoginFailure(req) {
  const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginFailures.get(ip);

  if (!record || now > record.resetTime) {
    loginFailures.set(ip, { count: 1, resetTime: now + LOGIN_WINDOW_MS });
  } else {
    record.count++;
  }
}

/**
 * Restablece los fallos de login para la IP del cliente tras una autenticación exitosa.
 */
export function resetLoginFailures(req) {
  const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
  loginFailures.delete(ip);
}

// Alias canónico compatible
export const loginRateLimiter = rateLimitLogin;

