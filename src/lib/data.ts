import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { requireUserId, getSessionUserId } from "@/lib/dal";
import { monthKey } from "@/lib/format";
import type { Allocation } from "@/lib/calculations/shares";

export type MemberDTO = {
  id: string;
  name: string;
  color: string;
  email: string;
};

export type CategoryDTO = {
  id: string;
  name: string;
  color: string;
  type: string;
  isActive: boolean;
};

export type InvoiceLineDTO = {
  id: string;
  description: string;
  detail: string | null;
  weight: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  allocations: Allocation[];
};

export type InvoiceDTO = {
  id: string;
  date: Date;
  vendor: string | null;
  notes: string | null;
  paidById: string;
  paidByName: string;
  paidByColor: string;
  total: number;
  lines: InvoiceLineDTO[];
};

export type IncomeDTO = {
  id: string;
  date: Date;
  description: string;
  amount: number;
  receivedById: string;
  receivedByName: string;
  receivedByColor: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  allocations: Allocation[];
};

export type SettlementDTO = {
  id: string;
  date: Date;
  fromUserId: string;
  toUserId: string;
  fromName: string;
  toName: string;
  amount: number;
  note: string | null;
};

export const getCurrentUser = cache(async (): Promise<MemberDTO> => {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Usuario no encontrado");
  return { id: user.id, name: user.name, email: user.email, color: user.color };
});

export const getCurrentGroupId = cache(async (): Promise<string> => {
  const userId = await requireUserId();
  const membership = await prisma.groupMember.findFirst({
    where: { userId },
    select: { groupId: true },
  });
  if (!membership) throw new Error("El usuario no pertenece a ningún grupo");
  return membership.groupId;
});

export type MembershipInfo = {
  role: string;
  status: string;
  groupId: string;
};

export const getCurrentMembership = cache(async (): Promise<MembershipInfo | null> => {
  const sessionId = await getSessionUserId();
  if (!sessionId) return null;
  return prisma.groupMember.findFirst({
    where: { userId: sessionId },
    orderBy: { joinedAt: "asc" },
    select: { role: true, status: true, groupId: true },
  });
});

export type GroupConfig = {
  id: string;
  currency: string;
  configured: boolean;
};

export const getGroupConfig = cache(async (): Promise<GroupConfig> => {
  const groupId = await getCurrentGroupId();
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { id: true, currency: true, configured: true },
  });
  if (!group) throw new Error("Grupo no encontrado");
  return group;
});

export const getCurrency = cache(async (): Promise<string> => {
  const config = await getGroupConfig();
  return config.currency;
});

export const hasDemoData = cache(async (): Promise<boolean> => {
  const groupId = await getCurrentGroupId();
  const demoUser = await prisma.user.findFirst({
    where: { isDemo: true, memberships: { some: { groupId } } },
    select: { id: true },
  });
  if (demoUser) return true;
  const demoInvoice = await prisma.invoice.findFirst({
    where: { groupId, isDemo: true },
    select: { id: true },
  });
  if (demoInvoice) return true;
  const demoIncome = await prisma.income.findFirst({
    where: { groupId, isDemo: true },
    select: { id: true },
  });
  return Boolean(demoIncome);
});

export type MembershipDTO = {
  id: string;
  userId: string;
  name: string;
  email: string;
  color: string;
  role: string;
  status: string;
  joinedAt: Date;
};

export const getAllMemberships = cache(async (): Promise<MembershipDTO[]> => {
  const groupId = await getCurrentGroupId();
  const memberships = await prisma.groupMember.findMany({
    where: { groupId },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });
  return memberships.map((m) => ({
    id: m.id,
    userId: m.user.id,
    name: m.user.name,
    email: m.user.email,
    color: m.user.color,
    role: m.role,
    status: m.status,
    joinedAt: m.joinedAt,
  }));
});

export const getMembers = cache(async (): Promise<MemberDTO[]> => {
  const groupId = await getCurrentGroupId();
  const members = await prisma.groupMember.findMany({
    where: { groupId, status: "ACTIVE" },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });
  return members.map((m) => ({
    id: m.user.id,
    name: m.user.name,
    email: m.user.email,
    color: m.user.color,
  }));
});

