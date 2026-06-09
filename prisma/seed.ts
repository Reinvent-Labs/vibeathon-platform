import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import {
  EVENT,
  EVENT_SESSIONS,
  JUDGING_CRITERIA,
} from "../lib/constants.ts";

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
