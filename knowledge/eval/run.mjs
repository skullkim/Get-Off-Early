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
// repeat>1 measures consistency (ch9): the model is probabilistic, so a case
// only passes when EVERY attempt passes — flaky grounding surfaces as "2/3".
export async function runEval(cases, chatFn, { root, model, repeat = 1 } = {}) {
  const results = [];
  for (const c of cases) {
    const t0 = Date.now();
    const attempts = [];
    for (let i = 0; i < repeat; i++) {
      try {
        const { answer } = await chatFn({ message: c.question, root, model });
        attempts.push({ ...evaluateAnswer(answer, c.mustInclude), answer });
      } catch (e) {
        attempts.push({ passed: false, missing: [], error: String((e && e.message) || e) });
      }
    }
    const passCount = attempts.filter((a) => a.passed).length;
    const last = attempts[attempts.length - 1];
    results.push({
      id: c.id,
      passed: passCount === repeat,
      missing: last.missing,
      ...(last.error ? { error: last.error } : {}),
      ...(repeat > 1 ? { consistency: `${passCount}/${repeat}` } : {}),
      answer: last.answer,
      ms: Date.now() - t0,
    });
  }
  const passed = results.filter((r) => r.passed).length;
  return { total: cases.length, passed, failed: cases.length - passed, results };
}

export function formatReport({ total, passed, results }) {
  const lines = results.map((r) => {
    const mark = r.passed ? '✓' : '✗';
    const cons = r.consistency ? ` [${r.consistency}]` : '';
    const detail = r.error ? `error: ${r.error}`
      : r.passed ? '' : `missing: ${r.missing.map((g) => g.join('|')).join(', ')}`;
    return `${mark} ${r.id}${cons} (${(r.ms / 1000).toFixed(1)}s)${detail ? ' — ' + detail : ''}`;
  });
  lines.push(`${passed}/${total} passed`);
  return lines.join('\n');
}

// --stream evaluates through the streaming twin (the UI's primary path since
// the ch3 UX work) — same contract, different transport. Living-spec rule:
// the eval should cover the path users actually hit.
export function selectChatFn(argv, { chat, chatStream }) {
  return argv.includes('--stream') ? chatStream : chat;
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

  const { chat, chatStream } = await import('../web/chat.mjs');
  const chatFn = selectChatFn(process.argv, { chat, chatStream });
  const repeatIdx = process.argv.indexOf('--repeat');
  const repeat = repeatIdx > -1 ? Math.max(1, Number(process.argv[repeatIdx + 1]) || 1) : 1;
  const golden = JSON.parse(fs.readFileSync(path.join(__dirname, 'golden.json'), 'utf8'));
  console.log(`knowledge chat eval: ${golden.length} cases × ${repeat}회${chatFn === chatStream ? ' (streaming path)' : ''} — sequential, real claude spawns`);
  const summary = await runEval(golden, chatFn, { root, model, repeat });
  console.log(formatReport(summary));
  process.exitCode = summary.failed > 0 ? 1 : 0;
}
