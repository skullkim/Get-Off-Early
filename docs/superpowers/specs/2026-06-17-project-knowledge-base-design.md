# 프로젝트 지식 베이스 (Project Knowledge Base) — 설계

- 날짜: 2026-06-17
- 상태: 설계 승인 대기
- 위치: `knowledge/` (신규 최상위 디렉터리) + `.claude/skills/recall-knowledge/`

## 1. 목적

project-loop 에서 빌드를 거듭할수록 쌓이는 산출물·교훈이 시간이 지나면 잊혀진다.
이를 **두 소비자**가 활용할 수 있는 단일 지식 베이스로 만든다.

- **1순위 (핵심): 클로드가 조회·재사용** — 새 빌드의 스택·아키텍처·계약 결정 전에
  과거 비슷한 작업을 빠르게 찾아 prior-art로 활용한다.
- **2순위 (겸사겸사): 사람이 보는 웹** — 어떤 프로젝트를 했는지, 프로젝트별 산출물,
  개별 파일 조회, 파일 유형별 조회.

### 핵심 통찰

클로드는 웹사이트를 브라우징하지 않고 **파일을 읽는다**. 따라서 클로드에게 가장 빠른 조회는
실행 중인 서버에 curl 하는 것이 아니라 **미리 생성된 로컬 인덱스 파일을 Read** 하는 것이다
(툴 호출 1회, 네트워크 0, 서버 기동 불필요). 서버는 사람을 위한 것이다.

## 2. 비목표 (YAGNI)

- **DB 없음.** 데이터의 원본은 디스크의 파일 그 자체다. DB는 이중 복사본 + 동기화 비용 +
  drift 위험만 추가한다. 파일시스템이 곧 DB이고, 생성된 `index.json`이 그 위의 색인이다.
- 인증/멀티유저 없음 (로컬 단일 사용자, 읽기 전용).
- 프론트 빌드 스텝 없음 (npm install / 번들러 없음).
- **엘라스틱서치/검색엔진 클러스터 없음** — 규모(마크다운 ~60개, 1년 뒤에도 수천 개)에 100~1000배 과하고,
  DB-free 결정과 충돌(상주 JVM·재색인 파이프라인). 전체 텍스트 검색은 **ripgrep on-demand**로 충분
  (색인·데몬 0). 클로드는 이미 `Grep`이 그 역할. 혹시 수십만 문서로 폭증하면 그때 **임베디드 SQLite
  FTS5**(파일 하나) 검토 — ES는 멀티유저 공유 서비스가 됐을 때나.

## 3. 아키텍처 — 단일 소스, 두 소비자

```
knowledge/
  index-core.mjs          스캔→데이터 핵심 모듈 (생성기·서버 공유) — 순수 로직
  generate.mjs            CLI: index-core 호출 → index.json + INDEX.md 기록
  index.json              [생성물·선택] 기계용 카탈로그 스냅샷 (디버그/검사용)
  INDEX.md                [생성물] 카탈로그 + 지식카드 요약 → 클로드가 읽음 (가장 빠름)
  cards/
    todo.md
    minesweeper.md
    shop.md               지식 카드 (클로드가 distill, 사람 검토 가능) — 영속
  web/
    server.mjs            얇은 서버 (Node 내장 http+fs, 의존성 0)
    public/
      index.html
      app.js
      style.css
  test/
    index-core.test.mjs   node:test 기반 단위 테스트 (분류·추출·멱등)
    server.test.mjs       엔드포인트 + 경로 traversal 차단 테스트
```

- **카탈로그**(파일 경로·타입·크기·수정시각·섹션헤더·REQ-ID·QA 라운드 수)는 `generate.mjs`가
  파일시스템에서 **결정론적으로 자동 생성**. 손으로 안 고침, 멱등 재생성.
- **지식 카드**(스택·핵심 ADR·계약 패턴·gotcha·반복 버그·재사용 포인트)는 **클로드가 distill**해
  `cards/*.md`에 저장. 영속적, 사람이 검토 가능.
- 생성기가 **카탈로그 + 카드**를 합쳐 `INDEX.md`/`index.json`을 만든다.
- 단일 소스 규율: 카탈로그=파일시스템에서, 카드=`cards/`에서. 둘 다 멱등 병합.

