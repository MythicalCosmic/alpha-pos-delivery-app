# ===== Smart Food — Telegram Mini App image =====
# Stage 1: build the static bundle with Vite.
# Stage 2: serve it with nginx, reverse-proxying /api/smartfood to the backend.

# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

# Install deps from the lockfile for reproducible builds.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build-time config baked into the bundle (Vite inlines VITE_* at build).
# VITE_API_BASE stays a same-origin path so nginx can proxy it (no CORS).
ARG VITE_API_BASE=/api/smartfood
ARG VITE_YANDEX_MAPS_KEY=
ARG VITE_TRACK_POLL_MS=
ENV VITE_API_BASE=$VITE_API_BASE \
    VITE_YANDEX_MAPS_KEY=$VITE_YANDEX_MAPS_KEY \
    VITE_TRACK_POLL_MS=$VITE_TRACK_POLL_MS
RUN npm run build

# ---------- serve ----------
FROM nginx:1.27-alpine

# The Mini App is served from /webapp/ (matches CUSTOMER_WEBAPP_URL = https://host/webapp/).
COPY --from=build /app/dist /usr/share/nginx/html

# nginx renders this template at container start, substituting ${BACKEND_ORIGIN}
# (official image: /etc/nginx/templates/*.template -> envsubst -> /etc/nginx/conf.d/).
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Backend origin the API path is proxied to. Override at run time:
#   docker run -e BACKEND_ORIGIN=https://your-backend ...
ENV BACKEND_ORIGIN=https://pos.78.111.90.65.nip.io

EXPOSE 80
# (base image's CMD already runs the envsubst entrypoint then nginx)
