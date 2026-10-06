#!/usr/bin/env bash
set -euo pipefail
SRC_DIR="$HOME/IA"
DEST_ROOT="/sdcard/IA-backup"
FECHA=$(date +"%Y-%m-%d_%H-%M-%S")
DEST_DIR="$DEST_ROOT/$FECHA"
echo "🤖 COPILOT BF x3 - Backup IA"
echo "Origen: $SRC_DIR"
echo "Destino: $DEST_DIR"
mkdir -p "$DEST_DIR"
rsync -av --progress --exclude='node_modules' --exclude='.git' --exclude='.env' "$SRC_DIR/" "$DEST_DIR/"
echo "✅ Backup completado: $DEST_DIR"
ls -lh "$DEST_ROOT" | tail -n 5
