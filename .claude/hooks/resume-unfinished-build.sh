#!/usr/bin/env bash
# SessionStart: 미완인 작업이 있으면 새 세션에 재개 지시를 주입한다.
#
# 왜 훅인가: 세션 안의 cron 은 한도로 **멈춘** 세션은 살리지만 **죽은** 세션은 못 살린다.
# 훅은 디스크에 있어서 다음 세션이 무엇이 미완인지 스스로 알게 한다.
#
# 조용해야 한다. 미완이 없으면 아무것도 출력하지 않는다 — 매 세션 잔소리하는 훅은
# 꺼지고, 꺼진 훅은 없는 훅보다 나쁘다(있다고 믿기 때문에).
#
# 파일 하나를 박아 두지 않고 `RESUME_*.md` 를 훑는다. 한 파일에 묶어 두었더니 그 작업이
# 끝난 뒤 다음 작업에 훅을 다시 이어 붙여야 했다 — 그 한 번을 잊으면 재개가 조용히 사라진다.
set -uo pipefail

# **절대 경로를 박지 않는다.** 박아 두면 다른 기계에서 클론한 순간 조용히 죽는다(실제로
# 이 훅이 한 사용자의 홈 경로를 담고 커밋돼 있었다).
#
# 볼 자리는 세 곳에서 유도한다:
#   1) 하네스 자신의 `_workspace`
#   2) `<하네스>/<프로젝트>/_workspace` — setup.sh 가 외부 프로젝트를 레포 안에 클론한다
#   3) `.claude/hooks/watch-workspaces.local` — 형제 디렉터리처럼 규약 밖에 있는 자리.
#      한 줄에 하나, `#` 주석 허용. 기계별이므로 git 에서 제외한다.
ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
EXTRA_LIST="$ROOT/.claude/hooks/watch-workspaces.local"

workspaces=()
[ -d "$ROOT/_workspace" ] && workspaces+=("$ROOT/_workspace")
for d in "$ROOT"/*/_workspace; do
    [ -d "$d" ] && workspaces+=("$d")
done
if [ -f "$EXTRA_LIST" ]; then
    while IFS= read -r line; do
        case "$line" in ''|\#*) continue ;; esac
        # `~` 와 상대 경로를 허용한다.
        line="${line/#\~/$HOME}"
        case "$line" in /*) ;; *) line="$ROOT/$line" ;; esac
        [ -d "$line" ] && workspaces+=("$line")
    done < "$EXTRA_LIST"
fi

[ "${#workspaces[@]}" -gt 0 ] || exit 0

unfinished=""
for workspace in "${workspaces[@]}"; do
    for runbook in "$workspace"/RESUME_*.md; do
        [ -f "$runbook" ] || continue
        # `상태: 완료` 면 끝난 것이다.
        grep -q '^\*\*상태: 완료' "$runbook" && continue
        unfinished="$unfinished\`$runbook\` "
    done
done

[ -n "$unfinished" ] || exit 0

# jq 가 없을 수 있으니 JSON 을 직접 만든다. 본문은 경로만 넘긴다 — 전문을 실으면 매 세션
# 컨텍스트를 먹고, 그러면 사람이 훅을 끈다.
cat <<JSON
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "미완인 작업이 있다: ${unfinished}. 이어받기 전에 그 런북을 읽고, 거기 적힌 대로 문서가 아니라 실행(\`swift test --no-parallel\`, \`./_workspace/gate.sh\`)으로 현재 상태를 확인하라. 사용자가 다른 일을 요청하면 그 일을 먼저 하고 이건 언급만 하라 — 자동으로 착수하지 마라."
  }
}
JSON
