# syntax=docker/dockerfile:1.7

# ---------- deps: install npm dependencies ----------
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# ---------- builder: compile Next.js + Prisma client ----------
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# DATABASE_URL is not required at build time — Next.js doesn't connect, and Prisma only generates from the schema.
RUN npm run build

# ---------- migrator: small image used by docker-compose to apply the schema once before the app starts ----------
FROM node:20-alpine AS migrator
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps    /app/node_modules    ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY package.json ./
COPY prisma ./prisma
CMD ["npx", "prisma", "db", "push", "--skip-generate"]

# ---------- runner: minimal production image (no Prisma CLI, just the runtime client) ----------
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
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
