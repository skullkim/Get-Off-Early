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

// 재시도는 코드 재분석이 아니라 방금 만든 카드의 형식 교정이므로, 원래 지시 + 실패
// 카드 전문 + critic 판정을 함께 준다. validateCard 는 결정적 critic 이라 무엇이
// 틀렸는지 정확히 알고 있는데, 지금껏 그 정보를 생성자에게 되먹이지 않고 버렸다.
export function buildRetryPrompt(originalPrompt, failedCard, validationError) {
  return [
    originalPrompt,
    '',
    '=== 직전 시도로 생성된 카드 ===',
    failedCard,
    '=== 여기까지 ===',
    '',
    `검증 실패: ${validationError}. 해당 항목만 보완해 카드 전체를 다시 출력하라. 나머지 내용은 유지하라.`,
    '코드펜스(```)나 설명 문장 없이 --- 로 시작하라.',
  ].join('\n');
}

export function spawnCardGenerator({ message, model, cwd, timeoutMs }) {
  const args = buildIngestArgs({ message, model });
  return new Promise((resolve, reject) => {
    const child = spawn('claude', args, { cwd });
    let out = '', err = '';
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('ingest timeout')); }, timeoutMs);
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`claude exited ${code}: ${err.slice(0, 200)}`));
      try { resolve(extractCard(out)); } catch { reject(new Error('parse fail: ' + out.slice(0, 150))); }
    });
  });
}

function writeCard(root, name, card) {
  const dest = path.join(root, 'knowledge', 'cards', `${name}.md`);
  fs.writeFileSync(dest, card.endsWith('\n') ? card : card + '\n');
  return dest;
}

// Actor-Critic: 생성(actor) → validateCard(critic) → 불합격이면 판정을 되먹여 1회 교정.
// 상한이 1회인 이유 — 같은 결정적 검사에 2연속 탈락은 형식 실수가 아니라 더 깊은
// 문제이므로 반복해도 수렴하지 않는다(test-time compute 예산 통제).
export async function ingest({ name, model, root = ROOT, timeoutMs = 180000, generateFn = spawnCardGenerator }) {
  const projectDir = path.join(root, name);
  if (!fs.existsSync(projectDir)) throw new Error(`프로젝트 디렉터리 없음: ${projectDir}`);
  const prompt = buildCardPrompt(name);
  const gen = (message) => generateFn({ message, model, cwd: projectDir, timeoutMs });

  const first = await gen(prompt);
  const v1 = validateCard(first);
  if (v1.ok) return writeCard(root, name, first);   // 성공 경로는 기존 그대로 — 추가 비용 0

  const second = await gen(buildRetryPrompt(prompt, first, v1.error));
  const v2 = validateCard(second);
  if (v2.ok) return writeCard(root, name, second);
  throw new Error(`카드 검증 실패(재시도 후에도): 1차 — ${v1.error} / 2차 — ${v2.error}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const name = process.argv[2];
  const mi = process.argv.indexOf('--model');
  const model = mi > -1 ? process.argv[mi + 1] : undefined;
  if (!name) { console.error('usage: node knowledge/ingest.mjs <project> [--model sonnet|opus]'); process.exit(1); }
  ingest({ name, model }).then((p) => console.log('카드 작성:', p)).catch((e) => { console.error(e.message); process.exit(1); });
}
