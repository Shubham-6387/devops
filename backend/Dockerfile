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

# Install Docker CLI + fuser (psmisc) + lsof so crash-simulate can stop containers
RUN apk add --no-cache docker-cli psmisc lsof

ENV PORT=5000
ENV NODE_ENV=production

EXPOSE 5000

# Run as root so docker socket access works (docker.sock is mounted at runtime)
CMD ["node", "src/server.js"]
