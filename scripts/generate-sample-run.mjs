import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createPdfReadyExportGuide } from '../src/core/report.js';
import { runSimulationPipeline } from '../src/core/run-simulation.js';

const { normalized, report, mergedMarkdown } = runSimulationPipeline({
  decision_title: '이직 vs 현재 회사 잔류',
  decision_question: '지금 이직하는 것이 더 나은가?',
  option_a: { label: '이직한다', description: '더 높은 성장 잠재력이 있는 회사로 이동한다.' },
  option_b: { label: '현재 회사에 남는다', description: '안정성과 기존 관계 자산을 유지한다.' },
  scenario_domain: 'career',
  time_horizon: '1_year',
  simulation_mode: 'standard',
  must_consider: ['재정 안정', '성장 속도'],
  must_avoid: ['확정적 예언 문구']
});

const guide = createPdfReadyExportGuide(normalized);

await writeFile(path.join(process.cwd(), 'generated', 'life-ab-test-merged-master.md'), mergedMarkdown, 'utf8');
await writeFile(path.join(process.cwd(), 'generated', 'life-ab-test-pdf-ready-export-guide.md'), guide, 'utf8');
await writeFile(path.join(process.cwd(), 'generated', 'life-ab-test-json-appendix.json'), JSON.stringify(report.jsonAppendix, null, 2), 'utf8');

console.log('Generated sample artifacts.');
