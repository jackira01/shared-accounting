import Link from "next/link";
import { getIncomes, getCurrency } from "@/lib/data";
import { deleteIncome } from "@/app/actions/incomes";
import { formatMoney, formatDate } from "@/lib/format";
import { Card, Button, Input, Badge } from "@/components/ui";
import { DeleteButton } from "@/components/delete-button";

export default async function IngresosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const [incomes, currency] = await Promise.all([getIncomes(), getCurrency()]);

  const q = params.q?.trim().toLowerCase() ?? "";
  const from = params.from ? new Date(`${params.from}T00:00:00`) : null;
  const to = params.to ? new Date(`${params.to}T23:59:59`) : null;

  const filtered = incomes.filter((i) => {
    if (from && i.date < from) return false;
    if (to && i.date > to) return false;
    if (q && !i.description.toLowerCase().includes(q)) return false;
    return true;
  });

  const total = filtered.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Ingresos</h1>
        <Link href="/ingresos/nueva">
          <Button>Nuevo ingreso</Button>
        </Link>
      </div>

      <Card>
        <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
          <div>
            <Input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Buscar por descripción"
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

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <span className="text-sm font-medium text-zinc-600">
          Total del período:{" "}
        </span>
        <span className="font-semibold">{formatMoney(total, currency)}</span>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <p className="text-sm text-zinc-500">No hay ingresos que coincidan.</p>
        </Card>
      ) : (
        <ul className="space-y-2">
          {filtered.map((i) => (
            <li
              key={i.id}
              className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <Link href={`/ingresos/${i.id}`} className="min-w-0 hover:underline">
                  <p className="truncate font-semibold">{i.description}</p>
                  <p className="text-sm text-zinc-500">
                    {formatDate(i.date)}
                    {i.categoryName ? ` · ${i.categoryName}` : ""}
                  </p>
                </Link>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-semibold text-green-600">
                    +{formatMoney(i.amount, currency)}
                  </span>
                  <Badge color={i.receivedByColor}>
                    recibió {i.receivedByName}
                  </Badge>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 border-t border-zinc-100 pt-2">
                <Link
                  href={`/ingresos/${i.id}`}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Editar
                </Link>
                <DeleteButton action={deleteIncome.bind(null, i.id)} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
