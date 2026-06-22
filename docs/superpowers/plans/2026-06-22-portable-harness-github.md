# 이식 가능한 하네스 + 지식 웹앱 (GitHub 배포) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `git clone` + `./setup.sh` 한 번으로 어떤 컴퓨터에서든 가상 개발팀 하네스와 지식 웹앱을 쓸 수 있게, 프레임워크를 GitHub에 올리고 사용자 프로젝트는 매니페스트(git 링크)로 연결한다.

**Architecture:** 메인 레포(`get-off-early`)는 하네스(`.claude/`)+지식 도구(`knowledge/`)+setup/ingest 스크립트만 담는 범용 프레임워크. 사용자 프로젝트는 `projects.json` 매니페스트의 git 링크로 전달되어 setup이 clone한다(메인 레포엔 소스 미포함). 하네스로 안 만든 외부 프로젝트는 `claude -p` 기반 ingest가 지식 카드를 생성하고, 색인기는 카드 보유 프로젝트도 인식하도록 일반화한다.

**Tech Stack:** Node.js(내장 모듈만, npm 의존성 0) · `node --test`(테스트) · bash(setup) · `claude` CLI(채팅·ingest, 선택) · `git`/`gh`(배포).

## Global Constraints

- npm 의존성 추가 금지 — Node 내장 모듈만 사용(기존 `knowledge/` 관례 준수).
- 프레임워크 코드(setup·ingest·clone·generate·server·index-core)는 **프로젝트 이름을 하드코딩하지 않는다** — 매니페스트와 파일시스템만 읽는다.
- 테스트는 `claude`를 스폰하지 않는다 — 순수 함수(args 빌더·파서·검증)만 단위 테스트(기존 `chat.test.mjs` 관례).
- 시크릿(`CHAT_TOKEN` 등)·`bypassPermissions`·머신별 경로는 커밋 금지.
- 외부 반영(GitHub repo 생성·push)은 Task 1에서 받은 사용자 승인 + `$GH_USER` 확정 후에만 수행.
- ESM(`.mjs`), 모듈 함수는 `export`, CLI 진입은 `import.meta.url === resolve(process.argv[1])` 가드.
- 테스트 실행 기준 명령: 레포 루트에서 `node --test "knowledge/test/**/*.test.mjs" "scripts/test/**/*.test.mjs"`.

---

### Task 1: 배포 입력 수집 (대화형 · 코드 없음)

이후 태스크가 의존하는 런타임 입력을 사용자에게 받아 확정한다. 플레이스홀더가 아니라 실제 입력 수집 단계다.

**Files:** 없음 (변수 확정 + 사전 점검)

- [ ] **Step 1: 사용자에게 입력 요청** — AskUserQuestion으로 다음을 받는다:
  - GitHub 사용자명/org (`$GH_USER`) — 매니페스트 URL + repo 생성 대상
  - 프로젝트 레포 공개/비공개 (`$VIS` = `public` | `private`)
  - repo 생성·push를 `gh`로 대행해도 되는지 (승인 게이트)

- [ ] **Step 2: 전제 점검**

Run: `gh auth status && gh --version && git --version`
Expected: `gh`가 인증됨(Logged in). 인증 안 됐으면 사용자에게 `gh auth login` 안내 후 대기.

- [ ] **Step 3: 확정값 기록** — 이후 Task 6·9·10에서 쓸 `GH_USER`, `VIS`, 승인 여부를 이 세션 메모에 남긴다(파일 미생성).

---

### Task 2: 색인기 일반화 — 카드 보유 프로젝트 인식 (TDD)

`findProjects`가 `_workspace/` 보유 디렉터리만 인식하므로, 카드만 있는 외부 프로젝트가 색인에서 누락된다. 카드(`knowledge/cards/<name>.md`)가 있고 디렉터리가 존재하면 프로젝트로 인식하도록 일반화한다.

**Files:**
- Modify: `knowledge/index-core.mjs` (findProjects)
- Test: `knowledge/test/index-core.test.mjs` (추가)

**Interfaces:**
- Produces: `findProjects(root) -> string[]` — `_workspace/` 보유 디렉터리 ∪ (카드 보유 ∧ 디렉터리 존재) 프로젝트 이름, 정렬·중복제거.

- [ ] **Step 0: 로컬 레포 초기화 (멱등 — 이후 태스크의 커밋 전제)**

Run: `git rev-parse --is-inside-work-tree 2>/dev/null || git init -b main`
Expected: 레포가 아직 없으면 `Initialized ...`, 이미 있으면 그대로. (로컬 전용 — remote/push는 Task 9·10 게이트.)

