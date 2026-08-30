import { redirect } from "next/navigation";
import { getCurrentMembership, getAllMemberships } from "@/lib/data";
import { UsersManager } from "./users-manager";
import { BackupPanel } from "./backup-panel";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const membership = await getCurrentMembership();
  if (!membership || membership.role !== "admin") redirect("/");

  const memberships = await getAllMemberships();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Administración</h1>
      <p className="text-sm text-zinc-500">
        Aprueba o rechaza las solicitudes de acceso de los usuarios registrados.
      </p>
      <UsersManager
        memberships={memberships.map((m) => ({
          userId: m.userId,
          name: m.name,
          email: m.email,
          role: m.role,
          status: m.status,
        }))}
      />
      <BackupPanel />
    </div>
  );
}
