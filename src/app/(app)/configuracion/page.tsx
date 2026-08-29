import Link from "next/link";
import {
  getCurrentUser,
  getCurrentMembership,
  getGroupConfig,
} from "@/lib/data";
import { Card } from "@/components/ui";
import { PasswordForm } from "./password-form";
import { CurrencyForm } from "@/components/currency-form";

export default async function ConfiguracionPage() {
  const [user, membership, config] = await Promise.all([
    getCurrentUser(),
    getCurrentMembership(),
    getGroupConfig(),
  ]);

  const isAdmin = membership?.role === "admin";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Configuración</h1>

      <Card title="Tu cuenta">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white"
            style={{ backgroundColor: user.color }}
          >
            {user.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-zinc-500">{user.email}</p>
          </div>
        </div>
      </Card>

      <Card title="Cambiar contraseña">
        <PasswordForm />
      </Card>

      {isAdmin && (
        <Card title="Moneda">
          <CurrencyForm currency={config.currency} />
        </Card>
      )}

      {isAdmin && (
        <Card title="Categorías">
          <p className="mb-3 text-sm text-zinc-500">
            Administra las categorías de gastos e ingresos.
          </p>
          <Link
            href="/configuracion/categorias"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Gestionar categorías
          </Link>
        </Card>
      )}

      {isAdmin && (
        <Card title="Usuarios">
          <p className="mb-3 text-sm text-zinc-500">
            Aprueba o rechaza el acceso de los usuarios registrados.
          </p>
          <Link
            href="/admin"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Ir al panel de administración
          </Link>
        </Card>
      )}
    </div>
  );
}
