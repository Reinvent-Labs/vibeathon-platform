import { AI_EVAL_CRITERIA } from "@/lib/constants";

export type EvalInput = {
  teamName: string;
  problem: string;
  description?: string | null;
  demoUrl?: string | null;
  repositoryUrl?: string | null;
  testCredentials?: string | null;
  /** Report from the live browser test agent (see lib/browser-agent.ts) */
  browserReport?: string | null;
};

export type CriterionScore = {
  key: string;
  name: string;
  weight: number;
  score: number;
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
const MODEL = "anthropic/claude-sonnet-4-5";

const CRITERIA_LIST = AI_EVAL_CRITERIA.map(
  (c) => `- **${c.name}** (max ${c.weight} pts, id: "${c.id}"): ${c.description}`,
).join("\n");

function buildPrompt(input: EvalInput): string {
  return `You are an expert judge for VIBEATHON 2026, a Vibe Coding hackathon in Abidjan where teams have one day to design and ship a complete application using AI-generated code only.

## Project to Evaluate

**Team:** ${input.teamName}
**Problem addressed:** ${input.problem}
${input.description ? `**Project description:** ${input.description}` : ""}
${input.demoUrl ? `**Demo URL:** ${input.demoUrl}` : ""}
${input.repositoryUrl ? `**Repository:** ${input.repositoryUrl}` : ""}
${input.browserReport ? `
## Live Browser Test Report

An automated QA agent opened the demo URL in a real browser and tested it. Its factual report:

${input.browserReport}

Weight this report heavily for "Execution Quality" and "Technical Excellence": it reflects what actually works, unlike the team's own description.` : ""}

## Evaluation Criteria

${CRITERIA_LIST}

## Instructions

Evaluate this project on each criterion. For each, provide:
- An integer score from 0 to the criterion's maximum
- A concise reasoning in French (1–2 sentences)

If no description or demo URL is provided, score conservatively based on the problem statement alone.

Reply ONLY with a valid JSON object, no markdown, no text before or after:

{
  "scores": [
    { "key": "problem", "score": <int 0-20>, "reasoning": "<string>" },
    { "key": "execution", "score": <int 0-25>, "reasoning": "<string>" },
    { "key": "innovation", "score": <int 0-15>, "reasoning": "<string>" },
    { "key": "impact", "score": <int 0-20>, "reasoning": "<string>" },
    { "key": "technical", "score": <int 0-20>, "reasoning": "<string>" }
  ],
  "summary": "<2-3 sentence project overview in French>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<improvement 1>", "<improvement 2>"]
}`;
}

/**
 * Deterministic mock evaluation for local development (AI_EVAL_MOCK=1).
 * Scores derive from a hash of the team name so rankings are stable
 * across runs without calling OpenRouter.
 */
function mockEvaluation(input: EvalInput): EvalResult {
  let hash = 0;
  for (const ch of input.teamName) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const scores: CriterionScore[] = AI_EVAL_CRITERIA.map((c, i) => {
    const ratio = 0.5 + (((hash >> (i * 4)) & 0xf) / 15) * 0.5; // 50–100% of weight
    return {
      key: c.id,
      name: c.name,
      weight: c.weight,
      score: Math.round(c.weight * ratio),
      reasoning: `[MOCK] Score simulé pour ${c.name}.`,
    };
  });
  return {
    scores,
    totalScore: scores.reduce((sum, s) => sum + s.score, 0),
    summary: `[MOCK] Évaluation simulée du projet de ${input.teamName}.`,
    strengths: ["[MOCK] Point fort simulé"],
    improvements: ["[MOCK] Amélioration simulée"],
    model: "mock",
  };
}

export async function evaluateProject(input: EvalInput): Promise<EvalResult> {
  if (process.env.AI_EVAL_MOCK === "1") return mockEvaluation(input);

  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY not set");

  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://vibethon.reinvent-labs.com",
      "X-Title": "VIBEATHON 2026 Phase 1 AI Evaluation",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1200,
      temperature: 0.2,
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
  const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  const parsed = JSON.parse(clean) as {
    scores: { key: string; score: number; reasoning: string }[];
    summary: string;
    strengths: string[];
    improvements: string[];
  };

  const criteriaMap = Object.fromEntries(AI_EVAL_CRITERIA.map((c) => [c.id, c]));

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
