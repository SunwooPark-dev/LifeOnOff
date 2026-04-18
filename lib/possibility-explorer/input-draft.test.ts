import { describe, expect, it } from "vitest";

import { createDefaultInput } from "@/lib/possibility-explorer/engine";
import {
  addDraftOption,
  cloneDefaultInput,
  removeDraftOption,
  setDraftWeightsConfirmed,
  updateDraftConstraints,
  updateDraftOption,
  updateDraftPreferredOutcomes,
  updateDraftQuestion,
  updateDraftWeight,
} from "@/lib/possibility-explorer/input-draft";

describe("updateDraftQuestion", () => {
  it("clears weight confirmation when the question changes", () => {
    const input = createDefaultInput();
    input.weightsConfirmed = true;

    const next = updateDraftQuestion(input, "What should I cook for dinner tonight if I am tired?");

    expect(next.question).toBe("What should I cook for dinner tonight if I am tired?");
    expect(next.weightsConfirmed).toBe(false);
  });
});

describe("updateDraftPreferredOutcomes", () => {
  it("clears weight confirmation when preferred outcomes change", () => {
    const input = createDefaultInput();
    input.weightsConfirmed = true;

    const next = updateDraftPreferredOutcomes(input, "Save money and avoid a long commute.");

    expect(next.preferredOutcomes).toBe("Save money and avoid a long commute.");
    expect(next.weightsConfirmed).toBe(false);
  });
});

describe("updateDraftConstraints", () => {
  it("clears weight confirmation when constraints change", () => {
    const input = createDefaultInput();
    input.weightsConfirmed = true;

    const next = updateDraftConstraints(input, "Need to be home by 7 PM.");

    expect(next.constraints).toBe("Need to be home by 7 PM.");
    expect(next.weightsConfirmed).toBe(false);
  });
});

describe("updateDraftOption", () => {
  it("clears weight confirmation when an option label changes", () => {
    const input = createDefaultInput();
    input.weightsConfirmed = true;

    const next = updateDraftOption(input, 0, "label", "Cook at home tonight");

    expect(next.options[0].label).toBe("Cook at home tonight");
    expect(next.options[0].id).toBe("cook-at-home-tonight");
    expect(next.weightsConfirmed).toBe(false);
  });

  it("clears weight confirmation when option details change without mutating the option id", () => {
    const input = createDefaultInput();
    input.weightsConfirmed = true;

    const next = updateDraftOption(input, 0, "details", "Cheap, quick, and uses what is already in the fridge.");

    expect(next.options[0].details).toBe("Cheap, quick, and uses what is already in the fridge.");
    expect(next.options[0].id).toBe(input.options[0].id);
    expect(next.weightsConfirmed).toBe(false);
  });
});

describe("addDraftOption", () => {
  it("appends a blank option and clears weight confirmation when below the limit", () => {
    const input = createDefaultInput();
    input.weightsConfirmed = true;

    const next = addDraftOption(input);

    expect(next.options).toHaveLength(input.options.length + 1);
    expect(next.options.at(-1)).toEqual({
      id: `option-${input.options.length + 1}`,
      label: "",
      details: "",
    });
    expect(next.weightsConfirmed).toBe(false);
  });

  it("skips reused generated ids after an option has been removed", () => {
    const input = createDefaultInput();
    input.options = [
      { id: "option-1", label: "One", details: "" },
      { id: "option-3", label: "Three", details: "" },
    ];
    input.weightsConfirmed = true;

    const next = addDraftOption(input);

    expect(next.options.at(-1)).toEqual({
      id: "option-4",
      label: "",
      details: "",
    });
    expect(next.weightsConfirmed).toBe(false);
  });

  it("returns the same input when already at the maximum option count", () => {
    const input = createDefaultInput();
    input.options = [
      { id: "one", label: "One", details: "" },
      { id: "two", label: "Two", details: "" },
      { id: "three", label: "Three", details: "" },
      { id: "four", label: "Four", details: "" },
      { id: "five", label: "Five", details: "" },
    ];

    expect(addDraftOption(input)).toBe(input);
  });
});

describe("removeDraftOption", () => {
  it("removes the selected option and clears weight confirmation when above the minimum", () => {
    const input = createDefaultInput();
    input.options = [
      { id: "delivery", label: "Delivery", details: "" },
      { id: "cook", label: "Cook", details: "" },
      { id: "leftovers", label: "Leftovers", details: "" },
    ];
    input.weightsConfirmed = true;

    const next = removeDraftOption(input, 1);

    expect(next.options.map((option) => option.id)).toEqual(["delivery", "leftovers"]);
    expect(next.weightsConfirmed).toBe(false);
  });

  it("returns the same input when already at the minimum option count", () => {
    const input = createDefaultInput();
    input.options = [
      { id: "cook", label: "Cook", details: "" },
      { id: "go-out", label: "Go out", details: "" },
    ];
    input.weightsConfirmed = true;

    expect(removeDraftOption(input, 0)).toBe(input);
  });
});

describe("updateDraftWeight", () => {
  it("updates the selected weight and clears weight confirmation", () => {
    const input = createDefaultInput();
    input.weightsConfirmed = true;

    const next = updateDraftWeight(input, "cost", 65);

    expect(next.criteriaWeights.cost).toBe(65);
    expect(next.weightsConfirmed).toBe(false);
  });
});

describe("setDraftWeightsConfirmed", () => {
  it("toggles weight confirmation without mutating any other draft state", () => {
    const input = createDefaultInput();

    const next = setDraftWeightsConfirmed(input, true);

    expect(next.weightsConfirmed).toBe(true);
    expect(next.question).toBe(input.question);
    expect(next.options).toEqual(input.options);
  });
});

describe("cloneDefaultInput", () => {
  it("returns a deep-cloned default input so reset state does not share nested references", () => {
    const next = cloneDefaultInput();

    next.options[0].label = "Changed";
    next.criteriaWeights.cost = 100;

    const fresh = cloneDefaultInput();

    expect(fresh.options[0].label).toBe("Cook at home");
    expect(fresh.criteriaWeights.cost).not.toBe(100);
  });
});
