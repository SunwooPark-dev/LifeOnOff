export type ProvenanceKind = "fact" | "inference" | "assumption" | "unknown";

export type RunState =
  | "draft"
  | "validating-inputs"
  | "awaiting-user-weights"
  | "analysis-complete"
  | "qualitative_only"
  | "downgraded"
  | "failed_safe"
  | "refusal";

export type WeightMap = Record<string, number>;

export interface ChoiceOptionInput {
  id: string;
  label: string;
  details: string;
}

export interface ProvenanceRef {
  id: string;
  kind: ProvenanceKind;
  label: string;
  detail: string;
}

export interface Criterion {
  id: string;
  label: string;
  description: string;
  weight: number;
  weightConfirmed: boolean;
  evidenceRefs: string[];
  assumptionRefs: string[];
}

export interface OptionAssessment {
  optionId: string;
  score: number | null;
  fitBand: "high" | "medium" | "low";
  whyItFits: string;
  whatCouldChange: string;
  nextStep: string;
  evidenceRefs: string[];
  assumptionRefs: string[];
}

export interface PossibilityExplorerInput {
  question: string;
  options: ChoiceOptionInput[];
  preferredOutcomes: string;
  constraints: string;
  criteriaWeights: WeightMap;
  weightsConfirmed: boolean;
}

export interface PossibilityExplorerResult {
  schemaVersion: "v1";
  runState: RunState;
  statusTitle: string;
  summary: string;
  recommendationSummary: string | null;
  whyThisConclusion: string;
  whatChangesTheResult: string;
  whatToDoNow: string;
  uncertaintyNote: string;
  refusalReason: string | null;
  criteria: Criterion[];
  provenance: ProvenanceRef[];
  assessments: OptionAssessment[];
  visualGate: {
    allowed: boolean;
    reason: string;
  };
}
