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
import { deleteSession } from "@/lib/session";
import { Nav } from "@/components/nav";
import { DemoBanner } from "@/components/demo-banner";

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
  // (p. ej. tras restaurar un respaldo). Se limpia y se redirige al login.
  if (sessionId && !membership) {
    await deleteSession();
    redirect("/login");
  }

  if (membership && membership.status === "PENDING") {
    redirect("/esperando");
  }

  const [user, config] = await Promise.all([
    getCurrentUser(),
    getGroupConfig(),
  ]);

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
