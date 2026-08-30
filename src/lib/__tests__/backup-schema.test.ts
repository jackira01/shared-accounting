import { describe, it, expect } from "vitest";
import { backupSchema } from "../backup-schema";

const valid = {
  version: 1,
  exportedAt: "2026-08-29T00:00:00.000Z",
  users: [
    {
      id: "u1",
      name: "Jack",
      email: "jack@casa.local",
      passwordHash: "hash",
      color: "#2563eb",
      isDemo: false,
      createdAt: "2026-08-01T00:00:00.000Z",
    },
  ],
  groups: [
    {
      id: "g1",
      name: "Casa",
      currency: "COP",
      configured: true,
      createdAt: "2026-08-01T00:00:00.000Z",
    },
  ],
  groupMembers: [
    {
      id: "m1",
      groupId: "g1",
      userId: "u1",
      role: "admin",
      status: "ACTIVE",
      joinedAt: "2026-08-01T00:00:00.000Z",
    },
  ],
  categories: [],
  invoices: [],
  invoiceLines: [],
  lineAllocations: [],
  incomes: [],
  incomeAllocations: [],
  settlements: [],
};

describe("backupSchema", () => {
  it("acepta un respaldo válido y convierte fechas", () => {
    const result = backupSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.users[0].createdAt).toBeInstanceOf(Date);
    }
  });

  it("rechaza un respaldo sin version", () => {
    const withoutVersion = { ...valid } as Record<string, unknown>;
    delete withoutVersion.version;
    expect(backupSchema.safeParse(withoutVersion).success).toBe(false);
  });

  it("rechaza una fecha inválida", () => {
    expect(
      backupSchema.safeParse({ ...valid, exportedAt: "no-es-fecha" }).success
    ).toBe(false);
  });

  it("rechaza una tabla faltante", () => {
    const withoutSettlements = { ...valid } as Record<string, unknown>;
    delete withoutSettlements.settlements;
    expect(backupSchema.safeParse(withoutSettlements).success).toBe(false);
  });
});
