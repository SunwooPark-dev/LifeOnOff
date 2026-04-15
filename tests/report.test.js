import test from 'node:test';
import assert from 'node:assert/strict';
import { buildReport, createMergedMarkdown, createPdfReadyExportGuide } from '../src/core/report.js';
import { normalizeInput } from '../src/core/normalize.js';
import { simulateLifePaths } from '../src/core/simulator.js';

const input = normalizeInput({
  decision_title: '창업 vs 현직 유지',
  decision_question: '지금 창업하는 것이 맞는가?',
  option_a: { label: '창업', description: '소규모 제품을 만든다' },
  option_b: { label: '현직 유지', description: '현재 직장에 남아 자본을 모은다' },
  scenario_domain: 'health_routine',
  simulation_mode: 'quick',
  must_consider: ['건강 회복', '재정 버퍼'],
  must_avoid: ['투자 확정 예언']
});

const simulation = simulateLifePaths(input);
const report = buildReport(input, simulation);

test('report contains required appendix contracts and guardrails', () => {
  assert.ok(report.jsonAppendix.simulation_manifest);
  assert.equal(report.jsonAppendix.dimension_scorecard.length, 6);
  assert.equal(report.jsonAppendix.scenario_graph_summary.length, 6);
  assert.ok(report.jsonAppendix.mvp_backlog.length >= 10);
  assert.ok(report.humanReport.warnings.length >= 2);
  assert.ok(report.humanReport.comparative_summary.some((item) => item.includes('must_consider')));
  assert.ok(report.humanReport.risk_regret_summary.every((entry) => entry.confidence !== 'high'));
});

test('merged markdown contains key sections and export guide is present', () => {
  const merged = createMergedMarkdown(input, simulation, report);
  const exportGuide = createPdfReadyExportGuide();
  assert.match(merged, /Topline verdict/);
  assert.match(merged, /머신 리더블 JSON 부록/);
  assert.match(exportGuide, /generated\/life-ab-test-merged-master\.md/);
});
