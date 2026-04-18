import {
  ALLOWED_OUTPUT_MODES,
  ALLOWED_RISK_TOLERANCE,
  ALLOWED_SCENARIO_DOMAINS,
  ALLOWED_SIMULATION_MODES,
  ALLOWED_TIME_HORIZONS,
  ALLOWED_TONES,
  ALLOWED_UNCERTAINTY_TOLERANCE,
  DEFAULT_WEIGHTS
} from './config.js';

const DIMENSION_KEYS = Object.keys(DEFAULT_WEIGHTS);

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeEnum(value, allowed, fallback, assumptions, label) {
  const normalized = normalizeString(value);
  if (!normalized) return fallback;
  if (allowed.includes(normalized)) return normalized;
  assumptions.push(`${label} 값이 유효하지 않아 기본값(${fallback})으로 대체했다.`);
  return fallback;
}

function normalizeArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeString(item)).filter(Boolean);
}

function normalizeWeights(value, assumptions) {
  const candidate = typeof value === 'object' && value ? value : {};
  const result = {};
  for (const key of DIMENSION_KEYS) {
    const raw = candidate[key];
    if (raw == null || raw === '') continue;
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) {
      assumptions.push(`weighting_override.${key} 값이 숫자가 아니어서 무시했다.`);
      continue;
    }
    result[key] = Math.max(0, Math.min(100, Math.round(numeric)));
  }
  return result;
}

export function validateRawInput(raw = {}) {
  const assumptions = [];
  const userProfile = typeof raw.user_profile === 'object' && raw.user_profile ? raw.user_profile : {};

  return {
    sanitizedRaw: {
      ...raw,
      decision_title: normalizeString(raw.decision_title),
      decision_question: normalizeString(raw.decision_question),
      scenario_domain: normalizeEnum(raw.scenario_domain, ALLOWED_SCENARIO_DOMAINS, 'custom', assumptions, 'scenario_domain'),
      time_horizon: normalizeEnum(raw.time_horizon, ALLOWED_TIME_HORIZONS, '1_year', assumptions, 'time_horizon'),
      simulation_mode: normalizeEnum(raw.simulation_mode, ALLOWED_SIMULATION_MODES, 'standard', assumptions, 'simulation_mode'),
      tone: normalizeEnum(raw.tone, ALLOWED_TONES, 'practical', assumptions, 'tone'),
      uncertainty_tolerance: normalizeEnum(raw.uncertainty_tolerance, ALLOWED_UNCERTAINTY_TOLERANCE, 'medium', assumptions, 'uncertainty_tolerance'),
      output_mode: normalizeEnum(raw.output_mode, ALLOWED_OUTPUT_MODES, 'full_bundle', assumptions, 'output_mode'),
      locale: normalizeString(raw.locale) || 'ko-KR',
      must_consider: normalizeArray(raw.must_consider),
      must_avoid: normalizeArray(raw.must_avoid),
      weighting_override: normalizeWeights(raw.weighting_override, assumptions),
      seed_id: normalizeString(raw.seed_id) || 'life-ab-default-seed',
      option_a: typeof raw.option_a === 'object' && raw.option_a ? raw.option_a : {},
      option_b: typeof raw.option_b === 'object' && raw.option_b ? raw.option_b : {},
      user_profile: {
        age_range: normalizeString(userProfile.age_range),
        location: normalizeString(userProfile.location),
        career_stage: normalizeString(userProfile.career_stage),
        financial_risk_tolerance: normalizeEnum(userProfile.financial_risk_tolerance, ALLOWED_RISK_TOLERANCE, 'medium', assumptions, 'financial_risk_tolerance'),
        personality_traits: normalizeArray(userProfile.personality_traits),
        priorities: normalizeArray(userProfile.priorities),
        constraints: normalizeArray(userProfile.constraints)
      }
    },
    validationAssumptions: assumptions
  };
}
