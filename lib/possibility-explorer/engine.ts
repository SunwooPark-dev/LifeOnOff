import type {
  ChoiceOptionInput,
  Criterion,
  OptionAssessment,
  PossibilityExplorerInput,
  PossibilityExplorerResult,
  ProvenanceRef,
  RunState,
  WeightMap,
} from "./types";

const DISALLOWED_KEYWORDS = [
  "suicide",
  "self-harm",
  "kill myself",
  "investment",
  "stock pick",
  "medical",
  "diagnosis",
  "legal",
  "lawsuit",
  "prescription",
];

const CRITERION_LIBRARY = [
  {
    id: "energy",
    label: "Energy fit",
    description: "How realistic the option is given today's energy and effort budget.",
    keywords: ["rest", "exercise", "workout", "tired", "energy", "focus", "burnout"],
  },
  {
    id: "cost",
    label: "Cost / friction",
    description: "How much time, money, or coordination the option consumes.",
    keywords: ["buy", "purchase", "price", "budget", "commute", "route", "time"],
  },
  {
    id: "benefit",
    label: "Expected upside",
    description: "How strongly the option supports the user's stated desired outcome.",
    keywords: ["goal", "important", "benefit", "result", "priority"],
  },
  {
    id: "reversibility",
    label: "Reversibility",
    description: "How easy it is to change course if the option feels wrong later.",
    keywords: ["commit", "later", "tomorrow", "schedule", "cancel"],
  },
] as const;

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

function roundScore(value: number) {
  return Math.round(value * 10) / 10;
}

function normalizeWeights(criteriaIds: string[], weights: WeightMap) {
  const sanitized = criteriaIds.map((id) => Math.max(0, Number(weights[id] ?? 0)));
  const total = sanitized.reduce((sum, value) => sum + value, 0);

  if (total <= 0) {
    const equalWeight = roundScore(100 / criteriaIds.length);
    return criteriaIds.reduce<WeightMap>((acc, id) => {
      acc[id] = equalWeight;
      return acc;
    }, {});
  }

  return criteriaIds.reduce<WeightMap>((acc, id, index) => {
    acc[id] = roundScore((sanitized[index] / total) * 100);
    return acc;
  }, {});
}

function includesAny(source: string, keywords: readonly string[]) {
  return keywords.some((keyword) => source.includes(keyword));
}

function deriveCriteria(question: string, options: ChoiceOptionInput[], outcomes: string, constraints: string) {
  const corpus = `${question} ${outcomes} ${constraints} ${options.map((option) => `${option.label} ${option.details}`).join(" ")}`.toLowerCase();
  const selected = CRITERION_LIBRARY.filter((criterion) => includesAny(corpus, criterion.keywords));
  return selected.slice(0, 4);
}

function buildProvenance(input: PossibilityExplorerInput, criteriaIds: string[]) {
  const refs: ProvenanceRef[] = [
    {
      id: "fact-question",
      kind: "fact",
      label: "User question",
      detail: input.question,
    },
    {
      id: "fact-outcomes",
      kind: input.preferredOutcomes.trim() ? "fact" : "unknown",
      label: "Preferred outcomes",
      detail: input.preferredOutcomes.trim() || "No preferred outcome was provided.",
    },
    {
      id: "fact-constraints",
      kind: input.constraints.trim() ? "fact" : "unknown",
      label: "Constraints",
      detail: input.constraints.trim() || "No explicit constraints were provided.",
    },
  ];

  input.options.forEach((option) => {
    refs.push({
      id: `fact-option-${option.id}`,
      kind: "fact",
      label: option.label,
      detail: option.details || `${option.label} was provided without extra detail.`,
    });
  });

  criteriaIds.forEach((criterionId) => {
    refs.push({
      id: `assumption-${criterionId}`,
      kind: "assumption",
      label: `${criterionId} heuristic`,
      detail: `The score for ${criterionId} uses lightweight heuristics from the written option descriptions rather than external evidence.`,
    });
  });

  refs.push({
    id: "assumption-criteria-gap",
    kind: "assumption",
    label: "Insufficient criteria signal",
    detail: "The comparison stayed structure-only because the input did not surface enough trustworthy criteria for ranking.",
  });

  return refs;
}

