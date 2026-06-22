const state = { index: null, typeFilter: null };

async function load() {
  state.index = await (await fetch('/api/index')).json();
  renderTypeFilters();
  renderPatterns();
  renderProjects();
  document.getElementById('chat-btn').onclick = () => { location.hash = 'chat'; };
  window.addEventListener('hashchange', renderRoute);
  renderRoute();
}

function renderPatterns() {
  const nav = document.getElementById('patterns');
  nav.innerHTML = '';
  const pats = state.index.patterns || [];
  if (!pats.length) return;
  const det = document.createElement('details');
  det.className = 'project'; det.open = true;
  const sum = document.createElement('summary');
  sum.textContent = `🔗 재사용 패턴 (${pats.length})`;
  det.appendChild(sum);
  for (const pat of pats) {
    const a = document.createElement('a');
    a.className = 'file'; a.textContent = pat.title;
    a.onclick = () => openFile(pat.path);
    det.appendChild(a);
  }
  nav.appendChild(det);
}

function renderTypeFilters() {
  const el = document.getElementById('type-filters');
  const cats = Object.keys(state.index.categories).sort();
  el.innerHTML = '';
  for (const c of cats) {
    const chip = document.createElement('span');
    chip.className = 'chip' + (state.typeFilter === c ? ' active' : '');
    chip.textContent = `${c} (${state.index.categories[c].length})`;
    chip.onclick = () => { state.typeFilter = state.typeFilter === c ? null : c; renderTypeFilters(); renderProjects(); };
    el.appendChild(chip);
  }
}

function renderProjects() {
  const nav = document.getElementById('projects');
  nav.innerHTML = '';
  for (const p of state.index.projects) {
    const det = document.createElement('details');
    det.className = 'project'; det.open = true;
    const sum = document.createElement('summary');
    sum.textContent = `${p.id} — ${p.title} [${p.status}]`;
    det.appendChild(sum);
    const byCat = {};
    for (const a of p.artifacts) {
      if (state.typeFilter && a.category !== state.typeFilter) continue;
      (byCat[a.category] ||= []).push(a);
    }
    for (const cat of Object.keys(byCat).sort()) {
      const wrap = document.createElement('div'); wrap.className = 'cat';
      const name = document.createElement('div'); name.className = 'cat-name'; name.textContent = cat;
      wrap.appendChild(name);
      for (const a of byCat[cat]) {
        const link = document.createElement('a');
        link.className = 'file'; link.textContent = a.path.split('/').slice(1).join('/');
        link.onclick = () => openFile(a.path);
        wrap.appendChild(link);
      }
      det.appendChild(wrap);
    }
    nav.appendChild(det);
  }
}

// ---- Routing (hash-based, so the browser Back button works) ----

function openFile(relPath) {
  // pushes a history entry → Back returns to the previous view
  location.hash = 'file=' + encodeURIComponent(relPath);
}

function goBack() {
  if (history.length > 1) history.back();
  else location.hash = '';
}

