import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildSystemPrompt, buildChatArgs, resolveModel, CHAT_MODELS } from '../web/chat.mjs';

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
