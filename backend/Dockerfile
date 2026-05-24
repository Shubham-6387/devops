# Stage 1: Build dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production runtime environment
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
COPY src/ ./src/

ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

USER node
CMD ["node", "src/server.js"]