## 4. 데이터 모델

### 4.1 파일 유형 분류 (`classifyFile(path)`)

| category | 매칭 규칙 |
|---|---|
| `requirements` | `01_requirements*`, `*_requirements.md` |
| `design` | `02_design*`, `02b_*design*`, `_workspace/**/prototype/**` |
| `architecture` | `03_*architecture*`, `03b_*specs*` |
| `coverage` | `04_coverage_matrix*` |
| `qa` | `05_qa_*` |
| `meta` | `RESUME.md`, `BUILD_COMPLETE*` |
| `code` | `.kt .ts .tsx .js .mjs .kts` |
| `style` | `.css` |
| `asset` | `.png .svg` |
| `config` | `.json .yaml .yml .properties .gitignore .npmrc` 등 그 외 |

스캔 제외: `node_modules`, `build`, `.gradle`, `dist`, `.git`.

### 4.2 `index.json` 스키마

```jsonc
{
  "generatedAt": "2026-06-17T...Z",
  "projects": [{
    "id": "shop",
    "title": "이커머스 미니샵",          // 카드 frontmatter 우선, 없으면 requirements H1
    "status": "v1 DONE / v2 진행",        // 카드 + BUILD_COMPLETE 존재 여부
    "stack": ["Kotlin/Spring/Postgres", "React/TS"],
    "summary": "한 줄 요약",              // 카드에서
    "tags": ["ecommerce", "payment", "idempotency"],
    "buildComplete": true,
    "qaRounds": 2,
    "card": "knowledge/cards/shop.md",    // 없으면 null
    "highlights": ["핵심 결정/Gotcha 불릿…"],  // 카드에서 추출
    "artifacts": [{
      "path": "shop/_workspace/02_design.md",
      "category": "design",
      "ext": "md",
      "size": 30426,
      "mtime": "...",
      "title": "첫 H1",                   // md만
      "reqIds": ["REQ-..."],              // grep, md만
      "headers": ["섹션 헤더…"]            // md만 (코드는 메타데이터만)
    }]
  }],
  "fileTypes": { "md": 57, "kt": 145, "tsx": 128, "...": 0 },
  "categories": { "requirements": ["...경로"], "design": ["..."], "...": [] }
}
```

> 코드 파일은 **내용을 인덱스에 넣지 않는다** — 경로·타입·크기·수정시각만.
> 인덱스를 작게 유지하고, 내용은 필요 시 파일 뷰어(서버)가 on-demand로 읽는다.

### 4.3 지식 카드 (`cards/<project>.md`)

```markdown
---
project: shop
title: 이커머스 미니샵
status: v1 DONE / v2 IN PROGRESS
stack: [Kotlin/Spring/Postgres, React/TS/pnpm]
summary: 고객+관리자 v1 완료, 셀러 멀티마켓 v2 진행
tags: [ecommerce, payment, idempotency, state-machine, admin]
---

## 핵심 결정 (ADR 요약)
- …

## API 계약 패턴
- …

## Gotcha / 반복 버그
- …

## 재사용 포인트
- …
```

생성기는 frontmatter → 프로젝트 헤더 필드, `## 핵심 결정`·`## Gotcha` 불릿 → `highlights`로 추출.

### 4.4 `INDEX.md` (클로드가 읽는 것)

생성물. 프로젝트별로 카드 요약 + 산출물 카탈로그를 하나로 합친 한 파일.

```markdown
# Project Knowledge Index
_생성: 2026-06-17 · 프로젝트 3 · 산출물 N_

> 사용법: 스택·아키텍처·계약을 결정하기 전에 여기서 비슷한 과거 작업을 찾고,
> 필요한 원본 파일을 드릴다운하라.

## shop — 이커머스 미니샵  [v1 DONE / v2 진행]
- 스택: Kotlin/Spring/Postgres · React/TS
- 요약: …
- 태그: ecommerce, payment, idempotency, …
- 지식 카드: knowledge/cards/shop.md
- 핵심 결정/Gotcha:
  - …
- 산출물:
  - [requirements] shop/_workspace/01_requirements.md
  - [design] shop/_workspace/02_design.md
  - [qa] shop/_workspace/05_qa_report_round1.md
  …
```

