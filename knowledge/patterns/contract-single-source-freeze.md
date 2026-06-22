---
type: Reusable Pattern
title: API 계약 단일 소스 + 리더 동결 — 경계면 교착 방지
tags: [api-contract, delegation, coordination, boundary]
timestamp: 2026-06-19T00:00:00Z
source_projects: [minesweeper, shop]
---

# 문제
백엔드·프론트 시니어가 계약을 서로 양보(상대 값 채택)하면 응답 shape이 **교차(swap)**해 어긋난다. 협상 중 양쪽이 문서를 동시에 편집하면 stale 문서 재읽기로 결정이 뒤집힌다.

# 정석
- **계약 단일 소스 = 백엔드 아키텍처 문서 `03_backend_architecture.md §3`, 소유자 = 백엔드 시니어.**
- 프론트 시니어는 SendMessage로 **제안만**, 반영은 백엔드 시니어가 1회.
- 양쪽 동시 편집/상호 양보 금지.
- **합의가 2회 교차/불일치하면 즉시 리더 에스컬레이션 → 리더가 값을 정해 파일(문서)에 동결**. 메시지로만 정하면 stale 재읽기로 또 뒤집힌다 — 파일이 권위.

# 출처/적용
- [minesweeper](../cards/minesweeper.md): leaderboard 래핑/best 경로 상호 양보 교착 → 파일 동결로 종료.
- [shop](../cards/shop.md): 다자 계약(고객·셀러·어드민)에서 동일 규율 적용.
