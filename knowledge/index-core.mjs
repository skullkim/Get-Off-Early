const CODE_EXT = new Set(['kt', 'ts', 'tsx', 'js', 'mjs', 'kts']);

export function classifyFile(relPath) {
  const name = relPath.split('/').pop();
  const lower = name.toLowerCase();
  const ext = lower.includes('.') ? lower.slice(lower.lastIndexOf('.') + 1) : '';
  if (relPath.includes('/prototype/')) return 'design';
  if (ext === 'md') {
    if (/requirements/.test(lower)) return 'requirements';
    if (/design/.test(lower)) return 'design';
    if (/architecture|_specs|component_specs/.test(lower)) return 'architecture';
    if (/coverage_matrix/.test(lower)) return 'coverage';
    if (/qa_report|qa_plan|^05_qa/.test(lower)) return 'qa';
    if (/^resume$/.test(lower.replace(/\.md$/, '')) || /^build_complete/.test(lower)) return 'meta';
  }
  if (CODE_EXT.has(ext)) return 'code';
  if (ext === 'css') return 'style';
  if (ext === 'png' || ext === 'svg') return 'asset';
  return 'config';
}

export function extractReqIds(text) {
  const matches = text.match(/\bREQ-[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*/g) || [];
  return [...new Set(matches)].sort();
}

export function extractHeaders(markdown) {
  return markdown.split('\n')
    .filter((l) => /^#{1,6}\s+/.test(l))
    .map((l) => l.replace(/^#{1,6}\s+/, '').trim());
}

// Markdown links `[text](target)` form the OKF-style concept graph.
export function extractLinks(markdown) {
  const out = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(markdown))) out.push({ text: m[1], target: m[2] });
  return out;
}

// 교훈(patterns)의 분류 축 — 역할이 자기 분야만 읽을 수 있게 하는 단일 목록.
// (infra 는 현재 해당 패턴이 없어도 축으로 미리 열어 둔다.)
export const DOMAINS = ['backend', 'frontend', 'qa', 'process', 'infra'];
export const UNCLASSIFIED_DOMAIN = '(미분류)';
const SUMMARY_MAX = 120;

function domainRank(d) {
  const i = DOMAINS.indexOf(d);
  return i === -1 ? DOMAINS.length : i;
}

function asList(value) {
  const list = Array.isArray(value) ? value : (value === undefined || value === null || value === '' ? [] : [value]);
  const out = [], seen = new Set();
  for (const raw of list) {
    const v = String(raw).trim();
    if (!v || seen.has(v)) continue;
    seen.add(v); out.push(v);
  }
  return out;
}

// frontmatter 의 domain 값을 정규화한다. 알려진 축을 DOMAINS 순서로,
// 미지 값(오타 포함)은 버리지 않고 뒤에 붙여 색인에 드러낸다.
export function normalizeDomains(value) {
  return asList(value)
    .map((d) => d.toLowerCase())
    .filter((d, i, arr) => arr.indexOf(d) === i)
    .sort((a, b) => domainRank(a) - domainRank(b) || a.localeCompare(b));
}

function splitFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return m ? { raw: m[1], body: m[2] } : { raw: '', body: text };
}

// 문서의 첫 본문 줄(헤딩 제외)을 한 줄 요약으로 뽑는다 — 별도 summary 키 없이 동작.
export function extractSummary(text, max = SUMMARY_MAX) {
  for (const raw of splitFrontmatter(text).body.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || line.startsWith('>')) continue;
    const plain = line
      .replace(/^\s*[-*]\s+/, '')
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .trim();
    if (!plain) continue;
    return plain.length > max ? plain.slice(0, max - 1).trimEnd() + '…' : plain;
  }
  return '';
}

export function parseCard(text) {
  const fm = {};
  let body = text;
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (m) {
    body = m[2];
    for (const line of m[1].split('\n')) {
      const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
      if (!kv) continue;
      const k = kv[1];
      let v = kv[2].trim();
      if (v.startsWith('[') && v.endsWith(']')) {
        fm[k] = v.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
      } else {
        fm[k] = v;
      }
    }
  }
  const highlights = [];
  let capture = false;
  for (const line of body.split('\n')) {
    if (/^##\s/.test(line)) {
      capture = /핵심 결정|gotcha|반복 버그/i.test(line);
      continue;
    }
    if (capture) {
      const b = line.match(/^\s*[-*]\s+(.*)$/);
      if (b) highlights.push(b[1].trim());
    }
  }
  return { frontmatter: fm, highlights };
}

