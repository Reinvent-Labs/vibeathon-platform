type ProjectSubmission = {
  description?: string | null;
  demoUrl?: string | null;
  repositoryUrl?: string | null;
};

/**
 * Returns whether a team supplied a testable project artifact for Phase 1.
 * A description alone is a proposal, not evidence that a product was built.
 */
export const hasTestableProject = (team: ProjectSubmission): boolean =>
  Boolean(team.demoUrl?.trim() || team.repositoryUrl?.trim());
