# syntax=docker/dockerfile:1.7
# =====================================================================
# Next.js production build — multistage, standalone output.
# Требует output: 'standalone' в next.config.mjs.
# =====================================================================

# --- Stage 1: deps -------------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /app
# Подменяем дефолтное зеркало Alpine на yandex — dl-cdn.alpinelinux.org часто тупит из РФ
RUN sed -i 's|dl-cdn.alpinelinux.org|mirror.yandex.ru/mirrors|g' /etc/apk/repositories && \
    apk add --no-cache libc6-compat
COPY package.json pnpm-lock.yaml* package-lock.json* ./
# npm registry на российское зеркало + pnpm 10 (pnpm 11 ругается на build-скрипты sharp/core-js)
RUN npm config set registry https://registry.npmmirror.com && \
    npm install -g pnpm@10 && \
    if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then npm ci; \
    else npm install; fi

# --- Stage 2: builder ---------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_API_URL прокидывается build-аргументом
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm install -g pnpm@10 && \
    if [ -f pnpm-lock.yaml ]; then pnpm build; \
    else npm run build; fi

# --- Stage 3: runner -----------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