export const getCategories = cache(
  async (type?: "EXPENSE" | "INCOME" | "BOTH"): Promise<CategoryDTO[]> => {
    const groupId = await getCurrentGroupId();
    const categories = await prisma.category.findMany({
      where: {
        groupId,
        isActive: true,
        ...(type === "BOTH"
          ? {}
          : type
            ? { type: { in: [type, "BOTH"] } }
            : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return categories.map((c) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      type: c.type,
      isActive: c.isActive,
    }));
  }
);

export const getAllCategories = cache(async (): Promise<CategoryDTO[]> => {
  const groupId = await getCurrentGroupId();
  const categories = await prisma.category.findMany({
    where: { groupId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    color: c.color,
    type: c.type,
    isActive: c.isActive,
  }));
});

export const getInvoices = cache(async (): Promise<InvoiceDTO[]> => {
  const groupId = await getCurrentGroupId();
  const invoices = await prisma.invoice.findMany({
    where: { groupId },
    include: {
      paidBy: true,
      lines: {
        include: { allocations: true, category: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { date: "desc" },
  });
  return invoices.map(toInvoiceDTO);
});

export const getAvailableMonths = cache(async (): Promise<string[]> => {
  const groupId = await getCurrentGroupId();
  const invoices = await prisma.invoice.findMany({
    where: { groupId },
    select: { date: true },
  });
  const months = new Set<string>();
  for (const inv of invoices) {
    months.add(monthKey(inv.date));
  }
  return Array.from(months).sort().reverse();
});

export const getInvoice = cache(
  async (id: string): Promise<InvoiceDTO | null> => {
    const groupId = await getCurrentGroupId();
    const invoice = await prisma.invoice.findFirst({
      where: { id, groupId },
      include: {
        paidBy: true,
        lines: {
          include: { allocations: true, category: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    return invoice ? toInvoiceDTO(invoice) : null;
  }
);

function toInvoiceDTO(invoice: {
  id: string;
  date: Date;
  vendor: string | null;
  notes: string | null;
  paidById: string;
  paidBy: { name: string; color: string };
  lines: {
    id: string;
    description: string;
    detail: string | null;
    weight: string | null;
    quantity: number;
    unitPrice: number;
    categoryId: string | null;
    category: { name: string; color: string } | null;
    allocations: { userId: string; percentage: number }[];
  }[];
}): InvoiceDTO {
  return {
    id: invoice.id,
    date: invoice.date,
    vendor: invoice.vendor,
    notes: invoice.notes,
    paidById: invoice.paidById,
    paidByName: invoice.paidBy.name,
    paidByColor: invoice.paidBy.color,
    total: invoice.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0),
    lines: invoice.lines.map((l) => ({
      id: l.id,
      description: l.description,
      detail: l.detail,
      weight: l.weight,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      amount: l.quantity * l.unitPrice,
      categoryId: l.categoryId,
      categoryName: l.category?.name ?? null,
      categoryColor: l.category?.color ?? null,
      allocations: l.allocations.map((a) => ({
        userId: a.userId,
        percentage: a.percentage,
      })),
    })),
  };
}

export const getIncomes = cache(async (): Promise<IncomeDTO[]> => {
  const groupId = await getCurrentGroupId();
  const incomes = await prisma.income.findMany({
    where: { groupId },
    include: {
      receivedBy: true,
      category: true,
      allocations: true,
    },
    orderBy: { date: "desc" },
  });
  return incomes.map((i) => ({
    id: i.id,
    date: i.date,
    description: i.description,
    amount: i.amount,
    receivedById: i.receivedById,
    receivedByName: i.receivedBy.name,
    receivedByColor: i.receivedBy.color,
    categoryId: i.categoryId,
    categoryName: i.category?.name ?? null,
    categoryColor: i.category?.color ?? null,
    allocations: i.allocations.map((a) => ({
      userId: a.userId,
      percentage: a.percentage,
    })),
  }));
});

export const getIncome = cache(async (id: string): Promise<IncomeDTO | null> => {
  const groupId = await getCurrentGroupId();
  const income = await prisma.income.findFirst({
    where: { id, groupId },
    include: { receivedBy: true, category: true, allocations: true },
  });
  if (!income) return null;
  return {
    id: income.id,
    date: income.date,
    description: income.description,
    amount: income.amount,
    receivedById: income.receivedById,
    receivedByName: income.receivedBy.name,
    receivedByColor: income.receivedBy.color,
    categoryId: income.categoryId,
    categoryName: income.category?.name ?? null,
    categoryColor: income.category?.color ?? null,
    allocations: income.allocations.map((a) => ({
      userId: a.userId,
      percentage: a.percentage,
    })),
  };
});

export const getSettlements = cache(async (): Promise<SettlementDTO[]> => {
  const groupId = await getCurrentGroupId();
  const settlements = await prisma.settlement.findMany({
    where: { groupId },
    include: { from: true, to: true },
    orderBy: { date: "desc" },
  });
  return settlements.map((s) => ({
    id: s.id,
    date: s.date,
    fromUserId: s.fromUserId,
    toUserId: s.toUserId,
    fromName: s.from.name,
    toName: s.to.name,
    amount: s.amount,
    note: s.note,
  }));
});
