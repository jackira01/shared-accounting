import { describe, it, expect } from "vitest";
import { computeShares } from "../shares";
import {
  computeNetPositions,
  suggestSettlements,
  computeUserSummary,
  computeGroupTotals,
  summarizeExpenses,
  type Expense,
  type IncomeRecord,
} from "../balances";

const JACK = "jack";
const PRIMO = "primo";

describe("computeShares", () => {
  it("divide 50/50 exacto", () => {
    expect(computeShares(100, [{ userId: JACK, percentage: 50 }, { userId: PRIMO, percentage: 50 }])).toEqual({
      [JACK]: 50,
      [PRIMO]: 50,
    });
  });

  it("reparte el remanente para que la suma sea exacta", () => {
    const shares = computeShares(101, [
      { userId: JACK, percentage: 50 },
      { userId: PRIMO, percentage: 50 },
    ]);
    expect(shares[JACK] + shares[PRIMO]).toBe(101);
  });

  it("redondea tres vías y suma exacto", () => {
    const shares = computeShares(100, [
      { userId: "a", percentage: 33.33 },
      { userId: "b", percentage: 33.33 },
      { userId: "c", percentage: 33.34 },
    ]);
    expect(shares.a + shares.b + shares.c).toBe(100);
  });
});

describe("computeNetPositions (Caso 1 y 2 del plan)", () => {
  it("factura mixta pagada por Jack", () => {
    const expenses: Expense[] = [
      {
        paidById: JACK,
        lines: [
          { amount: 20000, allocations: [{ userId: JACK, percentage: 50 }, { userId: PRIMO, percentage: 50 }] },
          { amount: 30000, allocations: [{ userId: JACK, percentage: 60 }, { userId: PRIMO, percentage: 40 }] },
          { amount: 50000, allocations: [{ userId: JACK, percentage: 100 }] },
        ],
      },
    ];

    const positions = computeNetPositions([JACK, PRIMO], expenses, [], []);
    expect(positions[JACK]).toBe(22000);
    expect(positions[PRIMO]).toBe(-22000);
  });

  it("ingreso compartido recibido por Primo", () => {
    const incomes: IncomeRecord[] = [
      {
        receivedById: PRIMO,
        amount: 200000,
        allocations: [{ userId: JACK, percentage: 50 }, { userId: PRIMO, percentage: 50 }],
      },
    ];

    const positions = computeNetPositions([JACK, PRIMO], [], incomes, []);
    expect(positions[JACK]).toBe(100000);
    expect(positions[PRIMO]).toBe(-100000);
  });

  it("acumulado factura + ingreso", () => {
    const expenses: Expense[] = [
      {
        paidById: JACK,
        lines: [
          { amount: 20000, allocations: [{ userId: JACK, percentage: 50 }, { userId: PRIMO, percentage: 50 }] },
          { amount: 30000, allocations: [{ userId: JACK, percentage: 60 }, { userId: PRIMO, percentage: 40 }] },
          { amount: 50000, allocations: [{ userId: JACK, percentage: 100 }] },
        ],
      },
    ];
    const incomes: IncomeRecord[] = [
      {
        receivedById: PRIMO,
        amount: 200000,
        allocations: [{ userId: JACK, percentage: 50 }, { userId: PRIMO, percentage: 50 }],
      },
    ];

    const positions = computeNetPositions([JACK, PRIMO], expenses, incomes, []);
    expect(positions[JACK]).toBe(122000);
    expect(positions[PRIMO]).toBe(-122000);
  });

  it("settlement lleva las posiciones a cero", () => {
    const expenses: Expense[] = [
      {
        paidById: JACK,
        lines: [
          { amount: 20000, allocations: [{ userId: JACK, percentage: 50 }, { userId: PRIMO, percentage: 50 }] },
          { amount: 30000, allocations: [{ userId: JACK, percentage: 60 }, { userId: PRIMO, percentage: 40 }] },
          { amount: 50000, allocations: [{ userId: JACK, percentage: 100 }] },
        ],
      },
    ];
    const incomes: IncomeRecord[] = [
      {
        receivedById: PRIMO,
        amount: 200000,
        allocations: [{ userId: JACK, percentage: 50 }, { userId: PRIMO, percentage: 50 }],
      },
    ];

    const positions = computeNetPositions([JACK, PRIMO], expenses, incomes, [
      { fromUserId: PRIMO, toUserId: JACK, amount: 122000 },
    ]);
    expect(positions[JACK]).toBe(0);
    expect(positions[PRIMO]).toBe(0);
  });
});

