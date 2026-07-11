-- Additive, idempotent operational migration.
-- This file intentionally contains no DROP, TRUNCATE, or DELETE statements.
-- The guarded Team backfill below only populates a newly introduced field.

ALTER TABLE "Session"
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "location" TEXT,
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "Session_competitionId_archivedAt_startsAt_idx"
  ON "Session" ("competitionId", "archivedAt", "startsAt");

ALTER TABLE "AdminUser"
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Participant"
  ADD COLUMN IF NOT EXISTS "isTest" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT,
  "entityId" TEXT,
  "ipAddress" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'AuditLog_actorId_fkey'
  ) THEN
    ALTER TABLE "AuditLog"
      ADD CONSTRAINT "AuditLog_actorId_fkey"
      FOREIGN KEY ("actorId") REFERENCES "AdminUser"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS "AuditLog_actorId_createdAt_idx"
  ON "AuditLog" ("actorId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_action_createdAt_idx"
  ON "AuditLog" ("action", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx"
  ON "AuditLog" ("entityType", "entityId");

ALTER TABLE "ScanRecord"
  ADD COLUMN IF NOT EXISTS "acceptedKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "ScanRecord_acceptedKey_key"
  ON "ScanRecord" ("acceptedKey");

-- The previous implementation stored the team domain in "problem". Keep that
-- value intact while giving the domain an explicit, queryable home.
ALTER TABLE "Team"
  ADD COLUMN IF NOT EXISTS "domain" TEXT NOT NULL DEFAULT '';

UPDATE "Team"
  SET "domain" = "problem"
  WHERE "domain" = '';

-- Freeze the Phase 1 selection position before the human jury begins. This is
-- intentionally separate from "rank", which is reserved for final prizes.
ALTER TABLE "Team"
  ADD COLUMN IF NOT EXISTS "phase1Rank" INTEGER;

CREATE INDEX IF NOT EXISTS "Team_competitionId_isFinalist_phase1Rank_idx"
  ON "Team" ("competitionId", "isFinalist", "phase1Rank");
