import { computeShares, type Allocation } from "./shares";

export type ExpenseLine = {
  amount: number;
  allocations: Allocation[];
};

export type Expense = {
  paidById: string;
  lines: ExpenseLine[];
};

export type IncomeRecord = {
  receivedById: string;
  amount: number;
  allocations: Allocation[];
};

export type SettlementRecord = {
  fromUserId: string;
  toUserId: string;
  amount: number;
};

export type Transfer = {
  from: string;
  to: string;
  amount: number;
};

/**
 * Posición neta por miembro.
 * Positiva => le deben dinero. Negativa => debe dinero.
 * La suma de todas las posiciones es siempre 0.
 */
export function computeNetPositions(
  memberIds: string[],
  expenses: Expense[],
  incomes: IncomeRecord[],
  settlements: SettlementRecord[]
): Record<string, number> {
  const pos: Record<string, number> = {};
  for (const id of memberIds) pos[id] = 0;

  for (const expense of expenses) {
    const total = expense.lines.reduce((s, l) => s + l.amount, 0);
    for (const line of expense.lines) {
      const shares = computeShares(line.amount, line.allocations);
      for (const [userId, share] of Object.entries(shares)) {
        pos[userId] -= share;
      }
    }
    pos[expense.paidById] += total;
  }

  for (const income of incomes) {
    pos[income.receivedById] -= income.amount;
    const shares = computeShares(income.amount, income.allocations);
    for (const [userId, share] of Object.entries(shares)) {
      pos[userId] += share;
    }
  }

  for (const s of settlements) {
    pos[s.fromUserId] += s.amount;
    pos[s.toUserId] -= s.amount;
  }

  return pos;
}

/**
 * Reduce posiciones netas a transferencias mínimas (quién paga a quién y cuánto).
 */
export function suggestSettlements(
  positions: Record<string, number>
): Transfer[] {
  const entries = Object.entries(positions)
    .map(([userId, value]) => ({ userId, value }))
    .filter((e) => Math.abs(e.value) > 0);

  const creditors = entries
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value);
  const debtors = entries
    .filter((e) => e.value < 0)
    .sort((a, b) => a.value - b.value);

  const transfers: Transfer[] = [];

  let i = 0;
  let j = 0;
  while (i < creditors.length && j < debtors.length) {
    const credit = creditors[i].value;
    const debt = -debtors[j].value;
    const amount = Math.min(credit, debt);

    transfers.push({ from: debtors[j].userId, to: creditors[i].userId, amount });

    creditors[i].value -= amount;
    debtors[j].value += amount;

    if (creditors[i].value <= 0) i++;
    if (debtors[j].value >= 0) j++;
  }

  return transfers;
}

export type UserSummary = {
  personalExpenses: number;
  personalIncome: number;
  sharedExpenseShare: number;
  sharedIncomeShare: number;
  individualBalance: number;
  sharedQuota: number;
  netTotal: number;
};

/**
 * Devuelve el id del miembro que cubre la línea completa (100%) o null
 * si la línea es compartida. El formulario siempre genera asignaciones
 * para todos los miembros (uno al 100% y el resto al 0%), por lo que la
 * personalidad se determina por el porcentaje, no por el número de filas.
 */
function personalOwnerId(allocs: Allocation[]): string | null {
  const full = allocs.find((a) => Math.abs(a.percentage - 100) < 0.001);
  return full ? full.userId : null;
}

function userShare(
  amount: number,
  allocs: Allocation[],
  userId: string
): number {
  return computeShares(amount, allocs)[userId] ?? 0;
}

export function computeUserSummary(
  memberId: string,
  expenses: Expense[],
  incomes: IncomeRecord[]
): UserSummary {
  let personalExpenses = 0;
  let sharedExpenseShare = 0;

  for (const expense of expenses) {
    for (const line of expense.lines) {
      const owner = personalOwnerId(line.allocations);
      if (owner !== null) {
        if (owner === memberId) {
          personalExpenses += line.amount;
        }
      } else {
        sharedExpenseShare += userShare(line.amount, line.allocations, memberId);
      }
    }
  }

  let personalIncome = 0;
  let sharedIncomeShare = 0;

  for (const income of incomes) {
    const owner = personalOwnerId(income.allocations);
    if (owner !== null) {
      if (owner === memberId) {
        personalIncome += income.amount;
      }
    } else {
      sharedIncomeShare += userShare(income.amount, income.allocations, memberId);
    }
  }

  const individualBalance = personalExpenses - personalIncome;
  const sharedQuota = sharedExpenseShare - sharedIncomeShare;
  const netTotal = individualBalance + sharedQuota;

  return {
    personalExpenses,
    personalIncome,
    sharedExpenseShare,
    sharedIncomeShare,
    individualBalance,
    sharedQuota,
    netTotal,
  };
}

export type GroupTotals = {
  sharedExpenses: number;
  sharedIncome: number;
  sharedBalance: number;
  totalExpenses: number;
  totalIncome: number;
};

export type MemberExpenseSummary = {
  personal: number;
  shared: number;
  total: number;
};

/**
 * Resumen de gastos por miembro: cuánto corresponde a cada uno como gasto
 * personal (líneas al 100%), como cuota de gastos compartidos y el total
 * gastado (personal + compartido).
 */
export function summarizeExpenses(
  memberIds: string[],
  expenses: Expense[]
): Record<string, MemberExpenseSummary> {
  const result: Record<string, MemberExpenseSummary> = {};
  for (const id of memberIds) {
    result[id] = { personal: 0, shared: 0, total: 0 };
  }

  for (const expense of expenses) {
    for (const line of expense.lines) {
      const owner = personalOwnerId(line.allocations);
      if (owner !== null && result[owner]) {
        result[owner].personal += line.amount;
        result[owner].total += line.amount;
      } else {
        for (const id of memberIds) {
          const share = userShare(line.amount, line.allocations, id);
          result[id].shared += share;
          result[id].total += share;
        }
      }
    }
  }

  return result;
}

export function computeGroupTotals(
  expenses: Expense[],
  incomes: IncomeRecord[]
): GroupTotals {
  let sharedExpenses = 0;
  let totalExpenses = 0;

  for (const expense of expenses) {
    for (const line of expense.lines) {
      totalExpenses += line.amount;
      if (personalOwnerId(line.allocations) === null) {
        sharedExpenses += line.amount;
      }
    }
  }

  let sharedIncome = 0;
  let totalIncome = 0;

  for (const income of incomes) {
    totalIncome += income.amount;
    if (personalOwnerId(income.allocations) === null) {
      sharedIncome += income.amount;
    }
  }

  return {
    sharedExpenses,
    sharedIncome,
    sharedBalance: sharedExpenses - sharedIncome,
    totalExpenses,
    totalIncome,
  };
}
