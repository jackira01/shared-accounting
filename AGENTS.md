<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Proyecto Contabilidad (Gastos Compartidos & Finanzas en Pareja/Grupo)

## Stack Tecnológico
- **Framework:** Next.js (App Router, Server Actions, TypeScript)
- **Base de datos & ORM:** SQLite + Prisma ORM
- **Estilos:** Tailwind CSS
- **Cálculos Financieros:** Módulo dedicado en `src/lib/calculations/` (shares, balances, settlements) con tests en Vitest.
- **Autenticación:** JWT + cookies + bcrypt (opcional vía REQUIRE_LOGIN).

## Comandos Útiles
- `npm run dev`: Inicia el servidor de desarrollo.
- `npm run build`: Compila la aplicación en producción (Next.js standalone).
- `npm test`: Ejecuta la suite de pruebas unitarias con Vitest.
- `npm run db:migrate`: Ejecuta migraciones de Prisma.
- `npm run db:seed`: Rellena la base de datos con datos iniciales.

## Despliegue & Operación
- **Docker & Caddy:** `docker-compose up -d` levanta la app y el proxy inverso Caddy con HTTPS.
- **Respaldos:** `./backup.sh` realiza copias de seguridad automáticas de la base de datos SQLite en `./backups/`.

