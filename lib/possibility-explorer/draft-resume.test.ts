import { beforeEach, describe, expect, it } from "vitest";

import { cloneDefaultInput, updateDraftQuestion } from "@/lib/possibility-explorer/input-draft";
import {
  clearDraftResumeCheckpoint,
  createMemoryStorage,
  hasDraftResumeCheckpoint,
  loadDraftResumeCheckpoint,
  saveDraftResumeCheckpoint,
} from "@/lib/possibility-explorer/draft-resume";

describe("draft resume checkpoint persistence", () => {
  beforeEach(() => {
    // no shared state between tests
  });

  it("saves a latest checkpoint that can be restored", () => {
    const storage = createMemoryStorage();
    const input = updateDraftQuestion(cloneDefaultInput(), "Which dinner plan should I pick if I am exhausted?");

    saveDraftResumeCheckpoint(storage, input, "2026-04-18T00:30:00.000Z");

    const restored = loadDraftResumeCheckpoint(storage);

    expect(restored.status).toBe("restored-latest");
    expect(restored.input?.question).toBe("Which dinner plan should I pick if I am exhausted?");
    expect(restored.savedAt).toBe("2026-04-18T00:30:00.000Z");
  });

  it("rotates the previous latest checkpoint into backup before saving a new one", () => {
    const storage = createMemoryStorage();

    saveDraftResumeCheckpoint(storage, updateDraftQuestion(cloneDefaultInput(), "First question"), "2026-04-18T00:30:00.000Z");
    saveDraftResumeCheckpoint(storage, updateDraftQuestion(cloneDefaultInput(), "Second question"), "2026-04-18T00:31:00.000Z");

    storage.corruptLatest('{"broken": true');

    const restored = loadDraftResumeCheckpoint(storage);

    expect(restored.status).toBe("restored-backup");
    expect(restored.input?.question).toBe("First question");
    expect(restored.savedAt).toBe("2026-04-18T00:30:00.000Z");
  });

  it("promotes a recovered backup checkpoint back into latest storage for the next load", () => {
    const storage = createMemoryStorage();

    saveDraftResumeCheckpoint(storage, updateDraftQuestion(cloneDefaultInput(), "First question"), "2026-04-18T00:30:00.000Z");
    saveDraftResumeCheckpoint(storage, updateDraftQuestion(cloneDefaultInput(), "Second question"), "2026-04-18T00:31:00.000Z");

    storage.corruptLatest('{"broken": true');

    const firstLoad = loadDraftResumeCheckpoint(storage);
    const secondLoad = loadDraftResumeCheckpoint(storage);

    expect(firstLoad.status).toBe("restored-backup");
    expect(secondLoad.status).toBe("restored-latest");
    expect(secondLoad.input?.question).toBe("First question");
    expect(secondLoad.savedAt).toBe("2026-04-18T00:30:00.000Z");
  });

  it("returns empty when both latest and backup checkpoints are invalid", () => {
    const storage = createMemoryStorage();

    storage.corruptLatest('{"broken": true');
    storage.corruptBackup("not-json");

    const restored = loadDraftResumeCheckpoint(storage);

    expect(restored.status).toBe("empty");
    expect(restored.input).toBeUndefined();
    expect(restored.savedAt).toBeUndefined();
  });

  it("clears both checkpoints when requested", () => {
    const storage = createMemoryStorage();

    saveDraftResumeCheckpoint(storage, cloneDefaultInput(), "2026-04-18T00:30:00.000Z");

    clearDraftResumeCheckpoint(storage);

    expect(loadDraftResumeCheckpoint(storage).status).toBe("empty");
  });

  it("reports whether any saved draft checkpoint exists", () => {
    const storage = createMemoryStorage();

    expect(hasDraftResumeCheckpoint(storage)).toBe(false);

    saveDraftResumeCheckpoint(storage, cloneDefaultInput(), "2026-04-18T01:00:00.000Z");
    expect(hasDraftResumeCheckpoint(storage)).toBe(true);

    clearDraftResumeCheckpoint(storage);
    expect(hasDraftResumeCheckpoint(storage)).toBe(false);
  });
});