function scoreOption(option: ChoiceOptionInput, criterionId: string, input: PossibilityExplorerInput) {
  const text = `${option.label} ${option.details}`.toLowerCase();
  const question = input.question.toLowerCase();
  const outcomes = input.preferredOutcomes.toLowerCase();
  const constraints = input.constraints.toLowerCase();

  switch (criterionId) {
    case "energy":
      if (includesAny(text, ["rest", "short", "light", "home", "walk"])) return 8.2;
      if (includesAny(text, ["gym", "hard", "commute", "travel"])) return 5.8;
      return 6.8;
    case "cost":
      if (includesAny(text, ["free", "home", "leftovers", "nearby"])) return 8.6;
      if (includesAny(text, ["buy", "delivery", "taxi", "subscription"])) return 4.8;
      return 6.4;
    case "benefit":
      if (includesAny(`${text} ${question} ${outcomes}`, ["focus", "goal", "important", "deadline", "healthy"])) return 8.4;
      return 6.7;
    case "reversibility":
      if (includesAny(text, ["later", "pause", "trial", "short"])) return 8.1;
      if (includesAny(`${text} ${constraints}`, ["book", "nonrefundable", "commit", "long"])) return 5.1;
      return 6.5;
    default:
      return 6;
  }
}

function fitBand(score: number) {
  if (score >= 7.5) return "high";
  if (score >= 6) return "medium";
  return "low";
}

function getBlockedState(input: PossibilityExplorerInput): { state: RunState; reason: string } | null {
  const haystack = `${input.question} ${input.preferredOutcomes} ${input.constraints} ${input.options.map((option) => `${option.label} ${option.details}`).join(" ")}`.toLowerCase();

  if (DISALLOWED_KEYWORDS.some((keyword) => haystack.includes(keyword))) {
    return {
      state: "refusal",
      reason: "This MVP is limited to personal daily choices and cannot rank medical, legal, investment, or self-harm-related decisions.",
    };
  }

  if (input.options.length < 2 || input.options.length > 5) {
    return {
      state: "failed_safe",
      reason: "Provide between 2 and 5 options to keep the comparison inside the MVP contract.",
    };
  }

  if (!input.question.trim()) {
    return {
      state: "failed_safe",
      reason: "A concrete question is required before analysis can start.",
    };
  }

  if (input.options.some((option) => !option.label.trim())) {
    return {
      state: "failed_safe",
      reason: "Each option needs a short label.",
    };
  }

  return null;
}

