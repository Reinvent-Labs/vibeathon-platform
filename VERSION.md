# Version

## Unreleased

- Added a protected jury directory for all 20 definitive teams, including their domain and five-member contact roster, without changing finalist-only scoring.
- Added an idempotent definitive-roster importer and an explicit Team domain field, preserving the previous stored domain values during migration.
- Finalized the hackathon database at the definitive 100 competitors, closed further competition registration, and corrected the admin competitor count.
- Fixed the jury portal so unauthenticated jurors see the email-link login instead of staff password login, and removed jury password handling from staff-user management.
- Refined the VIBEATHON UI system across public, auth, scanner, jury, and admin surfaces while preserving the official event colors, and optimized logo image sizing.
- Added staff-user and event-session deletion controls with guarded admin APIs and audit logging.
- Simplified accepted participants as confirmed/paid-ok in the admin workflow, removing payment-pending labels from dashboard decisions and default notification copy.
- Removed Communications, Contenu du site, and Templates email from the admin navigation and tightened responsive admin action layouts.
- Added admin participant deletion from the list and review drawer, with confirmation, audit logging, and live table updates.

## 0.1.0 — 2026-06-09

- Rebuilt all seven VIBEATHON surfaces in Next.js using the approved brand designs.
- Added PostgreSQL-backed registration, selection, payment, badge, scanning, jury, and admin workflows.
- Added Docker Compose deployment, local staff authentication, SMTP/Wassenger notifications, and PaiementPro webhook support.
- Added an idempotent importer for the 408-row registration CSV, collapsing 13 duplicate submissions to 395 participant records.
- Kept form group names as application metadata; jury teams are now limited to official teams containing paid or confirmed participants.
- Enforced a 100-person selection cap and added admin team balancing for 1–5 selected participants, including individual applicants.
- Restricted the PostgreSQL host port to localhost so the database is not exposed on the server's public interfaces.
- Configured the labtest deployment service to run under its dedicated deployment user and GitHub key.
- Made database seeding non-destructive: existing event sessions, scan history, and administrator credentials are preserved across updates.
- Separated one-time CSV bootstrap from routine database setup and preserved official team assignments when an import is deliberately rerun.
- Reworked the responsive public navigation and footer, kept the candidature action visible on small screens, and applied Roboto Condensed and Inter consistently.
- Hardened staff authentication with strict signed sessions, active database-user checks, role validation, login throttling, safe redirects, and explicit logout on admin, jury, and scanner surfaces.
- Added additive audit logging, staff login timestamps, and reversible event-session archiving fields for operational traceability.
- Replaced fake staff users with super-admin account management for Admin, Jury, and Scanner roles, including one-time passwords, forced first-login password changes, role updates, deactivation, and secure password resets.
- Added a test-database-only QR badge fixture for repeatable end-to-end scanner validation without modifying registered participant data.
- Fixed the jury portal empty/error states, per-juror score locking and restoration, eligible-team validation, and reliable score submission feedback.
- Replaced the generic browser icon with the official VIBEATHON gradient monogram and wired it into site metadata and the installable scanner manifest.
- Reworked the admin overview around four real operational queues and added a complete candidate-review panel with imported answers, eligibility checks, and clear selection/rejection actions.
- Clarified the lifecycle as registered, accepted with payment pending, then official after payment; team, bootcamp, badge, scanner, and competition access now require payment.
- Configured Hostinger SMTP delivery for contact@vibeathonci.com and enforced STARTTLS for transactional emails.
- Rebuilt the browser and installable-app icons directly from the VIBEATHON logo and added the Reinvent Labs credit to the public footer.
- Added branded transactional email templates, WhatsApp template mappings, admin campaign sends, and QR badge attachments after confirmed payment.
- Improved email deliverability with multipart text/HTML messages and an explicit reply address.
- Connected the production configuration to `www.vibeathonci.com` and documented the Hostinger DNS plus labtest Caddy setup.
- Added automatic branded staff invitation and password-reset emails with delivery feedback in the admin interface.
- Added a dry-run-first, transactional competition decision importer that preserves paid participants, records an audit entry, separates test data from real capacity, and applies the 99 unique selections, 35 eliminations, and remaining waitlist safely.
- Fixed PaiementPro production checkout initialization, unique transaction references, signed callbacks, idempotent confirmation, and the payment return experience.
- Made payment demo confirmation impossible in production, even if the demo environment flag is accidentally enabled.
- Replaced placeholder admin settings, jury metrics, ranking, finalists, and presence counters with authenticated PostgreSQL-backed workflows.
- Made competition fees, capacity, registration state, and jury criteria configurable and enforced those settings in selection, payment, registration, and scoring APIs.
- Aligned the default and production competitor fee with the official 20 000 FCFA amount used in candidate communications.
- Added the in-admin site and email CMS with persistent image storage, sanitized templates, protected writes, validated uploads, and audited changes.
- Overrode the vulnerable transitive PostCSS release and restored a zero-vulnerability production dependency audit.
- Added per-session pass admission rules for competitors, visitors, adult training, and kids training badges.
- Added explicit scanner pass labels and rejection reasons plus attendance lists filterable by session and participant category.
- Restored TypeScript path resolution for operational scripts executed inside the production tools container.
- Connected the admin email-template CMS to candidate decisions, payment reminders, payment confirmations, and badge delivery with safe committed fallbacks.
- Removed the non-functional AI evaluation navigation and redirected its legacy URL to the real jury scoring workflow.
- Guaranteed that payment-confirmation and badge emails retain their embedded QR image even after rich-text customization.
- Added an explicit dashboard payment column, payment dates, and filters for pending, paid, and free registrations.
- Fixed the public payment button to initialize PaiementPro with the candidate reference after internal participant IDs were removed from the public status response.
- Added SMTP TLS server-name support so production mail can use a private relay while still validating Hostinger's SMTP certificate.
- Kept the Docker app port bound to localhost so public traffic must pass through Caddy.
- Added Resend HTTP email delivery support for servers where outbound SMTP is blocked.