- [ ] **Step 1: 실패 테스트 작성** — `knowledge/test/index-core.test.mjs` 끝에 추가:

```javascript
import os from 'node:os';
// (파일 상단에 이미 fs, path, test, assert 가 import 되어 있다고 가정. 없으면 추가)

test('findProjects: 카드만 있고 _workspace 없는 외부 프로젝트도 인식', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fp-'));
  fs.mkdirSync(path.join(root, 'ext-proj', 'src'), { recursive: true });        // 외부 repo (workspace 없음)
  fs.writeFileSync(path.join(root, 'ext-proj', 'src', 'a.js'), 'x');
  fs.mkdirSync(path.join(root, 'knowledge', 'cards'), { recursive: true });
  fs.writeFileSync(path.join(root, 'knowledge', 'cards', 'ext-proj.md'), '---\nproject: ext-proj\n---\n');
  const found = findProjects(root);
  assert.equal(found.includes('ext-proj'), true);
});

test('findProjects: 카드도 _workspace도 없는 디렉터리는 제외', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fp2-'));
  fs.mkdirSync(path.join(root, 'random', 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, 'random', 'src', 'a.js'), 'x');
  assert.equal(findProjects(root).includes('random'), false);
});
```

`findProjects`가 import되어 있는지 확인하고, 없으면 import 라인에 추가한다.

- [ ] **Step 2: 실패 확인**

Run: `node --test "knowledge/test/index-core.test.mjs"`
Expected: 새 테스트 FAIL (ext-proj가 인식 안 됨).

- [ ] **Step 3: findProjects 구현 교체** — `knowledge/index-core.mjs`의 기존 `findProjects`를 아래로 교체:

```javascript
export function findProjects(root) {
  const dirs = fs.readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !EXCLUDE.has(e.name) && !e.name.startsWith('.'))
    .map((e) => e.name);
  const cardsDir = path.join(root, 'knowledge', 'cards');
  const carded = fs.existsSync(cardsDir)
    ? fs.readdirSync(cardsDir).filter((f) => f.endsWith('.md') && f !== 'index.md').map((f) => f.replace(/\.md$/, ''))
    : [];
  const isProject = (name) =>
    fs.existsSync(path.join(root, name, '_workspace')) ||                 // 하네스 산출
    (carded.includes(name) && fs.existsSync(path.join(root, name)));       // 카드 보유 외부
  return [...new Set(dirs.filter(isProject))].sort();
}
```

- [ ] **Step 4: 통과 확인 (회귀 포함)**

Run: `node --test "knowledge/test/index-core.test.mjs"`
Expected: 신규 2개 + 기존 전부 PASS.

- [ ] **Step 5: 커밋**

```bash
git add knowledge/index-core.mjs knowledge/test/index-core.test.mjs
git commit -m "feat(knowledge): 카드 보유 외부 프로젝트도 색인 인식"
```

---

### Task 3: 기존 서버 테스트 탈(脫)하드코딩 (TDD 위생)

`server.test.mjs`의 `/api/index` 테스트가 `todo` 프로젝트 존재를 단정 → 프로젝트가 다른 사용자에게서 깨진다. 배열 형태만 검증하도록 일반화한다.

**Files:**
- Modify: `knowledge/test/server.test.mjs:20-25`

- [ ] **Step 1: 단정 교체** — 아래 블록을

```javascript
test('GET /api/index returns project list', async () => {
  const res = await fetch(`${base}/api/index`);
  assert.equal(res.status, 200);
  const idx = await res.json();
  assert.equal(idx.projects.some((p) => p.id === 'todo'), true);
});
```

다음으로 교체:

```javascript
test('GET /api/index returns a project list (shape, not specific names)', async () => {
  const res = await fetch(`${base}/api/index`);
  assert.equal(res.status, 200);
  const idx = await res.json();
  assert.equal(Array.isArray(idx.projects), true);
  assert.equal(idx.projects.every((p) => typeof p.id === 'string' && Array.isArray(p.artifacts)), true);
});
```

- [ ] **Step 2: 통과 확인**

Run: `cd knowledge && node --test "test/**/*.test.mjs"; cd ..`
Expected: 전부 PASS(프로젝트 유무와 무관).

- [ ] **Step 3: 커밋**

```bash
git add knowledge/test/server.test.mjs
git commit -m "test(knowledge): /api/index 테스트를 프로젝트 비의존으로 일반화"
```

