import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/jwt";
import { prisma } from "@/lib/db";

export const getSessionUserId = cache(async (): Promise<string | null> => {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  const payload = await decrypt(session);
  return payload?.userId ?? null;
});

const loginRequired = () => process.env.REQUIRE_LOGIN === "true";

async function adminFallbackId(): Promise<string> {
  const admin = await prisma.groupMember.findFirst({
    where: { role: "admin" },
    orderBy: { joinedAt: "asc" },
    select: { userId: true },
  });
  if (admin) return admin.userId;
  const any = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!any) throw new Error("No hay usuarios en el sistema");
  return any.id;
}

/**
 * Devuelve el id del usuario en sesión, o el administrador del grupo si el
 * login está deshabilitado (REQUIRE_LOGIN != true).
 */
export const requireUserId = cache(async (): Promise<string> => {
  const sessionId = await getSessionUserId();
  if (sessionId) return sessionId;
  if (loginRequired()) throw new Error("No autorizado");
  return adminFallbackId();
});

/**
 * Como `requireUserId`, pero exige que el usuario sea un miembro ACTIVE
 * (aprobado). Se usa en las operaciones de datos para que un usuario
 * pendiente no pueda leer ni escribir.
 */
export const requireActiveMember = cache(async (): Promise<string> => {
  const sessionId = await getSessionUserId();
  if (sessionId) {
    const membership = await prisma.groupMember.findFirst({
      where: { userId: sessionId },
      orderBy: { joinedAt: "asc" },
      select: { status: true },
    });
    if (membership && membership.status === "ACTIVE") return sessionId;
    throw new Error("No autorizado");
  }
  if (loginRequired()) throw new Error("No autorizado");
  return adminFallbackId();
});

/**
 * Exige que el usuario en sesión sea administrador activo del grupo.
 */
export const requireAdmin = cache(async (): Promise<string> => {
  const sessionId = await getSessionUserId();
  if (sessionId) {
    const membership = await prisma.groupMember.findFirst({
      where: { userId: sessionId },
      orderBy: { joinedAt: "asc" },
      select: { role: true, status: true },
    });
    if (membership && membership.role === "admin" && membership.status === "ACTIVE") {
      return sessionId;
    }
    throw new Error("No autorizado");
  }
  if (loginRequired()) throw new Error("No autorizado");
  return adminFallbackId();
});
