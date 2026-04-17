import { z } from "zod";

const collapseWhitespace = (value: string) => value.trim().replace(/\s+/g, " ");

const normalizedString = (max: number, min = 1) =>
  z.string().transform(collapseWhitespace).pipe(z.string().min(min).max(max));

const normalizedOptionalString = (max: number) =>
  z.string().transform((value) => value.trim()).pipe(z.string().max(max));

const optionSchema = z
  .object({
    id: normalizedString(40),
    label: normalizedString(120),
    details: normalizedOptionalString(500),
  })
  .strict();

const normalizedWeightsSchema = z.record(z.string(), z.number().finite().min(0).max(100));

export const decisionInputSchema = z
  .object({
    question: normalizedString(400),
    options: z.array(optionSchema).min(2).max(5),
    preferredOutcomes: normalizedOptionalString(600),
    constraints: normalizedOptionalString(600),
    criteriaWeights: normalizedWeightsSchema,
    weightsConfirmed: z.boolean(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const normalizedLabels = value.options.map((option) => collapseWhitespace(option.label).toLowerCase());
    const normalizedIds = value.options.map((option) => collapseWhitespace(option.id).toLowerCase());

    if (new Set(normalizedLabels).size !== normalizedLabels.length) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Options must remain distinct after normalization.",
      });
    }

    if (new Set(normalizedIds).size !== normalizedIds.length) {
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Option ids must remain distinct after normalization.",
      });
    }
  });

export type DecisionInput = z.infer<typeof decisionInputSchema>;

export type DecisionInputWarningCode = "question_is_thin" | "context_is_thin";
export type DecisionInputWarning = {
  code: DecisionInputWarningCode;
  message: string;
};

export type DecisionInputParseResult =
  | {
      success: true;
      data: DecisionInput;
      warnings: DecisionInputWarning[];
    }
  | {
      success: false;
      error: z.ZodError<DecisionInput>;
      warnings: [];
    };

export function parseDecisionInput(input: unknown): DecisionInputParseResult {
  const result = decisionInputSchema.safeParse(input);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      warnings: [],
    };
  }

  const warnings: DecisionInputWarning[] = [];
  const { question, preferredOutcomes, constraints, options } = result.data;
  const totalDetailLength = options.reduce((sum, option) => sum + option.details.trim().length, 0);

  if (question.length < 20) {
    warnings.push({
      code: "question_is_thin",
      message: "The decision question is too thin to support a strong ranking.",
    });
  }

  if (preferredOutcomes.trim().length + constraints.trim().length + totalDetailLength < 80) {
    warnings.push({
      code: "context_is_thin",
      message: "Context is thin; prefer a downgrade or stronger uncertainty messaging.",
    });
  }

  return {
    success: true,
    data: result.data,
    warnings,
  };
}
