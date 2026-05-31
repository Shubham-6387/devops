# ============================================================
#  PowerHub Backend — Multi-Stage Production Dockerfile
#  Stage 1: Install dependencies
#  Stage 2: Production runner (Node 20 Alpine)
# ============================================================

# ── Stage 1: Dependency installation ──────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package manifests first for layer-cache efficiency
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ── Stage 2: Production runtime ───────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only production node_modules and application code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Remove dev/debug scripts that don't belong in production
RUN rm -f checkApi.js checkCounts.js checkData.js checkNames.js checkProgress.js \
         seedProgress.js seedWorkouts.js exercises_dump.json

# Set secure ownership
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 5000

# Healthcheck — uses the root endpoint that returns "API is running..."
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/ || exit 1

CMD ["node", "server.js"]
