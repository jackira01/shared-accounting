"use client";

import { useEffect, startTransition } from "react";
import { logout } from "@/app/actions/auth";

/**
 * Se monta cuando la sesión actual es obsoleta (el usuario ya no existe en la
 * base de datos). Borra la cookie y redirige al login usando una Server Action,
 * ya que un Server Component no puede modificar cookies.
 */
export function ForceLogout() {
  useEffect(() => {
    startTransition(() => {
      void logout();
    });
  }, []);

  return null;
}
