import { z } from "zod";

const normalizedNonEmptyString = (max: number) =>
  z.string().transform((value) => value.trim()).pipe(z.string().min(1).max(max));

const normalizedOptionalString = (max: number) =>
  z.string().transform((value) => value.trim()).pipe(z.string().max(max));

const provenanceKindSchema = z.enum(["fact", "inference", "assumption", "unknown"]);
const runStateSchema = z.enum([
  "draft",
  "validating-inputs",
  "awaiting-user-weights",
  "analysis-complete",
  "qualitative_only",
  "downgraded",
  "failed_safe",
  "refusal",
]);

const provenanceRefSchema = z
  .object({
    id: normalizedNonEmptyString(120),
    kind: provenanceKindSchema,
    label: normalizedNonEmptyString(200),
    detail: normalizedNonEmptyString(600),
  })
  .strict();

const criterionSchema = z
  .object({
    id: normalizedNonEmptyString(60),
    label: normalizedNonEmptyString(120),
    description: normalizedNonEmptyString(300),
    weight: z.number().finite().min(0).max(100),
    weightConfirmed: z.boolean(),
    evidenceRefs: z.array(normalizedNonEmptyString(120)).min(1).max(10),
    assumptionRefs: z.array(normalizedNonEmptyString(120)).min(1).max(10),
  })
  .strict();

const optionAssessmentSchema = z
  .object({
    optionId: normalizedNonEmptyString(60),
    score: z.number().finite().min(0).max(10).nullable(),
    fitBand: z.enum(["high", "medium", "low"]),
    whyItFits: normalizedNonEmptyString(400),
    whatCouldChange: normalizedNonEmptyString(300),
    nextStep: normalizedNonEmptyString(300),
    evidenceRefs: z.array(normalizedNonEmptyString(120)).min(1).max(10),
    assumptionRefs: z.array(normalizedNonEmptyString(120)).min(1).max(10),
  })
  .strict();

export const simulationOutputSchema = z
  .object({
    schemaVersion: z.literal("v1"),
    runState: runStateSchema,
    statusTitle: normalizedNonEmptyString(200),
    summary: normalizedNonEmptyString(500),
    recommendationSummary: normalizedOptionalString(400).nullable(),
    whyThisConclusion: normalizedNonEmptyString(500),
    whatChangesTheResult: normalizedNonEmptyString(500),
    whatToDoNow: normalizedNonEmptyString(500),
    uncertaintyNote: normalizedNonEmptyString(500),
    refusalReason: normalizedOptionalString(500).nullable(),
    weightsConfirmed: z.boolean(),
    warnings: z.array(normalizedNonEmptyString(300)).max(10),
    nextQuestions: z.array(normalizedNonEmptyString(300)).max(10),
    criteria: z.array(criterionSchema).max(6),
    provenance: z.array(provenanceRefSchema).min(1).max(40),
    assessments: z.array(optionAssessmentSchema).max(5),
    visualGate: z
      .object({
        allowed: z.boolean(),
        reason: normalizedNonEmptyString(300),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const blockedStates = new Set(["awaiting-user-weights", "qualitative_only", "downgraded", "failed_safe", "refusal"]);
    const hasNumericScores = value.assessments.some((assessment) => assessment.score !== null);
    const provenanceMap = new Map(value.provenance.map((entry) => [entry.id, entry.kind] as const));
    const checkRefs = (refs: string[], path: (string | number)[], allowedKinds: ReadonlySet<string>) => {
      refs.forEach((ref, index) => {
        const kind = provenanceMap.get(ref);
        if (!kind) {
          ctx.addIssue({
            code: "custom",
            path: [...path, index],
            message: `Reference '${ref}' does not exist in provenance.`,
          });
          return;
        }

        if (!allowedKinds.has(kind)) {
          ctx.addIssue({
            code: "custom",
            path: [...path, index],
            message: `Reference '${ref}' has invalid provenance kind '${kind}'.`,
          });
        }
      });
    };

    if (blockedStates.has(value.runState)) {
      if (value.recommendationSummary !== null) {
        ctx.addIssue({
          code: "custom",
          path: ["recommendationSummary"],
          message: "Blocked states must not emit a final recommendation summary.",
        });
      }

      if (value.visualGate.allowed) {
        ctx.addIssue({
          code: "custom",
          path: ["visualGate", "allowed"],
          message: "Blocked states must keep the visual gate closed.",
        });
      }
    }

    if (value.runState === "analysis-complete") {
      if (!value.weightsConfirmed) {
        ctx.addIssue({
          code: "custom",
          path: ["weightsConfirmed"],
          message: "Completed analysis requires confirmed weights.",
        });
      }

      if (value.recommendationSummary === null) {
        ctx.addIssue({
          code: "custom",
          path: ["recommendationSummary"],
          message: "Completed analysis must provide a recommendation summary.",
        });
      }

      if (!value.visualGate.allowed) {
        ctx.addIssue({
          code: "custom",
          path: ["visualGate", "allowed"],
          message: "Completed analysis should keep the visual gate open.",
        });
      }
    }

    if (!value.weightsConfirmed && hasNumericScores) {
      ctx.addIssue({
        code: "custom",
        path: ["assessments"],
        message: "Numeric scores must stay null until weights are confirmed.",
      });
    }

    value.criteria.forEach((criterion, index) => {
      checkRefs(criterion.evidenceRefs, ["criteria", index, "evidenceRefs"], new Set(["fact", "inference"]));
      checkRefs(criterion.assumptionRefs, ["criteria", index, "assumptionRefs"], new Set(["assumption", "unknown"]));
    });

    value.assessments.forEach((assessment, index) => {
      checkRefs(assessment.evidenceRefs, ["assessments", index, "evidenceRefs"], new Set(["fact", "inference"]));
      checkRefs(assessment.assumptionRefs, ["assessments", index, "assumptionRefs"], new Set(["assumption", "unknown"]));
    });
  });

export type SimulationOutput = z.infer<typeof simulationOutputSchema>;
