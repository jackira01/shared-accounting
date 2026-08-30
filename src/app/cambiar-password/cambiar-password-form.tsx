"use client";

import { useActionState } from "react";
import { setNewPassword, type AuthState } from "@/app/actions/auth";
import { Button, Input, Label } from "@/components/ui";

export function CambiarPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    setNewPassword,
    undefined
  );

  return (
    <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h1 className="text-lg font-semibold">Cambia tu contraseña</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Debes establecer una nueva contraseña antes de continuar.
      </p>

      <form action={formAction} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="newPassword">Nueva contraseña</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
          />
        </div>
        {state?.error && (
          <p className="text-sm font-medium text-red-600">{state.error}</p>
        )}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Guardando..." : "Guardar contraseña"}
        </Button>
      </form>
    </div>
  );
}
