# get-off-early — 가상 개발팀 하네스 + 지식 웹앱

요구사항만 주면 **PM·디자이너·백엔드/프론트(시니어·주니어)·QA**로 구성된 가상 팀이
요구사항 → 디자인 → TDD → QA 루프로 프로젝트를 구현하는 하네스(`.claude/`)와,
누적 산출물을 검색·열람·채팅하는 **지식 웹앱**(`knowledge/`)을 한 레포에 담았습니다.

> 이름의 뜻: 팀이 대신 일해주니 일찍 퇴근(get off early)하자.

## 빠른 시작

```bash
git clone https://github.com/skullkim/Get-Off-Early
cd Get-Off-Early
./setup.sh                       # 의존성 체크 → 프로젝트 clone → 색인 → 테스트
node knowledge/web/server.mjs    # 지식 웹앱 (기본 http://localhost:4178)
```

하네스 사용: Claude Code에서 `"이거 만들어줘"` / `"프로젝트 개발해줘"` → `build-project` 스킬이 가상 팀을 가동합니다.

## 설치 (새 기계)

```bash
git clone https://github.com/skullkim/Get-Off-Early && cd Get-Off-Early
./setup.sh --with-plugins       # 의존성 → clone → 색인 → 테스트 → 훅 검증
./setup.sh --self-test          # (선택) 훅 검사기가 깨진 설정을 잡는지 확인
```

그다음 **Claude Code를 한 번 재시작**합니다. 훅은 즉시 반영되지만 에이전트 권한(`tools`)은
새 세션에서만 적용됩니다(아래 표). 재시작한 세션에서 한 번:

> `.claude/harness-runtime.md` 의 **재측정 절차**를 돌려 역할 → 도구 매핑을 확인하세요.
> 런타임이 바뀌면 하네스가 없는 도구를 지시하게 되고, **그 실패는 아무 메시지도 내지 않습니다**
> (실제로 `TaskCreate` 계열이 사라진 뒤 7곳이 작동 불가 상태로 남아 있었습니다).

### 기계마다 직접 두는 것 (git 제외)

| 파일 / env | 필요할 때 | 내용 |
|---|---|---|
| `.claude/hooks/watch-workspaces.local` | 레포 **밖**(형제 디렉터리 등) 프로젝트의 재개 런북도 보려면 | `_workspace` 경로를 한 줄씩. `~` 와 상대 경로 허용 |
| `.claude/settings.local.json` | 개인 권한 추가 | `{"permissions":{"allow":[...]}}` |
| `CHAT_TOKEN` · `CHAT_MODEL` env | 지식 웹앱을 외부에 띄울 때 | 「의존성」 참고. 커밋 금지 |
| `projects.json` | 포크해서 쓸 때 | `projects.example.json` 참고해 목록 교체 |

`knowledge/INDEX.md`·`index.json`·`.claude/scheduled_tasks.lock` 은 **생성물**이라 건드리지 않습니다.

## 갱신 (이미 설치된 기계)

```bash
git pull
./setup.sh                      # 멱등 — 다시 돌려도 안전하다
```

`setup.sh` 는 의존성 재측정 → 새 프로젝트만 clone → 색인 재생성 → 테스트 → **훅 재검증**까지
합니다. 훅만 바뀐 갱신이면 재시작 없이 끝납니다. 그 외에는 아래 「무엇을 바꾸면 언제 반영되는가」를 보세요.

### 무엇을 바꾸면 언제 반영되는가

**단일 소스: [`.claude/harness-runtime.md`](.claude/harness-runtime.md) 의 「반영 시점」 표.**
요약하면 — 훅과 스킬 본문은 즉시, **에이전트 정의(`tools`·`effort`)와 `CLAUDE.md` 는 새 세션**입니다.

갱신 후 확인만 하고 싶으면 setup 전체를 돌리지 않아도 됩니다:

```bash
bash .claude/hooks/verify-hooks.sh              # 훅이 이 기계에서 실제로 도는지 (양방향)
node knowledge/generate.mjs                     # 색인만 재생성
node --test "knowledge/test/**/*.test.mjs" "scripts/test/**/*.test.mjs"
```

## 구성

