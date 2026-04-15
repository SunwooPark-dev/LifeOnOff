import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveStaticFilePath } from '../src/core/static-server.js';

test('static server blocks traversal outside allowed roots', () => {
  const rootDir = process.cwd();
  assert.equal(resolveStaticFilePath('/../README.md', { rootDir }), null);
  assert.equal(resolveStaticFilePath('/src/../../.git/config', { rootDir }), null);
  assert.equal(resolveStaticFilePath('/%2e%2e/README.md', { rootDir }), null);
  const safePath = resolveStaticFilePath('/src/ui/app.js', { rootDir });
  assert.ok(safePath?.endsWith('src\\ui\\app.js') || safePath?.endsWith('src/ui/app.js'));
});