## 5. 핵심 모듈 `index-core.mjs` + CLI `generate.mjs`

- **`index-core.mjs`** — 스캔→데이터 순수 로직. `buildIndex(root)` 가 `index.json` 데이터를 반환.
  하위 순수 함수: `classifyFile`, `extractReqIds`, `extractHeaders`, `parseCard`(frontmatter+섹션),
  `buildProject`, `renderJson`, `renderMarkdown`. 생성기와 서버가 **공유**.
- **`generate.mjs`** (CLI) — `buildIndex(root)` 호출 → `index.json` + `INDEX.md` 디스크에 기록.
- 프로젝트 = 루트 하위에서 `_workspace/`를 가진 디렉터리 (자동 발견 — 미래 프로젝트도 자동 포함).
- 멱등: 같은 입력 → 같은 출력 (정렬 고정).
- 의존성 0 (Node 내장 `fs`/`path`만). frontmatter 파싱은 간단 YAML 서브셋 직접 처리.

### 5.1 신선도(staleness) — "매번 수동 갱신" 문제의 해소

산출물은 사람이 한 개씩 떨어뜨리는 게 아니라 **빌드 한 번에 한 프로젝트 분량이 몰려서** 생긴다.
빌드 사이엔 디렉터리가 동결된다. 그리고 스캔은 **수십 ms 짜리 멱등 연산**이므로, "소비가 곧 생성을
트리거"하게 만들어 스테일을 원천 차단한다.

- **웹**: 서버가 `/api/index` 요청마다 `buildIndex(root)` 로 **in-memory 재생성** → 항상 최신.
  디스크 `index.json`은 선택적 스냅샷일 뿐. (필요 시 mtime 캐시 가능하나 기본은 매 요청 신선.)
- **클로드**: `recall-knowledge` 스킬이 `INDEX.md` 읽기 **직전에 `generate.mjs`를 한 번 실행** → 최신 읽음.
- **자동 트리거**: 빌드/회고 완료 시에도 재실행. 단 이 시점에 손이 필요한 건 카탈로그가 아니라
  **지식 카드**(클로드가 distill) 뿐 — 카탈로그는 위 두 경로로 자동 최신화된다.
- **수동**: `node knowledge/generate.mjs` 언제든 가능 (필수 아님).

→ 결론: 사람이 기억해서 인덱스를 돌릴 일은 없다. 카탈로그는 소비 시 자동, 카드만 회고 때 갱신.

## 6. 웹 앱

### 6.1 서버 `server.mjs` (Node 내장 http+fs, 의존성 0)

- `GET /` → `public/index.html`, 정적 자산 서빙.
- `GET /api/index` → `index-core.buildIndex(root)` **in-memory 재생성** 결과 (항상 최신, 디스크 의존 안 함).
- `GET /api/file?path=<relpath>` → 파일 내용.
  - **보안 필수**: `path.resolve(root, relpath)` 후 결과가 리포 루트 안인지 검증.
    `..` traversal / 루트 밖 / 심볼릭 탈출은 **403**. (테스트로 강제.)
  - 텍스트(md/code/css/config) → `text/plain; charset=utf-8` 원문.
  - 이미지(png/svg) → 해당 content-type 바이트 (뷰어가 `<img>`로 표시).
- `GET /api/search?q=<term>` → 파일 **본문** 전체텍스트 검색 (ES 불필요).
  - 내부에서 `rg --json --line-number -- <term> <root>` 를 **on-demand 실행**
    (제외: `node_modules build .gradle dist .git`). 색인·데몬 0, ms 단위.
  - 응답: `[{ path, line, text, category }]` (파일당 상위 N개). `path`는 루트 상대경로.
  - `rg` 부재 시 폴백: 텍스트 파일에 대한 in-process 부분일치 스캔(상한 있음). 의존성 0 유지.

### 6.2 프론트 `public/` (바닐라 SPA, CDN `marked`+`highlight.js`)

