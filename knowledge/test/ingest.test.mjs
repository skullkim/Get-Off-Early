import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildCardPrompt, buildIngestArgs, stripFences, extractCard, validateCard, buildRetryPrompt, ingest } from '../ingest.mjs';

test('buildCardPrompt: 프로젝트명과 필수 스키마 키·읽기전용·펜스금지 지시 포함', () => {
  const p = buildCardPrompt('acme');
  assert.match(p, /acme/);
  for (const k of ['type', 'project', 'title', 'status', 'stack', 'summary', 'tags', 'timestamp']) {
    assert.match(p, new RegExp(k));
  }
  assert.match(p, /Read|Grep|Glob/);
  assert.match(p, /코드펜스|펜스|```/);
});

test('buildIngestArgs: 읽기전용 툴 + json + 해석된 모델', () => {
  const args = buildIngestArgs({ message: 'M', model: 'opus' });
  assert.deepEqual([args[0], args[1]], ['-p', 'M']);
  assert.equal(args[args.indexOf('--model') + 1], 'claude-opus-4-8');
  assert.equal(args.join(' ').includes('Read Grep Glob'), true);
  assert.equal(args.includes('--output-format'), true);
  assert.equal(args.join(' ').includes('Bash'), true);
});

test('stripFences: 코드펜스 래핑 제거', () => {
  assert.equal(stripFences('```markdown\n---\na: 1\n---\n```'), '---\na: 1\n---');
  assert.equal(stripFences('  ---\nx\n---  '), '---\nx\n---');
});

test('extractCard: claude json 결과에서 카드 추출', () => {
  const stdout = JSON.stringify({ result: '```\n---\nproject: x\n---\nbody\n```', session_id: 's' });
  assert.equal(extractCard(stdout), '---\nproject: x\n---\nbody');
});

test('validateCard: 필수 키 누락 감지', () => {
  const good = '---\ntype: Project Knowledge Card\nproject: x\ntitle: t\nstatus: DONE\nstack: [a]\nsummary: s\ntags: [a]\ntimestamp: 2026-01-01T00:00:00Z\n---\n# h';
  assert.equal(validateCard(good).ok, true);
  assert.equal(validateCard('no frontmatter').ok, false);
  assert.equal(validateCard('---\nproject: x\n---').ok, false);
});

// --- Actor-Critic 교정 재시도 (validateCard = 결정적 critic) ---

const OK_CARD = [
  '---',
  'type: Project Knowledge Card',
  'project: demo',
  'title: 데모',
  'status: DONE',
  'stack: [node]',
  'summary: 요약.',
  'tags: [demo]',
  'timestamp: 2026-08-23T00:00:00Z',
  '---',
  '',
  '## 핵심 결정',
].join('\n');

const BAD_CARD = ['---', 'type: Project Knowledge Card', 'project: demo', 'title: 데모', '---', '', '## 핵심 결정'].join('\n');

function makeRoot(name = 'demo') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ingest-'));
  fs.mkdirSync(path.join(root, name), { recursive: true });
  fs.mkdirSync(path.join(root, 'knowledge', 'cards'), { recursive: true });
  return root;
}

test('buildRetryPrompt: 원래 지시 + 실패 카드 원문 + 검증 오류 + 형식 교정 지시', () => {
  const original = buildCardPrompt('demo');
  const p = buildRetryPrompt(original, BAD_CARD, 'missing keys: status, stack');
  assert.equal(p.includes(original), true);          // 원래 지시를 잃지 않는다
  assert.equal(p.includes(BAD_CARD), true);          // 재분석이 아니라 방금 카드의 교정
  assert.match(p, /검증 실패/);
  assert.match(p, /missing keys: status, stack/);
  assert.match(p, /나머지 내용은 유지/);
  assert.match(p, /---/);
});

test('ingest: 1차 검증 통과면 재시도 없이 저장 (generateFn 1회)', async () => {
  const root = makeRoot();
  const calls = [];
  const dest = await ingest({
    name: 'demo', root, generateFn: (opts) => { calls.push(opts); return Promise.resolve(OK_CARD); },
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].cwd, path.join(root, 'demo'));
  assert.equal(calls[0].message, buildCardPrompt('demo'));
  assert.equal(dest, path.join(root, 'knowledge', 'cards', 'demo.md'));
  assert.equal(fs.readFileSync(dest, 'utf8'), OK_CARD + '\n');
});

test('ingest: 1차 불합격 → 검증 오류·실패 카드를 되먹인 재시도 1회 → 2차 성공 시 저장', async () => {
  const root = makeRoot();
  const calls = [];
  const dest = await ingest({
    name: 'demo', root, model: 'opus',
    generateFn: (opts) => { calls.push(opts); return Promise.resolve(calls.length === 1 ? BAD_CARD : OK_CARD); },
  });
  assert.equal(calls.length, 2);
  const retry = calls[1].message;
  assert.equal(retry.includes(BAD_CARD), true);                       // 실패 카드 원문 전달
  assert.match(retry, /missing keys: .*status/);                      // critic 판정 전달
  assert.equal(retry.includes(buildCardPrompt('demo')), true);
  assert.equal(calls[1].model, 'opus');                               // 모델 설정 유지
  assert.equal(fs.readFileSync(dest, 'utf8'), OK_CARD + '\n');
});

test('ingest: 2차도 불합격이면 최종 실패 — 에러에 1·2차 사유 모두, 카드 미저장', async () => {
  const root = makeRoot();
  let n = 0;
  await assert.rejects(
    ingest({ name: 'demo', root, generateFn: () => { n += 1; return Promise.resolve(n === 1 ? BAD_CARD : 'frontmatter 없는 응답'); } }),
    (e) => {
      assert.match(e.message, /missing keys/);        // 1차 사유
      assert.match(e.message, /frontmatter 없음/);     // 2차 사유
      return true;
    });
  assert.equal(n, 2);                                                        // 재시도 상한 1회
  assert.equal(fs.existsSync(path.join(root, 'knowledge', 'cards', 'demo.md')), false);
});
