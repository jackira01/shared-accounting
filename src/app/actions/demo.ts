"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { getCurrentGroupId } from "@/lib/data";

type ActionResult = { ok: boolean; error?: string };

export async function clearDemoData(): Promise<ActionResult> {
  await requireAdmin();
  const groupId = await getCurrentGroupId();

  const demoUsers = await prisma.user.findMany({
    where: { isDemo: true, memberships: { some: { groupId } } },
    select: { id: true },
  });
  const demoUserIds = demoUsers.map((u) => u.id);
  const inDemo = { in: demoUserIds };

  await prisma.$transaction([
    prisma.settlement.deleteMany({
      where: {
        groupId,
        OR: [{ fromUserId: inDemo }, { toUserId: inDemo }],
      },
    }),
    prisma.invoice.deleteMany({
      where: {
        groupId,
        OR: [{ isDemo: true }, { paidById: inDemo }, { createdById: inDemo }],
      },
    }),
    prisma.income.deleteMany({
      where: {
        groupId,
        OR: [{ isDemo: true }, { receivedById: inDemo }, { createdById: inDemo }],
      },
    }),
    prisma.groupMember.deleteMany({ where: { groupId, userId: inDemo } }),
    prisma.user.deleteMany({ where: { id: inDemo } }),
  ]);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/saldos");
  return { ok: true };
}
