#!/bin/sh
set -e

echo "▶ Aplicando migrations do Prisma (migrate deploy)..."
npx prisma migrate deploy

echo "▶ Rodando seed idempotente do FAQ..."
npx tsx prisma/seed.ts || echo "⚠ Seed falhou (seguindo mesmo assim)."

echo "▶ Iniciando o backend..."
exec node dist/server.js
