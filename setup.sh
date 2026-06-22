#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

WITH_PLUGINS=0; INGEST=0
for a in "$@"; do
  case "$a" in
    --with-plugins) WITH_PLUGINS=1 ;;
    --ingest) INGEST=1 ;;
    -h|--help) echo "usage: ./setup.sh [--with-plugins] [--ingest]"; exit 0 ;;
    *) echo "unknown flag: $a"; exit 2 ;;
  esac
done

echo "==> 1/5 의존성 체크"
command -v node >/dev/null || { echo "  node 필요(필수)"; exit 1; }
command -v git  >/dev/null || { echo "  git 필요(필수)"; exit 1; }
command -v rg   >/dev/null || echo "  rg 없음 — JS 폴백 검색 사용"
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

echo "==> 2/5 프로젝트 clone + git-exclude"
node "$ROOT/scripts/clone-projects.mjs"

if [ "$INGEST" = 1 ]; then
  echo "==> (opt) 카드 없는 프로젝트 ingest"
  if [ "$HAS_CLAUDE" = 1 ]; then node "$ROOT/scripts/ingest-missing.mjs"; else echo "  claude 없음 — 건너뜀"; fi
fi

echo "==> 3/5 색인 생성"
node "$ROOT/knowledge/generate.mjs"

echo "==> 4/5 테스트"
node --test "knowledge/test/**/*.test.mjs" "scripts/test/**/*.test.mjs"

echo "==> 5/5 완료"
cat <<'EOF'
  웹앱:   node knowledge/web/server.mjs   (기본 http://localhost:4178)
  하네스: Claude Code에서 "이거 만들어줘" → build-project
  옵션:   ./setup.sh --with-plugins   권장 플러그인(harness, superpowers)
          ./setup.sh --ingest          카드 없는 외부 프로젝트 카드 생성
EOF
