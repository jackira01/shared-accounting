#!/bin/sh
# Script de respaldo para Contabilidad (SQLite / Docker)

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_PATH="./prisma/dev.db"

mkdir -p "$BACKUP_DIR"

if [ -f "$DB_PATH" ]; then
    cp "$DB_PATH" "$BACKUP_DIR/dev_$TIMESTAMP.db"
    echo "Respaldo creado exitosamente: $BACKUP_DIR/dev_$TIMESTAMP.db"
    
    # Mantener solo los últimos 7 respaldos
    ls -t "$BACKUP_DIR"/dev_*.db | tail -n +8 | xargs -r rm
    echo "Rotación de respaldos completada (máximo 7 retenidos)."
else
    echo "Error: No se encontró la base de datos en $DB_PATH"
    exit 1
fi
