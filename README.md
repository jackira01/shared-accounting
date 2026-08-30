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

### Servidor (Docker)

1. Configura las variables de entorno:
   ```env
   # en el entorno de despliegue o un archivo .env
   SESSION_SECRET="una-clave-secreta-larga-y-aleatoria"
   REQUIRE_LOGIN="true"
   PORT="3000"
   ```
2. Levanta el servicio:
   ```bash
   docker-compose up -d --build
   ```
   La app escucha en el puerto `PORT` (por defecto `3000`) y las migraciones se aplican solas al arrancar. La base SQLite se guarda en el volumen `prisma_data`.
3. Respaldos: ejecuta `./backup.sh` (o prográmalo en cron) para copiar la base a `./backups/`.

### Plataformas PaaS (Dokploy, Coolify, etc.)

Usa únicamente el `docker-compose.yml` principal (solo el servicio `app`). El proxy inverso y la terminación TLS los aporta la plataforma; no levantes Caddy para no chocar con los puertos `80`/`443`.

### VPS con Caddy opcional

Para un despliegue manual con HTTPS propio, añade el override:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Esto agrega Caddy (puertos `80`/`443`) y expone la app detrás de tu dominio. Reemplaza `localhost` en `Caddyfile`.

### Configuración

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Ruta de la base SQLite (`file:./dev.db`). |
| `SESSION_SECRET` | **Requerida.** Clave para firmar las sesiones (JWT). |
| `REQUIRE_LOGIN` | `true` activa registro/login y autorización; `false` usa el admin por defecto sin login. |
| `PORT` | Puerto en el que escucha la app (por defecto `3000`). Afecta al contenedor, al mapeo de `docker-compose` y al proxy de Caddy. |

## Funciones

### Autenticación y autorización
- **Registro:** el primer usuario registrado crea el grupo y es **admin**. Los siguientes quedan **pendientes**.
- **Login:** email + contraseña (bcrypt); bloqueo temporal tras varios intentos fallidos.
- **Aprobación:** el admin aprueba o rechaza usuarios en `/admin` (rechazar elimina la cuenta). Un usuario pendiente solo ve *"Pide acceso al administrador"*.
- **Configuración inicial:** al registrarse el primer admin, `/setup` permite elegir **moneda** y gestionar **categorías** (o "Configurar más tarde").

### Facturas
- Crear, editar y eliminar facturas con fecha, establecimiento y notas.
- Líneas de producto con cantidad, precio, categoría, y descripción/peso opcionales.
- División por defecto (50/50 o 100 %) y por línea con porcentajes a medida.
- **Búsqueda de productos** con autocompletado (debounce) para reutilizar nombres ya registrados.

### Ingresos
- Registrar, editar y eliminar ingresos con categoría y reparto entre miembros.

### Saldos y resumen
- **Resumen (inicio):** posición, quién debe a quién, métricas del mes y por persona, actividad reciente.
- **Saldos:** balance por usuario (personal + compartido), métricas de gastos **por mes** (selector), transferencias sugeridas y registro de pagos.

### Categorías y moneda
- **Categorías:** CRUD solo para admin (crear, editar, activar/desactivar).
- **Moneda:** lista fija (COP, USD, EUR, MXN, ARS, CLP, PEN, BRL), configurable por el admin.

### Datos de ejemplo
- `npm run db:seed` crea usuarios y facturas de ejemplo marcados con `isDemo`; el admin ve un **banner** con un botón para borrarlos.

### Respaldo y restauración (JSON)
- En `/admin` (solo admin): **Exportar** descarga un `.json` con todas las tablas; **Importar** sube ese `.json`, valida su estructura con Zod y **reemplaza** todos los datos.
- Útil para respaldos y migraciones entre entornos. El archivo incluye los hashes de contraseñas y los datos de ejemplo.

## Recuperación de contraseña

| Caso | Cómo se resuelve |
|------|------------------|
| Un **usuario** olvida su clave | El admin la resetea en `/admin` → "Resetear clave" (asigna una temporal). |
| Un **admin** olvida su clave y hay otro admin | El otro admin la resetea igual desde `/admin`. |
| El **único admin** olvida su clave | Script CLI desde el servidor (ver abajo). |

- Tras un reset, el usuario **debe cambiar su contraseña** en el siguiente inicio de sesión.
- Reset de un usuario desde `/admin`: panel **Admin** → "Resetear clave" → escribe la contraseña temporal → "Guardar".
- Reset por CLI (bloqueo del admin, requiere acceso al servidor):
  ```bash
  # local
  npm run reset:password -- jack@casa.local nueva-clave

  # docker
  docker compose exec app npm run reset:password -- jack@casa.local nueva-clave
  ```

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
| Despliegue | Docker multi-stage (output `standalone`) + migraciones automáticas en `entrypoint.sh`; Caddy opcional vía `docker-compose.prod.yml` |
| Respaldo/restauración | Export/import JSON desde `/admin` (`src/lib/backup.ts` + Zod + `$transaction`) |
| Respaldos | `backup.sh` copia SQLite y rota los últimos 7 |

## Checklist

- [ ] `npm install` finaliza sin errores.
- [ ] `.env` existe con `DATABASE_URL`, `SESSION_SECRET` y `REQUIRE_LOGIN`.
- [ ] `npm run db:migrate` crea `prisma/dev.db` sin errores.
- [ ] `npm test` pasa todas las pruebas.
- [ ] `npm run dev` abre http://localhost:3000.
- [ ] Puedes registrarte como primer usuario, ver el wizard de configuración y entrar al panel.
- [ ] Un segundo usuario se registra, queda pendiente, y el admin puede aprobarlo/rechazarlo.
- [ ] En `/admin` puedes exportar un respaldo `.json` e importarlo de vuelta.
- [ ] (Producción) `npm run build` compila sin errores antes de `docker-compose up -d`.

## Next steps

- **Datos iniciales:** ajusta `prisma/seed.ts` para tu propio ejemplo; marca `isDemo` los registros de ejemplo.
- **Dominio y HTTPS:** edita `Caddyfile` y reemplaza `localhost` por tu dominio real.
- **Moneda:** amplía la lista en `src/lib/format.ts` (`CURRENCIES`) si necesitas otra divisa.
- **Contribuir:** sigue el estilo del repo, agrega pruebas en Vitest y ejecuta `npm run lint` y `npm test` antes de abrir un PR. La arquitectura general está descrita en `AGENTS.md`.
- **Seguridad:** en producción usa un `SESSION_SECRET` aleatorio y activa `REQUIRE_LOGIN=true`.
