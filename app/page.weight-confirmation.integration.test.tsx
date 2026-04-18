/* @vitest-environment jsdom */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import Home from "./page";
import { clearDraftResumeCheckpoint, loadDraftResumeCheckpoint, saveDraftResumeCheckpoint, windowStorage } from "@/lib/possibility-explorer/draft-resume";
import { cloneDefaultInput, updateDraftQuestion } from "@/lib/possibility-explorer/input-draft";

beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(new Date("2026-04-18T01:00:00.000Z").getTime());
});

afterEach(() => {
  cleanup();
  clearDraftResumeCheckpoint(windowStorage);
  vi.restoreAllMocks();
});

describe("weight-confirmation rendered authority flow", () => {
  it("hides discard-saved controls until a draft has actually been autosaved, then updates the machine-readable saved timestamp on edit", async () => {
    render(<Home />);

    expect(screen.queryByRole("button", { name: /discard saved draft/i })).toBeNull();
    expect(screen.queryByTestId("draft-resume-saved-at")).toBeNull();

    fireEvent.change(screen.getByTestId("question-textarea"), { target: { value: "What should I do after work tonight?" } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /discard saved draft/i })).toBeTruthy();
    });

    const savedAt = screen.getByTestId("draft-resume-saved-at");
    expect(savedAt.getAttribute("datetime")).toBeTruthy();
  });

  it("keeps recommendation and visuals blocked until explicit confirmation, then revokes them after a draft edit", () => {
    const { container } = render(<Home />);

    expect(screen.getByText(/State:/)).toBeTruthy();
    expect(screen.queryByText(/Recommendation:/)).toBeNull();
    expect(screen.queryByText("Visual summary")).toBeNull();

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: /I confirm these weights reflect what matters most right now/i,
      }),
    );

    expect(screen.getByText(/Recommendation:/)).toBeTruthy();
    expect(screen.getAllByText("Visual summary").length).toBeGreaterThan(0);

    fireEvent.change(screen.getAllByRole("slider")[0], { target: { value: "70" } });

    expect(screen.queryByText(/Recommendation:/)).toBeNull();
    expect(screen.queryByText("Visual summary")).toBeNull();
    expect(container.textContent).toContain("awaiting-user-weights");
  });

  it("restores a saved draft on mount and keeps autosave aligned with later edits", async () => {
    const restoredInput = updateDraftQuestion(cloneDefaultInput(), "What should I do with my Saturday morning?");
    restoredInput.weightsConfirmed = true;
    saveDraftResumeCheckpoint(windowStorage, restoredInput, "2026-04-18T00:45:00.000Z");

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("What should I do with my Saturday morning?")).toBeTruthy();
    });

    expect(screen.getByTestId("draft-resume-status").textContent).toMatch(/picked up your saved draft/i);
    expect(screen.getByText(/Recommendation:/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /discard saved draft/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /reset current draft/i })).toBeTruthy();

    fireEvent.change(screen.getByDisplayValue("What should I do with my Saturday morning?"), {
      target: { value: "What should I do with my Saturday afternoon?" },
    });

    expect(screen.queryByText(/Recommendation:/)).toBeNull();

    const saved = loadDraftResumeCheckpoint(windowStorage);
    expect(saved.input?.question).toBe("What should I do with my Saturday afternoon?");
    expect(saved.input?.weightsConfirmed).toBe(false);
  });

  it("distinguishes reset from discard by allowing saved-draft removal while restoring the default example", async () => {
    const restoredInput = updateDraftQuestion(cloneDefaultInput(), "Should I go to the gym or rest?");
    saveDraftResumeCheckpoint(windowStorage, restoredInput, "2026-04-18T00:45:00.000Z");

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Should I go to the gym or rest?")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: /discard saved draft/i }));

    expect(screen.getByDisplayValue("Cook at home")).toBeTruthy();
    expect(screen.getByTestId("draft-resume-status").textContent).toMatch(/cleared the saved draft history/i);
    expect(screen.queryByRole("button", { name: /discard saved draft/i })).toBeNull();
    expect(screen.getByRole("button", { name: /reset current draft/i })).toBeTruthy();
    expect(screen.queryByTestId("draft-resume-saved-at")).toBeNull();
  });

  it("shows relative plus absolute saved time for a restored draft", async () => {
    const restoredInput = updateDraftQuestion(cloneDefaultInput(), "Should I work from home today?");
    saveDraftResumeCheckpoint(windowStorage, restoredInput, "2026-04-18T00:45:00.000Z");

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Should I work from home today?")).toBeTruthy();
    });

    const savedAt = screen.getByTestId("draft-resume-saved-at");
    expect(savedAt.getAttribute("datetime")).toBe("2026-04-18T00:45:00.000Z");
    expect(savedAt.textContent).toMatch(/15m ago/i);
    expect(screen.getByTestId("draft-resume-status").textContent).toMatch(/picked up your saved draft/i);
  });
});
