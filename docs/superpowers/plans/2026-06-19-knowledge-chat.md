# Knowledge Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 지식 사이트에 "문서 내용을 질문하면 답하는" 채팅을 추가한다 — `claude -p`(구독 auth, 의존성 0)로 read-only 툴 드릴다운 + `--resume` 대화 지속, 리프레시 전까지 이어짐.

**Architecture:** 서버가 `claude -p`를 spawn해 응답 생성(첫 턴은 `--system-prompt`에 INDEX.md 임베드, 이후 `--resume <sessionId>`). 프론트가 `sessionId`+`messages`를 메모리 보관. 선택적 `CHAT_TOKEN`으로 터널 노출 시 할당량 보호.

**Tech Stack:** Node ≥20 (`child_process.spawn`, `node:test`), `claude` CLI 2.1.181, 기존 무의존성 서버/바닐라 SPA.

## Global Constraints

- **의존성 0**: npm 패키지 금지. Node 내장 + `claude` CLI.
- **ESM `.mjs`**, Node ≥20.
- **기본 모델 `claude-sonnet-4-6`** (`CHAT_MODEL` env로 override). 달러 청구 없음(구독 auth) — 구독 사용량 할당량 소모.
- **claude 호출 시 env 정리**: `CLAUDECODE CLAUDE_CODE_ENTRYPOINT CLAUDE_CODE_SESSION_ID CLAUDE_CODE_CHILD_SESSION` 제거(중첩 방지).
- **read-only**: `--allowedTools "Read Grep Glob"` + `--disallowedTools "Bash Edit Write WebFetch WebSearch Task"`.
- **출력 형식**: `--output-format json` → `{ result, session_id }`.
- **이 디렉터리는 git 리포가 아님** — 각 태스크 종료 = 테스트 통과 / 라이브 검증.
- **테스트 명령**: `node --test 'knowledge/test/*.test.mjs'` (Node 26은 glob 필요).
- **실제 spawn은 자동 테스트 제외**(비용/시간) → 라이브 1회 수동 검증.
- 저장소 루트: `/Users/skull/Documents/practice/project-loop`. 서버 포트 기본 4178.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `knowledge/web/chat.mjs` | `buildSystemPrompt(root)`·`buildChatArgs({...})`(순수)·`chat({...})`(spawn) |
| `knowledge/web/server.mjs` | `POST /api/chat` 추가(토큰 게이트·본문 파싱·chat 호출) |
| `knowledge/web/public/index.html` | 채팅 진입 버튼 |
| `knowledge/web/public/app.js` | `#chat` 라우트·채팅 뷰·`chat` 상태·전송 |
| `knowledge/web/public/style.css` | 채팅 UI 스타일 |
| `knowledge/test/chat.test.mjs` | `buildSystemPrompt`·`buildChatArgs` 단위 테스트 |
| `knowledge/test/server.test.mjs` | `/api/chat` 토큰 401 + 400 테스트 (수정) |
| `MEMORY.md` / `CLAUDE.md` / `.claude/retro/log.md` | 기록 (수정) |

---

## Task 1: chat.mjs 순수 함수 (시스템 프롬프트 + argv)

**Files:**
- Create: `knowledge/web/chat.mjs`
- Test: `knowledge/test/chat.test.mjs`

**Interfaces:**
- Produces:
  - `buildSystemPrompt(root: string) → string` (Q&A 지침 + 오리엔테이션 + INDEX.md 임베드)
  - `buildChatArgs({ message, sessionId, model, systemPrompt }) → string[]`
    - 두 변형 모두 `--model`·`--allowedTools "Read Grep Glob"`·`--disallowedTools ...`·`--output-format json` 포함.
    - `sessionId` 있으면 `--resume <sessionId>` (system-prompt 없음); 없으면 `--system-prompt <systemPrompt>`.

- [ ] **Step 1: Write the failing test**

