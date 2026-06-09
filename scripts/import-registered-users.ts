import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parse } from "csv-parse/sync";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required.");

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

type CsvRow = Record<string, string>;

const columns = {
  timestamp: "Horodateur",
  conditions: "J’ai lu et j’accepte toutes les conditions de participation.",
  fullName: "Nom complet",
  email: "Adresse e-mail",
  phone: "Numéro de téléphone WhatsApp",
  city: "Ville de résidence",
  age: "Âge",
  gender: "Sexe",
  profession: "Profession / activité actuelle",
  technicalLevel: "Quel est votre niveau technique (en codage/développement) ?",
  aiExperience: "Avez-vous déjà utilisé des outils d'Intelligence Artificielle (IA) ?",
  aiTools: "Quels outils IA utilisez-vous déjà ? (Sélectionnez tout ce qui s'applique)",
  otherAiTools: "Si vous avez coché 'Autre' ci-dessus, veuillez spécifier les outils IA utilisés.",
  registrationMode: "Mode d’inscription :",
  teamName: "Si inscription en équipe, quel est le nom du groupe ?",
  motivation: "Pourquoi souhaitez-vous participer à cette compétition du VIBEATHON CÔTE D’IVOIRE 2026 ?",
  preferredDomain: "Choisissez votre domaine préféré en lien avec le thème 'Intelligence artificielle et environnement' :",
  availability: "Êtes-vous disponible pour TOUT le programme (Bootcamp + Compétition finale) ?",
  incubation: "Êtes-vous prêt(e), en cas de victoire (1er, 2e ou 3e prix), à suivre une phase d’incubation et d’accompagnement pour développer votre solution ?",
  declaration: "En soumettant ce formulaire, vous confirmez l’exactitude des informations fournies et votre engagement à respecter les règles du VIBEATHON.",
} as const;

function clean(value?: string) {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function isYes(value?: string) {
  return clean(value).toLocaleLowerCase("fr").startsWith("oui");
}

function profileFromProfession(profession: string) {
  const normalized = profession.toLocaleLowerCase("fr");
  if (normalized.includes("étudiant") || normalized.includes("etudiant")) return "Étudiant·e";
  if (normalized.includes("entrepreneur")) return "Entrepreneur·e";
  if (normalized.includes("diplôm") || normalized.includes("diplom")) return "Jeune diplômé·e";
  return "Professionnel·le";
}

function parseTimestamp(value: string) {
  const match = value.match(
    /^(\d{4})\/(\d{2})\/(\d{2})\s+(.+)\s+UTC\+9$/,
  );
  if (!match) return new Date();
  return new Date(`${match[1]}-${match[2]}-${match[3]} ${match[4]} GMT+0900`);
}

async function main() {
  const csvPath = resolve(process.argv[2] ?? "data/registered-users.csv");
  const csvText = await readFile(csvPath, "utf8");
  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_quotes: true,
  }) as CsvRow[];

  const competition = await prisma.competition.findUnique({
    where: { slug: "vibeathon-2026" },
  });
  if (!competition) throw new Error("Run npm run db:seed before importing.");

  const latestByEmail = new Map<string, { row: CsvRow; sourceIndex: number }>();
  rows.forEach((row, sourceIndex) => {
    const email = clean(row[columns.email]).toLowerCase();
    if (email) latestByEmail.set(email, { row, sourceIndex });
  });

  let imported = 0;
  for (const [email, { row, sourceIndex }] of latestByEmail) {
    const fullName = clean(row[columns.fullName]);
    const profession = clean(row[columns.profession]);
    const teamName = clean(row[columns.teamName]);
    const reference = `VBT-2026-${String(sourceIndex + 1).padStart(4, "0")}`;
    await prisma.participant.upsert({
      where: {
        competitionId_email: {
          competitionId: competition.id,
          email,
        },
      },
      update: {
        fullName,
        phone: clean(row[columns.phone]),
        city: clean(row[columns.city]),
        profile: profileFromProfession(profession),
        motivation: clean(row[columns.motivation]),
        age: clean(row[columns.age]),
        gender: clean(row[columns.gender]),
        profession,
        technicalLevel: clean(row[columns.technicalLevel]),
        aiExperience: clean(row[columns.aiExperience]),
        aiTools: clean(row[columns.aiTools]),
        otherAiTools: clean(row[columns.otherAiTools]),
        registrationMode: clean(row[columns.registrationMode]),
        proposedTeamName: teamName,
        preferredDomain: clean(row[columns.preferredDomain]),
        fullProgramAvailable: isYes(row[columns.availability]),
        incubationCommitment: isYes(row[columns.incubation]),
        conditionsAccepted: isYes(row[columns.conditions]),
        declarationAccepted: Boolean(clean(row[columns.declaration])),
        rawApplication: row,
        importedAt: new Date(),
        teamId: null,
      },
      create: {
        competitionId: competition.id,
        reference,
        qrCode: reference.replace("-2026-", "-2026-C-"),
        fullName,
        email,
        phone: clean(row[columns.phone]),
        city: clean(row[columns.city]),
        profile: profileFromProfession(profession),
        motivation: clean(row[columns.motivation]),
        source: "Google Forms import",
        age: clean(row[columns.age]),
        gender: clean(row[columns.gender]),
        profession,
        technicalLevel: clean(row[columns.technicalLevel]),
        aiExperience: clean(row[columns.aiExperience]),
        aiTools: clean(row[columns.aiTools]),
        otherAiTools: clean(row[columns.otherAiTools]),
        registrationMode: clean(row[columns.registrationMode]),
        proposedTeamName: teamName,
        preferredDomain: clean(row[columns.preferredDomain]),
        fullProgramAvailable: isYes(row[columns.availability]),
        incubationCommitment: isYes(row[columns.incubation]),
        conditionsAccepted: isYes(row[columns.conditions]),
        declarationAccepted: Boolean(clean(row[columns.declaration])),
        rawApplication: row,
        importedAt: new Date(),
        createdAt: parseTimestamp(row[columns.timestamp]),
      },
    });
    imported += 1;
  }

  console.log(
    JSON.stringify(
      {
        sourceRows: rows.length,
        uniqueEmails: latestByEmail.size,
        duplicatesCollapsed: rows.length - latestByEmail.size,
        imported,
        proposedTeamNames: [...latestByEmail.values()].filter(
          ({ row }) => Boolean(clean(row[columns.teamName])),
        ).length,
      },
      null,
      2,
    ),
  );
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
