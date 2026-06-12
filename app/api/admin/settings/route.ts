import { z } from "zod";
import { apiError, apiSuccess, readJson } from "@/lib/api";
import { requestIp, writeAuditLog } from "@/lib/audit";
import { isSameOrigin, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const settingsSchema = z.object({
  name: z.string().trim().min(3).max(120),
  venue: z.string().trim().min(3).max(180),
  eventDate: z.iso.date(),
  participationFee: z.number().int().min(0).max(1_000_000),
  capacity: z.number().int().min(1).max(100_000),
  competitorCapacity: z.number().int().min(1).max(10_000),
  registrationOpen: z.boolean(),
  criteria: z
    .array(
      z.object({
        id: z.string().min(1),
        name: z.string().trim().min(2).max(120),
        weight: z.number().int().min(1).max(100),
      }),
    )
    .min(1)
    .max(20),
});

async function authorize(request: Request) {
  if (!isSameOrigin(request)) {
    return { error: apiError("Origine invalide.", 403) };
  }
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  return user ? { user } : { error: apiError("Non autorisé.", 401) };
}

async function readSettings() {
  if (!prisma) return null;
  return prisma.competition.findUnique({
    where: { slug: "vibeathon-2026" },
    select: {
      id: true,
      name: true,
      venue: true,
      eventDate: true,
      participationFee: true,
      capacity: true,
      competitorCapacity: true,
      registrationOpen: true,
      criteria: {
        select: { id: true, key: true, name: true, weight: true, order: true },
        orderBy: { order: "asc" },
      },
    },
  });
}

export async function GET(request: Request) {
  const authorization = await authorize(request);
  if ("error" in authorization) return authorization.error;
  const settings = await readSettings();
  return settings
    ? apiSuccess(settings)
    : apiError("Compétition introuvable.", 404);
}

export async function PATCH(request: Request) {
  const authorization = await authorize(request);
  if ("error" in authorization) return authorization.error;
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const parsed = settingsSchema.safeParse(await readJson<unknown>(request));
  if (!parsed.success) return apiError("Paramètres invalides.");
  const totalWeight = parsed.data.criteria.reduce(
    (sum, criterion) => sum + criterion.weight,
    0,
  );
  if (totalWeight !== 100) {
    return apiError("Le total des critères du jury doit être égal à 100.", 409);
  }
  if (parsed.data.competitorCapacity > parsed.data.capacity) {
    return apiError(
      "La capacité des compétiteurs ne peut pas dépasser la capacité totale.",
      409,
    );
  }

  const current = await readSettings();
  if (!current) return apiError("Compétition introuvable.", 404);
  const existingCriterionIds = new Set(
    current.criteria.map((criterion) => criterion.id),
  );
  if (
    parsed.data.criteria.length !== existingCriterionIds.size ||
    parsed.data.criteria.some(
      (criterion) => !existingCriterionIds.has(criterion.id),
    )
  ) {
    return apiError("La liste des critères ne correspond pas à la compétition.", 409);
  }

  const eventDate = new Date(`${parsed.data.eventDate}T07:30:00.000Z`);
  await prisma.$transaction([
    prisma.competition.update({
      where: { id: current.id },
      data: {
        name: parsed.data.name,
        venue: parsed.data.venue,
        eventDate,
        participationFee: parsed.data.participationFee,
        capacity: parsed.data.capacity,
        competitorCapacity: parsed.data.competitorCapacity,
        registrationOpen: parsed.data.registrationOpen,
      },
    }),
    ...parsed.data.criteria.map((criterion) =>
      prisma!.judgingCriteria.update({
        where: { id: criterion.id },
        data: { name: criterion.name, weight: criterion.weight },
      }),
    ),
  ]);
  await writeAuditLog({
    actorId: authorization.user.userId,
    action: "COMPETITION_SETTINGS_UPDATED",
    entityType: "Competition",
    entityId: current.id,
    ipAddress: requestIp(request),
    metadata: {
      participationFee: parsed.data.participationFee,
      capacity: parsed.data.capacity,
      competitorCapacity: parsed.data.competitorCapacity,
      registrationOpen: parsed.data.registrationOpen,
    },
  });
  return apiSuccess(await readSettings());
}
