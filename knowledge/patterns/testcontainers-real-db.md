---
type: Reusable Pattern
title: Testcontainers 실제 Postgres — 동시성·락은 H2로 검증 불가
tags: [testing, database, postgres, testcontainers, concurrency, integration]
timestamp: 2026-06-19T00:00:00Z
source_projects: [todo, minesweeper, shop]
---

# 원칙
인메모리 H2는 실제 DB의 락·격리수준·SQL 방언을 충실히 재현하지 못한다. 비관적 락·동시성·FK·인덱스 동작은 **실제 Postgres로만** 신뢰성 있게 검증된다.

# 정석
- 통합/동시성 테스트는 `@SpringBootTest` + MockMvc + **Testcontainers Postgres**(랜덤 포트)로 실제 DB 충실도 확보.
- 단위 테스트(순수 도메인 로직)는 DB 없이.
- 구현 착수 전 리더가 **런타임 프리플라이트**: Docker 데몬 UP·포트 가용 확인(통합 단계에서 블로커로 만나지 않도록).

# 출처/적용
- [shop](../cards/shop.md): 비관적 락 동시성([정렬된 락](pessimistic-lock-ordering.md))을 실제 Postgres로만 결정적 검증.
- [todo](../cards/todo.md), [minesweeper](../cards/minesweeper.md): dev Postgres 포트 충돌(5433) 프리플라이트.
