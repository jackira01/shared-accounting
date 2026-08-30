import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAnyUsers } from "@/lib/data";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ restored?: string }>;
}) {
  if (!(await hasAnyUsers())) {
    redirect("/registro");
  }

  const params = await searchParams;
  const restored = params.restored === "1";

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
      <div className="w-full max-w-sm">
        {restored && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
            Copia de seguridad restaurada con éxito. Inicia sesión con las
            credenciales del respaldo.
          </div>
        )}
        <LoginForm />
        <p className="mt-4 text-center text-sm text-zinc-500">
          ¿No tienes cuenta?{" "}
          <Link
            href="/registro"
            className="font-medium text-blue-600 hover:underline"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
