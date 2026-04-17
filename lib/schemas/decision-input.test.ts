import { describe, expect, it } from "vitest";

import { decisionInputSchema, parseDecisionInput } from "@/lib/schemas/decision-input";

const validInput = {
  question: "What should I do for dinner tonight?",
  options: [
    { id: "cook-at-home", label: "Cook at home", details: "Cheap and quick because the ingredients are already here." },
    { id: "go-out", label: "Go out nearby", details: "More variety but costs more and takes longer." },
  ],
  preferredOutcomes: "I want something satisfying that does not wreck my budget.",
  constraints: "I am a little tired and do not want a long commute.",
  criteriaWeights: {
    cost: 50,
    energy: 50,
  },
  weightsConfirmed: false,
} as const;

describe("decisionInputSchema", () => {
  it("accepts a valid input", () => {
    expect(decisionInputSchema.parse(validInput)).toEqual(validInput);
  });

  it("rejects too few or too many options", () => {
    expect(() =>
      decisionInputSchema.parse({
        ...validInput,
        options: [validInput.options[0]],
      }),
    ).toThrow();

    expect(() =>
      decisionInputSchema.parse({
        ...validInput,
        options: Array.from({ length: 6 }, (_, index) => ({
          id: `option-${index + 1}`,
          label: `Option ${index + 1}`,
          details: "detail",
        })),
      }),
    ).toThrow();
  });

  it("trims scalar strings and option fields", () => {
    const parsed = decisionInputSchema.parse({
      ...validInput,
      question: "  What should I do for dinner tonight?  ",
      preferredOutcomes: " I want something satisfying that does not wreck my budget. ",
      constraints: " I am a little tired and do not want a long commute. ",
      options: [
        { id: "cook-at-home", label: " Cook at home ", details: " Cheap and quick. " },
        { id: "go-out", label: " Go out nearby ", details: " More variety. " },
      ],
    });

    expect(parsed).toEqual({
      ...validInput,
      options: [
        { id: "cook-at-home", label: "Cook at home", details: "Cheap and quick." },
        { id: "go-out", label: "Go out nearby", details: "More variety." },
      ],
    });
  });

  it("rejects duplicate option labels after normalization", () => {
    expect(() =>
      decisionInputSchema.parse({
        ...validInput,
        options: [
          { id: "option-a", label: " Stay home ", details: "Short walk." },
          { id: "option-b", label: "stay   home", details: "Short walk." },
        ],
      }),
    ).toThrow(/distinct/i);
  });

  it("rejects duplicate option ids after normalization", () => {
    expect(() =>
      decisionInputSchema.parse({
        ...validInput,
        options: [
          { id: " option-a ", label: "Stay home", details: "Short walk." },
          { id: "option-a", label: "Go out", details: "More variety." },
        ],
      }),
    ).toThrow(/ids/i);
  });

  it("rejects unknown keys", () => {
    expect(() =>
      decisionInputSchema.parse({
        ...validInput,
        extra: true,
      }),
    ).toThrow();
  });

  it("rejects invalid weight values", () => {
    expect(() =>
      decisionInputSchema.parse({
        ...validInput,
        criteriaWeights: {
          cost: -10,
        },
      }),
    ).toThrow();
  });
});

describe("parseDecisionInput", () => {
  it("returns warnings for thin but schema-valid input", () => {
    const result = parseDecisionInput({
      ...validInput,
      question: "Dinner?",
      preferredOutcomes: "",
      constraints: "",
      options: [
        { id: "a", label: "A", details: "" },
        { id: "b", label: "B", details: "" },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.warnings.map((warning) => warning.code).sort()).toEqual([
      "context_is_thin",
      "question_is_thin",
    ]);
  });

  it("returns only context_is_thin when question is already strong enough", () => {
    const result = parseDecisionInput({
      ...validInput,
      preferredOutcomes: "",
      constraints: "",
      options: [
        { id: "cook-at-home", label: "Cook at home", details: "" },
        { id: "go-out", label: "Go out nearby", details: "" },
      ],
    });

    expect(result.success).toBe(true);
    expect(result.warnings).toEqual([
      {
        code: "context_is_thin",
        message: "Context is thin; prefer a downgrade or stronger uncertainty messaging.",
      },
    ]);
  });

  it("returns no warnings on invalid input", () => {
    const result = parseDecisionInput({
      ...validInput,
      options: [
        { id: "a", label: "Same option", details: "" },
        { id: "b", label: " same  option ", details: "" },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.warnings).toEqual([]);
  });
});
