#!/usr/bin/env bash
# 훅이 **이 기계에서 실제로 도는지** 확인한다.
#
# 왜 필요한가: 훅 명령에 절대 경로가 박혀 커밋된 적이 있다. 다른 기계에서 클론하면 훅이
# 조용히 죽고, 죽은 줄 모른다 — 훅의 실패는 아무 메시지도 내지 않는다. 그래서 설치할 때
# 한 번 재고, 그 측정을 setup.sh 가 단계로 들고 있는다.
#
# 무엇을 재는가: ① settings.json 의 경로가 이식 가능한 형태인가 ② 훅 스크립트가 실제로
# 발동하는가(주입해야 할 입력) ③ 발동하지 **않아야** 할 입력에 조용한가. ③이 없으면
# "항상 주입하는 훅" 도 통과한다.
set -uo pipefail

ROOT="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
SETTINGS="${HOOK_SETTINGS:-$ROOT/.claude/settings.json}"
HOOK_DIR="${HOOK_DIR:-$ROOT/.claude/hooks}"
FAILURES=0

pass() { printf '  ok: %s\n' "$1"; }
fail() { printf '  FAIL: %s\n' "$1" >&2; FAILURES=$((FAILURES + 1)); }

# --- ① 설정의 경로가 이식 가능한가 ---------------------------------------
check_settings() {
    [ -f "$SETTINGS" ] || { fail "settings.json 이 없다: $SETTINGS"; return; }

    if ! /usr/bin/python3 -c "import json,sys; json.load(open(sys.argv[1]))" "$SETTINGS" 2>/dev/null; then
        fail "settings.json 이 JSON 으로 파싱되지 않는다 — 이 파일이 깨지면 그 안의 모든 설정이 조용히 무효가 된다"
        return
    fi

    # 홈 디렉터리 절대 경로는 다른 기계에서 죽는다.
    if grep -qE '"command": *"[^"]*(/Users/|/home/)' "$SETTINGS"; then
        fail "훅 명령에 홈 절대 경로가 박혀 있다 — \"\${CLAUDE_PROJECT_DIR:-.}\"/ 로 바꿔라"
    else
        pass "훅 명령이 이식 가능한 경로를 쓴다"
    fi

    local missing=0 ev
    for ev in SessionStart UserPromptSubmit; do
        /usr/bin/python3 - "$SETTINGS" "$ev" <<'PY' || missing=1
import json, sys
d = json.load(open(sys.argv[1]))
blocks = d.get('hooks', {}).get(sys.argv[2], [])
cmds = [h.get('command', '') for b in blocks for h in b.get('hooks', [])]
sys.exit(0 if cmds else 1)
PY
        [ "$missing" = 0 ] || { fail "$ev 훅이 설정에 없다"; missing=0; }
    done
    pass "SessionStart·UserPromptSubmit 훅이 등록되어 있다"
}

# --- ② ③ 스크립트가 양방향으로 맞게 도는가 -------------------------------
# $1 스크립트, $2 이벤트명, $3 주입되어야 할 프롬프트, $4 조용해야 할 프롬프트
check_prompt_hook() {
    local script="$HOOK_DIR/$1" event="$2" hit="$3" miss="$4" out

    [ -x "$script" ] || { fail "$1 이 없거나 실행 권한이 없다"; return; }

    out="$(printf '{"prompt":%s}' "$(/usr/bin/python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$hit")" \
          | bash "$script" 2>/dev/null)"
    if printf '%s' "$out" | /usr/bin/python3 -c "
import json,sys
d = json.load(sys.stdin)
assert d['hookSpecificOutput']['hookEventName'] == '$event'
assert d['hookSpecificOutput']['additionalContext'].strip()
" 2>/dev/null; then
        pass "$1 — \"$hit\" 에 주입한다"
    else
        fail "$1 — \"$hit\" 에 주입하지 않는다(또는 출력이 훅 형식이 아니다)"
    fi

    out="$(printf '{"prompt":%s}' "$(/usr/bin/python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$miss")" \
          | bash "$script" 2>/dev/null)"
    if [ -z "$out" ]; then
        pass "$1 — \"$miss\" 에는 조용하다"
    else
        fail "$1 — \"$miss\" 에도 주입한다(항상 주입하는 훅은 컨텍스트만 먹는다)"
    fi

    # 깨진 입력이 프롬프트를 막아서는 안 된다.
    if echo 'not json' | bash "$script" >/dev/null 2>&1; then
        pass "$1 — 깨진 입력에도 프롬프트를 막지 않는다"
    else
        fail "$1 — 깨진 입력에 0 이 아닌 코드로 끝난다(프롬프트가 막힐 수 있다)"
    fi
}

