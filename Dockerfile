# Wielostopniowy, bezpieczny kontener produkcyjny dla prawnBot
# Etap 1: Budowanie aplikacji Angular
FROM node:20-alpine AS builder

WORKDIR /app

# Kopiowanie zależności
COPY package*.json ./
RUN npm ci

# Kopiowanie kodu źródłowego
COPY . .

# Budowanie aplikacji do plików statycznych / SSR
RUN npm run build --configuration=production

# Etap 2: Lekki obraz produkcyjny z serwerem Node/Express
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Dodanie użytkownika nieuprzywilejowanego (Security hardening)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Kopiowanie tylko niezbędnych plików produkcyjnych
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "dist/app/server/server.mjs"]
