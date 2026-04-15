import { runSimulationPipeline } from '../core/run-simulation.js';
import { saveRun, loadRuns } from '../core/storage.js';
import { mountHistory, mountResults } from './render.js';

const form = document.querySelector('#simulator-form');
const resultRoot = document.querySelector('#result-root');
const historyRoot = document.querySelector('#history-root');

function renderHistory() {
  mountHistory(historyRoot, loadRuns(), document);
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function collectRawInput(formData) {
  return {
    decision_title: formData.get('decision_title'),
    decision_question: formData.get('decision_question'),
    scenario_domain: formData.get('scenario_domain'),
    time_horizon: formData.get('time_horizon'),
    simulation_mode: formData.get('simulation_mode'),
    must_consider: String(formData.get('must_consider') || '').split(',').map((item) => item.trim()).filter(Boolean),
    must_avoid: String(formData.get('must_avoid') || '').split(',').map((item) => item.trim()).filter(Boolean),
    option_a: { label: formData.get('option_a_label'), description: formData.get('option_a_description') },
    option_b: { label: formData.get('option_b_label'), description: formData.get('option_b_description') },
    user_profile: {
      career_stage: formData.get('career_stage'),
      financial_risk_tolerance: formData.get('financial_risk_tolerance'),
      priorities: String(formData.get('priorities') || '').split(',').map((item) => item.trim()).filter(Boolean)
    }
  };
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const raw = collectRawInput(formData);
  const { normalized, report, mergedMarkdown } = runSimulationPipeline(raw);
  mountResults(resultRoot, report, mergedMarkdown, document);

  saveRun({
    title: normalized.decision_title,
    verdict: report.humanReport.topline_verdict,
    createdAt: new Date().toISOString(),
    jsonAppendix: report.jsonAppendix,
    mergedMarkdown
  });
  renderHistory();

  document.querySelector('#download-json').onclick = () => {
    downloadJson('life-ab-test-result.json', report.jsonAppendix);
  };
});

renderHistory();
