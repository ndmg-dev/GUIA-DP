# ─────────────────────────────────────────────────────────────
# Backend — Guia de DP (Express + Prisma)
# Multi-stage: compila com tsc, roda só o dist/ na imagem final.
# ─────────────────────────────────────────────────────────────

# ---- Stage 1: build ----
FROM node:20-alpine AS build
WORKDIR /app

# openssl é exigido pelo engine do Prisma no Alpine.
RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
# Gera o Prisma Client (precisa do schema já copiado).
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Stage 2: runtime ----
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package*.json ./
# Só dependências de produção...
RUN npm ci --omit=dev
# ...mas precisamos do prisma CLI (devDep) para "migrate deploy" no boot.
RUN npm install prisma@5.22.0 tsx@4.19.2 --no-save

# Artefatos do build e Prisma (schema + client gerado + seed).
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma
COPY src/data ./src/data

COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3333
ENTRYPOINT ["./docker-entrypoint.sh"]
