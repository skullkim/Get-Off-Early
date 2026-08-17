import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  classifyFile, extractReqIds, extractHeaders, parseCard,
  buildIndex, renderJson, renderMarkdown, findProjects,
  extractLinks, buildPatterns,
  DOMAINS, normalizeDomains, extractSummary, groupPatternsByDomain,
} from '../index-core.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

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

// --- 분야(domain) 축 ---------------------------------------------------------

// 분야별 패턴 문서만 담은 최소 루트 (분류 축 전용 픽스처)
function patternsFixture(docs) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dom-'));
  const dir = path.join(root, 'knowledge', 'patterns');
  fs.mkdirSync(dir, { recursive: true });
  for (const [slug, text] of Object.entries(docs)) fs.writeFileSync(path.join(dir, `${slug}.md`), text);
  return root;
}

test('DOMAINS는 5개 분류 축(backend·frontend·qa·process·infra)', () => {
  assert.deepEqual(DOMAINS, ['backend', 'frontend', 'qa', 'process', 'infra']);
});

test('normalizeDomains: 배열/단일값/공백/중복 정규화 + 분류 축 순서로 정렬', () => {
  assert.deepEqual(normalizeDomains(['qa', 'backend']), ['backend', 'qa']);
  assert.deepEqual(normalizeDomains('backend'), ['backend']);
  assert.deepEqual(normalizeDomains([' Backend ', 'backend']), ['backend']);
  assert.deepEqual(normalizeDomains(undefined), []);
  // 미지 분야는 버리지 않고 알려진 축 뒤에 붙인다(오타를 삼키지 않기 위해)
  assert.deepEqual(normalizeDomains(['mystery', 'process']), ['process', 'mystery']);
});

test('extractSummary: frontmatter·헤딩을 건너뛴 첫 본문 줄, 마크다운 장식 제거', () => {
  const text = '---\ntitle: T\n---\n\n# 문제\n**동시** 구매 경합에서 [락](x.md)이 필요하다.\n\n# 정석\n- ...\n';
  assert.equal(extractSummary(text), '동시 구매 경합에서 락이 필요하다.');
  assert.equal(extractSummary('# 제목만 있음\n'), '');
  assert.equal(extractSummary(`---\ntitle: T\n---\n${'가'.repeat(200)}\n`, 40).length, 40);
});

test('buildPatterns: domain·sources·summary 파싱 (source_projects는 레거시 별칭)', () => {
  const root = patternsFixture({
    'a': '---\ntitle: A\ndomain: [backend, qa]\nsources: [alpha, beta]\n---\n# 원칙\n한 줄 요약.\n',
    'b': '---\ntitle: B\nsource_projects: [gamma]\n---\n# 원칙\nB 요약.\n',
  });
  const [a, b] = buildPatterns(root);
  assert.deepEqual(a.domain, ['backend', 'qa']);
  assert.deepEqual(a.sources, ['alpha', 'beta']);
  assert.equal(a.summary, '한 줄 요약.');
  assert.deepEqual(b.domain, []);
  assert.deepEqual(b.sources, ['gamma']);
  assert.deepEqual(b.sourceProjects, ['gamma']); // 하위 호환 필드 유지
});

test('groupPatternsByDomain: 분류 축 순서로 그룹, 다분야 패턴은 각 그룹에 등장, 미분류 분리', () => {
  const groups = groupPatternsByDomain([
    { slug: 'x', domain: ['qa', 'backend'] },
    { slug: 'y', domain: ['backend'] },
    { slug: 'z', domain: [] },
  ]);
  assert.deepEqual(groups.map((g) => g.domain), ['backend', 'qa', '(미분류)']);
  assert.deepEqual(groups[0].patterns.map((p) => p.slug), ['x', 'y']);
  assert.deepEqual(groups[1].patterns.map((p) => p.slug), ['x']);
  assert.deepEqual(groups[2].patterns.map((p) => p.slug), ['z']);
});

test('renderMarkdown: 패턴 섹션을 분야별 그룹(### backend …)으로 렌더', () => {
  const root = patternsFixture({
    'lock': '---\ntitle: 비관적 락\ndomain: [backend]\nsources: [alpha]\n---\n# 문제\n오버셀을 막는다.\n',
    'e2e': '---\ntitle: 실브라우저 E2E\ndomain: [qa]\nsources: [beta]\n---\n# 원칙\n그린 != 통합.\n',
  });
  const md = renderMarkdown(buildIndex(root));
  assert.match(md, /## 재사용 패턴/);
  assert.match(md, /### backend\n- 비관적 락 — 오버셀을 막는다\./);
  assert.match(md, /### qa\n- 실브라우저 E2E — 그린 != 통합\./);
  assert.match(md, /출처: alpha/);
  assert.ok(md.indexOf('### backend') < md.indexOf('### qa'), '분류 축 순서대로');
});

test('buildIndex/renderJson: 패턴에 domain·sources 포함', () => {
  const root = patternsFixture({
    'lock': '---\ntitle: 비관적 락\ndomain: [backend]\nsources: [alpha]\n---\n# 문제\n오버셀.\n',
  });
  const obj = JSON.parse(renderJson(buildIndex(root)));
  assert.deepEqual(obj.patterns[0].domain, ['backend']);
  assert.deepEqual(obj.patterns[0].sources, ['alpha']);
  assert.equal(obj.patterns[0].summary, '오버셀.');
});

test('레포의 모든 패턴 문서는 유효한 domain과 출처 카드를 갖는다', () => {
  const pats = buildPatterns(REPO_ROOT);
  assert.ok(pats.length >= 6, `패턴 문서가 있어야 한다 (현재 ${pats.length})`);
  for (const pat of pats) {
    assert.ok(pat.domain.length > 0, `${pat.slug}: domain 누락`);
    for (const d of pat.domain) assert.ok(DOMAINS.includes(d), `${pat.slug}: 미지 분야 ${d}`);
    assert.ok(pat.sources.length > 0, `${pat.slug}: sources 누락`);
    for (const s of pat.sources) {
      assert.ok(
        fs.existsSync(path.join(REPO_ROOT, 'knowledge', 'cards', `${s}.md`)),
        `${pat.slug}: 출처 ${s} 의 카드 없음`
      );
    }
    assert.ok(pat.summary.length > 0, `${pat.slug}: 요약 추출 실패`);
  }
});
