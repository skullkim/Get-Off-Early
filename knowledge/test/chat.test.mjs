import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import {
  buildSystemPrompt, buildChatArgs, resolveModel, buildChatModels, chat, CHAT_MODELS,
  parseStreamLine, createStreamReader, chatStream,
} from '../web/chat.mjs';

function fixtureRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-'));
  fs.mkdirSync(path.join(root, 'knowledge'), { recursive: true });
  fs.writeFileSync(path.join(root, 'knowledge', 'INDEX.md'), '# Project Knowledge Index\n## shop — 미니샵\n');
  return root;
}

test('buildSystemPrompt embeds INDEX.md and orientation', () => {
  const sp = buildSystemPrompt(fixtureRoot());
  assert.match(sp, /Project Knowledge Index/);   // INDEX.md content embedded
  assert.match(sp, /knowledge\/cards/);           // orientation map
  assert.match(sp, /Read|Grep|Glob/);             // tool guidance
});

test('buildSystemPrompt tolerates missing INDEX.md', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'chat-empty-'));
  const sp = buildSystemPrompt(root);
  assert.equal(typeof sp, 'string');
  assert.match(sp, /generate\.mjs/);              // hint to regenerate
});

test('buildChatArgs first turn uses --system-prompt, not --resume', () => {
  const args = buildChatArgs({ message: 'hi', sessionId: null, model: 'claude-sonnet-4-6', systemPrompt: 'SYS' });
  assert.equal(args.includes('--resume'), false);
  const i = args.indexOf('--system-prompt');
  assert.equal(args[i + 1], 'SYS');
  assert.deepEqual([args[0], args[1]], ['-p', 'hi']);
  assert.equal(args.includes('--output-format'), true);
  assert.equal(args.join(' ').includes('Read Grep Glob'), true);
  assert.equal(args[args.indexOf('--model') + 1], 'claude-sonnet-4-6');
});

test('buildChatArgs resume uses --resume, not --system-prompt', () => {
  const args = buildChatArgs({ message: 'next', sessionId: 'sid-1', model: 'claude-sonnet-4-6', systemPrompt: 'SYS' });
  assert.equal(args.includes('--system-prompt'), false);
  assert.equal(args[args.indexOf('--resume') + 1], 'sid-1');
  assert.equal(args.includes('--output-format'), true);
});

test('CHAT_MODELS exposes sonnet and opus options', () => {
  assert.equal(CHAT_MODELS.sonnet, 'claude-sonnet-4-6');
  assert.equal(CHAT_MODELS.opus, 'claude-opus-4-8');
});

test('resolveModel maps friendly keys to model ids', () => {
  assert.equal(resolveModel('sonnet'), 'claude-sonnet-4-6');
  assert.equal(resolveModel('opus'), 'claude-opus-4-8');
});

test('resolveModel accepts an exact allowed model id', () => {
  assert.equal(resolveModel('claude-opus-4-8'), 'claude-opus-4-8');
});

test('resolveModel falls back to an allowed model for missing/unknown input', () => {
  const allowed = Object.values(CHAT_MODELS);
  assert.ok(allowed.includes(resolveModel(undefined)));      // no choice → default
  assert.ok(allowed.includes(resolveModel('')));             // empty → default
  assert.ok(allowed.includes(resolveModel('haiku; rm -rf /')));  // arbitrary string never passes through
});

test('buildChatModels returns baked-in ids when env has no overrides', () => {
  assert.deepEqual(buildChatModels({}), {
    sonnet: 'claude-sonnet-4-6',
    opus: 'claude-opus-4-8',
  });
});

test('buildChatModels lets env override a model id without touching the other', () => {
  const models = buildChatModels({ CHAT_MODEL_SONNET: 'claude-sonnet-5' });
  assert.equal(models.sonnet, 'claude-sonnet-5');
  assert.equal(models.opus, 'claude-opus-4-8');
});

