"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentGroupId, getMembers } from "@/lib/data";
import { requireActiveMember } from "@/lib/dal";
import { parseInputDate } from "@/lib/format";
import { settlementInputSchema, type SettlementInput } from "@/lib/validators";

type ActionResult = { ok: boolean; error?: string };

export async function createSettlement(
  input: SettlementInput
): Promise<ActionResult> {
  await requireActiveMember();
  const groupId = await getCurrentGroupId();

  const parsed = settlementInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }
  const data = parsed.data;

  if (data.fromUserId === data.toUserId) {
    return { ok: false, error: "El origen y destino deben ser distintos" };
  }

  const memberIds = (await getMembers()).map((m) => m.id);
  if (!memberIds.includes(data.fromUserId) || !memberIds.includes(data.toUserId)) {
    return { ok: false, error: "Miembros inválidos" };
  }

  await prisma.settlement.create({
    data: {
      groupId,
      date: parseInputDate(data.date),
      fromUserId: data.fromUserId,
      toUserId: data.toUserId,
      amount: data.amount,
      note: data.note || null,
    },
  });

  revalidatePath("/saldos");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteSettlement(id: string): Promise<ActionResult> {
  await requireActiveMember();
  const groupId = await getCurrentGroupId();

  const existing = await prisma.settlement.findFirst({ where: { id, groupId } });
  if (!existing) return { ok: false, error: "Pago no encontrado" };

  await prisma.settlement.delete({ where: { id } });

  revalidatePath("/saldos");
  revalidatePath("/");
  return { ok: true };
}
