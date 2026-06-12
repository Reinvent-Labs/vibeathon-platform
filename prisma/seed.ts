import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const EVENT = {
  name: "VIBEATHON 2026",
  venue: "CSCTICAO, Abidjan",
  fee: 20_000,
  capacity: 400,
  competitorCapacity: 100,
} as const;

const EVENT_SESSIONS = [
  "Entrée principale",
  "Keynotes d'ouverture",
  "Ateliers & Studio IA",
  "Compétition vibecoding",
  "Pitch des finalistes",
  "Remise des prix",
] as const;

const JUDGING_CRITERIA = [
  { id: "impact", name: "Impact problème / solution", weight: 30 },
  { id: "feasibility", name: "Faisabilité", weight: 20 },
  { id: "ai", name: "Usage pertinent de l'IA", weight: 20 },
  { id: "innovation", name: "Innovation", weight: 15 },
  { id: "pitch", name: "Qualité du pitch & clarté", weight: 15 },
] as const;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

async function main() {
  const competition = await prisma.competition.upsert({
    where: { slug: "vibeathon-2026" },
    update: {},
    create: {
      name: EVENT.name,
      slug: "vibeathon-2026",
      eventDate: new Date("2026-07-11T07:30:00+00:00"),
      venue: EVENT.venue,
      participationFee: EVENT.fee,
      capacity: EVENT.capacity,
      competitorCapacity: EVENT.competitorCapacity,
    },
  });

  const phases = [
    "Inscriptions",
    "Sélection",
    "Paiement",
    "Bootcamp",
    "Compétition",
    "Finale",
  ];
  await Promise.all(
    phases.map((name, index) =>
      prisma.phase.upsert({
        where: {
          competitionId_order: {
            competitionId: competition.id,
            order: index + 1,
          },
        },
        update: {},
        create: {
          competitionId: competition.id,
          name,
          order: index + 1,
          active: index === 1,
        },
      }),
    ),
  );

  const existingSessions = await prisma.session.findMany({
    where: { competitionId: competition.id },
    select: { name: true },
  });
  const existingSessionNames = new Set(
    existingSessions.map((session) => session.name),
  );
  const missingSessions = EVENT_SESSIONS.filter(
    (name) => !existingSessionNames.has(name),
  );
  if (missingSessions.length > 0) {
    await prisma.session.createMany({
      data: missingSessions.map((name, index) => ({
        competitionId: competition.id,
        name,
        active: existingSessions.length === 0 && index === 0,
      })),
    });
  }

  await Promise.all(
    JUDGING_CRITERIA.map((criterion, index) =>
      prisma.judgingCriteria.upsert({
        where: {
          competitionId_key: {
            competitionId: competition.id,
            key: criterion.id,
          },
        },
        update: {},
        create: {
          competitionId: competition.id,
          key: criterion.id,
          name: criterion.name,
          weight: criterion.weight,
          order: index + 1,
        },
      }),
    ),
  );

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@vibeathonci.com";
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { email: adminEmail },
  });
  if (!existingAdmin) {
    const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
    if (!initialPassword || initialPassword.length < 12) {
      throw new Error(
        "ADMIN_INITIAL_PASSWORD must contain at least 12 characters when creating the first administrator.",
      );
    }
    await prisma.adminUser.create({
      data: {
        authUserId: "local-super-admin",
        email: adminEmail,
        fullName: "Administration VIBEATHON",
        role: "SUPER_ADMIN",
        passwordHash: await hash(initialPassword, 12),
      },
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
