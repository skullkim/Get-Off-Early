# 이식 가능한 하네스 + 지식 웹앱 (GitHub 배포) — 설계

- 날짜: 2026-06-22
- 상태: 설계 승인 대기 → 구현 계획(writing-plans)으로 전환 예정

## 1. 목표 / 비목표

**목표**
- 어떤 컴퓨터에서든 `git clone` + 한 번의 setup으로 (1) 가상 개발팀 하네스와 (2) 지식 웹앱을 사용할 수 있게 한다.
- `knowledge`에 들어갈 프로젝트는 메인 레포에 담지 않고 **git 링크(매니페스트)**로 전달한다.
- 하네스로 만들지 **않은** 외부 프로젝트도 지식 베이스에 편입할 수 있도록 **지식 카드를 자동 생성**한다.
- **프레임워크(범용)와 사용자 프로젝트 목록(개인 설정)을 분리**한다. `todo/shop/…`은 특정 사용자의 인스턴스일 뿐이며, 프레임워크 도구는 프로젝트 이름을 하드코딩하지 않고 매니페스트·파일시스템으로만 구동한다.

**비목표 (YAGNI)**
- 과거 프로젝트(todo/shop/…)를 새 컴퓨터에서 실제로 빌드·구동하는 것 (Java/Gradle/Docker/Postgres/Kafka/pnpm 등 무거운 툴체인 재현은 범위 밖). 웹앱은 소스를 **읽기만** 하면 색인·검색·열람·채팅이 된다.
- 외부 프로젝트의 `_workspace/` 산출물(요구사항·설계·QA) 역설계. 완성 코드에서 REQ-ID·수용기준을 역추적하는 것은 손실·추측이 크다. 카드만 생성한다.
- 전역 `~/.claude` 설정·메모리 동기화. 사용자 본인 소관으로 두고 레포에 포함하지 않는다.

## 2. 핵심 결정 (확정)

| # | 결정 | 선택 | 사유 |
|---|------|------|------|
| D1 | 지식 프로젝트 연결 | **매니페스트(`projects.json`) + 클론 스크립트** | 서브모듈의 detached HEAD/인증/--recursive 누락 함정 회피, 프로젝트 추가가 JSON 한 줄 |
| D2 | 세팅 범위 | **하네스 + 지식 웹앱 사용까지** | 과거 프로젝트는 clone(소스)만으로 웹앱 색인 충족. 의존성 최소 |
| D3 | 설정 범위 | **프로젝트 범위만** | 공유 레포에 `bypassPermissions`·머신별 경로·회사 설정을 올리지 않음(보안) |
| D4 | 외부 프로젝트 편입 | **지식 카드만 LLM 생성** | 웹앱 리스팅·검색·채팅·recall-knowledge에 충분, 가볍고 확실 |
| D5 | 플러그인 설치 | **opt-in(`--with-plugins`)** | 하네스는 플러그인 없이도 동작(전부 project-local). 권장 도구만 선택 설치 |
| D6 | 프로젝트 목록 위치 | **`projects.json` 내 목록 커밋 + `projects.example.json` 템플릿 동봉** | 프로젝트는 사용자별로 다름. 내 목록을 커밋하면 다른 내 컴퓨터에서 clone만으로 따라옴(손쉬운 세팅). 프레임워크 코드는 이름 하드코딩 0이라 포크·타인은 목록만 교체 |

### 의존성 사실 (D5 근거)
- 7개 에이전트(`.claude/agents/`) + 8개 스킬(`.claude/skills/`)은 전부 **project-local**이며 Claude Code가 네이티브 로드한다.
- 프로젝트 스킬/에이전트에 `superpowers:`/`harness:` 참조 **0건**. 유일한 스킬 간 호출(`build-project → retrospective`)도 project-local.
- 따라서 `harness:harness`(하네스 제조·점검 메타도구)와 `superpowers:*`(범용 작업 규율)는 **런타임 필수 아님**. 전자는 하네스를 *고치거나 새로 찍을 때*, 후자는 *범용 규율*을 더할 때만 권장.

## 3. 아키텍처

### 3.1 레포 구성
```
get-off-early (메인 레포, 신규)
├── .claude/
│   ├── agents/            # 하네스 — 7 에이전트 (커밋)
│   ├── skills/            # 하네스 — 8 스킬 (커밋)
│   ├── retro/log.md       # 진화 로그 (커밋)
│   └── settings.json      # 안전 버전(허용목록만, bypassPermissions 제거) (커밋)
│      settings.local.json # (gitignore — 머신별)
├── CLAUDE.md              # 하네스 포인터 (커밋)
├── knowledge/             # 웹앱 + KB 도구 + cards + patterns (커밋)
│   ├── INDEX.md, index.json   # (gitignore — 재생성물)
│   └── ingest.mjs         # 신규: 외부 프로젝트 → 카드
├── projects.json          # 신규: 내 프로젝트 목록 = 개인 설정 (커밋, 사용자가 자유 편집)
├── projects.example.json  # 신규: 빈/예시 템플릿 (커밋, 포크·타인용)
├── setup.sh               # 신규: 멱등 세팅 (커밋)
├── README.md              # 신규: 퀵스타트 (커밋)
├── .gitignore             # 신규 (커밋)
├── docs/                  # 기존 + 본 설계 문서
└── (todo/ shop/ minesweeper/ message-platform/)  # gitignore — setup이 clone

per-project 레포 (신규, 각각): todo · shop · minesweeper · message-platform
```

