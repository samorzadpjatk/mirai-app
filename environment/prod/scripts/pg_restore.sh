#!/bin/sh
# Shell helper used by database restore sidecars to perform pg_restore with common logging and retry semantics.

BACKUP_PATH="${1:-}"
DB_LABEL="${2:-database}"

if [ -z "$BACKUP_PATH" ]; then
  echo "Usage: pg_restore.sh <backup_path> [db_label]" >&2
  exit 1
fi

: "${PGHOST:?PGHOST environment variable is required}"
: "${PGPORT:?PGPORT environment variable is required}"
: "${PGDATABASE:?PGDATABASE environment variable is required}"
: "${PGUSER:?PGUSER environment variable is required}"
: "${PGPASSWORD:?PGPASSWORD environment variable is required}"

if [ ! -f "$BACKUP_PATH" ]; then
  echo "$DB_LABEL backup not found at $BACKUP_PATH; skipping restore."
  exit 0
fi

printf 'Waiting for %s at %s:%s' "$DB_LABEL" "$PGHOST" "$PGPORT"
while ! pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" >/dev/null 2>&1; do
  printf '.'
  sleep 2
done
printf '\n'

echo "Restoring $DB_LABEL database from backup..."
if psql --set ON_ERROR_STOP=on -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$BACKUP_PATH"; then
  echo "$DB_LABEL restore completed."
else
  echo "$DB_LABEL restore failed." >&2
  exit 1
fi
