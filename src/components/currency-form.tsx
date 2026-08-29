"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateCurrency } from "@/app/actions/setup";
import { CURRENCIES } from "@/lib/format";
import { Button, Label, Select } from "@/components/ui";

export function CurrencyForm({ currency: initialCurrency }: { currency: string }) {
  const router = useRouter();
  const [currency, setCurrency] = useState(initialCurrency);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setBusy(true);
    setMessage(null);
    const result = await updateCurrency({ currency });
    setBusy(false);
    if (!result.ok) {
      setMessage(result.error ?? "Ocurrió un error");
      return;
    }
    setMessage("Moneda actualizada");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="max-w-xs">
        <Label htmlFor="currency">Moneda del grupo</Label>
        <Select
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label} ({c.symbol})
            </option>
          ))}
        </Select>
      </div>
      {message && (
        <p className="text-sm font-medium text-green-600">{message}</p>
      )}
      <Button type="button" onClick={handleSave} disabled={busy}>
        {busy ? "Guardando..." : "Guardar"}
      </Button>
    </div>
  );
}
