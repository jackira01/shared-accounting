"use server";

import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { requireUserId } from "@/lib/dal";
import { seedDefaultCategories } from "@/lib/defaults";
import {
  registerInputSchema,
  type RegisterInput,
} from "@/lib/validators";

export type AuthState = { error?: string; message?: string } | undefined;

// Rate limiting en memoria (suficiente para una instancia autohospedada).
const MAX_ATTEMPTS = 5;
const LOCK_MS = 5 * 60 * 1000;
const attempts = new Map<string, { count: number; lockedUntil: number }>();

function rateLimitError(key: string): string | null {
  const entry = attempts.get(key);
  if (entry && entry.lockedUntil > Date.now()) {
    return "Demasiados intentos. Intenta de nuevo en unos minutos.";
  }
  return null;
}

function recordFailure(key: string) {
  const entry = attempts.get(key) ?? { count: 0, lockedUntil: 0 };
  entry.count += 1;
  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCK_MS;
    entry.count = 0;
  }
  attempts.set(key, entry);
}

function recordSuccess(key: string) {
  attempts.delete(key);
}

const USER_COLORS = ["#2563eb", "#f59e0b", "#8b5cf6", "#0ea5e9", "#22c55e", "#ec4899"];

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresa email y contraseña" };
  }

  const rateError = rateLimitError(`login:${email}`);
  if (rateError) return { error: rateError };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    recordFailure(`login:${email}`);
    return { error: "Credenciales inválidas" };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    recordFailure(`login:${email}`);
    return { error: "Credenciales inválidas" };
  }

  recordSuccess(`login:${email}`);
  await createSession(user.id);
  redirect(user.mustChangePassword ? "/cambiar-password" : "/");
}

export async function register(input: RegisterInput): Promise<AuthState> {
  const parsed = registerInputSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const rateError = rateLimitError(`register:${email}`);
  if (rateError) return { error: rateError };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Este email ya está registrado" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];

  const user = await prisma.user.create({
    data: { name: parsed.data.name.trim(), email, passwordHash, color },
  });

  const userCount = await prisma.user.count();
  const isFirst = userCount === 1;

  if (isFirst) {
    // Primer usuario: crea el grupo, se vuelve admin y arranca el setup.
    const group = await prisma.group.create({
      data: { name: "Mi grupo", currency: "COP", configured: false },
    });
    await prisma.groupMember.create({
      data: { groupId: group.id, userId: user.id, role: "admin", status: "ACTIVE" },
    });
    await seedDefaultCategories(group.id);
  } else {
    // Usuario posterior: queda pendiente de aprobación.
    const group = await prisma.group.findFirst({ orderBy: { createdAt: "asc" } });
    if (!group) {
      const created = await prisma.group.create({
        data: { name: "Mi grupo", currency: "COP", configured: true },
      });
      await prisma.groupMember.create({
        data: { groupId: created.id, userId: user.id, role: "admin", status: "ACTIVE" },
      });
      await seedDefaultCategories(created.id);
    } else {
      await prisma.groupMember.create({
        data: { groupId: group.id, userId: user.id, role: "member", status: "PENDING" },
      });
    }
  }

  await createSession(user.id);
  redirect(isFirst ? "/setup" : "/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}

export async function changePassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const userId = await requireUserId();
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (newPassword.length < 6) {
    return { error: "La nueva contraseña debe tener al menos 6 caracteres" };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "Usuario no encontrado" };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { error: "Contraseña actual incorrecta" };

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hash } });

  return { message: "Contraseña actualizada" };
}

/**
 * Cambia la contraseña sin exigir la actual (flujo de contraseña temporal).
 * Se usa en /cambiar-password tras un reset forzado.
 */
export async function setNewPassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const userId = await requireUserId();
  const newPassword = String(formData.get("newPassword") ?? "");

  if (newPassword.length < 6) {
    return { error: "La nueva contraseña debe tener al menos 6 caracteres" };
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: hash, mustChangePassword: false },
  });

  redirect("/");
}
