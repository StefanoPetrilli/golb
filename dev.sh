#!/usr/bin/env bash
set -euo pipefail

PORT=4000
LIVERELOAD_PORT=35729

echo "Starting Jekyll with live reload on http://localhost:${PORT} ..."

docker compose up --build &
trap 'docker compose down' EXIT

sleep 3

if command -v xdg-open &>/dev/null; then
  xdg-open "http://localhost:${PORT}"
elif command -v open &>/dev/null; then
  open "http://localhost:${PORT}"
fi

wait
