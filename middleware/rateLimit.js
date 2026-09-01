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