# --- 자체 검사: 깨진 설정을 심어 보고 잡는지 본다 -------------------------
SELF_TEST_DIR=""
cleanup() { [ -n "$SELF_TEST_DIR" ] && rm -rf "$SELF_TEST_DIR"; SELF_TEST_DIR=""; }
trap cleanup EXIT INT TERM

run_self_test() {
    SELF_TEST_DIR="$(mktemp -d)"
    local caught=0 broken="$SELF_TEST_DIR/settings.json"

    # ① 홈 절대 경로를 심는다 → 잡아야 한다
    cat > "$broken" <<'JSON'
{ "hooks": { "SessionStart": [ { "hooks": [ { "type": "command",
  "command": "bash /Users/someone/repo/.claude/hooks/x.sh" } ] } ],
  "UserPromptSubmit": [ { "hooks": [ { "type": "command", "command": "bash ok.sh" } ] } ] } }
JSON
    HOOK_SETTINGS="$broken" bash "$0" >/dev/null 2>&1 || caught=$((caught + 1))

    # ② 깨진 JSON 을 심는다 → 잡아야 한다
    printf '{ "hooks": ' > "$broken"
    HOOK_SETTINGS="$broken" bash "$0" >/dev/null 2>&1 || caught=$((caught + 1))

    # ③ **무엇에나 주입하는** 훅을 심는다 → 잡아야 한다.
    #    이 케이스가 없으면 "항상 주입" 도 통과하고, 그런 훅은 매 턴 컨텍스트를 먹는다.
    cat > "$SELF_TEST_DIR/always.sh" <<'ALWAYS'
#!/usr/bin/env bash
echo '{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"x"}}'
ALWAYS
    chmod +x "$SELF_TEST_DIR/always.sh"
    HOOK_DIR="$SELF_TEST_DIR" bash "$0" --only-prompt-hook always.sh >/dev/null 2>&1 \
        || caught=$((caught + 1))

    # ④ 반대 방향: 아무것도 주입하지 않는 훅도 잡아야 한다(죽은 훅).
    cat > "$SELF_TEST_DIR/never.sh" <<'NEVER'
#!/usr/bin/env bash
exit 0
NEVER
    chmod +x "$SELF_TEST_DIR/never.sh"
    HOOK_DIR="$SELF_TEST_DIR" bash "$0" --only-prompt-hook never.sh >/dev/null 2>&1 \
        || caught=$((caught + 1))

    if [ "$caught" -eq 4 ]; then
        pass "verify-hooks --self-test (절대 경로·깨진 JSON·항상 주입·죽은 훅을 실제로 잡는다)"
        return 0
    fi
    fail "자체 검사 — 심은 넷 중 $caught 개만 잡았다"
    return 1
}

main() {
    case "${1:-}" in
      --only-prompt-hook)   # 자체 검사가 쓰는 비공개 경로
        check_prompt_hook "${2:?}" UserPromptSubmit "만들어줘" "이 오타 고쳐줘"
        [ "$FAILURES" -eq 0 ]; exit $?
        ;;
    esac

    check_settings
    check_prompt_hook harness-trigger.sh UserPromptSubmit \
        "할 일 관리 웹앱 만들어줘" "이 오타 하나 고쳐줘"

    if [ "${1:-}" = "--self-test" ]; then
        run_self_test || FAILURES=$((FAILURES + 1))
    fi

    [ "$FAILURES" -eq 0 ] || { printf '훅 검증 실패 (%d건)\n' "$FAILURES" >&2; exit 1; }
}

main "$@"
