import { createDefaultInput } from "./engine";
import type { ChoiceOptionInput, PossibilityExplorerInput } from "./types";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 5;

function slugifyOptionLabel(label: string, fallbackId: string) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

  return slug || fallbackId;
}

function nextGeneratedOptionId(options: ChoiceOptionInput[]) {
  const ids = new Set(options.map((option) => option.id));
  let nextIndex = options.length + 1;

  while (ids.has(`option-${nextIndex}`)) {
    nextIndex += 1;
  }

  return `option-${nextIndex}`;
}

export function cloneDefaultInput(): PossibilityExplorerInput {
  const defaults = createDefaultInput();
  return {
    ...defaults,
    criteriaWeights: { ...defaults.criteriaWeights },
    options: defaults.options.map((option) => ({ ...option })),
  };
}

export function updateDraftQuestion(input: PossibilityExplorerInput, question: string): PossibilityExplorerInput {
  return {
    ...input,
    question,
    weightsConfirmed: false,
  };
}

export function updateDraftPreferredOutcomes(input: PossibilityExplorerInput, preferredOutcomes: string): PossibilityExplorerInput {
  return {
    ...input,
    preferredOutcomes,
    weightsConfirmed: false,
  };
}

export function updateDraftConstraints(input: PossibilityExplorerInput, constraints: string): PossibilityExplorerInput {
  return {
    ...input,
    constraints,
    weightsConfirmed: false,
  };
}

export function updateDraftOption(
  input: PossibilityExplorerInput,
  index: number,
  key: "label" | "details",
  value: string,
): PossibilityExplorerInput {
  const options = input.options.map((option, optionIndex): ChoiceOptionInput =>
    optionIndex === index
      ? {
          ...option,
          id: key === "label" && value.trim() ? slugifyOptionLabel(value, option.id) : option.id,
          [key]: value,
        }
      : option,
  );

  return {
    ...input,
    options,
    weightsConfirmed: false,
  };
}

export function addDraftOption(input: PossibilityExplorerInput): PossibilityExplorerInput {
  if (input.options.length >= MAX_OPTIONS) {
    return input;
  }

  return {
    ...input,
    options: [...input.options, { id: nextGeneratedOptionId(input.options), label: "", details: "" }],
    weightsConfirmed: false,
  };
}

export function removeDraftOption(input: PossibilityExplorerInput, index: number): PossibilityExplorerInput {
  if (input.options.length <= MIN_OPTIONS) {
    return input;
  }

  return {
    ...input,
    options: input.options.filter((_, optionIndex) => optionIndex !== index),
    weightsConfirmed: false,
  };
}

export function updateDraftWeight(input: PossibilityExplorerInput, criterionId: string, value: number): PossibilityExplorerInput {
  return {
    ...input,
    criteriaWeights: { ...input.criteriaWeights, [criterionId]: value },
    weightsConfirmed: false,
  };
}

export function setDraftWeightsConfirmed(input: PossibilityExplorerInput, weightsConfirmed: boolean): PossibilityExplorerInput {
  return {
    ...input,
    weightsConfirmed,
  };
}
