import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildIndex, classifyFile } from '../index-core.mjs';
import { chat } from './chat.mjs';

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

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (c) => { data += c; });
    req.on('end', () => resolve(data));
  });
}

// Each chat request spawns a `claude` process for up to 120s. Unbounded
// concurrency can exhaust the machine and the subscription quota, so admit
// at most `max` chats at once (CHAT_MAX_CONCURRENT env, default 2).
export function createGate(max) {
  let active = 0;
  return {
    tryAcquire() { if (active >= max) return false; active++; return true; },
    release() { active = Math.max(0, active - 1); },
  };
}
const CHAT_MAX_CONCURRENT = Math.max(1, Number(process.env.CHAT_MAX_CONCURRENT) || 2);

export function chatErrorResponse(e) {
  if (e && e.code === 'CLAUDE_NOT_FOUND') return { status: 503, body: { error: e.message } };
  if (e && e.code === 'CHAT_TIMEOUT') return { status: 504, body: { error: e.message } };
  return { status: 500, body: { error: String((e && e.message) || e) } };
}

export function handleRequest(root, { chatFn = chat, gate = createGate(CHAT_MAX_CONCURRENT) } = {}) {
  return (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/index') return sendJson(res, 200, buildIndex(root));
    if (url.pathname === '/api/file') {
      const abs = safeResolve(root, url.searchParams.get('path') || '');
      if (!abs || !fs.existsSync(abs) || !fs.statSync(abs).isFile()) return sendText(res, 403, 'Forbidden');
      return sendFile(res, abs);
    }
    if (url.pathname === '/api/search') {
      return sendJson(res, 200, runSearch(root, url.searchParams.get('q') || ''));
    }
    if (url.pathname === '/api/chat' && req.method === 'POST') {
      const token = process.env.CHAT_TOKEN;
      if (token && req.headers['x-chat-token'] !== token) return sendText(res, 401, 'Unauthorized');
      readBody(req).then(async (raw) => {
        let body;
        try { body = JSON.parse(raw || '{}'); } catch { return sendJson(res, 400, { error: 'invalid json' }); }
        if (!body.message || !String(body.message).trim()) return sendJson(res, 400, { error: 'message required' });
        if (!gate.tryAcquire()) return sendJson(res, 429, { error: 'too many concurrent chats — retry shortly' });
        try {
          const result = await chatFn({ message: body.message, sessionId: body.sessionId, model: body.model, root });
          sendJson(res, 200, result);
        } catch (e) {
          const { status, body: errBody } = chatErrorResponse(e);
          sendJson(res, status, errBody);
        } finally {
          gate.release();
        }
      });
      return;
    }
    // static
    const rel = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
    const sAbs = safeResolve(PUBLIC, rel);
    if (sAbs && fs.existsSync(sAbs) && fs.statSync(sAbs).isFile()) return sendFile(res, sAbs);
    return sendText(res, 404, 'Not found');
  };
}

export function createServer(root = ROOT, deps) {
  return http.createServer(handleRequest(root, deps));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const port = process.env.PORT || 4178;
  createServer().listen(port, () => console.log(`knowledge site: http://localhost:${port}`));
}