describe("suggestSettlements", () => {
  it("genera una única transferencia para dos personas", () => {
    const transfers = suggestSettlements({ [JACK]: 122000, [PRIMO]: -122000 });
    expect(transfers).toEqual([{ from: PRIMO, to: JACK, amount: 122000 }]);
  });

  it("resuelve tres deudores/acreedores", () => {
    const positions = { a: 100, b: -60, c: -40 };
    const transfers = suggestSettlements(positions);
    const total = transfers.reduce((s, t) => s + t.amount, 0);
    expect(total).toBe(100);
    for (const t of transfers) expect(t.from).not.toBe(t.to);
  });
});

describe("computeUserSummary (Caso 5 del plan)", () => {
  it("balance individual + cuota compartida", () => {
    const expenses: Expense[] = [
      {
        paidById: JACK,
        lines: [
          { amount: 20000, allocations: [{ userId: JACK, percentage: 50 }, { userId: PRIMO, percentage: 50 }] },
          { amount: 30000, allocations: [{ userId: JACK, percentage: 60 }, { userId: PRIMO, percentage: 40 }] },
          { amount: 50000, allocations: [{ userId: JACK, percentage: 100 }, { userId: PRIMO, percentage: 0 }] },
        ],
      },
    ];
    const incomes: IncomeRecord[] = [
      {
        receivedById: PRIMO,
        amount: 200000,
        allocations: [{ userId: JACK, percentage: 50 }, { userId: PRIMO, percentage: 50 }],
      },
    ];

    const summary = computeUserSummary(JACK, expenses, incomes);
    expect(summary.personalExpenses).toBe(50000);
    expect(summary.sharedExpenseShare).toBe(28000);
    expect(summary.sharedIncomeShare).toBe(100000);
    expect(summary.individualBalance).toBe(50000);
    expect(summary.sharedQuota).toBe(28000 - 100000);
    expect(summary.netTotal).toBe(50000 + (28000 - 100000));
  });

  it("cuenta como personal una línea al 100% aunque existan filas al 0%", () => {
    const expenses: Expense[] = [
      {
        paidById: JACK,
        lines: [
          { amount: 40000, allocations: [{ userId: JACK, percentage: 100 }, { userId: PRIMO, percentage: 0 }] },
        ],
      },
    ];
    const summary = computeUserSummary(JACK, expenses, []);
    expect(summary.personalExpenses).toBe(40000);
    expect(summary.sharedExpenseShare).toBe(0);

    const primo = computeUserSummary(PRIMO, expenses, []);
    expect(primo.personalExpenses).toBe(0);
  });
});

describe("computeGroupTotals", () => {
  it("totaliza compartidos", () => {
    const expenses: Expense[] = [
      {
        paidById: JACK,
        lines: [
          { amount: 20000, allocations: [{ userId: JACK, percentage: 50 }, { userId: PRIMO, percentage: 50 }] },
          { amount: 50000, allocations: [{ userId: JACK, percentage: 100 }, { userId: PRIMO, percentage: 0 }] },
        ],
      },
    ];
    const totals = computeGroupTotals(expenses, []);
    expect(totals.sharedExpenses).toBe(20000);
    expect(totals.totalExpenses).toBe(70000);
  });
});

describe("summarizeExpenses", () => {
  it("reparte personal y compartido por miembro", () => {
    const expenses: Expense[] = [
      {
        paidById: JACK,
        lines: [
          { amount: 20000, allocations: [{ userId: JACK, percentage: 50 }, { userId: PRIMO, percentage: 50 }] },
          { amount: 50000, allocations: [{ userId: JACK, percentage: 100 }, { userId: PRIMO, percentage: 0 }] },
        ],
      },
    ];

    const summary = summarizeExpenses([JACK, PRIMO], expenses);

    expect(summary[JACK]).toEqual({ personal: 50000, shared: 10000, total: 60000 });
    expect(summary[PRIMO]).toEqual({ personal: 0, shared: 10000, total: 10000 });
  });

  it("devuelve ceros cuando no hay gastos", () => {
    const summary = summarizeExpenses([JACK, PRIMO], []);
    expect(summary[JACK].total).toBe(0);
    expect(summary[PRIMO].total).toBe(0);
  });
});
