---
type: Project Knowledge Card
project: code-navigator
title: 로컬 레포 코드 내비게이터 (심볼 인덱스)
status: DONE
stack: [Node/TypeScript(strict)/Fastify/vitest, React/TS/Vite/TanStack Query/Zustand/Shiki, pnpm workspace 3패키지, web-tree-sitter(WASM), @vscode/ripgrep, chokidar]
summary: IntelliJ식 정의 이동·참조 검색·심볼 퍼지 검색·전문 검색·파일 변경 자동 재인덱싱을 제공하는 읽기 전용 웹 도구. 임의 로컬 레포를 등록해 브라우저(특히 Orca 내장 브라우저)에서 탐색.
tags: [code-navigation, symbol-index, tree-sitter, ripgrep, file-watcher, machine-contract, monorepo, read-only]
timestamp: 2026-08-26T00:00:00Z
---

## 핵심 결정 (ADR 요약 — docs/adr/0001~0007 · 0101~0105)
- **심볼 추출 = web-tree-sitter(WASM) + 문법별 개별 npm 패키지**. 네이티브 빌드 0으로 설치가 가벼움. 묶음 편의 패키지(tree-sitter-wasms)는 ABI가 낡아 로드 실패 — spike로 착수 전 발각. 관련: [[bundled-package-abi-freshness]]
- **파일 열거·전문 검색·참조 검색 = ripgrep 위임**(@vscode/ripgrep 번들 바이너리). `.gitignore` 존중을 공짜로 얻고, 제외 규칙을 인덱싱·검색이 같은 스캔셋에서 유도해 REQ 간 일관성 확보. 관련: [[ripgrep-delegation]]
- **인덱스 = 인메모리 정방향(파일→심볼)/역방향(이름→위치) Map, 디스크 영속 없음**. 시작 시 전량 재스캔이라 "인덱스는 소스에서 재생성 가능한 파생물" 불변식이 자명하게 성립. IntelliJ MapReduceIndex 구조의 경량 재현. 관련: [[derived-index-in-memory]]
- **계약 = 공유 TS 타입 패키지(기계 계약)**. OpenAPI 생성 대신 monorepo 내 `@code-navigator/contract`를 백·프론트가 직접 import — 드리프트가 양쪽 컴파일 에러로 잡힌다(방어선 실측으로 실증). 관련: [[contract-single-source-freeze]]
- **워처 = chokidar + 디바운스 300ms + 대량(≥50파일) 전체 재스캔 폴백**. git checkout 같은 이벤트 폭주에서 죽지 않게.
- **프론트 = 동일 출처 정적 서빙**(서버가 frontend/dist 서빙) + dev는 vite 프록시. 두 경로 모두 라이브 실측 — CORS 구조적 무발생. 관련: [[cors-done-right]]
- 참조는 **이름 기반 근사**(타입 해석 없음)임을 UI 배너로 상시 고지 — 능력의 한계를 숨기지 않는 것이 신뢰의 근거.

## Gotcha (반복 함정)
- **환경 착시**: 대화 셸의 `rg`는 Claude Code가 주입한 함수였고 실제 바이너리는 부재. `grep`도 대화 셸은 ugrep·스크립트는 BSD. **소비 주체와 같은 방식(Node spawn / 스크립트 실행)으로 실측**해야 한다. 관련: [[preflight-measure-as-consumer]]
- **rg 경로 인자 생략 = 무한 행**: 검색 경로를 안 주면 stdin을 기다린다. 명시 경로 `'.'` + stdin `'ignore'` 둘 다. `'.'`를 주면 출력 경로가 `./`로 나와 정규화 필요.
- **4xx 비마스킹은 validation 에러만이 아니다**: Fastify JSON 파스 에러는 `validation` 필드가 없어 catch-all 500으로 마스킹됐다. 프레임워크 `statusCode` 4xx 보존 분기가 필요.
- **장수 dev 프로세스는 최신 코드가 아니다**: watch 없이 떠 있던 서버가 구버전을 서빙해 이미 구현된 엔드포인트에 404가 나왔고, QA·시니어가 모두 낡은 프로세스를 실측했다. 관련: [[stale-dev-process]]
- **계약 타입 변경 후 vite 캐시**: 원복해도 캐시가 낡은 타입을 물어 풀스위트만 실패(격리는 통과). `node_modules/.vite` 정리로 해소.
- **pnpm 서브디렉토리 install**: 하위 폴더에서 먼저 `pnpm install`하면 로컬 lockfile·workspace 파일이 생겨 루트 워크스페이스 인식이 깨진다.
- **Shiki 토큰 병합**: 테마 색 단위로 토큰이 병합되어 식별자 판별을 색 기반으로 설계해야 했다. 메타 패키지 대신 `@shikijs/*` fine-grained 임포트 필요(pnpm 전이 의존 차단).

## 산출물 카탈로그
- `_workspace/01_requirements.md` — REQ-001~008 + INV-1~3(스테일0·파생물·읽기전용) + SC-1~7
- `_workspace/02_design.md` + `prototype/`(7페이지 HTML) + `prototype/shots/`(14장) — 화면 S-1~S-7, 상태 전수
- `_workspace/03_backend_architecture.md` §3 = 계약 단일 소스 / `03_frontend_architecture.md`
- `_workspace/gate.sh` — 민감정보 스캔 + 백엔드(tsc×2+vitest) + 프론트(tsc·build·vitest·eslint)
- `_workspace/app-shots/` — 조립 후 라이브 CDP 대조 스크린샷(7상태×2뷰포트)
- `_workspace/BUILD_COMPLETE.md` — 리더 인증 4항목(게이트·라이브 E2E·디자인 충실도·방어선 실측)
- `docs/adr/` 13건

## 결과
백엔드 129 + 프론트 183 = **312 테스트**, gate.sh exit 0(3회 드리프트 0), REQ 커버리지 100%. 방어선 실측: 불변식 무력화 → 7건 red, 계약 필드명 변경 → 백·프론트 tsc 동시 red.
