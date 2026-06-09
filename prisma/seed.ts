import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const EVENT = {
  name: "VIBEATHON 2026",
  venue: "CSCTICAO, Abidjan",
  fee: 5_000,
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
    update: {
      eventDate: new Date("2026-07-11T07:30:00+00:00"),
      venue: EVENT.venue,
      participationFee: EVENT.fee,
      capacity: EVENT.capacity,
      competitorCapacity: EVENT.competitorCapacity,
    },
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
        update: { name, active: index === 1 },
        create: {
          competitionId: competition.id,
          name,
          order: index + 1,
          active: index === 1,
        },
      }),
    ),
  );

  await prisma.session.deleteMany({
    where: { competitionId: competition.id },
  });
  await prisma.session.createMany({
    data: EVENT_SESSIONS.map((name, index) => ({
      competitionId: competition.id,
      name,
      active: index === 0,
    })),
  });

  await Promise.all(
    JUDGING_CRITERIA.map((criterion, index) =>
      prisma.judgingCriteria.upsert({
        where: {
          competitionId_key: {
            competitionId: competition.id,
            key: criterion.id,
          },
        },
        update: {
          name: criterion.name,
          weight: criterion.weight,
          order: index + 1,
        },
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

  const defaultPassword = process.env.ADMIN_INITIAL_PASSWORD ?? "ChangeMe-Vibeathon-2026";
  await prisma.adminUser.upsert({
    where: { email: process.env.ADMIN_EMAIL ?? "admin@vibeathonci.com" },
    update: {
      passwordHash: await hash(defaultPassword, 12),
      active: true,
    },
    create: {
      authUserId: "local-super-admin",
      email: process.env.ADMIN_EMAIL ?? "admin@vibeathonci.com",
      fullName: "Administration VIBEATHON",
      role: "SUPER_ADMIN",
      passwordHash: await hash(defaultPassword, 12),
    },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
