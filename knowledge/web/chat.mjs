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

