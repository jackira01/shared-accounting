"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/dal";
import { getCurrentGroupId } from "@/lib/data";

type ActionResult = { ok: boolean; error?: string };

export async function approveUser(userId: string): Promise<ActionResult> {
  await requireAdmin();
  const groupId = await getCurrentGroupId();

  const membership = await prisma.groupMember.findFirst({
    where: { userId, groupId },
  });
  if (!membership) return { ok: false, error: "Usuario no encontrado" };
  if (membership.role === "admin") {
    return { ok: false, error: "No se puede modificar a un administrador" };
  }

  await prisma.groupMember.update({
    where: { id: membership.id },
    data: { status: "ACTIVE" },
  });

  revalidatePath("/admin");
  revalidatePath("/saldos");
  revalidatePath("/");
  return { ok: true };
}

export async function rejectUser(userId: string): Promise<ActionResult> {
  const adminId = await requireAdmin();
  const groupId = await getCurrentGroupId();

  if (userId === adminId) {
    return { ok: false, error: "No puedes eliminar tu propia cuenta" };
  }

  const membership = await prisma.groupMember.findFirst({
    where: { userId, groupId },
  });
  if (!membership) return { ok: false, error: "Usuario no encontrado" };
  if (membership.role === "admin") {
    return { ok: false, error: "No se puede eliminar a un administrador" };
  }

  await prisma.$transaction([
    prisma.groupMember.delete({ where: { id: membership.id } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);

  revalidatePath("/admin");
  return { ok: true };
}

export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<ActionResult> {
  await requireAdmin();
  const groupId = await getCurrentGroupId();

  const membership = await prisma.groupMember.findFirst({
    where: { userId, groupId },
  });
  if (!membership) return { ok: false, error: "Usuario no encontrado" };

  if (newPassword.length < 6) {
    return { ok: false, error: "La contraseña debe tener al menos 6 caracteres" };
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, mustChangePassword: true },
  });

  revalidatePath("/admin");
  return { ok: true };
}
