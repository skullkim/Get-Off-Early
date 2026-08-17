import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';

const READ_ONLY_TOOLS = 'Read Grep Glob';
const DISALLOWED_TOOLS = 'Bash Edit Write WebFetch WebSearch Task';

// User-selectable models. The UI sends a friendly key ('sonnet'|'opus');
// only ids in this allowlist are ever passed to `claude --model`.
// Ids are env-overridable (CHAT_MODEL_SONNET / CHAT_MODEL_OPUS) so a model
// generation swap needs no code change — the allowlist structure stays.
export function buildChatModels(env = process.env) {
  return {
    sonnet: env.CHAT_MODEL_SONNET || 'claude-sonnet-4-6',
    opus: env.CHAT_MODEL_OPUS || 'claude-opus-4-8',
  };
}
export const CHAT_MODELS = buildChatModels();

// Resolve untrusted input to a safe model id. Accepts a friendly key or an
// exact allowed id; anything unknown/missing falls back to the default —
// arbitrary strings never reach the spawned process.
export function resolveModel(input, models = CHAT_MODELS) {
  const allowed = new Set(Object.values(models));
  if (input && models[input]) return models[input];
  if (input && allowed.has(input)) return input;
  return allowed.has(process.env.CHAT_MODEL) ? process.env.CHAT_MODEL : models.sonnet;
}
export const DEFAULT_MODEL = resolveModel(undefined);

export function buildSystemPrompt(root) {
  const indexPath = path.join(root, 'knowledge', 'INDEX.md');
  const index = fs.existsSync(indexPath)
    ? fs.readFileSync(indexPath, 'utf8')
    : '(INDEX.md 없음 — `node knowledge/generate.mjs` 로 생성 필요)';
  return [
    'get-off-early 지식 베이스에 대한 질문에 한국어로 간결히 답하는 어시스턴트다.',
    '아래 INDEX.md(색인)를 우선 근거로 삼고, 더 깊은 내용은 read-only 툴(Read, Grep, Glob)로 드릴다운한다:',
    '- knowledge/cards/*.md (프로젝트 카드), knowledge/patterns/*.md (재사용 패턴),',
    '  <project>/_workspace/*.md (원본 산출물: 요구사항·설계·아키텍처·QA), <project>/backend|frontend (코드).',
    '읽기 전용이며 어떤 파일도 수정하지 않는다. 근거 없는 추측을 하지 말고, 모르면 모른다고 한다.',
    '',
    '=== knowledge/INDEX.md ===',
    index,
  ].join('\n');
}

// `stream: true` swaps the single-shot json result for the CLI's NDJSON event
// stream. Both extra flags are mandatory there: --include-partial-messages is
// what turns on the per-token `content_block_delta` events, and the CLI only
// accepts stream-json under `-p` when --verbose is set.
export function buildChatArgs({ message, sessionId, model, systemPrompt, stream = false }) {
  const base = [
    '-p', message,
    '--model', model,
    '--allowedTools', READ_ONLY_TOOLS,
    '--disallowedTools', DISALLOWED_TOOLS,
    ...(stream
      ? ['--output-format', 'stream-json', '--include-partial-messages', '--verbose']
      : ['--output-format', 'json']),
  ];
  if (sessionId) return [...base, '--resume', sessionId];
  return [...base, '--system-prompt', systemPrompt];
}

const CLEAN_ENV_KEYS = ['CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT', 'CLAUDE_CODE_SESSION_ID', 'CLAUDE_CODE_CHILD_SESSION'];

// Tag low-level failures with stable codes the server can map to proper HTTP
// statuses. ENOENT = the `claude` binary is missing from PATH — the one
// failure an operator can fix directly, so it deserves an explicit message.
function tagSpawnError(e) {
  if (e && e.code === 'ENOENT') {
    return Object.assign(new Error('claude CLI not found — install it or check PATH'), { code: 'CLAUDE_NOT_FOUND' });
  }
  return e;
}

