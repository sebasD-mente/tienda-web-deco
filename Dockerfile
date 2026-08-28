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

# Copy compiled frontend, assets, persistent data and backend server
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/data ./data
COPY server.js ./

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["node", "server.js"]