- 좌측: 프로젝트 목록 + **파일 유형 필터 칩**(requirements/design/architecture/coverage/qa/meta/code/style/asset/config) + **검색창**.
- 본문: 프로젝트 선택 → 카테고리별 산출물 트리. 파일 선택 → 뷰어.
  - md → `marked` 렌더, 코드 → `highlight.js`, 이미지 → `<img src=/api/file?...>`.
- 유형 필터: 칩 클릭 시 보이는 파일을 해당 카테고리로 좁힘.
- **검색**: 입력어를 ① `index.json`의 제목·요약·태그·헤더에 **클라이언트 즉시 필터**,
  동시에 ② `/api/search?q=`로 **파일 본문 매치**를 가져와 결과 목록(파일+라인) 표시 → 클릭 시 뷰어로.
- 빌드 스텝 없음. `node knowledge/web/server.mjs` 로 즉시 기동.

## 7. 클로드 활용 장치 (핵심 목적 — "안 보면 무용지물" 방지)

- **`recall-knowledge` 스킬** (`.claude/skills/recall-knowledge/SKILL.md`):
  스택·아키텍처·계약 결정 전 `knowledge/INDEX.md`에서 prior-art를 먼저 찾도록 강제.
  **읽기 직전 `node knowledge/generate.mjs`를 한 번 실행해 최신화**(수십 ms)한 뒤 INDEX.md를 Read.
  트리거: "이전 프로젝트 참고", "비슷한 거 어떻게 했지", "과거 산출물", "예전 빌드".
- **하네스 연동**:
  - `architecture-and-delegation` 에 "결정 전 `knowledge/INDEX.md` prior-art 조회" 1줄.
  - `build-project`/`retrospective` 완료 시점에 `generate.mjs` 재실행 + 해당 프로젝트 카드 갱신.
- **`MEMORY.md` 포인터 1줄** 추가 → 매 세션 인덱스 존재를 상기.
- CLAUDE.md 변경 이력 + `retro/log.md`에 도입 기록 (이중 저장 규율).

## 8. 초기 시딩 & 갱신

- 구현 후 클로드가 기존 3개 프로젝트(todo/minesweeper/shop) 산출물 + `retro/log.md`를 읽어
  `cards/*.md` 를 1회 작성 → `generate.mjs` 실행 → `INDEX.md`/`index.json` 생성 → 사이트 확인.
- 이후 매 빌드/회고 때 자동 갱신(생성기 재실행 + 새 프로젝트 카드 작성).

## 9. 테스트 (TDD — 하네스 규율)

- `index-core.test.mjs` (node:test): `classifyFile` 카테고리 매핑, `extractReqIds`,
  `extractHeaders`, `parseCard`, 고정 픽스처 디렉터리에 대한 `buildIndex` 멱등 출력.
- `server.test.mjs`: `/api/index` 유효 JSON, `/api/file` 정상 읽기,
  **경로 traversal(`../`, 루트 밖, 절대경로) 403 거부** (보안 회귀 방지),
  `/api/search?q=` 매치 반환·무매치 빈배열·루트 범위 한정.
- 실행: `node --test knowledge/test/` (의존성 0).

## 10. 단위 경계 (isolation)

| 단위 | 한 일 | 인터페이스 | 의존 |
|---|---|---|---|
| `index-core.mjs` | 파일→카탈로그/카드 데이터→json/md 문자열 | `buildIndex(root)` → 객체/문자열 | fs 읽기만 |
| `generate.mjs` | core 호출 → 디스크 기록 | CLI | index-core, fs 쓰기 |
| `server.mjs` | 인덱스(재생성)/파일/검색 HTTP 서빙 | HTTP `/api/{index,file,search}` | index-core, fs(루트 범위), rg |
| `public/app.js` | index.json 렌더 + 필터/뷰어 | `/api/*` fetch | 서버 |
| `recall-knowledge` 스킬 | 결정 전 prior-art 조회 강제 | generate 실행 + INDEX.md Read | index-core, 인덱스 파일 |

각 단위는 독립적으로 이해·테스트 가능하고, 생성기·서버·스킬은 `index-core` 를 공유,
프론트는 `index.json` 계약으로만 서버와 결합.
