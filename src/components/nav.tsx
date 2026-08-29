"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { cn } from "@/components/ui";

type NavUser = { name: string; color: string };

const links = [
  { href: "/", label: "Inicio" },
  { href: "/facturas", label: "Facturas" },
  { href: "/ingresos", label: "Ingresos" },
  { href: "/saldos", label: "Saldos" },
];

export function Nav({
  user,
  loggedIn,
  isAdmin,
}: {
  user: NavUser;
  loggedIn: boolean;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ backgroundColor: "#2563eb" }}
            />
            Contabilidad
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive(l.href)
                    ? "bg-blue-50 text-blue-700"
                    : "text-zinc-600 hover:bg-zinc-100"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin"
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                  isActive("/admin")
                    ? "bg-blue-50 text-blue-700"
                    : "text-zinc-600 hover:bg-zinc-100"
                )}
              >
                Admin
              </Link>
            )}
            <Link
              href="/configuracion"
              className={cn(
                "rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors",
                isActive("/configuracion")
                  ? "bg-blue-50 text-blue-700"
                  : "text-zinc-600 hover:bg-zinc-100"
              )}
            >
              Ajustes
            </Link>
            {loggedIn && (
              <span
                className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex"
                style={{ backgroundColor: `${user.color}1a`, color: user.color }}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: user.color }}
                />
                {user.name}
              </span>
            )}
            {loggedIn && (
              <form action={logout}>
                <button
                  type="submit"
                  className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                >
                  Salir
                </button>
              </form>
            )}
          </div>
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-200 bg-white md:hidden">
        <div className="grid grid-cols-5">
          {[
            { href: "/", label: "Inicio" },
            { href: "/facturas", label: "Facturas" },
            { href: "/facturas/nueva", label: "+", primary: true },
            { href: "/ingresos", label: "Ingresos" },
            { href: "/saldos", label: "Saldos" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium",
                l.primary
                  ? "text-blue-600"
                  : isActive(l.href)
                    ? "text-blue-700"
                    : "text-zinc-500"
              )}
            >
              <span
                className={cn(
                  l.primary
                    ? "flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-lg leading-none text-white"
                    : "text-base leading-none"
                )}
              >
                {l.label}
              </span>
              {!l.primary && <span>{l.label}</span>}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
