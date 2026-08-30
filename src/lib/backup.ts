import "server-only";
import { prisma } from "@/lib/db";

export type BackupUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  color: string;
  isDemo: boolean;
  createdAt: Date;
};

export type BackupGroup = {
  id: string;
  name: string;
  currency: string;
  configured: boolean;
  createdAt: Date;
};

export type BackupGroupMember = {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  status: string;
  joinedAt: Date;
};

export type BackupCategory = {
  id: string;
  groupId: string;
  name: string;
  color: string;
  type: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
};

export type BackupInvoice = {
  id: string;
  groupId: string;
  date: Date;
  vendor: string | null;
  notes: string | null;
  isDemo: boolean;
  paidById: string;
  createdById: string;
  createdAt: Date;
};

export type BackupInvoiceLine = {
  id: string;
  invoiceId: string;
  description: string;
  detail: string | null;
  weight: string | null;
  quantity: number;
  unitPrice: number;
  categoryId: string | null;
  sortOrder: number;
};

export type BackupLineAllocation = {
  id: string;
  lineId: string;
  userId: string;
  percentage: number;
};

export type BackupIncome = {
  id: string;
  groupId: string;
  date: Date;
  description: string;
  amount: number;
  isDemo: boolean;
  receivedById: string;
  createdById: string;
  categoryId: string | null;
  createdAt: Date;
};

export type BackupIncomeAllocation = {
  id: string;
  incomeId: string;
  userId: string;
  percentage: number;
};

export type BackupSettlement = {
  id: string;
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  date: Date;
  note: string | null;
  createdAt: Date;
};

export type BackupData = {
  version: number;
  exportedAt: Date;
  users: BackupUser[];
  groups: BackupGroup[];
  groupMembers: BackupGroupMember[];
  categories: BackupCategory[];
  invoices: BackupInvoice[];
  invoiceLines: BackupInvoiceLine[];
  lineAllocations: BackupLineAllocation[];
  incomes: BackupIncome[];
  incomeAllocations: BackupIncomeAllocation[];
  settlements: BackupSettlement[];
};

export async function exportAllData(): Promise<BackupData> {
  const [
    users,
    groups,
    groupMembers,
    categories,
    invoices,
    invoiceLines,
    lineAllocations,
    incomes,
    incomeAllocations,
    settlements,
  ] = await Promise.all([
    prisma.user.findMany(),
    prisma.group.findMany(),
    prisma.groupMember.findMany(),
    prisma.category.findMany(),
    prisma.invoice.findMany(),
    prisma.invoiceLine.findMany(),
    prisma.lineAllocation.findMany(),
    prisma.income.findMany(),
    prisma.incomeAllocation.findMany(),
    prisma.settlement.findMany(),
  ]);

  return {
    version: 1,
    exportedAt: new Date(),
    users: users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      passwordHash: u.passwordHash,
      color: u.color,
      isDemo: u.isDemo,
      createdAt: u.createdAt,
    })),
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      currency: g.currency,
      configured: g.configured,
      createdAt: g.createdAt,
    })),
    groupMembers: groupMembers.map((m) => ({
      id: m.id,
      groupId: m.groupId,
      userId: m.userId,
      role: m.role,
      status: m.status,
      joinedAt: m.joinedAt,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      groupId: c.groupId,
      name: c.name,
      color: c.color,
      type: c.type,
      isActive: c.isActive,
      sortOrder: c.sortOrder,
      createdAt: c.createdAt,
    })),
    invoices: invoices.map((i) => ({
      id: i.id,
      groupId: i.groupId,
      date: i.date,
      vendor: i.vendor,
      notes: i.notes,
      isDemo: i.isDemo,
      paidById: i.paidById,
      createdById: i.createdById,
      createdAt: i.createdAt,
    })),
    invoiceLines: invoiceLines.map((l) => ({
      id: l.id,
      invoiceId: l.invoiceId,
      description: l.description,
      detail: l.detail,
      weight: l.weight,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      categoryId: l.categoryId,
      sortOrder: l.sortOrder,
    })),
    lineAllocations: lineAllocations.map((a) => ({
      id: a.id,
      lineId: a.lineId,
      userId: a.userId,
      percentage: a.percentage,
    })),
    incomes: incomes.map((i) => ({
      id: i.id,
      groupId: i.groupId,
      date: i.date,
      description: i.description,
      amount: i.amount,
      isDemo: i.isDemo,
      receivedById: i.receivedById,
      createdById: i.createdById,
      categoryId: i.categoryId,
      createdAt: i.createdAt,
    })),
    incomeAllocations: incomeAllocations.map((a) => ({
      id: a.id,
      incomeId: a.incomeId,
      userId: a.userId,
      percentage: a.percentage,
    })),
    settlements: settlements.map((s) => ({
      id: s.id,
      groupId: s.groupId,
      fromUserId: s.fromUserId,
      toUserId: s.toUserId,
      amount: s.amount,
      date: s.date,
      note: s.note,
      createdAt: s.createdAt,
    })),
  };
}

/**
 * Restaura un respaldo completo: borra todo y recrea desde `data`.
 * Se ejecuta dentro de una transacción en orden FK-seguro.
 */
export async function restoreData(data: BackupData): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // 1. Borrado en orden seguro (las relaciones con Cascade se limpian solas).
    await tx.settlement.deleteMany({});
    await tx.invoice.deleteMany({});
    await tx.income.deleteMany({});
    await tx.groupMember.deleteMany({});
    await tx.category.deleteMany({});
    await tx.user.deleteMany({});
    await tx.group.deleteMany({});

    // 2. Recrear tablas planas con sus IDs originales.
    for (const g of data.groups) await tx.group.create({ data: g });
    for (const u of data.users) await tx.user.create({ data: u });
    for (const m of data.groupMembers) await tx.groupMember.create({ data: m });
    for (const c of data.categories) await tx.category.create({ data: c });
    for (const s of data.settlements) await tx.settlement.create({ data: s });

    // 3. Facturas con líneas y asignaciones anidadas.
    for (const inv of data.invoices) {
      const lines = data.invoiceLines.filter((l) => l.invoiceId === inv.id);
      await tx.invoice.create({
        data: {
          id: inv.id,
          groupId: inv.groupId,
          date: inv.date,
          vendor: inv.vendor,
          notes: inv.notes,
          isDemo: inv.isDemo,
          paidById: inv.paidById,
          createdById: inv.createdById,
          createdAt: inv.createdAt,
          lines: {
            create: lines.map((l) => ({
              id: l.id,
              description: l.description,
              detail: l.detail,
              weight: l.weight,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              categoryId: l.categoryId,
              sortOrder: l.sortOrder,
              allocations: {
                create: data.lineAllocations
                  .filter((a) => a.lineId === l.id)
                  .map((a) => ({
                    id: a.id,
                    userId: a.userId,
                    percentage: a.percentage,
                  })),
              },
            })),
          },
        },
      });
    }

    // 4. Ingresos con asignaciones anidadas.
    for (const inc of data.incomes) {
      await tx.income.create({
        data: {
          id: inc.id,
          groupId: inc.groupId,
          date: inc.date,
          description: inc.description,
          amount: inc.amount,
          isDemo: inc.isDemo,
          receivedById: inc.receivedById,
          createdById: inc.createdById,
          categoryId: inc.categoryId,
          createdAt: inc.createdAt,
          allocations: {
            create: data.incomeAllocations
              .filter((a) => a.incomeId === inc.id)
              .map((a) => ({
                id: a.id,
                userId: a.userId,
                percentage: a.percentage,
              })),
          },
        },
      });
    }
  });
}