---

### Task 4: 외부 프로젝트 카드 ingest 도구 (TDD)

프로젝트 디렉터리를 `claude -p`(읽기전용)로 분석해 표준 frontmatter 지식 카드를 생성한다. 순수 함수(프롬프트·args·파서·검증)는 단위 테스트, 실제 스폰은 런타임.

**Files:**
- Create: `knowledge/ingest.mjs`
- Test: `knowledge/test/ingest.test.mjs`

**Interfaces:**
- Consumes: `resolveModel`, `CHAT_MODELS` from `knowledge/web/chat.mjs`.
- Produces:
  - `buildCardPrompt(name: string) -> string`
  - `buildIngestArgs({ message: string, model?: string }) -> string[]`
  - `stripFences(text: string) -> string`
  - `extractCard(stdout: string) -> string`
  - `validateCard(text: string) -> { ok: boolean, error?: string }`
  - `ingest({ name, model?, root? }) -> Promise<string>` (작성된 카드 경로)

- [ ] **Step 1: 실패 테스트 작성** — `knowledge/test/ingest.test.mjs`:

```javascript
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
  assert.match(p, /코드펜스|펜스|```/);   // "코드펜스 없이" 지시
});

test('buildIngestArgs: 읽기전용 툴 + json + 해석된 모델', () => {
  const args = buildIngestArgs({ message: 'M', model: 'opus' });
  assert.deepEqual([args[0], args[1]], ['-p', 'M']);
  assert.equal(args[args.indexOf('--model') + 1], 'claude-opus-4-8');
  assert.equal(args.join(' ').includes('Read Grep Glob'), true);
  assert.equal(args.includes('--output-format'), true);
  assert.equal(args.join(' ').includes('Bash'), true);  // disallowed에 Bash
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
  assert.equal(validateCard('---\nproject: x\n---').ok, false);  // 키 다수 누락
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test "knowledge/test/ingest.test.mjs"`
Expected: FAIL — `Cannot find module '../ingest.mjs'`.

- [ ] **Step 3: ingest.mjs 구현**

```javascript
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveModel } from './web/chat.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');
const CARD_KEYS = ['type', 'project', 'title', 'status', 'stack', 'summary', 'tags', 'timestamp'];

export function buildCardPrompt(name) {
  return [
    `'${name}' 프로젝트(현재 작업 디렉터리)의 소스를 읽고 지식 카드를 작성하라.`,
    'Read/Grep/Glob 만 사용한다(읽기 전용). 스택은 빌드파일·확장자로 감지하고, 모듈/엔트리포인트·핵심 결정·gotcha·재사용 포인트를 코드 근거로 추론한다.',
    '출력은 오직 카드 마크다운 본문만. 코드펜스(```) 나 설명 문장 없이 frontmatter 의 --- 로 시작한다.',
    '형식:',
    '---',
    'type: Project Knowledge Card',
    `project: ${name}`,
    'title: <한 줄 제목>',
    'status: <예: DONE / IN PROGRESS>',
    'stack: [<핵심 기술>]',
    'summary: <2~3문장 요약>',
    'tags: [<소문자 키워드>]',
    'timestamp: <ISO8601 예 2026-06-22T00:00:00Z>',
    '---',
    '',
    '## 핵심 결정',
    '## API/구조 패턴',
    '## Gotcha / 주의',
    '## 재사용 포인트',
  ].join('\n');
}

export function buildIngestArgs({ message, model }) {
  return [
    '-p', message,
    '--model', resolveModel(model),
    '--allowedTools', 'Read Grep Glob',
    '--disallowedTools', 'Bash Edit Write WebFetch WebSearch Task',
    '--output-format', 'json',
  ];
}

export function stripFences(text) {
  const t = (text || '').trim();
  const m = t.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  return (m ? m[1] : t).trim();
}

export function extractCard(stdout) {
  const j = JSON.parse(stdout);
  return stripFences(j.result || '');
}

export function validateCard(text) {
  const m = (text || '').match(/^---\n([\s\S]*?)\n---/);
  if (!m) return { ok: false, error: 'frontmatter 없음' };
  const missing = CARD_KEYS.filter((k) => !new RegExp(`^${k}:`, 'm').test(m[1]));
  return missing.length ? { ok: false, error: 'missing keys: ' + missing.join(', ') } : { ok: true };
}

