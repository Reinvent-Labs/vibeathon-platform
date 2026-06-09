import { randomUUID } from "node:crypto";

async function main() {
  const connectionString = process.env.SCAN_TEST_DATABASE_URL;
  if (!connectionString) {
    throw new Error("SCAN_TEST_DATABASE_URL is required.");
  }
  if (!new URL(connectionString).pathname.includes("_test")) {
    throw new Error(
      "Refusing to run scanner lifecycle tests against a database without _test in its name.",
    );
  }
  process.env.DATABASE_URL = connectionString;

  const { prisma } = await import("../lib/prisma");
  const { createSession, recordScan, updateSession } = await import(
    "../lib/repository"
  );

  if (!prisma) throw new Error("Prisma client unavailable.");
  const competition = await prisma.competition.findUnique({
  where: { slug: "vibeathon-2026" },
});
if (!competition) throw new Error("Test competition missing.");

  const participants = await prisma.participant.findMany({
  take: 2,
  orderBy: { id: "asc" },
});
if (participants.length < 2) throw new Error("Two test participants required.");

  const scanner = await prisma.adminUser.upsert({
  where: { email: "scanner-lifecycle-test@vibeathon.invalid" },
  update: { active: true, role: "SCANNER" },
  create: {
    authUserId: `scan-test-${randomUUID()}`,
    email: "scanner-lifecycle-test@vibeathon.invalid",
    fullName: "Scanner Lifecycle Test",
    role: "SCANNER",
    active: true,
  },
});

  await prisma.participant.update({
  where: { id: participants[0].id },
  data: { status: "CONFIRMED" },
});
  await prisma.participant.update({
  where: { id: participants[1].id },
  data: { status: "PENDING" },
});

  const suffix = Date.now().toString();
  const session = await createSession({
  name: `Scanner lifecycle ${suffix}`,
  active: true,
});

  const unknown = await recordScan(
  `UNKNOWN-${suffix}`,
  session.id,
  scanner.id,
);
if (unknown.result !== "REJECTED" || unknown.participant !== null) {
  throw new Error("Unknown QR was not rejected and recorded.");
}

  const unpaid = await recordScan(
  participants[1].qrCode,
  session.id,
  scanner.id,
);
if (unpaid.result !== "REJECTED") {
  throw new Error("Unconfirmed participant was not rejected.");
}

  const concurrent = await Promise.all([
  recordScan(participants[0].qrCode, session.id, scanner.id),
  recordScan(participants[0].qrCode, session.id, scanner.id),
]);
  const results = concurrent.map((scan) => scan.result).sort();
if (results.join(",") !== "ACCEPTED,DUPLICATE") {
  throw new Error(`Concurrent deduplication failed: ${results.join(",")}`);
}

  const attempts = await prisma.scanRecord.findMany({
  where: { sessionId: session.id },
});
if (attempts.length !== 4 || attempts.some((scan) => !scan.scannedById)) {
  throw new Error("Scanner attempts are missing audit information.");
}

  const secondSession = await createSession({
  name: `Scanner active switch ${suffix}`,
  active: true,
});
  const previousSession = await prisma.session.findUnique({
  where: { id: session.id },
});
if (previousSession?.active) {
  throw new Error("Activating a session did not deactivate the previous one.");
}

  await updateSession(secondSession.id, { archived: true });
  let archivedRejected = false;
  try {
    await recordScan(
      participants[0].qrCode,
      secondSession.id,
      scanner.id,
    );
  } catch {
    archivedRejected = true;
  }
  if (!archivedRejected) {
    throw new Error("Archived session still accepted scans.");
  }

  console.log("unknown_qr_recorded=true");
  console.log("unconfirmed_participant_rejected=true");
  console.log("concurrent_duplicate_prevented=true");
  console.log("scanner_identity_recorded=true");
  console.log("single_active_session_enforced=true");
  console.log("archived_session_rejected=true");

  await prisma.$disconnect();
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
