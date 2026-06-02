#!/usr/bin/env bash
# Copies the Claude Code conversation logs for this project into ./ai-logs/
# so they can be committed for the challenge submission.
#
# IMPORTANT: it also REDACTS anything that looks like an API key / token, so
# secrets pasted into the chat never end up in the public repo.
#
# Usage: bash scripts/sync-ai-logs.sh
set -euo pipefail

SRC="$HOME/.claude/projects/-Users-honey-AI-Calorie-Tracker"
DEST="$(cd "$(dirname "$0")/.." && pwd)/ai-logs"

mkdir -p "$DEST"

if [ ! -d "$SRC" ]; then
  echo "No Claude logs found at $SRC" >&2
  exit 1
fi

# Copy conversation transcripts (.jsonl) and any rendered markdown (.md)
find "$SRC" -maxdepth 1 -type f \( -name '*.jsonl' -o -name '*.md' \) -exec cp {} "$DEST/" \;

# Redact common secret formats in the copied files (in place, NUL-safe for spaced paths).
find "$DEST" -maxdepth 1 -type f \( -name '*.jsonl' -o -name '*.md' \) -exec perl -0pi -e '
    s/AIza[0-9A-Za-z_\-]{20,}/[REDACTED_API_KEY]/g;
    s/\bAQ\.[0-9A-Za-z_\-]{20,}/[REDACTED_API_KEY]/g;
    s/ya29\.[0-9A-Za-z_\-]{20,}/[REDACTED_TOKEN]/g;
    s/\bsk-[A-Za-z0-9_\-]{20,}/[REDACTED_API_KEY]/g;
    s/\bnvapi-[A-Za-z0-9_\-]{20,}/[REDACTED_API_KEY]/g;
    s/\bgh[pousr]_[A-Za-z0-9]{20,}/[REDACTED_TOKEN]/g;
    s/\bAKIA[0-9A-Z]{16}\b/[REDACTED_AWS_KEY]/g;
  ' {} +

echo "Synced + redacted AI logs from: $SRC"
ls -1 "$DEST"
