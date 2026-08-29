"use client";

import { useState, type ReactNode } from "react";

type Action = () => Promise<{ ok: boolean; error?: string }>;

export function DeleteButton({
  action,
  children = "Eliminar",
}: {
  action: Action;
  children?: ReactNode;
}) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        if (!window.confirm("¿Seguro que deseas eliminar?")) return;
        setPending(true);
        await action();
        setPending(false);
      }}
      className="text-xs font-medium text-red-600 hover:underline disabled:text-red-300"
    >
      {pending ? "Eliminando..." : children}
    </button>
  );
}