```
.claude/
  agents/      7 에이전트 (pm · product-designer · backend/frontend senior·junior · qa)
  skills/      8 스킬 (build-project 오케스트레이터 + 절차 스킬들)
  retro/       자가발전 회고 로그
knowledge/
  web/         지식 웹앱 (검색 · 파일 열람 · claude -p 기반 스트리밍 채팅)
  cards/       프로젝트별 지식 카드   patterns/  교차 프로젝트 재사용 패턴(교훈)
  ingest.mjs   외부 프로젝트 → 지식 카드 생성
scripts/       매니페스트 clone · 카드 ingest 오케스트레이션
projects.json  내 지식 프로젝트 목록 (개인 설정)
setup.sh       멱등 세팅
```

**교훈의 분야 축**: `knowledge/patterns/*.md`는 프로젝트 이름을 지운 일반 교훈이고, frontmatter에 `domain`(**backend · frontend · qa · process · infra**)과 `sources`(출처 프로젝트)를 답니다. `INDEX.md`가 이를 분야별로 그룹핑하므로, 각 역할은 `recall-knowledge` 스킬의 **역할 → 분야 라우팅 표**대로 자기 분야 교훈만 읽고 구현에 들어갑니다.

## 참고 자료

- [`docs/ai-agents-notes.html`](docs/ai-agents-notes.html) — O'Reilly **"Building Applications with AI Agents"**(Michael Albada, 2025) 전 13장 요약 노트(장 탭 전환). 2026-08의 채팅 회복력·평가·CI·보안 등 개선(CLAUDE.md 변경 이력이 "AI 에이전트 책 N장"으로 참조하는 그 출처)이 이 노트에서 나왔습니다. 브라우저로 파일을 바로 열면 됩니다.
- [`docs/adr/`](docs/adr/) — 시니어가 구현 착수 전 남기는 아키텍처 결정 기록(빌드가 생성).

## 옵션

```bash
./setup.sh --with-plugins   # 권장 플러그인 설치 (harness, superpowers) — 없어도 하네스는 동작
./setup.sh --ingest         # 카드 없는(외부) 프로젝트의 지식 카드 생성 (claude 필요, 토큰 소비)
./setup.sh --self-test      # 훅 검사기가 깨진 설정을 실제로 잡는지 확인
```

## 내 프로젝트 연결 (projects.json)

`projects.json`은 **개인 설정**입니다(프레임워크 코드가 아님). 항목을 추가하고 `./setup.sh`를 다시 실행하면 clone·색인됩니다.

```json
{ "projects": [ { "name": "shop", "git": "https://github.com/<you>/shop.git" } ] }
```

- 프로젝트 소스는 메인 레포에 담지 않고 **git 링크로** 연결됩니다(setup이 각자 위치로 clone, `.git/info/exclude`로 추적 제외).
- 하네스로 만들지 않은 외부 프로젝트는 `./setup.sh --ingest` 또는 `node knowledge/ingest.mjs <name>` 으로 지식 카드를 생성하세요(코드 분석 → 카드).
- ingest는 **자가 교정 1회**를 포함합니다: 생성된 카드가 필수 frontmatter 검증에 걸리면 검증 오류와 실패 카드를 되먹여 형식만 교정해 다시 출력하게 하고(재시도 상한 1회 — 같은 결정적 검사에 2연속 탈락은 형식 실수가 아님), 2차도 불합격이면 1·2차 사유를 모두 담아 실패합니다. 1차 통과 시 추가 호출은 0입니다.
- 포크하는 사람은 `projects.example.json`을 참고해 목록만 교체하면 됩니다.

## 지식 채팅 UX

- **스트리밍 응답**: 답변이 생성되는 대로 토큰 단위로 표시됩니다(무한 로딩 없음). 서버는 `POST /api/chat`에 `stream: true`가 오면 NDJSON(`{"type":"delta"|"done"|"error"}` 줄 단위)으로 응답하고, `stream` 없이 호출하면 기존 단발 JSON 응답 그대로입니다.
- **추천 질문**: 빈 채팅 화면에 `GET /api/suggestions`(골든셋 질문 문자열)의 칩이 뜹니다. 클릭하면 바로 전송됩니다.
- **세션 유지**: 세션 id를 localStorage에 보관하므로 새로고침해도 이전 대화 맥락이 이어집니다(`claude --resume`). 상단 **새 대화** 버튼으로 초기화합니다.

## 의존성

