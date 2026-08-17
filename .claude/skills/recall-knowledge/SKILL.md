---
name: recall-knowledge
description: 새 빌드의 기술 스택·아키텍처·API 계약을 결정하기 전, 과거 프로젝트의 산출물·교훈을 조회해 prior-art로 활용한다. '이전 프로젝트 참고', '비슷한 거 어떻게 했지', '예전에 어떻게', '과거 산출물', '예전 빌드 찾아' 류 요청과 build-project의 아키텍처 결정 단계 진입 시 반드시 사용. 단순 코드 질문에는 사용하지 않음.
---

# 과거 지식 조회 (Recall Knowledge)

get-off-early 는 빌드를 거듭하며 `knowledge/` 에 지식 베이스를 누적한다. 새 결정 전에 먼저 여기를 본다.

## 절차

1. **최신화 후 읽기**: `node knowledge/generate.mjs` 를 한 번 실행한다(수십 ms). 그다음 `knowledge/INDEX.md` 를 `Read`(파일 IO) 한다. 이 한 파일에 **분야별 재사용 패턴 목록**(맨 위) + 프로젝트별 스택·핵심 결정/Gotcha·관련 패턴 링크·산출물 카탈로그가 들어 있다.
2. **재사용 패턴 먼저**: INDEX.md 최상단 `재사용 패턴 (patterns/)` 섹션이 교차 프로젝트로 검증된 결정·함정의 distill이다 — 여기서 해당하는 패턴(`knowledge/patterns/*.md`)을 먼저 펼친다. 패턴 본문은 **프로젝트 무관하게 일반화**돼 있고, 출처는 frontmatter `sources`(→ `knowledge/cards/<프로젝트>.md`)에 남는다. 카드 → 패턴 마크다운 링크가 그래프를 이룬다.
3. **역할별 분야 필터 (구현 착수 전 필수)**: 각 역할은 **자기 분야(domain)의 패턴을 먼저 읽는다**. INDEX.md 패턴 섹션의 `### <분야>` 그룹을 보거나, `Grep`(파일 검색)으로 `knowledge/patterns/*.md` 의 frontmatter `domain:` 을 필터한다. 어떤 역할이 어떤 분야를 읽는지는 아래 **역할 → 분야 라우팅** 표가 단일 소스다.
4. **관련 프로젝트 식별 + 드릴다운**: 도메인/스택이 겹치는 과거 프로젝트를 요약·태그·highlights·관련 패턴 링크로 고르고, 필요한 원본만 `Read`(파일 IO) 한다. 예: 결제·정산 → `shop/_workspace/02b_seller_design.md`, CORS·인증 → 해당 프로젝트 `03_backend_architecture.md`. 리터럴 용어는 `Grep`(파일 검색) 으로 전 프로젝트 본문 검색.
5. **재사용/회피**: 채택할 패턴과 과거 Gotcha(반복 버그)를 결정에 명시 반영한다. 새 패턴을 발견하면 회고 때 `knowledge/patterns/` 에 개념 문서로 추가한다 — 이때 frontmatter에 `domain:`(분야)과 `sources:`(출처 프로젝트)를 반드시 적는다. 본문에는 프로젝트 이름을 쓰지 않는다(출처는 frontmatter가 단일 소스).
6. **검색 실패 로그(miss-log)**: INDEX·패턴·카드·Grep에서 **답을 찾지 못한 질의**는 `knowledge/miss-log.md` 에 한 줄 append 한다(`- YYYY-MM-DD [프로젝트/맥락] 질의 — 무엇이 없었나`). 히트 0이 반복되는 질문이 곧 다음에 쓸 지식 문서다 — 회고(retrospective)가 이 로그를 읽어 카드/패턴 후보를 감이 아니라 수요 기반으로 정한다.

## 역할 → 분야 라우팅 (단일 소스)

교훈(patterns)의 분류 축은 **`backend | frontend | qa | process | infra`** 5개다(`knowledge/index-core.mjs` 의 `DOMAINS`). `infra`(배포·운영·CI)는 아직 해당 문서가 없어도 축으로 열어 둔다.

| 역할 (에이전트) | 읽을 분야 |
|---|---|
| 백엔드 시니어 (`backend-senior`) · 백엔드 주니어 (`backend-junior`) | `backend` + `process` |
| 프론트엔드 시니어 (`frontend-senior`) · 프론트엔드 주니어 (`frontend-junior`) | `frontend` + `process` |
| QA (`qa`) | `qa` + **경계면**(= `backend` 와 `frontend` 를 동시에 가진 패턴) |
| PM (`pm`) · 제품 디자이너 (`product-designer`) | `process` |
| 리더(오케스트레이터) | 전 분야 |

- 다분야 패턴(`domain: [backend, frontend]` 등)은 INDEX.md에서 **각 분야 그룹에 모두** 나타난다 — 경계면 교훈을 양쪽 다 보게 하기 위함.
- 이 표가 라우팅의 **단일 소스**다. 역할·분야를 추가·변경할 때 여기만 고치고, 다른 하네스 파일에 복제하지 않는다.

## 언제

- build-project 의 아키텍처·계약 결정 직전 (architecture-and-delegation 과 짝).
- **각 역할이 구현에 착수하기 직전** — 위 라우팅 표대로 자기 분야 패턴만 읽으면 수십 초다(절차 3).
- 사용자가 과거 작업을 참조해 달라고 할 때.

서버(`knowledge/web/server.mjs`)는 사람용이다. 클로드는 서버 없이 INDEX.md/원본 파일을 직접 읽는 것이 가장 빠르다.