import fs from 'node:fs';
import path from 'node:path';

export const EXCLUDE = new Set(['node_modules', 'build', '.gradle', 'dist', '.git', '.idea']);
const DOC_CATS = ['requirements', 'design', 'architecture', 'coverage', 'qa', 'meta'];

function walk(dir, root, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, root, acc);
    else if (entry.isFile()) acc.push(path.relative(root, full).split(path.sep).join('/'));
  }
  return acc;
}

export function findProjects(root) {
  const dirs = fs.readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !EXCLUDE.has(e.name) && !e.name.startsWith('.'))
    .map((e) => e.name);
  const cardsDir = path.join(root, 'knowledge', 'cards');
  const carded = fs.existsSync(cardsDir)
    ? fs.readdirSync(cardsDir).filter((f) => f.endsWith('.md') && f !== 'index.md').map((f) => f.replace(/\.md$/, ''))
    : [];
  const isProject = (name) =>
    fs.existsSync(path.join(root, name, '_workspace')) ||                 // 하네스 산출
    (carded.includes(name) && fs.existsSync(path.join(root, name)));       // 카드 보유 외부
  return [...new Set(dirs.filter(isProject))].sort();
}

export function buildProject(root, id) {
  const files = walk(path.join(root, id), root, []).sort();
  const artifacts = files.map((rel) => {
    const abs = path.join(root, rel);
    const st = fs.statSync(abs);
    const ext = rel.includes('.') ? rel.slice(rel.lastIndexOf('.') + 1).toLowerCase() : '';
    const a = { path: rel, category: classifyFile(rel), ext, size: st.size, mtime: st.mtime.toISOString() };
    if (ext === 'md') {
      const text = fs.readFileSync(abs, 'utf8');
      const headers = extractHeaders(text);
      a.title = headers[0] || rel.split('/').pop();
      a.headers = headers;
      a.reqIds = extractReqIds(text);
    }
    return a;
  });
  const cardAbs = path.join(root, 'knowledge', 'cards', `${id}.md`);
  let fm = {}, highlights = [], card = null, links = [];
  if (fs.existsSync(cardAbs)) {
    const cardText = fs.readFileSync(cardAbs, 'utf8');
    const parsed = parseCard(cardText);
    fm = parsed.frontmatter; highlights = parsed.highlights;
    card = `knowledge/cards/${id}.md`;
    // graph edges: links from the card body into patterns/ or other cards/
    links = extractLinks(cardText).filter((l) => l.target.includes('patterns/') || l.target.includes('cards/'));
  }
  const buildComplete = files.some((f) => /build_complete/i.test(f));
  const qaRounds = files.filter((f) => /qa_report_round/i.test(f)).length;
  return {
    id,
    type: fm.type || null,
    title: fm.title || id,
    status: fm.status || (buildComplete ? 'DONE' : 'IN PROGRESS'),
    stack: Array.isArray(fm.stack) ? fm.stack : (fm.stack ? [fm.stack] : []),
    summary: fm.summary || '',
    tags: Array.isArray(fm.tags) ? fm.tags : (fm.tags ? [fm.tags] : []),
    timestamp: fm.timestamp || null,
    buildComplete, qaRounds, card, highlights, links, artifacts,
  };
}

export function findPatterns(root) {
  const dir = path.join(root, 'knowledge', 'patterns');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'index.md')
    .map((f) => f.replace(/\.md$/, ''))
    .sort();
}

export function buildPatterns(root) {
  return findPatterns(root).map((slug) => {
    const text = fs.readFileSync(path.join(root, 'knowledge', 'patterns', `${slug}.md`), 'utf8');
    const { frontmatter: fm } = parseCard(text);
    // 출처는 frontmatter 가 단일 소스 — `source_projects` 는 레거시 별칭.
    const sources = asList(fm.sources !== undefined ? fm.sources : fm.source_projects);
    return {
      slug,
      path: `knowledge/patterns/${slug}.md`,
      type: fm.type || 'Reusable Pattern',
      title: fm.title || slug,
      domain: normalizeDomains(fm.domain),
      summary: extractSummary(text),
      tags: Array.isArray(fm.tags) ? fm.tags : (fm.tags ? [fm.tags] : []),
      timestamp: fm.timestamp || null,
      sources,
      sourceProjects: sources,
      links: extractLinks(text),
    };
  });
}

