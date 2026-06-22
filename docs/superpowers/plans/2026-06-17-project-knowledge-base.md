# Project Knowledge Base Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** project-loop 의 누적 산출물을 클로드가 빠르게 조회·재사용하고(1순위), 사람이 웹으로 열람(2순위)하는 DB-free 지식 베이스를 만든다.

**Architecture:** 파일시스템이 단일 원본. `index-core.mjs`(순수 스캔→데이터)를 생성기·서버·스킬이 공유한다. 클로드는 생성된 `INDEX.md`(카탈로그+카드 요약)를 Read 후 원본 드릴다운. 사람은 의존성 0 Node 서버(`/api/index` 매 요청 재생성·`/api/file`·`/api/search`=ripgrep) + 바닐라 SPA로 본다.

**Tech Stack:** Node ≥20 (ESM `.mjs`, 내장 `http`/`fs`/`child_process`, `node:test`, 글로벌 `fetch`), 프론트=바닐라 JS + CDN `marked`/`highlight.js`, 본문검색=`rg`(ripgrep, 폴백 내장). npm 의존성·번들러·DB·검색엔진 없음.

## Global Constraints

- **의존성 0**: npm 패키지/번들러 금지. Node 내장 모듈 + 프론트는 CDN `<script>`만.
- **ESM `.mjs`** 파일. Node ≥20 (글로벌 `fetch`, `node:test`).
- **DB·엘라스틱서치 없음**: 원본은 파일, `index.json`은 파생 색인. 본문검색은 `rg` on-demand.
- **파일 API 보안**: `/api/file`·정적 서빙은 `path.resolve` 후 허용 루트 밖이면 403. (테스트로 강제.)
- **스캔 제외 디렉터리**: `node_modules build .gradle dist .git .idea` (모든 walk에서 동일).
- **이 디렉터리는 git 리포가 아님** — 각 태스크 종료 = `node --test` 통과 검증으로 갈음. 버전관리가 필요하면 사용자 요청 시 `git init` 후 커밋.
- **포트**: 기본 4178 (`PORT` 환경변수로 override).
- **저장소 루트**: `/Users/skull/Documents/practice/project-loop` (서버에서 `knowledge/web/` 기준 `../../`).

---

## File Structure

| 파일 | 책임 |
|---|---|
| `knowledge/index-core.mjs` | 순수 스캔→데이터: `classifyFile`,`extractReqIds`,`extractHeaders`,`parseCard`,`findProjects`,`buildProject`,`buildIndex`,`renderJson`,`renderMarkdown` |
| `knowledge/generate.mjs` | CLI: `buildIndex(root)`→ `index.json`+`INDEX.md` 기록 |
| `knowledge/web/server.mjs` | HTTP: `/api/index`(재생성)·`/api/file`·`/api/search`(rg)·정적. `createServer`,`handleRequest`,`safeResolve`,`runSearch` export |
| `knowledge/web/public/index.html` | SPA 셸 + CDN 로드 |
| `knowledge/web/public/app.js` | 목록·트리·뷰어·유형필터·검색 렌더 |
| `knowledge/web/public/style.css` | 스타일 |
| `knowledge/test/index-core.test.mjs` | 분류·추출·`buildIndex` 멱등 단위테스트 |
| `knowledge/test/server.test.mjs` | 엔드포인트 + traversal 403 + search |
| `knowledge/cards/{todo,minesweeper,shop}.md` | 지식 카드 (시딩) |
| `.claude/skills/recall-knowledge/SKILL.md` | 결정 전 prior-art 조회 강제 스킬 |
| `MEMORY.md` / `.claude/skills/architecture-and-delegation/SKILL.md` / `CLAUDE.md` / `.claude/retro/log.md` | 연동·기록 (수정) |

---

## Task 1: index-core 순수 함수 (분류·추출·카드파싱)

**Files:**
- Create: `knowledge/index-core.mjs`
- Test: `knowledge/test/index-core.test.mjs`

**Interfaces:**
- Produces:
  - `classifyFile(relPath: string) → string` (requirements|design|architecture|coverage|qa|meta|code|style|asset|config)
  - `extractReqIds(text: string) → string[]` (유니크·정렬)
  - `extractHeaders(markdown: string) → string[]`
  - `parseCard(text: string) → { frontmatter: object, highlights: string[] }`

- [ ] **Step 1: Write the failing test**

```js
// knowledge/test/index-core.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classifyFile, extractReqIds, extractHeaders, parseCard } from '../index-core.mjs';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test knowledge/test/index-core.test.mjs`
Expected: FAIL — `Cannot find module '../index-core.mjs'`.

- [ ] **Step 3: Write minimal implementation**

