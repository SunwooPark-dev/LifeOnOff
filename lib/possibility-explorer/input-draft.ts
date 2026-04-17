import type { ChoiceOptionInput, PossibilityExplorerInput } from "./types";

function slugifyOptionLabel(label: string, fallbackId: string) {
  const slug = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

  return slug || fallbackId;
}

export function updateDraftQuestion(input: PossibilityExplorerInput, question: string): PossibilityExplorerInput {
  return {
    ...input,
    question,
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
