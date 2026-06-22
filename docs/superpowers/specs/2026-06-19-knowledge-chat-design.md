# 지식 베이스 채팅 (Knowledge Chat) — 설계

- 날짜: 2026-06-19
- 상태: 설계 승인 대기
- 위치: `knowledge/web/chat.mjs` + `server.mjs`(`/api/chat`) + 프론트 채팅 패널

## 1. 목적

사람용 지식 사이트에서 **문서 내용을 자연어로 질문하면 답하는 채팅**. 리프레시 전까지 같은 대화를 이어간다(이 세션처럼).

## 2. 백엔드 결정 (검증 완료)

별도 API 키 없이 **기존 Claude Code CLI(`claude -p`) 재사용** — 구독 auth 사용, 의존성 0(SDK 없이 `child_process.spawn`).

실측(`claude --version` 2.1.181)으로 확인한 사실:
- `claude -p <msg> --output-format json` → `{ result, session_id, total_cost_usd, ... }`.
- `--system-prompt`(override)로 기본 프리앰블 제거 → 입력 8574→10 토큰.
- `--model <id>` 로 모델 선택. **기본 `claude-sonnet-4-6`**(에이전트형 기술 문서 검색의 균형; 1M 컨텍스트). haiku 측정치 ~4–6초·sonnet은 다소 느림.
- `--allowedTools "Read Grep Glob"` → 헤드리스에서 **권한 멈춤 없이** 파일 읽고 답함(`permission_denials: []`).
- `--resume <session_id>` → 대화 지속(같은 세션 유지).

**비용 모델**: 구독 auth로 동작 → **달러 청구 없음**(`total_cost_usd`는 API 환산 추정치일 뿐). 대신 매 호출이 **구독 사용량 할당량**(Claude Code와 같은 풀, rate limit/주간 한도)을 소모하며, 무거운 모델일수록 빨리 태운다. 채팅은 보조 기능이므로 빌드 예산을 지키려 sonnet 기본. `CHAT_MODEL` env로 교체(haiku=할당량 절약, opus=최고 품질).

## 3. 컨텍스트 범위 (결정: 큐레이션 + read-only 파일 툴)

- **system prompt**(첫 턴): Q&A 지침 + 오리엔테이션(파일 지도) + **INDEX.md 전문 임베드**(작고 가장 유용한 개요 → 대부분 질문을 툴 라운드트립 없이 답). cards/patterns/원본 artifact는 **Read/Grep/Glob로 온디맨드** 드릴다운.
- 오리엔테이션 지도: `knowledge/INDEX.md`(색인), `knowledge/cards/*.md`(프로젝트 카드), `knowledge/patterns/*.md`(재사용 패턴), `<project>/_workspace/*.md`(원본 산출물), `<project>/backend|frontend`(코드).
- 읽기 전용·수정 금지를 지침에 명시. `--disallowedTools "Bash Edit Write WebFetch WebSearch Task"`.

## 4. 대화 지속

- 프론트가 `sessionId` + `messages[]`를 **메모리(JS state)** 에 보관.
- 첫 턴: sessionId 없음 → `--system-prompt`로 지식 주입, 응답의 `session_id` 저장.
- 이후 턴: `--resume <sessionId>`(시스템 프롬프트 재주입 안 함 — 세션 보유).
- 리프레시 = state 소멸 = 새 대화. (요청한 동작 그대로)

## 5. 노출 안전장치 (결정: 선택적 CHAT_TOKEN)

- 터널 노출 위험의 본질은 **달러 청구가 아니라 구독 할당량 소진**(누군가 호출 → 사용자 머신의 claude가 사용자 구독 할당량을 태움 → Claude Code 일시 사용 한도 도달). 이래서 토큰 게이트가 의미 있음.
- `process.env.CHAT_TOKEN` 설정 시 `/api/chat`은 헤더 `x-chat-token` 일치를 요구(불일치 → 401). 미설정 시 제한 없음(로컬 개발 편의).
- 툴은 read-only(파일 수정·Bash·웹 불가). 잔여 위험: Read는 cwd 밖 절대경로도 읽을 수 있음 → CHAT_TOKEN으로 신뢰 사용자에 한정 + 지침으로 프로젝트 범위 권고(개인 도구 수준 수용).

