#!/usr/bin/env bash
# 인스타 게시물·하이라이트 커버 PNG 를 만든다.
# 먼저 `pnpm dev` 를 띄우고 실행한다: scripts/insta/render.sh [개발 서버 주소] [출력 폴더]
set -euo pipefail
cd "$(dirname "$0")/../.."
URL="${1:-http://localhost:5173}/scripts/insta/insta.html"
OUT="${2:-insta-out}"
CHROME="${CHROME:-$(ls -d ~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-*/chrome-headless-shell | tail -1)}"
mkdir -p "$OUT"
shot() { "$CHROME" --headless --hide-scrollbars --virtual-time-budget=10000 --window-size="$1" --screenshot="$OUT/$2.png" "$URL?s=$2" >/dev/null 2>&1; }
for s in cover-start cover-hall cover-patch cover-career; do shot 1080,1920 "$s"; done
for s in p1-{1..5} p2-{1..4} p3-{1..5}; do shot 1080,1350 "$s"; done
echo "$OUT 에 생성"
