# ─────────────────────────────────────────────────────────────
# Frontend — Guia de DP (Vite SPA servida por nginx)
#
# VITE_API_BASE_URL é embutida NO BUILD. No deploy same-domain
# (frontend em / e backend em /api atrás do mesmo host), passe-a
# VAZIA para que as chamadas fiquem relativas (ex.: fetch('/api/faq')).
# ─────────────────────────────────────────────────────────────

# ---- Stage 1: build ----
FROM node:20-alpine AS build
WORKDIR /app

# Vazio por padrão → chamadas relativas ao mesmo host.
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: runtime (nginx estático) ----
FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
