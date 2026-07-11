type PreselectionTeam = {
  name: string;
  phase1Rank: number | null;
  aiEvaluation: { score: number | null } | null;
};

/**
 * Preserves the frozen Phase 1 selection order after finalists move to the
 * human jury. Older records without a stored rank fall back to their Phase 1
 * AI score, then name, so the order remains deterministic during migration.
 */
export const orderByPhase1Preselection = <Team extends PreselectionTeam>(
  teams: Team[],
): Team[] =>
  [...teams].sort((left, right) => {
    const rankDifference =
      (left.phase1Rank ?? Number.MAX_SAFE_INTEGER) -
      (right.phase1Rank ?? Number.MAX_SAFE_INTEGER);
    if (rankDifference !== 0) return rankDifference;

    const scoreDifference =
      (right.aiEvaluation?.score ?? -1) -
      (left.aiEvaluation?.score ?? -1);
    if (scoreDifference !== 0) return scoreDifference;

    return left.name.localeCompare(right.name, "fr");
  });
