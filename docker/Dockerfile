# Qhub Info: build con Node (Vite) y servida con nginx (SPA).
# Las variables públicas llegan como argumentos de build desde el .env (ver compose.yaml).
FROM node:22-bookworm-slim AS build
ENV NODE_OPTIONS=--dns-result-order=ipv4first npm_config_update_notifier=false npm_config_fund=false npm_config_audit=false
ARG VITE_QHUB_API_BASE_URL
ARG VITE_QHUB_PLATFORM_URL
ENV VITE_QHUB_API_BASE_URL=$VITE_QHUB_API_BASE_URL VITE_QHUB_PLATFORM_URL=$VITE_QHUB_PLATFORM_URL
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json tsconfig.json vite.config.ts index.html ./
RUN npm ci
COPY public ./public
COPY src ./src
RUN npm run build

FROM nginx:1.27-alpine
# nginx sustituye ${API_ORIGIN} al arrancar (plantillas en /etc/nginx/templates)
ENV API_ORIGIN=https://qhub-api-a5yf.onrender.com
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
