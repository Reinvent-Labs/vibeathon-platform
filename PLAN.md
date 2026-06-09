# VIBEATHON 2026 — Platform Build Plan

> Living build plan for the VIBEATHON 2026 event-management platform.
> Source of truth for scope, decisions, and sequencing.

## Context

Build the full event-management platform for **VIBEATHON 2026** (vibecoding hackathon, Sat 11 July 2026, CSCTICAO Abidjan). The event is ~1 month out, so the **registration → selection → payment → badge → door-scan** lifecycle is the critical path; the jury portal runs on event day; AI evaluation is deferred.

Three inputs already in `/Users/user/Documents/Projects/vibethon`:

1. **Design bundle** (`/tmp/vibe-design/vibethon/`) — pixel-perfect HTML/CSS prototypes of **all 7 surfaces** (homepage, candidature, statut, badge, admin, scanner, jury) plus a finished brand system in 4 CSS files. Visual source of truth; recreate in React/Next, matching output not internal structure.
2. **`Design/`** — official logos (color + white PNG) and the brand charte (palette, fonts, logo wordmark).
3. **`New-vibeathonci/`** — prior Vite app. **Not reused as a codebase** (we rebuild in Next.js), but its working **PaiementPro** integration (`server.ts`, merchant `PP-F92248`, methods Wave/Orange/MTN/card) is the payment reference.

## Decisions (confirmed)

| Topic | Decision |
|---|---|
| Stack | Rebuild fresh in **Next.js 16 (App Router)** + TypeScript strict + npm. (Scaffold shipped Next 16 / React 19 / Tailwind v4.) |
| Payments | **Keep PaiementPro** (already aggregates Wave / Orange Money / MTN / card). Add a real webhook + DB status update — the prior app had none. |
| Scope | Full platform now (all 7 surface frontends; backend prioritised on the critical path). |
| AI evaluation microservice | **Deferred.** Keep the `AIEvaluation` table + an admin "Évaluation IA" stub screen. No Python service yet. |

### Brand override note

Global CLAUDE.md defaults (Futura font, green-as-accent-only, neutral backgrounds, no em-dashes) are **overridden by the VIBEATHON brand** — the explicit user-provided design: Roboto Condensed + Inter fonts, and bold green→purple→pink gradients used as large surfaces (hero mesh, buttons, badge). Follow the design bundle. French copy keeps its em-dashes as designed.

## Tech stack

- **Framework:** Next.js 16 App Router (note: this Next has breaking changes vs training data — consult `node_modules/next/dist/docs/` before writing).
- **DB:** Supabase (Postgres + Auth + Storage + Realtime), **Prisma** ORM.
- **Styling:** Tailwind v4 + ported brand CSS (custom design system), shadcn/ui used selectively (dialog, sheet/drawer, dropdown, table primitives), `sonner` for toasts.
- **Auth:** Supabase Auth via `@supabase/ssr` — email/password for admin/jury/scanner; email lookup for participants.
- **Payments:** PaiementPro (hosted checkout + webhook).
- **QR:** `qrcode` (generate) + `html5-qrcode` (scan). Badge export via `html2canvas`.
- **Email:** Resend + `@react-email/components`.
- **WhatsApp:** Wassenger API.
- **Charts:** Recharts. **Tables:** TanStack Table.

## Target structure

New app at **`/Users/user/Documents/Projects/vibethon/vibeathon-platform`** (siblings `Design/`, `New-vibeathonci/` kept for reference). Fresh `git init`.

```
vibeathon-platform/
├── app/
│   ├── (public)/        page.tsx · candidature · status · badge/[qrCode]
│   ├── (admin)/         layout + admin/* (overview, candidatures, participants,
│   │                    equipes, presence, evaluation[stub], jury, communications,
│   │                    parametres, utilisateurs)
│   ├── (scanner)/       scan
│   ├── (jury)/          jury + jury/[teamId]
│   ├── api/             register, participant/status, payment/init,
│   │                    webhooks/paiementpro, scan, admin/*, jury/scores,
│   │                    communications/*, export/*
│   ├── layout.tsx · globals.css
├── components/  (Logo, public/*, admin/*, scanner/*, jury/*, ui/*)
├── lib/         (prisma, supabase/{client,server}, resend, wassenger,
│                 paiementpro, qrcode, utils)
├── emails/      (5 React Email templates)
├── prisma/      (schema.prisma, seed.ts)
├── ai-service/  (placeholder README — deferred)
├── middleware.ts · .env.example · docker-compose.yml · README.md
```

## Phases

### Phase 0 — Scaffold & permissions ✅
- `create-next-app` (TS, App Router, Tailwind, no src dir, npm, turbopack).
- Project `.claude/settings.json` allowlist (npm/npx/prisma/supabase/git/tsc/read-write) so the build isn't prompt-blocked. `git push` denied; `.env*` read denied.
- Install deps (Supabase, Prisma, Zod, sonner, qrcode, html5-qrcode, html2canvas, resend, react-email, recharts, tanstack-table, lucide, clsx, tailwind-merge).
- Copy logos → `public/logo-color.png`, `public/logo-white.png`.
- `.env.example` with all keys, **PaiementPro instead of CinetPay**; Anthropic/AI keys present but unused (deferred).

