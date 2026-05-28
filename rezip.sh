#!/bin/bash
# Rezip the Pit Limiter mod for BeamNG.drive
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

rm -f pit_limiter_mod.zip
zip -r pit_limiter_mod.zip ui settings resources lua info.json thumbnail.png

echo "Done: pit_limiter_mod.zip"
