/**
 * middleware/rateLimit.js
 * In-memory rate limiter for the AI /api/jarvis/chat endpoint.
 * Max 30 requests per minute per IP.
 * Extracted from server.js lines 95–115.
 */

// ── State (module-level, survives across requests within a process) ───────────
const ipRequestCounts = new Map();

// ── Express middleware ───────────────────────────────────────────────────────

/**
 * Rate-limits requests to a maximum of 30 per minute per IP address.
 * Resets the counter automatically after each 60-second window.
 */
export function rateLimitAI(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  const windowMs = 60 * 1000;

  const record = ipRequestCounts.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count++;
  }
  ipRequestCounts.set(ip, record);

  if (record.count > 30) {
    return res.status(429).json({ error: 'Límite de mensajes alcanzado. Por favor espera unos momentos.' });
  }
  next();
}
