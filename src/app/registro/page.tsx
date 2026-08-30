import Link from "next/link";
import { hasAnyUsers } from "@/lib/data";
import { RegisterForm } from "./register-form";
import { RestoreForm } from "./restore-form";

export const dynamic = "force-dynamic";

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ restored?: string }>;
}) {
  const params = await searchParams;
  const restored = params.restored === "1";
  const isFirstRun = !(await hasAnyUsers());

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
      <div className="w-full max-w-sm">
        {restored && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            Copia de seguridad restaurada. No hay usuarios: registra el primer
            usuario.
          </div>
        )}
        <RegisterForm />
        {isFirstRun && (
          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-zinc-800">
              ¿Ya tienes un respaldo?
            </h2>
            <p className="mb-3 mt-1 text-xs text-zinc-500">
              Sube el archivo JSON de una base anterior para restaurarla y
              evitar volver a configurar.
            </p>
            <RestoreForm />
          </div>
        )}
        <p className="mt-4 text-center text-sm text-zinc-500">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
