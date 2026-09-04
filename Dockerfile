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
RUN npm run build && npm prune --omit=dev

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
COPY validators/ ./validators/
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

# Ensure non-root ownership for container security
RUN chown -R node:node /app

USER node

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["/app/entrypoint.sh"]
