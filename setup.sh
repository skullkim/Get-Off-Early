#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

WITH_PLUGINS=0; INGEST=0; SELF_TEST=0
for a in "$@"; do
  case "$a" in
    --with-plugins) WITH_PLUGINS=1 ;;
    --ingest) INGEST=1 ;;
    --self-test) SELF_TEST=1 ;;
    -h|--help) echo "usage: ./setup.sh [--with-plugins] [--ingest] [--self-test]"; exit 0 ;;
    *) echo "unknown flag: $a"; exit 2 ;;
  esac
done

echo "==> 1/6 의존성 체크"
command -v node >/dev/null || { echo "  node 필요(필수)"; exit 1; }
command -v git  >/dev/null || { echo "  git 필요(필수)"; exit 1; }
# **소비 주체와 같은 방식으로 잰다.** `command -v rg` 는 셸 함수·별칭에도 반응해서,
# Node 가 spawn 할 때 ENOENT 로 터지는 것을 통과시킨다(이 레포가 한 번 겪었다 —
# knowledge/patterns/preflight-measure-as-consumer.md). knowledge/ 는 rg 를 Node 에서
# spawn 하므로 Node 로 재야 한다.
if node -e 'const r=require("node:child_process").spawnSync("rg",["--version"]);process.exit(r.error?1:0)' 2>/dev/null; then
  :
else
  echo "  rg 를 Node 가 spawn 할 수 없음 — JS 폴백 검색 사용 (셸에서 rg 가 보여도 바이너리가 아닐 수 있다)"
fi
HAS_CLAUDE=0; if command -v claude >/dev/null; then HAS_CLAUDE=1; else echo "  claude 없음 — 채팅·ingest 비활성(나머지 정상)"; fi

if [ "$WITH_PLUGINS" = 1 ]; then
  echo "==> (opt) 권장 플러그인 설치"
  if [ "$HAS_CLAUDE" = 1 ]; then
    claude plugin marketplace add anthropics/claude-plugins-official || true
    claude plugin marketplace add revfactory/harness || true
    claude plugin install superpowers@claude-plugins-official || true
    claude plugin install harness@harness-marketplace || true
  else
    echo "  claude 없음 — 건너뜀"
  fi
fi

echo "==> 2/6 프로젝트 clone + git-exclude"
node "$ROOT/scripts/clone-projects.mjs"

if [ "$INGEST" = 1 ]; then
  echo "==> (opt) 카드 없는 프로젝트 ingest"
  if [ "$HAS_CLAUDE" = 1 ]; then node "$ROOT/scripts/ingest-missing.mjs"; else echo "  claude 없음 — 건너뜀"; fi
fi

echo "==> 3/6 색인 생성"
node "$ROOT/knowledge/generate.mjs"

echo "==> 4/6 테스트"
node --test "knowledge/test/**/*.test.mjs" "scripts/test/**/*.test.mjs"

if [ "$SELF_TEST" = 1 ]; then
  echo "==> (self-test) 훅 검사기가 실제로 깨진 것을 잡는가"
  bash "$ROOT/.claude/hooks/verify-hooks.sh" --self-test
fi

echo "==> 5/6 Claude Code 훅 검증"
bash "$ROOT/.claude/hooks/verify-hooks.sh"

echo "==> 6/6 완료"
cat <<'EOF'
  웹앱:   node knowledge/web/server.mjs   (기본 http://localhost:4178)
  하네스: Claude Code에서 "이거 만들어줘" → build-project
  옵션:   ./setup.sh --with-plugins   권장 플러그인(harness, superpowers)
          ./setup.sh --ingest          카드 없는 외부 프로젝트 카드 생성
          ./setup.sh --self-test       훅 검사기가 깨진 설정을 잡는지 확인

  훅:     트리거 훅은 다음 프롬프트부터 적용된다(재시작 불필요).
          재개 훅이 레포 밖 _workspace 도 보게 하려면:
            .claude/hooks/watch-workspaces.local 에 경로를 한 줄씩 적는다(기계별, git 제외)

  ⚠ 에이전트 권한(tools)은 **새 세션에서만** 반영된다. 설치 후 한 번 재시작하고
    .claude/harness-runtime.md 의 재측정 절차를 돌려 도구 목록을 확인하라.
EOF
