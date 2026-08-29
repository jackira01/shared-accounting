import { NextResponse, type NextRequest } from "next/server";
import { decrypt } from "@/lib/jwt";

/**
 * Protección optimista de rutas.
 *
 * El login está deshabilitado por defecto para el MVP. Para activarlo,
 * define la variable de entorno REQUIRE_LOGIN=true.
 *
 * La autorización fina (miembro pendiente vs. aprobado, setup inicial,
 * panel admin) se resuelve en los componentes de servidor, que tienen
 * acceso a la base de datos.
 */

const PUBLIC_PATHS = new Set(["/login", "/registro"]);

export async function proxy(request: NextRequest) {
  if (process.env.REQUIRE_LOGIN !== "true") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const token = request.cookies.get("session")?.value;
  const session = await decrypt(token);

  if (!session) {
    if (!PUBLIC_PATHS.has(pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
