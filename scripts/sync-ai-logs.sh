#!/usr/bin/env bash
# Copies the Claude Code conversation logs for this project into ./ai-logs/
# so they can be committed for the challenge submission.
# Usage: bash scripts/sync-ai-logs.sh
set -euo pipefail

SRC="$HOME/.claude/projects/-Users-honey-AI-Calorie-Tracker"
DEST="$(cd "$(dirname "$0")/.." && pwd)/ai-logs"

mkdir -p "$DEST"

if [ -d "$SRC" ]; then
  # Copy conversation transcripts (.jsonl) and any rendered markdown (.md)
  find "$SRC" -maxdepth 1 -type f \( -name '*.jsonl' -o -name '*.md' \) -exec cp {} "$DEST/" \;
  echo "Synced AI logs from: $SRC"
  ls -1 "$DEST"
else
  echo "No Claude logs found at $SRC" >&2
  exit 1
fi