```js
// knowledge/index-core.mjs
const CODE_EXT = new Set(['kt', 'ts', 'tsx', 'js', 'mjs', 'kts']);

export function classifyFile(relPath) {
  const name = relPath.split('/').pop();
  const lower = name.toLowerCase();
  const ext = lower.includes('.') ? lower.slice(lower.lastIndexOf('.') + 1) : '';
  if (relPath.includes('/prototype/')) return 'design';
  if (ext === 'md') {
    if (/requirements/.test(lower)) return 'requirements';
    if (/design/.test(lower)) return 'design';
    if (/architecture|_specs|component_specs/.test(lower)) return 'architecture';
    if (/coverage_matrix/.test(lower)) return 'coverage';
    if (/qa_report|qa_plan|^05_qa/.test(lower)) return 'qa';
    if (/^resume$/.test(lower.replace(/\.md$/, '')) || /^build_complete/.test(lower)) return 'meta';
  }
  if (CODE_EXT.has(ext)) return 'code';
  if (ext === 'css') return 'style';
  if (ext === 'png' || ext === 'svg') return 'asset';
  return 'config';
}

export function extractReqIds(text) {
  const matches = text.match(/\bREQ-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*/g) || [];
  return [...new Set(matches)].sort();
}

export function extractHeaders(markdown) {
  return markdown.split('\n')
    .filter((l) => /^#{1,6}\s+/.test(l))
    .map((l) => l.replace(/^#{1,6}\s+/, '').trim());
}

export function parseCard(text) {
  const fm = {};
  let body = text;
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (m) {
    body = m[2];
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
      if (!kv) continue;
      const k = kv[1];
      let v = kv[2].trim();
      if (v.startsWith('[') && v.endsWith(']')) {
        fm[k] = v.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
      } else {
        fm[k] = v;
      }
    }
  }
  const highlights = [];
  let capture = false;
  for (const line of body.split('\n')) {
    if (/^##\s/.test(line)) {
      capture = /핵심 결정|gotcha|반복 버그/i.test(line);
      continue;
    }
    if (capture) {
      const b = line.match(/^\s*[-*]\s+(.*)$/);
      if (b) highlights.push(b[1].trim());
    }
  }
  return { frontmatter: fm, highlights };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test knowledge/test/index-core.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Verify (checkpoint)**

Run: `node --test knowledge/test/index-core.test.mjs`
Expected: `# pass 4  # fail 0`. (Git 미사용 — 통과로 태스크 종료.)

---

## Task 2: index-core 집계·렌더 (`buildIndex` / `renderJson` / `renderMarkdown`)

**Files:**
- Modify: `knowledge/index-core.mjs` (append)
- Test: `knowledge/test/index-core.test.mjs` (append)

**Interfaces:**
- Consumes: `classifyFile`, `extractReqIds`, `extractHeaders`, `parseCard` (Task 1)
- Produces:
  - `findProjects(root) → string[]` (`_workspace/` 보유 디렉터리, 정렬)
  - `buildProject(root, id) → Project` where `Project = { id, title, status, stack:string[], summary, tags:string[], buildComplete:boolean, qaRounds:number, card:string|null, highlights:string[], artifacts: Artifact[] }`
  - `Artifact = { path, category, ext, size, mtime, title?, headers?, reqIds? }`
  - `buildIndex(root) → { generatedAt, projects: Project[], fileTypes: object, categories: object }`
  - `renderJson(index) → string`
  - `renderMarkdown(index) → string`

- [ ] **Step 1: Write the failing test (append to index-core.test.mjs)**

```js
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildIndex, renderJson, renderMarkdown, findProjects } from '../index-core.mjs';

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
    '---\nproject: demo\ntitle: 데모\nstack: [Node]\ntags: [t1]\nsummary: 한줄\n---\n## 핵심 결정\n- 결정1\n');
  return root;
}

test('findProjects detects _workspace dirs', () => {
  const root = fixture();
  assert.deepEqual(findProjects(root), ['demo']);
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test knowledge/test/index-core.test.mjs`
Expected: FAIL — `buildIndex` / `findProjects` / `renderJson` / `renderMarkdown` not exported.

- [ ] **Step 3: Write minimal implementation (append to index-core.mjs)**