export function buildPossibilityExplorerResult(input: PossibilityExplorerInput): PossibilityExplorerResult {
  const blocked = getBlockedState(input);
  const criteriaBlueprint = deriveCriteria(input.question, input.options, input.preferredOutcomes, input.constraints);
  const criteriaIds = criteriaBlueprint.map((criterion) => criterion.id);
  const normalizedWeights = normalizeWeights(criteriaIds, input.criteriaWeights);
  const provenance = buildProvenance(input, criteriaIds);
  const warnings: string[] = [];
  const nextQuestions: string[] = [];
  const sharedEvidenceRefs = [
    "fact-question",
    ...(input.preferredOutcomes.trim() ? ["fact-outcomes"] : []),
    ...(input.constraints.trim() ? ["fact-constraints"] : []),
  ];

  const criteria: Criterion[] = criteriaBlueprint.map((criterion) => ({
    id: criterion.id,
    label: criterion.label,
    description: criterion.description,
    weight: normalizedWeights[criterion.id],
    weightConfirmed: input.weightsConfirmed,
    evidenceRefs: sharedEvidenceRefs,
    assumptionRefs: [`assumption-${criterion.id}`],
  }));

  if (blocked) {
    return {
      schemaVersion: "v1",
      runState: blocked.state,
      statusTitle: blocked.state === "refusal" ? "Refusal boundary reached" : "Input validation failed",
      summary: blocked.reason,
      recommendationSummary: null,
      whyThisConclusion: blocked.reason,
      whatChangesTheResult: blocked.state === "refusal" ? "Use this tool only for ordinary personal daily choices." : "Fix the blocked input fields and rerun the comparison.",
      whatToDoNow: blocked.state === "refusal" ? "Reframe the question as a non-high-stakes personal choice or consult a qualified professional." : "Adjust the question/options so the run fits the MVP contract.",
      uncertaintyNote: "No ranking was produced.",
      refusalReason: blocked.state === "refusal" ? blocked.reason : null,
      weightsConfirmed: input.weightsConfirmed,
      warnings: [blocked.reason],
      nextQuestions: blocked.state === "refusal" ? ["Can you reframe this as an ordinary personal daily choice?"] : ["Which input field needs clarification before rerunning?"],
      criteria,
      provenance,
      assessments: [],
      visualGate: {
        allowed: false,
        reason: blocked.state === "refusal" ? "Refusal state blocks all chart output." : "Validation failure blocks chart output.",
      },
    };
  }

  if (criteria.length < 2) {
    warnings.push("Not enough signal was found to draft two reliable criteria.");
    nextQuestions.push("What specific tradeoff matters most for this decision?");
    nextQuestions.push("What detail would make the best option clearly better or worse?");

    return {
      schemaVersion: "v1",
      runState: "downgraded",
      statusTitle: "Structure-only downgrade",
      summary: "The question did not provide enough signal to draft at least two reliable criteria.",
      recommendationSummary: null,
      whyThisConclusion: "This MVP only ranks options after it can draft a comparison structure with at least two named criteria.",
      whatChangesTheResult: "Add more detail about the outcome you care about, constraints, or what tradeoffs matter.",
      whatToDoNow: "Clarify the decision and rerun.",
      uncertaintyNote: "Ranking withheld because the comparison structure is too weak.",
      refusalReason: null,
      weightsConfirmed: input.weightsConfirmed,
      warnings,
      nextQuestions,
      criteria,
      provenance,
      assessments: input.options.map((option) => ({
        optionId: option.id,
        score: null,
        fitBand: "medium",
        whyItFits: "The option is recorded, but not enough criteria were available to score it.",
        whatCouldChange: "Provide stronger desired outcomes or constraints.",
        nextStep: "Add details before trying to rank this option.",
        evidenceRefs: [`fact-option-${option.id}`],
        assumptionRefs: ["assumption-criteria-gap"],
      })),
      visualGate: {
        allowed: false,
        reason: "Downgraded runs cannot serialize charts.",
      },
    };
  }

  const assessments: OptionAssessment[] = input.options.map((option) => {
    const weightedScore = criteria.reduce((sum, criterion) => {
      const rawScore = scoreOption(option, criterion.id, input);
      return sum + rawScore * (criterion.weight / 100);
    }, 0);
    const score = roundScore(weightedScore);

    return {
      optionId: option.id,
      score: input.weightsConfirmed ? score : null,
      fitBand: fitBand(score),
      whyItFits: `${option.label} best fits when ${criteria
        .slice(0, 2)
        .map((criterion) => criterion.label.toLowerCase())
        .join(" and ")} matter most.`,
      whatCouldChange: "A different weight mix or stronger evidence could reorder this option.",
      nextStep: "Stress-test this option against one concrete downside before deciding.",
      evidenceRefs: [`fact-option-${option.id}`, "fact-question"],
      assumptionRefs: criteria.map((criterion) => `assumption-${criterion.id}`),
    };
  });

  const ranked = [...assessments].filter((item) => item.score !== null).sort((left, right) => (right.score ?? 0) - (left.score ?? 0));

  if (!input.weightsConfirmed) {
    warnings.push("Weights are still provisional, so final ranking remains blocked.");
    nextQuestions.push("Which criterion matters most right now?");

    return {
      schemaVersion: "v1",
      runState: "awaiting-user-weights",
      statusTitle: "Awaiting weight confirmation",
      summary: "The tool drafted criteria, but it cannot finalize a ranked recommendation until you confirm the active weights.",
      recommendationSummary: null,
      whyThisConclusion: "The contract requires explicit user confirmation of weights before any final ranking can be shown.",
      whatChangesTheResult: "Confirm or adjust the criteria weights below.",
      whatToDoNow: "Review the weights, check the confirmation box, and rerun the analysis.",
      uncertaintyNote: "Ranking may change when weights change.",
      refusalReason: null,
      weightsConfirmed: input.weightsConfirmed,
      warnings,
      nextQuestions,
      criteria,
      provenance,
      assessments,
      visualGate: {
        allowed: false,
        reason: "Charts stay blocked until weights are confirmed.",
      },
    };
  }

  const best = ranked[0];
  const second = ranked[1];
  const bestOption = input.options.find((option) => option.id === best?.optionId);
  const secondOption = input.options.find((option) => option.id === second?.optionId);
  const orderingGap = best && second && best.score !== null && second.score !== null ? roundScore(best.score - second.score) : null;
  const uncertaintyNote =
    orderingGap !== null && orderingGap < 0.8
      ? "Top options are close; ranking may change if assumptions or weights change."
      : "This ranking is still assumption-sensitive because the MVP uses lightweight heuristics rather than external evidence.";
  const questions = orderingGap !== null && orderingGap < 0.8
    ? ["What new evidence would separate the top two options?"]
    : ["Which downside should you stress-test before acting on this recommendation?"];
  const outputWarnings = orderingGap !== null && orderingGap < 0.8
    ? ["Ranking gap is small, so the top options remain close."]
    : [];

  return {
    schemaVersion: "v1",
    runState: "analysis-complete",
    statusTitle: "Analysis complete",
    summary: bestOption ? `${bestOption.label} is the current best-fit choice for this daily decision.` : "Analysis completed without a recommendation.",
    recommendationSummary: bestOption ? `${bestOption.label} leads${secondOption ? ` over ${secondOption.label}` : ""} based on your confirmed weights.` : null,
    whyThisConclusion: bestOption
      ? `${bestOption.label} scores highest across the confirmed criteria, especially on ${criteria
          .slice()
          .sort((left, right) => right.weight - left.weight)
          .slice(0, 2)
          .map((criterion) => criterion.label.toLowerCase())
          .join(" and ")}.`
      : "No final conclusion was available.",
    whatChangesTheResult: "Re-weight the criteria or add stronger option details if a different tradeoff should dominate.",
    whatToDoNow: bestOption ? `Choose ${bestOption.label} if the current tradeoffs feel right, or adjust the weights before acting.` : "Review the option details and try again.",
    uncertaintyNote,
    refusalReason: null,
    weightsConfirmed: input.weightsConfirmed,
    warnings: outputWarnings,
    nextQuestions: questions,
    criteria,
    provenance,
    assessments,
    visualGate: {
      allowed: true,
      reason: "Confirmed weights plus traceable score inputs allow a lightweight visual summary.",
    },
  };
}

