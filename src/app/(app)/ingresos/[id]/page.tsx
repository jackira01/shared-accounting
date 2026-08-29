import { notFound } from "next/navigation";
import { getMembers, getCategories, getCurrentUser, getIncome } from "@/lib/data";
import { IncomeForm } from "@/components/income-form";

export default async function EditarIngresoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [income, members, categories, user] = await Promise.all([
    getIncome(id),
    getMembers(),
    getCategories("INCOME"),
    getCurrentUser(),
  ]);

  if (!income) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Editar ingreso</h1>
      <IncomeForm
        members={members.map(({ id: mid, name, color }) => ({ id: mid, name, color }))}
        categories={categories.map(({ id: cid, name, color }) => ({ id: cid, name, color }))}
        currentUserId={user.id}
        initial={{
          id: income.id,
          date: income.date,
          description: income.description,
          amount: income.amount,
          receivedById: income.receivedById,
          categoryId: income.categoryId,
          allocations: income.allocations,
        }}
      />
    </div>
  );
}
