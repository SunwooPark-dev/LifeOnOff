import { z } from "zod";

import type { PossibilityExplorerInput } from "./types";

const LATEST_CHECKPOINT_KEY = "possibility-explorer:draft-resume:latest";
const BACKUP_CHECKPOINT_KEY = "possibility-explorer:draft-resume:backup";

const optionSchema = z.object({
  id: z.string(),
  label: z.string(),
  details: z.string(),
});

const draftInputSchema = z.object({
  question: z.string(),
  options: z.array(optionSchema).min(2).max(5),
  preferredOutcomes: z.string(),
  constraints: z.string(),
  criteriaWeights: z.record(z.string(), z.number().finite()),
  weightsConfirmed: z.boolean(),
});

const checkpointSchema = z.object({
  version: z.literal("v1"),
  savedAt: z.string().datetime({ offset: true }),
  input: draftInputSchema,
});

type DraftResumeCheckpoint = z.infer<typeof checkpointSchema>;

export type DraftResumeLoadResult =
  | {
      status: "empty";
      input?: undefined;
      savedAt?: undefined;
    }
  | {
      status: "restored-latest" | "restored-backup";
      input: PossibilityExplorerInput;
      savedAt: string;
    };

export interface DraftResumeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface MemoryDraftResumeStorage extends DraftResumeStorage {
  corruptLatest(value: string): void;
  corruptBackup(value: string): void;
}

function cloneInput(input: PossibilityExplorerInput): PossibilityExplorerInput {
  return {
    ...input,
    criteriaWeights: { ...input.criteriaWeights },
    options: input.options.map((option) => ({ ...option })),
  };
}

function parseCheckpoint(raw: string | null) {
  if (!raw) {
    return null;
  }

  try {
    return checkpointSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

function buildCheckpoint(input: PossibilityExplorerInput, savedAt: string): DraftResumeCheckpoint {
  return checkpointSchema.parse({
    version: "v1",
    savedAt,
    input: cloneInput(input),
  });
}

export function createMemoryStorage(): MemoryDraftResumeStorage {
  const store = new Map<string, string>();

  return {
    getItem(key) {
      return store.get(key) ?? null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
    corruptLatest(value) {
      store.set(LATEST_CHECKPOINT_KEY, value);
    },
    corruptBackup(value) {
      store.set(BACKUP_CHECKPOINT_KEY, value);
    },
  };
}

export const windowStorage: DraftResumeStorage = {
  getItem(key) {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem(key, value) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(key, value);
    } catch {
      // fail safe when storage is unavailable
    }
  },
  removeItem(key) {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.removeItem(key);
    } catch {
      // fail safe when storage is unavailable
    }
  },
};

export function saveDraftResumeCheckpoint(storage: DraftResumeStorage, input: PossibilityExplorerInput, savedAt = new Date().toISOString()) {
  const previousLatest = storage.getItem(LATEST_CHECKPOINT_KEY);

  if (previousLatest) {
    storage.setItem(BACKUP_CHECKPOINT_KEY, previousLatest);
  }

  const checkpoint = buildCheckpoint(input, savedAt);
  storage.setItem(LATEST_CHECKPOINT_KEY, JSON.stringify(checkpoint));

  return checkpoint;
}

export function loadDraftResumeCheckpoint(storage: DraftResumeStorage): DraftResumeLoadResult {
  const latest = parseCheckpoint(storage.getItem(LATEST_CHECKPOINT_KEY));

  if (latest) {
    return {
      status: "restored-latest",
      input: cloneInput(latest.input),
      savedAt: latest.savedAt,
    };
  }

  const latestRaw = storage.getItem(LATEST_CHECKPOINT_KEY);
  if (latestRaw) {
    storage.removeItem(LATEST_CHECKPOINT_KEY);
  }

  const backup = parseCheckpoint(storage.getItem(BACKUP_CHECKPOINT_KEY));

  if (backup) {
    storage.setItem(LATEST_CHECKPOINT_KEY, JSON.stringify(backup));
    return {
      status: "restored-backup",
      input: cloneInput(backup.input),
      savedAt: backup.savedAt,
    };
  }

  const backupRaw = storage.getItem(BACKUP_CHECKPOINT_KEY);
  if (backupRaw) {
    storage.removeItem(BACKUP_CHECKPOINT_KEY);
  }

  return {
    status: "empty",
  };
}

export function clearDraftResumeCheckpoint(storage: DraftResumeStorage) {
  storage.removeItem(LATEST_CHECKPOINT_KEY);
  storage.removeItem(BACKUP_CHECKPOINT_KEY);
}

export function hasDraftResumeCheckpoint(storage: DraftResumeStorage) {
  return storage.getItem(LATEST_CHECKPOINT_KEY) !== null || storage.getItem(BACKUP_CHECKPOINT_KEY) !== null;
}
