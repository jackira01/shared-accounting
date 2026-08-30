"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { hasAnyUsers } from "@/lib/data";
import { deleteSession } from "@/lib/session";
import { exportAllData, restoreData } from "@/lib/backup";
import { backupSchema, type BackupDataInput } from "@/lib/backup-schema";

type ActionResult = { ok: boolean; error?: string };
type ExportResult = { ok: boolean; data?: string; error?: string };

type ParsedFile =
  | { ok: true; data: BackupDataInput }
  | { ok: false; error: string };

async function parseBackupFile(formData: FormData): Promise<ParsedFile> {
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

  return { ok: true, data: parsed.data };
}

async function finishRestore(): Promise<never> {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/saldos");
  revalidatePath("/facturas");
  revalidatePath("/ingresos");
  revalidatePath("/configuracion");

  // Invalida la sesión actual: los IDs de la base restaurada pueden no
  // coincidir con los de la sesión previa.
  await deleteSession();

  const hasUsers = (await prisma.user.count()) > 0;
  redirect(hasUsers ? "/login?restored=1" : "/registro?restored=1");
}

export async function exportData(): Promise<ExportResult> {
  await requireAdmin();
  const data = await exportAllData();
  return { ok: true, data: JSON.stringify(data, null, 2) };
}

export async function importData(formData: FormData): Promise<ActionResult> {
  await requireAdmin();

  const parsed = await parseBackupFile(formData);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  await restoreData(parsed.data);
  return finishRestore();
}

/**
 * Restaura un respaldo durante el primer arranque (sin usuarios registrados),
 * evitando pasar por el registro y la configuración inicial.
 */
export async function importFirstRun(formData: FormData): Promise<ActionResult> {
  if (await hasAnyUsers()) {
    return {
      ok: false,
      error: "Ya hay datos en la aplicación. Usa el panel de administración.",
    };
  }

  const parsed = await parseBackupFile(formData);
  if (!parsed.ok) return { ok: false, error: parsed.error };

  await restoreData(parsed.data);
  return finishRestore();
}
