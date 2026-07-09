import { apiError, apiSuccess, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { evaluateProject } from "@/lib/ai-eval";

type SubmitBody = {
  teamId?: string;
  demoUrl?: string;
  repositoryUrl?: string;
  description?: string;
  testCredentials?: string;
};

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const body = await readJson<SubmitBody>(request);
  if (!body?.teamId?.trim()) return apiError("Équipe manquante.");
  if (!body.description?.trim()) return apiError("Description du projet manquante.");
  if (!body.demoUrl?.trim()) return apiError("URL de démo manquante.");

  try { new URL(body.demoUrl); } catch { return apiError("URL de démo invalide."); }
  if (body.repositoryUrl?.trim()) {
    try { new URL(body.repositoryUrl); } catch { return apiError("URL du dépôt invalide."); }
  }

  const team = await prisma.team.findFirst({
    where: { id: body.teamId, competition: { slug: "vibeathon-2026" } },
    include: { competition: { select: { phase: true } } },
  });
  if (!team) return apiError("Équipe introuvable.", 404);
  if (team.competition.phase !== "SUBMISSIONS_OPEN") {
    return apiError("Les soumissions sont fermées. La Phase 1 a déjà démarré.", 409);
  }

  await prisma.team.update({
    where: { id: team.id },
    data: {
      description: body.description?.trim() || null,
      demoUrl: body.demoUrl.trim(),
      repositoryUrl: body.repositoryUrl?.trim() || null,
      testCredentials: body.testCredentials?.trim().slice(0, 500) || null,
    },
  });

  let evalResult = null;
  if (process.env.OPENROUTER_API_KEY || process.env.AI_EVAL_MOCK === "1") {
    try {
      evalResult = await evaluateProject({
        teamName: team.name,
        problem: team.problem,
        description: body.description.trim(),
        demoUrl: body.demoUrl.trim(),
        repositoryUrl: body.repositoryUrl?.trim(),
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
    } catch (err) {
      console.error("[ai-eval] evaluation failed:", err);
    }
  }

  return apiSuccess({
    teamName: team.name,
    submitted: true,
    aiScore: evalResult?.totalScore ?? null,
    aiSummary: evalResult?.summary ?? null,
  });
}
