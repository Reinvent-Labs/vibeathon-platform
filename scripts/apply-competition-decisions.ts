import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type ParticipantStatus } from "../generated/prisma/client";
import {
  malformedNiangadouRegistration,
  productionScanFixture,
  rejectedCandidateIdentifiers,
  selectedCandidateIdentifiers,
} from "../data/decisions/competition-2026";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const apply = process.argv.includes("--apply");
const protectedStatuses = new Set<ParticipantStatus>([
  "PAID",
  "CONFIRMED",
  "CHECKED_IN",
]);

const normalize = (value: string) => value.trim().toLowerCase();

function assertUnique(values: readonly string[], label: string) {
  const normalized = values.map(normalize);
  const duplicates = normalized.filter(
    (value, index) => normalized.indexOf(value) !== index,
  );
  if (duplicates.length > 0) {
    throw new Error(`${label}: duplicate identifiers: ${duplicates.join(", ")}`);
  }
}

async function main() {
  assertUnique(selectedCandidateIdentifiers, "Selected list");
  assertUnique(rejectedCandidateIdentifiers, "Rejected list");

  const selectedSet = new Set(selectedCandidateIdentifiers.map(normalize));
  const rejectedSet = new Set(rejectedCandidateIdentifiers.map(normalize));
  const overlap = [...selectedSet].filter((identifier) =>
    rejectedSet.has(identifier),
  );
  if (overlap.length > 0) {
    throw new Error(`Decision lists overlap: ${overlap.join(", ")}`);
  }

  const competition = await prisma.competition.findUnique({
    where: { slug: "vibeathon-2026" },
    select: { id: true, competitorCapacity: true },
  });
  if (!competition) throw new Error("Competition vibeathon-2026 not found.");
  if (selectedSet.size > competition.competitorCapacity) {
    throw new Error(
      `${selectedSet.size} selected candidates exceed the ${competition.competitorCapacity}-person capacity.`,
    );
  }

  const storedParticipants = await prisma.participant.findMany({
    where: {
      competitionId: competition.id,
      category: "HACKATHON",
    },
    select: {
      id: true,
      reference: true,
      fullName: true,
      email: true,
      status: true,
      isTest: true,
    },
  });

  const fixture = storedParticipants.find(
    (participant) =>
      participant.reference === productionScanFixture.reference &&
      normalize(participant.email) === productionScanFixture.email &&
      participant.fullName === productionScanFixture.fullName,
  );
  if (!fixture) {
    throw new Error("The known production scan fixture was not found exactly.");
  }

  const malformedNiangadou = storedParticipants.find(
    (participant) =>
      participant.reference === malformedNiangadouRegistration.reference &&
      normalize(participant.email) ===
        normalize(malformedNiangadouRegistration.oldEmail),
  );
  const correctedNiangadou = storedParticipants.find(
    (participant) =>
      normalize(participant.email) ===
      malformedNiangadouRegistration.correctedEmail,
  );
  if (!malformedNiangadou && !correctedNiangadou) {
    throw new Error("The NIANGADOU registration could not be resolved.");
  }
  if (
    malformedNiangadou &&
    correctedNiangadou &&
    malformedNiangadou.id !== correctedNiangadou.id
  ) {
    throw new Error("The corrected NIANGADOU email is already used by another record.");
  }

  const participants = storedParticipants
    .filter((participant) => participant.id !== fixture.id)
    .map((participant) =>
      participant.id === malformedNiangadou?.id
        ? {
            ...participant,
            email: malformedNiangadouRegistration.correctedEmail,
            fullName: malformedNiangadouRegistration.correctedFullName,
          }
        : participant,
    );
  const byIdentifier = new Map(
    participants.map((participant) => [normalize(participant.email), participant]),
  );

  const missingSelected = [...selectedSet].filter(
    (identifier) => !byIdentifier.has(identifier),
  );
  const missingRejected = [...rejectedSet].filter(
    (identifier) => !byIdentifier.has(identifier),
  );
  if (missingSelected.length > 0 || missingRejected.length > 0) {
    throw new Error(
      `Unresolved decisions. Selected: ${missingSelected.join(", ") || "none"}; rejected: ${missingRejected.join(", ") || "none"}.`,
    );
  }

  const changes = participants.map((participant) => {
    const identifier = normalize(participant.email);
    const nextStatus: ParticipantStatus = selectedSet.has(identifier)
      ? protectedStatuses.has(participant.status)
        ? participant.status
        : "SELECTED"
      : rejectedSet.has(identifier)
        ? "REJECTED"
        : "WAITLIST";
    if (
      protectedStatuses.has(participant.status) &&
      !selectedSet.has(identifier)
    ) {
      throw new Error(
        `Protected participant ${participant.reference} is absent from the selected list.`,
      );
    }
    return { ...participant, nextStatus };
  });

  const summary = {
    mode: apply ? "apply" : "dry-run",
    totalRealApplicants: changes.length,
    selectedSourceRows: 100,
    selectedUnique: selectedSet.size,
    rejectedUnique: rejectedSet.size,
    waitlist: changes.filter((item) => item.nextStatus === "WAITLIST").length,
    selected: changes.filter((item) => item.nextStatus === "SELECTED").length,
    paid: changes.filter((item) => item.nextStatus === "PAID").length,
    confirmed: changes.filter((item) => item.nextStatus === "CONFIRMED").length,
    checkedIn: changes.filter((item) => item.nextStatus === "CHECKED_IN").length,
    rejected: changes.filter((item) => item.nextStatus === "REJECTED").length,
    changedStatuses: changes.filter(
      (item) => item.status !== item.nextStatus,
    ).length,
    correctedNiangadou: Boolean(malformedNiangadou),
    markedTestFixture: !fixture.isTest,
  };

  if (!apply) {
    console.log(JSON.stringify(summary, null, 2));
    return;
  }

  await prisma.$transaction(async (transaction) => {
    if (!fixture.isTest) {
      await transaction.participant.update({
        where: { id: fixture.id },
        data: { isTest: true },
      });
    }
    if (malformedNiangadou) {
      await transaction.participant.update({
        where: { id: malformedNiangadou.id },
        data: {
          email: malformedNiangadouRegistration.correctedEmail,
          fullName: malformedNiangadouRegistration.correctedFullName,
        },
      });
    }
    for (const change of changes) {
      if (change.status === change.nextStatus) continue;
      await transaction.participant.update({
        where: { id: change.id },
        data: { status: change.nextStatus },
      });
    }
    await transaction.auditLog.create({
      data: {
        action: "COMPETITION_DECISIONS_IMPORTED",
        entityType: "Competition",
        entityId: competition.id,
        metadata: summary,
      },
    });
  });

  console.log(JSON.stringify(summary, null, 2));
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
