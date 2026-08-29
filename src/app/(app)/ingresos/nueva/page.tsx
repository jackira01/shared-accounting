import { getMembers, getCategories, getCurrentUser } from "@/lib/data";
import { IncomeForm } from "@/components/income-form";

export default async function NuevoIngresoPage() {
  const [members, categories, user] = await Promise.all([
    getMembers(),
    getCategories("INCOME"),
    getCurrentUser(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Nuevo ingreso</h1>
      <IncomeForm
        members={members.map(({ id, name, color }) => ({ id, name, color }))}
        categories={categories.map(({ id, name, color }) => ({ id, name, color }))}
        currentUserId={user.id}
      />
    </div>
  );
}
