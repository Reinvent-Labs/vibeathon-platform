import { apiError, apiSuccess, readJson } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { evaluateProject } from "@/lib/ai-eval";

type SubmitBody = {
  teamName?: string;
  demoUrl?: string;
  repositoryUrl?: string;
  description?: string;
};

export const maxDuration = 60; // allow time for the AI call

export async function POST(request: Request) {
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const body = await readJson<SubmitBody>(request);
  if (!body?.teamName?.trim()) return apiError("Nom d'équipe manquant.");
  if (!body.description?.trim()) return apiError("Description du projet manquante.");
  if (!body.demoUrl?.trim()) return apiError("URL de démo manquante.");

  // Validate URL formats
  try {
    new URL(body.demoUrl);
  } catch {
    return apiError("URL de démo invalide.");
  }
  if (body.repositoryUrl?.trim()) {
    try {
      new URL(body.repositoryUrl);
    } catch {
      return apiError("URL du dépôt invalide.");
    }
  }

  // Find team by name (case-insensitive)
  const team = await prisma.team.findFirst({
    where: {
      name: { equals: body.teamName.trim(), mode: "insensitive" },
    },
  });

  if (!team) {
    return apiError(
      "Équipe introuvable. Vérifie le nom exact de ton équipe.",
      404,
    );
  }

  // Save submission URLs
  await prisma.team.update({
    where: { id: team.id },
    data: {
      demoUrl: body.demoUrl.trim(),
      repositoryUrl: body.repositoryUrl?.trim() ?? null,
    },
  });

  // Run AI evaluation (non-blocking: if it fails, submission is still saved)
  let evalResult = null;
  if (process.env.OPENROUTER_API_KEY) {
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
          provider: "anthropic",
          model: evalResult.model,
          score: evalResult.totalScore,
          summary: evalResult.summary,
          raw: JSON.parse(JSON.stringify(evalResult)),
        },
        update: {
          provider: "anthropic",
          model: evalResult.model,
          score: evalResult.totalScore,
          summary: evalResult.summary,
          raw: JSON.parse(JSON.stringify(evalResult)),
          updatedAt: new Date(),
        },
      });
    } catch (err) {
      console.error("[ai-eval] evaluation failed:", err);
      // Evaluation failure doesn't block the submission response
    }
  }

  return apiSuccess({
    teamName: team.name,
    submitted: true,
    aiScore: evalResult?.totalScore ?? null,
    aiSummary: evalResult?.summary ?? null,
  });
}
