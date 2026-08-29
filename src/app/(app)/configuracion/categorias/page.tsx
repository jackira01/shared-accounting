import { redirect } from "next/navigation";
import { getCurrentMembership, getAllCategories } from "@/lib/data";
import { CategoryManager } from "./category-manager";

export default async function CategoriasPage() {
  const membership = await getCurrentMembership();
  if (!membership || membership.role !== "admin") redirect("/");

  const categories = await getAllCategories();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Categorías</h1>
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
  );
}
