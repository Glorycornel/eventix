#!/bin/sh
set -e

if command -v pnpm >/dev/null 2>&1; then
  pnpm exec prisma migrate deploy
elif command -v corepack >/dev/null 2>&1; then
  corepack pnpm exec prisma migrate deploy
else
  ./node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma
fi

if [ "${PRISMA_SEED_ON_BOOT:-false}" = "true" ]; then
  if command -v pnpm >/dev/null 2>&1; then
    pnpm exec prisma db seed
  elif command -v corepack >/dev/null 2>&1; then
    corepack pnpm exec prisma db seed
  else
    ./node_modules/.bin/prisma db seed --schema=prisma/schema.prisma
  fi
fi

node dist/main.js
