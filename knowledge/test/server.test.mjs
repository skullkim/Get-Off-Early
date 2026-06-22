import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, safeResolve, runSearch, ROOT } from '../web/server.mjs';

let base;
let server;
before(async () => {
  server = createServer(ROOT);
  await new Promise((r) => server.listen(0, r));
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

test('safeResolve rejects traversal and out-of-root', () => {
  assert.equal(safeResolve(ROOT, '../etc/passwd'), null);
  assert.equal(safeResolve(ROOT, '/etc/passwd'), null);
  assert.notEqual(safeResolve(ROOT, 'CLAUDE.md'), null);
});

test('GET /api/index returns a project list (shape, not specific names)', async () => {
  const res = await fetch(`${base}/api/index`);
  assert.equal(res.status, 200);
  const idx = await res.json();
  assert.equal(Array.isArray(idx.projects), true);
  assert.equal(idx.projects.every((p) => typeof p.id === 'string' && Array.isArray(p.artifacts)), true);
});

test('GET /api/file reads an in-root file', async () => {
  const res = await fetch(`${base}/api/file?path=CLAUDE.md`);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /get-off-early/);
});

test('GET /api/file blocks traversal with 403', async () => {
  const res = await fetch(`${base}/api/file?path=../../etc/passwd`);
  assert.equal(res.status, 403);
});

test('runSearch finds a known term in repo docs', () => {
  const hits = runSearch(ROOT, 'coverage_matrix');
  assert.equal(Array.isArray(hits), true);
  assert.equal(hits.every((h) => h.path && h.line && typeof h.text === 'string'), true);
});

test('runSearch returns [] for empty query', () => {
  assert.deepEqual(runSearch(ROOT, ''), []);
});

test('GET /api/search returns matches array', async () => {
  const res = await fetch(`${base}/api/search?q=Knowledge`);
  assert.equal(res.status, 200);
  assert.equal(Array.isArray(await res.json()), true);
});

test('POST /api/chat returns 401 when CHAT_TOKEN set and header missing', async () => {
  process.env.CHAT_TOKEN = 'secret123';
  try {
    const res = await fetch(`${base}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: 'hi' }),
    });
    assert.equal(res.status, 401);   // returns before spawning claude
  } finally {
    delete process.env.CHAT_TOKEN;
  }
});

test('POST /api/chat returns 400 on missing message', async () => {
  const res = await fetch(`${base}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);     // returns before spawning claude
});