// 분야별 그룹 — 다분야 패턴은 각 그룹에 등장하고, domain 없는 패턴은 (미분류)로 모인다.
export function groupPatternsByDomain(patterns) {
  const groups = new Map();
  for (const pat of patterns) {
    const domains = pat.domain && pat.domain.length ? pat.domain : [UNCLASSIFIED_DOMAIN];
    for (const d of domains) {
      if (!groups.has(d)) groups.set(d, []);
      groups.get(d).push(pat);
    }
  }
  return [...groups.entries()]
    .sort((a, b) => domainRank(a[0]) - domainRank(b[0]) || a[0].localeCompare(b[0]))
    .map(([domain, items]) => ({ domain, patterns: items }));
}

export function buildIndex(root) {
  const projects = findProjects(root).map((id) => buildProject(root, id));
  const fileTypes = {};
  const categories = {};
  for (const p of projects) {
    for (const a of p.artifacts) {
      const key = a.ext || '(none)';
      fileTypes[key] = (fileTypes[key] || 0) + 1;
      (categories[a.category] ||= []).push(a.path);
    }
  }
  return { generatedAt: new Date().toISOString(), projects, patterns: buildPatterns(root), fileTypes, categories };
}

export function renderJson(index) {
  return JSON.stringify(index, null, 2) + '\n';
}

export function renderMarkdown(index) {
  const total = index.projects.reduce((n, p) => n + p.artifacts.length, 0);
  const lines = [
    '# Project Knowledge Index',
    `_생성: ${index.generatedAt} · 프로젝트 ${index.projects.length} · 산출물 ${total}_`,
    '',
    '> 사용법: 스택·아키텍처·계약을 결정하기 전에 여기서 비슷한 과거 작업을 찾고, 필요한 원본 파일을 드릴다운하라.',
    '',
  ];
  if (index.patterns && index.patterns.length) {
    lines.push('## 재사용 패턴 (patterns/) — 분야별 교차 프로젝트 교훈');
    lines.push(`_분야 축: ${DOMAINS.join(' · ')} — 각 역할은 착수 전 자기 분야 그룹을 먼저 읽는다 (다분야 패턴은 여러 그룹에 등장)._`);
    lines.push('');
    for (const group of groupPatternsByDomain(index.patterns)) {
      lines.push(`### ${group.domain}`);
      for (const pat of group.patterns) {
        const sources = pat.sources || pat.sourceProjects || [];
        const src = sources.length ? ` — 출처: ${sources.join(', ')}` : '';
        const sum = pat.summary ? ` — ${pat.summary}` : '';
        lines.push(`- ${pat.title}${sum}  (${pat.path})${src}`);
      }
      lines.push('');
    }
  }
  for (const p of index.projects) {
    lines.push(`## ${p.id} — ${p.title}  [${p.status}]`);
    if (p.stack.length) lines.push(`- 스택: ${p.stack.join(' · ')}`);
    if (p.summary) lines.push(`- 요약: ${p.summary}`);
    if (p.tags.length) lines.push(`- 태그: ${p.tags.join(', ')}`);
    if (p.card) lines.push(`- 지식 카드: ${p.card}`);
    if (p.highlights.length) {
      lines.push('- 핵심 결정/Gotcha:');
      for (const h of p.highlights) lines.push(`  - ${h}`);
    }
    if (p.links && p.links.length) {
      lines.push('- 관련 패턴/지식:');
      for (const l of p.links) lines.push(`  - ${l.text} → ${l.target}`);
    }
    const docs = p.artifacts.filter((a) => DOC_CATS.includes(a.category));
    const nonDocs = p.artifacts.filter((a) => !DOC_CATS.includes(a.category));
    lines.push('- 산출물(문서):');
    for (const a of docs) {
      const req = a.reqIds && a.reqIds.length
        ? ` (REQ: ${a.reqIds.slice(0, 6).join(', ')}${a.reqIds.length > 6 ? '…' : ''})` : '';
      lines.push(`  - [${a.category}] ${a.path}${req}`);
    }
    if (nonDocs.length) {
      const byExt = {};
      for (const a of nonDocs) byExt[a.ext || '(none)'] = (byExt[a.ext || '(none)'] || 0) + 1;
      const summary = Object.entries(byExt).sort((x, y) => y[1] - x[1]).map(([e, n]) => `${n} ${e}`).join(', ');
      lines.push(`- 코드/기타: ${nonDocs.length}개 (${summary})`);
    }
    lines.push('');
  }
  return lines.join('\n');
}
