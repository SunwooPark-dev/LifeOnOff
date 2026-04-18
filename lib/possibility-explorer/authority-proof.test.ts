import { describe, expect, it } from "vitest";

import {
  buildAuthorityProofView,
  getVisibleVisualOptionIds,
} from "@/lib/possibility-explorer/authority-proof";
import { createDefaultInput } from "@/lib/possibility-explorer/engine";
import {
  setDraftWeightsConfirmed,
  updateDraftWeight,
} from "@/lib/possibility-explorer/input-draft";

describe("buildAuthorityProofView", () => {
  it("keeps recommendation and visuals blocked before weight confirmation", () => {
    const input = createDefaultInput();

    const view = buildAuthorityProofView(input);

    expect(view.runState).toBe("awaiting-user-weights");
    expect(view.recommendationVisible).toBe(false);
    expect(view.visibleVisualOptionIds).toEqual([]);
  });

  it("shows recommendation and visuals after explicit weight confirmation", () => {
    const input = setDraftWeightsConfirmed(createDefaultInput(), true);

    const view = buildAuthorityProofView(input);

    expect(view.runState).toBe("analysis-complete");
    expect(view.recommendationVisible).toBe(true);
    expect(view.visibleVisualOptionIds.length).toBeGreaterThan(0);
  });

  it("re-blocks recommendation and visuals after a confirmed draft edit", () => {
    const confirmed = setDraftWeightsConfirmed(createDefaultInput(), true);
    const edited = updateDraftWeight(confirmed, "cost", 70);

    const view = buildAuthorityProofView(edited);

    expect(view.runState).toBe("awaiting-user-weights");
    expect(view.recommendationVisible).toBe(false);
    expect(view.visibleVisualOptionIds).toEqual([]);
  });
});

describe("getVisibleVisualOptionIds", () => {
  it("returns only visual-eligible option ids from a completed analysis", () => {
    const input = setDraftWeightsConfirmed(createDefaultInput(), true);
    const view = buildAuthorityProofView(input);

    expect(getVisibleVisualOptionIds(view.workspace.result)).toEqual(
      view.workspace.result.assessments.map((assessment) => assessment.optionId),
    );
  });
});
