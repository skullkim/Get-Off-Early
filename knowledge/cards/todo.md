---
type: Project Knowledge Card
project: todo
title: 멀티유저 Todo 앱
status: DONE
stack: [Kotlin/Spring Boot/PostgreSQL/Gradle, React/TS/Vite/pnpm, JWT(jjwt)]
summary: 회원별 할 일 CRUD·필터·검색·정렬 + JWT 인증 + 사용자 데이터 격리. 하네스 첫 풀스택 빌드.
tags: [todo, auth, jwt, crud, postgres, react, cors]
timestamp: 2026-06-19T00:00:00Z
---

## 핵심 결정 (ADR 요약)
- 인증: JWT Bearer 헤더(localStorage 저장) — stateless. 로그아웃은 클라 토큰 폐기 중심(서버 블랙리스트는 범위 외로 단순화).
- 통합 테스트: @SpringBootTest + MockMvc + Testcontainers Postgres — 실제 DB 충실도.
- 레이어 구조(com.todoapp), 사용자별 데이터 격리는 쿼리 레벨에서 강제.

## API 계약 패턴
- /api/auth/{signup,login,logout,me} + /api/todos CRUD. 단일 TodoResponse shape를 공통 정의해 프론트 훅과 정합.
- 4xx는 catch-all 핸들러로 마스킹하지 말 것(프레임워크 4xx 보존).

## Gotcha / 반복 버그
- CORS 403: 백엔드 allowlist가 localhost:5173/3000만 허용 → cloudflared 터널 origin 거부. 목·MockMvc·curl 전부 통과했지만 실제 브라우저에서 깨짐. → curl ≠ 브라우저, 완료 전 실제 브라우저 E2E 필수.
- 타임스탬프 로컬 오프셋 누출 → UTC Z로 직렬화할 것.
- catch-all 예외 핸들러가 프레임워크 4xx를 500으로 마스킹.
- Vite 스캐폴드 기본 index.css가 디자인 토큰과 충돌 — 정리 필요.

## 재사용 포인트
- JWT Bearer + [Testcontainers 실제 Postgres](../patterns/testcontainers-real-db.md) 셋업이 [minesweeper](minesweeper.md)·[shop](shop.md)의 베이스라인.
- [CORS 정석](../patterns/cors-done-right.md): 상대 baseURL + Vite 프록시 + allowlist ([minesweeper](minesweeper.md)에서 회귀0).
- CORS 403 갭의 일반 교훈 → [실제 브라우저 E2E](../patterns/real-browser-e2e.md).
