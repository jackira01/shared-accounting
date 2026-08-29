"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createInvoice,
  updateInvoice,
  searchProducts,
  type ProductSearchResult,
} from "@/app/actions/invoices";
import { computeShares } from "@/lib/calculations/shares";
import { formatMoney, toInputDate } from "@/lib/format";
import { Button, Card, Input, Label, Select, cn } from "@/components/ui";

export type MemberOption = { id: string; name: string; color: string };
export type CategoryOption = { id: string; name: string; color: string };

type AllocationState = { userId: string; percentage: string };

type LineState = {
  key: string;
  description: string;
  detail: string;
  weight: string;
  quantity: string;
  unitPrice: string;
  categoryId: string;
  allocations: AllocationState[];
};

type InvoiceFormProps = {
  members: MemberOption[];
  categories: CategoryOption[];
  currentUserId: string;
  currency?: string;
  initial?: {
    id: string;
    date: Date;
    vendor: string | null;
    notes: string | null;
    paidById: string;
    lines: {
      id: string;
      description: string;
      detail: string | null;
      weight: string | null;
      quantity: number;
      unitPrice: number;
      categoryId: string | null;
      allocations: { userId: string; percentage: number }[];
    }[];
  };
};

let keyCounter = 0;
function nextKey() {
  keyCounter += 1;
  return `line-${Date.now()}-${keyCounter}`;
}

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

function allocationSum(allocations: AllocationState[]): number {
  return allocations.reduce((s, a) => s + (parseFloat(a.percentage) || 0), 0);
}

function isFiftyFifty(split: AllocationState[]): boolean {
  const each = 100 / split.length;
  return split.every(
    (a) => Math.abs((parseFloat(a.percentage) || 0) - each) < 0.01
  );
}

function isOneHundred(split: AllocationState[], userId: string): boolean {
  const alloc = split.find((a) => a.userId === userId);
  return Boolean(alloc && (parseFloat(alloc.percentage) || 0) >= 99.999);
}