test('resolveModel honors an injected models map (env-overridden allowlist)', () => {
  const models = buildChatModels({ CHAT_MODEL_SONNET: 'claude-sonnet-5', CHAT_MODEL_OPUS: 'claude-opus-5' });
  assert.equal(resolveModel('sonnet', models), 'claude-sonnet-5');
  assert.equal(resolveModel('claude-opus-5', models), 'claude-opus-5');
  assert.equal(resolveModel('unknown-model', models), 'claude-sonnet-5');  // fallback stays inside the map
});

function fakeSpawnChild() {
  const child = new EventEmitter();
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.kill = () => {};
  return child;
}

test('chat rejects with CLAUDE_NOT_FOUND when the claude binary is missing', async () => {
  const spawnFn = () => {
    const child = fakeSpawnChild();
    setImmediate(() => child.emit('error', Object.assign(new Error('spawn claude ENOENT'), { code: 'ENOENT' })));
    return child;
  };
  await assert.rejects(
    chat({ message: 'hi', root: fixtureRoot(), spawnFn }),
    (e) => e.code === 'CLAUDE_NOT_FOUND' && /claude/i.test(e.message),
  );
});

test('chat rejects with CHAT_TIMEOUT when the process outlives timeoutMs', async () => {
  const spawnFn = () => fakeSpawnChild();  // never closes
  await assert.rejects(
    chat({ message: 'hi', root: fixtureRoot(), spawnFn, timeoutMs: 20 }),
    (e) => e.code === 'CHAT_TIMEOUT',
  );
});

// ---- streaming ----
// Fixtures are trimmed copies of real `claude -p --output-format stream-json
// --include-partial-messages --verbose` output (schema verified against the CLI).
const LINE_INIT = JSON.stringify({ type: 'system', subtype: 'init', cwd: '/x', session_id: 'sess-1' });
const LINE_DELTA_A = JSON.stringify({
  type: 'stream_event',
  event: { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: '안녕' } },
  session_id: 'sess-1', parent_tool_use_id: null,
});
const LINE_DELTA_B = JSON.stringify({
  type: 'stream_event',
  event: { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: '하세요' } },
  session_id: 'sess-1', parent_tool_use_id: null,
});
const LINE_THINKING = JSON.stringify({
  type: 'stream_event',
  event: { type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: '음…' } },
  session_id: 'sess-1', parent_tool_use_id: null,
});
const LINE_ASSISTANT = JSON.stringify({
  type: 'assistant',
  message: { role: 'assistant', content: [{ type: 'text', text: '안녕하세요' }] },
  session_id: 'sess-1',
});
const LINE_RESULT = JSON.stringify({
  type: 'result', subtype: 'success', is_error: false, result: '안녕하세요', session_id: 'sess-1',
});

test('parseStreamLine extracts text deltas from stream_event lines', () => {
  assert.deepEqual(parseStreamLine(LINE_DELTA_A), { kind: 'delta', text: '안녕' });
});

test('parseStreamLine extracts the final answer and session id from the result line', () => {
  assert.deepEqual(parseStreamLine(LINE_RESULT), {
    kind: 'result', answer: '안녕하세요', sessionId: 'sess-1', isError: false,
  });
});

test('parseStreamLine surfaces the session id from the init line', () => {
  assert.deepEqual(parseStreamLine(LINE_INIT), { kind: 'session', sessionId: 'sess-1' });
});

test('parseStreamLine ignores non-text deltas, whole-message echoes and junk', () => {
  assert.equal(parseStreamLine(LINE_THINKING), null);    // thinking is not answer text
  assert.equal(parseStreamLine(LINE_ASSISTANT), null);   // would duplicate the deltas
  assert.equal(parseStreamLine(''), null);
  assert.equal(parseStreamLine('   '), null);
  assert.equal(parseStreamLine('not json at all'), null);
});

test('createStreamReader reassembles a JSON line split across chunks', () => {
  const seen = [];
  const reader = createStreamReader({ onDelta: (t) => seen.push(t) });
  const half = Math.floor(LINE_DELTA_A.length / 2);
  reader.push(LINE_DELTA_A.slice(0, half));           // no newline yet → nothing emitted
  assert.deepEqual(seen, []);
  reader.push(LINE_DELTA_A.slice(half) + '\n');
  assert.deepEqual(seen, ['안녕']);
});

