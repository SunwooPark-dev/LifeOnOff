import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeInput } from '../src/core/normalize.js';

test('normalizeInput fills defaults and exposes assumptions', () => {
  const normalized = normalizeInput({
    option_a: { label: 'A' },
    option_b: { label: 'B' }
  });

  assert.equal(normalized.simulation_mode, 'standard');
  assert.equal(normalized.turns, 12);
  assert.equal(normalized.user_profile.career_stage, '탐색기');
  assert.ok(normalized.assumptions.length >= 1);
  assert.match(normalized.option_a.comparable_statement, /A:/);
  assert.match(normalized.option_b.comparable_statement, /B:/);
});

test('normalizeInput validates enums and weighting overrides', () => {
  const normalized = normalizeInput({
    scenario_domain: 'unknown',
    simulation_mode: 'turbo',
    weighting_override: { finance: 'heavy', growth: 22 },
    option_a: { label: 'A' },
    option_b: { label: 'B' }
  });

  assert.equal(normalized.scenario_domain, 'custom');
  assert.equal(normalized.simulation_mode, 'standard');
  assert.equal(normalized.weighting_override.growth, 22);
  assert.equal(normalized.weighting_override.finance, 15);
  assert.ok(normalized.assumptions.length >= 2);
  assert.ok(normalized.validation_issues.length >= 2);
});
