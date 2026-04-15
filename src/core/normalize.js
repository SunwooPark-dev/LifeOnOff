import {
  DEFAULT_PROFILE,
  DEFAULT_WEIGHTS,
  TIMELINE_UNIT_BY_HORIZON,
  TURNS_BY_MODE
} from './config.js';
import { validateRawInput } from './validation.js';

const ensureArray = (value, fallback = []) => Array.isArray(value) && value.filter(Boolean).length ? value.filter(Boolean) : fallback;
const textOr = (value, fallback) => typeof value === 'string' && value.trim() ? value.trim() : fallback;

const normalizeOption = (option, fallbackLabel) => ({
  label: textOr(option?.label, fallbackLabel),
  description: textOr(option?.description, `${fallbackLabel}을 선택했을 때의 삶의 경로`)
});

const normalizeComparableOptions = (optionA, optionB) => {
  const a = normalizeOption(optionA, '옵션 A');
  const b = normalizeOption(optionB, '옵션 B');
  return {
    option_a: {
      ...a,
      comparable_statement: `${a.label}: ${a.description}`
    },
    option_b: {
      ...b,
      comparable_statement: `${b.label}: ${b.description}`
    }
  };
};

export function normalizeInput(raw = {}) {
  const { sanitizedRaw, validationAssumptions } = validateRawInput(raw);
  const assumptions = [...validationAssumptions];
  const user_profile = {
    age_range: textOr(sanitizedRaw.user_profile?.age_range, DEFAULT_PROFILE.age_range),
    location: textOr(sanitizedRaw.user_profile?.location, DEFAULT_PROFILE.location),
    career_stage: textOr(sanitizedRaw.user_profile?.career_stage, DEFAULT_PROFILE.career_stage),
    financial_risk_tolerance: textOr(sanitizedRaw.user_profile?.financial_risk_tolerance, DEFAULT_PROFILE.financial_risk_tolerance),
    personality_traits: ensureArray(sanitizedRaw.user_profile?.personality_traits, DEFAULT_PROFILE.personality_traits),
    priorities: ensureArray(sanitizedRaw.user_profile?.priorities, DEFAULT_PROFILE.priorities),
    constraints: ensureArray(sanitizedRaw.user_profile?.constraints, DEFAULT_PROFILE.constraints)
  };

  if (!raw.user_profile) assumptions.push('user_profile이 없어 기본 프로필을 적용했다.');

  const weighting_override = { ...DEFAULT_WEIGHTS, ...(sanitizedRaw.weighting_override || {}) };
  const comparableOptions = normalizeComparableOptions(sanitizedRaw.option_a, sanitizedRaw.option_b);

  if (!sanitizedRaw.option_a?.label || !sanitizedRaw.option_b?.label) {
    assumptions.push('옵션 A/B 라벨 또는 설명이 부족해 비교 가능한 기본 문장으로 정규화했다.');
  }

  return {
    decision_title: textOr(sanitizedRaw.decision_title, '인생 AB 테스트'),
    decision_question: textOr(sanitizedRaw.decision_question, '두 선택지 중 어느 경로가 지금의 나에게 더 맞는가?'),
    scenario_domain: textOr(sanitizedRaw.scenario_domain, 'custom'),
    time_horizon: textOr(sanitizedRaw.time_horizon, '1_year'),
    simulation_mode: textOr(sanitizedRaw.simulation_mode, 'standard'),
    tone: textOr(sanitizedRaw.tone, 'practical'),
    must_consider: ensureArray(sanitizedRaw.must_consider, []),
    must_avoid: ensureArray(sanitizedRaw.must_avoid, []),
    user_profile,
    weighting_override,
    uncertainty_tolerance: textOr(sanitizedRaw.uncertainty_tolerance, 'medium'),
    output_mode: textOr(sanitizedRaw.output_mode, 'full_bundle'),
    seed_id: textOr(sanitizedRaw.seed_id, 'life-ab-default-seed'),
    locale: textOr(sanitizedRaw.locale, 'ko-KR'),
    option_a: comparableOptions.option_a,
    option_b: comparableOptions.option_b,
    branches_per_option: 3,
    turns: TURNS_BY_MODE[textOr(sanitizedRaw.simulation_mode, 'standard')] ?? TURNS_BY_MODE.standard,
    timeline_unit: TIMELINE_UNIT_BY_HORIZON[textOr(sanitizedRaw.time_horizon, '1_year')] ?? TIMELINE_UNIT_BY_HORIZON['1_year'],
    validation_issues: validationAssumptions,
    assumptions
  };
}
