const STORAGE_KEY = 'life-ab-test-runs';
let memoryRuns = [];

export function saveRun(run) {
  if (typeof localStorage === 'undefined') {
    memoryRuns.unshift(run);
    memoryRuns = memoryRuns.slice(0, 5);
    return;
  }

  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  existing.unshift(run);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(0, 5)));
}

export function loadRuns() {
  if (typeof localStorage === 'undefined') {
    return memoryRuns;
  }

  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}
