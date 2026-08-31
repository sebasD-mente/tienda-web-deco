# Production Dockerfile for Deco Vintage Guate (Node.js + Express + Sharp Engine)
# node:20-bookworm-slim fija Debian Bookworm (glibc 2.36) en ambas etapas.
FROM node:20-bookworm-slim AS build

WORKDIR /app

# Install all build dependencies
COPY package*.json ./
RUN npm install

# Generate Prisma Client BEFORE building — el cliente generado (.prisma/client/)
# viaja dentro de node_modules al stage production via COPY --from=build.
# Sin este paso, `new PrismaClient()` lanza un error fatal al arrancar Node.
COPY prisma/ ./prisma/
RUN npx prisma generate

COPY . .
RUN npm run build

# Production Runtime
# DEBE ser la misma imagen base que build para que los binarios nativos (sharp) coincidan.
FROM node:20-bookworm-slim AS production

WORKDIR /app

# Dependencias de sistema requeridas por Sharp (libvips) en runtime.
# Sin estas librerías, sharp falla al cargar su binding nativo con dlopen,
# causando logs completamente vacíos y 502 Bad Gateway.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips42 \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

# Copiar node_modules directamente desde build: los binarios nativos (sharp)
# son idénticos porque ambas etapas usan la misma imagen base bookworm-slim.
COPY --from=build /app/node_modules ./node_modules

# Copy compiled frontend and backend server
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY server.js ./
COPY config/ ./config/
COPY middleware/ ./middleware/
COPY routes/ ./routes/
COPY services/ ./services/
COPY utils/ ./utils/
COPY prisma/ ./prisma/
COPY scripts/ ./scripts/
COPY data/ ./data/

# Copy repo data as SEED ONLY (read-only bootstrap for first run on a cold volume).
# The real runtime data lives in the persistent volume mounted at /app/data by Dokploy.
# The real uploads live in the persistent volume mounted at /app/public/posters/uploads by Dokploy.
COPY --from=build /app/data ./data_seed

# Copy and enable the entrypoint bootstrap script
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# ── SECURITY: Pre-create persistent-volume directories and handoff ownership ──
# The 'node' user (UID 1000) ships with the base image. Pre-creating these dirs
# and chowning /app ensures entrypoint.sh can write to them without root.
# Persistent volumes mounted by Dokploy at /app/data and /app/public/posters/uploads
# must also be owned by 'node' — set this in the Dokploy volume settings or via
# a one-time 'chown -R 1000:1000 <host-path>' on the VPS before first deploy.
RUN mkdir -p /app/data \
             /app/data_seed \
             /app/public/posters/uploads/full \
             /app/public/posters/uploads/thumb \
    && chown -R node:node /app

# ── Drop privileges: run as non-root user 'node' (UID 1000 / GID 1000) ───────
# CIS Docker Benchmark 4.1 — processes must not run as root.
# Eliminates privilege-escalation vectors if a Remote Code Execution (RCE)
# vulnerability is ever exploited in Express routes or dependencies.
USER node

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# ── Health check: Docker / Traefik detect real container readiness ────────────
# Dokploy will mark the container UNHEALTHY if /api/health returns non-2xx
# for 3 consecutive checks (3 × 30s = 90s grace period before restart).
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["/app/entrypoint.sh"]
