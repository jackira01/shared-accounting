"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { getCurrentGroupId } from "@/lib/data";
import { setupInputSchema, type SetupInput } from "@/lib/validators";

type ActionResult = { ok: boolean; error?: string };

export async function completeSetup(input: SetupInput): Promise<ActionResult> {
  await requireAdmin();
  const groupId = await getCurrentGroupId();

  const parsed = setupInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.group.update({
    where: { id: groupId },
    data: { currency: parsed.data.currency, configured: true },
  });

  redirect("/");
}

export async function updateCurrency(input: SetupInput): Promise<ActionResult> {
  await requireAdmin();
  const groupId = await getCurrentGroupId();

  const parsed = setupInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  await prisma.group.update({
    where: { id: groupId },
    data: { currency: parsed.data.currency },
  });

  revalidatePath("/");
  revalidatePath("/configuracion");
  return { ok: true };
}
