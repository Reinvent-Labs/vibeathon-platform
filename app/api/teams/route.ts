import { apiError, apiSuccess } from "@/lib/api";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSameOrigin } from "@/lib/auth";
import { readJson } from "@/lib/api";

export async function GET(request: Request) {
  const session = await requireRole(["SUPER_ADMIN", "ADMIN", "JURY"]);
  if (!session) {
    return apiError("Non autorisé.", 401);
  }
  if (!prisma) return apiError("Base de données indisponible.", 503);
  const juryScope =
    session.role === "JURY" ||
    new URL(request.url).searchParams.get("scope") === "jury";
  const teams = await prisma.team.findMany({
    where: juryScope
      ? {
          isFinalist: true,
          members: {
            some: {},
            every: {
              status: { in: ["PAID", "CONFIRMED", "CHECKED_IN"] },
              category: "HACKATHON",
              isTest: false,
            },
          },
        }
      : undefined,
    include: {
      members: {
        select: {
          id: true,
          fullName: true,
          email: true,
          status: true,
        },
      },
      scores: {
        where: juryScope ? { juryId: session.userId } : undefined,
        select: {
          juryId: true,
          criteria: {
            select: {
              key: true,
            },
          },
          score: true,
          comment: true,
          lockedAt: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
  return apiSuccess(
    teams.map((team) => ({
      id: team.id,
      name: team.name,
      domain: team.domain || team.problem,
      problem: team.problem,
      description: team.description ?? "",
      demoUrl: team.demoUrl ?? "",
      repositoryUrl: team.repositoryUrl ?? "",
      slidesUrl: team.slidesUrl ?? "",
      testCredentials: team.testCredentials ?? "",
      members: team.members,
      scored: team.scores.some((score) => Boolean(score.lockedAt)),
      scores: Object.fromEntries(
        team.scores.map((score) => [score.criteria.key, score.score]),
      ),
      comment: team.scores.find((score) => score.comment)?.comment ?? "",
      averageScore: team.scores.length
        ? Math.round(
            team.scores.reduce((sum, score) => sum + score.score, 0) /
              new Set(team.scores.map((score) => score.juryId)).size,
          )
        : null,
    })),
  );
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return apiError("Non autorisé.", 401);
  }
  if (!prisma) return apiError("Base de données indisponible.", 503);
  const body = await readJson<{
    name?: string;
    domain?: string;
    problem?: string;
    memberIds?: string[];
  }>(request);
  if (!body?.name?.trim() || !body.problem?.trim() || !body.memberIds?.length) {
    return apiError("Nom, problème et membres sont requis.");
  }
  if (body.memberIds.length > 5) {
    return apiError("Une équipe ne peut pas dépasser 5 membres.", 409);
  }

  const competition = await prisma.competition.findUnique({
    where: { slug: "vibeathon-2026" },
  });
  if (!competition) return apiError("Compétition introuvable.", 404);
  const eligibleMembers = await prisma.participant.findMany({
    where: {
      id: { in: body.memberIds },
      category: "HACKATHON",
      isTest: false,
      status: { in: ["SELECTED", "PAID", "CONFIRMED", "CHECKED_IN"] },
      teamId: null,
    },
  });
  if (eligibleMembers.length !== new Set(body.memberIds).size) {
    return apiError(
      "Tous les membres doivent être acceptés et sans équipe.",
      409,
    );
  }

  const team = await prisma.team.create({
    data: {
      competitionId: competition.id,
      name: body.name.trim(),
      domain: body.domain?.trim() ?? "",
      problem: body.problem.trim(),
      members: {
        connect: eligibleMembers.map((participant) => ({
          id: participant.id,
        })),
      },
    },
    include: { members: true },
  });
  return apiSuccess(team, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  if (!(await requireRole(["SUPER_ADMIN", "ADMIN"]))) {
    return apiError("Non autorisé.", 401);
  }
  if (!prisma) return apiError("Base de données indisponible.", 503);
  const body = await readJson<{
    teamId?: string;
    addMemberIds?: string[];
    removeMemberIds?: string[];
  }>(request);
  if (!body?.teamId) return apiError("Équipe manquante.");

  const team = await prisma.team.findUnique({
    where: { id: body.teamId },
    include: { members: true },
  });
  if (!team) return apiError("Équipe introuvable.", 404);
  const addMemberIds = [...new Set(body.addMemberIds ?? [])];
  const removeMemberIds = [...new Set(body.removeMemberIds ?? [])];
  const resultingSize =
    team.members.length - removeMemberIds.length + addMemberIds.length;
  if (resultingSize < 1 || resultingSize > 5) {
    return apiError("Une équipe doit contenir entre 1 et 5 membres.", 409);
  }

  if (addMemberIds.length) {
    const eligible = await prisma.participant.count({
      where: {
        id: { in: addMemberIds },
        category: "HACKATHON",
        isTest: false,
        status: { in: ["SELECTED", "PAID", "CONFIRMED", "CHECKED_IN"] },
        teamId: null,
      },
    });
    if (eligible !== addMemberIds.length) {
      return apiError(
        "Les nouveaux membres doivent être acceptés et sans équipe.",
        409,
      );
    }
  }

  const updated = await prisma.team.update({
    where: { id: team.id },
    data: {
      members: {
        disconnect: removeMemberIds.map((id) => ({ id })),
        connect: addMemberIds.map((id) => ({ id })),
      },
    },
    include: { members: true },
  });
  return apiSuccess(updated);
}