```js
// knowledge/test/chat.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildSystemPrompt, buildChatArgs } from '../web/chat.mjs';

function fixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-'));
  fs.mkdirSync(path.join(root, 'knowledge'), { recursive: true });
  fs.writeFileSync(path.join(root, 'knowledge', 'INDEX.md'), '# Project Knowledge Index\n## shop — 미니샵\n');
  return root;
}

test('buildSystemPrompt embeds INDEX.md and orientation', () => {
  const sp = buildSystemPrompt(fixtureRoot());
  assert.match(sp, /Project Knowledge Index/);   // INDEX.md content embedded
  assert.match(sp, /knowledge\/cards/);           // orientation map
  assert.match(sp, /Read|Grep|Glob/);             // tool guidance
});

test('buildSystemPrompt tolerates missing INDEX.md', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-empty-'));
  const sp = buildSystemPrompt(root);
  assert.equal(typeof sp, 'string');
  assert.match(sp, /generate\.mjs/);              // hint to regenerate
});

test('buildChatArgs first turn uses --system-prompt, not --resume', () => {
  const args = buildChatArgs({ message: 'hi', sessionId: null, model: 'claude-sonnet-4-6', systemPrompt: 'SYS' });
  assert.equal(args.includes('--resume'), false);
  const i = args.indexOf('--system-prompt');
  assert.equal(args[i + 1], 'SYS');
  assert.deepEqual([args[0], args[1]], ['-p', 'hi']);
  assert.equal(args.includes('--output-format'), true);
  assert.equal(args.join(' ').includes('Read Grep Glob'), true);
  assert.equal(args[args.indexOf('--model') + 1], 'claude-sonnet-4-6');
});

test('buildChatArgs resume uses --resume, not --system-prompt', () => {
  const args = buildChatArgs({ message: 'next', sessionId: 'sid-1', model: 'claude-sonnet-4-6', systemPrompt: 'SYS' });
  assert.equal(args.includes('--system-prompt'), false);
  assert.equal(args[args.indexOf('--resume') + 1], 'sid-1');
  assert.equal(args.includes('--output-format'), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test 'knowledge/test/chat.test.mjs'`
Expected: FAIL — `Cannot find module '../web/chat.mjs'`.

- [ ] **Step 3: Write minimal implementation**

```js
// knowledge/web/chat.mjs
import fs from 'node:fs';
import path from 'node:path';

const READ_ONLY_TOOLS = 'Read Grep Glob';
const DISALLOWED_TOOLS = 'Bash Edit Write WebFetch WebSearch Task';

export function buildSystemPrompt(root) {
  const indexPath = path.join(root, 'knowledge', 'INDEX.md');
  const index = fs.existsSync(indexPath)
    ? fs.readFileSync(indexPath, 'utf8')
    : '(INDEX.md 없음 — `node knowledge/generate.mjs` 로 생성 필요)';
  return [
    'project-loop 지식 베이스에 대한 질문에 한국어로 간결히 답하는 어시스턴트다.',
    '아래 INDEX.md(색인)를 우선 근거로 삼고, 더 깊은 내용은 read-only 툴(Read, Grep, Glob)로 드릴다운한다:',
    '- knowledge/cards/*.md (프로젝트 카드), knowledge/patterns/*.md (재사용 패턴),',
    '  <project>/_workspace/*.md (원본 산출물: 요구사항·설계·아키텍처·QA), <project>/backend|frontend (코드).',
    '읽기 전용이며 어떤 파일도 수정하지 않는다. 근거 없는 추측을 하지 말고, 모르면 모른다고 한다.',
    '',
    '=== knowledge/INDEX.md ===',
    index,
  ].join('\n');
}

export function buildChatArgs({ message, sessionId, model, systemPrompt }) {
  const base = [
    '-p', message,
    '--model', model,
    '--allowedTools', READ_ONLY_TOOLS,
    '--disallowedTools', DISALLOWED_TOOLS,
    '--output-format', 'json',
  ];
  if (sessionId) return [...base, '--resume', sessionId];
  return [...base, '--system-prompt', systemPrompt];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test 'knowledge/test/chat.test.mjs'`
Expected: PASS (4 tests).

- [ ] **Step 5: Verify (checkpoint)**

Run: `node --test 'knowledge/test/chat.test.mjs'`
Expected: `# pass 4  # fail 0`.

---

