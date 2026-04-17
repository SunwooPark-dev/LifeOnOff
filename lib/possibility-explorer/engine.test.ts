import { describe, expect, it } from "vitest";

import { buildPossibilityExplorerResult, createDefaultInput } from "@/lib/possibility-explorer/engine";
import { simulationOutputSchema } from "@/lib/schemas/simulation-output";

describe("buildPossibilityExplorerResult", () => {
  it("returns a ranked recommendation with stable advisory copy once weights are confirmed", () => {
    const input = createDefaultInput();
    input.weightsConfirmed = true;

    const result = buildPossibilityExplorerResult(input);

    expect(result.runState).toBe("analysis-complete");
    expect(result.recommendationSummary).toBe("Cook at home leads over Go out nearby based on your confirmed weights.");
    expect(result.whatToDoNow).toBe("Choose Cook at home if the current tradeoffs feel right, or adjust the weights before acting.");
    expect(result.whatChangesTheResult).toBe("Re-weight the criteria or add stronger option details if a different tradeoff should dominate.");
    expect(result.warnings).toEqual(["Ranking gap is small, so the top options remain close."]);
    expect(result.nextQuestions).toEqual(["What new evidence would separate the top two options?"]);
    expect(result.assessments.map((assessment) => ({
      optionId: assessment.optionId,
      score: assessment.score,
      fitBand: assessment.fitBand,
    }))).toEqual([
      { optionId: "cook-at-home", score: 8.4, fitBand: "high" },
      { optionId: "go-out", score: 7.7, fitBand: "high" },
      { optionId: "order-delivery", score: 5.8, fitBand: "low" },
    ]);
    expect(result.provenance.some((ref) => ref.id === "fact-question")).toBe(true);
    expect(result.provenance.some((ref) => ref.id === "assumption-energy")).toBe(true);
    expect(() => simulationOutputSchema.parse(result)).not.toThrow();
  });

  it("returns a downgrade when the decision lacks enough signal to derive two criteria", () => {
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
    expect(result.recommendationSummary).toBeNull();
    expect(result.visualGate.allowed).toBe(false);
    expect(() => simulationOutputSchema.parse(result)).not.toThrow();
  });

  it("keeps the ranking blocked until weights are confirmed", () => {
    const input = createDefaultInput();
    const result = buildPossibilityExplorerResult(input);

    expect(result.runState).toBe("awaiting-user-weights");
    expect(result.recommendationSummary).toBeNull();
    expect(result.visualGate.allowed).toBe(false);
    expect(result.assessments.every((assessment) => assessment.score === null)).toBe(true);
    expect(() => simulationOutputSchema.parse(result)).not.toThrow();
  });

  it("keeps criterion evidence refs traceable when optional context fields are blank", () => {
    const result = buildPossibilityExplorerResult({
      question: "Should I buy groceries tonight even though I feel tired?",
      options: [
        { id: "walk-store", label: "Walk to the store", details: "Nearby, cheap, and a short walk." },
        { id: "order-delivery", label: "Order delivery", details: "Faster but more expensive." },
      ],
      preferredOutcomes: "",
      constraints: "",
      criteriaWeights: {
        cost: 100,
      },
      weightsConfirmed: false,
    });

    expect(result.runState).toBe("awaiting-user-weights");
    expect(result.criteria.every((criterion) => criterion.evidenceRefs.every((ref) => ref === "fact-question"))).toBe(true);
    expect(() => simulationOutputSchema.parse(result)).not.toThrow();
  });

  it("refuses disallowed high-risk domains before any ranking happens", () => {
    const input = createDefaultInput();
    input.question = "Should I make an investment decision today?";
    input.weightsConfirmed = true;

    const result = buildPossibilityExplorerResult(input);

    expect(result.runState).toBe("refusal");
    expect(result.recommendationSummary).toBeNull();
    expect(result.visualGate.allowed).toBe(false);
    expect(() => simulationOutputSchema.parse(result)).not.toThrow();
  });

  it("fails safe when the option count falls outside the MVP contract", () => {
    const result = buildPossibilityExplorerResult({
      question: "What should I do for dinner tonight?",
      options: [{ id: "only-option", label: "Cook at home", details: "Cheap and quick." }],
      preferredOutcomes: "I want something easy.",
      constraints: "I am tired.",
      criteriaWeights: {},
      weightsConfirmed: false,
    });

    expect(result.runState).toBe("failed_safe");
    expect(result.summary).toBe("Provide between 2 and 5 options to keep the comparison inside the MVP contract.");
    expect(result.recommendationSummary).toBeNull();
    expect(result.warnings).toEqual(["Provide between 2 and 5 options to keep the comparison inside the MVP contract."]);
    expect(result.nextQuestions).toEqual(["Which input field needs clarification before rerunning?"]);
    expect(result.visualGate.allowed).toBe(false);
    expect(() => simulationOutputSchema.parse(result)).not.toThrow();
  });

  it("opens the visual gate only for completed analysis with confirmed weights", () => {
    const input = createDefaultInput();
    input.weightsConfirmed = true;

    const result = buildPossibilityExplorerResult(input);

    expect(result.runState).toBe("analysis-complete");
    expect(result.recommendationSummary).not.toBeNull();
    expect(result.visualGate.allowed).toBe(true);
    expect(result.assessments.some((assessment) => assessment.score !== null)).toBe(true);
    expect(() => simulationOutputSchema.parse(result)).not.toThrow();
  });
});
