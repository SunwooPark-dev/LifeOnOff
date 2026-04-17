import { describe, expect, it } from "vitest";

import { decisionInputSchema, parseDecisionInput } from "@/lib/schemas/decision-input";

const validInput = {
  title: "Should I take job A or stay freelance?",
  optionA: "Accept the full-time role",
  optionB: "Continue freelancing",
  context: "I value income stability but also flexibility.",
  constraints: ["Need enough income to cover rent", "Cannot relocate this year"],
  priorities: ["financial stability", "flexibility", "career growth"],
  timeHorizon: "6m",
} as const;

describe("decisionInputSchema", () => {
  it("accepts a valid input", () => {
    expect(decisionInputSchema.parse(validInput)).toEqual(validInput);
  });

  it("rejects overlong titles, options, and oversized lists", () => {
    expect(() =>
      decisionInputSchema.parse({
        ...validInput,
        title: "x".repeat(121),
      }),
    ).toThrow();

    expect(() =>
      decisionInputSchema.parse({
        ...validInput,
        optionA: "x".repeat(201),
      }),
    ).toThrow();

    expect(() =>
      decisionInputSchema.parse({
        ...validInput,
        constraints: Array.from({ length: 21 }, (_, index) => `constraint-${index}`),
      }),
    ).toThrow();

    expect(() =>
      decisionInputSchema.parse({
        ...validInput,
        priorities: Array.from({ length: 21 }, (_, index) => `priority-${index}`),
      }),
    ).toThrow();
  });

  it("trims scalar strings and removes blank list items", () => {
    const parsed = decisionInputSchema.parse({
      ...validInput,
      title: "  Should I take job A or stay freelance?  ",
      optionA: " Accept the full-time role ",
      optionB: " Continue freelancing ",
      context: " I value income stability but also flexibility. ",
      constraints: [" Need enough income to cover rent ", "   ", " Cannot relocate this year "],
      priorities: [" financial stability ", "", " flexibility "],
    });

    expect(parsed).toEqual({
      ...validInput,
      priorities: ["financial stability", "flexibility"],
    });
  });

  it("rejects identical options after normalization", () => {
    expect(() =>
      decisionInputSchema.parse({
        ...validInput,
        optionA: " Stay   freelance ",
        optionB: "stay freelance",
      }),
    ).toThrow(/distinct/i);
  });

  it("rejects unknown keys", () => {
    expect(() =>
      decisionInputSchema.parse({
        ...validInput,
        extra: true,
      }),
    ).toThrow();
  });

  it("rejects invalid timeHorizon", () => {
    expect(() =>
      decisionInputSchema.parse({
        ...validInput,
        timeHorizon: "1y",
      }),
    ).toThrow();
  });
});

describe("parseDecisionInput", () => {
  it("returns warnings for weak but schema-valid input", () => {
    const result = parseDecisionInput({
      ...validInput,
      context: "Not sure.",
      constraints: [],
      priorities: [],
    });

    expect(result.success).toBe(true);
    expect(result.warnings.map((warning) => warning.code).sort()).toEqual([
      "context_too_short",
      "input_is_thin",
    ]);
  });

  it("returns only input_is_thin when context is blank but structurally valid", () => {
    const result = parseDecisionInput({
      ...validInput,
      context: "   ",
      constraints: ["Need enough income to cover rent"],
      priorities: ["financial stability"],
    });

    expect(result.success).toBe(true);
    expect(result.warnings).toEqual([
      {
        code: "input_is_thin",
        message: "Input is thin; output should emphasize uncertainty and validation questions.",
      },
    ]);
  });

  it("returns no warnings on invalid input", () => {
    const result = parseDecisionInput({
      ...validInput,
      optionA: "Continue freelancing",
      optionB: " continue freelancing ",
    });

    expect(result.success).toBe(false);
    expect(result.warnings).toEqual([]);
  });
});
