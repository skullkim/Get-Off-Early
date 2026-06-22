import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  classifyFile, extractReqIds, extractHeaders, parseCard,
  buildIndex, renderJson, renderMarkdown, findProjects,
  extractLinks, buildPatterns,
} from '../index-core.mjs';

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-'));
  const ws = path.join(root, 'demo', '_workspace');
  fs.mkdirSync(ws, { recursive: true });
  fs.writeFileSync(path.join(ws, '01_requirements.md'), '# Demo Reqs\nIt covers REQ-1 and REQ-2.\n');
  fs.writeFileSync(path.join(ws, '02_design.md'), '# Demo Design\n## Screen A\n');
  fs.writeFileSync(path.join(ws, 'BUILD_COMPLETE.md'), 'done');
  fs.writeFileSync(path.join(ws, '05_qa_report_round1.md'), '# QA r1');
  fs.mkdirSync(path.join(root, 'demo', 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'demo', 'src', 'App.tsx'), 'export const x = 1;');
  fs.mkdirSync(path.join(root, 'knowledge', 'cards'), { recursive: true });
  fs.writeFileSync(path.join(root, 'knowledge', 'cards', 'demo.md'),
    '---\ntype: Project Knowledge Card\nproject: demo\ntitle: 데모\nstatus: DONE\nstack: [Node]\ntags: [t1]\nsummary: 한줄\ntimestamp: 2026-06-19T00:00:00Z\n---\n## 핵심 결정\n- 결정1\n\n## 재사용 포인트\n- [데모 패턴](../patterns/demo-pattern.md)\n');
  fs.mkdirSync(path.join(root, 'knowledge', 'patterns'), { recursive: true });
  fs.writeFileSync(path.join(root, 'knowledge', 'patterns', 'demo-pattern.md'),
    '---\ntype: Reusable Pattern\ntitle: 데모 패턴\ntags: [t1]\ntimestamp: 2026-06-19T00:00:00Z\nsource_projects: [demo]\n---\n적용: [demo](../cards/demo.md)\n');
  return root;
}

test('classifyFile maps workspace docs and code', () => {
  assert.equal(classifyFile('shop/_workspace/01_requirements.md'), 'requirements');
  assert.equal(classifyFile('shop/_workspace/01b_seller_requirements.md'), 'requirements');
  assert.equal(classifyFile('shop/_workspace/02_design.md'), 'design');
  assert.equal(classifyFile('shop/_workspace/prototype/cart.html'), 'design');
  assert.equal(classifyFile('todo/_workspace/03_backend_architecture.md'), 'architecture');
  assert.equal(classifyFile('todo/_workspace/03b_frontend_component_specs.md'), 'architecture');
  assert.equal(classifyFile('todo/_workspace/04_coverage_matrix.md'), 'coverage');
  assert.equal(classifyFile('todo/_workspace/05_qa_report_round1.md'), 'qa');
  assert.equal(classifyFile('todo/_workspace/RESUME.md'), 'meta');
  assert.equal(classifyFile('todo/_workspace/BUILD_COMPLETE.md'), 'meta');
  assert.equal(classifyFile('todo/backend/src/Main.kt'), 'code');
  assert.equal(classifyFile('todo/frontend/src/App.tsx'), 'code');
  assert.equal(classifyFile('todo/frontend/src/global.css'), 'style');
  assert.equal(classifyFile('todo/frontend/public/logo.svg'), 'asset');
  assert.equal(classifyFile('todo/backend/build.gradle.kts'), 'code');
  assert.equal(classifyFile('todo/backend/application.yaml'), 'config');
});

test('extractReqIds dedupes and sorts', () => {
  assert.deepEqual(
    extractReqIds('REQ-3 then REQ-1, REQ-1 and REQ-AUTH-2 done'),
    ['REQ-1', 'REQ-3', 'REQ-AUTH-2']
  );
  assert.deepEqual(extractReqIds('no ids here'), []);
});

test('extractHeaders strips markdown hashes', () => {
  assert.deepEqual(
    extractHeaders('# Title\nbody\n## Sub A\ntext\n### deep'),
    ['Title', 'Sub A', 'deep']
  );
});

