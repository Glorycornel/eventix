# Eventix

Eventix is a full-stack event platform monorepo:

- `apps/web`: Next.js frontend (includes PWA support)
- `apps/api`: NestJS API with Prisma + PostgreSQL + Redis
- `packages/shared`: shared types/utilities

## Tech Stack

- Frontend: Next.js 14, React 18, Tailwind CSS
- Backend: NestJS 10, Prisma, PostgreSQL, Redis
- Payments: Stripe Checkout + Stripe webhooks
- Email: SMTP (works with Resend SMTP)
- Storage: S3-compatible object storage (Cloudflare R2 ready)
- Monorepo tooling: pnpm workspaces

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker + Docker Compose (recommended for local infra)

## Project Structure

```txt
.
├── apps
│   ├── api
│   └── web
├── packages
│   └── shared
├── docker-compose.yml
└── pnpm-workspace.yaml
```

## Environment Variables

Create a root `.env` file:

```bash
# Core
APP_URL=http://localhost:3000
DATABASE_URL=postgresql://eventix:eventix@localhost:5433/eventix
REDIS_URL=redis://localhost:6380
JWT_SECRET=change-me

# Email (Resend SMTP example)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=re_xxxxxxxxxxxxxxxxx
SMTP_FROM=Eventix <no-reply@your-domain.com>
SMTP_SECURE=true

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Optional verification tuning
EMAIL_VERIFY_TTL_SECONDS=86400
EMAIL_OTP_TTL_SECONDS=600
EMAIL_OTP_MAX_ATTEMPTS=5

# Optional S3/R2 uploads
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=eventix
S3_ENDPOINT=
S3_PUBLIC_URL=
S3_REGION=auto

# Web public env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_S3_PUBLIC_URL=
```

Notes:

- `.env` and `.env.*` are gitignored.
- For Resend SMTP, `SMTP_PORT=465` with `SMTP_SECURE=true` is correct.
- In production, set `APP_URL=https://your-domain.com`.

## Run with Docker (Recommended)

1. Install dependencies once (for local scripts/lint/test):

```bash
pnpm install
```

2. Start all services:

```bash
docker compose up --build
```

3. Open:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- Health: `http://localhost:3001/health`
- Swagger: `http://localhost:3001/docs`

4. Run database migrations (first run, or after schema changes):

```bash
pnpm --filter @eventix/api prisma:migrate
```

## Run Locally (without app containers)

1. Start infra only:

```bash
docker compose up -d postgres redis
```

2. Install deps:

```bash
pnpm install
```

3. Generate Prisma client and migrate DB:

```bash
pnpm --filter @eventix/api prisma:generate
pnpm --filter @eventix/api prisma:migrate
```

4. Run API and Web:

```bash
pnpm --filter @eventix/api dev
pnpm --filter @eventix/web dev
```

Or run both in parallel:

```bash
pnpm dev
```

## Scripts

From repo root:

```bash
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm format
pnpm format:check
```

App-specific:

```bash
pnpm --filter @eventix/api test
pnpm --filter @eventix/api test:unit
pnpm --filter @eventix/api test:e2e
pnpm --filter @eventix/api prisma:studio
pnpm --filter @eventix/web build
```

## Email Verification Flow

- Registration sends a 6-digit OTP email.
- User verifies using `/auth/verify-otp`.
- In non-production, if SMTP fails, API returns OTP in response for local testing.

## Deployment Notes

- Set production `APP_URL` (example: `https://eventixapp.site`).
- Point web env `NEXT_PUBLIC_API_BASE_URL` to your public API URL.
- Configure SMTP (Resend) and verify domain DNS records.
- Configure Stripe keys and webhook secret.
- Ensure PostgreSQL and Redis are reachable from API runtime.

## Troubleshooting

- Docker image pull TLS timeout:
  Retry build, switch network, or set Docker DNS; this is usually network-related.
- Prisma Studio cannot connect:
  Ensure Postgres is running and `DATABASE_URL` matches host/port.
- `getaddrinfo EAI_AGAIN smtp.resend.com`:
  DNS/network issue from runtime; verify outbound DNS/connectivity.
- Next.js warning about `sharp` in production:
  Install `sharp` for better image optimization.
