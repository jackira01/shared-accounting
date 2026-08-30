#!/bin/sh
set -e

# Aplica las migraciones pendientes antes de arrancar la aplicación.
npx prisma migrate deploy

exec "$@"
