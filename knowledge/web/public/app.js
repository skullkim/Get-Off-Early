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

// ---- Knowledge chat ----
const CHAT_MODEL_OPTIONS = [['sonnet', 'Sonnet (빠름·기본)'], ['opus', 'Opus (고품질)']];

// 세션 id는 localStorage에 남긴다 — 새로고침해도 claude 세션이 이어지므로
// (--resume) 앞선 문답의 맥락을 잃지 않는다. 화면의 말풍선은 메모리에만 있어
// 복원되지 않지만, 대화 자체는 서버 쪽 세션에 남아 있다.
const SESSION_KEY = 'chatSessionId';
function loadSessionId() {
  try { return localStorage.getItem(SESSION_KEY) || null; } catch { return null; }
}
function saveSessionId(id) {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  } catch { /* 사파리 프라이빗 모드 등 — 저장 실패해도 채팅은 계속 */ }
}

const chatState = {
  sessionId: loadSessionId(), messages: [], pending: false,
  model: localStorage.getItem('chatModel') || 'sonnet',
  suggestions: null,   // null = 아직 미로딩, [] = 로딩 완료·비어 있음
};

// 빈 채팅 화면은 "무엇을 물어볼 수 있는지" 단서가 없다. 서버가 골든셋 질문을
// 내려주면 클릭 한 번으로 첫 질문을 던질 수 있게 칩으로 노출한다(발견 가능성).
async function loadSuggestions() {
  if (chatState.suggestions) return;
  try { chatState.suggestions = await (await fetch('/api/suggestions')).json(); }
  catch { chatState.suggestions = []; }
  renderChatLog();
}

function showChat() {
  const main = document.getElementById('main');
  main.innerHTML = '';
  const bar = document.createElement('div'); bar.className = 'topbar';
  const back = document.createElement('button'); back.className = 'back'; back.textContent = '← 뒤로'; back.onclick = goBack;
  const label = document.createElement('span'); label.className = 'path';
  label.textContent = chatState.sessionId ? '💬 지식 채팅 — 이전 대화 이어감' : '💬 지식 채팅';
  const model = document.createElement('select'); model.id = 'chat-model'; model.className = 'chat-model';
  model.title = '응답 모델 선택 (다음 질문부터 적용)';
  for (const [key, name] of CHAT_MODEL_OPTIONS) {
    const opt = document.createElement('option'); opt.value = key; opt.textContent = name;
    if (chatState.model === key) opt.selected = true;
    model.appendChild(opt);
  }
  model.onchange = () => { chatState.model = model.value; localStorage.setItem('chatModel', model.value); };
  const fresh = document.createElement('button');
  fresh.type = 'button'; fresh.className = 'chat-new'; fresh.textContent = '새 대화';
  fresh.title = '세션을 버리고 처음부터 다시 묻습니다';
  fresh.onclick = resetChat;
  bar.appendChild(back); bar.appendChild(label); bar.appendChild(model); bar.appendChild(fresh);
  main.appendChild(bar);

  const log = document.createElement('div'); log.id = 'chat-log'; main.appendChild(log);

  const form = document.createElement('form'); form.id = 'chat-form';
  const input = document.createElement('input'); input.id = 'chat-input'; input.placeholder = '질문을 입력…'; input.autocomplete = 'off';
  const send = document.createElement('button'); send.type = 'submit'; send.textContent = '전송';
  form.appendChild(input); form.appendChild(send);
  form.onsubmit = (e) => { e.preventDefault(); const v = input.value; input.value = ''; sendChat(v); };
  main.appendChild(form);

  renderChatLog();
  loadSuggestions();
  input.focus();
}

function resetChat() {
  chatState.sessionId = null;
  chatState.messages = [];
  chatState.pending = false;
  saveSessionId(null);
  showChat();
}

