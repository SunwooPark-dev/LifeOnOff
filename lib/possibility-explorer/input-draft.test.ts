import { describe, expect, it } from "vitest";

import { createDefaultInput } from "@/lib/possibility-explorer/engine";
import { updateDraftOption, updateDraftQuestion } from "@/lib/possibility-explorer/input-draft";

describe("updateDraftQuestion", () => {
  it("clears weight confirmation when the question changes", () => {
    const input = createDefaultInput();
    input.weightsConfirmed = true;

    const next = updateDraftQuestion(input, "What should I cook for dinner tonight if I am tired?");

    expect(next.question).toBe("What should I cook for dinner tonight if I am tired?");
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