export function ingest({ name, model, root = ROOT, timeoutMs = 180000 }) {
  const projectDir = path.join(root, name);
  if (!fs.existsSync(projectDir)) return Promise.reject(new Error(`프로젝트 디렉터리 없음: ${projectDir}`));
  const args = buildIngestArgs({ message: buildCardPrompt(name), model });
  return new Promise((resolve, reject) => {
    const child = spawn('claude', args, { cwd: projectDir });
    let out = '', err = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('ingest timeout')); }, timeoutMs);
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`claude exited ${code}: ${err.slice(0, 200)}`));
      let card;
      try { card = extractCard(out); } catch { return reject(new Error('parse fail: ' + out.slice(0, 150))); }
      const v = validateCard(card);
      if (!v.ok) return reject(new Error('카드 검증 실패: ' + v.error));
      const dest = path.join(root, 'knowledge', 'cards', `${name}.md`);
      fs.writeFileSync(dest, card.endsWith('\n') ? card : card + '\n');
      resolve(dest);
    });
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const name = process.argv[2];
  const mi = process.argv.indexOf('--model');
  const model = mi > -1 ? process.argv[mi + 1] : undefined;
  if (!name) { console.error('usage: node knowledge/ingest.mjs <project> [--model sonnet|opus]'); process.exit(1); }
  ingest({ name, model }).then((p) => console.log('카드 작성:', p)).catch((e) => { console.error(e.message); process.exit(1); });
}
```

- [ ] **Step 4: 통과 확인**

Run: `node --test "knowledge/test/ingest.test.mjs"`
Expected: 5개 PASS.

- [ ] **Step 5: 커밋**

```bash
git add knowledge/ingest.mjs knowledge/test/ingest.test.mjs
git commit -m "feat(knowledge): 외부 프로젝트 지식 카드 ingest 도구"
```

---

### Task 5: clone + git-exclude 스크립트 (TDD)

매니페스트를 읽어 없는 프로젝트만 clone하고, 클론된 프로젝트 디렉터리를 `.git/info/exclude`에 등록(메인 레포가 소스를 추적하지 않게). `.gitignore`에 프로젝트 이름을 안 박아 범용 유지.

**Files:**
- Create: `scripts/clone-projects.mjs`
- Test: `scripts/test/clone-projects.test.mjs`

**Interfaces:**
- Produces:
  - `readManifest(root?) -> Array<{name, git}>`
  - `cloneMissing(projects, root?, run?) -> Array<{name, status}>` (run 주입 가능: `(cmd,args,opts)=>({status})`)
  - `ensureGitExclude(projects, root?) -> string[]` (새로 추가된 이름들)

- [ ] **Step 1: 실패 테스트 작성** — `scripts/test/clone-projects.test.mjs`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readManifest, cloneMissing, ensureGitExclude } from '../clone-projects.mjs';

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'clone-')); }

test('readManifest: projects 배열 파싱, 없으면 []', () => {
  const root = tmp();
  assert.deepEqual(readManifest(root), []);
  fs.writeFileSync(path.join(root, 'projects.json'), JSON.stringify({ projects: [{ name: 'a', git: 'g' }] }));
  assert.deepEqual(readManifest(root), [{ name: 'a', git: 'g' }]);
});

test('cloneMissing: 존재하는 건 skip, 없는 건 clone 호출, git URL 없으면 표시', () => {
  const root = tmp();
  fs.mkdirSync(path.join(root, 'exists'));
  const calls = [];
  const run = (cmd, args) => { calls.push(args); return { status: 0 }; };
  const res = cloneMissing([{ name: 'exists', git: 'g' }, { name: 'new', git: 'http://x/new.git' }, { name: 'nogit' }], root, run);
  assert.deepEqual(res.find((r) => r.name === 'exists').status, 'exists');
  assert.deepEqual(res.find((r) => r.name === 'new').status, 'cloned');
  assert.deepEqual(res.find((r) => r.name === 'nogit').status, 'no-git-url');
  assert.equal(calls.length, 1);  // new 만 clone
});

test('ensureGitExclude: .git/info/exclude 에 멱등 추가', () => {
  const root = tmp();
  fs.mkdirSync(path.join(root, '.git', 'info'), { recursive: true });
  const added1 = ensureGitExclude([{ name: 'a' }, { name: 'b' }], root);
  assert.deepEqual(added1.sort(), ['a', 'b']);
  const added2 = ensureGitExclude([{ name: 'a' }, { name: 'b' }], root);  // 재실행
  assert.deepEqual(added2, []);  // 멱등
  const body = fs.readFileSync(path.join(root, '.git', 'info', 'exclude'), 'utf8');
  assert.equal((body.match(/^\/a\/$/m) || []).length, 1);  // 중복 없음
});

test('ensureGitExclude: .git 없으면 빈 배열(무해)', () => {
  assert.deepEqual(ensureGitExclude([{ name: 'a' }], tmp()), []);
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test "scripts/test/clone-projects.test.mjs"`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: clone-projects.mjs 구현**

