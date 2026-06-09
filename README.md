# VIBEATHON 2026 Platform

Self-hosted event-management platform for the VIBEATHON 2026 lifecycle:

`candidature → sélection → paiement → badge → scan → jury`

## Stack

- Next.js 16, React 19, strict TypeScript
- PostgreSQL 17 and Prisma 7
- Docker Compose with optional Caddy HTTPS proxy
- PaiementPro hosted checkout
- SMTP email and optional Wassenger WhatsApp
- QR badge generation, camera scanner PWA, jury scoring portal

The visual implementation follows the complete design bundle in
`../Design/vibethon`, using Roboto Condensed for display type and Inter for UI
and body copy.

## Existing registrations

The source file is committed at `data/registered-users.csv`.

- 408 source submissions
- 395 unique email addresses
- 13 duplicate submissions collapsed to the latest row for each email
- Proposed group names are retained on applications, but are not treated as
  official competition teams.

Every imported participant keeps the original Google Forms row in
`Participant.rawApplication` for auditability.

Official teams are created later by administrators from selected participants.
Selection is globally capped at 100 people regardless of their
application mode. Admins can form and rebalance teams of up to 5 selected
participants, including individual applicants. Only official teams whose
members have all paid or been confirmed appear in the jury portal.

## Local Docker setup

1. Review `.env` and replace all production secrets.
2. Start PostgreSQL:

```bash
docker compose up -d db
```

3. Create the schema, seed event configuration, and import the CSV:

```bash
npm run db:bootstrap
```

4. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Full server deployment

Create `.env` from `.env.example`, set `DOMAIN`, `NEXT_PUBLIC_APP_URL`,
database credentials, `SESSION_SECRET`, admin credentials, and provider keys.

```bash
docker compose build app
docker compose run --rm migrate
docker compose --profile production up -d
```

Caddy listens on ports 80 and 443 and provisions TLS automatically for a valid
public domain.

### Automatic deployment on `labtest`

The files in `deploy/labtest/` define a systemd timer that checks the GitHub
`main` branch every two minutes. When the revision changes it pulls the commit,
rebuilds the app image, runs the database setup/import idempotently, and
restarts only the VIBEATHON app service.

The server deployment uses `APP_PORT=3003` to avoid the existing services on
ports 3000–3002.

## Staff authentication

Set `AUTH_REQUIRED=true` in production. The seed command creates the first
admin using `ADMIN_EMAIL` and `ADMIN_INITIAL_PASSWORD`. Change that password
before exposing the server.

Roles:

- `SUPER_ADMIN` / `ADMIN`: `/admin`
- `JURY`: `/jury`
- `SCANNER`: `/scan`

Sessions use signed, HTTP-only cookies with 12-hour expiry. Sensitive APIs
repeat role checks server-side.

## PaiementPro

Set:

```env
PAIEMENTPRO_MERCHANT_ID=PP-F92248
PAIEMENTPRO_WEBHOOK_SECRET=...
PAIEMENTPRO_DEMO_MODE=false
```

Configure the provider webhook to:

```text
https://your-domain.example/api/webhooks/paiementpro
```

The webhook must send the shared secret in `x-paiementpro-secret`. Confirm the
exact production signature contract with PaiementPro before launch.

## Notifications

SMTP is optional in development. Without SMTP credentials, email sends are
recorded as `QUEUED` in `EmailLog` rather than discarded. Wassenger behaves the
same way until its API key and device ID are configured.

## Backups

Create a compressed PostgreSQL backup:

```bash
./scripts/backup.sh
```

Restore:

```bash
docker compose exec -T db pg_restore \
  -U vibeathon -d vibeathon --clean --if-exists \
  < backups/vibeathon-YYYYMMDD-HHMMSS.dump
```

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Important routes

- `/` landing page
- `/candidature`
- `/statut`
- `/badge/[qrCode]`
- `/admin`
- `/scan`
- `/jury`
- `/login`
