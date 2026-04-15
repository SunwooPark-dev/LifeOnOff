import { DIMENSIONS, MVP_BACKLOG, UNCERTAINTY_DISCLOSURE } from './config.js';

const labelByDimension = Object.fromEntries(DIMENSIONS.map((dimension) => [dimension.id, dimension.label]));
const SENSITIVE_DOMAINS = new Set(['health_routine']);

function average(items) {
  return Math.round(items.reduce((sum, item) => sum + item, 0) / items.length);
}

function createScorecards(simulation) {
  return Object.values(simulation.options).flat().map((branchRun) => ({
    option: branchRun.option,
    branch: branchRun.branch,
    scores: branchRun.scores,
    overall_score: branchRun.overall_score,
    confidence: branchRun.confidence
  }));
}

function createScenarioGraphSummary(simulation) {
  return Object.entries(simulation.options).flatMap(([option, branchRuns]) => branchRuns.map((branchRun) => ({
    option,
    branch: branchRun.branch,
    nodes: branchRun.events.map((event) => ({
      turn: event.turn,
      event_type: event.event_type,
      summary: event.summary,
      affected_dimensions: event.affected_dimensions
    }))
  })));
}

function branchWinner(branchRuns) {
  const byOption = {
    A: branchRuns.filter((item) => item.option === 'A').map((item) => item.overall_score),
    B: branchRuns.filter((item) => item.option === 'B').map((item) => item.overall_score)
  };

  const averages = {
    A: average(byOption.A),
    B: average(byOption.B)
  };

  if (averages.A === averages.B) return { winner: 'TIE', averages };
  return { winner: averages.A > averages.B ? 'A' : 'B', averages };
}

function strongestSignals(scorecards) {
  const summary = {};
  for (const option of ['A', 'B']) {
    const optionRuns = scorecards.filter((entry) => entry.option === option);
    summary[option] = DIMENSIONS.map((dimension) => ({
      id: dimension.id,
      label: dimension.label,
      average: average(optionRuns.map((entry) => entry.scores[dimension.id]))
    }));
  }
  return summary;
}

function createToplineVerdict(scorecards, normalizedInput) {
  const { winner, averages } = branchWinner(scorecards);
  if (winner === 'TIE') {
    return `A와 B는 총점 평균이 동일하다. ${normalizedInput.user_profile.priorities.join(', ')} 중 무엇을 더 중시하는지가 최종 선택을 가른다.`;
  }

  const label = winner === 'A' ? normalizedInput.option_a.label : normalizedInput.option_b.label;
  const gap = Math.abs(averages.A - averages.B);
  return `${label}가 현재 가정에서는 평균 ${gap}점 우세하다. 단, 이 결과는 정답이 아니라 조건부 우세이며 리스크와 후회 구조를 함께 봐야 한다.`;
}

function createComparativeSummary(scoreSignals, normalizedInput) {
  const lines = [];
  for (const dimension of ['growth', 'autonomy', 'finance', 'relationships']) {
    const a = scoreSignals.A.find((item) => item.id === dimension)?.average ?? 0;
    const b = scoreSignals.B.find((item) => item.id === dimension)?.average ?? 0;
    if (a === b) continue;
    const better = a > b ? normalizedInput.option_a.label : normalizedInput.option_b.label;
    lines.push(`${labelByDimension[dimension]}은 ${better} 쪽이 더 유리하다.`);
  }
  const mustConsiderLine = normalizedInput.must_consider.length
    ? [`사용자가 중요하다고 지정한 must_consider(${normalizedInput.must_consider.join(', ')}) 축을 우선 반영해 비교했다.`]
    : [];
  return [...mustConsiderLine, ...lines].slice(0, 5);
}

function createWarnings(normalizedInput) {
  const warnings = [UNCERTAINTY_DISCLOSURE];
  const sensitiveKeywords = ['\uD22C\uC790', '\uC758\uB8CC', '\uBC95\uB960', '\uC815\uCE58'];
  if (SENSITIVE_DOMAINS.has(normalizedInput.scenario_domain)) {
    warnings.unshift('?? ?????? ??? ?? ??? ?? ??? ???? ???? ??.');
  }
  if (normalizedInput.must_avoid.some((item) => sensitiveKeywords.some((keyword) => item.includes(keyword)))) {
    warnings.unshift('must_avoid ??? ?? ??? ???? ?? ??? ??? ????.');
  }
  return warnings;
}

