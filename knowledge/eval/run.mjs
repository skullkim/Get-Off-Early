// Golden-set evaluation for the knowledge chat ("an untested agent is an
// untrusted agent"). Deliberately NOT part of `node --test`: each case spawns
// a real `claude` process and spends subscription quota, so this runs manually:
//   node knowledge/eval/run.mjs [--model sonnet|opus]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// mustInclude semantics: every group must match (AND); a group matches when
// any of its alternatives appears in the answer (OR), case-insensitively.
export function evaluateAnswer(answer, mustInclude) {
  const haystack = String(answer || '').toLowerCase();
  const missing = mustInclude.filter((group) => !group.some((alt) => haystack.includes(alt.toLowerCase())));
  return { passed: missing.length === 0, missing };
}

// Sequential on purpose: parallel runs would race the subscription quota and
// the machine the same way unbounded /api/chat did before the gate.
export async function runEval(cases, chatFn, { root, model } = {}) {
  const results = [];
  for (const c of cases) {
    const t0 = Date.now();
    try {
      const { answer } = await chatFn({ message: c.question, root, model });
      const { passed, missing } = evaluateAnswer(answer, c.mustInclude);
      results.push({ id: c.id, passed, missing, answer, ms: Date.now() - t0 });
    } catch (e) {
      results.push({ id: c.id, passed: false, error: String((e && e.message) || e), ms: Date.now() - t0 });
    }
  }
  const passed = results.filter((r) => r.passed).length;
  return { total: cases.length, passed, failed: cases.length - passed, results };
}

export function formatReport({ total, passed, results }) {
  const lines = results.map((r) => {
    const mark = r.passed ? '✓' : '✗';
    const detail = r.error ? `error: ${r.error}`
      : r.passed ? '' : `missing: ${r.missing.map((g) => g.join('|')).join(', ')}`;
    return `${mark} ${r.id} (${(r.ms / 1000).toFixed(1)}s)${detail ? ' — ' + detail : ''}`;
  });
  lines.push(`${passed}/${total} passed`);
  return lines.join('\n');
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const root = path.resolve(__dirname, '..', '..');
  const modelIdx = process.argv.indexOf('--model');
  const model = modelIdx > -1 ? process.argv[modelIdx + 1] : undefined;

  // Fresh index so the chat's system prompt grounds on current knowledge.
  const { buildIndex, renderJson, renderMarkdown } = await import('../index-core.mjs');
  const index = buildIndex(root);
  fs.writeFileSync(path.join(__dirname, '..', 'index.json'), renderJson(index));
  fs.writeFileSync(path.join(__dirname, '..', 'INDEX.md'), renderMarkdown(index));

  const { chat } = await import('../web/chat.mjs');
  const golden = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden.json'), 'utf8'));
  console.log(`knowledge chat eval: ${golden.length} cases (sequential, real claude spawns)`);
  const summary = await runEval(golden, chat, { root, model });
  console.log(formatReport(summary));
  process.exitCode = summary.failed > 0 ? 1 : 0;
}
