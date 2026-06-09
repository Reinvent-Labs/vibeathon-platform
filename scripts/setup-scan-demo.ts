import "dotenv/config";
import { randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

const databaseName = new URL(connectionString).pathname.slice(1);
if (!databaseName.includes("_test")) {
  throw new Error(
    "Refusing to create scanner demo data outside a database containing _test.",
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const scannerEmail = "scanner-demo@vibeathon.invalid";
const badgeEmail = "badge-demo@vibeathon.invalid";
const badgeCode = "VBT-2026-C-DEMO";

async function main() {
  const competition = await prisma.competition.findUnique({
    where: { slug: "vibeathon-2026" },
  });
  if (!competition) {
    throw new Error("The VIBEATHON test competition is missing.");
  }

  const password = `Vbt!${randomBytes(12).toString("base64url")}`;
  const scanner = await prisma.adminUser.upsert({
    where: { email: scannerEmail },
    update: {
      active: true,
      fullName: "Scanner Démo VIBEATHON",
      mustChangePassword: false,
      passwordHash: await hash(password, 12),
      role: "SCANNER",
    },
    create: {
      authUserId: "scanner-demo",
      email: scannerEmail,
      fullName: "Scanner Démo VIBEATHON",
      mustChangePassword: false,
      passwordHash: await hash(password, 12),
      role: "SCANNER",
    },
  });

  const participant = await prisma.participant.upsert({
    where: { competitionId_email: { competitionId: competition.id, email: badgeEmail } },
    update: {
      fullName: "Awa Démo",
      qrCode: badgeCode,
      reference: "VBT-2026-DEMO",
      status: "CONFIRMED",
      confirmedAt: new Date(),
    },
    create: {
      competitionId: competition.id,
      reference: "VBT-2026-DEMO",
      qrCode: badgeCode,
      fullName: "Awa Démo",
      email: badgeEmail,
      phone: "+225 00 00 00 00 00",
      city: "Abidjan",
      profile: "Entrepreneure",
      motivation: "Participant de démonstration pour valider le scanner QR.",
      status: "CONFIRMED",
      confirmedAt: new Date(),
    },
  });

  const session = await prisma.$transaction(async (transaction) => {
    await transaction.session.updateMany({
      where: { competitionId: competition.id, active: true },
      data: { active: false },
    });
    return transaction.session.upsert({
      where: {
        id: "scan-demo-session",
      },
      update: {
        active: true,
        archivedAt: null,
        name: "Test badge QR",
      },
      create: {
        id: "scan-demo-session",
        competitionId: competition.id,
        name: "Test badge QR",
        description: "Session isolée pour la validation du scanner.",
        location: "Environnement de test",
        active: true,
      },
    });
  });

  await prisma.scanRecord.deleteMany({
    where: {
      sessionId: session.id,
      OR: [{ participantId: participant.id }, { qrCode: badgeCode }],
    },
  });

  console.log(
    JSON.stringify({
      badgeCode,
      badgePath: `/badge/${badgeCode}`,
      participant: participant.fullName,
      scannerEmail: scanner.email,
      scannerPassword: password,
      sessionId: session.id,
    }),
  );
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
