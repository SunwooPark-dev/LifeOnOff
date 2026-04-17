import type { OptionAssessment, PossibilityExplorerResult } from "./types";

export function canRenderVisualSummary(result: PossibilityExplorerResult, assessment: OptionAssessment) {
  return result.runState === "analysis-complete" && result.visualGate.allowed && assessment.score !== null;
}

export function getVisualSummaryWidth(score: number) {
  const width = Math.max(8, Math.min(100, Math.round(score * 10)));
  return `${width}%`;
}
