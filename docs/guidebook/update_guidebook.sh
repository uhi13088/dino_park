#!/bin/sh
set -eu
guidebook_runtime="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3"
if [ ! -x "$guidebook_runtime" ]; then
  echo 'Codex 문서용 Python 런타임 경로를 확인해 주세요. 패키지는 자동 설치하지 않습니다.' >&2
  exit 1
fi
guidebook_root=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
cd "$guidebook_root"
exec "$guidebook_runtime" docs/guidebook/build_guidebook.py "$@"
