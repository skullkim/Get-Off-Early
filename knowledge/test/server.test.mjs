import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, safeResolve, runSearch, createGate, chatErrorResponse, ROOT } from '../web/server.mjs';

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

test('createGate admits up to max and refuses beyond, until released', () => {
  const gate = createGate(2);
  assert.equal(gate.tryAcquire(), true);
  assert.equal(gate.tryAcquire(), true);
  assert.equal(gate.tryAcquire(), false);  // full
  gate.release();
  assert.equal(gate.tryAcquire(), true);   // slot freed
});

test('chatErrorResponse maps tagged errors to actionable statuses', () => {
  assert.equal(chatErrorResponse({ code: 'CLAUDE_NOT_FOUND', message: 'claude CLI not found' }).status, 503);
  assert.equal(chatErrorResponse({ code: 'CHAT_TIMEOUT', message: 'chat timeout' }).status, 504);
  const other = chatErrorResponse(new Error('boom'));
  assert.equal(other.status, 500);
  assert.equal(other.body.error, 'boom');
});

function postChat(b) {
  return fetch(`${b}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'hi' }),
  });
}

test('POST /api/chat returns 429 while the concurrent limit is held, then recovers', async () => {
  let release;
  const blocked = new Promise((r) => { release = r; });
  const srv = createServer(ROOT, {
    chatFn: () => blocked.then(() => ({ answer: 'ok', sessionId: 's1' })),
    gate: createGate(1),
  });
  await new Promise((r) => srv.listen(0, r));
  const b = `http://localhost:${srv.address().port}`;
  try {
    const first = postChat(b);                          // occupies the single slot
    await new Promise((r) => setTimeout(r, 50));        // let it reach the gate
    assert.equal((await postChat(b)).status, 429);      // second refused, no spawn
    release();
    assert.equal((await first).status, 200);            // held request completes
    assert.equal((await postChat(b)).status, 200);      // slot released for new chats
  } finally {
    srv.close();
  }
});
