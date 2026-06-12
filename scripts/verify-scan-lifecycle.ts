import { randomUUID } from "node:crypto";
import type { ParticipantCategory } from "../generated/prisma/enums";

const categories: ParticipantCategory[] = [
  "HACKATHON",
  "VISITEUR",
  "FORMATION_ADULTE",
  "FORMATION_KIDS",
];

async function main() {
  const connectionString = process.env.SCAN_TEST_DATABASE_URL;
  if (!connectionString) throw new Error("SCAN_TEST_DATABASE_URL is required.");
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

  const participants = await Promise.all(
    categories.map((category, index) =>
      prisma.participant.upsert({
        where: {
          competitionId_email: {
            competitionId: competition.id,
            email: `scan-${category.toLowerCase()}@vibeathon.invalid`,
          },
        },
        update: { category, status: "CONFIRMED" },
        create: {
          competitionId: competition.id,
          reference: `VBT-SCAN-${index + 1}`,
          qrCode: `VBT-SCAN-${category}`,
          fullName: `Test ${category}`,
          email: `scan-${category.toLowerCase()}@vibeathon.invalid`,
          phone: `+22500000000${index}`,
          category,
          status: "CONFIRMED",
        },
      }),
    ),
  );
  const unpaid = await prisma.participant.upsert({
    where: {
      competitionId_email: {
        competitionId: competition.id,
        email: "scan-unpaid@vibeathon.invalid",
      },
    },
    update: { status: "PENDING", category: "VISITEUR" },
    create: {
      competitionId: competition.id,
      reference: "VBT-SCAN-UNPAID",
      qrCode: "VBT-SCAN-UNPAID",
      fullName: "Test Unpaid",
      email: "scan-unpaid@vibeathon.invalid",
      phone: "+225000000009",
      category: "VISITEUR",
      status: "PENDING",
    },
  });

  const suffix = Date.now().toString();
  const allPassesSession = await createSession({
    name: `Scanner all passes ${suffix}`,
    active: true,
    allowedCategories: categories,
  });

  for (const participant of participants) {
    const scan = await recordScan(
      participant.qrCode,
      allPassesSession.id,
      scanner.id,
    );
    if (scan.result !== "ACCEPTED") {
      throw new Error(`${participant.category} pass was not accepted.`);
    }
  }

  const unknown = await recordScan(
    `UNKNOWN-${suffix}`,
    allPassesSession.id,
    scanner.id,
  );
  if (unknown.result !== "REJECTED" || unknown.participant !== null) {
    throw new Error("Unknown QR was not rejected and recorded.");
  }
  const unpaidScan = await recordScan(
    unpaid.qrCode,
    allPassesSession.id,
    scanner.id,
  );
  if (unpaidScan.result !== "REJECTED") {
    throw new Error("Unconfirmed participant was not rejected.");
  }

  const restrictedSession = await createSession({
    name: `Scanner competitors only ${suffix}`,
    active: true,
    allowedCategories: ["HACKATHON"],
  });
  const wrongPass = await recordScan(
    participants[1].qrCode,
    restrictedSession.id,
    scanner.id,
  );
  if (
    wrongPass.result !== "REJECTED" ||
    !wrongPass.reason?.includes("non admis")
  ) {
    throw new Error("A confirmed but disallowed pass was not rejected.");
  }

  const concurrent = await Promise.all([
    recordScan(participants[0].qrCode, restrictedSession.id, scanner.id),
    recordScan(participants[0].qrCode, restrictedSession.id, scanner.id),
  ]);
  const results = concurrent.map((scan) => scan.result).sort();
  if (results.join(",") !== "ACCEPTED,DUPLICATE") {
    throw new Error(`Concurrent deduplication failed: ${results.join(",")}`);
  }

  const attempts = await prisma.scanRecord.findMany({
    where: {
      sessionId: { in: [allPassesSession.id, restrictedSession.id] },
    },
  });
  if (attempts.length !== 9 || attempts.some((scan) => !scan.scannedById)) {
    throw new Error("Scanner attempts are missing audit information.");
  }

  const previousSession = await prisma.session.findUnique({
    where: { id: allPassesSession.id },
  });
  if (previousSession?.active) {
    throw new Error("Activating a session did not deactivate the previous one.");
  }

  await updateSession(restrictedSession.id, { archived: true });
  let archivedRejected = false;
  try {
    await recordScan(
      participants[0].qrCode,
      restrictedSession.id,
      scanner.id,
    );
  } catch {
    archivedRejected = true;
  }
  if (!archivedRejected) {
    throw new Error("Archived session still accepted scans.");
  }

  console.log("all_four_pass_categories_accepted=true");
  console.log("unknown_qr_recorded=true");
  console.log("unconfirmed_participant_rejected=true");
  console.log("disallowed_pass_rejected=true");
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