export function createDefaultInput(): PossibilityExplorerInput {
  const defaults = deriveCriteria(
    "Which option should I choose today?",
    [
      { id: "option-1", label: "Option A", details: "" },
      { id: "option-2", label: "Option B", details: "" },
    ],
    "",
    "",
  );
  const weights = normalizeWeights(
    defaults.map((criterion) => criterion.id),
    {},
  );

  return {
    question: "What should I do for dinner tonight?",
    options: [
      {
        id: "cook-at-home",
        label: "Cook at home",
        details: "Cheap, familiar, and low effort because ingredients are already in the fridge.",
      },
      {
        id: "go-out",
        label: "Go out nearby",
        details: "More variety and less cleanup, but costs more and requires leaving the house.",
      },
      {
        id: "order-delivery",
        label: "Order delivery",
        details: "Fast and convenient, but expensive and less healthy.",
      },
    ],
    preferredOutcomes: "I want something satisfying that will not drain my time or budget.",
    constraints: "I am a little tired and do not want a long commute.",
    criteriaWeights: weights,
    weightsConfirmed: false,
  };
}

export function createOption(label = "", details = ""): ChoiceOptionInput {
  return {
    id: slugify(label || `option-${Math.random().toString(36).slice(2, 8)}`),
    label,
    details,
  };
}
