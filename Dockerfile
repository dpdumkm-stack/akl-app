# --- TAHAP 1: BUILD ---
FROM node:20-slim AS builder

# Instal dependensi sistem yang dibutuhkan untuk build Prisma/Sharp (jika ada)
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma Client & Build Next.js
RUN npx prisma generate
RUN npm run build

# --- TAHAP 2: RUNNER ---
FROM node:20-slim AS runner

# Instal Chromium dan Font untuk Puppeteer di Linux
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-freefont-ttf \
    libnss3 \
    libatk-bridge2.0-0 \
    libxss1 \
    libasound2 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set variabel lingkungan untuk Cloud / Docker
ENV NODE_ENV=production \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PORT=3000

WORKDIR /app

# Copy hasil build dari tahap sebelumnya
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Jalankan migrasi DB otomatis saat kontainer dijalankan
CMD npx prisma db push && npm run start
