import { notFound } from "next/navigation";
import {
  getMembers,
  getCategories,
  getCurrentUser,
  getInvoice,
  getCurrency,
} from "@/lib/data";
import { InvoiceForm } from "@/components/invoice-form";

export default async function EditarFacturaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [invoice, members, categories, user, currency] = await Promise.all([
    getInvoice(id),
    getMembers(),
    getCategories("EXPENSE"),
    getCurrentUser(),
    getCurrency(),
  ]);

  if (!invoice) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Editar factura</h1>
      <InvoiceForm
        members={members.map(({ id: mid, name, color }) => ({ id: mid, name, color }))}
        categories={categories.map(({ id: cid, name, color }) => ({ id: cid, name, color }))}
        currentUserId={user.id}
        currency={currency}
        initial={{
          id: invoice.id,
          date: invoice.date,
          vendor: invoice.vendor,
          notes: invoice.notes,
          paidById: invoice.paidById,
          lines: invoice.lines.map((l) => ({
            id: l.id,
            description: l.description,
            detail: l.detail,
            weight: l.weight,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            categoryId: l.categoryId,
            allocations: l.allocations,
          })),
        }}
      />
    </div>
  );
}
