"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveUser, rejectUser } from "@/app/actions/admin";
import { Button, Card, Badge } from "@/components/ui";

type Membership = {
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export function UsersManager({ memberships }: { memberships: Membership[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve(userId: string) {
    setBusyId(userId);
    setError(null);
    const result = await approveUser(userId);
    setBusyId(null);
    if (!result.ok) setError(result.error ?? "Ocurrió un error");
    router.refresh();
  }

  async function reject(userId: string) {
    if (!window.confirm("¿Seguro que quieres eliminar a este usuario?")) {
      return;
    }
    setBusyId(userId);
    setError(null);
    const result = await rejectUser(userId);
    setBusyId(null);
    if (!result.ok) setError(result.error ?? "Ocurrió un error");
    router.refresh();
  }

  return (
    <Card title="Usuarios registrados">
      {error && <p className="mb-2 text-sm font-medium text-red-600">{error}</p>}
      <ul className="divide-y divide-zinc-100">
        {memberships.map((m) => (
          <li key={m.userId} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{m.name}</p>
                {m.role === "admin" && <Badge color="#2563eb">Admin</Badge>}
              </div>
              <p className="truncate text-xs text-zinc-500">{m.email}</p>
            </div>

            {m.role !== "admin" && m.status === "PENDING" ? (
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="secondary"
                  disabled={busyId === m.userId}
                  onClick={() => approve(m.userId)}
                >
                  Aprobar
                </Button>
                <Button
                  variant="danger"
                  disabled={busyId === m.userId}
                  onClick={() => reject(m.userId)}
                >
                  Rechazar
                </Button>
              </div>
            ) : (
              <Badge color={m.status === "ACTIVE" ? "#10b981" : "#f59e0b"}>
                {m.status === "ACTIVE" ? "Activo" : "Pendiente"}
              </Badge>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
