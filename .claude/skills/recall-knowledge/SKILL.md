---
name: recall-knowledge
description: 새 빌드의 기술 스택·아키텍처·API 계약을 결정하기 전, 과거 프로젝트의 산출물·교훈을 조회해 prior-art로 활용한다. '이전 프로젝트 참고', '비슷한 거 어떻게 했지', '예전에 어떻게', '과거 산출물', '예전 빌드 찾아' 류 요청과 build-project의 아키텍처 결정 단계 진입 시 반드시 사용. 단순 코드 질문에는 사용하지 않음.
---

# 과거 지식 조회 (Recall Knowledge)

get-off-early 는 빌드를 거듭하며 `knowledge/` 에 지식 베이스를 누적한다. 새 결정 전에 먼저 여기를 본다.

## 절차

1. **최신화 후 읽기**: `node knowledge/generate.mjs` 를 한 번 실행한다(수십 ms). 그다음 `knowledge/INDEX.md` 를 Read 한다. 이 한 파일에 **재사용 패턴 목록**(맨 위) + 프로젝트별 스택·핵심 결정/Gotcha·관련 패턴 링크·산출물 카탈로그가 들어 있다.
2. **재사용 패턴 먼저**: INDEX.md 최상단 `재사용 패턴 (patterns/)` 섹션이 교차 프로젝트로 검증된 결정·함정의 distill이다 — 여기서 해당하는 패턴(`knowledge/patterns/*.md`)을 먼저 펼친다. 패턴 문서는 출처 프로젝트 카드로 링크된다(그래프).
3. **관련 프로젝트 식별 + 드릴다운**: 도메인/스택이 겹치는 과거 프로젝트를 요약·태그·highlights·관련 패턴 링크로 고르고, 필요한 원본만 Read 한다. 예: 결제·정산 → `shop/_workspace/02b_seller_design.md`, CORS·인증 → 해당 프로젝트 `03_backend_architecture.md`. 리터럴 용어는 `Grep` 으로 전 프로젝트 본문 검색.
4. **재사용/회피**: 채택할 패턴과 과거 Gotcha(반복 버그)를 결정에 명시 반영한다. 새 패턴을 발견하면 회고 때 `knowledge/patterns/` 에 개념 문서로 추가한다.
5. **검색 실패 로그(miss-log)**: INDEX·패턴·카드·Grep에서 **답을 찾지 못한 질의**는 `knowledge/miss-log.md` 에 한 줄 append 한다(`- YYYY-MM-DD [프로젝트/맥락] 질의 — 무엇이 없었나`). 히트 0이 반복되는 질문이 곧 다음에 쓸 지식 문서다 — 회고(retrospective)가 이 로그를 읽어 카드/패턴 후보를 감이 아니라 수요 기반으로 정한다.

## 언제

- build-project 의 아키텍처·계약 결정 직전 (architecture-and-delegation 과 짝).
- 사용자가 과거 작업을 참조해 달라고 할 때.

서버(`knowledge/web/server.mjs`)는 사람용이다. 클로드는 서버 없이 INDEX.md/원본 파일을 직접 읽는 것이 가장 빠르다.
