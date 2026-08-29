"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentGroupId, getMembers } from "@/lib/data";
import { requireActiveMember } from "@/lib/dal";
import { parseInputDate } from "@/lib/format";
import { rankProducts, type ProductSuggestion } from "@/lib/search";
import { invoiceInputSchema, type InvoiceInput } from "@/lib/validators";

type ActionResult = { ok: boolean; error?: string };

export type ProductSearchResult = ProductSuggestion;

/**
 * Busca productos ya registrados en facturas del grupo, por similitud de
 * nombre. Devuelve los 7 primeros resultados más parecidos a la consulta.
 */
export async function searchProducts(
  query: string
): Promise<ProductSearchResult[]> {
  await requireActiveMember();
  const groupId = await getCurrentGroupId();

  const trimmed = query.trim();
  if (!trimmed) return [];

  const lines = await prisma.invoiceLine.findMany({
    where: { invoice: { groupId } },
    select: {
      description: true,
      categoryId: true,
      category: { select: { name: true } },
    },
  });

  const seen = new Map<string, ProductSearchResult>();
  for (const line of lines) {
    const key = line.description.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.set(key, {
      description: line.description.trim(),
      categoryId: line.categoryId,
      categoryName: line.category?.name ?? null,
    });
  }

  return rankProducts(trimmed, Array.from(seen.values()));
}

async function validateInvoice(data: InvoiceInput): Promise<string | null> {
  const memberIds = (await getMembers()).map((m) => m.id);
  if (!memberIds.includes(data.paidById)) return "Pagador inválido";
  for (const line of data.lines) {
    for (const a of line.allocations) {
      if (!memberIds.includes(a.userId)) return "Miembro inválido en la división";
    }
  }
  return null;
}

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/facturas");
  revalidatePath("/saldos");
  revalidatePath("/ingresos");
}

export async function createInvoice(input: InvoiceInput): Promise<ActionResult> {
  const userId = await requireActiveMember();
  const groupId = await getCurrentGroupId();

  const parsed = invoiceInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }
  const data = parsed.data;

  const memberError = await validateInvoice(data);
  if (memberError) return { ok: false, error: memberError };

  await prisma.invoice.create({
    data: {
      groupId,
      date: parseInputDate(data.date),
      vendor: data.vendor || null,
      notes: data.notes || null,
      paidById: data.paidById,
      createdById: userId,
      lines: {
        create: data.lines.map((line, i) => ({
          description: line.description,
          detail: line.detail || null,
          weight: line.weight || null,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          categoryId: line.categoryId || null,
          sortOrder: i,
          allocations: {
            create: line.allocations.map((a) => ({
              userId: a.userId,
              percentage: a.percentage,
            })),
          },
        })),
      },
    },
  });

  revalidateAll();
  redirect("/facturas");
}

export async function updateInvoice(
  id: string,
  input: InvoiceInput
): Promise<ActionResult> {
  await requireActiveMember();
  const groupId = await getCurrentGroupId();

  const parsed = invoiceInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }
  const data = parsed.data;

  const existing = await prisma.invoice.findFirst({ where: { id, groupId } });
  if (!existing) return { ok: false, error: "Factura no encontrada" };

  const memberError = await validateInvoice(data);
  if (memberError) return { ok: false, error: memberError };

  await prisma.$transaction([
    prisma.invoiceLine.deleteMany({ where: { invoiceId: id } }),
    prisma.invoice.update({
      where: { id },
      data: {
        date: parseInputDate(data.date),
        vendor: data.vendor || null,
        notes: data.notes || null,
        paidById: data.paidById,
        lines: {
          create: data.lines.map((line, i) => ({
            description: line.description,
            detail: line.detail || null,
            weight: line.weight || null,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            categoryId: line.categoryId || null,
            sortOrder: i,
            allocations: {
              create: line.allocations.map((a) => ({
                userId: a.userId,
                percentage: a.percentage,
              })),
            },
          })),
        },
      },
    }),
  ]);

  revalidateAll();
  redirect("/facturas");
}

export async function deleteInvoice(id: string): Promise<ActionResult> {
  await requireActiveMember();
  const groupId = await getCurrentGroupId();

  const existing = await prisma.invoice.findFirst({ where: { id, groupId } });
  if (!existing) return { ok: false, error: "Factura no encontrada" };

  await prisma.invoice.delete({ where: { id } });

  revalidateAll();
  return { ok: true };
}
