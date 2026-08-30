"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { exportData, importData } from "@/app/actions/backup";
import { Button, Card, Label } from "@/components/ui";

export function BackupPanel() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  async function handleExport() {
    setMessage(null);
    const result = await exportData();
    if (!result.ok || !result.data) {
      setMessage({ ok: false, text: result.error ?? "Ocurrió un error" });
      return;
    }
    const blob = new Blob([result.data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    const file = fileRef.current?.files?.[0];
    if (!file) {
      setMessage({ ok: false, text: "Selecciona un archivo .json" });
      return;
    }

    if (
      !window.confirm(
        "Esto reemplazará TODOS los datos actuales por los del archivo. ¿Continuar?"
      )
    ) {
      return;
    }

    setBusy(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await importData(formData);
    setBusy(false);

    if (!result.ok) {
      setMessage({ ok: false, text: result.error ?? "Ocurrió un error" });
      return;
    }

    setMessage({ ok: true, text: "Datos restaurados correctamente" });
    if (fileRef.current) fileRef.current.value = "";
    router.refresh();
  }

  return (
    <Card title="Respaldo y restauración">
      <p className="mb-3 text-sm text-zinc-500">
        Exporta o importa todos los datos de la aplicación en un archivo JSON.
      </p>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={handleExport}>
          Exportar (descargar .json)
        </Button>
      </div>

      <form
        onSubmit={handleImport}
        className="mt-4 space-y-3 border-t border-zinc-100 pt-4"
      >
        <div>
          <Label htmlFor="backup-file">Importar respaldo (.json)</Label>
          <input
            id="backup-file"
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
        <Button type="submit" disabled={busy}>
          {busy ? "Importando..." : "Importar y reemplazar"}
        </Button>
      </form>
    </Card>
  );
}
