import { normalizeInput } from '../core/normalize.js';
import { simulateLifePaths } from '../core/simulator.js';
import { buildReport, createMergedMarkdown } from '../core/report.js';
import { saveRun, loadRuns } from '../core/storage.js';
import { validateSimulationInput } from '../core/validation.js';

export function runSimulationFlow(rawInput) {
  validateSimulationInput(rawInput);
  const normalized = normalizeInput(rawInput);
  const simulation = simulateLifePaths(normalized);
  const report = buildReport(normalized, simulation);
  const mergedMarkdown = createMergedMarkdown(normalized, simulation, report);

  saveRun({
    title: normalized.decision_title,
    verdict: report.humanReport.topline_verdict,
    createdAt: new Date().toISOString(),
    jsonAppendix: report.jsonAppendix,
    mergedMarkdown
  });

  return {
    normalized,
    simulation,
    report,
    mergedMarkdown,
    history: loadRuns()
  };
}

export function getSavedRuns() {
  return loadRuns();
}
