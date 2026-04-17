import { z } from "zod";

const TIME_HORIZONS = ["30d", "6m", "2y"] as const;

const collapseWhitespace = (value: string) => value.trim().replace(/\s+/g, " ");

const normalizedString = (max: number) =>
  z.string().transform(collapseWhitespace).pipe(z.string().min(1).max(max));

const normalizedListItem = (max: number) => z.string().transform(collapseWhitespace).pipe(z.string().max(max));

const normalizedList = (maxItems: number, itemMax: number) =>
  z
    .array(z.string())
    .transform((items) => items.map((item) => collapseWhitespace(item)).filter(Boolean))
    .pipe(z.array(normalizedListItem(itemMax)).max(maxItems));

export const decisionInputSchema = z
  .object({
    title: normalizedString(120),
    optionA: normalizedString(200),
    optionB: normalizedString(200),
    context: z.string().transform((value) => value.trim()).pipe(z.string().max(2000)),
    constraints: normalizedList(20, 200),
    priorities: normalizedList(20, 100),
    timeHorizon: z.enum(TIME_HORIZONS),
  })
  .strict()
  .superRefine((value, ctx) => {
    const normalizedA = collapseWhitespace(value.optionA).toLowerCase();
    const normalizedB = collapseWhitespace(value.optionB).toLowerCase();

    if (normalizedA === normalizedB) {
      ctx.addIssue({
        code: "custom",
        path: ["optionB"],
        message: "optionA and optionB must be distinct after normalization.",
      });
    }
  });

export type DecisionInput = z.infer<typeof decisionInputSchema>;
export type DecisionInputWarningCode = "context_too_short" | "input_is_thin";
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
  const { context, constraints, priorities } = result.data;

  if (context.trim().length > 0 && context.trim().length < 20) {
    warnings.push({
      code: "context_too_short",
      message: "Context is too short to support strong conclusions.",
    });
  }

  if (context.trim().length < 40 || constraints.length + priorities.length < 2) {
    warnings.push({
      code: "input_is_thin",
      message: "Input is thin; output should emphasize uncertainty and validation questions.",
    });
  }

  return {
    success: true,
    data: result.data,
    warnings,
  };
}
