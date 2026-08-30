# Contabilidad — Gastos compartidos sin hojas de cálculo

Contabilidad es una app web para parejas, roommates o familias que comparten gastos. Registras facturas con sus productos, marcas quién pagó y cómo se divide cada gasto (50/50, 100 % o porcentajes a medida), y la app calcula al instante cuánto gastó cada uno, quién le debe a quién y qué pagos hacen falta para quedar en paz. Sustituye la hoja de cálculo: solo anota facturas e ingresos y deja que el sistema haga las cuentas y muestre los saldos por mes.

> **Código abierto.** Este proyecto es de código abierto. Su venta, comercialización o redistribución con fines de lucro **no está autorizada** sin el consentimiento expreso y por escrito de sus autores.

## Quick path

Prerrequisitos: Node.js 20+ y npm (para Docker solo hace falta Docker + Docker Compose).

### Local (desarrollo)

1. Instala dependencias:
   ```bash
   npm install
   ```
2. Crea `.env` con las variables requeridas:
   ```env
   DATABASE_URL="file:./dev.db"
   SESSION_SECRET="una-clave-secreta-larga-y-aleatoria"
   REQUIRE_LOGIN="true"
   ```
3. Crea la base de datos:
   ```bash
   npm run db:migrate
   ```
4. (Opcional) Carga datos de ejemplo para explorar la app:
   ```bash
   npm run db:seed
   ```
5. Arranca el servidor:
   ```bash
   npm run dev
   ```
   Abre http://localhost:3000.

### Primer uso

1. Abre **/registro** y crea la primera cuenta: **el primer usuario se convierte en administrador**.
2. Completa la **configuración inicial**: elige la moneda y personaliza las categorías (o pulsa "Configurar más tarde" para usar las categorías por defecto).
3. Invita a los demás: cada uno se registra y queda **pendiente de aprobación** hasta que el admin los apruebe en el panel **Admin**.

### Servidor (Docker + Caddy)

1. Configura las variables de entorno y el dominio:
   ```env
   # en el entorno de despliegue o un archivo .env
   SESSION_SECRET="una-clave-secreta-larga-y-aleatoria"
   REQUIRE_LOGIN="true"
   PORT="3000"
   ```
   En `Caddyfile` reemplaza `localhost` por tu dominio.
2. Levanta los servicios:
   ```bash
   docker-compose up -d --build
   ```
   La app corre en el puerto definido por `PORT` (por defecto `3000`) y Caddy expone `:80`/`:443` con HTTPS. La base SQLite se guarda en el volumen `prisma_data`.
3. Respaldos: ejecuta `./backup.sh` (o prográmalo en cron) para copiar `prisma/dev.db` a `./backups/`.

### Configuración

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Ruta de la base SQLite (`file:./dev.db`). |
| `SESSION_SECRET` | **Requerida.** Clave para firmar las sesiones (JWT). |
| `REQUIRE_LOGIN` | `true` activa registro/login y autorización; `false` usa el admin por defecto sin login. |
| `PORT` | Puerto en el que escucha la app (por defecto `3000`). Afecta al contenedor, al mapeo de `docker-compose` y al proxy de Caddy. |

## Registro, login y autorización

- **Registro:** el primer usuario registrado crea el grupo y es **admin**. Los usuarios posteriores se registran en `/registro` y quedan **pendientes**.
- **Login:** email + contraseña (bcrypt). Los intentos fallidos se limitan (bloqueo temporal).
- **Aprobación:** un usuario pendiente solo ve el aviso *"Pide acceso al administrador"*. El admin los aprueba o rechaza (rechazar elimina la cuenta) en `/admin`.
- **Categorías:** solo el admin puede crear, editar o eliminar categorías.
- **Datos de ejemplo:** si se usó `npm run db:seed`, el admin ve un **banner** indicando que hay datos de ejemplo y un botón para borrarlos; el banner desaparece al borrarlos.

## Details

| Área | Decisión |
|------|----------|
| Framework | Next.js 16 (App Router, Server Actions, TypeScript) |
| Base de datos | SQLite + Prisma ORM v6 |
| Estilos | Tailwind CSS v4 |
| Autenticación | Manual: `bcryptjs` (hash) + `jose` (JWT en cookie `httpOnly`) |
| Autorización | Estado en `GroupMember` (`ACTIVE`/`PENDING`) + rol (`admin`/`member`) |
| Moneda | Lista fija (COP, USD, EUR, MXN, ARS, CLP, PEN, BRL) por grupo en `Group.currency` |
| Configuración inicial | `Group.configured`; wizard en `/setup` (moneda + categorías) |
| Datos de ejemplo | Flags `isDemo` en usuarios/facturas/ingresos + banner con borrado |
| Validación | Zod (schemas en `src/lib/validators.ts`) |
| Cálculos financieros | `src/lib/calculations/` (reparto, saldos, liquidaciones) con tests en Vitest |
| Búsqueda de productos | Server Action con debounce y similitud por nombre (`src/lib/search.ts`) |
| Despliegue | Docker multi-stage (output `standalone`) + Caddy como proxy inverso |
| Respaldos | `backup.sh` copia SQLite y rota los últimos 7 |

## Checklist

- [ ] `npm install` finaliza sin errores.
- [ ] `.env` existe con `DATABASE_URL`, `SESSION_SECRET` y `REQUIRE_LOGIN`.
- [ ] `npm run db:migrate` crea `prisma/dev.db` sin errores.
- [ ] `npm test` pasa todas las pruebas.
- [ ] `npm run dev` abre http://localhost:3000.
- [ ] Puedes registrarte como primer usuario, ver el wizard de configuración y entrar al panel.
- [ ] Un segundo usuario se registra, queda pendiente, y el admin puede aprobarlo/rechazarlo.
- [ ] (Producción) `npm run build` compila sin errores antes de `docker-compose up -d`.

## Next steps

- **Datos iniciales:** ajusta `prisma/seed.ts` para tu propio ejemplo; marca `isDemo` los registros de ejemplo.
- **Dominio y HTTPS:** edita `Caddyfile` y reemplaza `localhost` por tu dominio real.
- **Moneda:** amplía la lista en `src/lib/format.ts` (`CURRENCIES`) si necesitas otra divisa.
- **Contribuir:** sigue el estilo del repo, agrega pruebas en Vitest y ejecuta `npm run lint` y `npm test` antes de abrir un PR. La arquitectura general está descrita en `AGENTS.md`.
- **Seguridad:** en producción usa un `SESSION_SECRET` aleatorio y activa `REQUIRE_LOGIN=true`.
