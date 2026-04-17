import { describe, expect, it } from "vitest";

import { buildPossibilityExplorerResult, createDefaultInput } from "@/lib/possibility-explorer/engine";
import { buildWorkspaceState } from "@/lib/possibility-explorer/workspace";

describe("buildWorkspaceState", () => {
  it("fails safe on invalid input before engine execution", () => {
    const input = createDefaultInput();
    input.options = [
      { id: "first", label: "Same option", details: "First" },
      { id: "second", label: " same  option ", details: "Second" },
    ];

    const state = buildWorkspaceState(input);

    expect(state.validationState).toBe("invalid-input");
    expect(state.result.runState).toBe("failed_safe");
    expect(state.result.recommendationSummary).toBeNull();
    expect(state.result.visualGate.allowed).toBe(false);
    expect(state.inputErrors.some((message) => message.includes("distinct"))).toBe(true);
  });

  it("surfaces thin-input warnings for the app layer", () => {
    const state = buildWorkspaceState({
      question: "Should I order delivery tonight because I'm tired and on a budget?",
      options: [
        { id: "delivery", label: "Order delivery", details: "" },
        { id: "walk", label: "Walk nearby", details: "" },
      ],
      preferredOutcomes: "",
      constraints: "",
      criteriaWeights: {
        energy: 50,
        cost: 50,
      },
      weightsConfirmed: false,
    });

    expect(state.validationState).toBe("valid");
    expect(state.inputWarnings.map((warning) => warning.code)).toContain("context_is_thin");
  });

  it("keeps recommendation and visuals blocked until weights are confirmed", () => {
    const state = buildWorkspaceState(createDefaultInput());

    expect(state.validationState).toBe("valid");
    expect(state.result.runState).toBe("awaiting-user-weights");
    expect(state.result.recommendationSummary).toBeNull();
    expect(state.result.visualGate.allowed).toBe(false);
  });

  it("returns analysis-complete only for schema-valid confirmed output", () => {
    const input = createDefaultInput();
    input.weightsConfirmed = true;

    const state = buildWorkspaceState(input);

    expect(state.validationState).toBe("valid");
    expect(state.result.runState).toBe("analysis-complete");
    expect(state.result.recommendationSummary).not.toBeNull();
    expect(state.result.visualGate.allowed).toBe(true);
  });

  it("fails safe if the engine returns output that does not satisfy the result schema", () => {
    const input = createDefaultInput();
    input.weightsConfirmed = true;

    const state = buildWorkspaceState(input, {
      evaluate: (validatedInput) => ({
        ...buildPossibilityExplorerResult(validatedInput),
        recommendationSummary: null,
      }),
    });

    expect(state.validationState).toBe("invalid-output");
    expect(state.result.runState).toBe("failed_safe");
    expect(state.result.visualGate.allowed).toBe(false);
    expect(state.outputErrors.some((message) => message.includes("recommendation"))).toBe(true);
  });
});
