# syntax=docker/dockerfile:1.7

# Single source of truth for the Node.js runtime used by every stage below.
# Node 20 is EOL; 24.22.3 is the November 2026 security release.
# Keep in sync with .nvmrc and package.json "engines" (Vercel uses the major from there).
# Each stage also upgrades ca-certificates-bundle: the pinned image ships
# 20260909-r0, which still trusts the emSign (eMudhra) roots removed in 20261020-r0.
ARG NODE_IMAGE=node:24.22.3-alpine@sha256:eb37f58646a901dc7727cf448cae36daaefaba79de33b5058dab79aa4c04aefb

# ---------- deps: install npm dependencies ----------
FROM ${NODE_IMAGE} AS deps
RUN apk add --no-cache libc6-compat openssl \
 && apk upgrade --no-cache ca-certificates-bundle
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ---------- builder: compile Next.js + Prisma client ----------
FROM ${NODE_IMAGE} AS builder
RUN apk add --no-cache libc6-compat openssl \
 && apk upgrade --no-cache ca-certificates-bundle
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# DATABASE_URL is not required at build time — Next.js doesn't connect, and Prisma only generates from the schema.
RUN npm run build

# ---------- migrator: small image used by docker-compose to apply the schema once before the app starts ----------
FROM ${NODE_IMAGE} AS migrator
RUN apk add --no-cache openssl \
 && apk upgrade --no-cache ca-certificates-bundle
WORKDIR /app
COPY --from=deps    /app/node_modules    ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY package.json ./
COPY prisma ./prisma
CMD ["npx", "prisma", "db", "push", "--skip-generate"]

# ---------- runner: minimal production image (no Prisma CLI, just the runtime client) ----------
FROM ${NODE_IMAGE} AS runner
RUN apk add --no-cache openssl \
 && apk upgrade --no-cache ca-certificates-bundle
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Standalone output bundles only the modules Next.js traced — including @prisma/client.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