function renderChatLog() {
  const log = document.getElementById('chat-log');
  if (!log) return;
  log.innerHTML = '';
  if (!chatState.messages.length && !chatState.pending) {
    const hint = document.createElement('div'); hint.className = 'msg msg-assistant';
    hint.textContent = '프로젝트 이력·아키텍처 결정·패턴·gotcha에 대해 물어보세요.';
    log.appendChild(hint);
    if (chatState.suggestions && chatState.suggestions.length) {
      const wrap = document.createElement('div'); wrap.className = 'suggestions';
      for (const q of chatState.suggestions) {
        const chip = document.createElement('button');
        chip.type = 'button'; chip.className = 'suggest-chip'; chip.textContent = q;
        chip.onclick = () => sendChat(q);
        wrap.appendChild(chip);
      }
      log.appendChild(wrap);
    }
  }
  for (const m of chatState.messages) {
    const el = document.createElement('div'); el.className = 'msg msg-' + m.role;
    if (m.streaming) {
      // 도착한 만큼 원문 그대로 보여준다. 마크다운은 완료 시점에 한 번만 렌더한다
      // (반쯤 온 마크다운을 파싱하면 표·코드블록이 깨져 보인다).
      el.id = 'chat-streaming';
      el.classList.add('streaming');
      el.textContent = m.text || '생각 중…';
      if (!m.text) el.classList.add('pending');
    } else if (m.role === 'assistant') {
      el.innerHTML = marked.parse(m.text);
    } else {
      el.textContent = m.text;
    }
    log.appendChild(el);
  }
  log.scrollTop = log.scrollHeight;
}

// 델타마다 로그 전체를 다시 그리지 않고 말풍선 하나만 갱신한다.
function paintDelta(msg) {
  const el = document.getElementById('chat-streaming');
  if (!el) return renderChatLog();
  el.classList.remove('pending');
  el.textContent = msg.text;
  const log = document.getElementById('chat-log');
  if (log) log.scrollTop = log.scrollHeight;
}

// 서버가 보내는 NDJSON(줄당 JSON 1개)을 읽는다. 청크 경계가 줄 중간에 떨어질
// 수 있으므로 개행이 나온 줄만 처리하고 나머지는 버퍼에 남긴다.
async function readChatStream(res, onDelta) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let done = null;
  for (;;) {
    const { value, done: closed } = await reader.read();
    if (value) buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = closed ? '' : lines.pop();
    for (const line of lines) {
      if (!line.trim()) continue;
      let ev;
      try { ev = JSON.parse(line); } catch { continue; }
      if (ev.type === 'delta') onDelta(ev.text);
      else if (ev.type === 'done') done = ev;
      else if (ev.type === 'error') throw new Error(ev.error);
    }
    if (closed) return done;
  }
}

async function sendChat(text) {
  if (!text.trim() || chatState.pending) return;
  chatState.messages.push({ role: 'user', text });
  // 답변 말풍선을 먼저 만들어 두고 델타가 올 때마다 채운다 — "생각 중…"만
  // 떠 있는 무한 로딩 대신 첫 토큰부터 진행 상황이 보인다.
  const reply = { role: 'assistant', text: '', streaming: true };
  chatState.messages.push(reply);
  chatState.pending = true;
  renderChatLog();

  const finish = () => { reply.streaming = false; chatState.pending = false; renderChatLog(); };
  const fail = (msg) => {
    reply.text = (reply.text ? reply.text + '\n\n' : '') + msg;
    finish();
  };

  try {
    const headers = { 'content-type': 'application/json' };
    const token = localStorage.getItem('chatToken');
    if (token) headers['x-chat-token'] = token;
    const res = await fetch('/api/chat', {
      method: 'POST', headers,
      body: JSON.stringify({ message: text, sessionId: chatState.sessionId, model: chatState.model, stream: true }),
    });
    if (res.status === 401) {
      chatState.pending = false;
      chatState.messages.splice(-2, 2);   // remove the optimistic user+reply pair before retry
      renderChatLog();
      const t = prompt('CHAT_TOKEN 필요 — 토큰을 입력하세요:');
      if (t) { localStorage.setItem('chatToken', t); return sendChat(text); }
      return;
    }
    if (!res.ok) {                        // 400·429 등: 스트림이 열리기 전에 거절된 경우
      const data = await res.json().catch(() => ({}));
      return fail('⚠️ 오류: ' + (data.error || res.status));
    }
    const done = await readChatStream(res, (delta) => { reply.text += delta; paintDelta(reply); });
    if (done) {
      if (done.answer) reply.text = done.answer;   // 완성본으로 교체(델타 유실 대비)
      if (done.sessionId) { chatState.sessionId = done.sessionId; saveSessionId(done.sessionId); }
    }
    finish();
  } catch (e) {
    fail('⚠️ 요청 실패: ' + (e && e.message ? e.message : e));
  }
}

load();
