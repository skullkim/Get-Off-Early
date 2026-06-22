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
