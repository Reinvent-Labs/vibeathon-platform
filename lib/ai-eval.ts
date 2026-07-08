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

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
// Best available model via OpenRouter — falls back to a cheaper one if quota exhausted
const MODEL = "anthropic/claude-sonnet-4-5";

const CRITERIA_LIST = JUDGING_CRITERIA.map(
  (c) => `- **${c.name}** (max ${c.weight} points, id: "${c.id}")`,
).join("\n");

function buildPrompt(input: EvalInput): string {
  return `Tu es un jury expert pour VIBEATHON 2026, un hackathon de Vibe Coding sur le thème IA × Environnement à Abidjan.
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
}

export async function evaluateProject(input: EvalInput): Promise<EvalResult> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://vibethon.reinvent-labs.com",
      "X-Title": "VIBEATHON 2026 AI Evaluation",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: buildPrompt(input) }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }

  const data = await res.json() as {
    choices: { message: { content: string } }[];
    model: string;
  };

  const raw = data.choices[0]?.message?.content ?? "";
  // Strip markdown code fences if the model adds them
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  const parsed = JSON.parse(clean) as {
    scores: { key: string; score: number; reasoning: string }[];
    summary: string;
    strengths: string[];
    improvements: string[];
  };

  const criteriaMap = Object.fromEntries(JUDGING_CRITERIA.map((c) => [c.id, c]));

  const scores: CriterionScore[] = parsed.scores.map((s) => {
    const criterion = criteriaMap[s.key];
    return {
      key: s.key,
      name: criterion?.name ?? s.key,
      weight: criterion?.weight ?? 0,
      score: Math.min(Math.max(Math.round(s.score), 0), criterion?.weight ?? 0),
      reasoning: s.reasoning,
    };
  });

  return {
    scores,
    totalScore: scores.reduce((sum, s) => sum + s.score, 0),
    summary: parsed.summary ?? "",
    strengths: parsed.strengths ?? [],
    improvements: parsed.improvements ?? [],
    model: data.model ?? MODEL,
  };
}
