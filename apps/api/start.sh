#!/bin/sh
set -e

pnpm -C apps/api exec prisma migrate deploy
node dist/main.js