### 3.2 컴포넌트 (각 단위 = 단일 책임)
- **`projects.json`** (사용자 설정, 프레임워크 아님): 지식 프로젝트 매니페스트. `{ "projects": [ { "name", "git" } ] }`. 사용자가 자유 편집하는 개인 목록이며 내 인스턴스는 커밋되어 다른 내 컴퓨터로 따라온다. 카드 유무로 하네스산출/외부 자동 판별(별도 플래그 불필요). 모든 프레임워크 도구(setup·ingest·generate·server)는 이 매니페스트와 파일시스템만 읽고 프로젝트 이름을 하드코딩하지 않는다.
- **`setup.sh`** (오케스트레이션): 의존성 체크 → clone → 색인 생성 → 테스트. 옵션 플래그: `--with-plugins`(권장 플러그인 설치), `--ingest`(카드 없는 프로젝트 인제스트). 멱등(이미 된 단계는 skip).
- **`knowledge/ingest.mjs`** (단일 기능): 프로젝트 디렉터리 1개 → `knowledge/cards/<name>.md` 1개. `claude -p` 헤드리스 + 읽기전용 툴(Read/Grep/Glob), `chat.mjs`의 spawn 패턴 재사용.
- **`.claude/settings.json`** (안전 설정): 일반·안전한 허용목록만. `bypassPermissions`·tailscale·system_profiler 등 머신/민감 항목 제거.
- **`.gitignore`**, **`README.md`**: 배포 위생·진입점.

## 4. 데이터 흐름

### 4.1 새 컴퓨터 세팅 (기본)
```
git clone <메인 레포> && cd get-off-early && ./setup.sh
  1) 의존성 체크   node·git 필수 / rg·claude 선택(없으면 경고)
  2) clone        projects.json 순회 → 없는 프로젝트만 git clone
  3) 색인         node knowledge/generate.mjs → INDEX.md, index.json
  4) 테스트        node --test "knowledge/test/**/*.test.mjs"
  5) 안내         웹앱 기동 명령 + 하네스 트리거 방법 출력
→ node knowledge/web/server.mjs   # 검색·열람·채팅
→ Claude Code에서 "이거 만들어줘"  # build-project 트리거
```

### 4.2 옵션 단계
- `./setup.sh --with-plugins` → `claude plugin marketplace add` + `install harness, superpowers` (멱등). 권장 도구.
- `./setup.sh --ingest` → 카드 없는(외부) 프로젝트마다 `node knowledge/ingest.mjs <name>` 실행 후 색인 재생성. 토큰 소비를 명시적으로 동의하는 플래그.

### 4.3 외부 프로젝트 인제스트
```
node knowledge/ingest.mjs <project>
  → claude -p (읽기전용) 가 <project>/ 분석:
      스택 감지(확장자·build.gradle·package.json), 모듈/엔트리포인트,
      핵심 결정·gotcha·재사용 포인트 추론
  → knowledge/cards/<project>.md (표준 frontmatter: type/project/title/status/stack/summary/tags/timestamp + 본문 섹션) 작성
  → generate.mjs 가 카드↔patterns 그래프 링크 연결
```

## 5. 보안 / 위생
- `.gitignore`: `settings.local.json`, 매니페스트의 프로젝트 디렉터리, `knowledge/INDEX.md`, `knowledge/index.json`, OS 잡파일(`.DS_Store`), 만일의 `node_modules`.
- 시크릿(`CHAT_TOKEN` 등)은 **env로만**, README에 문서화. 커밋 금지.
- 배포용 `.claude/settings.json`은 머신/민감 항목 제거한 최소 안전 허용목록.

## 6. 에러 핸들링
- setup 각 단계는 **선행 실패 시 명확한 메시지 + 비영(非零) 종료**. 부분 성공도 어디까지 됐는지 출력(멱등이므로 재실행으로 이어감).
- `claude` 미설치/미인증 시: clone·색인·테스트는 정상, **채팅·인제스트만 비활성** + 안내. 웹앱은 그대로 동작.
- `rg` 부재: `server.mjs`의 JS 폴백 검색 사용(이미 구현됨).
- clone 실패(네트워크/권한): 해당 프로젝트만 skip하고 경고, 나머지 진행.

## 7. 테스트
- 기존 `knowledge/test/**`(30+ 통과)를 setup 마지막에 실행해 회귀 확인.
- 신규 `ingest.mjs`: 인자 파싱·프롬프트 구성 등 순수 함수는 단위 테스트 추가. 실제 `claude` 스폰은 테스트에서 제외(외부 의존), `chat.mjs`처럼 args 빌더만 검증.
- `setup.sh`: 멱등성 수동 확인(2회 실행 시 깨지지 않음) + 드라이런 안내.

## 8. 구현 단계에서 필요한 입력 (지금 불필요)
- GitHub 사용자명/org — 매니페스트 URL + repo 생성용.
- repo 생성·푸시를 `gh`로 대행해도 될지 — 외부 반영이라 실행 직전 확인.
- 프로젝트 레포 공개/비공개 선택.

## 9. 구현 개요 (계획 단계에서 상세화)
1. 프로젝트별 레포 분리·푸시(todo/shop/minesweeper/message-platform) → 메인 레포에서 해당 디렉터리 gitignore.
2. 메인 레포 산출물 작성: `projects.json`, `.gitignore`, 안전 `.claude/settings.json`, `README.md`.
3. `knowledge/ingest.mjs` + 단위 테스트.
4. `setup.sh`(기본 + `--with-plugins` + `--ingest`).
5. message-platform 카드 생성(현재 카드 없음) — ingest로 또는 수기.
6. 메인 레포 `git init` → 커밋 → GitHub 푸시(확인 후).
7. 깨끗한 위치에서 clone→setup E2E 검증.
