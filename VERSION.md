# Version

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
