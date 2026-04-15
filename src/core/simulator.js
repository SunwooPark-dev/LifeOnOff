import { AGENTS, BRANCHES, DIMENSIONS } from './config.js';

const SENSITIVE_KEYWORDS = ['투자', '의료', '법률', '정치'];

function hashSeed(seedText) {
  let hash = 0;
  for (const char of seedText) {
    hash = ((hash << 5) - hash) + char.charCodeAt(0);
    hash |= 0;
  }
  return Math.abs(hash) + 1;
}

function createRng(seedText) {
  let seed = hashSeed(seedText) % 2147483647;
  if (seed <= 0) seed += 2147483646;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function capConfidence(confidence, maximum) {
  const order = ['low', 'medium', 'high'];
  return order[Math.min(order.indexOf(confidence), order.indexOf(maximum))];
}

function domainFocus(domain) {
  const map = {
    career: ['growth', 'finance', 'autonomy'],
    business: ['finance', 'risk', 'growth'],
    relationship: ['relationships', 'emotion', 'regret'],
    education: ['growth', 'finance', 'regret'],
    lifestyle: ['emotion', 'health', 'autonomy'],
    creative: ['growth', 'autonomy', 'emotion'],
    health_routine: ['health', 'emotion', 'risk'],
    relocation: ['relationships', 'finance', 'autonomy'],
    custom: ['growth', 'emotion', 'autonomy']
  };
  return map[domain] ?? map.custom;
}

function buildEvent({ turn, type, summary, affected_dimensions, probability, severity, mitigation_hint, source }) {
  return { turn, event_type: type, summary, affected_dimensions, probability, severity, mitigation_hint, source };
}

function applyDimensionDelta(scores, dimension, delta) {
  if (dimension === 'risk' || dimension === 'regret') {
    scores[dimension] = clamp(scores[dimension] - delta);
  } else {
    scores[dimension] = clamp(scores[dimension] + delta);
  }
}

function isSensitiveInput(normalizedInput) {
  return normalizedInput.scenario_domain === 'health_routine'
    || normalizedInput.must_avoid.some((item) => SENSITIVE_KEYWORDS.some((keyword) => item.includes(keyword)));
}

export function createBaseline(normalizedInput) {
  const baseScores = Object.fromEntries(DIMENSIONS.map(({ id, direction }) => [id, direction === 'higher' ? 55 : 45]));
  const priorities = new Set(normalizedInput.user_profile.priorities);
  if (priorities.has('안정')) {
    baseScores.finance += 5;
    baseScores.risk -= 4;
  }
  if (priorities.has('성장')) {
    baseScores.growth += 6;
    baseScores.regret -= 2;
  }
  if (priorities.has('자율성')) {
    baseScores.autonomy += 5;
  }

  return {
    decision_title: normalizedInput.decision_title,
    question: normalizedInput.decision_question,
    domain: normalizedInput.scenario_domain,
    horizon: normalizedInput.time_horizon,
    timeline_unit: normalizedInput.timeline_unit,
    profile: normalizedInput.user_profile,
    weights: normalizedInput.weighting_override,
    sharedScores: baseScores,
    sharedAgents: AGENTS,
    commonNoiseSeed: `${normalizedInput.seed_id}:common`,
    optionSeeds: {
      A: `${normalizedInput.seed_id}:A`,
      B: `${normalizedInput.seed_id}:B`
    },
    branches: BRANCHES,
    turns: normalizedInput.turns
  };
}

function createCommonEventStream({ branch, normalizedInput, baseline }) {
  const commonRng = createRng(`${baseline.commonNoiseSeed}:${branch}`);
  const focus = domainFocus(normalizedInput.scenario_domain);
  const mustConsiderBoost = normalizedInput.must_consider.length ? 1 : 0;

  return Array.from({ length: baseline.turns }, (_, index) => {
    const turn = index + 1;
    const commonSeverity = commonRng();
    const commonDim = focus[index % focus.length];
    const deltaBase = commonSeverity > 0.5 ? 2 : -2;
    const delta = deltaBase + mustConsiderBoost;

    return {
      turn,
      dimension: commonDim,
      delta,
      event: buildEvent({
        turn,
        type: 'environment',
        summary: `공통 환경 변화가 ${commonDim}에 영향을 주었다.`,
        affected_dimensions: [commonDim],
        probability: 0.72,
        severity: commonSeverity > 0.5 ? 'medium' : 'low',
        mitigation_hint: normalizedInput.must_consider.length
          ? `must_consider(${normalizedInput.must_consider.join(', ')})를 반영해 공통 환경 리스크를 더 주의 깊게 읽어야 한다.`
          : '공통 노이즈는 두 옵션에 동일하게 적용된다.',
        source: `common-${index}`
      })
    };
  });
}

function createBranchRun({ optionKey, option, branch, normalizedInput, baseline, commonEvents, optionRng }) {
  const scores = { ...baseline.sharedScores };
  const focus = domainFocus(normalizedInput.scenario_domain);
  const events = [];
  const memoryLog = [];
  let optionCounter = 0;
  const conservativeMode = isSensitiveInput(normalizedInput);
  const mustConsiderText = normalizedInput.must_consider.join(', ');

  for (let turn = 1; turn <= baseline.turns; turn += 1) {
    const commonEvent = commonEvents[turn - 1];
    applyDimensionDelta(scores, commonEvent.dimension, commonEvent.delta);
    events.push(commonEvent.event);

    const optionInfluence = optionRng();
    const branchModifier = branch === 'optimistic' ? 1 : branch === 'pessimistic' ? -1 : 0;
    const optionDims = optionKey === 'A'
      ? [focus[0], 'autonomy', 'growth']
      : [focus[1] ?? focus[0], 'emotion', 'relationships'];
    const affected = optionDims.slice(0, 2);
    affected.forEach((dimension, idx) => {
      const signal = (optionInfluence > 0.45 ? 1 : -1) + branchModifier;
      const delta = clamp(Math.round(signal * (idx === 0 ? 5 : 3)), -15, 15);
      applyDimensionDelta(scores, dimension, delta);
    });

    if (optionKey === 'A') {
      scores.finance = clamp(scores.finance + (branchModifier >= 0 ? 2 : -1));
      scores.risk = clamp(scores.risk + (branch === 'pessimistic' ? 4 : -1));
    } else {
      scores.relationships = clamp(scores.relationships + (branchModifier >= 0 ? 2 : -1));
      scores.emotion = clamp(scores.emotion + (branch === 'optimistic' ? 3 : 0));
    }

    events.push(buildEvent({
      turn,
      type: 'strategy',
      summary: `${option.label} 선택이 ${affected.join(', ')}에 직접적인 변화를 만들었다.${mustConsiderText ? ` 특히 ${mustConsiderText} 축에서 체감 차이가 커진다.` : ''}`,
      affected_dimensions: [...affected],
      probability: 0.66,
      severity: branch === 'base' ? 'medium' : branch === 'optimistic' ? 'high' : 'medium',
      mitigation_hint: `${option.label}의 실행 품질을 높이면 상방이 커지고 하방이 줄어든다.${mustConsiderText ? ` must_consider(${mustConsiderText})를 체크포인트마다 다시 확인하라.` : ''}`,
      source: `${optionKey.toLowerCase()}-${optionCounter++}`
    }));

    const chanceRoll = optionRng();
    const chanceThreshold = conservativeMode ? 0.82 : 0.62;
    if (chanceRoll > chanceThreshold) {
      const chanceDim = optionKey === 'A' ? 'finance' : 'relationships';
      const chanceDelta = conservativeMode
        ? (branch === 'pessimistic' ? -2 : 2)
        : (branch === 'pessimistic' ? -4 : 4);
      scores[chanceDim] = clamp(scores[chanceDim] + chanceDelta);
      events.push(buildEvent({
        turn,
        type: 'chance',
        summary: `예상 밖의 사건이 ${chanceDim}에 ${chanceDelta > 0 ? '호재' : '부담'}를 만들었다.${conservativeMode ? ' 민감 영역이므로 해석은 보수적으로 제한한다.' : ''}`,
        affected_dimensions: [chanceDim],
        probability: 0.38,
        severity: conservativeMode ? 'low' : Math.abs(chanceDelta) > 3 ? 'medium' : 'low',
        mitigation_hint: conservativeMode
          ? '민감 도메인에서는 확정 판단 대신 리플레이와 추가 확인을 권장한다.'
          : '리플레이나 우선순위 수정으로 대응 전략을 비교할 수 있다.',
        source: `${optionKey.toLowerCase()}-chance-${turn}`
      }));
    }

    memoryLog.push({
      turn,
      summary: `${option.label} / ${branch} 경로는 ${events[events.length - 1].summary}`,
      dominant_dimension: events[events.length - 1].affected_dimensions[0]
    });
  }

  return { scores, events, memoryLog };
}

export function scoreRun(scores, weights) {
  let weighted = 0;
  let weightTotal = 0;

  for (const [dimension, weight] of Object.entries(weights)) {
    const raw = scores[dimension];
    const adjusted = (dimension === 'risk' || dimension === 'regret') ? 100 - raw : raw;
    weighted += adjusted * weight;
    weightTotal += weight;
  }

  const overall = Math.round(weighted / weightTotal);
  const confidence = overall >= 85 ? 'high' : overall >= 65 ? 'medium' : 'low';
  return { overall, confidence };
}

function createNarrative(option, branch, scoreSummary, focusDimensions) {
  const narrativeTone = branch === 'optimistic'
    ? '상방이 열리지만 실행 집중력이 중요하다.'
    : branch === 'pessimistic'
      ? '피로와 불확실성이 누적될 수 있어 완충 전략이 중요하다.'
      : '안정과 성장의 균형이 핵심인 기본 경로다.';

  return `${option.label} / ${branch} 경로는 ${focusDimensions.join(', ')}에서 차이를 만든다. 총점은 ${scoreSummary.overall}점이며 ${narrativeTone}`;
}

function applyConfidencePolicy({ normalizedInput, rawConfidence }) {
  const confidenceCeiling = isSensitiveInput(normalizedInput) || normalizedInput.validation_issues.length >= 2 || normalizedInput.assumptions.length >= 3
    ? 'low'
    : normalizedInput.validation_issues.length >= 1 || normalizedInput.assumptions.length >= 1
      ? 'medium'
      : 'high';
  return capConfidence(rawConfidence, confidenceCeiling);
}

export function simulateLifePaths(normalizedInput) {
  const baseline = createBaseline(normalizedInput);
  const commonEventStreams = Object.fromEntries(baseline.branches.map((branch) => [branch, createCommonEventStream({ branch, normalizedInput, baseline })]));
  const options = { A: normalizedInput.option_a, B: normalizedInput.option_b };

  const simulation = {
    baseline,
    assumptions: normalizedInput.assumptions,
    options: {}
  };

  for (const [optionKey, option] of Object.entries(options)) {
    simulation.options[optionKey] = baseline.branches.map((branch) => {
      const branchRun = createBranchRun({
        optionKey,
        option,
        branch,
        normalizedInput,
        baseline,
        commonEvents: commonEventStreams[branch],
        optionRng: createRng(`${baseline.optionSeeds[optionKey]}:${branch}`)
      });
      const scoreSummary = scoreRun(branchRun.scores, baseline.weights);
      const confidence = applyConfidencePolicy({ normalizedInput, rawConfidence: scoreSummary.confidence });
      const focusDimensions = domainFocus(normalizedInput.scenario_domain).slice(0, 2);
      return {
        option: optionKey,
        branch,
        scores: branchRun.scores,
        overall_score: scoreSummary.overall,
        confidence,
        confidence_reason: normalizedInput.assumptions.length >= 3
          ? '입력 가정이 많아 confidence를 low로 제한했다.'
          : normalizedInput.validation_issues.length >= 2
            ? '입력 검증 이슈가 여러 건 있어 confidence를 low로 제한했다.'
            : normalizedInput.validation_issues.length >= 1
              ? '입력 검증 이슈가 있어 confidence 상한을 medium으로 제한했다.'
              : isSensitiveInput(normalizedInput)
                ? '민감 도메인 또는 must_avoid 조건이 있어 confidence를 low로 제한했다.'
                : '공통 baseline과 옵션 특이 이벤트를 기반으로 산출했다.',
        events: branchRun.events,
        memoryLog: branchRun.memoryLog,
        narrative: createNarrative(option, branch, scoreSummary, focusDimensions)
      };
    });
  }

  return simulation;
}