// resolve a relative markdown link against the current file's directory
function resolveRel(fromPath, target) {
  if (/^https?:|^#|^mailto:/.test(target)) return null;
  const base = fromPath.split('/').slice(0, -1);
  for (const part of target.replace(/#.*$/, '').split('/')) {
    if (part === '..') base.pop();
    else if (part !== '.' && part !== '') base.push(part);
  }
  return base.join('/');
}

function parseRoute() {
  const h = location.hash.replace(/^#/, '');
  if (h === 'chat') return { view: 'chat' };
  const f = h.match(/^file=(.+)$/);
  if (f) return { view: 'file', value: decodeURIComponent(f[1]) };
  const s = h.match(/^search=(.+)$/);
  if (s) return { view: 'search', value: decodeURIComponent(s[1]) };
  return { view: 'home' };
}

function renderRoute() {
  const r = parseRoute();
  const search = document.getElementById('search');
  if (r.view === 'file') {
    document.body.classList.add('detail');
    showFile(r.value);
  } else if (r.view === 'chat') {
    document.body.classList.add('detail');
    showChat();
  } else if (r.view === 'search') {
    document.body.classList.remove('detail');
    if (search.value !== r.value) search.value = r.value;
    showSearch(r.value);
  } else {
    document.body.classList.remove('detail');
    if (search.value) search.value = '';
    document.getElementById('main').innerHTML = '<p class="hint">프로젝트 또는 파일을 선택하세요.</p>';
  }
}

async function showFile(relPath) {
  const main = document.getElementById('main');
  const ext = relPath.split('.').pop().toLowerCase();
  main.innerHTML = '';
  const bar = document.createElement('div'); bar.className = 'topbar';
  const back = document.createElement('button'); back.className = 'back'; back.textContent = '← 뒤로';
  back.onclick = goBack;
  const path = document.createElement('span'); path.className = 'path'; path.textContent = relPath;
  bar.appendChild(back); bar.appendChild(path); main.appendChild(bar);
  window.scrollTo(0, 0);

  if (ext === 'png' || ext === 'svg') {
    const img = document.createElement('img');
    img.src = `/api/file?path=${encodeURIComponent(relPath)}`; img.style.maxWidth = '100%';
    main.appendChild(img); return;
  }
  const text = await (await fetch(`/api/file?path=${encodeURIComponent(relPath)}`)).text();
  if (ext === 'md') {
    const div = document.createElement('div');
    // strip YAML frontmatter from display (structured fields already shown elsewhere)
    const body = text.replace(/^---\n[\s\S]*?\n---\n?/, '');
    div.innerHTML = marked.parse(body);
    // make in-content graph links (relative .md) navigate via the router
    div.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      const resolved = resolveRel(relPath, href);
      if (resolved && resolved.endsWith('.md')) {
        a.addEventListener('click', (e) => { e.preventDefault(); openFile(resolved); });
      }
    });
    main.appendChild(div);
  } else {
    const pre = document.createElement('pre');
    const code = document.createElement('code'); code.textContent = text;
    pre.appendChild(code); main.appendChild(pre); hljs.highlightElement(code);
  }
}

async function showSearch(q) {
  const main = document.getElementById('main');
  const hits = await (await fetch(`/api/search?q=${encodeURIComponent(q)}`)).json();
  main.innerHTML = `<div class="meta-bar">"${q}" 본문 매치 ${hits.length}건</div>`;
  for (const h of hits) {
    const el = document.createElement('div'); el.className = 'search-hit';
    el.innerHTML = `<span class="loc">[${h.category}] ${h.path}:${h.line}</span><br>${h.text.replace(/</g, '&lt;')}`;
    el.onclick = () => openFile(h.path);
    main.appendChild(el);
  }
}

// Search input: reflect into the hash. Replace while typing (no history spam),
// push on first entry so Back leaves search.
let timer;
document.getElementById('search').addEventListener('input', (e) => {
  clearTimeout(timer);
  const q = e.target.value;
  timer = setTimeout(() => {
    if (!q.trim()) { if (location.hash) { location.hash = ''; } else { renderRoute(); } return; }
    const target = '#search=' + encodeURIComponent(q);
    if (location.hash.startsWith('#search=')) {
      history.replaceState(null, '', target);
      showSearch(q);
    } else {
      location.hash = target.slice(1);
    }
  }, 250);
});

// ---- Knowledge chat (memory-resident; cleared on refresh) ----
const CHAT_MODEL_OPTIONS = [['sonnet', 'Sonnet (빠름·기본)'], ['opus', 'Opus (고품질)']];
const chatState = { sessionId: null, messages: [], pending: false, model: localStorage.getItem('chatModel') || 'sonnet' };

function showChat() {
  const main = document.getElementById('main');
  main.innerHTML = '';
  const bar = document.createElement('div'); bar.className = 'topbar';
  const back = document.createElement('button'); back.className = 'back'; back.textContent = '← 뒤로'; back.onclick = goBack;
  const label = document.createElement('span'); label.className = 'path'; label.textContent = '💬 지식 채팅 — 리프레시 전까지 대화 유지';
  const model = document.createElement('select'); model.id = 'chat-model'; model.className = 'chat-model';
  model.title = '응답 모델 선택 (다음 질문부터 적용)';
  for (const [key, name] of CHAT_MODEL_OPTIONS) {
    const opt = document.createElement('option'); opt.value = key; opt.textContent = name;
    if (chatState.model === key) opt.selected = true;
    model.appendChild(opt);
  }
  model.onchange = () => { chatState.model = model.value; localStorage.setItem('chatModel', model.value); };
  bar.appendChild(back); bar.appendChild(label); bar.appendChild(model); main.appendChild(bar);

  const log = document.createElement('div'); log.id = 'chat-log'; main.appendChild(log);

  const form = document.createElement('form'); form.id = 'chat-form';
  const input = document.createElement('input'); input.id = 'chat-input'; input.placeholder = '질문을 입력…'; input.autocomplete = 'off';
  const send = document.createElement('button'); send.type = 'submit'; send.textContent = '전송';
  form.appendChild(input); form.appendChild(send);
  form.onsubmit = (e) => { e.preventDefault(); const v = input.value; input.value = ''; sendChat(v); };
  main.appendChild(form);

  renderChatLog();
  input.focus();
}

function renderChatLog() {
  const log = document.getElementById('chat-log');
  if (!log) return;
  log.innerHTML = '';
  if (!chatState.messages.length && !chatState.pending) {
    const hint = document.createElement('div'); hint.className = 'msg msg-assistant';
    hint.textContent = '프로젝트 이력·아키텍처 결정·패턴·gotcha에 대해 물어보세요. 예: "shop의 동시성 어떻게 처리했어?"';
    log.appendChild(hint);
  }
  for (const m of chatState.messages) {
    const el = document.createElement('div'); el.className = 'msg msg-' + m.role;
    if (m.role === 'assistant') el.innerHTML = marked.parse(m.text);
    else el.textContent = m.text;
    log.appendChild(el);
  }
  if (chatState.pending) {
    const el = document.createElement('div'); el.className = 'msg msg-assistant pending'; el.textContent = '생각 중…';
    log.appendChild(el);
  }
  log.scrollTop = log.scrollHeight;
}

async function sendChat(text) {
  if (!text.trim() || chatState.pending) return;
  chatState.messages.push({ role: 'user', text });
  chatState.pending = true;
  renderChatLog();
  try {
    const headers = { 'content-type': 'application/json' };
    const token = localStorage.getItem('chatToken');
    if (token) headers['x-chat-token'] = token;
    const res = await fetch('/api/chat', {
      method: 'POST', headers,
      body: JSON.stringify({ message: text, sessionId: chatState.sessionId, model: chatState.model }),
    });
    if (res.status === 401) {
      chatState.pending = false;
      chatState.messages.pop();           // remove optimistic user msg before retry
      renderChatLog();
      const t = prompt('CHAT_TOKEN 필요 — 토큰을 입력하세요:');
      if (t) { localStorage.setItem('chatToken', t); return sendChat(text); }
      return;
    }
    const data = await res.json();
    chatState.pending = false;
    if (data.error) chatState.messages.push({ role: 'assistant', text: '⚠️ 오류: ' + data.error });
    else { chatState.messages.push({ role: 'assistant', text: data.answer }); chatState.sessionId = data.sessionId; }
    renderChatLog();
  } catch (e) {
    chatState.pending = false;
    chatState.messages.push({ role: 'assistant', text: '⚠️ 요청 실패: ' + e });
    renderChatLog();
  }
}

load();
