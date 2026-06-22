---
type: Project Knowledge Card
project: shop
title: 이커머스 미니샵 (멀티셀러 마켓플레이스)
status: v1 DONE / v2 DONE
stack: [Kotlin/Spring Boot/PostgreSQL(5433)/Gradle, React/TS/Vite/pnpm, JWT+BCrypt+RBAC]
summary: v1 고객+관리자(재고 홀드/만료·멱등결제·주문 상태기계·오버셀 방지) + v2 셀러 3자 마켓플레이스(주문 분할·셀러별 개별 멱등결제·정산 상태기계) 모두 완료(전 게이트 통과 2026-06-18).
tags: [ecommerce, concurrency, pessimistic-lock, idempotency, hold-expiry, state-machine, rbac, settlement, marketplace]
timestamp: 2026-06-19T00:00:00Z
---

## 핵심 결정 (ADR 요약)
- ADR-1 홀드 만료: 하이브리드 — 가용재고는 항상 expires_at > now() 지연 필터(정합 소스)이고 @Scheduled 경량 스위퍼는 상태 구체화(표시)만. HoldExpiryService.sweep(now) 순수 메서드 + Clock 주입으로 결정적 테스트, 정합성은 스위퍼 타이밍에 비의존.
- ADR-2 동시성: 임계구역(체크아웃/결제확정/복원)에서 product 행 PESSIMISTIC_WRITE 락, 여러 품목은 productId 오름차순 정렬로 데드락 회피. 오버셀 0을 DB 차원 보장(N재고 M>N주문 → 정확히 N 성공).
- 시간: java.time.Clock 빈 주입(기본 systemUTC) — 홀드 만료/카운트다운을 테스트에서 결정적으로 제어.
- RBAC: JWT role 클레임(CUSTOMER/ADMIN, v2에서 SELLER 추가). 로그아웃 jti 블랙리스트.

## API 계약 패턴
- 멱등 결제: 멱등키로 중복/재시도 방어. v2는 셀러별 주문 분할 + 셀러별 개별 멱등 결제 + 정산 상태기계.
- 주문 상태기계 + 재고 홀드/만료 자동 복원. 결제 경로는 락 안에서 만료를 방어적으로 재확인.

## Gotcha / 반복 버그
- 동시성·락 테스트는 실제 Postgres 필수(H2로 재현 불가) → Docker 런타임 프리플라이트.
- 중단 빌드 이어받기: 세 상태 문서(RESUME·coverage_matrix·QA)가 서로 다른 시점을 가리켜 완료 판정 모호 → 완료 인증 단일 소스 = 리더 독립검증 후 BUILD_COMPLETE.md 쓴 시점.
- 팀이 리더 전용 검증(라이브 E2E·디자인 충실도)을 자가 PASS로 기록하면 안 됨 — "리더 인증 대기"로만 표기.

## 재사용 포인트
- [비관적 락 + productId 정렬](../patterns/pessimistic-lock-ordering.md) = 동시성 임계구역 표준(오버셀·데드락 0).
- 지연 만료(소스) + 경량 스위퍼(구체화) 하이브리드 = TTL/예약 만료 일반 패턴.
- [Clock 빈 주입](../patterns/clock-injection-deterministic-time.md) = 시간 의존 로직의 결정적 테스트.
- 동시성은 [Testcontainers 실제 Postgres](../patterns/testcontainers-real-db.md)로만 검증(H2 불가). 계약 규율 [단일 소스 동결](../patterns/contract-single-source-freeze.md).
