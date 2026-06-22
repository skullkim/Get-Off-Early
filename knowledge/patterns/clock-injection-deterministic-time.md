---
type: Reusable Pattern
title: Clock 주입 — 시간 의존 로직의 결정적 테스트
tags: [testing, time, determinism, expiry, server-authoritative]
timestamp: 2026-06-19T00:00:00Z
source_projects: [shop, minesweeper]
---

# 문제
만료(TTL)·카운트다운·경과시간 같은 시간 의존 로직은 실시간 시계로 테스트하면 비결정적이고 느리다.

# 정석
- `java.time.Clock` 빈을 주입(기본 `Clock.systemUTC()`). 모든 시간 읽기를 이 Clock 경유로.
- 테스트에서 고정/가변 Clock을 주입해 만료·경계를 결정적으로 검증.
- 백그라운드 잡(@Scheduled)은 **얇은 트리거**로 두고, 실제 로직은 `sweep(now)` 같은 순수 메서드로 분리해 테스트에서 직접 호출.

# 효과
- 만료 경계·경과시간을 타이밍 의존 없이 검증. 정합성이 스케줄러 타이밍에 비의존.

# 출처/적용
- [shop](../cards/shop.md): 홀드 만료/카운트다운(ADR-1).
- [minesweeper](../cards/minesweeper.md): 서버 권위 elapsedSeconds.
