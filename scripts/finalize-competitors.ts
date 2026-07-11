import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { definitiveTeamRoster2026 } from "../data/definitive-team-roster-2026";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const apply = process.argv.includes("--apply");
const normalize = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("fr")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ");
const normalizeEmail = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "");

async function main() {
  const competition = await prisma.competition.findUnique({
    where: { slug: "vibeathon-2026" },
    select: { id: true },
  });
  if (!competition) throw new Error("Competition vibeathon-2026 not found.");

  const rosterEmails = new Set(
    definitiveTeamRoster2026.flatMap((team) =>
      team.members.map((member) => normalizeEmail(member.email)),
    ),
  );
  const rosterNames = new Set(
    definitiveTeamRoster2026.flatMap((team) =>
      team.members.map((member) => normalize(member.fullName)),
    ),
  );
  const competitors = await prisma.participant.findMany({
    where: { competitionId: competition.id, category: "HACKATHON" },
    select: { id: true, email: true, fullName: true, status: true },
  });
  const retained = competitors.filter(
    (participant) =>
      rosterEmails.has(normalizeEmail(participant.email)) ||
      rosterNames.has(normalize(participant.fullName)),
  );
  const removed = competitors.filter((participant) => !retained.includes(participant));
  const active = retained.filter((participant) =>
    ["CONFIRMED", "CHECKED_IN"].includes(participant.status),
  );

  if (retained.length !== 100 || active.length !== 100) {
    throw new Error(
      `The definitive roster must resolve to 100 active competitors; found ${retained.length} retained and ${active.length} active. Run the definitive roster importer first.`,
    );
  }

  if (apply) {
    await prisma.$transaction([
      prisma.participant.deleteMany({ where: { id: { in: removed.map((participant) => participant.id) } } }),
      prisma.competition.update({
        where: { id: competition.id },
        data: { registrationOpen: false },
      }),
    ]);
  }

  console.log(
    `${apply ? "Applied" : "Dry run"}: retain 100 definitive competitors, remove ${removed.length} other hackathon applications, registration ${apply ? "closed" : "will close"}.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
