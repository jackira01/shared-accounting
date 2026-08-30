"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/dal";
import { exportAllData, restoreData } from "@/lib/backup";
import { backupSchema } from "@/lib/backup-schema";

type ActionResult = { ok: boolean; error?: string };
type ExportResult = { ok: boolean; data?: string; error?: string };

export async function exportData(): Promise<ExportResult> {
  await requireAdmin();
  const data = await exportAllData();
  return { ok: true, data: JSON.stringify(data, null, 2) };
}

export async function importData(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "No se recibió ningún archivo" };
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, error: "No se pudo leer el archivo" };
  }

  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { ok: false, error: "El archivo no es un JSON válido" };
  }

  const parsed = backupSchema.safeParse(json);
  if (!parsed.success) {
    return {
      ok: false,
      error: `Estructura inválida: ${parsed.error.issues[0]?.message ?? "revisa el archivo"}`,
    };
  }

  await restoreData(parsed.data);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/saldos");
  revalidatePath("/facturas");
  revalidatePath("/ingresos");
  revalidatePath("/configuracion");
  return { ok: true };
}
