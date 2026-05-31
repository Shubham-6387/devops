# ============================================================
#  PowerHub Frontend — Multi-Stage Production Dockerfile
#  Stage 1: Node build (Vite + React production build)
#  Stage 2: Nginx static asset serving
# ============================================================

# ── Stage 1: Build ────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package manifests first for layer-cache efficiency
COPY package.json package-lock.json ./
RUN npm ci

# Copy all source files and build
COPY . .

# Accept build-time API URL arg (can be overridden at build time)
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# ── Stage 2: Nginx production server ─────────────────────
FROM nginx:1.27-alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
