#!/usr/bin/env bash
# SessionStart: 미완인 빌드가 있으면 새 세션에 재개 지시를 주입한다.
#
# 왜 훅인가: 세션 안의 cron 은 한도로 **멈춘** 세션은 살리지만 **죽은** 세션은 못 살린다.
# 훅은 디스크에 있어서 다음 세션이 무엇이 미완인지 스스로 알게 한다.
#
# 조용해야 한다. 미완이 없으면 아무것도 출력하지 않는다 — 매 세션 잔소리하는 훅은
# 꺼지고, 꺼진 훅은 없는 훅보다 나쁘다(있다고 믿기 때문에).
set -uo pipefail

RESUME_FILE="/Users/skull/Documents/repo/code-navigator-mac/_workspace/RESUME_DEBUGGER.md"

# 없으면 할 일이 없다.
[ -f "$RESUME_FILE" ] || exit 0

# `상태: 완료` 면 끝난 것이다. 완료 마커까지 함께 보는 이유는 상태 줄만 고치고
# 인증 문서를 안 쓰는 경우를 걸러내기 위해서다.
if grep -q '^\*\*상태: 완료' "$RESUME_FILE"; then
    exit 0
fi

# jq 가 없을 수 있으니 JSON 을 직접 만든다. 본문은 파일 경로만 넘긴다 —
# 전문을 실으면 매 세션 컨텍스트를 먹고, 그러면 사람이 훅을 끈다.
cat <<'JSON'
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "미완인 빌드가 있다: code-navigator-mac 의 JDWP 디버거(증분 4). 재개 런북은 `/Users/skull/Documents/repo/code-navigator-mac/_workspace/RESUME_DEBUGGER.md` 다. 이어받기 전에 그 파일을 읽고, 거기 적힌 대로 문서가 아니라 실행(`swift test --no-parallel`, `./_workspace/gate.sh`)으로 현재 상태를 확인하라. 사용자가 다른 일을 요청하면 그 일을 먼저 하고 이건 언급만 하라 — 자동으로 착수하지 마라."
  }
}
JSON
