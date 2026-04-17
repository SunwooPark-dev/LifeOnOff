import { describe, expect, it } from "vitest";

import { simulationOutputSchema } from "@/lib/schemas/simulation-output";

const validOutput = {
  optionA: {
    summary: "Higher stability, lower flexibility.",
    assumptions: ["Salary meets current living costs"],
    nearTerm: ["Routine becomes more structured"],
    midTerm: ["Learning and income become more predictable"],
    longTerm: ["Career path may become clearer but less flexible"],
    upside: ["Predictable income", "Professional structure"],
    downside: ["Reduced autonomy"],
    hiddenCosts: ["Harder to reverse if the role is a poor fit"],
    reversibility: "medium",
    regretRisk: "medium",
    confidenceNotes: ["More information about the role would improve confidence"],
    questionsToValidate: ["What is the expected workload after month 3?"],
  },
  optionB: {
    summary: "Higher flexibility, less predictable income.",
    assumptions: ["Freelance pipeline remains active"],
    nearTerm: ["Autonomy remains high"],
    midTerm: ["Income volatility may continue"],
    longTerm: ["Optionality stays open but stability may lag"],
    upside: ["Schedule control", "Path flexibility"],
    downside: ["Revenue uncertainty"],
    hiddenCosts: ["Decision fatigue and self-management overhead"],
    reversibility: "easy",
    regretRisk: "medium",
    confidenceNotes: ["Client pipeline quality is still uncertain"],
    questionsToValidate: ["What does my real 3-month pipeline look like?"],
  },
  comparison: {
    biggestTradeoff: "Stability versus autonomy",
    asymmetricRisk: "Option B has more income volatility risk",
    likelyAdvantageA: "More predictable finances",
    likelyAdvantageB: "More flexibility and optionality",
    suggestedNextStep: "Validate salary realism and freelance pipeline before deciding",
  },
  warnings: [],
} as const;

describe("simulationOutputSchema", () => {
  it("accepts a canonical valid simulation output", () => {
    expect(simulationOutputSchema.parse(validOutput)).toEqual(validOutput);
  });

  it("trims nested strings and defaults warnings to an empty list", () => {
    const parsed = simulationOutputSchema.parse({
      ...validOutput,
      optionA: {
        ...validOutput.optionA,
        summary: "  Higher stability, lower flexibility.  ",
        assumptions: [" Salary meets current living costs "],
      },
      comparison: {
        ...validOutput.comparison,
        suggestedNextStep: "  Validate salary realism and freelance pipeline before deciding  ",
      },
      warnings: undefined,
    });

    expect(parsed.optionA.summary).toBe("Higher stability, lower flexibility.");
    expect(parsed.optionA.assumptions).toEqual(["Salary meets current living costs"]);
    expect(parsed.comparison.suggestedNextStep).toBe(
      "Validate salary realism and freelance pipeline before deciding",
    );
    expect(parsed.warnings).toEqual([]);
  });

  it("requires the full top-level shape", () => {
    const missingComparison = {
      ...validOutput,
      comparison: undefined,
    };

    expect(() => simulationOutputSchema.parse(missingComparison)).toThrow();
  });

  it("rejects invalid enums", () => {
    expect(() =>
      simulationOutputSchema.parse({
        ...validOutput,
        optionA: {
          ...validOutput.optionA,
          reversibility: "low",
        },
      }),
    ).toThrow();

    expect(() =>
      simulationOutputSchema.parse({
        ...validOutput,
        optionB: {
          ...validOutput.optionB,
          regretRisk: "easy",
        },
      }),
    ).toThrow();
  });

  it("rejects blank required strings and blank list items", () => {
    expect(() =>
      simulationOutputSchema.parse({
        ...validOutput,
        comparison: {
          ...validOutput.comparison,
          biggestTradeoff: "   ",
        },
      }),
    ).toThrow();

    expect(() =>
      simulationOutputSchema.parse({
        ...validOutput,
        optionA: {
          ...validOutput.optionA,
          upside: ["   "],
        },
      }),
    ).toThrow();
  });

  it("rejects oversized scenario arrays and warning payload fields", () => {
    expect(() =>
      simulationOutputSchema.parse({
        ...validOutput,
        optionA: {
          ...validOutput.optionA,
          assumptions: Array.from({ length: 11 }, (_, index) => `assumption-${index}`),
        },
      }),
    ).toThrow();

    expect(() =>
      simulationOutputSchema.parse({
        ...validOutput,
        warnings: [
          {
            code: "x".repeat(101),
            message: "Too long warning code",
          },
        ],
      }),
    ).toThrow();
  });

  it("requires likely advantages plus uncertainty details for each option", () => {
    expect(() =>
      simulationOutputSchema.parse({
        ...validOutput,
        optionA: {
          ...validOutput.optionA,
          confidenceNotes: [],
        },
      }),
    ).toThrow();

    expect(() =>
      simulationOutputSchema.parse({
        ...validOutput,
        comparison: {
          biggestTradeoff: validOutput.comparison.biggestTradeoff,
          asymmetricRisk: validOutput.comparison.asymmetricRisk,
          suggestedNextStep: validOutput.comparison.suggestedNextStep,
        },
      }),
    ).toThrow();
  });

  it("accepts warning metadata when present", () => {
    const parsed = simulationOutputSchema.parse({
      ...validOutput,
      warnings: [
        {
          code: "thin_context",
          message: "User context is thin, so conclusions should be treated cautiously.",
        },
      ],
    });

    expect(parsed.warnings).toHaveLength(1);
  });
});
