"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentGroupId, getMembers } from "@/lib/data";
import { requireActiveMember } from "@/lib/dal";
import { parseInputDate } from "@/lib/format";
import { incomeInputSchema, type IncomeInput } from "@/lib/validators";

type ActionResult = { ok: boolean; error?: string };

async function validateIncome(data: IncomeInput): Promise<string | null> {
  const memberIds = (await getMembers()).map((m) => m.id);
  if (!memberIds.includes(data.receivedById)) return "Receptor inválido";
  for (const a of data.allocations) {
    if (!memberIds.includes(a.userId)) return "Miembro inválido en la división";
  }
  return null;
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/ingresos");
  revalidatePath("/saldos");
  revalidatePath("/facturas");
}

export async function createIncome(input: IncomeInput): Promise<ActionResult> {
  const userId = await requireActiveMember();
  const groupId = await getCurrentGroupId();

  const parsed = incomeInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }
  const data = parsed.data;

  const memberError = await validateIncome(data);
  if (memberError) return { ok: false, error: memberError };

  await prisma.income.create({
    data: {
      groupId,
      date: parseInputDate(data.date),
      description: data.description,
      amount: data.amount,
      receivedById: data.receivedById,
      createdById: userId,
      categoryId: data.categoryId || null,
      allocations: {
        create: data.allocations.map((a) => ({
          userId: a.userId,
          percentage: a.percentage,
        })),
      },
    },
  });

  revalidateAll();
  redirect("/ingresos");
}

export async function updateIncome(
  id: string,
  input: IncomeInput
): Promise<ActionResult> {
  await requireActiveMember();
  const groupId = await getCurrentGroupId();

  const parsed = incomeInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }
  const data = parsed.data;

  const existing = await prisma.income.findFirst({ where: { id, groupId } });
  if (!existing) return { ok: false, error: "Ingreso no encontrado" };

  const memberError = await validateIncome(data);
  if (memberError) return { ok: false, error: memberError };

  await prisma.$transaction([
    prisma.incomeAllocation.deleteMany({ where: { incomeId: id } }),
    prisma.income.update({
      where: { id },
      data: {
        date: parseInputDate(data.date),
        description: data.description,
        amount: data.amount,
        receivedById: data.receivedById,
        categoryId: data.categoryId || null,
        allocations: {
          create: data.allocations.map((a) => ({
            userId: a.userId,
            percentage: a.percentage,
          })),
        },
      },
    }),
  ]);

  revalidateAll();
  redirect("/ingresos");
}

export async function deleteIncome(id: string): Promise<ActionResult> {
  await requireActiveMember();
  const groupId = await getCurrentGroupId();

  const existing = await prisma.income.findFirst({ where: { id, groupId } });
  if (!existing) return { ok: false, error: "Ingreso no encontrado" };

  await prisma.income.delete({ where: { id } });

  revalidateAll();
  return { ok: true };
}
