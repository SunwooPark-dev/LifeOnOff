import { z } from "zod";

const normalizedNonEmptyString = (max: number) =>
  z.string().transform((value) => value.trim()).pipe(z.string().min(1).max(max));

const normalizedStringArray = (maxItems: number, itemMax: number) =>
  z.array(normalizedNonEmptyString(itemMax)).min(1).max(maxItems);

export const simulationWarningSchema = z
  .object({
    code: normalizedNonEmptyString(100),
    message: normalizedNonEmptyString(400),
  })
  .strict();

export const scenarioSchema = z
  .object({
    summary: normalizedNonEmptyString(400),
    assumptions: normalizedStringArray(10, 200),
    nearTerm: normalizedStringArray(10, 200),
    midTerm: normalizedStringArray(10, 200),
    longTerm: normalizedStringArray(10, 200),
    upside: normalizedStringArray(10, 200),
    downside: normalizedStringArray(10, 200),
    hiddenCosts: normalizedStringArray(10, 200),
    reversibility: z.enum(["easy", "medium", "hard"]),
    regretRisk: z.enum(["low", "medium", "high"]),
    confidenceNotes: normalizedStringArray(10, 200),
    questionsToValidate: normalizedStringArray(10, 200),
  })
  .strict();

export const comparisonSchema = z
  .object({
    biggestTradeoff: normalizedNonEmptyString(300),
    asymmetricRisk: normalizedNonEmptyString(300),
    likelyAdvantageA: normalizedNonEmptyString(200),
    likelyAdvantageB: normalizedNonEmptyString(200),
    suggestedNextStep: normalizedNonEmptyString(300),
  })
  .strict();

export const simulationOutputSchema = z
  .object({
    optionA: scenarioSchema,
    optionB: scenarioSchema,
    comparison: comparisonSchema,
    warnings: z.array(simulationWarningSchema).default([]),
  })
  .strict();

export type SimulationWarning = z.infer<typeof simulationWarningSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type SimulationComparison = z.infer<typeof comparisonSchema>;
export type SimulationOutput = z.infer<typeof simulationOutputSchema>;
