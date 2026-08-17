import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer, safeResolve, runSearch, createGate, chatErrorResponse, readSuggestions, ROOT } from '../web/server.mjs';

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

// 빈 임시 루트로 서버를 띄워, 파일이 없는 상태의 응답을 검사한다.
async function withServer(root, fn) {
  const srv = createServer(root);
  await new Promise((r) => srv.listen(0, r));
  try {
    return await fn(`http://localhost:${srv.address().port}`);
  } finally {
    srv.close();
  }
}

test('GET /api/suggestions returns golden questions as plain strings', async () => {
  const res = await fetch(`${base}/api/suggestions`);
  assert.equal(res.status, 200);
  const list = await res.json();
  assert.equal(Array.isArray(list), true);
  assert.ok(list.length > 0);
  assert.equal(list.every((q) => typeof q === 'string' && q.trim().length > 0), true);
});

test('GET /api/suggestions never leaks eval internals (id·mustInclude)', async () => {
  const raw = await (await fetch(`${base}/api/suggestions`)).text();
  assert.equal(/mustInclude/.test(raw), false);   // 정답 키워드가 노출되면 평가가 무의미해진다
  assert.equal(/"id"/.test(raw), false);
});

test('GET /api/suggestions returns [] when golden.json is missing', async () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), 'sugg-'));
  await withServer(empty, async (b) => {
    const res = await fetch(`${b}/api/suggestions`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), []);
  });
});

test('readSuggestions tolerates malformed golden.json', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sugg-bad-'));
  fs.mkdirSync(path.join(root, 'knowledge', 'eval'), { recursive: true });
  fs.writeFileSync(path.join(root, 'knowledge', 'eval', 'golden.json'), '{ not json');
  assert.deepEqual(readSuggestions(root), []);
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

// ---- streaming chat (NDJSON: one JSON event per line) ----

function postStream(b, extra = {}) {
  return fetch(`${b}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message: 'hi', stream: true, ...extra }),
  });
}

const events = (text) => text.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));

async function withStreamServer(deps, fn) {
  const srv = createServer(ROOT, deps);
  await new Promise((r) => srv.listen(0, r));
  try {
    return await fn(`http://localhost:${srv.address().port}`);
  } finally {
    srv.close();
  }
}

test('POST /api/chat stream:true flushes deltas before the answer is complete', async () => {
  let release;
  const blocked = new Promise((r) => { release = r; });
  await withStreamServer({
    chatStreamFn: async ({ onDelta }) => {
      onDelta('안녕');
      onDelta('하세요');
      await blocked;                                   // 답변은 아직 끝나지 않았다
      return { answer: '안녕하세요', sessionId: 'sess-9' };
    },
  }, async (b) => {
    const res = await postStream(b);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /ndjson/);

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (!buf.includes('하세요')) {                  // 완료 전에 델타가 도착해야 한다
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
    }
    assert.deepEqual(events(buf).map((e) => e.type), ['delta', 'delta']);
    assert.deepEqual(events(buf).map((e) => e.text), ['안녕', '하세요']);

    release();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
    }
    const all = events(buf);
    assert.deepEqual(all.at(-1), { type: 'done', answer: '안녕하세요', sessionId: 'sess-9' });
  });
});

test('POST /api/chat stream:true reports a mid-stream failure as an error event', async () => {
  await withStreamServer({
    chatStreamFn: async ({ onDelta }) => {
      onDelta('부');
      throw Object.assign(new Error('claude CLI not found'), { code: 'CLAUDE_NOT_FOUND' });
    },
  }, async (b) => {
    const res = await postStream(b);
    assert.equal(res.status, 200);                     // 헤더는 이미 나갔으므로 상태로는 못 알린다
    const all = events(await res.text());
    assert.deepEqual(all[0], { type: 'delta', text: '부' });
    assert.equal(all.at(-1).type, 'error');
    assert.equal(all.at(-1).status, 503);              // chatErrorResponse 매핑을 그대로 재사용
  });
});

test('POST /api/chat stream:true refuses over the concurrency gate with 429 JSON, not a stream', async () => {
  let release;
  const blocked = new Promise((r) => { release = r; });
  await withStreamServer({
    chatStreamFn: () => blocked.then(() => ({ answer: 'ok', sessionId: 's1' })),
    gate: createGate(1),
  }, async (b) => {
    const first = postStream(b);                       // 유일한 슬롯 점유
    await new Promise((r) => setTimeout(r, 50));
    const refused = await postStream(b);
    assert.equal(refused.status, 429);
    assert.match(refused.headers.get('content-type'), /json/);   // 스트림을 열기 전에 거절
    assert.ok((await refused.json()).error);
    release();
    await (await first).text();
    assert.equal((await postStream(b)).status, 200);   // 슬롯 반납 확인
  });
});

test('POST /api/chat stream:true still rejects an empty message with 400', async () => {
  await withStreamServer({ chatStreamFn: async () => assert.fail('must not spawn') }, async (b) => {
    const res = await postStream(b, { message: '  ' });
    assert.equal(res.status, 400);
  });
});

test('POST /api/chat without stream keeps the single-shot JSON response', async () => {
  await withStreamServer({
    chatFn: async () => ({ answer: '단발', sessionId: 's2' }),
    chatStreamFn: async () => assert.fail('stream path must not be used'),
  }, async (b) => {
    const res = await postChat(b);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type'), /json/);
    assert.deepEqual(await res.json(), { answer: '단발', sessionId: 's2' });
  });
});

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
