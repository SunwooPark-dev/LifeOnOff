function createElement(doc, tagName, { className, text, attrs } = {}) {
  const node = doc.createElement(tagName);
  if (className) node.className = className;
  if (text != null) node.textContent = String(text);
  if (attrs) {
    for (const [name, value] of Object.entries(attrs)) {
      node.setAttribute(name, value);
    }
  }
  return node;
}

function appendChildren(parent, ...children) {
  for (const child of children) {
    if (child == null) continue;
    parent.appendChild(child);
  }
  return parent;
}

function renderScoreTable(doc, scorecards) {
  const table = createElement(doc, 'table');
  const thead = createElement(doc, 'thead');
  const headRow = createElement(doc, 'tr');
  const headers = ['옵션', '브랜치', '총점', '행복', '재정', '성장', '관계', '건강', '자율성', '후회', '리스크', 'confidence'];
  headers.forEach((header) => headRow.appendChild(createElement(doc, 'th', { text: header })));
  thead.appendChild(headRow);

  const tbody = createElement(doc, 'tbody');
  scorecards.forEach((entry) => {
    const row = createElement(doc, 'tr');
    const values = [
      entry.option,
      entry.branch,
      entry.overall_score,
      entry.scores.emotion,
      entry.scores.finance,
      entry.scores.growth,
      entry.scores.relationships,
      entry.scores.health,
      entry.scores.autonomy,
      entry.scores.regret,
      entry.scores.risk,
      entry.confidence
    ];
    values.forEach((value) => row.appendChild(createElement(doc, 'td', { text: value })));
    tbody.appendChild(row);
  });

  return appendChildren(table, thead, tbody);
}

function renderTimeline(doc, graphSummary) {
  const grid = createElement(doc, 'div', { className: 'card-grid' });
  graphSummary.forEach((branch) => {
    const card = createElement(doc, 'article', { className: 'timeline-card' });
    card.appendChild(createElement(doc, 'h4', { text: `${branch.option} / ${branch.branch}` }));
    const list = createElement(doc, 'ul');
    branch.nodes.slice(0, 4).forEach((node) => {
      list.appendChild(createElement(doc, 'li', { text: `Turn ${node.turn} · ${node.summary}` }));
    });
    card.appendChild(list);
    grid.appendChild(card);
  });
  return grid;
}

function renderRiskCards(doc, riskSummary) {
  const grid = createElement(doc, 'div', { className: 'card-grid' });
  riskSummary.forEach((entry) => {
    const card = createElement(doc, 'div', { className: 'metric-card' });
    card.appendChild(createElement(doc, 'strong', { text: `${entry.option} / ${entry.branch}` }));
    card.appendChild(createElement(doc, 'span', { text: `리스크 ${entry.risk}` }));
    card.appendChild(createElement(doc, 'span', { text: `후회 ${entry.regret}` }));
    card.appendChild(createElement(doc, 'span', { text: `confidence ${entry.confidence}` }));
    card.appendChild(createElement(doc, 'span', { className: 'muted', text: entry.confidence_reason }));
    grid.appendChild(card);
  });
  return grid;
}

function createSection(doc, title, bodyNodes = [], className = 'result-block') {
  const section = createElement(doc, 'section', { className });
  if (title) section.appendChild(createElement(doc, 'h3', { text: title }));
  bodyNodes.forEach((node) => section.appendChild(node));
  return section;
}

export function createHistoryFragment(runs, doc = document) {
  const fragment = doc.createDocumentFragment();
  if (!runs.length) {
    fragment.appendChild(createElement(doc, 'li', { text: '아직 저장된 실행이 없습니다.' }));
    return fragment;
  }

  runs.forEach((run) => {
    const item = createElement(doc, 'li');
    item.appendChild(createElement(doc, 'strong', { text: run.title }));
    item.appendChild(createElement(doc, 'span', { text: ` — ${run.verdict}` }));
    fragment.appendChild(item);
  });
  return fragment;
}

export function mountHistory(root, runs, doc = document) {
  root.replaceChildren(createHistoryFragment(runs, doc));
}

export function createResultsFragment(report, mergedMarkdown, doc = document) {
  const fragment = doc.createDocumentFragment();

  const topline = createSection(doc, null, [
    createElement(doc, 'h2', { text: 'Topline verdict' }),
    createElement(doc, 'p', { text: report.humanReport.topline_verdict }),
    createElement(doc, 'p', { className: 'muted', text: report.humanReport.uncertainty_disclosure })
  ]);
  fragment.appendChild(topline);

  const list = createElement(doc, 'ul');
  report.humanReport.comparative_summary.forEach((item) => list.appendChild(createElement(doc, 'li', { text: item })));
  fragment.appendChild(createSection(doc, '핵심 비교 포인트', [list]));
  fragment.appendChild(createSection(doc, '차원별 점수 비교표', [renderScoreTable(doc, report.humanReport.branch_matrix)]));

  const twoColumn = createElement(doc, 'section', { className: 'result-block two-column' });
  twoColumn.appendChild(createSection(doc, '주요 분기점 타임라인', [renderTimeline(doc, report.humanReport.key_timeline)], '')); 
  twoColumn.appendChild(createSection(doc, '리스크 / 후회 카드', [renderRiskCards(doc, report.humanReport.risk_regret_summary)], ''));
  fragment.appendChild(twoColumn);

  const pre = createElement(doc, 'pre');
  pre.textContent = JSON.stringify(report.jsonAppendix, null, 2);
  fragment.appendChild(createSection(doc, '머신 리더블 JSON 부록', [pre]));

  const textarea = createElement(doc, 'textarea', { attrs: { readonly: 'readonly', rows: '18' } });
  textarea.value = mergedMarkdown;
  fragment.appendChild(createSection(doc, 'Merged master markdown', [textarea]));

  return fragment;
}

export function mountResults(root, report, mergedMarkdown, doc = document) {
  root.replaceChildren(createResultsFragment(report, mergedMarkdown, doc));
}
