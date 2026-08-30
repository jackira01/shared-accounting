import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  getCurrentUser,
  getCurrentMembership,
  getGroupConfig,
  hasDemoData,
  hasAnyUsers,
} from "@/lib/data";
import { getSessionUserId } from "@/lib/dal";
import { Nav } from "@/components/nav";
import { DemoBanner } from "@/components/demo-banner";
import { ForceLogout } from "@/components/force-logout";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!(await hasAnyUsers())) {
    redirect("/registro");
  }

  const membership = await getCurrentMembership();
  const sessionId = await getSessionUserId();

  // Sesión obsoleta: la cookie apunta a un usuario que ya no existe
  // (p. ej. tras restaurar un respaldo). Se limpia vía Server Action.
  if (sessionId && !membership) {
    return <ForceLogout />;
  }

  if (membership && membership.status === "PENDING") {
    redirect("/esperando");
  }

  // Carga los datos del usuario/grupo de forma defensiva: si el token de
  // sesión apunta a un usuario inexistente o sin grupo (cookie huérfana tras
  // resetear la base), se limpia la sesión y se redirige al login.
  const data = await (async () => {
    try {
      return await Promise.all([getCurrentUser(), getGroupConfig()]);
    } catch {
      return null;
    }
  })();

  if (!data) {
    return <ForceLogout />;
  }

  const [user, config] = data;

  if (user.mustChangePassword) {
    redirect("/cambiar-password");
  }

  if (membership && membership.role === "admin" && !config.configured) {
    redirect("/setup");
  }

  const isAdmin = membership?.role === "admin";
  const demo = isAdmin ? await hasDemoData() : false;

  return (
    <div className="min-h-screen">
      <Nav
        user={{ name: user.name, color: user.color }}
        loggedIn={Boolean(membership)}
        isAdmin={isAdmin}
      />
      {demo && <DemoBanner />}
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:pb-10">
        {children}
      </main>
    </div>
  );
}
