export const DEFAULT_PROFILE = {
  age_range: '20s~30s 일반 성인',
  location: '미정',
  career_stage: '탐색기',
  financial_risk_tolerance: 'medium',
  personality_traits: ['실용적', '약간의 불안감', '성장 욕구'],
  priorities: ['안정', '성장', '자율성'],
  constraints: []
};

export const DEFAULT_WEIGHTS = {
  emotion: 15,
  finance: 15,
  growth: 15,
  relationships: 10,
  health: 10,
  autonomy: 15,
  regret: 10,
  risk: 10
};

export const TURNS_BY_MODE = {
  quick: 6,
  standard: 12,
  deep: 24
};

export const ALLOWED_SCENARIO_DOMAINS = ['career', 'business', 'relationship', 'education', 'lifestyle', 'creative', 'health_routine', 'relocation', 'custom'];
export const ALLOWED_TIME_HORIZONS = ['3_months', '6_months', '1_year', '3_years', '5_years'];
export const ALLOWED_SIMULATION_MODES = ['quick', 'standard', 'deep'];
export const ALLOWED_TONES = ['practical', 'poetic', 'game_like', 'analyst'];
export const ALLOWED_RISK_TOLERANCE = ['low', 'medium', 'high'];
export const ALLOWED_UNCERTAINTY_TOLERANCE = ['low', 'medium', 'high'];
export const ALLOWED_OUTPUT_MODES = ['strategy_only', 'design_spec', 'implementation_pack', 'full_bundle'];

export const TIMELINE_UNIT_BY_HORIZON = {
  '3_months': '2_weeks',
  '6_months': '2_weeks',
  '1_year': '1_month',
  '3_years': '1_quarter',
  '5_years': '1_quarter'
};

export const DIMENSIONS = [
  { id: 'emotion', label: '행복감/정서 안정', direction: 'higher' },
  { id: 'finance', label: '수입/재정 안정', direction: 'higher' },
  { id: 'growth', label: '성장/실력 축적', direction: 'higher' },
  { id: 'relationships', label: '관계/사회적 연결', direction: 'higher' },
  { id: 'health', label: '건강/에너지', direction: 'higher' },
  { id: 'autonomy', label: '자율성/삶의 주도권', direction: 'higher' },
  { id: 'regret', label: '장기 후회 가능성', direction: 'lower' },
  { id: 'risk', label: '리스크 노출도', direction: 'lower' }
];

export const BRANCHES = ['optimistic', 'base', 'pessimistic'];

export const AGENTS = [
  { id: 'self_now', name: '현재의 나', purpose: '현재 욕구와 피로를 반영', weight: 0.18 },
  { id: 'self_future', name: '미래의 나', purpose: '장기 후회와 성장 관점을 반영', weight: 0.18 },
  { id: 'realist', name: '현실주의 조언자', purpose: '현실 제약과 실행 난도를 반영', weight: 0.14 },
  { id: 'optimist', name: '낙관주의 조언자', purpose: '기회 확대와 회복 탄력성을 반영', weight: 0.1 },
  { id: 'pessimist', name: '비관주의 조언자', purpose: '실패 가능성과 하방 리스크를 반영', weight: 0.1 },
  { id: 'market_env', name: '시장/환경 에이전트', purpose: '외부 환경 변화와 도메인 맥락을 반영', weight: 0.12 },
  { id: 'relationship', name: '관계 에이전트', purpose: '주변 사람과 사회적 연결 영향을 반영', weight: 0.1 },
  { id: 'chance', name: '우연/사건 생성 에이전트', purpose: '예상 밖 변수와 돌발 사건을 주입', weight: 0.08 }
];

export const MVP_BACKLOG = [
  { id: 'P0-1', priority: 'P0', title: 'A/B 입력 폼과 기본값 주입', owner_hint: 'Frontend', definition_of_done: '필수 입력만으로 실행 가능' },
  { id: 'P0-2', priority: 'P0', title: 'Baseline fairness 엔진', owner_hint: 'AI', definition_of_done: 'A/B 공통 baseline과 공통 노이즈 보장' },
  { id: 'P0-3', priority: 'P0', title: '3-branch 시뮬레이션 생성', owner_hint: 'AI', definition_of_done: '옵션별 optimistic/base/pessimistic 생성' },
  { id: 'P0-4', priority: 'P0', title: '점수/리스크/후회 계산기', owner_hint: 'AI', definition_of_done: '차원별 점수와 overall score 산출' },
  { id: 'P0-5', priority: 'P0', title: '결과 비교 화면', owner_hint: 'Frontend', definition_of_done: 'topline verdict와 표/타임라인 렌더링' },
  { id: 'P0-6', priority: 'P1', title: '로컬 저장 및 재실행', owner_hint: 'Frontend', definition_of_done: '최근 실행 결과 로컬 저장' },
  { id: 'P0-7', priority: 'P1', title: 'JSON appendix 다운로드', owner_hint: 'Frontend', definition_of_done: 'manifest/scorecard/graph/backlog export 가능' },
  { id: 'P0-8', priority: 'P1', title: '민감 도메인 가드레일 적용', owner_hint: 'AI', definition_of_done: '제한 문구와 비결정성 고지 포함' },
  { id: 'P0-9', priority: 'P1', title: '자동 테스트 불변식', owner_hint: 'Backend', definition_of_done: '정규화, 공정성, 점수 범위 테스트 통과' },
  { id: 'P0-10', priority: 'P2', title: 'PDF-ready export 가이드', owner_hint: 'PM', definition_of_done: '머지 문서 순서와 포맷 가이드 제공' }
];

export const UNCERTAINTY_DISCLOSURE = '이 결과는 제공된 입력과 기본 가정에 기반한 시뮬레이션이다. 실제 결과는 외부 변수와 실행 품질에 따라 달라질 수 있다.';
