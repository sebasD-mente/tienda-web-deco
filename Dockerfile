# Production Dockerfile for Deco Vintage Guate (Node.js + Express + Sharp Engine)
FROM node:20-slim AS build

WORKDIR /app

# Install all build dependencies
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production Runtime
FROM node:20-slim AS production

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled frontend and backend server
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY server.js ./
COPY config/ ./config/
COPY middleware/ ./middleware/
COPY routes/ ./routes/
COPY services/ ./services/
COPY utils/ ./utils/

# Copy repo data as SEED ONLY (read-only bootstrap for first run on a cold volume).
# The real runtime data lives in the persistent volume mounted at /app/data by Dokploy.
# The real uploads live in the persistent volume mounted at /app/public/posters/uploads by Dokploy.
COPY --from=build /app/data ./data_seed

# Copy and enable the entrypoint bootstrap script
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["/app/entrypoint.sh"]
