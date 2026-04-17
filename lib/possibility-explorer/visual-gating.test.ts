import { describe, expect, it } from "vitest";

import { buildPossibilityExplorerResult, createDefaultInput } from "@/lib/possibility-explorer/engine";
import { canRenderVisualSummary, getVisualSummaryWidth } from "@/lib/possibility-explorer/visual-gating";

describe("canRenderVisualSummary", () => {
  it("blocks visual summaries while weights are unconfirmed", () => {
    const input = createDefaultInput();
    const result = buildPossibilityExplorerResult(input);

    expect(result.runState).toBe("awaiting-user-weights");
    expect(canRenderVisualSummary(result, result.assessments[0])).toBe(false);
  });

  it("blocks visual summaries for downgraded runs even if an assessment exists", () => {
    const result = buildPossibilityExplorerResult({
      question: "What should I do?",
      options: [
        { id: "a", label: "Option A", details: "" },
        { id: "b", label: "Option B", details: "" },
      ],
      preferredOutcomes: "",
      constraints: "",
      criteriaWeights: {},
      weightsConfirmed: false,
    });

    expect(result.runState).toBe("downgraded");
    expect(canRenderVisualSummary(result, result.assessments[0])).toBe(false);
  });

  it("allows visual summaries only for analysis-complete runs with numeric scores", () => {
    const input = createDefaultInput();
    input.weightsConfirmed = true;
    const result = buildPossibilityExplorerResult(input);

    expect(result.runState).toBe("analysis-complete");
    expect(canRenderVisualSummary(result, result.assessments[0])).toBe(true);
  });
});

describe("getVisualSummaryWidth", () => {
  it("converts a numeric score into a bounded bar width", () => {
    expect(getVisualSummaryWidth(8.4)).toBe("84%");
    expect(getVisualSummaryWidth(0.1)).toBe("8%");
    expect(getVisualSummaryWidth(12)).toBe("100%");
  });
});
