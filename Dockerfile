# Production Dockerfile for Deco Vintage Guate (Dokploy / VPS Hostinger)
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies and build frontend
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production Runtime
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled frontend, assets, persistent data and server
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/data ./data
COPY server.js ./

EXPOSE 80
EXPOSE 3000

ENV PORT=80
ENV NODE_ENV=production

CMD ["node", "server.js"]
