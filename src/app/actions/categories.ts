"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentGroupId } from "@/lib/data";
import { requireAdmin } from "@/lib/dal";
import { categoryInputSchema, type CategoryInput } from "@/lib/validators";

type ActionResult = { ok: boolean; error?: string };

export async function createCategory(
  input: CategoryInput
): Promise<ActionResult> {
  await requireAdmin();
  const groupId = await getCurrentGroupId();

  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }
  const data = parsed.data;

  const max = await prisma.category.aggregate({
    where: { groupId },
    _max: { sortOrder: true },
  });

  await prisma.category.create({
    data: {
      groupId,
      name: data.name,
      color: data.color,
      type: data.type,
      sortOrder: (max._max.sortOrder ?? -1) + 1,
    },
  });

  revalidatePath("/configuracion");
  revalidatePath("/facturas");
  revalidatePath("/ingresos");
  return { ok: true };
}

export async function updateCategory(
  id: string,
  input: CategoryInput
): Promise<ActionResult> {
  await requireAdmin();
  const groupId = await getCurrentGroupId();

  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }
  const data = parsed.data;

  const existing = await prisma.category.findFirst({ where: { id, groupId } });
  if (!existing) return { ok: false, error: "Categoría no encontrada" };

  await prisma.category.update({
    where: { id },
    data: { name: data.name, color: data.color, type: data.type },
  });

  revalidatePath("/configuracion");
  revalidatePath("/facturas");
  revalidatePath("/ingresos");
  return { ok: true };
}

export async function toggleCategory(id: string): Promise<ActionResult> {
  await requireAdmin();
  const groupId = await getCurrentGroupId();

  const existing = await prisma.category.findFirst({ where: { id, groupId } });
  if (!existing) return { ok: false, error: "Categoría no encontrada" };

  await prisma.category.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });

  revalidatePath("/configuracion");
  revalidatePath("/facturas");
  revalidatePath("/ingresos");
  return { ok: true };
}
