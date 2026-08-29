import { redirect } from "next/navigation";
import {
  getCurrentMembership,
  getGroupConfig,
  getAllCategories,
} from "@/lib/data";
import { SetupWizard } from "./setup-wizard";
import { CategoryManager } from "@/app/(app)/configuracion/categorias/category-manager";

export default async function SetupPage() {
  const membership = await getCurrentMembership();
  if (!membership || membership.role !== "admin") redirect("/");

  const config = await getGroupConfig();
  if (config.configured) redirect("/");

  const categories = await getAllCategories();

  return (
    <div className="min-h-screen bg-zinc-100 p-4">
      <div className="mx-auto max-w-2xl space-y-6 py-8">
        <div>
          <h1 className="text-2xl font-semibold">Configuración inicial</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Personaliza tu grupo antes de empezar. Podrás cambiarlo más tarde en
            Ajustes.
          </p>
        </div>

        <SetupWizard currency={config.currency} />

        <CategoryManager
          categories={categories.map((c) => ({
            id: c.id,
            name: c.name,
            color: c.color,
            type: c.type,
            isActive: c.isActive,
          }))}
        />
      </div>
    </div>
  );
}
