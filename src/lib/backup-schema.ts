import { z } from "zod";

const isoDate = z
  .string()
  .refine((s) => !Number.isNaN(Date.parse(s)), "Fecha inválida")
  .transform((s) => new Date(s));

const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  passwordHash: z.string(),
  color: z.string(),
  isDemo: z.boolean(),
  createdAt: isoDate,
});

const groupSchema = z.object({
  id: z.string(),
  name: z.string(),
  currency: z.string(),
  configured: z.boolean(),
  createdAt: isoDate,
});

const groupMemberSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  userId: z.string(),
  role: z.string(),
  status: z.string(),
  joinedAt: isoDate,
});

const categorySchema = z.object({
  id: z.string(),
  groupId: z.string(),
  name: z.string(),
  color: z.string(),
  type: z.string(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
  createdAt: isoDate,
});

const invoiceSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  date: isoDate,
  vendor: z.string().nullable(),
  notes: z.string().nullable(),
  isDemo: z.boolean(),
  paidById: z.string(),
  createdById: z.string(),
  createdAt: isoDate,
});

const invoiceLineSchema = z.object({
  id: z.string(),
  invoiceId: z.string(),
  description: z.string(),
  detail: z.string().nullable(),
  weight: z.string().nullable(),
  quantity: z.number().int(),
  unitPrice: z.number().int(),
  categoryId: z.string().nullable(),
  sortOrder: z.number().int(),
});

const lineAllocationSchema = z.object({
  id: z.string(),
  lineId: z.string(),
  userId: z.string(),
  percentage: z.number(),
});

const incomeSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  date: isoDate,
  description: z.string(),
  amount: z.number().int(),
  isDemo: z.boolean(),
  receivedById: z.string(),
  createdById: z.string(),
  categoryId: z.string().nullable(),
  createdAt: isoDate,
});

const incomeAllocationSchema = z.object({
  id: z.string(),
  incomeId: z.string(),
  userId: z.string(),
  percentage: z.number(),
});

const settlementSchema = z.object({
  id: z.string(),
  groupId: z.string(),
  fromUserId: z.string(),
  toUserId: z.string(),
  amount: z.number().int(),
  date: isoDate,
  note: z.string().nullable(),
  createdAt: isoDate,
});

export const backupSchema = z.object({
  version: z.number().int(),
  exportedAt: isoDate,
  users: z.array(userSchema),
  groups: z.array(groupSchema),
  groupMembers: z.array(groupMemberSchema),
  categories: z.array(categorySchema),
  invoices: z.array(invoiceSchema),
  invoiceLines: z.array(invoiceLineSchema),
  lineAllocations: z.array(lineAllocationSchema),
  incomes: z.array(incomeSchema),
  incomeAllocations: z.array(incomeAllocationSchema),
  settlements: z.array(settlementSchema),
});

export type BackupDataInput = z.infer<typeof backupSchema>;
