import { buildPossibilityExplorerResult } from "./engine";
import type { PossibilityExplorerInput, PossibilityExplorerResult, ProvenanceRef } from "./types";
import { parseDecisionInput, type DecisionInput, type DecisionInputWarning } from "@/lib/schemas/decision-input";
import { simulationOutputSchema } from "@/lib/schemas/simulation-output";

export type WorkspaceValidationState = "valid" | "invalid-input" | "invalid-output";

export interface WorkspaceState {
  validationState: WorkspaceValidationState;
  result: PossibilityExplorerResult;
  inputWarnings: DecisionInputWarning[];
  inputErrors: string[];
  outputErrors: string[];
}

type WorkspaceDeps = {
  evaluate?: (input: DecisionInput) => PossibilityExplorerResult;
};

function makeProvenance(question: string): ProvenanceRef[] {
  return [
    {
      id: "fact-question",
      kind: question.trim() ? "fact" : "unknown",
      label: "User question",
      detail: question.trim() || "No valid question was available.",
    },
  ];
}

function buildFailedSafeResult(input: PossibilityExplorerInput, summary: string, warnings: string[], nextQuestion: string): PossibilityExplorerResult {
  return {
    schemaVersion: "v1",
    runState: "failed_safe",
    statusTitle: "Validation blocked",
    summary,
    recommendationSummary: null,
    whyThisConclusion: summary,
    whatChangesTheResult: "Fix the validation issues before analysis can continue.",
    whatToDoNow: "Update the input and rerun the comparison.",
    uncertaintyNote: "No ranking was produced because the app blocked on validation.",
    refusalReason: null,
    weightsConfirmed: input.weightsConfirmed,
    warnings,
    nextQuestions: [nextQuestion],
    criteria: [],
    provenance: makeProvenance(input.question),
    assessments: [],
    visualGate: {
      allowed: false,
      reason: "Validation failure blocks visual output.",
    },
  };
}

export function buildWorkspaceState(input: PossibilityExplorerInput, deps: WorkspaceDeps = {}): WorkspaceState {
  const parsed = parseDecisionInput(input);

  if (!parsed.success) {
    const inputErrors = parsed.error.issues.map((issue) => issue.message);
    return {
      validationState: "invalid-input",
      result: buildFailedSafeResult(
        input,
        "The workspace blocked analysis because the current input does not satisfy the decision contract.",
        inputErrors,
        "Which field should you clarify first before retrying?",
      ),
      inputWarnings: [],
      inputErrors,
      outputErrors: [],
    };
  }

  const evaluate = deps.evaluate ?? buildPossibilityExplorerResult;
  const result = evaluate(parsed.data);
  const output = simulationOutputSchema.safeParse(result);

  if (!output.success) {
    const outputErrors = output.error.issues.map((issue) => issue.message);
    return {
      validationState: "invalid-output",
      result: buildFailedSafeResult(
        input,
        "The workspace blocked rendering because the generated result no longer satisfies the simulation contract.",
        outputErrors,
        "Which output invariant changed and needs repair?",
      ),
      inputWarnings: parsed.warnings,
      inputErrors: [],
      outputErrors,
    };
  }

  return {
    validationState: "valid",
    result: output.data,
    inputWarnings: parsed.warnings,
    inputErrors: [],
    outputErrors: [],
  };
}
