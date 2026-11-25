# Imagen de la API de ParkOne.
# Al arrancar aplica las migraciones, carga los datos iniciales (si faltan) y
# levanta la API compilada.
FROM node:20-slim

# Prisma necesita OpenSSL para conectarse a PostgreSQL.
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src
RUN npx prisma generate && npm run build

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && npm run db:seed && node dist/main.js"]