- **필수:** Node.js, git
- **선택:** `rg`(없으면 JS 폴백 검색), `claude` CLI(지식 채팅·카드 ingest용)
- `rg` 는 **셸이 아니라 Node 로** 확인합니다. `command -v rg` 는 셸 함수·별칭에도 반응해서, `knowledge/` 가 `spawn('rg')` 할 때 ENOENT 로 터지는 환경을 통과시킵니다(이 레포에서 실제로 겪었고, `setup.sh` 1단계가 Node 로 다시 잽니다).
- 시크릿은 환경변수로: `CHAT_TOKEN`, `CHAT_MODEL`(채팅 기본 모델). 커밋하지 마세요.
- `CHAT_TOKEN`을 설정하면 **채팅·파일 열람·검색 API 전부** 같은 토큰을 요구합니다 (UI가 401 시 토큰을 물어봄). dot 경로(`.git`·`.claude` 등)는 토큰과 무관하게 웹으로 서빙되지 않고, 마크다운 렌더는 DOMPurify로 새니타이즈됩니다.
- 채팅 운영 env(선택): `CHAT_MAX_CONCURRENT`(동시 채팅 상한, 기본 2 — 초과 시 429), `CHAT_MODEL_SONNET`/`CHAT_MODEL_OPUS`(allowlist 모델 id 교체 — 모델 세대 교체 시 코드 수정 불필요).

## 하네스 동작 원리

- **에이전트(`.claude/agents/*.md`) = 누가**, **스킬(`.claude/skills/*`) = 어떻게**. Claude Code가 네이티브 로드하므로 별도 플러그인 없이 동작합니다.
- 개발은 무조건 요구사항(REQ-ID) 기반 **TDD** — 실패 테스트 먼저. 모든 in-scope REQ가 테스트 100% 커버 + 전체 통과해야 QA로 인계.
- QA는 **백엔드↔프론트 경계면 교차 검증** + 실제 브라우저 E2E를 최우선으로 검증.
- 매 빌드 후 **회고 루프**가 대화·산출물에서 신호를 캐내 하네스 자체를 개선합니다.
- **훅 두 개가 하네스를 기본값으로 만듭니다** (`.claude/settings.json`, 경로는 `$CLAUDE_PROJECT_DIR` 기준이라 기계에 안 묶임):
  - `UserPromptSubmit` → `harness-trigger.sh`: 빌드·후속 작업 신호가 보이면 매 프롬프트마다 트리거 규칙을 주입합니다. `CLAUDE.md` 의 문장은 세션당 한 번 읽히고 대화가 길어지면 뒤로 밀립니다 — 자동 동작은 판단이 아니라 훅이 일으켜야 합니다. 단발 질문·한 줄 수정에는 주입하지 않습니다.
  - `SessionStart` → `resume-unfinished-build.sh`: 미완 런북(`RESUME_*.md`)이 있으면 새 세션에 알립니다. 보는 자리는 하네스 `_workspace`, `<레포>/<프로젝트>/_workspace`, 그리고 `.claude/hooks/watch-workspaces.local`(기계별, git 제외 — 형제 디렉터리 프로젝트는 여기에 한 줄씩).
  - 둘 다 `./setup.sh` 5단계(`verify-hooks.sh`)가 **양방향으로** 검증합니다 — 주입해야 할 입력에 주입하는지, 주입하면 안 될 입력에 조용한지. 검사기 자신도 `--self-test` 로 깨진 설정 네 종류를 심어 보고 잡는지 확인합니다.

## 테스트

```bash
node --test "knowledge/test/**/*.test.mjs" "scripts/test/**/*.test.mjs"
```

- 같은 스위트가 GitHub Actions CI(`.github/workflows/ci.yml`)에서 push·PR마다 자동 실행됩니다 — 회귀는 머지 전에 걸립니다.

## 평가 (지식 채팅 골든셋)

```bash
node knowledge/eval/run.mjs [--model sonnet|opus] [--stream] [--repeat N]
```

- `knowledge/eval/golden.json`의 질문(10문항 — 접지·패러프레이즈·분야 라우팅·미지 프로젝트 거절 포함)을 실제 채팅에 던져, 답변에 기대 근거가 포함되는지 검사합니다.
- `--stream`: 스트리밍 경로(chatStream — UI의 기본 경로)로 평가. `--repeat N`: 케이스당 N회 실행해 일관성 측정(전부 통과해야 합격, `[2/3]`식 표기).
- 케이스당 실제 `claude` 호출(순차)로 구독 할당량을 소모하므로 **자동 테스트에 포함되지 않는 수동 전용** 스크립트입니다.
- **살아있는 명세 규칙**: 지식 베이스에 내용·기능이 추가되면 golden.json에 대응 케이스도 추가합니다 — 평가셋은 고정 벤치마크가 아니라 시스템 능력을 따라 자라는 명세입니다.
