"use client";

import { useRef, useState } from "react";
import { importFirstRun } from "@/app/actions/backup";
import { Button, Label } from "@/components/ui";

export function RestoreForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setMessage({ ok: false, text: "Selecciona un archivo .json" });
      return;
    }

    if (
      !window.confirm(
        "Se restaurará la base de datos desde este archivo. ¿Continuar?"
      )
    ) {
      return;
    }

    setBusy(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await importFirstRun(formData);
    setBusy(false);

    if (result && !result.ok) {
      setMessage({ ok: false, text: result.error ?? "Ocurrió un error" });
      return;
    }

    // Éxito: la acción redirige a /login (o /registro) con la sesión invalidada.
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="restore-file">Respaldo (.json)</Label>
        <input
          id="restore-file"
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-zinc-200"
        />
      </div>
      {message && (
        <p
          className={`text-sm font-medium ${
            message.ok ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </p>
      )}
      <Button type="submit" variant="secondary" disabled={busy} className="w-full">
        {busy ? "Restaurando..." : "Restaurar respaldo"}
      </Button>
    </form>
  );
}
