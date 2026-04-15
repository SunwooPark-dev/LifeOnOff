const STORAGE_KEY = 'life-ab-test-runs';
let memoryRuns = [];

function clampRuns(runs) {
  return runs
    .filter((run) => run && typeof run === 'object')
    .slice(0, 5);
}

function resolveStorage() {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function readStoredRuns(storage) {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { ok: true, runs: [] };
    const parsed = JSON.parse(raw);
    return { ok: true, runs: Array.isArray(parsed) ? clampRuns(parsed) : [] };
  } catch {
    return { ok: false, runs: [] };
  }
}

export function saveRun(run) {
  const storage = resolveStorage();
  if (!storage) {
    memoryRuns = clampRuns([run, ...memoryRuns]);
    return;
  }

  const existing = readStoredRuns(storage);
  const nextRuns = clampRuns([run, ...(existing.ok ? existing.runs : memoryRuns)]);

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(nextRuns));
  } catch {
    // Fall back to in-memory history when storage is unavailable or corrupted.
  }

  memoryRuns = nextRuns;
}

export function loadRuns() {
  const storage = resolveStorage();
  if (!storage) {
    return memoryRuns;
  }

  const stored = readStoredRuns(storage);
  return stored.ok ? stored.runs : memoryRuns;
}
