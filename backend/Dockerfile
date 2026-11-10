# syntax=docker/dockerfile:1

# ---------- build ----------
FROM node:22-alpine AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# Manifiestos primero para aprovechar la caché de capas.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY backend/package.json backend/
COPY packages/shared/package.json packages/shared/
COPY packages/optimizer/package.json packages/optimizer/
RUN pnpm install --frozen-lockfile

COPY packages/shared packages/shared
COPY packages/optimizer packages/optimizer
COPY backend backend

RUN pnpm --filter @pachiplac/shared build \
 && pnpm --filter @pachiplac/backend build \
 && pnpm --filter @pachiplac/backend deploy --prod --legacy /prod/api

# ---------- runtime ----------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /prod/api ./
USER app
EXPOSE 3000
CMD ["node", "dist/main.js"]
