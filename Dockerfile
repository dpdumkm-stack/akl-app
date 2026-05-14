# --- TAHAP 1: BUILD ---
FROM node:20-slim AS builder

# Instal dependensi sistem yang dibutuhkan untuk build Prisma/Sharp (jika ada)
RUN apt-get update && apt-get install -y openssl python3 make g++ sqlite3 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Generate Prisma Client & Build Next.js
RUN npx prisma generate
RUN npm run build

# --- TAHAP 2: RUNNER ---
FROM node:20-slim AS runner

# Set variabel lingkungan untuk Cloud / Docker
ENV NODE_ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PORT=3000 \
    HOSTNAME="0.0.0.0"

# Instal dependensi runner: Chromium (PDF), Font, dan Curl (Healthcheck)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-freefont-ttf \
    libnss3 \
    libatk-bridge2.0-0 \
    libxss1 \
    libasound2 \
    curl \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy hasil build dari tahap sebelumnya
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Copy entrypoint script
COPY docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000

# Gunakan entrypoint yang lebih robust
ENTRYPOINT ["/entrypoint.sh"]
