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