test('createStreamReader emits deltas in order and captures the result', () => {
  const seen = [];
  const reader = createStreamReader({ onDelta: (t) => seen.push(t) });
  reader.push(`${LINE_INIT}\n${LINE_DELTA_A}\n`);
  reader.push(`${LINE_THINKING}\n${LINE_DELTA_B}\n${LINE_ASSISTANT}\n`);
  reader.push(LINE_RESULT);        // no trailing newline — flushed by end()
  reader.end();
  assert.deepEqual(seen, ['안녕', '하세요']);
  assert.deepEqual(reader.result(), { answer: '안녕하세요', sessionId: 'sess-1', sawResult: true });
});

test('createStreamReader falls back to accumulated deltas when no result line arrives', () => {
  const reader = createStreamReader({});
  reader.push(`${LINE_INIT}\n${LINE_DELTA_A}\n${LINE_DELTA_B}\n`);
  reader.end();
  assert.deepEqual(reader.result(), { answer: '안녕하세요', sessionId: 'sess-1', sawResult: false });
});

test('buildChatArgs stream mode asks the CLI for NDJSON events with partial messages', () => {
  const args = buildChatArgs({ message: 'hi', sessionId: null, model: 'claude-sonnet-4-6', systemPrompt: 'SYS', stream: true });
  assert.equal(args[args.indexOf('--output-format') + 1], 'stream-json');
  assert.equal(args.includes('--include-partial-messages'), true);   // required for text deltas
  assert.equal(args.includes('--verbose'), true);                    // CLI requires it with -p + stream-json
});

test('buildChatArgs stays on single-shot json when stream is not requested', () => {
  const args = buildChatArgs({ message: 'hi', sessionId: null, model: 'claude-sonnet-4-6', systemPrompt: 'SYS' });
  assert.equal(args[args.indexOf('--output-format') + 1], 'json');
  assert.equal(args.includes('--include-partial-messages'), false);
});

test('chatStream streams deltas then resolves with the answer and session id', async () => {
  const spawnFn = () => {
    const child = fakeSpawnChild();
    setImmediate(() => {
      child.stdout.emit('data', Buffer.from(`${LINE_INIT}\n${LINE_DELTA_A}\n`));
      child.stdout.emit('data', Buffer.from(`${LINE_DELTA_B}\n${LINE_RESULT}\n`));
      child.emit('close', 0);
    });
    return child;
  };
  const seen = [];
  const out = await chatStream({ message: 'hi', root: fixtureRoot(), spawnFn, onDelta: (t) => seen.push(t) });
  assert.deepEqual(seen, ['안녕', '하세요']);
  assert.deepEqual(out, { answer: '안녕하세요', sessionId: 'sess-1' });
});

test('chatStream rejects with CLAUDE_NOT_FOUND when the claude binary is missing', async () => {
  const spawnFn = () => {
    const child = fakeSpawnChild();
    setImmediate(() => child.emit('error', Object.assign(new Error('spawn claude ENOENT'), { code: 'ENOENT' })));
    return child;
  };
  await assert.rejects(
    chatStream({ message: 'hi', root: fixtureRoot(), spawnFn }),
    (e) => e.code === 'CLAUDE_NOT_FOUND',
  );
});

test('chatStream rejects with CHAT_TIMEOUT when the process outlives timeoutMs', async () => {
  const spawnFn = () => fakeSpawnChild();  // never closes
  await assert.rejects(
    chatStream({ message: 'hi', root: fixtureRoot(), spawnFn, timeoutMs: 20 }),
    (e) => e.code === 'CHAT_TIMEOUT',
  );
});

test('chatStream rejects when the CLI exits non-zero, quoting stderr', async () => {
  const spawnFn = () => {
    const child = fakeSpawnChild();
    setImmediate(() => {
      child.stderr.emit('data', Buffer.from('boom'));
      child.emit('close', 1);
    });
    return child;
  };
  await assert.rejects(chatStream({ message: 'hi', root: fixtureRoot(), spawnFn }), /exited 1.*boom/s);
});
