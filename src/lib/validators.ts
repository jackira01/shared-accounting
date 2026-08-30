import { z } from "zod";

export const allocationSchema = z.object({
  userId: z.string().min(1),
  percentage: z.number().min(0).max(100),
});

export const lineInputSchema = z
  .object({
    id: z.string().optional(),
    description: z.string().min(1, { message: "Descripción requerida" }),
    detail: z.string().optional(),
    weight: z.string().optional(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().int().min(0),
    categoryId: z.string().nullable().optional(),
    allocations: z.array(allocationSchema).min(1),
  })
  .superRefine((val, ctx) => {
    const sum = val.allocations.reduce((s, a) => s + a.percentage, 0);
    if (Math.abs(sum - 100) > 0.01) {
      ctx.addIssue({
        code: "custom",
        message: "La suma de porcentajes debe ser 100%",
      });
    }
    const ids = new Set(val.allocations.map((a) => a.userId));
    if (ids.size !== val.allocations.length) {
      ctx.addIssue({
        code: "custom",
        message: "Usuario duplicado en la división",
      });
    }
  });

export const invoiceInputSchema = z.object({
  date: z.string().min(1),
  vendor: z.string().optional(),
  notes: z.string().optional(),
  paidById: z.string().min(1),
  lines: z.array(lineInputSchema).min(1),
});

export const incomeInputSchema = z
  .object({
    date: z.string().min(1),
    description: z.string().min(1, { message: "Descripción requerida" }),
    amount: z.number().int().min(0),
    receivedById: z.string().min(1),
    categoryId: z.string().nullable().optional(),
    allocations: z.array(allocationSchema).min(1),
  })
  .superRefine((val, ctx) => {
    const sum = val.allocations.reduce((s, a) => s + a.percentage, 0);
    if (Math.abs(sum - 100) > 0.01) {
      ctx.addIssue({
        code: "custom",
        message: "La suma de porcentajes debe ser 100%",
      });
    }
  });

export const settlementInputSchema = z.object({
  date: z.string().min(1),
  fromUserId: z.string().min(1),
  toUserId: z.string().min(1),
  amount: z.number().int().positive(),
  note: z.string().optional(),
});

export const categoryInputSchema = z.object({
  name: z.string().min(1, { message: "Nombre requerido" }),
  color: z.string().min(1),
  type: z.enum(["EXPENSE", "INCOME", "BOTH"]),
});

export const passwordInputSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, { message: "Mínimo 6 caracteres" }),
});

export const registerInputSchema = z
  .object({
    name: z.string().min(1, { message: "Nombre requerido" }),
    email: z.string().email({ message: "Email inválido" }),
    password: z.string().min(6, { message: "Mínimo 6 caracteres" }),
    confirmPassword: z.string().min(1, { message: "Confirma tu contraseña" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export const setupInputSchema = z.object({
  currency: z.string().min(1),
});

export type InvoiceInput = z.infer<typeof invoiceInputSchema>;
export type LineInput = z.infer<typeof lineInputSchema>;
export type IncomeInput = z.infer<typeof incomeInputSchema>;
export type SettlementInput = z.infer<typeof settlementInputSchema>;
export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
export type SetupInput = z.infer<typeof setupInputSchema>;
export type Allocation = z.infer<typeof allocationSchema>;