## 6. 단위 경계

| 단위 | 한 일 | 인터페이스 | 의존 |
|---|---|---|---|
| `chat.mjs: buildSystemPrompt(root)` | 지식→시스템 프롬프트 문자열 | `(root) → string` | fs 읽기(INDEX.md) |
| `chat.mjs: buildChatArgs({message,sessionId,model,systemPrompt})` | argv 배열 생성(순수) | `→ string[]` | 없음 |
| `chat.mjs: chat({message,sessionId,root,model})` | claude spawn 실행 | `→ {answer, sessionId}` | child_process, 위 둘 |
| `server.mjs: POST /api/chat` | 본문 파싱·토큰 검사·chat 호출 | HTTP | chat.mjs |
| 프론트 채팅 패널 | 메시지·입력·sessionId 보관 | `/api/chat` fetch | 서버 |

## 7. 데이터 흐름

```
클라 POST /api/chat { message, sessionId? }  (헤더 x-chat-token?)
  → 서버: CHAT_TOKEN 설정 & 헤더 불일치 → 401
  → chat({message, sessionId, root, model=env.CHAT_MODEL||'claude-sonnet-4-6'})
      args = buildChatArgs(...)  // 첫턴: --system-prompt; resume: --resume
      spawn('claude', args, { cwd: root, env: 정리된 env })  // CLAUDECODE 등 제거
      stdout JSON 파싱 → { answer: result, sessionId: session_id }
  → 200 { answer, sessionId }  // 클라가 sessionId 저장, 메시지 목록에 추가
```

## 8. 에러 처리

- spawn 비정상 종료 / JSON 파싱 실패 / 타임아웃(기본 90s, 초과 시 프로세스 kill) → 서버 500 `{ error }`, 클라는 "응답 실패" 안내.
- `claude` 바이너리 없음 → 500 `{ error: "claude CLI를 찾을 수 없음" }`.
- 응답이 길어 느림(툴 사용 시 10–30초) → 클라는 전송 중 "생각 중…" 표시.

## 9. 프론트 채팅 UI

- 사이드바 상단에 `💬 지식에게 질문` 버튼 → 해시 라우트 `#chat` → `#main`에 채팅 뷰 렌더(파일 뷰와 동일하게 모바일 전체화면).
- 채팅 뷰: 메시지 목록(user/assistant 말풍선) + 하단 입력창 + 전송. `state.chat = { sessionId, messages[] }`(메모리).
- 전송 → "생각 중…" → `POST /api/chat` → assistant 답변 추가 + sessionId 저장. 답변은 마크다운 렌더(marked).
- CHAT_TOKEN 사용 시: 401이면 토큰 입력 프롬프트 → `localStorage.chatToken` 저장 후 재시도.

## 10. 테스트

- `chat.test.mjs`(node:test, spawn 없음):
  - `buildSystemPrompt(root)` → INDEX.md 내용 + 오리엔테이션 포함(프로젝트 id 등장).
  - `buildChatArgs` → 두 변형 모두 `--model`·`--allowedTools "Read Grep Glob"`·`--disallowedTools ...`·`--output-format json` 포함. 첫턴은 `--system-prompt` 있고 `--resume` 없음 / resume는 `--resume <id>` 있고 `--system-prompt` 없음.
- `server.test.mjs`: `CHAT_TOKEN` 설정 시 토큰 없는 `POST /api/chat` → 401(claude spawn 전 조기 반환).
- 실제 spawn(claude 호출)은 비용·시간 때문에 자동 테스트 제외 → **라이브 1회 수동 검증**(curl + 실제 브라우저: 첫 질문, 후속 질문 컨텍스트 유지, 원본 문서 드릴다운).

## 11. 비목표 (YAGNI)

- 스트리밍(stream-json)은 v1 제외(비스트리밍 + "생각 중" 표시). 이후 enhancement.
- 서버측 대화 영속/다중 사용자 세션 저장 없음(메모리·세션ID resume로 충분).
- 임베딩/벡터 검색 없음(툴 기반 온디맨드 retrieval로 충분).
