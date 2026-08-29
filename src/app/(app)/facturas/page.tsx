import Link from "next/link";
import { getInvoices, getCurrency } from "@/lib/data";
import { deleteInvoice } from "@/app/actions/invoices";
import { formatMoney, formatDate } from "@/lib/format";
import { Card, Button, Input, Badge } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";

export default async function FacturasPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const [invoices, currency] = await Promise.all([getInvoices(), getCurrency()]);

  const q = params.q?.trim().toLowerCase() ?? "";
  const from = params.from ? new Date(`${params.from}T00:00:00`) : null;
  const to = params.to ? new Date(`${params.to}T23:59:59`) : null;

  const filtered = invoices.filter((inv) => {
    if (from && inv.date < from) return false;
    if (to && inv.date > to) return false;
    if (q) {
      const haystack = [
        inv.vendor ?? "",
        inv.notes ?? "",
        ...inv.lines.map((l) => l.description),
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Facturas</h1>
        <Link href="/facturas/nueva">
          <Button>Nueva factura</Button>
        </Link>
      </div>

      <Card>
        <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
          <div>
            <Input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Buscar por descripción o establecimiento"
            />
          </div>
          <div>
            <Input name="from" type="date" defaultValue={params.from ?? ""} />
          </div>
          <div>
            <Input name="to" type="date" defaultValue={params.to ?? ""} />
          </div>
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </form>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-500">No hay facturas que coincidan.</p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {filtered.map((inv) => (
            <li
              key={inv.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/facturas/${inv.id}`}
                  className="min-w-0 hover:underline"
                >
                  <p className="truncate font-semibold">
                    {inv.vendor || "Factura"}
                  </p>
                  <p className="text-sm text-zinc-500">
                    {formatDate(inv.date)} · {inv.lines.length} producto
                    {inv.lines.length !== 1 ? "s" : ""}
                  </p>
                </Link>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-semibold">{formatMoney(inv.total, currency)}</span>
                  <Badge color={inv.paidByColor}>pagó {inv.paidByName}</Badge>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 border-t border-zinc-100 pt-2">
                <Link
                  href={`/facturas/${inv.id}`}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Editar
                </Link>
                <DeleteButton action={deleteInvoice.bind(null, inv.id)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
