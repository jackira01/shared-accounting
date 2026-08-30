"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  approveUser,
  rejectUser,
  resetUserPassword,
} from "@/app/actions/admin";
import { Button, Card, Badge, Input } from "@/components/ui";

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
  const [message, setMessage] = useState<string | null>(null);
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");

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

  async function handleReset(e: React.FormEvent, userId: string) {
    e.preventDefault();
    setBusyId(userId);
    setError(null);
    setMessage(null);
    const result = await resetUserPassword(userId, resetPassword);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error ?? "Ocurrió un error");
      return;
    }
    setMessage("Contraseña actualizada. El usuario deberá cambiarla al entrar.");
    setResetId(null);
    setResetPassword("");
    router.refresh();
  }

  return (
    <Card title="Usuarios registrados">
      {error && <p className="mb-2 text-sm font-medium text-red-600">{error}</p>}
      {message && (
        <p className="mb-2 text-sm font-medium text-green-600">{message}</p>
      )}
      <ul className="divide-y divide-zinc-100">
        {memberships.map((m) => (
          <li key={m.userId} className="py-3">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{m.name}</p>
                  {m.role === "admin" && <Badge color="#2563eb">Admin</Badge>}
                </div>
                <p className="truncate text-xs text-zinc-500">{m.email}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setResetId(resetId === m.userId ? null : m.userId);
                  setResetPassword("");
                  setMessage(null);
                }}
                className="shrink-0 text-xs font-medium text-zinc-500 hover:text-zinc-700"
              >
                Resetear clave
              </button>

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
            </div>

            {resetId === m.userId && (
              <form
                onSubmit={(e) => handleReset(e, m.userId)}
                className="mt-2 flex flex-wrap items-center gap-2 pl-4"
              >
                <Input
                  type="password"
                  minLength={6}
                  placeholder="Nueva contraseña temporal"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  className="max-w-xs"
                  required
                />
                <Button
                  type="submit"
                  variant="secondary"
                  disabled={busyId === m.userId}
                >
                  Guardar
                </Button>
              </form>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
