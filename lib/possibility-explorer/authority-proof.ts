import { canRenderVisualSummary } from "./visual-gating";
import { buildWorkspaceState, type WorkspaceState } from "./workspace";
import type { PossibilityExplorerInput, PossibilityExplorerResult } from "./types";

export interface AuthorityProofView {
  workspace: WorkspaceState;
  runState: PossibilityExplorerResult["runState"];
  recommendationVisible: boolean;
  visibleVisualOptionIds: string[];
}

export function getVisibleVisualOptionIds(result: PossibilityExplorerResult) {
  return result.assessments
    .filter((assessment) => canRenderVisualSummary(result, assessment))
    .map((assessment) => assessment.optionId);
}

export function buildAuthorityProofView(input: PossibilityExplorerInput): AuthorityProofView {
  const workspace = buildWorkspaceState(input);
  const { result } = workspace;

  return {
    workspace,
    runState: result.runState,
    recommendationVisible: result.recommendationSummary !== null,
    visibleVisualOptionIds: getVisibleVisualOptionIds(result),
  };
}
