import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateAnswer, runEval, formatReport, selectChatFn } from '../eval/run.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('evaluateAnswer passes when every group matches, case-insensitively', () => {
  const r = evaluateAnswer('CORS 처리는 cors-done-right 패턴 참고', [['CORS'], ['패턴']]);
  assert.equal(r.passed, true);
  assert.deepEqual(r.missing, []);
});

test('evaluateAnswer accepts any alternative within a group (OR), requires all groups (AND)', () => {
  const ok = evaluateAnswer('락은 정렬된 순서로 잡는다', [['ordering', '정렬'], ['락']]);
  assert.equal(ok.passed, true);
  const miss = evaluateAnswer('락 이야기만 있음', [['ordering', '정렬'], ['락']]);
  assert.equal(miss.passed, false);
  assert.deepEqual(miss.missing, [['ordering', '정렬']]);
});

test('runEval evaluates each case through the injected chatFn and keeps order', async () => {
  const seen = [];
  const chatFn = async ({ message }) => {
    seen.push(message);
    return { answer: message.includes('cors') ? 'cors-done-right 문서가 있다' : '모른다', sessionId: 's' };
  };
  const cases = [
    { id: 'a', question: 'cors 패턴 있어?', mustInclude: [['cors']] },
    { id: 'b', question: '락 패턴 있어?', mustInclude: [['정렬']] },
  ];
  const summary = await runEval(cases, chatFn, { root: '/tmp' });
  assert.deepEqual(seen, ['cors 패턴 있어?', '락 패턴 있어?']);   // sequential, in order
  assert.equal(summary.total, 2);
  assert.equal(summary.passed, 1);
  assert.equal(summary.failed, 1);
  assert.deepEqual(summary.results.map((r) => r.id), ['a', 'b']);
});

test('runEval marks a throwing chatFn call as failed without crashing the run', async () => {
  const chatFn = async () => { throw new Error('spawn blew up'); };
  const summary = await runEval([{ id: 'x', question: 'q', mustInclude: [['k']] }], chatFn, { root: '/tmp' });
  assert.equal(summary.failed, 1);
  assert.match(summary.results[0].error, /spawn blew up/);
});

test('formatReport shows per-case marks and the pass count', () => {
  const report = formatReport({
    total: 2, passed: 1, failed: 1,
    results: [
      { id: 'a', passed: true, ms: 1200 },
      { id: 'b', passed: false, missing: [['정렬']], ms: 900 },
    ],
  });
  assert.match(report, /✓ a/);
  assert.match(report, /✗ b/);
  assert.match(report, /1\/2/);
});

test('runEval defaults to a single attempt per case', async () => {
  let calls = 0;
  const chatFn = async () => { calls++; return { answer: 'cors 문서가 있다', sessionId: 's' }; };
  const summary = await runEval([{ id: 'a', question: 'q', mustInclude: [['cors']] }], chatFn, { root: '/tmp' });
  assert.equal(calls, 1);
  assert.equal(summary.results[0].passed, true);
  assert.equal(summary.results[0].consistency, undefined);   // repeat 없으면 표기도 없음
});

test('runEval with repeat runs each case N times and requires all passes (consistency)', async () => {
  let calls = 0;
  // 2번째 시도만 엉뚱한 답 → 확률적 비일관 시뮬레이션
  const chatFn = async () => { calls++; return { answer: calls === 2 ? '엉뚱한 답' : 'cors 문서', sessionId: 's' }; };
  const summary = await runEval([{ id: 'a', question: 'q', mustInclude: [['cors']] }], chatFn, { root: '/tmp', repeat: 3 });
  assert.equal(calls, 3);
  assert.equal(summary.results[0].passed, false);            // 3회 중 1회라도 실패 = 비일관 → 실패
  assert.equal(summary.results[0].consistency, '2/3');
  assert.equal(summary.failed, 1);
});

test('formatReport shows consistency when repeat was used', () => {
  const report = formatReport({
    total: 1, passed: 0, failed: 1,
    results: [{ id: 'a', passed: false, missing: [], consistency: '2/3', ms: 900 }],
  });
  assert.match(report, /2\/3/);
});

test('selectChatFn picks the streaming path only with --stream', () => {
  const chat = () => {}, chatStream = () => {};
  assert.equal(selectChatFn(['node', 'run.mjs'], { chat, chatStream }), chat);
  assert.equal(selectChatFn(['node', 'run.mjs', '--stream'], { chat, chatStream }), chatStream);
});

test('golden.json cases all have id, question, and non-empty mustInclude groups', () => {
  const golden = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'eval', 'golden.json'), 'utf8'));
  assert.equal(Array.isArray(golden) && golden.length > 0, true);
  for (const c of golden) {
    assert.equal(typeof c.id, 'string');
    assert.equal(c.question.trim().length > 0, true);
    assert.equal(Array.isArray(c.mustInclude) && c.mustInclude.length > 0, true);
    for (const group of c.mustInclude) {
      assert.equal(Array.isArray(group) && group.length > 0, true);
      assert.equal(group.every((alt) => typeof alt === 'string' && alt.length > 0), true);
    }
  }
});
