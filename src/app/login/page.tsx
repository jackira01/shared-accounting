import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
      <div className="w-full max-w-sm">
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