### Phase 1 — Design system port
- `app/globals.css` ← `brand.css` + `site.css` + `forms.css` + `admin.css` (vars, type helpers, buttons, gradient border, mesh/aurora keyframes, all section classes, reveal).
- `components/Logo.tsx` — `.vbt-logo` wordmark with `--logo-size` prop.
- Fonts: Roboto Condensed + Inter (Google Fonts `@import` in globals).
- Reusable: `AuroraMesh`, `Reveal` (IntersectionObserver), count-up + criteria-bar hooks.

### Phase 2 — Database (Prisma + Supabase)
- `prisma/schema.prisma` per spec (Competition, Phase, Session, Participant, ScanRecord, Team, JudgingCriteria, JuryScore, AIEvaluation, AdminUser, EmailLog + enums).
- `prisma/seed.ts` — Vibeathon 2026, 5 criteria (Impact 30 / Faisabilité 20 / Usage IA 20 / Innovation 15 / Pitch 15), 7 sessions, one super_admin.
- `lib/prisma.ts`, `lib/supabase/{client,server}.ts`.
- Run migrate + seed against Supabase.

### Phase 3 — Public site (recreate the 4 designed pages)
- `(public)/page.tsx` ← `index.html` (ticker, nav, aurora hero, concept, activities, timeline, prizes, criteria bars, audience, organizers, final CTA, footer + staff links).
- `(public)/candidature/page.tsx` ← `candidature.html` → `POST /api/register`.
- `(public)/status/page.tsx` ← `statut.html` (4 states) → `GET /api/participant/status`; pay → PaiementPro.
- `(public)/badge/[qrCode]/page.tsx` ← `badge.html` (real QR, PNG/print export, guard PAID/CONFIRMED).

### Phase 4 — Critical-path API routes
Consistent `{success, data?, error?}`, Zod-validated, auth-checked:
- `POST /api/register` (+ confirmation email, rate-limit 3/IP/hr)
- `GET /api/participant/status?email=`
- `POST /api/payment/init` (port PaiementPro init)
- `POST /api/webhooks/paiementpro` (verify → PAID → badge email + WhatsApp)
- `POST /api/scan` (ScanRecord, dedupe per session, return flash status)

### Phase 5 — Admin dashboard
`(admin)/layout.tsx` ← admin design. Pages by priority: overview (KPIs, profile breakdown, feed, registrations chart) · candidatures (TanStack table, filters, bulk status, CSV, drawer) · participants (PAID/CONFIRMED + QR + team builder) · equipes (grid + `[id]`) · presence (Realtime attendance) · jury (assign + aggregated weighted scores + declare winners) · communications (email/WhatsApp + EmailLog) · parametres (competition, criteria sum=100, sessions, fee) · utilisateurs (super_admin) · **evaluation (stub)**.

### Phase 6 — Scanner PWA
`(scanner)/scan/page.tsx` ← `scanner.html`: phone frame, session selector, `html5-qrcode` camera, green/amber/red flash states → `POST /api/scan`, live count, manual search fallback, `manifest.json` + service worker.

### Phase 7 — Jury portal
`(jury)/jury/page.tsx` + `jury/[teamId]/page.tsx` ← `jury.html`: team list + progress, per-criterion sliders (max = weight) + synced number, live /100 total, comment, submit → lock.

### Phase 8 — Notifications
- `emails/` — 5 templates (registration / selection / rejection / payment+badge / day-before).
- `lib/resend.ts`, `lib/wassenger.ts` (2 WA templates), `lib/paiementpro.ts`, `lib/qrcode.ts`.
- Wire `communications/email` + `communications/whatsapp` routes.

### Phase 9 — Cross-cutting
- `middleware.ts` — role-based route protection (admin/jury/scanner via `AdminUser.role`).
- Branded `not-found.tsx`, error boundaries, loading skeletons, sonner toasts.
- `README.md` (setup, env, migrate/seed, deploy, PaiementPro webhook, Wassenger) + `docker-compose.yml` (Postgres; AI service commented out).

## Deferred (out of scope this round)
- Python FastAPI AI microservice — `ai-service/` is a placeholder README; the DB table + admin stub let it slot in later.
- Wave CI fallback — PaiementPro already covers Wave.

## Open defaults (proceeding unless told otherwise)
- Participation fee: **configurable competition setting, default 5 000 FCFA** (matches `statut.html`).
- Participant status page: **email lookup per the design** (no magic link). Can add OTP later if privacy needs tightening.

## Verification
- `npx tsc --noEmit` clean after each phase.
- `prisma migrate` + seed succeed; Supabase tables populated.
- Playwright walk of the full lifecycle on real data: candidature → admin sees it → bulk-select → status flips + email logged → statut shows "sélectionné" → PaiementPro sandbox pay → webhook sets PAID → badge renders QR → scanner records ScanRecord (green) → re-scan amber → jury scores a team → admin aggregates show weighted total.
- Dark-mode contrast + mobile (320–480px) on public + scanner; tablet on jury.
- Commit per logical unit (one change = one commit); never push without explicit authorization.

## Status log
- **2026-06-09:** Phase 0 complete (scaffold, deps, permissions, logos). Phase 1 in progress (globals.css port).