```javascript
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');

export function readManifest(root = ROOT) {
  const p = path.join(root, 'projects.json');
  if (!fs.existsSync(p)) return [];
  try {
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    return Array.isArray(j.projects) ? j.projects : [];
  } catch { return []; }
}

export function cloneMissing(projects, root = ROOT, run = (cmd, args, opts) => spawnSync(cmd, args, opts)) {
  const out = [];
  for (const { name, git } of projects) {
    const dir = path.join(root, name);
    if (fs.existsSync(dir)) { out.push({ name, status: 'exists' }); continue; }
    if (!git) { out.push({ name, status: 'no-git-url' }); continue; }
    const r = run('git', ['clone', git, dir], { stdio: 'inherit' });
    out.push({ name, status: r.status === 0 ? 'cloned' : 'failed' });
  }
  return out;
}

export function ensureGitExclude(projects, root = ROOT) {
  const infoDir = path.join(root, '.git', 'info');
  if (!fs.existsSync(infoDir)) return [];   // 아직 git repo 아님 → 무해
  const file = path.join(infoDir, 'exclude');
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const lines = new Set(existing.split('\n'));
  const added = [];
  for (const { name } of projects) {
    const entry = `/${name}/`;
    if (!lines.has(entry)) { lines.add(entry); added.push(name); }
  }
  if (added.length) {
    const body = existing.replace(/\n*$/, '\n') + added.map((n) => `/${n}/`).join('\n') + '\n';
    fs.writeFileSync(file, body);
  }
  return added;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const projects = readManifest();
  const excluded = ensureGitExclude(projects);
  if (excluded.length) console.log('  git-exclude 추가:', excluded.join(', '));
  for (const r of cloneMissing(projects)) console.log(`  ${r.name}: ${r.status}`);
}
```

- [ ] **Step 4: 통과 확인**

Run: `node --test "scripts/test/clone-projects.test.mjs"`
Expected: 4개 PASS.

- [ ] **Step 5: 커밋**

```bash
git add scripts/clone-projects.mjs scripts/test/clone-projects.test.mjs
git commit -m "feat(scripts): 매니페스트 clone + git-exclude 등록"
```

---

### Task 6: 카드 누락 프로젝트 ingest 오케스트레이션 (TDD)

clone된 프로젝트 중 카드가 없는 것을 골라 ingest 대상으로 추린다(하네스 산출이든 외부든, 카드 없으면 대상).

**Files:**
- Create: `scripts/ingest-missing.mjs`
- Test: `scripts/test/ingest-missing.test.mjs`

**Interfaces:**
- Consumes: `readManifest` (Task 5), `ingest` (Task 4).
- Produces: `projectsMissingCards(projects, root?) -> Array<{name, git}>` (디렉터리 존재 ∧ 카드 부재).

- [ ] **Step 1: 실패 테스트 작성** — `scripts/test/ingest-missing.test.mjs`:

```javascript
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
  assert.deepEqual(res.map((r) => r.name), ['no-card']);  // not-cloned 는 디렉터리 없어 제외
});
```

- [ ] **Step 2: 실패 확인**

Run: `node --test "scripts/test/ingest-missing.test.mjs"`
Expected: FAIL — 모듈 없음.

- [ ] **Step 3: ingest-missing.mjs 구현**

```javascript
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readManifest, ROOT } from './clone-projects.mjs';
import { ingest } from '../knowledge/ingest.mjs';

export function projectsMissingCards(projects, root = ROOT) {
  return projects.filter(({ name }) =>
    fs.existsSync(path.join(root, name)) &&
    !fs.existsSync(path.join(root, 'knowledge', 'cards', `${name}.md`)));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const missing = projectsMissingCards(readManifest());
  if (!missing.length) { console.log('  카드 누락 프로젝트 없음'); process.exit(0); }
  for (const { name } of missing) {
    console.log('  인제스트:', name);
    try { console.log('   →', await ingest({ name })); }
    catch (e) { console.error('   실패:', e.message); }
  }
}
```

- [ ] **Step 4: 통과 확인**

Run: `node --test "scripts/test/ingest-missing.test.mjs"`
Expected: 1개 PASS.

