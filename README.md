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

## 옵션

```bash
./setup.sh --with-plugins   # 권장 플러그인 설치 (harness, superpowers) — 없어도 하네스는 동작
./setup.sh --ingest         # 카드 없는(외부) 프로젝트의 지식 카드 생성 (claude 필요, 토큰 소비)
```

## 내 프로젝트 연결 (projects.json)

`projects.json`은 **개인 설정**입니다(프레임워크 코드가 아님). 항목을 추가하고 `./setup.sh`를 다시 실행하면 clone·색인됩니다.

```json
{ "projects": [ { "name": "shop", "git": "https://github.com/<you>/shop.git" } ] }
```

- 프로젝트 소스는 메인 레포에 담지 않고 **git 링크로** 연결됩니다(setup이 각자 위치로 clone, `.git/info/exclude`로 추적 제외).
- 하네스로 만들지 않은 외부 프로젝트는 `./setup.sh --ingest` 또는 `node knowledge/ingest.mjs <name>` 으로 지식 카드를 생성하세요(코드 분석 → 카드).
- 포크하는 사람은 `projects.example.json`을 참고해 목록만 교체하면 됩니다.

## 지식 채팅 UX

- **스트리밍 응답**: 답변이 생성되는 대로 토큰 단위로 표시됩니다(무한 로딩 없음). 서버는 `POST /api/chat`에 `stream: true`가 오면 NDJSON(`{"type":"delta"|"done"|"error"}` 줄 단위)으로 응답하고, `stream` 없이 호출하면 기존 단발 JSON 응답 그대로입니다.
- **추천 질문**: 빈 채팅 화면에 `GET /api/suggestions`(골든셋 질문 문자열)의 칩이 뜹니다. 클릭하면 바로 전송됩니다.
- **세션 유지**: 세션 id를 localStorage에 보관하므로 새로고침해도 이전 대화 맥락이 이어집니다(`claude --resume`). 상단 **새 대화** 버튼으로 초기화합니다.

## 의존성

- **필수:** Node.js, git
- **선택:** `rg`(없으면 JS 폴백 검색), `claude` CLI(지식 채팅·카드 ingest용)
- 시크릿은 환경변수로: `CHAT_TOKEN`(채팅 게이트), `CHAT_MODEL`(채팅 기본 모델). 커밋하지 마세요.
- 채팅 운영 env(선택): `CHAT_MAX_CONCURRENT`(동시 채팅 상한, 기본 2 — 초과 시 429), `CHAT_MODEL_SONNET`/`CHAT_MODEL_OPUS`(allowlist 모델 id 교체 — 모델 세대 교체 시 코드 수정 불필요).

## 하네스 동작 원리

- **에이전트(`.claude/agents/*.md`) = 누가**, **스킬(`.claude/skills/*`) = 어떻게**. Claude Code가 네이티브 로드하므로 별도 플러그인 없이 동작합니다.
- 개발은 무조건 요구사항(REQ-ID) 기반 **TDD** — 실패 테스트 먼저. 모든 in-scope REQ가 테스트 100% 커버 + 전체 통과해야 QA로 인계.
- QA는 **백엔드↔프론트 경계면 교차 검증** + 실제 브라우저 E2E를 최우선으로 검증.
- 매 빌드 후 **회고 루프**가 대화·산출물에서 신호를 캐내 하네스 자체를 개선합니다.

## 테스트

```bash
node --test "knowledge/test/**/*.test.mjs" "scripts/test/**/*.test.mjs"
```

## 평가 (지식 채팅 골든셋)

```bash
node knowledge/eval/run.mjs [--model sonnet|opus]
```

- `knowledge/eval/golden.json`의 질문을 실제 채팅에 던져, 답변에 기대 근거(파일명·키워드)가 포함되는지 검사합니다.
- 케이스당 실제 `claude` 호출 1회(순차 실행)로 구독 할당량을 소모하므로 **자동 테스트에 포함되지 않는 수동 전용** 스크립트입니다.
