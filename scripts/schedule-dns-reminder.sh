#!/usr/bin/env bash
# Remind you to paste Squarespace DNS records (GitHub cannot change Squarespace for you).
# Usage:
#   ./scripts/schedule-dns-reminder.sh              # schedule next 1:37 AM local
#   ./scripts/schedule-dns-reminder.sh now          # run reminder immediately
#   ./scripts/schedule-dns-reminder.sh "1:37 AM Oct 30 2026"

set -euo pipefail
MSG="Squarespace DNS for allyskyproject.com: four A records on @ (185.199.108.153–111.153), www CNAME → ally-sky-project.github.io."

run_reminder() {
  if command -v osascript >/dev/null; then
    osascript -e "display notification \"$MSG\" with title \"Ally Sky — DNS cutover\""
  fi
  echo ""
  echo "=== DNS cutover reminder ==="
  echo "$MSG"
  echo ""
}

when="${1:-1:37 AM}"

if [[ "$when" == "now" ]]; then
  run_reminder
  exit 0
fi

if ! command -v at >/dev/null; then
  echo "The 'at' command is not available."
  echo "Apply DNS manually at $when."
  echo "$MSG"
  exit 1
fi

at "$when" <<EOF
export PATH="/usr/bin:/bin:/usr/sbin:/sbin"
osascript -e 'display notification "$MSG" with title "Ally Sky — DNS cutover"' 2>/dev/null || true
printf '%s\n' "=== DNS cutover ===" "$MSG"
EOF

echo "Scheduled DNS reminder for: $when"
at -l 2>/dev/null || true