- [ ] **Step 5: 커밋**

```bash
git add scripts/ingest-missing.mjs scripts/test/ingest-missing.test.mjs
git commit -m "feat(scripts): 카드 누락 프로젝트 ingest 오케스트레이션"
```

---

### Task 7: 정적 산출물 (gitignore·안전설정·매니페스트·README)

배포 위생 파일 + 사용자 매니페스트 + 진입점. `$GH_USER`는 Task 1 확정값.

**Files:**
- Create: `.gitignore`, `.claude/settings.json`, `projects.json`, `projects.example.json`, `README.md`

- [ ] **Step 1: `.gitignore` 작성 (프로젝트 이름 비포함 — 범용)**

```
# machine-specific Claude settings
.claude/settings.local.json

# generated knowledge index (regenerated by setup / generate.mjs)
knowledge/INDEX.md
knowledge/index.json

# OS / editor junk
.DS_Store
node_modules/
```
> cloned 프로젝트 디렉터리는 `.gitignore`가 아니라 `scripts/clone-projects.mjs`의 `ensureGitExclude`가 `.git/info/exclude`로 관리(매니페스트와 자동 동기화).

- [ ] **Step 2: `.claude/settings.json` (안전 — bypassPermissions·머신경로 없음)**

```json
{
  "permissions": {
    "allow": [
      "Bash(node --version)",
      "Bash(git --version)",
      "Bash(node knowledge/generate.mjs)"
    ]
  }
}
```

- [ ] **Step 3: `projects.json` (내 목록 — `$GH_USER` 치환하여 생성)**

```bash
cat > projects.json <<EOF
{
  "projects": [
    { "name": "todo", "git": "https://github.com/$GH_USER/todo.git" },
    { "name": "shop", "git": "https://github.com/$GH_USER/shop.git" },
    { "name": "minesweeper", "git": "https://github.com/$GH_USER/minesweeper.git" },
    { "name": "message-platform", "git": "https://github.com/$GH_USER/message-platform.git" }
  ]
}
EOF
```

- [ ] **Step 4: `projects.example.json` (포크·타인용 템플릿)**

```json
{
  "projects": [
    { "name": "my-project", "git": "https://github.com/your-username/my-project.git" }
  ]
}
```

- [ ] **Step 5: `README.md`**

````markdown
# get-off-early — 가상 개발팀 하네스 + 지식 웹앱

요구사항만 주면 PM·디자이너·백엔드/프론트(시니어·주니어)·QA로 구성된 가상 팀이
요구사항 → 디자인 → TDD → QA 루프로 구현하는 하네스와, 누적 산출물을 검색·열람·채팅하는 지식 웹앱.

## 빠른 시작

```bash
git clone https://github.com/<you>/get-off-early
cd get-off-early
./setup.sh                 # 의존성 체크 → 프로젝트 clone → 색인 → 테스트
node knowledge/web/server.mjs   # 지식 웹앱 (기본 http://localhost:4178)
```

하네스: Claude Code에서 "이거 만들어줘" / "프로젝트 개발해줘" → `build-project` 트리거.

## 옵션

```bash
./setup.sh --with-plugins  # 권장 플러그인 설치 (harness, superpowers) — 없어도 하네스는 동작
./setup.sh --ingest        # 카드 없는(외부) 프로젝트의 지식 카드 생성 (claude 필요, 토큰 소비)
```

## 내 프로젝트 연결 (projects.json)

`projects.json`은 **개인 설정**입니다. `{ "name", "git" }` 항목을 추가하고 `./setup.sh` 재실행하면 clone·색인됩니다.
하네스로 만들지 않은 외부 프로젝트는 `./setup.sh --ingest`(또는 `node knowledge/ingest.mjs <name>`)로 지식 카드를 생성하세요.

## 의존성

- **필수:** Node.js, git
- **선택:** `rg`(없으면 JS 폴백 검색), `claude` CLI(지식 채팅·카드 ingest용)
- 시크릿은 env로: `CHAT_TOKEN`(채팅 게이트), `CHAT_MODEL`/`INGEST` 모델은 UI·플래그로 선택. 커밋 금지.
````

- [ ] **Step 6: JSON 유효성 + 파일 확인**

Run: `node -e "JSON.parse(require('fs').readFileSync('projects.json')); JSON.parse(require('fs').readFileSync('projects.example.json')); JSON.parse(require('fs').readFileSync('.claude/settings.json')); console.log('json ok')"`
Expected: `json ok`

- [ ] **Step 7: 커밋**

