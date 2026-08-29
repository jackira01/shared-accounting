"use client";

import { useActionState } from "react";
import { changePassword, type AuthState } from "@/app/actions/auth";
import { Button, Input, Label } from "@/components/ui";

export function PasswordForm() {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    changePassword,
    undefined
  );

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <Label htmlFor="currentPassword">Contraseña actual</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          required
        />
      </div>
      <div>
        <Label htmlFor="newPassword">Nueva contraseña</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          minLength={6}
          required
        />
      </div>
      {state?.error && (
        <p className="text-sm font-medium text-red-600">{state.error}</p>
      )}
      {state?.message && (
        <p className="text-sm font-medium text-green-600">{state.message}</p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
