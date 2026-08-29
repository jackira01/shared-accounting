"use client";

import { useState } from "react";
import { completeSetup } from "@/app/actions/setup";
import { CURRENCIES } from "@/lib/format";
import { Button, Card, Label, Select } from "@/components/ui";

export function SetupWizard({ currency: initialCurrency }: { currency: string }) {
  const [currency, setCurrency] = useState(initialCurrency);
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    await completeSetup({ currency });
  }

  return (
    <Card title="Moneda">
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
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" onClick={finish} disabled={busy}>
          {busy ? "Guardando..." : "Guardar y continuar"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={finish}
          disabled={busy}
        >
          Configurar más tarde
        </Button>
      </div>
    </Card>
  );
}
