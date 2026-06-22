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
