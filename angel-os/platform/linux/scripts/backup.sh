#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=${ANGEL_ENV_FILE:-/etc/angel-os/angel-os.env}
BACKUP_DIR=${ANGEL_BACKUP_DIR:-$HOME/.local/share/angel-os/backups}
KEEP_DAYS=${ANGEL_BACKUP_KEEP_DAYS:-14}

set -a
source "$ENV_FILE"
set +a

mkdir -p "$BACKUP_DIR"
stamp=$(date -u +%Y%m%dT%H%M%SZ)
out="$BACKUP_DIR/postgres-$stamp.sql.gz"

podman exec angel-postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists | gzip -9 > "$out"
sha256sum "$out" > "$out.sha256"
find "$BACKUP_DIR" -type f -mtime +"$KEEP_DAYS" -delete
printf 'Angel OS backup created: %s\n' "$out"
