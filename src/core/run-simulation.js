import { buildReport, createMergedMarkdown } from './report.js';
import { normalizeInput } from './normalize.js';
import { simulateLifePaths } from './simulator.js';

export function runSimulationPipeline(rawInput) {
  const normalized = normalizeInput(rawInput);
  const simulation = simulateLifePaths(normalized);
  const report = buildReport(normalized, simulation);
  const mergedMarkdown = createMergedMarkdown(normalized, simulation, report);

  return {
    normalized,
    simulation,
    report,
    mergedMarkdown
  };
}
