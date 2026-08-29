import {
  getMembers,
  getCategories,
  getCurrentUser,
  getCurrency,
} from "@/lib/data";
import { InvoiceForm } from "@/components/invoice-form";

export default async function NuevaFacturaPage() {
  const [members, categories, user, currency] = await Promise.all([
    getMembers(),
    getCategories("EXPENSE"),
    getCurrentUser(),
    getCurrency(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Nueva factura</h1>
      <InvoiceForm
        members={members.map(({ id, name, color }) => ({ id, name, color }))}
        categories={categories.map(({ id, name, color }) => ({ id, name, color }))}
        currentUserId={user.id}
        currency={currency}
      />
    </div>
  );
}