## Task 2: chat.mjs spawn 래퍼 `chat()`

**Files:**
- Modify: `knowledge/web/chat.mjs` (append)

**Interfaces:**
- Consumes: `buildSystemPrompt`, `buildChatArgs`
- Produces: `chat({ message, sessionId, root, model?, timeoutMs? }) → Promise<{ answer, sessionId }>`

- [ ] **Step 1: Append implementation**

```js
// append to knowledge/web/chat.mjs
import { spawn } from 'node:child_process';

const CLEAN_ENV_KEYS = ['CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT', 'CLAUDE_CODE_SESSION_ID', 'CLAUDE_CODE_CHILD_SESSION'];

export function chat({ message, sessionId, root, model = process.env.CHAT_MODEL || 'claude-sonnet-4-6', timeoutMs = 120000 }) {
  const systemPrompt = sessionId ? null : buildSystemPrompt(root);
  const args = buildChatArgs({ message, sessionId, model, systemPrompt });
  const env = { ...process.env };
  for (const k of CLEAN_ENV_KEYS) delete env[k];
  return new Promise((resolve, reject) => {
    const child = spawn('claude', args, { cwd: root, env });
    let stdout = '', stderr = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('chat timeout')); }, timeoutMs);
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`claude exited ${code}: ${stderr.slice(0, 300)}`));
      try {
        const j = JSON.parse(stdout);
        resolve({ answer: j.result, sessionId: j.session_id });
      } catch {
        reject(new Error('failed to parse claude output: ' + stdout.slice(0, 200)));
      }
    });
  });
}
```

- [ ] **Step 2: Live verify (one real call — consumes subscription quota)**

Run:
```bash
node -e "import('./knowledge/web/chat.mjs').then(async m => { const r = await m.chat({ message: '지식 베이스에 프로젝트가 몇 개 있고 id가 뭐야? 한 줄로.', root: process.cwd() }); console.log('ANSWER:', r.answer); console.log('SID:', r.sessionId); })"
```
Expected: 프로젝트 목록(예: minesweeper, shop, todo, message-platform)을 담은 한 줄 답변 + `SID:` 에 세션 id 출력.

- [ ] **Step 3: Live verify continuity (resume)**

Run (replace `<SID>` with the SID from Step 2):
```bash
node -e "import('./knowledge/web/chat.mjs').then(async m => { const r = await m.chat({ message: '그 중 첫 번째 프로젝트만 다시 말해줘.', sessionId: '<SID>', root: process.cwd() }); console.log('ANSWER:', r.answer); })"
```
Expected: 직전 답변 맥락을 유지한 답(이전 목록의 첫 프로젝트를 지칭).

---

## Task 3: 서버 `POST /api/chat` + 토큰 게이트

**Files:**
- Modify: `knowledge/web/server.mjs`
- Test: `knowledge/test/server.test.mjs` (append)

**Interfaces:**
- Consumes: `chat` (Task 2), existing `sendJson`/`sendText`, `ROOT`
- Produces: `POST /api/chat` route. Body `{ message, sessionId? }`, optional header `x-chat-token`. → 200 `{ answer, sessionId }` / 400 / 401 / 500.

