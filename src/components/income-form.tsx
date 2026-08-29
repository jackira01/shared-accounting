"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createIncome, updateIncome } from "@/app/actions/incomes";
import { toInputDate } from "@/lib/format";
import { Button, Card, Input, Label, Select, cn } from "@/components/ui";

export type MemberOption = { id: string; name: string; color: string };
export type CategoryOption = { id: string; name: string; color: string };

type AllocationState = { userId: string; percentage: string };

type IncomeFormProps = {
  members: MemberOption[];
  categories: CategoryOption[];
  currentUserId: string;
  initial?: {
    id: string;
    date: Date;
    description: string;
    amount: number;
    receivedById: string;
    categoryId: string | null;
    allocations: { userId: string; percentage: number }[];
  };
};

function fiftyFifty(members: MemberOption[]): AllocationState[] {
  const each = 100 / members.length;
  return members.map((m) => ({
    userId: m.id,
    percentage: String(Number(each.toFixed(2))),
  }));
}

function oneHundred(userId: string, members: MemberOption[]): AllocationState[] {
  return members.map((m) => ({
    userId: m.id,
    percentage: m.id === userId ? "100" : "0",
  }));
}

export function IncomeForm({
  members,
  categories,
  currentUserId,
  initial,
}: IncomeFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [date, setDate] = useState(initial ? toInputDate(initial.date) : toInputDate(new Date()));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [receivedById, setReceivedById] = useState(
    initial?.receivedById ?? currentUserId
  );
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [allocations, setAllocations] = useState<AllocationState[]>(() => {
    if (initial) {
      return members.map((m) => {
        const alloc = initial.allocations.find((a) => a.userId === m.id);
        return { userId: m.id, percentage: String(alloc?.percentage ?? 0) };
      });
    }
    return fiftyFifty(members);
  });

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sum = allocations.reduce(
    (s, a) => s + (parseFloat(a.percentage) || 0),
    0
  );
  const sumOk = Math.abs(sum - 100) <= 0.01;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError("Ingresa una descripción");
      return;
    }
    if (!sumOk) {
      setError("La suma de porcentajes debe ser 100%");
      return;
    }

    const payload = {
      date,
      description: description.trim(),
      amount: parseInt(amount, 10) || 0,
      receivedById,
      categoryId: categoryId || null,
      allocations: allocations.map((a) => ({
        userId: a.userId,
        percentage: parseFloat(a.percentage) || 0,
      })),
    };

    setSubmitting(true);
    const result = initial
      ? await updateIncome(initial.id, payload)
      : await createIncome(payload);
    setSubmitting(false);

    if (result && !result.ok) {
      setError(result.error ?? "Ocurrió un error");
      return;
    }
    router.push("/ingresos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <Card title="Datos del ingreso">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="amount">Valor (COP)</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="receivedBy">Lo recibió</Label>
            <Select
              id="receivedBy"
              value={receivedById}
              onChange={(e) => setReceivedById(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <Card title="División">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setAllocations(fiftyFifty(members))}
          >
            50/50
          </Button>
          {members.map((m) => (
            <Button
              key={m.id}
              type="button"
              variant="secondary"
              onClick={() => setAllocations(oneHundred(m.id, members))}
            >
              100% {m.name}
            </Button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {members.map((m) => {
            const alloc = allocations.find((a) => a.userId === m.id);
            return (
              <label
                key={m.id}
                className="flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-2 py-1"
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: m.color }}
                />
                <span className="text-xs">{m.name}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  className="w-16 bg-transparent text-right text-sm focus:outline-none"
                  value={alloc?.percentage ?? "0"}
                  onChange={(e) =>
                    setAllocations((prev) =>
                      prev.map((a) =>
                        a.userId === m.id
                          ? { ...a, percentage: e.target.value }
                          : a
                      )
                    )
                  }
                />
                <span className="text-xs text-zinc-400">%</span>
              </label>
            );
          })}
          <span
            className={cn(
              "text-xs font-medium",
              sumOk ? "text-zinc-400" : "text-red-600"
            )}
          >
            Suma: {sum.toFixed(2)}%
          </span>
        </div>
      </Card>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Guardando..."
            : isEdit
              ? "Guardar cambios"
              : "Guardar ingreso"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/ingresos")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
