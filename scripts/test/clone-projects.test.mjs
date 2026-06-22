import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { readManifest, cloneMissing, ensureGitExclude } from '../clone-projects.mjs';

function tmp() { return fs.mkdtempSync(path.join(os.tmpdir(), 'clone-')); }

test('readManifest: projects 배열 파싱, 없으면 []', () => {
  const root = tmp();
  assert.deepEqual(readManifest(root), []);
  fs.writeFileSync(path.join(root, 'projects.json'), JSON.stringify({ projects: [{ name: 'a', git: 'g' }] }));
  assert.deepEqual(readManifest(root), [{ name: 'a', git: 'g' }]);
});

test('cloneMissing: 존재하는 건 skip, 없는 건 clone 호출, git URL 없으면 표시', () => {
  const root = tmp();
  fs.mkdirSync(path.join(root, 'exists'));
  const calls = [];
  const run = (cmd, args) => { calls.push(args); return { status: 0 }; };
  const res = cloneMissing([{ name: 'exists', git: 'g' }, { name: 'new', git: 'http://x/new.git' }, { name: 'nogit' }], root, run);
  assert.deepEqual(res.find((r) => r.name === 'exists').status, 'exists');
  assert.deepEqual(res.find((r) => r.name === 'new').status, 'cloned');
  assert.deepEqual(res.find((r) => r.name === 'nogit').status, 'no-git-url');
  assert.equal(calls.length, 1);
});

test('ensureGitExclude: .git/info/exclude 에 멱등 추가', () => {
  const root = tmp();
  fs.mkdirSync(path.join(root, '.git', 'info'), { recursive: true });
  const added1 = ensureGitExclude([{ name: 'a' }, { name: 'b' }], root);
  assert.deepEqual(added1.sort(), ['a', 'b']);
  const added2 = ensureGitExclude([{ name: 'a' }, { name: 'b' }], root);
  assert.deepEqual(added2, []);
  const body = fs.readFileSync(path.join(root, '.git', 'info', 'exclude'), 'utf8');
  assert.equal((body.match(/^\/a\/$/m) || []).length, 1);
});

test('ensureGitExclude: .git 없으면 빈 배열(무해)', () => {
  assert.deepEqual(ensureGitExclude([{ name: 'a' }], tmp()), []);
});
