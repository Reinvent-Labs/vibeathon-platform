# Version

## 0.1.0 — 2026-06-09

- Rebuilt all seven VIBEATHON surfaces in Next.js using the approved brand designs.
- Added PostgreSQL-backed registration, selection, payment, badge, scanning, jury, and admin workflows.
- Added Docker Compose deployment, local staff authentication, SMTP/Wassenger notifications, and PaiementPro webhook support.
- Added an idempotent importer for the 408-row registration CSV, collapsing 13 duplicate submissions to 395 participant records.
- Kept form group names as application metadata; jury teams are now limited to official teams containing paid or confirmed participants.
- Enforced a 100-person selection cap and added admin team balancing for 1–5 selected participants, including individual applicants.
- Restricted the PostgreSQL host port to localhost so the database is not exposed on the server's public interfaces.
