#!/bin/sh
# =============================================================================
# Deco Vintage Guate — Container Bootstrap Entrypoint (Zero Split-Brain Edition)
# =============================================================================
# PURPOSE:
#   Ensures persistent upload directories exist, applies idempotent Prisma
#   PostgreSQL migrations (fail-fast under set -e), and launches the server.
#
# VOLUME LAYOUT (configured in Dokploy):
#   /app/public/posters/uploads      ← Persistent (WebP images & custom fallbacks)
# =============================================================================

set -e

echo ""
echo "=============================================="
echo " Deco Vintage Guate — Entrypoint Bootstrap"
echo "=============================================="

# ── Step 1: Guarantee the persistent uploads directories exist ─────────────
mkdir -p /app/public/posters/uploads/full
mkdir -p /app/public/posters/uploads/thumb
mkdir -p /app/public/posters/uploads/custom
echo "[Boot] Upload directories (/full, /thumb, /custom): OK"

# ── Step 2: Run idempotent Prisma migrations (Fail-Fast under set -e) ──────
echo "[Boot] Running prisma migrate deploy..."
npx prisma migrate deploy

echo ""
echo "[Boot] Bootstrap complete. Starting Node.js server..."
echo "=============================================="
echo ""

# ── Step 3: Hand off execution to the main server (PID 1) ─────────────────
exec node /app/server.js