- [ ] **Step 1: Write the failing test (append to server.test.mjs)**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test 'knowledge/test/server.test.mjs'`
Expected: FAIL — `/api/chat` 미존재 → 404 받음 (assert 401/400 실패).

- [ ] **Step 3: Add implementation to server.mjs**

Add import near the top (after the index-core import):

```js
import { chat } from './chat.mjs';
```

Add a body-reading helper (before `handleRequest`):

```js
function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => resolve(data));
  });
}
```

Add the route inside `handleRequest`'s returned function, **after** the `/api/search` block and before the static-file fallback:

```js
    if (url.pathname === '/api/chat' && req.method === 'POST') {
      const token = process.env.CHAT_TOKEN;
      if (token && req.headers['x-chat-token'] !== token) return sendText(res, 401, 'Unauthorized');
      readBody(req).then(async (raw) => {
        let body;
        try { body = JSON.parse(raw || '{}'); } catch { return sendJson(res, 400, { error: 'invalid json' }); }
        if (!body.message || !String(body.message).trim()) return sendJson(res, 400, { error: 'message required' });
        try {
          const result = await chat({ message: body.message, sessionId: body.sessionId, root });
          sendJson(res, 200, result);
        } catch (e) {
          sendJson(res, 500, { error: String((e && e.message) || e) });
        }
      });
      return;
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test 'knowledge/test/server.test.mjs'`
Expected: PASS (server tests incl. 2 new chat tests). No `claude` spawn occurs (both paths return before `chat()`).

- [ ] **Step 5: Verify full suite**

Run: `node --test 'knowledge/test/*.test.mjs'`
Expected: all pass (`# fail 0`).

---

## Task 4: 프론트 채팅 UI

**Files:**
- Modify: `knowledge/web/public/index.html`
- Modify: `knowledge/web/public/app.js`
- Modify: `knowledge/web/public/style.css`

**Interfaces:**
- Consumes: `POST /api/chat`, existing `goBack`, `parseRoute`/`renderRoute`, `marked`.

- [ ] **Step 1: Add the chat entry button to index.html**

In `knowledge/web/public/index.html`, change the search line to add a button right after it:

```html
    <input id="search" type="search" placeholder="전체 검색 (제목·태그·본문)" />
    <button id="chat-btn" type="button">💬 지식에게 질문</button>
    <div id="type-filters"></div>
```

- [ ] **Step 2: Add chat styles to style.css**

Append to `knowledge/web/public/style.css`:

```css
#chat-btn { width: 100%; margin-bottom: 12px; padding: 9px; border: 1px solid #2563eb; color: #2563eb; background: #fff; border-radius: 8px; cursor: pointer; font-size: 14px; }
#chat-btn:hover { background: #eef2fe; }
#chat-log { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.msg { padding: 10px 14px; border-radius: 12px; max-width: 80%; word-break: break-word; }
.msg-user { align-self: flex-end; background: #2563eb; color: #fff; }
.msg-assistant { align-self: flex-start; background: #f1f4f9; }
.msg-assistant.pending { color: #6b7280; font-style: italic; }
.msg-assistant p:first-child { margin-top: 0; }
.msg-assistant p:last-child { margin-bottom: 0; }
.msg-assistant pre { background: #e9edf3; padding: 8px; border-radius: 6px; overflow-x: auto; }
#chat-form { display: flex; gap: 8px; position: sticky; bottom: 0; background: #fff; padding: 8px 0; }
#chat-input { flex: 1; padding: 10px 12px; border: 1px solid #cbd3e0; border-radius: 8px; }
#chat-form button { padding: 10px 16px; border: none; background: #2563eb; color: #fff; border-radius: 8px; cursor: pointer; }
```

- [ ] **Step 3: Wire the button and route in app.js**

In `load()`, after `renderProjects();`, add the button handler:

```js
  document.getElementById('chat-btn').onclick = () => { location.hash = 'chat'; };
```

In `parseRoute()`, add a `chat` branch at the top (after reading `h`):

```js
  if (h === 'chat') return { view: 'chat' };
```

In `renderRoute()`, add a `chat` branch (before the final `else`):

```js
  } else if (r.view === 'chat') {
    document.body.classList.add('detail');
    showChat();
```

- [ ] **Step 4: Add the chat view + state + send to app.js**

Append to `knowledge/web/public/app.js`:

```js
// ---- Knowledge chat (memory-resident; cleared on refresh) ----
const chatState = { sessionId: null, messages: [], pending: false };

function showChat() {
  const main = document.getElementById('main');
  main.innerHTML = '';
  const bar = document.createElement('div'); bar.className = 'topbar';
  const back = document.createElement('button'); back.className = 'back'; back.textContent = '← 뒤로'; back.onclick = goBack;
  const label = document.createElement('span'); label.className = 'path'; label.textContent = '💬 지식 채팅 — 리프레시 전까지 대화 유지';
  bar.appendChild(back); bar.appendChild(label); main.appendChild(bar);

  const log = document.createElement('div'); log.id = 'chat-log'; main.appendChild(log);

  const form = document.createElement('form'); form.id = 'chat-form';
  const input = document.createElement('input'); input.id = 'chat-input'; input.placeholder = '질문을 입력…'; input.autocomplete = 'off';
  const send = document.createElement('button'); send.type = 'submit'; send.textContent = '전송';
  form.appendChild(input); form.appendChild(send);
  form.onsubmit = (e) => { e.preventDefault(); const v = input.value; input.value = ''; sendChat(v); };
  main.appendChild(form);

  renderChatLog();
  input.focus();
}

function renderChatLog() {
  const log = document.getElementById('chat-log');
  if (!log) return;
  log.innerHTML = '';
  if (!chatState.messages.length && !chatState.pending) {
    const hint = document.createElement('div'); hint.className = 'msg msg-assistant';
    hint.textContent = '프로젝트 이력·아키텍처 결정·패턴·gotcha에 대해 물어보세요. 예: "shop의 동시성 어떻게 처리했어?"';
    log.appendChild(hint);
  }
  for (const m of chatState.messages) {
    const el = document.createElement('div'); el.className = 'msg msg-' + m.role;
    if (m.role === 'assistant') el.innerHTML = marked.parse(m.text);
    else el.textContent = m.text;
    log.appendChild(el);
  }
  if (chatState.pending) {
    const el = document.createElement('div'); el.className = 'msg msg-assistant pending'; el.textContent = '생각 중…';
    log.appendChild(el);
  }
  log.scrollTop = log.scrollHeight;
}

async function sendChat(text) {
  if (!text.trim() || chatState.pending) return;
  chatState.messages.push({ role: 'user', text });
  chatState.pending = true;
  renderChatLog();
  try {
    const headers = { 'content-type': 'application/json' };
    const token = localStorage.getItem('chatToken');
    if (token) headers['x-chat-token'] = token;
    const res = await fetch('/api/chat', {
      method: 'POST', headers,
      body: JSON.stringify({ message: text, sessionId: chatState.sessionId }),
    });
    if (res.status === 401) {
      chatState.pending = false;
      chatState.messages.pop();           // remove optimistic user msg before retry
      renderChatLog();
      const t = prompt('CHAT_TOKEN 필요 — 토큰을 입력하세요:');
      if (t) { localStorage.setItem('chatToken', t); return sendChat(text); }
      return;
    }
    const data = await res.json();
    chatState.pending = false;
    if (data.error) chatState.messages.push({ role: 'assistant', text: '⚠️ 오류: ' + data.error });
    else { chatState.messages.push({ role: 'assistant', text: data.answer }); chatState.sessionId = data.sessionId; }
    renderChatLog();
  } catch (e) {
    chatState.pending = false;
    chatState.messages.push({ role: 'assistant', text: '⚠️ 요청 실패: ' + e });
    renderChatLog();
  }
}
```

- [ ] **Step 5: Verify static assets serve**

Run (server must be running — started in Task 5): `curl -s http://localhost:4178/app.js | grep -c "showChat"`
Expected: ≥ 1 (updated app.js served).

---

## Task 5: 라이브 E2E + 하네스 기록

**Files:**
- Modify: `MEMORY.md`, `CLAUDE.md`, `.claude/retro/log.md`

- [ ] **Step 1: Start the server**

Run (background): `PORT=4178 node knowledge/web/server.mjs`
Expected: `knowledge site: http://localhost:4178`.

- [ ] **Step 2: Live API — first turn + continuity (real claude calls)**

Run:
```bash
SID=$(curl -s -X POST http://localhost:4178/api/chat -H 'content-type: application/json' \
  -d '{"message":"지식 베이스에 어떤 프로젝트들이 있어? id만 한 줄로."}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const j=JSON.parse(d);console.error('A1:',j.answer);process.stdout.write(j.sessionId||'')})")
echo "SID=$SID"
curl -s -X POST http://localhost:4178/api/chat -H 'content-type: application/json' \
  -d "{\"message\":\"방금 답한 것 중 shop에 대해 한 줄로 더 설명해줘.\",\"sessionId\":\"$SID\"}" \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{console.log('A2:',JSON.parse(d).answer)})"
```
Expected: `A1` = 프로젝트 id 목록, `SID` 비어있지 않음, `A2` = 직전 맥락(shop)을 이어받은 답.

- [ ] **Step 3: Browser E2E (CDP) — chat UI + continuity**

Drive headless Chrome to `http://localhost:4178/`:
1. Click `#chat-btn` → confirm `location.hash === '#chat'`, `#chat-form` present, `body.detail` set (mobile-style full screen).
2. Set `#chat-input` value to a question, submit the form → wait → confirm a `.msg-user` and a `.msg-assistant` (non-pending) appear, capture screenshot.
3. Submit a follow-up → confirm `chatState.sessionId` is non-null and a second assistant reply appears (continuity).
Expected: two Q&A pairs render; back button returns to the list (`#chat` → list).

- [ ] **Step 4: Stop the server**

Stop the background `node knowledge/web/server.mjs`.

- [ ] **Step 5: Record in harness docs**

Append a `MEMORY.md` line (under existing list):

```markdown
- [Knowledge chat](project-knowledge-base.md) — 사이트에 claude -p 기반 채팅(구독 auth·키 불필요, read-only 툴 드릴다운, --resume 대화 지속); 기본 모델 sonnet, CHAT_MODEL/CHAT_TOKEN env
```

Append a `CLAUDE.md` 변경 이력 row:

```markdown
| 2026-06-19 | 지식 사이트에 채팅 추가: claude -p(구독 auth·의존성 0) + read-only 툴 + --resume 대화 지속, /api/chat(선택 CHAT_TOKEN), 기본 sonnet. 달러 청구 없음·구독 할당량 소모 | knowledge/web/chat·server·public, memory/project-knowledge-base | 사이트에서 문서 내용을 자연어로 질의(사용자 요청) |
```

Append a `.claude/retro/log.md` entry:

```markdown
## 2026-06-19 — (수동 기능) 지식 베이스 채팅 (claude -p 재사용)
- 신호: 사용자가 "사이트에서 문서 내용을 질문하면 답하는, 이 세션처럼 이어지는 채팅" 요청.
- 일반화/반영: 별도 API 키 없이 기존 Claude Code 구독 auth를 child_process로 재사용(claude -p --output-format json). --system-prompt override로 경량화(8574→10토큰) + INDEX.md 임베드, read-only 툴(Read/Grep/Glob) 드릴다운, --resume로 대화 지속(프론트가 sessionId 메모리 보관, 리프레시=새 대화). 모델은 구독 할당량(달러 아님)을 태우므로 보조 채팅은 sonnet 기본. 터널 노출=할당량 소진 위험 → 선택적 CHAT_TOKEN.
- 보존: 의존성 0·파일=원본 규율 유지. 실제 spawn은 비용 때문에 자동 테스트 제외하고 라이브(curl+CDP)로 검증 — "실제 브라우저 검증" 규율 적용.
```

- [ ] **Step 6: Final regression**

Run: `node --test 'knowledge/test/*.test.mjs'`
Expected: all pass (`# fail 0`).

---

## Self-Review (completed by author)

- **Spec coverage**: §2 백엔드(claude -p)→Tasks 1–2; §3 컨텍스트(INDEX 임베드+툴)→Task 1 `buildSystemPrompt`; §4 지속(resume)→Tasks 1·2; §5 CHAT_TOKEN→Task 3; §6 단위경계→파일구조표; §7 데이터흐름→Task 3; §8 에러처리→Task 2(timeout/parse/exit)·Task 3(400/500); §9 프론트 UI→Task 4; §10 테스트→Tasks 1·3 + 라이브 Task 2·5. 모든 절 대응.
- **Placeholder scan**: 코드 스텝 전부 실제 코드. 라이브 검증 스텝은 정확한 명령+기대값.
- **Type consistency**: `buildChatArgs({message,sessionId,model,systemPrompt})`·`chat({message,sessionId,root,model?})→{answer,sessionId}`·`/api/chat` 본문 `{message,sessionId?}`→`{answer,sessionId}`·프론트 `chatState{sessionId,messages,pending}` 전 태스크 일관.
