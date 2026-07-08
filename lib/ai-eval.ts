import Anthropic from "@anthropic-ai/sdk";
import { JUDGING_CRITERIA } from "@/lib/constants";

export type EvalInput = {
  teamName: string;
  problem: string;
  description: string;
  demoUrl?: string;
  repositoryUrl?: string;
};

export type CriterionScore = {
  key: string;
  name: string;
  weight: number;
  score: number; // 0–weight (normalized to criterion max)
  reasoning: string;
};

export type EvalResult = {
  scores: CriterionScore[];
  totalScore: number; // 0–100
  summary: string;
  strengths: string[];
  improvements: string[];
  model: string;
};

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CRITERIA_LIST = JUDGING_CRITERIA.map(
  (c) => `- **${c.name}** (max ${c.weight} points, id: "${c.id}")`,
).join("\n");

export async function evaluateProject(input: EvalInput): Promise<EvalResult> {
  const MODEL = "claude-sonnet-5-20251101";

  const prompt = `Tu es un jury expert pour VIBEATHON 2026, un hackathon de Vibe Coding sur le thème IA × Environnement à Abidjan.
Les équipes ont eu une journée pour concevoir, vibe-coder (IA générative seule, sans écrire de code traditionnel) et pitcher une application complète.

## Projet à évaluer

**Équipe :** ${input.teamName}
**Problème adressé :** ${input.problem}
**Description du projet :** ${input.description}
${input.demoUrl ? `**URL de démo :** ${input.demoUrl}` : ""}
${input.repositoryUrl ? `**Dépôt :** ${input.repositoryUrl}` : ""}

## Critères d'évaluation

${CRITERIA_LIST}

## Instructions

Évalue ce projet selon chaque critère. Pour chaque critère, donne :
- Un score entier de 0 au maximum du critère
- Un raisonnement concis (1-2 phrases en français)

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown, sans texte avant ou après :

{
  "scores": [
    { "key": "impact", "score": <entier 0-30>, "reasoning": "<string>" },
    { "key": "feasibility", "score": <entier 0-20>, "reasoning": "<string>" },
    { "key": "ai", "score": <entier 0-20>, "reasoning": "<string>" },
    { "key": "innovation", "score": <entier 0-15>, "reasoning": "<string>" },
    { "key": "pitch", "score": <entier 0-15>, "reasoning": "<string>" }
  ],
  "summary": "<synthèse globale du projet en 2-3 phrases>",
  "strengths": ["<point fort 1>", "<point fort 2>"],
  "improvements": ["<axe d'amélioration 1>", "<axe d'amélioration 2>"]
}`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text : "";
  const parsed = JSON.parse(raw.replace(/^```json\s*/i, "").replace(/```\s*$/, ""));

  const criteriaMap = Object.fromEntries(
    JUDGING_CRITERIA.map((c) => [c.id, c]),
  );

  const scores: CriterionScore[] = parsed.scores.map(
    (s: { key: string; score: number; reasoning: string }) => {
      const criterion = criteriaMap[s.key];
      return {
        key: s.key,
        name: criterion?.name ?? s.key,
        weight: criterion?.weight ?? 0,
        score: Math.min(Math.max(Math.round(s.score), 0), criterion?.weight ?? 0),
        reasoning: s.reasoning,
      };
    },
  );

  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);

  return {
    scores,
    totalScore,
    summary: parsed.summary ?? "",
    strengths: parsed.strengths ?? [],
    improvements: parsed.improvements ?? [],
    model: MODEL,
  };
}
