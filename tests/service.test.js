import test from 'node:test';
import assert from 'node:assert/strict';
import { runSimulationPipeline } from '../src/core/run-simulation.js';

test('runSimulationPipeline composes normalize simulate and report', () => {
  const bundle = runSimulationPipeline({
    decision_title: '파이프라인 테스트',
    option_a: { label: 'A', description: 'A' },
    option_b: { label: 'B', description: 'B' }
  });

  assert.equal(bundle.normalized.decision_title, '파이프라인 테스트');
  assert.equal(bundle.simulation.options.A.length, 3);
  assert.ok(bundle.report.humanReport.topline_verdict.length > 0);
  assert.match(bundle.mergedMarkdown, /파이프라인 테스트/);
});