```js
import fs from 'node:fs';
import path from 'node:path';

export const EXCLUDE = new Set(['node_modules', 'build', '.gradle', 'dist', '.git', '.idea']);
const DOC_CATS = ['requirements', 'design', 'architecture', 'coverage', 'qa', 'meta'];

function walk(dir, root, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, root, acc);
    else if (entry.isFile()) acc.push(path.relative(root, full).split(path.sep).join('/'));
  }
  return acc;
}

export function findProjects(root) {
  return fs.readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !EXCLUDE.has(e.name) && !e.name.startsWith('.'))
    .filter((e) => fs.existsSync(path.join(root, e.name, '_workspace')))
    .map((e) => e.name)
    .sort();
}

export function buildProject(root, id) {
  const files = walk(path.join(root, id), root, []).sort();
  const artifacts = files.map((rel) => {
    const abs = path.join(root, rel);
    const st = fs.statSync(abs);
    const ext = rel.includes('.') ? rel.slice(rel.lastIndexOf('.') + 1).toLowerCase() : '';
    const a = { path: rel, category: classifyFile(rel), ext, size: st.size, mtime: st.mtime.toISOString() };
    if (ext === 'md') {
      const text = fs.readFileSync(abs, 'utf8');
      const headers = extractHeaders(text);
      a.title = headers[0] || rel.split('/').pop();
      a.headers = headers;
      a.reqIds = extractReqIds(text);
    }
    return a;
  });
  const cardAbs = path.join(root, 'knowledge', 'cards', `${id}.md`);
  let fm = {}, highlights = [], card = null;
  if (fs.existsSync(cardAbs)) {
    const parsed = parseCard(fs.readFileSync(cardAbs, 'utf8'));
    fm = parsed.frontmatter; highlights = parsed.highlights;
    card = `knowledge/cards/${id}.md`;
  }
  const buildComplete = files.some((f) => /build_complete/i.test(f));
  const qaRounds = files.filter((f) => /qa_report_round/i.test(f)).length;
  return {
    id,
    title: fm.title || id,
    status: fm.status || (buildComplete ? 'DONE' : 'IN PROGRESS'),
    stack: Array.isArray(fm.stack) ? fm.stack : (fm.stack ? [fm.stack] : []),
    summary: fm.summary || '',
    tags: Array.isArray(fm.tags) ? fm.tags : (fm.tags ? [fm.tags] : []),
    buildComplete, qaRounds, card, highlights, artifacts,
  };
}

export function buildIndex(root) {
  const projects = findProjects(root).map((id) => buildProject(root, id));
  const fileTypes = {};
  const categories = {};
  for (const p of projects) {
    for (const a of p.artifacts) {
      const key = a.ext || '(none)';
      fileTypes[key] = (fileTypes[key] || 0) + 1;
      (categories[a.category] ||= []).push(a.path);
    }
  }
  return { generatedAt: new Date().toISOString(), projects, fileTypes, categories };
}

export function renderJson(index) {
  return JSON.stringify(index, null, 2) + '\n';
}

export function renderMarkdown(index) {
  const total = index.projects.reduce((n, p) => n + p.artifacts.length, 0);
  const lines = [
    '# Project Knowledge Index',
    `_생성: ${index.generatedAt} · 프로젝트 ${index.projects.length} · 산출물 ${total}_`,
    '',
    '> 사용법: 스택·아키텍처·계약을 결정하기 전에 여기서 비슷한 과거 작업을 찾고, 필요한 원본 파일을 드릴다운하라.',
    '',
  ];
  for (const p of index.projects) {
    lines.push(`## ${p.id} — ${p.title}  [${p.status}]`);
    if (p.stack.length) lines.push(`- 스택: ${p.stack.join(' · ')}`);
    if (p.summary) lines.push(`- 요약: ${p.summary}`);
    if (p.tags.length) lines.push(`- 태그: ${p.tags.join(', ')}`);
    if (p.card) lines.push(`- 지식 카드: ${p.card}`);
    if (p.highlights.length) {
      lines.push('- 핵심 결정/Gotcha:');
      for (const h of p.highlights) lines.push(`  - ${h}`);
    }
    const docs = p.artifacts.filter((a) => DOC_CATS.includes(a.category));
    const nonDocs = p.artifacts.filter((a) => !DOC_CATS.includes(a.category));
    lines.push('- 산출물(문서):');
    for (const a of docs) {
      const req = a.reqIds && a.reqIds.length
        ? ` (REQ: ${a.reqIds.slice(0, 6).join(', ')}${a.reqIds.length > 6 ? '…' : ''})` : '';
      lines.push(`  - [${a.category}] ${a.path}${req}`);
    }
    if (nonDocs.length) {
      const byExt = {};
      for (const a of nonDocs) byExt[a.ext || '(none)'] = (byExt[a.ext || '(none)'] || 0) + 1;
      const summary = Object.entries(byExt).sort((x, y) => y[1] - x[1]).map(([e, n]) => `${n} ${e}`).join(', ');
      lines.push(`- 코드/기타: ${nonDocs.length}개 (${summary})`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test knowledge/test/index-core.test.mjs`
Expected: PASS (9 tests total).

- [ ] **Step 5: Verify (checkpoint)**

Run: `node --test knowledge/test/index-core.test.mjs`
Expected: `# pass 9  # fail 0`.

---

## Task 3: 생성기 CLI `generate.mjs`

**Files:**
- Create: `knowledge/generate.mjs`

**Interfaces:**
- Consumes: `buildIndex`, `renderJson`, `renderMarkdown` (Task 2)
- Produces: writes `knowledge/index.json` + `knowledge/INDEX.md` at repo root.

- [ ] **Step 1: Write the implementation**

```js
// knowledge/generate.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex, renderJson, renderMarkdown } from './index-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const index = buildIndex(ROOT);
fs.writeFileSync(path.join(__dirname, 'index.json'), renderJson(index));
fs.writeFileSync(path.join(__dirname, 'INDEX.md'), renderMarkdown(index));
console.log(`generated: ${index.projects.length} projects, ${Object.values(index.fileTypes).reduce((a, b) => a + b, 0)} files`);
```

- [ ] **Step 2: Run it against the real repo**

Run: `node knowledge/generate.mjs`
Expected: prints `generated: 3 projects, ... files` and creates `knowledge/index.json` + `knowledge/INDEX.md`.

- [ ] **Step 3: Verify outputs are valid**

Run: `node -e "const i=require('./knowledge/index.json'); console.log(i.projects.map(p=>p.id).join(','))"`
Expected: `minesweeper,shop,todo` (sorted).
Run: `head -5 knowledge/INDEX.md`
Expected: starts with `# Project Knowledge Index`.

> 카드가 아직 없으므로 title=프로젝트id, stack/highlights 비어있음 — 정상 (Task 8에서 채움).

---

## Task 4: 서버 `/api/index` · `/api/file` + 경로 보안

**Files:**
- Create: `knowledge/web/server.mjs`
- Test: `knowledge/test/server.test.mjs`

**Interfaces:**
- Consumes: `buildIndex` (Task 2)
- Produces:
  - `safeResolve(root: string, rel: string) → string|null` (루트 밖이면 null)
  - `createServer(root?) → http.Server` (listen 안 함)
  - `ROOT` (repo root absolute)

- [ ] **Step 1: Write the failing test**

```js
// knowledge/test/server.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, safeResolve, ROOT } from '../web/server.mjs';

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

test('GET /api/index returns project list', async () => {
  const res = await fetch(`${base}/api/index`);
  assert.equal(res.status, 200);
  const idx = await res.json();
  assert.equal(idx.projects.some((p) => p.id === 'todo'), true);
});

test('GET /api/file reads an in-root file', async () => {
  const res = await fetch(`${base}/api/file?path=CLAUDE.md`);
  assert.equal(res.status, 200);
  assert.match(await res.text(), /project-loop/);
});

test('GET /api/file blocks traversal with 403', async () => {
  const res = await fetch(`${base}/api/file?path=../../etc/passwd`);
  assert.equal(res.status, 403);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test knowledge/test/server.test.mjs`
Expected: FAIL — `Cannot find module '../web/server.mjs'`.

- [ ] **Step 3: Write minimal implementation**

```js
// knowledge/web/server.mjs
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex, classifyFile } from '../index-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..', '..');
const PUBLIC = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml',
};
const mimeFor = (p) => MIME[path.extname(p).toLowerCase()] || 'text/plain; charset=utf-8';

export function safeResolve(root, rel) {
  const abs = path.resolve(root, rel);
  const guard = root.endsWith(path.sep) ? root : root + path.sep;
  if (abs !== root && !abs.startsWith(guard)) return null;
  return abs;
}

function sendJson(res, code, obj) {
  res.writeHead(code, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}
function sendText(res, code, txt) {
  res.writeHead(code, { 'content-type': 'text/plain; charset=utf-8' });
  res.end(txt);
}
function sendFile(res, abs) {
  res.writeHead(200, { 'content-type': mimeFor(abs) });
  fs.createReadStream(abs).pipe(res);
}

export function handleRequest(root) {
  return (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/index') return sendJson(res, 200, buildIndex(root));
    if (url.pathname === '/api/file') {
      const abs = safeResolve(root, url.searchParams.get('path') || '');
      if (!abs || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) return sendText(res, 403, 'Forbidden');
      return sendFile(res, abs);
    }
    // static
    const rel = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
    const sAbs = safeResolve(PUBLIC, rel);
    if (sAbs && fs.existsSync(sAbs) && fs.statSync(sAbs).isFile()) return sendFile(res, sAbs);
    return sendText(res, 404, 'Not found');
  };
}

export function createServer(root = ROOT) {
  return http.createServer(handleRequest(root));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const port = process.env.PORT || 4178;
  createServer().listen(port, () => console.log(`knowledge site: http://localhost:${port}`));
}
```

> `classifyFile` import는 Task 5의 search에서 쓰인다(지금은 미사용이어도 미리 import). lint 경고 무시.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test knowledge/test/server.test.mjs`
Expected: PASS (4 tests).

- [ ] **Step 5: Verify (checkpoint)**

Run: `node --test knowledge/test/server.test.mjs`
Expected: `# pass 4  # fail 0`.

---

## Task 5: 본문 검색 `/api/search` (ripgrep + 폴백)

**Files:**
- Modify: `knowledge/web/server.mjs` (add `runSearch`, route)
- Test: `knowledge/test/server.test.mjs` (append)

**Interfaces:**
- Consumes: `classifyFile`, `ROOT`, `safeResolve`
- Produces: `runSearch(root, q, limit=100) → [{ path, line, text, category }]`; route `GET /api/search?q=`.

- [ ] **Step 1: Write the failing test (append to server.test.mjs)**

```js
import { runSearch } from '../web/server.mjs';

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test knowledge/test/server.test.mjs`
Expected: FAIL — `runSearch` not exported / `/api/search` 404.

- [ ] **Step 3: Add implementation to server.mjs**

Add the import near top:

```js
import { spawnSync } from 'node:child_process';
```

Add these functions (before `handleRequest`):

```js
const SEARCH_EXCLUDE = ['node_modules', 'build', '.gradle', 'dist', '.git', '.idea'];
const TEXT_EXT = new Set(['md', 'ts', 'tsx', 'js', 'mjs', 'kt', 'kts', 'css', 'json', 'yaml', 'yml', 'html', 'txt', 'properties']);

function fallbackSearch(root, q, limit) {
  const out = [];
  const needle = q.toLowerCase();
  (function walk(dir) {
    if (out.length >= limit) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SEARCH_EXCLUDE.includes(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      const ext = e.name.includes('.') ? e.name.split('.').pop().toLowerCase() : '';
      if (!TEXT_EXT.has(ext)) continue;
      const lines = fs.readFileSync(full, 'utf8').split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(needle)) {
          const rel = path.relative(root, full).split(path.sep).join('/');
          out.push({ path: rel, line: i + 1, text: lines[i].trim().slice(0, 200), category: classifyFile(rel) });
          break;
        }
      }
      if (out.length >= limit) return;
    }
  })(root);
  return out;
}

export function runSearch(root, q, limit = 100) {
  if (!q || !q.trim()) return [];
  const globs = SEARCH_EXCLUDE.flatMap((d) => ['-g', `!${d}`]);
  const res = spawnSync('rg', ['--json', '--line-number', '--max-count', '5', '-S', ...globs, '--', q, root],
    { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (res.error || res.status === null || res.status > 1) return fallbackSearch(root, q, limit);
  const out = [];
  for (const line of (res.stdout || '').split('\n')) {
    if (!line) continue;
    let obj;
    try { obj = JSON.parse(line); } catch { continue; }
    if (obj.type !== 'match') continue;
    const rel = path.relative(root, obj.data.path.text).split(path.sep).join('/');
    out.push({
      path: rel, line: obj.data.line_number,
      text: (obj.data.lines.text || '').trim().slice(0, 200), category: classifyFile(rel),
    });
    if (out.length >= limit) break;
  }
  return out;
}
```

Add the route inside `handleRequest` (after the `/api/file` block):

```js
    if (url.pathname === '/api/search') {
      return sendJson(res, 200, runSearch(root, url.searchParams.get('q') || ''));
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test knowledge/test/server.test.mjs`
Expected: PASS (7 tests total).

- [ ] **Step 5: Verify (checkpoint)**

Run: `node --test knowledge/test/`
Expected: all index-core + server tests pass (`# fail 0`).

---

## Task 6: 프론트엔드 SPA (목록·트리·뷰어·유형필터·검색)

**Files:**
- Create: `knowledge/web/public/index.html`
- Create: `knowledge/web/public/app.js`
- Create: `knowledge/web/public/style.css`

**Interfaces:**
- Consumes: `/api/index`, `/api/file?path=`, `/api/search?q=` (Tasks 4–5)

- [ ] **Step 1: Write `index.html`**

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Project Knowledge</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/highlight.js@11/styles/github.min.css" />
  <link rel="stylesheet" href="/style.css" />
</head>
<body>
  <aside id="sidebar">
    <h1>Project Knowledge</h1>
    <input id="search" type="search" placeholder="전체 검색 (제목·태그·본문)" />
    <div id="type-filters"></div>
    <nav id="projects"></nav>
  </aside>
  <main id="main"><p class="hint">프로젝트 또는 파일을 선택하세요.</p></main>
  <script src="https://cdn.jsdelivr.net/npm/marked@12/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/highlight.js@11/highlight.min.js"></script>
  <script src="/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write `style.css`**

```css
* { box-sizing: border-box; }
body { margin: 0; display: flex; min-height: 100vh; font: 14px/1.5 -apple-system, system-ui, sans-serif; color: #1c2230; }
#sidebar { width: 320px; flex: none; border-right: 1px solid #e2e6ee; padding: 16px; overflow-y: auto; height: 100vh; position: sticky; top: 0; background: #f8fafc; }
#sidebar h1 { font-size: 16px; margin: 0 0 12px; }
#search { width: 100%; padding: 8px 10px; border: 1px solid #cbd3e0; border-radius: 8px; margin-bottom: 12px; }
#type-filters { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }
.chip { font-size: 12px; padding: 3px 9px; border: 1px solid #cbd3e0; border-radius: 999px; cursor: pointer; background: #fff; }
.chip.active { background: #2563eb; color: #fff; border-color: #2563eb; }
.project > summary { font-weight: 600; cursor: pointer; padding: 6px 0; }
.cat { margin: 6px 0 6px 8px; }
.cat > .cat-name { font-size: 11px; text-transform: uppercase; color: #6b7280; letter-spacing: .04em; }
.file { display: block; padding: 3px 8px; border-radius: 6px; cursor: pointer; color: #1f3a8a; text-decoration: none; word-break: break-all; }
.file:hover, .file.active { background: #e6eefe; }
#main { flex: 1; padding: 24px 32px; overflow-x: auto; max-width: 100%; }
#main pre { background: #f6f8fa; padding: 14px; border-radius: 8px; overflow-x: auto; }
.hint { color: #6b7280; }
.meta-bar { color: #6b7280; font-size: 12px; margin-bottom: 16px; }
.search-hit { display: block; padding: 6px 8px; border-bottom: 1px solid #eef1f6; cursor: pointer; }
.search-hit .loc { color: #6b7280; font-size: 12px; }
@media (max-width: 720px) {
  body { flex-direction: column; }
  #sidebar { width: 100%; height: auto; position: static; border-right: none; border-bottom: 1px solid #e2e6ee; }
}
```

- [ ] **Step 3: Write `app.js`**

```js
const state = { index: null, typeFilter: null };

async function load() {
  state.index = await (await fetch('/api/index')).json();
  renderTypeFilters();
  renderProjects();
}

function renderTypeFilters() {
  const el = document.getElementById('type-filters');
  const cats = Object.keys(state.index.categories).sort();
  el.innerHTML = '';
  for (const c of cats) {
    const chip = document.createElement('span');
    chip.className = 'chip' + (state.typeFilter === c ? ' active' : '');
    chip.textContent = `${c} (${state.index.categories[c].length})`;
    chip.onclick = () => { state.typeFilter = state.typeFilter === c ? null : c; renderTypeFilters(); renderProjects(); };
    el.appendChild(chip);
  }
}

function renderProjects() {
  const nav = document.getElementById('projects');
  nav.innerHTML = '';
  for (const p of state.index.projects) {
    const det = document.createElement('details');
    det.className = 'project'; det.open = true;
    const sum = document.createElement('summary');
    sum.textContent = `${p.id} — ${p.title} [${p.status}]`;
    det.appendChild(sum);
    const byCat = {};
    for (const a of p.artifacts) {
      if (state.typeFilter && a.category !== state.typeFilter) continue;
      (byCat[a.category] ||= []).push(a);
    }
    for (const cat of Object.keys(byCat).sort()) {
      const wrap = document.createElement('div'); wrap.className = 'cat';
      const name = document.createElement('div'); name.className = 'cat-name'; name.textContent = cat;
      wrap.appendChild(name);
      for (const a of byCat[cat]) {
        const link = document.createElement('a');
        link.className = 'file'; link.textContent = a.path.split('/').slice(1).join('/');
        link.onclick = () => openFile(a.path);
        wrap.appendChild(link);
      }
      det.appendChild(wrap);
    }
    nav.appendChild(det);
  }
}

async function openFile(relPath) {
  const main = document.getElementById('main');
  const ext = relPath.split('.').pop().toLowerCase();
  main.innerHTML = `<div class="meta-bar">${relPath}</div>`;
  if (ext === 'png' || ext === 'svg') {
    const img = document.createElement('img');
    img.src = `/api/file?path=${encodeURIComponent(relPath)}`; img.style.maxWidth = '100%';
    main.appendChild(img); return;
  }
  const text = await (await fetch(`/api/file?path=${encodeURIComponent(relPath)}`)).text();
  if (ext === 'md') {
    const div = document.createElement('div');
    div.innerHTML = marked.parse(text);
    main.appendChild(div);
  } else {
    const pre = document.createElement('pre');
    const code = document.createElement('code'); code.textContent = text;
    pre.appendChild(code); main.appendChild(pre); hljs.highlightElement(code);
  }
}

async function runSearch(q) {
  const main = document.getElementById('main');
  if (!q.trim()) { main.innerHTML = '<p class="hint">프로젝트 또는 파일을 선택하세요.</p>'; return; }
  const hits = await (await fetch(`/api/search?q=${encodeURIComponent(q)}`)).json();
  main.innerHTML = `<div class="meta-bar">"${q}" 본문 매치 ${hits.length}건</div>`;
  for (const h of hits) {
    const el = document.createElement('div'); el.className = 'search-hit';
    el.innerHTML = `<span class="loc">[${h.category}] ${h.path}:${h.line}</span><br>${h.text.replace(/</g, '&lt;')}`;
    el.onclick = () => openFile(h.path);
    main.appendChild(el);
  }
}

let timer;
document.getElementById('search').addEventListener('input', (e) => {
  clearTimeout(timer);
  timer = setTimeout(() => runSearch(e.target.value), 250);
});

load();
```

- [ ] **Step 4: Manual verification — run server and screenshot**

Run (background): `node knowledge/web/server.mjs`
Then open `http://localhost:4178` in a headless browser and capture desktop (1280×800) + mobile (390×844) screenshots.
Expected:
- Sidebar lists `minesweeper / shop / todo` with type-filter chips.
- Clicking a `.md` file renders formatted markdown; clicking a `.tsx`/`.kt` renders highlighted code; clicking a `.png` shows the image.
- Typing a term (e.g. `CORS`) shows body-search hits; clicking a hit opens that file.
- Mobile width stacks sidebar above content.

- [ ] **Step 5: Stop the background server**

Stop the `node knowledge/web/server.mjs` background process.

---

## Task 7: `recall-knowledge` 스킬 + 하네스 연동

**Files:**
- Create: `.claude/skills/recall-knowledge/SKILL.md`
- Modify: `.claude/skills/architecture-and-delegation/SKILL.md` (add prior-art line)
- Modify: `MEMORY.md` (add pointer)
- Modify: `CLAUDE.md` (append 변경 이력 row)
- Modify: `.claude/retro/log.md` (append entry)

**Interfaces:**
- Consumes: `knowledge/generate.mjs`, `knowledge/INDEX.md`

- [ ] **Step 1: Create the skill**

Create `.claude/skills/recall-knowledge/SKILL.md`:

```markdown
---
name: recall-knowledge
description: 새 빌드의 기술 스택·아키텍처·API 계약을 결정하기 전, 과거 프로젝트의 산출물·교훈을 조회해 prior-art로 활용한다. '이전 프로젝트 참고', '비슷한 거 어떻게 했지', '예전에 어떻게', '과거 산출물', '예전 빌드 찾아' 류 요청과 build-project의 아키텍처 결정 단계 진입 시 반드시 사용. 단순 코드 질문에는 사용하지 않음.
---

# 과거 지식 조회 (Recall Knowledge)

project-loop 는 빌드를 거듭하며 `knowledge/` 에 지식 베이스를 누적한다. 새 결정 전에 먼저 여기를 본다.

## 절차

1. **최신화 후 읽기**: `node knowledge/generate.mjs` 를 한 번 실행한다(수십 ms). 그다음 `knowledge/INDEX.md` 를 Read 한다. 이 한 파일에 프로젝트별 스택·핵심 결정/Gotcha·산출물 카탈로그가 들어 있다.
2. **관련 프로젝트 식별**: 지금 만들 것과 도메인/스택/패턴이 겹치는 과거 프로젝트를 INDEX.md 의 요약·태그·highlights 로 고른다.
3. **드릴다운**: 필요한 원본만 Read 한다. 예: 결제·정산 패턴 → `shop/_workspace/02b_seller_design.md`, CORS·인증 → 해당 프로젝트 `03_backend_architecture.md`. 리터럴 용어가 필요하면 `Grep` 으로 전 프로젝트 본문 검색.
4. **재사용/회피**: 채택할 패턴과 과거 Gotcha(반복 버그)를 결정에 명시 반영한다.

## 언제

- build-project 의 아키텍처·계약 결정 직전 (architecture-and-delegation 과 짝).
- 사용자가 과거 작업을 참조해 달라고 할 때.

서버(`knowledge/web/server.mjs`)는 사람용이다. 클로드는 서버 없이 INDEX.md/원본 파일을 직접 읽는 것이 가장 빠르다.
```

- [ ] **Step 2: Wire architecture-and-delegation**

Read `.claude/skills/architecture-and-delegation/SKILL.md`, find the stack/architecture decision section (where 기술 스택 결정 begins), and insert this line at the start of that decision step:

```markdown
> **결정 전 prior-art 조회**: 스택·아키텍처·계약을 정하기 전에 `recall-knowledge` 절차로 `knowledge/INDEX.md` 를 확인해 과거 프로젝트의 채택 패턴과 반복 Gotcha 를 반영한다.
```

- [ ] **Step 3: Add MEMORY.md pointer**

Read `MEMORY.md` and append one line under the existing list:

```markdown
- [Project knowledge base](../../../knowledge/INDEX.md) — 누적 프로젝트 산출물 색인; 새 빌드 결정 전 recall-knowledge 로 조회 (generate.mjs 로 최신화)
```

> 경로는 MEMORY.md 위치 기준 상대경로. MEMORY.md 는 `.claude/projects/.../memory/` 에 있으므로 repo 루트의 `knowledge/INDEX.md` 까지의 실제 상대 깊이를 `pwd` 로 확인 후 정확히 기입한다. 불확실하면 절대경로 대신 설명문구 + `knowledge/INDEX.md` (repo 루트 기준) 으로 적는다.

- [ ] **Step 4: Append CLAUDE.md 변경 이력 row**

Read `CLAUDE.md`, find the 변경 이력 table, append:

```markdown
| 2026-06-17 | 프로젝트 지식 베이스 도입: knowledge/ (index-core 스캔→INDEX.md/index.json) + recall-knowledge 스킬 + 사람용 Node 웹(서버+SPA, /api/search=rg). DB·ES 없이 파일=원본·생성색인 | knowledge/*, .claude/skills/recall-knowledge, architecture-and-delegation, MEMORY.md | 빌드 누적 지식을 클로드가 결정 전 재사용 + 사람 열람 |
```

- [ ] **Step 5: Append retro/log.md entry**

Read `.claude/retro/log.md`, append:

```markdown
## 2026-06-17 — (수동 구축) 프로젝트 지식 베이스 + recall-knowledge
- 신호: 빌드를 거듭하며 쌓이는 산출물·회고가 시간이 지나면 잊혀짐. 클로드가 과거 지식을 결정 시점에 재사용할 구조 부재.
- 일반화/반영: 파일시스템=단일 원본, 생성 색인(index-core)으로 클로드는 INDEX.md 한 파일 Read 후 드릴다운(서버 불필요·DB/ES 불필요). recall-knowledge 스킬로 결정 전 조회 강제 + architecture-and-delegation 연동 + MEMORY.md 포인터. 사람용은 의존성 0 Node 웹.
- 보존: 기존 회고 루프(retro/log.md)·메모리 이중저장 규율과 충돌 없음 — 산출물 카탈로그 레이어를 추가만 함.
```

- [ ] **Step 6: Verify skill is discoverable**

Run: `ls .claude/skills/recall-knowledge/SKILL.md`
Expected: file exists. Confirm `name:`/`description:` frontmatter present.

---

## Task 8: 초기 시딩 (지식 카드 3개) + 엔드투엔드 확인

**Files:**
- Create: `knowledge/cards/todo.md`
- Create: `knowledge/cards/minesweeper.md`
- Create: `knowledge/cards/shop.md`

**Interfaces:**
- Consumes: 각 프로젝트의 `_workspace/*.md` + `.claude/retro/log.md`
- Produces: 카드 → `generate.mjs` 가 INDEX.md/index.json 에 병합.

- [ ] **Step 1: Read sources for each project**

For each of `todo`, `minesweeper`, `shop`, Read: `01_requirements.md`, `02_design.md`(+`02b` if present), `03_backend_architecture.md`, `03_frontend_architecture.md`, the latest `05_qa_report_round*.md`, and the relevant `.claude/retro/log.md` entries.

- [ ] **Step 2: Write each card using this exact template**

Create `knowledge/cards/<project>.md` (frontmatter keys parsed by `parseCard`: `project,title,status,stack,summary,tags`; bullets under `## 핵심 결정` and `## Gotcha` become `highlights`):

```markdown
---
project: <id>
title: <한국어 제목>
status: <예: v1 DONE / v2 IN PROGRESS>
stack: [<백엔드 스택>, <프론트 스택>]
summary: <한 줄 요약>
tags: [<도메인·패턴 태그들>]
---

## 핵심 결정 (ADR 요약)
- <대안 비교로 내린 핵심 아키텍처 결정 + 채택 이유>

## API 계약 패턴
- <재사용할 만한 계약/경계면 패턴>

## Gotcha / 반복 버그
- <retro 와 QA 라운드에서 나온 반복 버그·함정 — CORS, TZ, 4xx 마스킹, 미스타일 등>

## 재사용 포인트
- <다음 빌드에서 그대로 가져다 쓸 수 있는 것>
```

Content rules: 핵심 결정/Gotcha 는 실제 산출물·retro 에서 근거를 가진 것만 — 추측 금지. 각 섹션 3–6 불릿.

- [ ] **Step 3: Regenerate the index**

Run: `node knowledge/generate.mjs`
Expected: prints `generated: 3 projects, ... files`.

- [ ] **Step 4: Verify cards merged into INDEX.md**

Run: `grep -c "지식 카드:" knowledge/INDEX.md`
Expected: `3`.
Run: `grep -A2 "## shop" knowledge/INDEX.md | head`
Expected: shows the shop title/stack from its card (not the bare id).

- [ ] **Step 5: Full regression + end-to-end**

Run: `node --test knowledge/test/`
Expected: all tests pass (`# fail 0`).
Run (background): `node knowledge/web/server.mjs`, open `http://localhost:4178`, confirm each project shows its card-derived title and artifacts render. Stop the server.

- [ ] **Step 6: Confirm Claude-path freshness**

Run: `node knowledge/generate.mjs && head -20 knowledge/INDEX.md`
Expected: regenerates cleanly and INDEX.md shows the 3 projects with stack/highlights — the file Claude reads via `recall-knowledge`.

---

## Self-Review (completed by author)

- **Spec coverage**: §3 구조→Tasks 1–6; §4 데이터모델→Tasks 1–2; §5 생성기/신선도→Tasks 2–3 + recall(Task 7) regen; §6 웹(서버/검색/프론트)→Tasks 4–6; §7 활용 장치→Task 7; §8 시딩→Task 8; §9 테스트→Tasks 1,2,4,5; §10 경계→파일 구조표. 모든 절에 대응 태스크 존재.
- **Placeholder scan**: 코드 스텝은 전부 실제 코드. Task 8 은 콘텐츠 저작 태스크로 정확한 템플릿+소스 파일 지정(코드 플레이스홀더 아님).
- **Type consistency**: `buildIndex`→`{generatedAt,projects,fileTypes,categories}`, `Project`/`Artifact` 필드, `runSearch`→`{path,line,text,category}`, `safeResolve`→`string|null`, `createServer(root)` 가 Tasks 2/4/5/6 전반에서 일관.
