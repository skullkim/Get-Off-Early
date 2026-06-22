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