export function buildReport(normalizedInput, simulation) {
  const scorecards = createScorecards(simulation);
  const graphSummary = createScenarioGraphSummary(simulation);
  const signals = strongestSignals(scorecards);
  const toplineVerdict = createToplineVerdict(scorecards, normalizedInput);
  const comparativeSummary = createComparativeSummary(signals, normalizedInput);
  const scoreA = average(scorecards.filter((entry) => entry.option === 'A').map((entry) => entry.overall_score));
  const scoreB = average(scorecards.filter((entry) => entry.option === 'B').map((entry) => entry.overall_score));
  const warnings = createWarnings(normalizedInput);

  const humanReport = {
    title: normalizedInput.decision_title,
    question: normalizedInput.decision_question,
    uncertainty_disclosure: UNCERTAINTY_DISCLOSURE,
    warnings,
    topline_verdict: toplineVerdict,
    assumptions: normalizedInput.assumptions,
    comparative_summary: comparativeSummary,
    option_overview: [
      { option: 'A', label: normalizedInput.option_a.label, average_score: scoreA },
      { option: 'B', label: normalizedInput.option_b.label, average_score: scoreB }
    ],
    branch_matrix: scorecards,
    key_timeline: graphSummary,
    risk_regret_summary: scorecards.map((entry) => ({
      option: entry.option,
      branch: entry.branch,
      risk: entry.scores.risk,
      regret: entry.scores.regret,
      confidence: entry.confidence,
      confidence_reason: simulation.options[entry.option].find((run) => run.branch === entry.branch)?.confidence_reason ?? ''
    }))
  };

  const jsonAppendix = {
    simulation_manifest: {
      decision_title: normalizedInput.decision_title,
      baseline_assumptions: normalizedInput.assumptions,
      time_horizon: normalizedInput.time_horizon,
      mode: normalizedInput.simulation_mode,
      branches_per_option: 3,
      turns: normalizedInput.turns
    },
    dimension_scorecard: scorecards,
    scenario_graph_summary: graphSummary,
    mvp_backlog: MVP_BACKLOG
  };

  return { humanReport, jsonAppendix };
}

export function createMergedMarkdown(normalizedInput, simulation, report) {
  const branchRows = report.humanReport.branch_matrix.map((entry) => `| ${entry.option} | ${entry.branch} | ${entry.overall_score} | ${entry.scores.emotion} | ${entry.scores.finance} | ${entry.scores.growth} | ${entry.scores.relationships} | ${entry.scores.health} | ${entry.scores.autonomy} | ${entry.scores.regret} | ${entry.scores.risk} | ${entry.confidence} |`).join('\n');
  const backlogRows = MVP_BACKLOG.map((item) => `| ${item.id} | ${item.priority} | ${item.title} | ${item.owner_hint} | ${item.definition_of_done} |`).join('\n');
  const appendixSections = [
    ['simulation_manifest', report.jsonAppendix.simulation_manifest],
    ['dimension_scorecard', report.jsonAppendix.dimension_scorecard],
    ['scenario_graph_summary', report.jsonAppendix.scenario_graph_summary],
    ['mvp_backlog', report.jsonAppendix.mvp_backlog]
  ].map(([title, data]) => `### ${title}\n\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``).join('\n\n');

  return `# ${normalizedInput.decision_title}\n\n## 1. 제품 한 줄 정의\n사용자의 선택지 A/B를 동일 baseline 위에서 시뮬레이션해 비교하는 인생 AB 테스트 게임\n\n## 2. 입력 정규화 및 기본 가정\n${normalizedInput.assumptions.length ? normalizedInput.assumptions.map((item) => `- ${item}`).join('\n') : '- 추가 가정 없음'}\n\n## 3. Topline verdict\n${report.humanReport.topline_verdict}\n\n## 4. 누구에게 어떤 조건에서 A/B가 맞는가\n${report.humanReport.comparative_summary.length ? report.humanReport.comparative_summary.map((item) => `- ${item}`).join('\n') : '- 두 옵션의 차이가 크지 않아 우선순위 재설정이 중요하다.'}\n\n## 5. 차원별 점수표\n| 옵션 | 브랜치 | 총점 | emotion | finance | growth | relationships | health | autonomy | regret | risk | confidence |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n${branchRows}\n\n## 6. 주요 분기점\n${report.humanReport.key_timeline.slice(0, 6).map((item) => `### ${item.option} / ${item.branch}\n${item.nodes.slice(0, 3).map((node) => `- Turn ${node.turn}: ${node.summary}`).join('\n')}`).join('\n\n')}\n\n## 7. 리스크와 안전장치\n${report.humanReport.warnings.map((warning) => `- ${warning}`).join('\n')}\n\n## 8. 즉시 구현할 첫 번째 작업 10개\n| ID | Priority | Title | Owner | Definition of Done |\n| --- | --- | --- | --- | --- |\n${backlogRows}\n\n## 9. 머신 리더블 JSON 부록\n${appendixSections}`;
}

export function createPdfReadyExportGuide() {
  return `# PDF-ready Export Guide

## Source order
1. README.md
2. generated/life-ab-test-merged-master.md
3. generated/life-ab-test-json-appendix.json
4. generated/life-ab-test-pdf-ready-export-guide.md

## Formatting guidance
- Use page breaks between major sections of the merged master markdown.
- Keep JSON appendix in monospace blocks or attach it as a separate appendix file.
- Preserve wide score tables in landscape-friendly width when exporting to PDF.
- Include uncertainty disclosure near the first result section.
- If one-file PDF is required, append the appendix summary after the merged master and link the full JSON as a separate attachment.
`;
}
