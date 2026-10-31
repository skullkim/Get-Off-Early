#!/usr/bin/env bash
# 하네스 트리거를 **매 프롬프트마다** 모델 앞에 놓는다.
#
# 왜 훅인가: `CLAUDE.md` 의 트리거 문장은 세션당 한 번 읽히는 정적 텍스트다. 대화가 길어지면
# 뒤로 밀리고, 사용자가 "이거 만들어줘"라고 했을 때 build-project 가 안 뜨는 일이 생긴다.
# 자동 동작은 판단이 아니라 훅이 일으켜야 한다.
#
# 무엇을 하지 않는가: **강제하지 않는다.** 주입하는 텍스트에 예외("단발 질문·한 줄 수정은
# 직접 응답")를 함께 담아, 모델이 규칙을 눈앞에 두고 판정하게 한다. 기억에 의존하지 않는 것이
# 목적이고, 판단을 없애는 것이 목적이 아니다.
set -uo pipefail

exec /usr/bin/python3 -c '
import json, sys, re

try:
    payload = json.load(sys.stdin)
except Exception:
    sys.exit(0)                      # 입력이 이상하면 조용히 통과 — 프롬프트를 막지 않는다
prompt = (payload.get("prompt") or "")

# 빌드/후속 작업 신호. 짧은 질문에 반응하지 않도록 동사형으로 좁혔다.
BUILD = re.compile(
    r"만들어|개발해|구현해|구축해|요구사항|스펙\s*작성|팀으로|프로젝트\s*시작"
    r"|기능\s*추가|보완해|다시\s*실행|재실행|QA\s*다시|버그\s*고쳐|회고"
    r"|build (it|this|me)|implement|requirements"
)
if not BUILD.search(prompt):
    sys.exit(0)

context = """[하네스 트리거 — UserPromptSubmit 훅이 주입]
이 요청이 **프로젝트·앱·기능을 만들거나 요구사항을 구현하는 일**이거나 그 **후속 작업**
(다시 실행·수정·보완·기능 추가·QA 다시·버그 고쳐)이면, 답하기 전에 `build-project` 스킬을
Skill 도구로 호출하고 그 절차를 따른다. 회고·하네스 개선 요청이면 `retrospective` 다.

예외: 단발 질문이나 한 줄 수정은 스킬 없이 직접 답한다. 어느 쪽인지 애매하면 스킬 설명의
"언제" 절과 해당 스킬의 `eval.md` 경계 사례로 가른다.

도구 이름을 추측하지 않는다 — 역할→도구 매핑은 `.claude/harness-runtime.md` 가 단일 소스이고,
런타임이 바뀌었으면 그 파일의 재측정 절차를 먼저 돌린다."""

print(json.dumps({
    "hookSpecificOutput": {
        "hookEventName": "UserPromptSubmit",
        "additionalContext": context,
    }
}, ensure_ascii=False))
'
