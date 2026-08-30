import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  getCurrentUser,
  getCurrentMembership,
  getGroupConfig,
  hasDemoData,
} from "@/lib/data";
import { Nav } from "@/components/nav";
import { DemoBanner } from "@/components/demo-banner";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [user, membership, config] = await Promise.all([
    getCurrentUser(),
    getCurrentMembership(),
    getGroupConfig(),
  ]);

  if (membership && membership.status === "PENDING") {
    redirect("/esperando");
  }

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
