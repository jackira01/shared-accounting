import Link from "next/link";
import { RegisterForm } from "./register-form";

export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ restored?: string }>;
}) {
  const params = await searchParams;
  const restored = params.restored === "1";

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
