import { getLedger } from "@/lib/ledger";
import { getAvailableMonths, getCurrency } from "@/lib/data";
import { deleteSettlement } from "@/app/actions/settlements";
import { formatMoney, formatDate, formatMonth } from "@/lib/format";
import { Card, Badge, Button, Select } from "@/components/ui";
import { SettlementForm } from "@/components/settlement-form";
import { DeleteButton } from "@/components/delete-button";

export default async function SaldosPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;
  const month = params.month?.trim() || undefined;
  const [ledger, availableMonths, currency] = await Promise.all([
    getLedger(month),
    getAvailableMonths(),
    getCurrency(),
  ]);

  const memberNames = Object.fromEntries(
    ledger.members.map((m) => [m.id, m.name])
  );

  const suggested =
    ledger.transfers.length > 0 ? ledger.transfers[0] : null;

  const totalGastado = ledger.totals.totalExpenses;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Saldos</h1>
        <form className="flex items-center gap-2">
          <Select name="month" defaultValue={month ?? ""}>
            <option value="">Todos los meses</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </form>
      </div>

      <Card
        title={
          month
            ? `Gastos de ${formatMonth(month)}`
            : "Gastos totales"
        }
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-600">
            Total gastado en el mes
          </span>
          <span className="text-lg font-semibold">
            {formatMoney(totalGastado, currency)}
          </span>
        </div>
        <ul className="mt-3 space-y-2 border-t border-zinc-100 pt-3">
          {ledger.summaries.map((s) => {
            const userTotal = s.personalExpenses + s.sharedExpenseShare;
            return (
              <li
                key={s.member.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-1.5 text-zinc-600">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: s.member.color }}
                  />
                  {s.member.name}
                </span>
                <span className="font-medium">
                  {formatMoney(userTotal, currency)}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {ledger.summaries.map((s) => (
          <Card key={s.member.id}>
            <div className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: s.member.color }}
              />
              <span className="font-semibold">{s.member.name}</span>
              <span className="ml-auto text-xs text-zinc-500">
                Neto total
              </span>
            </div>
            <p
              className={`mt-2 text-2xl font-semibold ${
                s.netTotal > 0 ? "text-green-600" : "text-zinc-900"
              }`}
            >
              {formatMoney(s.netTotal, currency)}
            </p>
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-zinc-500">Total gastado</span>
              <span className="font-medium">
                {formatMoney(s.personalExpenses + s.sharedExpenseShare, currency)}
              </span>
            </div>
            <dl className="mt-3 space-y-1 border-t border-zinc-100 pt-3 text-sm">
              <Row
                label="Gastos personales"
                value={formatMoney(s.personalExpenses, currency)}
              />
              <Row
                label="Ingresos personales"
                value={formatMoney(s.personalIncome, currency)}
              />
              <Row
                label="Balance individual"
                value={formatMoney(s.individualBalance, currency)}
              />
              <Row
                label="Cuota compartida"
                value={formatMoney(s.sharedQuota, currency)}
              />
              <Row
                label="Compartido (gastos)"
                value={formatMoney(s.sharedExpenseShare, currency)}
              />
              <Row
                label="Compartido (ingresos)"
                value={formatMoney(s.sharedIncomeShare, currency)}
              />
            </dl>
          </Card>
        ))}
      </div>

      <Card title="Quién debe a quién">
        {ledger.transfers.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No hay deudas pendientes. Todo está saldado.
          </p>
        ) : (
          <ul className="space-y-2">
            {ledger.transfers.map((t) => (
              <li
                key={`${t.from}-${t.to}`}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-zinc-700">
                  <span className="font-medium">{memberNames[t.from]}</span> le
                  debe a{" "}
                  <span className="font-medium">{memberNames[t.to]}</span>
                </span>
                <span className="font-semibold">{formatMoney(t.amount, currency)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Registrar pago">
        <SettlementForm
          members={ledger.members.map((m) => ({ id: m.id, name: m.name }))}
          suggested={suggested}
        />
      </Card>

      {ledger.settlements.length > 0 && (
        <Card title="Pagos registrados">
          <ul className="divide-y divide-zinc-100">
            {ledger.settlements.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-2">
                <Badge color="#10b981">Pago</Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-medium">{s.fromName}</span> pagó a{" "}
                    <span className="font-medium">{s.toName}</span>{" "}
                    {s.note ? `· ${s.note}` : ""}
                  </p>
                  <p className="text-xs text-zinc-500">{formatDate(s.date)}</p>
                </div>
                <span className="font-semibold">{formatMoney(s.amount, currency)}</span>
                <DeleteButton action={deleteSettlement.bind(null, s.id)} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
