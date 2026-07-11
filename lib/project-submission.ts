type ProjectSubmission = {
  description?: string | null;
  demoUrl?: string | null;
  repositoryUrl?: string | null;
  videoUrl?: string | null;
};

/**
 * Returns whether a team supplied a testable project artifact for Phase 1.
 * A description alone is a proposal, not evidence that a product was built.
 * A demo video counts too — it's the fair alternative for mobile-only teams
 * or anything the browser-test agent structurally can't interact with.
 */
export const hasTestableProject = (team: ProjectSubmission): boolean =>
  Boolean(team.demoUrl?.trim() || team.repositoryUrl?.trim() || team.videoUrl?.trim());