export function InvoiceForm({
  members,
  categories,
  currentUserId,
  currency = "COP",
  initial,
}: InvoiceFormProps) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const today = toInputDate(new Date());

  const [date, setDate] = useState(initial ? toInputDate(initial.date) : today);
  const [vendor, setVendor] = useState(initial?.vendor ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [paidById, setPaidById] = useState(initial?.paidById ?? currentUserId);
  const [defaultSplit, setDefaultSplit] = useState<AllocationState[]>(() =>
    fiftyFifty(members)
  );
  const [lines, setLines] = useState<LineState[]>(() => {
    if (initial) {
      return initial.lines.map((l) => ({
        key: nextKey(),
        description: l.description,
        detail: l.detail ?? "",
        weight: l.weight ?? "",
        quantity: String(l.quantity),
        unitPrice: String(l.unitPrice),
        categoryId: l.categoryId ?? "",
        allocations: members.map((m) => {
          const alloc = l.allocations.find((a) => a.userId === m.id);
          return { userId: m.id, percentage: String(alloc?.percentage ?? 0) };
        }),
      }));
    }
    return [newLine(defaultSplit)];
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchingKey, setSearchingKey] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const hasIncompleteLine = lines.some(
    (l) => l.description.trim() === "" || l.unitPrice.trim() === ""
  );

  function handleDescriptionChange(key: string, value: string) {
    updateLine(key, { description: value });

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = value.trim();
    if (!trimmed) {
      setSearchingKey(null);
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchingKey(key);
    setSearchLoading(true);
    debounceRef.current = setTimeout(async () => {
      const results = await searchProducts(trimmed);
      setSearchResults(results);
      setSearchLoading(false);
    }, 1500);
  }

  function selectProduct(key: string, product: ProductSearchResult) {
    updateLine(key, {
      description: product.description,
      categoryId: product.categoryId ?? "",
    });
    setSearchingKey(null);
    setSearchResults([]);
    setSearchLoading(false);
  }

  function newLine(split: AllocationState[]): LineState {
    return {
      key: nextKey(),
      description: "",
      detail: "",
      weight: "",
      quantity: "1",
      unitPrice: "",
      categoryId: "",
      allocations: split.map((a) => ({ ...a })),
    };
  }

  function addLine() {
    if (hasIncompleteLine) {
      setError(
        "Completa el artículo y el precio del producto actual antes de agregar otro."
      );
      return;
    }
    setLines((prev) => [newLine(defaultSplit), ...prev]);
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  function updateLine(key: string, patch: Partial<LineState>) {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l))
    );
  }

  function updateAllocation(
    key: string,
    userId: string,
    percentage: string
  ) {
    setLines((prev) =>
      prev.map((l) =>
        l.key === key
          ? {
              ...l,
              allocations: l.allocations.map((a) =>
                a.userId === userId ? { ...a, percentage } : a
              ),
            }
          : l
      )
    );
  }

  function applySplitToAll(split: AllocationState[]) {
    setDefaultSplit(split);
    setLines((prev) =>
      prev.map((l) => ({
        ...l,
        allocations: split.map((a) => ({ ...a })),
      }))
    );
  }

  function parseLine(l: LineState) {
    return {
      description: l.description.trim(),
      detail: l.detail.trim() || undefined,
      weight: l.weight.trim() || undefined,
      quantity: parseInt(l.quantity, 10) || 1,
      unitPrice: parseInt(l.unitPrice, 10) || 0,
      categoryId: l.categoryId || null,
      allocations: l.allocations.map((a) => ({
        userId: a.userId,
        percentage: parseFloat(a.percentage) || 0,
      })),
    };
  }

  const totals = useMemo(() => {
    let total = 0;
    const perMember: Record<string, number> = {};
    for (const m of members) perMember[m.id] = 0;

    for (const l of lines) {
      const quantity = parseInt(l.quantity, 10) || 0;
      const unitPrice = parseInt(l.unitPrice, 10) || 0;
      const amount = quantity * unitPrice;
      total += amount;
      const allocs = l.allocations.map((a) => ({
        userId: a.userId,
        percentage: parseFloat(a.percentage) || 0,
      }));
      const shares = computeShares(amount, allocs);
      for (const [uid, share] of Object.entries(shares)) {
        perMember[uid] = (perMember[uid] ?? 0) + share;
      }
    }

    return { total, perMember };
  }, [lines, members]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (lines.length === 0) {
      setError("Agrega al menos un producto");
      return;
    }

    for (const l of lines) {
      if (!l.description.trim()) {
        setError("Todos los productos deben tener descripción");
        return;
      }
      if (Math.abs(allocationSum(l.allocations) - 100) > 0.01) {
        setError(`La división de "${l.description}" debe sumar 100%`);
        return;
      }
    }

    const payload = {
      date,
      vendor,
      notes,
      paidById,
      lines: lines.map(parseLine),
    };

    setSubmitting(true);
    const result = initial
      ? await updateInvoice(initial.id, payload)
      : await createInvoice(payload);
    setSubmitting(false);

    if (result && !result.ok) {
      setError(result.error ?? "Ocurrió un error");
      return;
    }
    router.push("/facturas");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <Card title="Datos de la factura">
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
            <Label htmlFor="paidBy">Pagó</Label>
            <Select
              id="paidBy"
              value={paidById}
              onChange={(e) => setPaidById(e.target.value)}
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="vendor">Establecimiento / proveedor</Label>
            <Input
              id="vendor"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div>
            <Label htmlFor="notes">Notas</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional"
            />
          </div>
        </div>
      </Card>

      <Card title="División por defecto">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={isFiftyFifty(defaultSplit) ? "primary" : "secondary"}
            onClick={() => applySplitToAll(fiftyFifty(members))}
          >
            50/50
          </Button>
          {members.map((m) => (
            <Button
              key={m.id}
              type="button"
              variant={isOneHundred(defaultSplit, m.id) ? "primary" : "secondary"}
              onClick={() => applySplitToAll(oneHundred(m.id, members))}
            >
              100% {m.name}
            </Button>
          ))}
          <span className="text-xs text-zinc-500">
            Se aplica a todas las líneas. Ajusta cada línea si lo necesitas.
          </span>
        </div>
      </Card>

      <Card
        title="Productos"
        action={
          <Button type="button" variant="secondary" onClick={addLine}>
            Agregar producto
          </Button>
        }
      >
        <div className="space-y-3">
          {lines.map((line, index) => {
            const sum = allocationSum(line.allocations);
            const sumOk = Math.abs(sum - 100) <= 0.01;
            return (
              <div
                key={line.key}
                className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-zinc-500">
                    {index + 1}
                  </span>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(line.key)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_80px_130px_160px]">
                  <div className="relative">
                    <Input
                      placeholder="Artículo"
                      value={line.description}
                      autoComplete="off"
                      onChange={(e) =>
                        handleDescriptionChange(line.key, e.target.value)
                      }
                      onBlur={() => {
                        setSearchingKey((k) => (k === line.key ? null : k));
                        setSearchResults([]);
                      }}
                    />
                    {searchingKey === line.key &&
                      line.description.trim() && (
                        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg">
                          {searchLoading ? (
                            <p className="px-3 py-2 text-xs text-zinc-400">
                              Buscando…
                            </p>
                          ) : searchResults.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-zinc-400">
                              Sin resultados
                            </p>
                          ) : (
                            searchResults.map((product) => (
                              <button
                                key={product.description}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  selectProduct(line.key, product);
                                }}
                                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-zinc-700 hover:bg-blue-50"
                              >
                                <span className="truncate">
                                  {product.description}
                                </span>
                                {product.categoryName && (
                                  <span className="shrink-0 text-xs text-zinc-400">
                                    {product.categoryName}
                                  </span>
                                )}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                  </div>
                  <Input
                    type="number"
                    min={1}
                    placeholder="Cant."
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(line.key, { quantity: e.target.value })
                    }
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Precio"
                    value={line.unitPrice}
                    onChange={(e) =>
                      updateLine(line.key, { unitPrice: e.target.value })
                    }
                  />
                  <Select
                    value={line.categoryId}
                    onChange={(e) =>
                      updateLine(line.key, { categoryId: e.target.value })
                    }
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <Input
                    placeholder="Descripción (opcional)"
                    value={line.detail}
                    onChange={(e) =>
                      updateLine(line.key, { detail: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Peso (opcional)"
                    value={line.weight}
                    onChange={(e) =>
                      updateLine(line.key, { weight: e.target.value })
                    }
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-zinc-500">
                    División:
                  </span>
                  <Button
                    type="button"
                    variant={isFiftyFifty(line.allocations) ? "primary" : "ghost"}
                    className="px-2 py-1 text-xs"
                    onClick={() =>
                      updateLine(line.key, {
                        allocations: fiftyFifty(members),
                      })
                    }
                  >
                    50/50
                  </Button>
                  {members.map((m) => (
                    <Button
                      key={m.id}
                      type="button"
                      variant={
                        isOneHundred(line.allocations, m.id)
                          ? "primary"
                          : "ghost"
                      }
                      className="px-2 py-1 text-xs"
                      onClick={() =>
                        updateLine(line.key, {
                          allocations: oneHundred(m.id, members),
                        })
                      }
                    >
                      100% {m.name}
                    </Button>
                  ))}

                  {members.map((m) => {
                    const alloc = line.allocations.find(
                      (a) => a.userId === m.id
                    );
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
                          className="w-14 bg-transparent text-right text-xs focus:outline-none"
                          value={alloc?.percentage ?? "0"}
                          onChange={(e) =>
                            updateAllocation(
                              line.key,
                              m.id,
                              e.target.value
                            )
                          }
                        />
                        <span className="text-xs text-zinc-400">%</span>
                      </label>
                    );
                  })}

                  <span
                    className={cn(
                      "ml-auto text-xs font-medium",
                      sumOk ? "text-zinc-400" : "text-red-600"
                    )}
                  >
                    Suma: {sum.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}

          {lines.length === 0 && (
            <p className="text-sm text-zinc-500">
              No hay productos. Agrega uno para continuar.
            </p>
          )}
        </div>
      </Card>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-800">Total</span>
          <span className="text-lg font-semibold">
            {formatMoney(totals.total, currency)}
          </span>
        </div>
        <div className="mt-2 space-y-1">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-zinc-600">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: m.color }}
                />
                {m.name}
              </span>
              <span className="font-medium">
                {formatMoney(totals.perMember[m.id] ?? 0, currency)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Guardando..."
            : isEdit
              ? "Guardar cambios"
              : "Guardar factura"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/facturas")}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
