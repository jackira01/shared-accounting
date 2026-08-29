import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/data";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui";

export default async function EsperandoPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");
  if (membership.status === "ACTIVE") redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold">Acceso pendiente</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Tu cuenta está registrada, pero aún no tienes acceso. Pídele al
          administrador que te apruebe para poder usar la página.
        </p>
        <form action={logout} className="mt-6">
          <Button type="submit" variant="secondary">
            Salir
          </Button>
        </form>
      </div>
    </div>
  );
}
