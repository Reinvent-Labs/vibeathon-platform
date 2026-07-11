import { apiError, apiSuccess } from "@/lib/api";
import { isSameOrigin, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog, requestIp } from "@/lib/audit";
import { hasTestableProject } from "@/lib/project-submission";
import { orderByPhase1Preselection } from "@/lib/phase1-ranking";

/** GET — returns current phase status and team list for Phase 1 dashboard. */
export async function GET() {
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const [competition, teams] = await Promise.all([
    prisma.competition.findUnique({
      where: { slug: "vibeathon-2026" },
      select: { phase: true },
    }),
    prisma.team.findMany({
      where: { competition: { slug: "vibeathon-2026" } },
      select: {
        id: true,
        name: true,
        problem: true,
        description: true,
        demoUrl: true,
        repositoryUrl: true,
        slidesUrl: true,
        isFinalist: true,
        phase1Rank: true,
        rank: true,
        aiEvaluation: {
          select: { score: true, summary: true, updatedAt: true, raw: true },
        },
      },
    }),
  ]);

  if (!competition) return apiError("Compétition introuvable.", 404);

  const ranked = orderByPhase1Preselection(teams);

  return apiSuccess({
    phase: competition.phase,
    teams: ranked.map((t, i) => {
      const raw = t.aiEvaluation?.raw as
        | {
            scores?: { key: string; name: string; weight: number; score: number; reasoning: string }[];
            browserReport?: string | null;
            promptInjectionDetected?: boolean;
            promptInjectionEvidence?: string | null;
            penalty?: number;
            rawTotal?: number;
          }
        | null
        | undefined;
      return {
        id: t.id,
        name: t.name,
        hasSubmission: hasTestableProject(t),
        description: t.description ?? null,
        demoUrl: t.demoUrl ?? null,
        repositoryUrl: t.repositoryUrl ?? null,
        slidesUrl: t.slidesUrl ?? null,
        aiScore: t.aiEvaluation?.score ?? null,
        aiSummary: t.aiEvaluation?.summary ?? null,
        aiEvaluatedAt: t.aiEvaluation?.updatedAt ?? null,
        aiScores: raw?.scores ?? null,
        browserReport: raw?.browserReport ?? null,
        promptInjectionDetected: raw?.promptInjectionDetected ?? false,
        promptInjectionEvidence: raw?.promptInjectionEvidence ?? null,
        penalty: raw?.penalty ?? 0,
        rawTotal: raw?.rawTotal ?? null,
        isFinalist: t.isFinalist,
        rank: t.rank,
        position: t.phase1Rank ?? i + 1,
      };
    }),
  });
}

/** POST — starts Phase 1: locks submissions and returns teams to evaluate. */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return apiError("Origine invalide.", 403);
  const user = await requireRole(["SUPER_ADMIN", "ADMIN"]);
  if (!user) return apiError("Non autorisé.", 401);
  if (!prisma) return apiError("Base de données indisponible.", 503);

  const competition = await prisma.competition.findUnique({
    where: { slug: "vibeathon-2026" },
    select: { id: true, phase: true },
  });
  if (!competition) return apiError("Compétition introuvable.", 404);
  if (competition.phase !== "SUBMISSIONS_OPEN") {
    return apiError(`La Phase 1 est déjà en cours ou terminée (phase: ${competition.phase}).`, 409);
  }

  await prisma.competition.update({
    where: { id: competition.id },
    data: { phase: "PHASE1_RUNNING" },
  });

  await writeAuditLog({
    actorId: user.userId,
    action: "PHASE1_STARTED",
    entityType: "Competition",
    entityId: competition.id,
    ipAddress: requestIp(request),
  });

  const teams = await prisma.team.findMany({
    where: { competition: { slug: "vibeathon-2026" } },
    select: {
      id: true,
      name: true,
      problem: true,
      description: true,
      demoUrl: true,
      repositoryUrl: true,
      aiEvaluation: { select: { score: true, updatedAt: true } },
    },
    orderBy: { name: "asc" },
  });

  return apiSuccess({
    phase: "PHASE1_RUNNING",
    teams: teams.map((t) => ({
      id: t.id,
      name: t.name,
      hasSubmission: hasTestableProject(t),
      aiScore: t.aiEvaluation?.score ?? null,
      aiEvaluatedAt: t.aiEvaluation?.updatedAt ?? null,
    })),
  });
}