```bash
git add .gitignore .claude/settings.json projects.json projects.example.json README.md
git commit -m "chore: 배포 위생 파일 + 매니페스트 + README"
```

---

### Task 8: setup.sh 오케스트레이터

의존성 체크 → (opt 플러그인) → clone+exclude → (opt ingest) → 색인 → 테스트 → 안내. 멱등.

**Files:**
- Create: `setup.sh` (실행권한)

- [ ] **Step 1: `setup.sh` 작성**

```bash
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

WITH_PLUGINS=0; INGEST=0
for a in "$@"; do
  case "$a" in
    --with-plugins) WITH_PLUGINS=1 ;;
    --ingest) INGEST=1 ;;
    -h|--help) echo "usage: ./setup.sh [--with-plugins] [--ingest]"; exit 0 ;;
    *) echo "unknown flag: $a"; exit 2 ;;
  esac
done

echo "==> 1/5 의존성 체크"
command -v node >/dev/null || { echo "  node 필요(필수)"; exit 1; }
command -v git  >/dev/null || { echo "  git 필요(필수)"; exit 1; }
command -v rg   >/dev/null || echo "  rg 없음 — JS 폴백 검색 사용"
HAS_CLAUDE=0; if command -v claude >/dev/null; then HAS_CLAUDE=1; else echo "  claude 없음 — 채팅·ingest 비활성(나머지 정상)"; fi

if [ "$WITH_PLUGINS" = 1 ]; then
  echo "==> (opt) 권장 플러그인 설치"
  if [ "$HAS_CLAUDE" = 1 ]; then
    claude plugin marketplace add anthropics/claude-plugins-official || true
    claude plugin marketplace add revfactory/harness || true
    claude plugin install superpowers@claude-plugins-official || true
    claude plugin install harness@harness-marketplace || true
  else
    echo "  claude 없음 — 건너뜀"
  fi
fi

echo "==> 2/5 프로젝트 clone + git-exclude"
node "$ROOT/scripts/clone-projects.mjs"

if [ "$INGEST" = 1 ]; then
  echo "==> (opt) 카드 없는 프로젝트 ingest"
  if [ "$HAS_CLAUDE" = 1 ]; then node "$ROOT/scripts/ingest-missing.mjs"; else echo "  claude 없음 — 건너뜀"; fi
fi

echo "==> 3/5 색인 생성"
node "$ROOT/knowledge/generate.mjs"

echo "==> 4/5 테스트"
node --test "knowledge/test/**/*.test.mjs" "scripts/test/**/*.test.mjs"

echo "==> 5/5 완료"
cat <<'EOF'
  웹앱:   node knowledge/web/server.mjs   (기본 http://localhost:4178)
  하네스: Claude Code에서 "이거 만들어줘" → build-project
  옵션:   ./setup.sh --with-plugins   권장 플러그인(harness, superpowers)
          ./setup.sh --ingest          카드 없는 외부 프로젝트 카드 생성
EOF
```

- [ ] **Step 2: 실행권한 + 멱등 실행 검증**

Run: `chmod +x setup.sh && ./setup.sh && ./setup.sh`
Expected: 두 번 다 5/5 완료, 테스트 통과. clone 단계는 두 번째에 `exists`. (현재 머신엔 프로젝트가 이미 있어 clone skip.)

- [ ] **Step 3: 커밋**

```bash
git add setup.sh
git commit -m "feat: setup.sh — 멱등 세팅 오케스트레이터"
```

---

### Task 9: 프로젝트별 GitHub 레포 발행 (외부 반영 · 게이트)

Task 1 승인 + `$GH_USER`·`$VIS` 확정 후에만. 각 프로젝트를 독립 repo로 push. 이미 `.git`이 있으면 init 생략.

**Files:** 각 `todo/ shop/ minesweeper/ message-platform/` (per-project git init·push)

- [ ] **Step 1: 사용자 재확인** — "4개 프로젝트를 `https://github.com/$GH_USER/<name>` (가시성 $VIS)로 생성·push합니다. 진행할까요?" 명시적 승인 대기.

- [ ] **Step 2: 각 프로젝트 발행** (이름별 반복; `<name>` ∈ {todo, shop, minesweeper, message-platform})

