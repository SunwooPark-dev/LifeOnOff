import test from 'node:test';
import assert from 'node:assert/strict';
import { loadRuns, saveRun } from '../src/core/storage.js';

function withLocalStorage(mock, callback) {
  const original = globalThis.localStorage;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    writable: true,
    value: mock
  });

  try {
    callback();
  } finally {
    if (original === undefined) {
      delete globalThis.localStorage;
      return;
    }

    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      writable: true,
      value: original
    });
  }
}

test('storage recovers from invalid persisted JSON', () => {
  let persisted = 'not-json';

  withLocalStorage({
    getItem() {
      return persisted;
    },
    setItem(_key, value) {
      persisted = value;
    }
  }, () => {
    assert.deepEqual(loadRuns(), []);
    saveRun({ title: 'recover-test', verdict: 'ok' });
    assert.equal(JSON.parse(persisted)[0].title, 'recover-test');
    assert.equal(loadRuns()[0].title, 'recover-test');
  });
});

test('storage falls back to in-memory history when localStorage access throws', () => {
  withLocalStorage({
    getItem() {
      throw new Error('denied');
    },
    setItem() {
      throw new Error('denied');
    }
  }, () => {
    saveRun({ title: 'memory-fallback', verdict: 'ok' });
    assert.equal(loadRuns()[0].title, 'memory-fallback');
  });
});