// One line of `--output-format stream-json` output → what we care about, or
// null for the many event types we ignore. Kept pure so the whole event schema
// is testable without spawning the CLI.
//
// Shape verified against the real CLI:
//   {"type":"system","subtype":"init","session_id":"…"}                      ← session id, arrives first
//   {"type":"stream_event","event":{"type":"content_block_delta",
//      "delta":{"type":"text_delta","text":"…"}},"parent_tool_use_id":null}  ← the text as it is produced
//   {"type":"result","subtype":"success","result":"…","session_id":"…"}      ← final full answer
// `assistant` lines repeat the whole message (would double the text) and
// thinking/tool deltas are not answer text, so both are dropped.
export function parseStreamLine(line) {
  if (!line || !line.trim()) return null;
  let ev;
  try { ev = JSON.parse(line); } catch { return null; }   // a truncated line is never fatal
  if (!ev || typeof ev !== 'object') return null;
  if (ev.type === 'stream_event') {
    const inner = ev.event || {};
    if (inner.type !== 'content_block_delta') return null;
    const delta = inner.delta || {};
    // sub-agent output (parent_tool_use_id set) is not part of this answer
    if (delta.type !== 'text_delta' || ev.parent_tool_use_id) return null;
    return { kind: 'delta', text: delta.text || '' };
  }
  if (ev.type === 'result') {
    return { kind: 'result', answer: ev.result ?? '', sessionId: ev.session_id, isError: !!ev.is_error };
  }
  if (ev.type === 'system' && ev.subtype === 'init' && ev.session_id) {
    return { kind: 'session', sessionId: ev.session_id };
  }
  return null;
}

// Buffers stdout chunks into whole NDJSON lines (a chunk boundary can land
// mid-line), pushes text deltas out through onDelta, and accumulates the final
// answer. The deltas are also summed so a stream that dies before the `result`
// line still yields whatever text arrived.
export function createStreamReader({ onDelta } = {}) {
  let buffer = '';
  let accumulated = '';
  let answer = null;
  let sessionId = null;

  const handle = (line) => {
    const ev = parseStreamLine(line);
    if (!ev) return;
    if (ev.kind === 'delta') {
      accumulated += ev.text;
      if (onDelta && ev.text) onDelta(ev.text);
    } else if (ev.kind === 'result') {
      answer = ev.answer;
      if (ev.sessionId) sessionId = ev.sessionId;
    } else if (ev.kind === 'session') {
      sessionId = ev.sessionId;
    }
  };

  return {
    push(chunk) {
      buffer += chunk;
      const lines = buffer.split('\n');
      buffer = lines.pop();          // last element is an incomplete line (or '')
      for (const line of lines) handle(line);
    },
    end() {
      if (buffer) { handle(buffer); buffer = ''; }
    },
    result() {
      return { answer: answer === null ? accumulated : answer, sessionId, sawResult: answer !== null };
    },
  };
}

// Streaming twin of chat(): same spawn/env/error-tagging contract, but the
// answer is handed out token by token through onDelta instead of after the
// process exits — the UI never has to sit on an unbounded spinner.
export function chatStream({ message, sessionId, root, model, timeoutMs = 120000, spawnFn = spawn, onDelta }) {
  const systemPrompt = sessionId ? null : buildSystemPrompt(root);
  const args = buildChatArgs({ message, sessionId, model: resolveModel(model), systemPrompt, stream: true });
  const env = { ...process.env };
  for (const k of CLEAN_ENV_KEYS) delete env[k];
  return new Promise((resolve, reject) => {
    const child = spawnFn('claude', args, { cwd: root, env });
    const reader = createStreamReader({ onDelta });
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(Object.assign(new Error('chat timeout'), { code: 'CHAT_TIMEOUT' }));
    }, timeoutMs);
    child.stdout.on('data', (d) => reader.push(String(d)));
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', (e) => { clearTimeout(timer); reject(tagSpawnError(e)); });
    child.on('close', (code) => {
      clearTimeout(timer);
      reader.end();
      if (code !== 0) return reject(new Error(`claude exited ${code}: ${stderr.slice(0, 300)}`));
      const out = reader.result();
      if (!out.sawResult && !out.answer) return reject(new Error('claude stream produced no output'));
      resolve({ answer: out.answer, sessionId: out.sessionId });
    });
  });
}

export function chat({ message, sessionId, root, model, timeoutMs = 120000, spawnFn = spawn }) {
  const systemPrompt = sessionId ? null : buildSystemPrompt(root);
  const args = buildChatArgs({ message, sessionId, model: resolveModel(model), systemPrompt });
  const env = { ...process.env };
  for (const k of CLEAN_ENV_KEYS) delete env[k];
  return new Promise((resolve, reject) => {
    const child = spawnFn('claude', args, { cwd: root, env });
    let stdout = '', stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(Object.assign(new Error('chat timeout'), { code: 'CHAT_TIMEOUT' }));
    }, timeoutMs);
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('error', (e) => { clearTimeout(timer); reject(tagSpawnError(e)); });
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

