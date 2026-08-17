---
type: Reusable Pattern
title: Testcontainers 실제 Postgres — 동시성·락은 H2로 검증 불가
tags: [testing, database, postgres, testcontainers, concurrency, integration]
timestamp: 2026-06-19T00:00:00Z
domain: [backend, qa]
sources: [todo, minesweeper, shop]
---

# 원칙
인메모리 H2는 실제 DB의 락·격리수준·SQL 방언을 충실히 재현하지 못한다. 비관적 락·동시성·FK·인덱스 동작은 **실제 Postgres로만** 신뢰성 있게 검증된다.

# 정석
- 통합/동시성 테스트는 `@SpringBootTest` + MockMvc + **Testcontainers Postgres**(랜덤 포트)로 실제 DB 충실도 확보.
- 단위 테스트(순수 도메인 로직)는 DB 없이.
- 구현 착수 전 리더가 **런타임 프리플라이트**: Docker 데몬 UP·포트 가용 확인(통합 단계에서 블로커로 만나지 않도록).

# 적용 사례 (일반화)
- 비관적 락 동시성([정렬된 락](pessimistic-lock-ordering.md))은 실제 Postgres에서만 결정적으로 재현·검증됨(H2에서는 재현 불가).
- dev Postgres 기본 포트 점유로 대체 포트(5433)를 쓰는 환경 — 프리플라이트로 통합 단계 블로커를 사전 차단.

> 출처 프로젝트는 frontmatter `sources` 참조 (`knowledge/cards/<프로젝트>.md`).
