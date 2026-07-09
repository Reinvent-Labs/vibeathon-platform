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
  {
    id: "relevance",
    name: "Pertinence du problème",
    weight: 20,
    description:
      "Le jury évalue si le problème adressé est réel, important et suffisamment significatif pour justifier le développement d'une solution. Les équipes doivent démontrer une bonne compréhension du besoin, de ses enjeux et de son impact sur les utilisateurs ou le marché.",
  },
  {
    id: "solution",
    name: "Qualité de la solution",
    weight: 25,
    description:
      "Le jury évalue dans quelle mesure la solution proposée répond efficacement au problème identifié. La proposition de valeur doit être claire, cohérente et démontrer un avantage concret par rapport aux alternatives existantes.",
  },
  {
    id: "product",
    name: "Qualité du produit et de la démonstration",
    weight: 20,
    description:
      "Le jury évalue le niveau de maturité du prototype, son bon fonctionnement ainsi que la qualité de l'expérience utilisateur. La démonstration doit permettre de comprendre facilement le produit et de valider que les fonctionnalités présentées sont opérationnelles.",
  },
  {
    id: "innovation",
    name: "Innovation",
    weight: 15,
    description:
      "Le jury évalue l'originalité de l'approche proposée, qu'elle soit technologique, méthodologique ou liée à l'expérience utilisateur. Une attention particulière est portée aux éléments qui différencient le projet des solutions déjà existantes.",
  },
  {
    id: "impact",
    name: "Potentiel d'impact",
    weight: 20,
    description:
      "Le jury évalue la capacité du projet à générer une adoption réelle par ses utilisateurs cibles et à créer de la valeur à long terme. Sont notamment considérés le potentiel de croissance, la viabilité du projet ainsi que sa capacité à devenir un produit, une entreprise ou une initiative à fort impact.",
  },
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

  // Remove stale criteria that are no longer in the list
  const newKeys = JUDGING_CRITERIA.map((c) => c.id);
  await prisma.judgingCriteria.deleteMany({
    where: { competitionId: competition.id, key: { notIn: newKeys } },
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
          description: criterion.description,
        },
        create: {
          competitionId: competition.id,
          key: criterion.id,
          name: criterion.name,
          weight: criterion.weight,
          order: index + 1,
          description: criterion.description,
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
