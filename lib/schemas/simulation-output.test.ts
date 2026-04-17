import { describe, expect, it } from "vitest";

import { simulationOutputSchema } from "@/lib/schemas/simulation-output";

const validOutput = {
  schemaVersion: "v1",
  runState: "analysis-complete",
  statusTitle: "Analysis complete",
  summary: "Cook at home is the current best-fit choice for this daily decision.",
  recommendationSummary: "Cook at home leads over Go out nearby based on your confirmed weights.",
  whyThisConclusion: "Cook at home scores highest across the confirmed criteria.",
  whatChangesTheResult: "Re-weight the criteria or add stronger option details if a different tradeoff should dominate.",
  whatToDoNow: "Choose Cook at home if the current tradeoffs feel right.",
  uncertaintyNote: "Top options are close; ranking may change if assumptions or weights change.",
  refusalReason: null,
  weightsConfirmed: true,
  warnings: [],
  nextQuestions: ["What new evidence would separate the top two options?"],
  criteria: [
    {
      id: "cost",
      label: "Cost / friction",
      description: "How much time, money, or coordination the option consumes.",
      weight: 50,
      weightConfirmed: true,
      evidenceRefs: ["fact-question"],
      assumptionRefs: ["assumption-cost"],
    },
    {
      id: "energy",
      label: "Energy fit",
      description: "How realistic the option is given today's energy and effort budget.",
      weight: 50,
      weightConfirmed: true,
      evidenceRefs: ["fact-question"],
      assumptionRefs: ["assumption-energy"],
    },
  ],
  provenance: [
    {
      id: "fact-question",
      kind: "fact",
      label: "User question",
      detail: "What should I do for dinner tonight?",
    },
    {
      id: "fact-option-cook-at-home",
      kind: "fact",
      label: "Cook at home",
      detail: "Cheap and quick because ingredients are already here.",
    },
    {
      id: "assumption-cost",
      kind: "assumption",
      label: "cost heuristic",
      detail: "Cost score uses lightweight heuristics from the option details.",
    },
    {
      id: "assumption-energy",
      kind: "assumption",
      label: "energy heuristic",
      detail: "Energy score uses lightweight heuristics from the option details.",
    },
  ],
  assessments: [
    {
      optionId: "cook-at-home",
      score: 8.2,
      fitBand: "high",
      whyItFits: "Cook at home best fits when cost and energy matter most.",
      whatCouldChange: "A different weight mix or stronger evidence could reorder this option.",
      nextStep: "Stress-test this option against one concrete downside before deciding.",
      evidenceRefs: ["fact-option-cook-at-home"],
      assumptionRefs: ["assumption-cost", "assumption-energy"],
    },
  ],
  visualGate: {
    allowed: true,
    reason: "Confirmed weights plus traceable score inputs allow a lightweight visual summary.",
  },
} as const;

describe("simulationOutputSchema", () => {
  it("accepts a canonical valid simulation output", () => {
    expect(simulationOutputSchema.parse(validOutput)).toEqual(validOutput);
  });

  it("trims nested strings", () => {
    const parsed = simulationOutputSchema.parse({
      ...validOutput,
      summary: "  Cook at home is the current best-fit choice for this daily decision.  ",
      nextQuestions: ["  What new evidence would separate the top two options?  "],
    });

    expect(parsed.summary).toBe("Cook at home is the current best-fit choice for this daily decision.");
    expect(parsed.nextQuestions).toEqual(["What new evidence would separate the top two options?"]);
  });

  it("requires the full top-level shape", () => {
    const missingSummary = {
      ...validOutput,
      summary: undefined,
    };

    expect(() => simulationOutputSchema.parse(missingSummary)).toThrow();
  });

  it("rejects invalid enums", () => {
    expect(() =>
      simulationOutputSchema.parse({
        ...validOutput,
        runState: "queued",
      }),
    ).toThrow();

    expect(() =>
      simulationOutputSchema.parse({
        ...validOutput,
        provenance: [
          {
            id: "fact-question",
            kind: "guess",
            label: "User question",
            detail: "Question",
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects blank required strings and blank list items", () => {
    expect(() =>
      simulationOutputSchema.parse({
        ...validOutput,
        summary: "   ",
      }),
    ).toThrow();

    expect(() =>
      simulationOutputSchema.parse({
        ...validOutput,
        warnings: ["   "],
      }),
    ).toThrow();
  });

  it("blocks recommendation summaries for blocked states", () => {
    expect(() =>
      simulationOutputSchema.parse({
        ...validOutput,
        runState: "refusal",
        recommendationSummary: "Still do it",
        visualGate: {
          allowed: false,
          reason: "Refusal blocks visuals.",
        },
      }),
    ).toThrow();
  });

  it("requires confirmed weights for analysis-complete", () => {
    expect(() =>
      simulationOutputSchema.parse({
        ...validOutput,
        weightsConfirmed: false,
      }),
    ).toThrow(/confirmed weights/i);
  });

  it("requires evidence and assumption refs to resolve to matching provenance kinds", () => {
    expect(() =>
      simulationOutputSchema.parse({
        ...validOutput,
        criteria: [
          {
            ...validOutput.criteria[0],
            evidenceRefs: ["missing-ref"],
          },
        ],
      }),
    ).toThrow(/does not exist/i);

    expect(() =>
      simulationOutputSchema.parse({
        ...validOutput,
        assessments: [
          {
            ...validOutput.assessments[0],
            assumptionRefs: ["fact-question"],
          },
        ],
      }),
    ).toThrow(/invalid provenance kind/i);
  });

  it("blocks numeric scores while weights are unconfirmed", () => {
    expect(() =>
      simulationOutputSchema.parse({
        ...validOutput,
        runState: "awaiting-user-weights",
        weightsConfirmed: false,
        recommendationSummary: null,
        visualGate: {
          allowed: false,
          reason: "Charts stay blocked until weights are confirmed.",
        },
        assessments: [
          {
            ...validOutput.assessments[0],
            score: 8.2,
          },
        ],
      }),
    ).toThrow();
  });

  it("accepts blocked-state outputs when recommendation and visuals are withheld", () => {
    const parsed = simulationOutputSchema.parse({
      ...validOutput,
      runState: "awaiting-user-weights",
      recommendationSummary: null,
      weightsConfirmed: false,
      warnings: ["Weights are still provisional, so final ranking remains blocked."],
      visualGate: {
        allowed: false,
        reason: "Charts stay blocked until weights are confirmed.",
      },
      assessments: [
        {
          ...validOutput.assessments[0],
          score: null,
        },
      ],
    });

    expect(parsed.runState).toBe("awaiting-user-weights");
  });
});
