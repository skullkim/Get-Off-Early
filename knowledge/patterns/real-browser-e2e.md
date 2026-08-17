---
type: Reusable Pattern
title: 실제 브라우저 E2E + 시각/디자인 충실도 — "그린 ≠ 통합"
tags: [qa, e2e, browser, cors, visual-fidelity, verification]
timestamp: 2026-06-19T00:00:00Z
domain: [frontend, qa]
sources: [todo, minesweeper]
---

# 원칙
자동 테스트·목·MockMvc·curl이 **전부 그린이어도** 실제 통합은 깨질 수 있다. 완료 선언 전 **실제 브라우저↔실제 백엔드 1회 E2E 스모크** 필수. curl ≠ 브라우저.

# 두 사각지대
- **동작/네트워크**: CORS·프리플라이트·헤더/쿠키·리다이렉트·mixed content. 목·슬라이스·curl이 모두 우회. ([CORS 정석](cors-done-right.md))
- **시각/디자인 충실도**: 자동 테스트와 행위 E2E는 시각을 안 본다. 토큰 정의 = 스타일 완료 아님 — 사용 className에 대응하는 실제 CSS 규칙 필요. 완료 전 `02_design`을 펴놓고 화면별 스크린샷(모바일+데스크톱) 대조.

# 적용 사례 (일반화)
- "QA 4라운드 통과" 선언 후 실제 브라우저 가입 화면에서 CORS 403 — 목·MockMvc·curl이 모두 통과시킨 갭.
- 145 테스트 + build + 행위 E2E 전부 그린인데 컴포넌트 CSS 부재로 화면이 완전 미스타일.

> 출처 프로젝트는 frontmatter `sources` 참조 (`knowledge/cards/<프로젝트>.md`).
