import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { definitiveTeamRoster2026 } from "../data/definitive-team-roster-2026";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const apply = process.argv.includes("--apply");
const officialStatuses = new Set(["SELECTED", "PAID", "CONFIRMED", "CHECKED_IN"]);
const normalize = (value: string) =>
  value
    .trim()
    .toLocaleLowerCase("fr")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "'")
    .replace(/\s+/g, " ");
const normalizeEmail = (value: string) => value.trim().toLowerCase().replace(/\s+/g, "");

function assertRosterIntegrity() {
  const names = definitiveTeamRoster2026.map((team) => normalize(team.name));
  const members = definitiveTeamRoster2026.flatMap((team) => team.members);
  const emails = members.map((member) => normalizeEmail(member.email));

  if (definitiveTeamRoster2026.length !== 20) {
    throw new Error(`Expected 20 teams, received ${definitiveTeamRoster2026.length}.`);
  }
  if (members.length !== 100 || definitiveTeamRoster2026.some((team) => team.members.length !== 5)) {
    throw new Error("The definitive roster must contain five members for each team.");
  }
  if (new Set(names).size !== names.length || new Set(emails).size !== emails.length) {
    throw new Error("The definitive roster contains duplicate team names or member emails.");
  }
}

function identifier() {
  return randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
}

async function main() {
  assertRosterIntegrity();
  const competition = await prisma.competition.findUnique({
    where: { slug: "vibeathon-2026" },
    select: { id: true },
  });
  if (!competition) throw new Error("Competition vibeathon-2026 not found.");

  const [teams, participants] = await Promise.all([
    prisma.team.findMany({
      where: { competitionId: competition.id },
      select: { id: true, name: true, domain: true },
    }),
    prisma.participant.findMany({
      where: { competitionId: competition.id },
      select: {
        id: true,
        email: true,
        fullName: true,
        teamId: true,
        preferredDomain: true,
        gender: true,
        phone: true,
        isTest: true,
        status: true,
      },
    }),
  ]);
  const teamsByName = new Map(teams.map((team) => [normalize(team.name), team]));
  const participantsByEmail = new Map(participants.map((participant) => [normalizeEmail(participant.email), participant]));
  const participantsByName = new Map(participants.map((participant) => [normalize(participant.fullName), participant]));

  let teamsCreated = 0;
  let teamsUpdated = 0;
  let membersCreated = 0;
  let membersUpdated = 0;

  if (apply) {
    await prisma.$transaction(async (database) => {
      for (const rosterTeam of definitiveTeamRoster2026) {
        const existingTeam = teamsByName.get(normalize(rosterTeam.name));
        const team = existingTeam
          ? existingTeam.domain === rosterTeam.domain
            ? existingTeam
            : await database.team.update({
                where: { id: existingTeam.id },
                data: { domain: rosterTeam.domain },
                select: { id: true },
              })
          : await database.team.create({
              data: {
                competitionId: competition.id,
                name: rosterTeam.name,
                domain: rosterTeam.domain,
                // Keeps older jury views meaningful until projects are submitted.
                problem: rosterTeam.domain,
              },
              select: { id: true },
            });

        if (!existingTeam) teamsCreated++;
        else if (existingTeam.domain !== rosterTeam.domain) teamsUpdated++;

        for (const member of rosterTeam.members) {
          const existingMember =
            participantsByEmail.get(normalizeEmail(member.email)) ??
            participantsByName.get(normalize(member.fullName));

          if (existingMember) {
            const needsPromotion = !officialStatuses.has(existingMember.status);
            const needsUpdate =
              existingMember.teamId !== team.id ||
              existingMember.preferredDomain !== rosterTeam.domain ||
              existingMember.gender !== member.gender ||
              existingMember.phone !== member.phone ||
              existingMember.isTest ||
              needsPromotion;
            if (!needsUpdate) continue;
            await database.participant.update({
              where: { id: existingMember.id },
              data: {
                teamId: team.id,
                preferredDomain: rosterTeam.domain,
                gender: member.gender,
                phone: member.phone,
                isTest: false,
                status: needsPromotion ? "SELECTED" : undefined,
              },
            });
            membersUpdated++;
            continue;
          }

          const id = identifier();
          await database.participant.create({
            data: {
              competitionId: competition.id,
              reference: `VBT-2026-F-${id}`,
              qrCode: `VBT-2026-C-${id}`,
              category: "HACKATHON",
              fullName: member.fullName,
              email: normalizeEmail(member.email),
              phone: member.phone,
              gender: member.gender,
              preferredDomain: rosterTeam.domain,
              status: "SELECTED",
              teamId: team.id,
            },
          });
          membersCreated++;
        }
      }
    });
  } else {
    for (const rosterTeam of definitiveTeamRoster2026) {
      const existingTeam = teamsByName.get(normalize(rosterTeam.name));
      if (!existingTeam) teamsCreated++;
      else if (existingTeam.domain !== rosterTeam.domain) teamsUpdated++;
      for (const member of rosterTeam.members) {
        const existingMember =
          participantsByEmail.get(normalizeEmail(member.email)) ??
          participantsByName.get(normalize(member.fullName));
        if (!existingMember) {
          membersCreated++;
          continue;
        }
        if (
          !existingTeam ||
          existingMember.teamId !== existingTeam.id ||
          existingMember.preferredDomain !== rosterTeam.domain ||
          existingMember.gender !== member.gender ||
          existingMember.phone !== member.phone ||
          existingMember.isTest ||
          !officialStatuses.has(existingMember.status)
        ) {
          membersUpdated++;
        }
      }
    }
  }

  console.log(
    `${apply ? "Applied" : "Dry run"}: ${teamsCreated} teams to create, ${teamsUpdated} teams to update, ${membersCreated} members to create, ${membersUpdated} members to update.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