```bash
for name in todo shop minesweeper message-platform; do
  ( cd "$name"
    if [ ! -e .git ]; then git init -b main; fi
    [ -f .gitignore ] || printf '%s\n' ".DS_Store" "node_modules/" > .gitignore   # 없을 때만 생성(기존 보존)
    git add -A
    git commit -m "init: $name (get-off-early 지식 베이스 분리 발행)" || echo "  $name: 변경 없음"
    gh repo create "$GH_USER/$name" --source=. --remote=origin --push --"$VIS" || \
      { git remote add origin "https://github.com/$GH_USER/$name.git" 2>/dev/null; git push -u origin main; }
  )
done
```
> `.gitignore`는 없을 때만 생성하여 각 프로젝트의 기존 위생 설정을 보존한다.

- [ ] **Step 3: 발행 확인**

Run: `for n in todo shop minesweeper message-platform; do gh repo view "$GH_USER/$n" --json name,visibility -q '.name+" "+.visibility'; done`
Expected: 4개 repo가 기대 가시성으로 조회됨.

---

### Task 10: 메인 레포 발행 (외부 반영 · 게이트)

프레임워크를 `get-off-early` repo로 init·commit·push. 프로젝트 디렉터리는 exclude되어 추적 안 됨.

**Files:** 레포 루트 (git init·commit·push)

- [ ] **Step 1: git init + 프로젝트 디렉터리 exclude 보장**

```bash
git init -b main
node scripts/clone-projects.mjs   # ensureGitExclude 가 .git/info/exclude 에 프로젝트 등록
git status --porcelain | grep -E '^\?\? (todo|shop|minesweeper|message-platform)/' && echo "경고: 프로젝트가 추적 대상" || echo "프로젝트 제외 확인 OK"
```
Expected: "프로젝트 제외 확인 OK" (프로젝트 디렉터리가 untracked 목록에 없음).

- [ ] **Step 2: 프레임워크 커밋** (Task 2~8에서 이미 커밋했다면 누락분만)

```bash
git add .claude/agents .claude/skills .claude/retro CLAUDE.md knowledge docs scripts setup.sh \
        .gitignore .claude/settings.json projects.json projects.example.json README.md
git status   # settings.local.json, INDEX.md, index.json, 프로젝트 디렉터리가 staged 아님을 확인
git commit -m "feat: 이식 가능한 하네스 + 지식 웹앱 프레임워크"
```

- [ ] **Step 3: 사용자 승인 후 push**

```bash
gh repo create "$GH_USER/get-off-early" --source=. --remote=origin --push --"$VIS"
```
Expected: get-off-early repo 생성·push 완료.

- [ ] **Step 4: 누출 점검**

Run: `git ls-files | grep -E 'settings.local.json|index.json|INDEX.md|^(todo|shop|minesweeper|message-platform)/' || echo "누출 없음 OK"`
Expected: "누출 없음 OK".

---

### Task 11: 깨끗한 머신 E2E 검증

새 컴퓨터를 시뮬레이션: 임시 디렉터리에 clone → `./setup.sh` → clone·색인·테스트·웹앱 스모크.

**Files:** 없음 (검증)

- [ ] **Step 1: 임시 위치에 clone + setup**

```bash
TMP="$(mktemp -d)"; git clone "https://github.com/$GH_USER/get-off-early" "$TMP/pl"
cd "$TMP/pl" && ./setup.sh
```
Expected: 의존성 OK → 4개 프로젝트 `cloned` → 색인 생성(`generated: N projects ...`) → 테스트 PASS → 5/5 완료.

- [ ] **Step 2: 웹앱 스모크 (실제 서버)**

```bash
PORT=4188 node knowledge/web/server.mjs & SRV=$!; sleep 1.5
curl -s -o /dev/null -w "index:%{http_code}\n" http://localhost:4188/api/index
curl -s "http://localhost:4188/api/index" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);console.log("projects:",j.projects.map(p=>p.id).join(","))})'
kill $SRV
```
Expected: `index:200`, projects 목록에 clone된 프로젝트들이 표시.

- [ ] **Step 3: (옵션) 외부 프로젝트 ingest 경로 확인** — `claude` 인증된 머신에서 임시 외부 repo를 매니페스트에 추가 후 `./setup.sh --ingest` → `knowledge/cards/<name>.md` 생성 + 색인에 등장 확인.

- [ ] **Step 4: 정리**

```bash
rm -rf "$TMP"
```

---

## 적용 순서 요약

로컬 구현(Task 2~8)을 먼저 끝내고 테스트로 검증 → 외부 발행(Task 9~10)은 사용자 승인 게이트 → E2E(Task 11)로 새 머신 시나리오 확인. Task 1(입력)은 Task 7·9·10 전에 확정만 되면 됨.
