import Link from "next/link";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { getCurrentUser, getCurrency } from "@/lib/data";
import { getLedger, type Ledger } from "@/lib/ledger";
import { formatMoney, formatDate } from "@/lib/format";
import { Card, Button, Badge } from "@/components/ui";
import {
  summarizeExpenses,
  computeGroupTotals,
  type Expense,
  type IncomeRecord,
} from "@/lib/calculations/balances";

function toExpenses(invoices: Ledger["invoices"]): Expense[] {
  return invoices.map((inv) => ({
    paidById: inv.paidById,
    lines: inv.lines.map((l) => ({
      amount: l.amount,
      allocations: l.allocations,
    })),
  }));
}

function toIncomes(incomes: Ledger["incomes"]): IncomeRecord[] {
  return incomes.map((i) => ({
    receivedById: i.receivedById,
    amount: i.amount,
    allocations: i.allocations,
  }));
}

export default async function DashboardPage() {
  const [user, ledger, currency] = await Promise.all([
    getCurrentUser(),
    getLedger(),
    getCurrency(),
  ]);

  const memberIds = ledger.members.map((m) => m.id);
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const monthInvoices = ledger.invoices.filter(
    (i) => i.date >= monthStart && i.date <= monthEnd
  );
  const monthIncomes = ledger.incomes.filter(
    (i) => i.date >= monthStart && i.date <= monthEnd
  );

  const monthTotals = computeGroupTotals(
    toExpenses(monthInvoices),
    toIncomes(monthIncomes)
  );

  const totalPerUser = summarizeExpenses(memberIds, toExpenses(ledger.invoices));

  const myPosition = ledger.positions[user.id] ?? 0;
  const memberNames = Object.fromEntries(
    ledger.members.map((m) => [m.id, m.name])
  );

  const activity = [
    ...ledger.invoices.map((i) => ({
      date: i.date,
      kind: "factura" as const,
      title: i.vendor || "Factura",
      detail: `${formatMoney(i.total, currency)} · pagó ${i.paidByName}`,
      href: `/facturas/${i.id}`,
    })),
    ...ledger.incomes.map((i) => ({
      date: i.date,
      kind: "ingreso" as const,
      title: i.description,
      detail: `${formatMoney(i.amount, currency)} · recibió ${i.receivedByName}`,
      href: `/ingresos/${i.id}`,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8);

  const metrics = [
    { label: "Gastos", total: ledger.totals.totalExpenses, month: monthTotals.totalExpenses },
    { label: "Ingresos", total: ledger.totals.totalIncome, month: monthTotals.totalIncome },
    { label: "Compartido", total: ledger.totals.sharedExpenses, month: monthTotals.sharedExpenses },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Resumen</h1>
          <p className="text-sm text-zinc-500">
            {format(new Date(), "MMMM yyyy", { locale: es })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/facturas/nueva">
            <Button>Nueva factura</Button>
          </Link>
          <Link href="/ingresos/nueva">
            <Button variant="secondary">Nuevo ingreso</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Tu posición">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-semibold ${
                myPosition > 0
                  ? "bg-green-50 text-green-600"
                  : myPosition < 0
                    ? "bg-red-50 text-red-600"
                    : "bg-zinc-100 text-zinc-500"
              }`}
            >
              {myPosition > 0 ? "+" : myPosition < 0 ? "−" : "0"}
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {myPosition > 0
                  ? `Te deben ${formatMoney(myPosition, currency)}`
                  : myPosition < 0
                    ? `Debes ${formatMoney(-myPosition, currency)}`
                    : "Están a mano"}
              </p>
              <p className="text-sm text-zinc-500">
                {myPosition === 0
                  ? "No hay deudas pendientes"
                  : "Resumen de deudas del grupo"}
              </p>
            </div>
          </div>
        </Card>

        <Card title="Quién debe a quién">
          {ledger.transfers.length === 0 ? (
            <p className="text-sm text-zinc-500">No hay deudas pendientes.</p>
          ) : (
            <ul className="space-y-2">
              {ledger.transfers.map((t) => (
                <li
                  key={`${t.from}-${t.to}`}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-zinc-700">
                    <span className="font-medium">{memberNames[t.from]}</span>{" "}
                    le debe a{" "}
                    <span className="font-medium">{memberNames[t.to]}</span>
                  </span>
                  <span className="font-semibold">{formatMoney(t.amount, currency)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/saldos"
            className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            Ver saldos completos
          </Link>
        </Card>
      </div>

      <Card title="Métricas (total y del mes)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-xs text-zinc-500">
                <th className="py-2 text-left font-medium">Métrica</th>
                <th className="py-2 text-right font-medium">Total</th>
                <th className="py-2 text-right font-medium">Este mes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {metrics.map((m) => (
                <tr key={m.label}>
                  <td className="py-2 text-zinc-700">{m.label}</td>
                  <td className="py-2 text-right">{formatMoney(m.total, currency)}</td>
                  <td className="py-2 text-right font-semibold">
                    {formatMoney(m.month, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card title="Gastos por persona">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 text-xs text-zinc-500">
                  <th className="py-2 text-left font-medium">Persona</th>
                  <th className="py-2 text-right font-medium">Personal</th>
                  <th className="py-2 text-right font-medium">Compartido</th>
                  <th className="py-2 text-right font-medium">Total gastado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {ledger.members.map((m) => {
                  const s = totalPerUser[m.id];
                  return (
                    <tr key={m.id}>
                      <td className="py-2">
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: m.color }}
                          />
                          <span className="font-medium">{m.name}</span>
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        {formatMoney(s.personal, currency)}
                      </td>
                      <td className="py-2 text-right">{formatMoney(s.shared, currency)}</td>
                      <td className="py-2 text-right font-semibold">
                        {formatMoney(s.total, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Actividad reciente">
          {activity.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Aún no hay movimientos registrados.
            </p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {activity.map((a, idx) => (
                <li key={idx} className="flex items-center gap-3 py-2">
                  <Badge color={a.kind === "factura" ? "#ef4444" : "#10b981"}>
                    {a.kind === "factura" ? "Gasto" : "Ingreso"}
                  </Badge>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(a.date)} · {a.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