test('parseCard reads frontmatter and decision/gotcha bullets', () => {
  const card = [
    '---', 'project: shop', 'title: 미니샵', 'stack: [Kotlin, React]', 'tags: [pay, admin]',
    '---', '', '## 핵심 결정 (ADR 요약)', '- 멱등 결제키 사용', '- 주문 분할', '',
    '## API 계약 패턴', '- POST /orders', '', '## Gotcha / 반복 버그', '- TZ는 UTC Z',
  ].join('\n');
  const { frontmatter, highlights } = parseCard(card);
  assert.equal(frontmatter.title, '미니샵');
  assert.deepEqual(frontmatter.stack, ['Kotlin', 'React']);
  assert.deepEqual(frontmatter.tags, ['pay', 'admin']);
  assert.deepEqual(highlights, ['멱등 결제키 사용', '주문 분할', 'TZ는 UTC Z']);
});

test('findProjects detects _workspace dirs', () => {
  const root = fixture();
  assert.deepEqual(findProjects(root), ['demo']);
});

test('findProjects: 카드만 있고 _workspace 없는 외부 프로젝트도 인식', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-'));
  fs.mkdirSync(path.join(root, 'ext-proj', 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'ext-proj', 'src', 'a.js'), 'x');
  fs.mkdirSync(path.join(root, 'knowledge', 'cards'), { recursive: true });
  fs.writeFileSync(path.join(root, 'knowledge', 'cards', 'ext-proj.md'), '---\nproject: ext-proj\n---\n');
  assert.equal(findProjects(root).includes('ext-proj'), true);
});

test('findProjects: 카드도 _workspace도 없는 디렉터리는 제외', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fp2-'));
  fs.mkdirSync(path.join(root, 'random', 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'random', 'src', 'a.js'), 'x');
  assert.equal(findProjects(root).includes('random'), false);
});

test('buildIndex aggregates project, card, types, categories', () => {
  const root = fixture();
  const idx = buildIndex(root);
  assert.equal(idx.projects.length, 1);
  const p = idx.projects[0];
  assert.equal(p.id, 'demo');
  assert.equal(p.title, '데모');
  assert.deepEqual(p.stack, ['Node']);
  assert.equal(p.buildComplete, true);
  assert.equal(p.qaRounds, 1);
  assert.equal(p.card, 'knowledge/cards/demo.md');
  assert.deepEqual(p.highlights, ['결정1']);
  const reqArtifact = p.artifacts.find((a) => a.category === 'requirements');
  assert.deepEqual(reqArtifact.reqIds, ['REQ-1', 'REQ-2']);
  assert.equal(idx.fileTypes.md > 0, true);
  assert.equal(Array.isArray(idx.categories.code), true);
});

test('buildIndex is idempotent except generatedAt', () => {
  const root = fixture();
  const strip = (i) => ({ ...i, generatedAt: '' });
  assert.deepEqual(strip(buildIndex(root)), strip(buildIndex(root)));
});

test('renderMarkdown lists docs and summarizes code', () => {
  const md = renderMarkdown(buildIndex(fixture()));
  assert.match(md, /## demo — 데모/);
  assert.match(md, /\[requirements\] demo\/_workspace\/01_requirements\.md/);
  assert.match(md, /코드\/기타: 1개 \(1 tsx\)/);
});

test('renderJson is valid JSON', () => {
  const obj = JSON.parse(renderJson(buildIndex(fixture())));
  assert.equal(obj.projects[0].id, 'demo');
});

test('extractLinks parses markdown links', () => {
  assert.deepEqual(
    extractLinks('see [a](../patterns/x.md) and [b](y.md)'),
    [{ text: 'a', target: '../patterns/x.md' }, { text: 'b', target: 'y.md' }]
  );
  assert.deepEqual(extractLinks('no links here'), []);
});

test('buildPatterns reads pattern concept docs', () => {
  const pats = buildPatterns(fixture());
  assert.equal(pats.length, 1);
  assert.equal(pats[0].slug, 'demo-pattern');
  assert.equal(pats[0].type, 'Reusable Pattern');
  assert.equal(pats[0].title, '데모 패턴');
  assert.deepEqual(pats[0].sourceProjects, ['demo']);
  assert.equal(pats[0].path, 'knowledge/patterns/demo-pattern.md');
});

test('buildIndex includes patterns, project links, card type/timestamp', () => {
  const idx = buildIndex(fixture());
  assert.equal(idx.patterns.length, 1);
  const p = idx.projects[0];
  assert.equal(p.type, 'Project Knowledge Card');
  assert.equal(p.timestamp, '2026-06-19T00:00:00Z');
  assert.equal(p.links.some((l) => l.target.includes('patterns/demo-pattern.md')), true);
});

test('renderMarkdown shows patterns section and project links', () => {
  const md = renderMarkdown(buildIndex(fixture()));
  assert.match(md, /## 재사용 패턴/);
  assert.match(md, /데모 패턴/);
  assert.match(md, /관련 패턴\/지식:/);
});
