import "server-only";
import {
  getMembers,
  getInvoices,
  getIncomes,
  getSettlements,
  type InvoiceDTO,
  type IncomeDTO,
  type SettlementDTO,
} from "@/lib/data";
import { monthKey } from "@/lib/format";
import {
  computeNetPositions,
  suggestSettlements,
  computeUserSummary,
  computeGroupTotals,
  type Expense,
  type IncomeRecord,
  type SettlementRecord,
} from "@/lib/calculations/balances";

export type LedgerMember = { id: string; name: string; color: string };

export type LedgerSummary = {
  member: LedgerMember;
  personalExpenses: number;
  personalIncome: number;
  sharedExpenseShare: number;
  sharedIncomeShare: number;
  individualBalance: number;
  sharedQuota: number;
  netTotal: number;
};

export type Ledger = {
  members: LedgerMember[];
  invoices: InvoiceDTO[];
  incomes: IncomeDTO[];
  settlements: SettlementDTO[];
  positions: Record<string, number>;
  transfers: { from: string; to: string; amount: number }[];
  totals: ReturnType<typeof computeGroupTotals>;
  summaries: LedgerSummary[];
};

export async function getLedger(month?: string): Promise<Ledger> {
  const [members, invoices, incomes, settlements] = await Promise.all([
    getMembers(),
    getInvoices(),
    getIncomes(),
    getSettlements(),
  ]);

  const filteredInvoices = month
    ? invoices.filter((i) => monthKey(i.date) === month)
    : invoices;
  const filteredIncomes = month
    ? incomes.filter((i) => monthKey(i.date) === month)
    : incomes;
  const filteredSettlements = month
    ? settlements.filter((s) => monthKey(s.date) === month)
    : settlements;

  const expenses: Expense[] = filteredInvoices.map((inv) => ({
    paidById: inv.paidById,
    lines: inv.lines.map((l) => ({
      amount: l.amount,
      allocations: l.allocations,
    })),
  }));

  const incomeRecords: IncomeRecord[] = filteredIncomes.map((i) => ({
    receivedById: i.receivedById,
    amount: i.amount,
    allocations: i.allocations,
  }));

  const settlementRecords: SettlementRecord[] = filteredSettlements.map((s) => ({
    fromUserId: s.fromUserId,
    toUserId: s.toUserId,
    amount: s.amount,
  }));

  const memberIds = members.map((m) => m.id);

  const positions = computeNetPositions(
    memberIds,
    expenses,
    incomeRecords,
    settlementRecords
  );
  const transfers = suggestSettlements(positions);
  const totals = computeGroupTotals(expenses, incomeRecords);
  const summaries: LedgerSummary[] = members.map((member) => ({
    member: { id: member.id, name: member.name, color: member.color },
    ...computeUserSummary(member.id, expenses, incomeRecords),
  }));

  return {
    members,
    invoices: filteredInvoices,
    incomes: filteredIncomes,
    settlements: filteredSettlements,
    positions,
    transfers,
    totals,
    summaries,
  };
}
