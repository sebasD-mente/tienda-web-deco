/**
 * middleware/rateLimit.js
 * In-memory rate limiter for the AI /api/jarvis/chat endpoint.
 * Max 30 requests per minute per IP with unref() cleanup interval (CWE-400 mitigation).
 */

const ipRequestCounts = new Map();

// Periodic cleanup interval to prevent memory leaks in long-running Node processes
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequestCounts.entries()) {
    if (now > record.resetTime + 60000) {
      ipRequestCounts.delete(ip);
    }
  }
}, 5 * 60 * 1000);
cleanupInterval.unref(); // Prevents timer from holding the Node Event Loop open

/**
 * Rate-limits requests to a maximum of 30 per minute per IP address.
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
