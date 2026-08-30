#!/bin/sh
# =============================================================================
# Deco Vintage Guate — Container Bootstrap Entrypoint
# =============================================================================
# PURPOSE:
#   This script runs ONCE each time the container starts.
#   It ensures /app/data and /app/public/posters/uploads exist and are
#   initialized with seed data on a cold (empty) volume, WITHOUT ever
#   overwriting data that the admin has already saved in production.
#
# VOLUME LAYOUT (configured in Dokploy):
#   /app/data                        ← Persistent (catalogStore.json, jarvisConfig.json)
#   /app/public/posters/uploads      ← Persistent (WebP images uploaded by admin)
# =============================================================================

set -e

echo ""
echo "=============================================="
echo " Deco Vintage Guate — Entrypoint Bootstrap"
echo "=============================================="

# ── Step 1: Guarantee the data directory exists ────────────────────────────
mkdir -p /app/data
echo "[Boot] /app/data directory: OK"

# ── Step 2: Guarantee the uploads directories exist ────────────────────────
mkdir -p /app/public/posters/uploads/full
mkdir -p /app/public/posters/uploads/thumb
echo "[Boot] Upload directories: OK"

# ── Step 3: Seed catalogStore.json ONLY if volume is empty ────────────────
# If the admin has already saved a catalog, this file will exist in the
# persistent volume. We NEVER overwrite it.
if [ ! -f /app/data/catalogStore.json ]; then
  if [ -f /app/data_seed/catalogStore.json ]; then
    cp /app/data_seed/catalogStore.json /app/data/catalogStore.json
    echo "[Boot] catalogStore.json seeded from repo (cold start)."
  else
    echo "[Boot] WARNING: No seed catalogStore.json found. Server will start with empty catalog."
  fi
else
  echo "[Boot] catalogStore.json already exists in volume — skipping seed. Admin data preserved."
fi

# ── Step 4: Seed jarvisConfig.json ONLY if volume is empty ────────────────
if [ ! -f /app/data/jarvisConfig.json ]; then
  if [ -f /app/data_seed/jarvisConfig.json ]; then
    cp /app/data_seed/jarvisConfig.json /app/data/jarvisConfig.json
    echo "[Boot] jarvisConfig.json seeded from repo (cold start)."
  else
    echo "[Boot] INFO: No seed jarvisConfig.json found. Jarvis will use defaults."
  fi
else
  echo "[Boot] jarvisConfig.json already exists in volume — skipping seed. Config preserved."
fi

# ── Step 5: Seed any other files in data_seed that do NOT exist in data ───
if [ -d /app/data_seed ]; then
  for f in /app/data_seed/*; do
    filename=$(basename "$f")
    if [ ! -f "/app/data/$filename" ]; then
      cp "$f" "/app/data/$filename"
      echo "[Boot] Seeded extra file: $filename"
    fi
  done
fi

echo ""
echo "[Boot] Bootstrap complete. Starting Node.js server..."
echo "=============================================="
echo ""

# ── Step 6: Hand off execution to the main server (PID 1) ─────────────────
exec node /app/server.js