---
type: Project Knowledge Card
project: minesweeper
title: 서버 권위 지뢰찾기
status: DONE
stack: [Kotlin/Spring Boot/PostgreSQL(5433)/Gradle, React/TS/Vite/pnpm, JWT(jjwt) denylist]
summary: 서버 권위 게임 로직(지뢰배치·플러드필·시간)·난이도별 베스트·전체 리더보드·anti-cheat. 데스크톱+모바일 적응형 입력.
tags: [game, server-authoritative, anti-cheat, leaderboard, jwt, mobile, touch, cors]
timestamp: 2026-06-19T00:00:00Z
---

## 핵심 결정 (ADR 요약)
- 서버 권위: 게임 상태·elapsedSeconds를 서버가 계산(READY=0, 진행 중=floor(now-startedAt), 종료=최종값). 클라는 표시만.
- anti-cheat: 진행 중 GameStateResponse.cells는 항상 전체(row-major)지만 미오픈 셀의 mine 여부는 비노출 — 라이브 E2E 바이트레벨로 실증(진행 중 mine 노출 0).
- 로그아웃: JWT jti denylist로 서버측 진짜 무효화(REQ-003 "이후 보호 API 거부" 보장). 쿠키 대신 Bearer로 CORS/CSRF 단순화.
- reveal no-op(이미 열림/깃발/종료 게임) → 200 + 상태 불변.

## API 계약 패턴
- /api/games(POST 새 게임) · /current · /{gameId} · /{gameId}/reveal. 공통 GameStateResponse.
- 계약 단일 소스 = 백엔드 §3 파일, 소유자 = 백엔드 시니어(프론트는 제안만). 양쪽 동시 편집/상호 양보 금지.

## Gotcha / 반복 버그
- 계약 협상 교착: 두 시니어 상호 양보로 leaderboard 래핑/best 경로가 2회 교차(swap), stale 문서 재읽기로 리더 결정조차 뒤집힘 → 백엔드 파일에 동결해서야 종료.
- UI 완전 미스타일: 컴포넌트 CSS(.board/.cell/.btn 등) 부재로 브라우저 기본 폼 렌더. 145 테스트+build+행위 E2E 전부 그린이었지만 시각 미검증 → 완료 전 02_design 화면별 스크린샷 대조 필수.
- Docker 데몬 DOWN을 통합 단계에서 블로커로 만남 → 팀 빌드 전 런타임 프리플라이트(Docker·포트·툴 버전).
- dev Postgres 포트 5433(5432는 타 서비스 점유).

## 재사용 포인트
- [CORS 정석](../patterns/cors-done-right.md)이 여기서 회귀0으로 검증됨 — [todo](todo.md) 회고가 실제로 작동.
- 서버 권위 + [Clock 주입 결정적 테스트](../patterns/clock-injection-deterministic-time.md)(타이밍 의존 없이 검증).
- 계약 교착은 [계약 단일 소스 + 리더 동결](../patterns/contract-single-source-freeze.md)로 종결.
- 전 게이트 그린인데 미스타일 → [실제 브라우저 E2E + 시각 충실도](../patterns/real-browser-e2e.md)의 두 번째 사각지대 사례.
- 통합 테스트는 [Testcontainers 실제 Postgres](../patterns/testcontainers-real-db.md) — Docker·포트(5433) 프리플라이트 필요.
