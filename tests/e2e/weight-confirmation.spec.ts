import { expect, test } from "@playwright/test";

test("blocks recommendation and visual summaries until weight confirmation", async ({ page }) => {
  await page.goto("/");

  const weightConfirmation = page.getByTestId("weights-confirmation-checkbox");
  const recommendation = page.getByTestId("recommendation-summary");
  const workspaceState = page.getByTestId("workspace-state");
  const statusTitle = page.getByTestId("status-title");
  const energySlider = page.getByTestId("weight-slider-energy");
  const visualSummaries = page.locator('[data-testid^="visual-summary-"]');

  await expect(statusTitle).toHaveText("Awaiting weight confirmation");
  await expect(weightConfirmation).not.toBeChecked();
  await expect(workspaceState).toContainText("awaiting-user-weights");
  await expect(workspaceState).toContainText("blocked");
  await expect(recommendation).toHaveCount(0);
  await expect(visualSummaries).toHaveCount(0);

  await weightConfirmation.check();

  await expect(statusTitle).toHaveText("Analysis complete");
  await expect(workspaceState).toContainText("analysis-complete");
  await expect(workspaceState).toContainText("open");
  await expect(recommendation).toBeVisible();
  await expect(visualSummaries.first()).toBeVisible();

  await energySlider.focus();
  await energySlider.press("ArrowRight");

  await expect(weightConfirmation).not.toBeChecked();
  await expect(statusTitle).toHaveText("Awaiting weight confirmation");
  await expect(workspaceState).toContainText("awaiting-user-weights");
  await expect(workspaceState).toContainText("blocked");
  await expect(recommendation).toHaveCount(0);
  await expect(visualSummaries).toHaveCount(0);
});
