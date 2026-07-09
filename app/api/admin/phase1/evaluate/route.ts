import { apiError, apiSuccess, readJson } from "@/lib/api";
import { isSameOrigin, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluateProject } from "@/lib/ai-eval";

export const maxDuration = 60;

type Body = { teamId?: string };

/** POST — runs AI evaluation for a single team. Called per-team from the admin UI. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const body = await readJson<Body>(request);
  if (!body?.teamId) return apiError("teamId manquant.");

  const competition = await prisma.competition.findUnique({
    where: { slug: "vibeathon-2026" },
    select: { phase: true },
  });
  if (!competition) return apiError("Compétition introuvable.", 404);
  if (!["PHASE1_RUNNING", "PHASE1_DONE"].includes(competition.phase)) {
    return apiError("La Phase 1 n'est pas active.", 409);
  }

  const team = await prisma.team.findFirst({
    where: { id: body.teamId, competition: { slug: "vibeathon-2026" } },
    select: { id: true, name: true, problem: true, description: true, demoUrl: true, repositoryUrl: true },
  });
  if (!team) return apiError("Équipe introuvable.", 404);

  if (!process.env.OPENROUTER_API_KEY && process.env.AI_EVAL_MOCK !== "1") {
    return apiError("OPENROUTER_API_KEY non configurée.", 503);
  }

  const evalResult = await evaluateProject({
    teamName: team.name,
    problem: team.problem,
    description: team.description,
    demoUrl: team.demoUrl,
    repositoryUrl: team.repositoryUrl,
  });

  await prisma.aIEvaluation.upsert({
    where: { teamId: team.id },
    create: {
      teamId: team.id,
      provider: "openrouter",
      model: evalResult.model,
      score: evalResult.totalScore,
      summary: evalResult.summary,
      raw: JSON.parse(JSON.stringify(evalResult)),
    },
    update: {
      provider: "openrouter",
      model: evalResult.model,
      score: evalResult.totalScore,
      summary: evalResult.summary,
      raw: JSON.parse(JSON.stringify(evalResult)),
      updatedAt: new Date(),
    },
  });

  return apiSuccess({
    teamId: team.id,
    name: team.name,
    score: evalResult.totalScore,
    summary: evalResult.summary,
    scores: evalResult.scores,
  });
}
