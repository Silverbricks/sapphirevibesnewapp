# syntax=docker/dockerfile:1
#
# Production image for Sapphire Vibes (Next.js 15 + Prisma 6 + PostgreSQL).
#
# Built in three stages so the runtime image carries only what it needs to
# serve: the standalone server, static assets, and enough of the Prisma CLI to
# apply migrations at boot. Prisma needs openssl in every stage that touches it.

# ---- deps: resolve node_modules, including Prisma Client via postinstall ----
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
# schema.prisma must be present before npm ci: postinstall runs prisma generate.
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---- builder: compile Next in standalone mode -------------------------------
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# next build reads the schema for types; generate again in case the copy above
# brought a newer schema than deps saw.
RUN npx prisma generate && npm run build

# ---- runner: minimal runtime ------------------------------------------------
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Bind to all interfaces: the container boundary is the isolation here, not the
# loopback bind that package.json's "start" script uses under pm2.
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Standalone output bundles the server and only the traced dependencies.
# public/ and .next/static are deliberately excluded from it, so copy both.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Migrations plus the slice of Prisma needed to apply them on startup.
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Mount a volume here, or every redeploy destroys uploaded product images.
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads
VOLUME /app/public/uploads

USER nextjs
EXPOSE 3000

# migrate deploy only applies committed migrations — it never drops or resets.
# Invoked by file path rather than through node_modules/.bin, whose symlinks do
# not survive a partial node_modules copy.
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]
