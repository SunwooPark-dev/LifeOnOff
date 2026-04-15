import test from 'node:test';
import assert from 'node:assert/strict';
import { createDocumentStub, collectText, findTags } from './helpers/dom-stub.js';
import { createHistoryFragment, createResultsFragment } from '../src/ui/render.js';
import { buildReport } from '../src/core/report.js';
import { normalizeInput } from '../src/core/normalize.js';
import { simulateLifePaths } from '../src/core/simulator.js';

const input = normalizeInput({
  decision_title: '렌더 테스트',
  option_a: { label: 'A', description: 'A' },
  option_b: { label: 'B', description: 'B' }
});
const simulation = simulateLifePaths(input);
const report = buildReport(input, simulation);

test('history rendering uses DOM nodes and keeps text literal', () => {
  const doc = createDocumentStub();
  const fragment = createHistoryFragment([{ title: '<b>title</b>', verdict: '<img src=x>' }], doc);
  const text = collectText(fragment);
  assert.match(text, /<b>title<\/b>/);
  assert.equal(findTags(fragment, 'script').length, 0);
  assert.equal(findTags(fragment, 'img').length, 0);
});

test('result rendering uses DOM nodes and keeps malicious text inert', () => {
  const doc = createDocumentStub();
  const maliciousReport = structuredClone(report);
  maliciousReport.humanReport.topline_verdict = '<script>alert(1)</script>';
  const fragment = createResultsFragment(maliciousReport, '<img src=x onerror=1>', doc);
  const text = collectText(fragment);
  assert.match(text, /<script>alert\(1\)<\/script>/);
  assert.match(text, /<img src=x onerror=1>/);
  assert.equal(findTags(fragment, 'script').length, 0);
  assert.equal(findTags(fragment, 'img').length, 0);
});
