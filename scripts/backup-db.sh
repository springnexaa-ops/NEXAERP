#!/usr/bin/env bash
# ==============================================================================
# NEXA ERP - Automated SQLite Database Safe Backup Script
# ==============================================================================
set -e

BACKUP_ROOT="${HOME}/nexa_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_ROOT}/erp_backup_${TIMESTAMP}.sqlite"
APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

mkdir -p "$BACKUP_ROOT"

echo "💾 Creating safe transactional SQLite snapshot..."
node -e "
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync('${APP_DIR}/data/erp.sqlite');
db.exec(\"VACUUM INTO '${BACKUP_FILE}';\");
"

# Compress backup to save space
gzip "${BACKUP_FILE}"
echo "✅ Compressed snapshot created: ${BACKUP_FILE}.gz"

# Retention: Purge backups older than 30 days
find "$BACKUP_ROOT" -name "erp_backup_*.sqlite.gz" -mtime +30 -exec rm -f {} \;
echo "🧹 Retained rolling 30 days of database snapshots."
