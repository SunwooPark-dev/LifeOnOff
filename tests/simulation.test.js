import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreRun, simulateLifePaths } from '../src/core/simulator.js';
import { normalizeInput } from '../src/core/normalize.js';

const baseInput = normalizeInput({
  decision_title: '이직 vs 잔류',
  option_a: { label: '이직', description: '새 회사로 이동' },
  option_b: { label: '잔류', description: '현재 회사에 남기' },
  scenario_domain: 'career',
  simulation_mode: 'standard'
});

test('simulation keeps fairness invariants and branch contract', () => {
  const simulation = simulateLifePaths(baseInput);
  assert.deepEqual(simulation.baseline.branches, ['optimistic', 'base', 'pessimistic']);
  assert.equal(simulation.options.A.length, 3);
  assert.equal(simulation.options.B.length, 3);
  for (const branch of ['optimistic', 'base', 'pessimistic']) {
    const aRun = simulation.options.A.find((entry) => entry.branch === branch);
    const bRun = simulation.options.B.find((entry) => entry.branch === branch);
    const aCommon = aRun.events.filter((event) => event.source.startsWith('common-'));
    const bCommon = bRun.events.filter((event) => event.source.startsWith('common-'));
    assert.equal(aCommon.length, baseInput.turns);
    assert.equal(bCommon.length, baseInput.turns);
    assert.deepEqual(
      aCommon.map((event) => ({ severity: event.severity, dims: event.affected_dimensions, summary: event.summary })),
      bCommon.map((event) => ({ severity: event.severity, dims: event.affected_dimensions, summary: event.summary }))
    );
  }
});

test('all scores stay within bounds', () => {
  const simulation = simulateLifePaths(baseInput);
  for (const run of [...simulation.options.A, ...simulation.options.B]) {
    for (const value of Object.values(run.scores)) {
      assert.ok(value >= 0 && value <= 100);
    }
    assert.ok(run.overall_score >= 0 && run.overall_score <= 100);
  }
});

test('scoreRun can emit high confidence for strong scores', () => {
  const summary = scoreRun({
    emotion: 90,
    finance: 91,
    growth: 92,
    relationships: 88,
    health: 87,
    autonomy: 94,
    regret: 10,
    risk: 12
  }, {
    emotion: 15,
    finance: 15,
    growth: 15,
    relationships: 10,
    health: 10,
    autonomy: 15,
    regret: 10,
    risk: 10
  });

  assert.equal(summary.confidence, 'high');
  assert.ok(summary.overall >= 85);
});

test('sensitive-domain conservative event policy reduces chance-event intensity', () => {
  const normalInput = normalizeInput({
    decision_title: '일반 커리어 선택',
    option_a: { label: 'A', description: 'A' },
    option_b: { label: 'B', description: 'B' },
    scenario_domain: 'career',
    simulation_mode: 'quick'
  });
  const sensitiveInput = normalizeInput({
    decision_title: '민감 건강 루틴 선택',
    option_a: { label: 'A', description: 'A' },
    option_b: { label: 'B', description: 'B' },
    scenario_domain: 'health_routine',
    simulation_mode: 'quick',
    must_avoid: ['의료 확정 판단']
  });

  const normalSimulation = simulateLifePaths(normalInput);
  const sensitiveSimulation = simulateLifePaths(sensitiveInput);
  const countChance = (sim) => [...sim.options.A, ...sim.options.B].reduce((sum, run) => sum + run.events.filter((event) => event.event_type === 'chance').length, 0);
  const maxChanceSeverity = (sim) => [...sim.options.A, ...sim.options.B].flatMap((run) => run.events.filter((event) => event.event_type === 'chance').map((event) => event.severity));

  assert.ok(countChance(sensitiveSimulation) <= countChance(normalSimulation));
  assert.ok(maxChanceSeverity(sensitiveSimulation).every((severity) => severity === 'low'));
  assert.ok([...sensitiveSimulation.options.A, ...sensitiveSimulation.options.B].every((run) => run.confidence !== 'high'));
});
