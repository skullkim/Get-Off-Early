---
type: Reusable Pattern
title: CORS 정석 — 상대 baseURL + dev 프록시 + allowlist
tags: [cors, frontend, backend, deployment, preflight]
timestamp: 2026-06-19T00:00:00Z
domain: [backend, frontend]
sources: [todo, minesweeper]
---

# 문제
브라우저 프론트 + 별도 백엔드 구성에서 CORS/프리플라이트는 목(MSW)·MockMvc·curl을 **전부 통과해도** 실제 브라우저에서 403으로 깨진다. allowlist를 `localhost:5173/3000`만으로 박으면 터널·배포 origin이 거부된다.

# 정석
- 프론트는 **상대 baseURL**(`/api/...`)을 쓰고, dev는 **Vite 프록시**가 백엔드로 전달(브라우저는 동일 출처로 인식 → CORS 자체가 발생 안 함).
- 백엔드 CORS allowlist는 **실제 도달 경로의 origin**(로컬·터널·배포 도메인)을 모두 포함하도록 설계.
- Bearer 토큰(헤더) 사용 시 쿠키 대비 CORS/CSRF 복잡도가 없다.

# 검증
- **완료 선언 전 실제 브라우저↔실제 백엔드 1회 E2E 스모크** 필수 — curl은 Origin/프리플라이트를 안 보낸다. ([실제 브라우저 E2E](real-browser-e2e.md))

# 적용 사례 (일반화)
- allowlist를 localhost-only로 박은 빌드에서 터널 origin 403 — 회귀로 학습한 원본 사례.
- 후속 빌드에서 처음부터 이 패턴을 적용 → 프리플라이트 200·ACAO 확인, CORS 403 회귀 0.

> 출처 프로젝트는 frontmatter `sources` 참조 (`knowledge/cards/<프로젝트>.md`).
