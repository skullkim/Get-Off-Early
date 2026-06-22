import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { projectsMissingCards } from '../ingest-missing.mjs';

test('projectsMissingCards: 디렉터리 있고 카드 없는 것만', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'im-'));
  fs.mkdirSync(path.join(root, 'has-card'));
  fs.mkdirSync(path.join(root, 'no-card'));
  fs.mkdirSync(path.join(root, 'knowledge', 'cards'), { recursive: true });
  fs.writeFileSync(path.join(root, 'knowledge', 'cards', 'has-card.md'), '---\nproject: has-card\n---\n');
  const res = projectsMissingCards(
    [{ name: 'has-card' }, { name: 'no-card' }, { name: 'not-cloned' }], root);
  assert.deepEqual(res.map((r) => r.name), ['no-card']);
});
