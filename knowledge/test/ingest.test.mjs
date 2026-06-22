import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildCardPrompt, buildIngestArgs, stripFences, extractCard, validateCard } from '../ingest.mjs';

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
