export type Allocation = {
  userId: string;
  percentage: number;
};

/**
 * Reparte un monto entero entre asignaciones porcentuales.
 * Redondea cada cuota al peso (piso) y reparte el remanente
 * uno a uno por la parte fraccionaria más grande, de modo que
 * la suma de cuotas sea exactamente igual al monto.
 */
export function computeShares(
  amount: number,
  allocations: Allocation[]
): Record<string, number> {
  const raws = allocations.map((a) => ({
    userId: a.userId,
    raw: (amount * a.percentage) / 100,
  }));

  const shares: Record<string, number> = {};
  for (const r of raws) {
    shares[r.userId] = Math.floor(r.raw);
  }

  let remainder = amount - raws.reduce((s, r) => s + Math.floor(r.raw), 0);

  const order = raws
    .map((r, i) => ({ i, frac: r.raw - Math.floor(r.raw) }))
    .sort((a, b) => b.frac - a.frac);

  for (let k = 0; k < order.length && remainder > 0; k++, remainder--) {
    shares[raws[order[k].i].userId] += 1;
  }

  return shares;
}
