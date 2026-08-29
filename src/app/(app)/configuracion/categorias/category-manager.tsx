"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createCategory,
  updateCategory,
  toggleCategory,
} from "@/app/actions/categories";
import { Button, Card, Input, Select, cn } from "@/components/ui";

type Category = {
  id: string;
  name: string;
  color: string;
  type: string;
  isActive: boolean;
};

type CategoryType = "EXPENSE" | "INCOME" | "BOTH";

const typeLabels: Record<string, string> = {
  EXPENSE: "Gasto",
  INCOME: "Ingreso",
  BOTH: "Ambos",
};

const palette = [
  "#2563eb",
  "#f59e0b",
  "#8b5cf6",
  "#0ea5e9",
  "#22c55e",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#10b981",
  "#14b8a6",
  "#eab308",
  "#64748b",
];

export function CategoryManager({ categories }: { categories: Category[] }) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [color, setColor] = useState(palette[0]);
  const [type, setType] = useState<CategoryType>("EXPENSE");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState(palette[0]);
  const [editType, setEditType] = useState<CategoryType>("EXPENSE");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Ingresa un nombre");
      return;
    }
    setBusy(true);
    const result = await createCategory({ name, color, type });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Ocurrió un error");
      return;
    }
    setName("");
    router.refresh();
  }

  function startEdit(c: Category) {
    setEditingId(c.id);
    setEditName(c.name);
    setEditColor(c.color);
    setEditType(c.type as CategoryType);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setError(null);
    if (!editName.trim()) {
      setError("Ingresa un nombre");
      return;
    }
    setBusy(true);
    const result = await updateCategory(editingId, {
      name: editName,
      color: editColor,
      type: editType,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error ?? "Ocurrió un error");
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  async function handleToggle(id: string) {
    await toggleCategory(id);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm font-medium text-red-600">{error}</p>
      )}

      <Card title="Nueva categoría">
        <form
          onSubmit={handleAdd}
          className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end"
        >
          <div>
            <Input
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            {palette.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "h-6 w-6 rounded-full border-2 transition-transform",
                  color === c ? "scale-110 border-zinc-800" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
          </div>
          <Select
            value={type}
            onChange={(e) => setType(e.target.value as CategoryType)}
          >
            <option value="EXPENSE">Gasto</option>
            <option value="INCOME">Ingreso</option>
            <option value="BOTH">Ambos</option>
          </Select>
          <Button type="submit" disabled={busy}>
            Agregar
          </Button>
        </form>
      </Card>

      <Card title="Lista de categorías">
        <ul className="divide-y divide-zinc-100">
          {categories.map((c) =>
            editingId === c.id ? (
              <li key={c.id} className="py-2">
                <form
                  onSubmit={handleSaveEdit}
                  className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
                >
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <div className="flex items-center gap-1">
                    {palette.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setEditColor(col)}
                        className={cn(
                          "h-5 w-5 rounded-full border-2",
                          editColor === col
                            ? "border-zinc-800"
                            : "border-transparent"
                        )}
                        style={{ backgroundColor: col }}
                        aria-label={col}
                      />
                    ))}
                  </div>
                  <Select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as CategoryType)}
                  >
                    <option value="EXPENSE">Gasto</option>
                    <option value="INCOME">Ingreso</option>
                    <option value="BOTH">Ambos</option>
                  </Select>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={busy}>
                      Guardar
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setEditingId(null)}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </li>
            ) : (
              <li key={c.id} className="flex items-center gap-3 py-2">
                <span
                  className="inline-block h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      !c.isActive && "text-zinc-400 line-through"
                    )}
                  >
                    {c.name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {typeLabels[c.type] ?? c.type}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle(c.id)}
                  className="text-xs font-medium text-zinc-500 hover:text-zinc-700"
                >
                  {c.isActive ? "Desactivar" : "Activar"}
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(c)}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Editar
                </button>
              </li>
            )
          )}
        </ul>
      </Card>
    </div>
  );
}
