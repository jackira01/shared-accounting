"use client";

import { useState } from "react";
import { createSettlement } from "@/app/actions/settlements";
import { toInputDate } from "@/lib/format";
import { Button, Input, Label, Select } from "@/components/ui";

type MemberOption = { id: string; name: string };

export function SettlementForm({
  members,
  suggested,
}: {
  members: MemberOption[];
  suggested: { from: string; to: string; amount: number } | null;
}) {
  const [date, setDate] = useState(toInputDate(new Date()));
  const [fromUserId, setFromUserId] = useState(suggested?.from ?? "");
  const [toUserId, setToUserId] = useState(suggested?.to ?? "");
  const [amount, setAmount] = useState(
    suggested ? String(suggested.amount) : ""
  );
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const value = parseInt(amount, 10);
    if (!fromUserId || !toUserId) {
      setError("Selecciona quién paga y quién recibe");
      return;
    }
    if (fromUserId === toUserId) {
      setError("El origen y destino deben ser distintos");
      return;
    }
    if (!value || value <= 0) {
      setError("Ingresa un valor mayor a 0");
      return;
    }

    setSubmitting(true);
    const result = await createSettlement({
      date,
      fromUserId,
      toUserId,
      amount: value,
      note,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error ?? "Ocurrió un error");
      return;
    }

    setSuccess(true);
    setAmount("");
    setNote("");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <p className="text-sm font-medium text-red-600">{error}</p>
      )}
      {success && (
        <p className="text-sm font-medium text-green-600">
          Pago registrado correctamente
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="from">Quién paga</Label>
          <Select
            id="from"
            value={fromUserId}
            onChange={(e) => setFromUserId(e.target.value)}
          >
            <option value="">Selecciona...</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="to">Quién recibe</Label>
          <Select
            id="to"
            value={toUserId}
            onChange={(e) => setToUserId(e.target.value)}
          >
            <option value="">Selecciona...</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
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
          <Label htmlFor="date">Fecha</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="note">Nota (opcional)</Label>
        <Input
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <Button type="submit" disabled={submitting}>
        {submitting ? "Registrando..." : "Registrar pago"}
      </Button>
    </form>
  );
}
