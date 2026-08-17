---
type: Reusable Pattern
title: 비관적 락 + 정렬된 락 획득 — 오버셀/데드락 방지
tags: [concurrency, database, locking, deadlock, transaction]
timestamp: 2026-06-19T00:00:00Z
domain: [backend]
sources: [shop]
---

# 문제
동시 구매 경합에서 재고 오버셀을 막아야 한다. 낙관적 락은 재시도 폭주, 비정규화 카운터는 만료 정합과 충돌.

# 정석
- 임계구역(체크아웃·결제확정·복원)에서 대상 product 행을 `PESSIMISTIC_WRITE`(SELECT … FOR UPDATE)로 락.
- **여러 품목은 productId 오름차순으로 정렬해 락 획득** → 락 순서 일관성으로 데드락 회피.
- 락 안에서 가용재고 재계산 후 홀드 생성/확정/복원.

# 효과
- 오버셀 **0**을 DB 차원에서 보장. 동시성 테스트가 결정적(N재고·M>N주문 → 정확히 N 성공).
- 처리량은 자원(상품) 단위로 직렬화되지만 소규모 트래픽엔 충분.

# 검증
- 동시성/락은 H2로 재현 불가 → [Testcontainers 실제 Postgres](testcontainers-real-db.md)로 검증.

# 적용 사례 (일반화)
- 재고 홀드·결제 확정·복원이 같은 자원 행을 건드리는 커머스형 임계구역에 ADR로 채택 — 오버셀 0·데드락 0.

> 출처 프로젝트는 frontmatter `sources` 참조 (`knowledge/cards/<프로젝트>.md`).
