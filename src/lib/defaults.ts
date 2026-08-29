import { prisma } from "@/lib/db";

export const DEFAULT_CATEGORIES: {
  name: string;
  color: string;
  type: string;
}[] = [
  { name: "Vivienda", color: "#8b5cf6", type: "EXPENSE" },
  { name: "Servicios", color: "#0ea5e9", type: "EXPENSE" },
  { name: "Mercado", color: "#22c55e", type: "EXPENSE" },
  { name: "Comida fuera", color: "#f97316", type: "EXPENSE" },
  { name: "Transporte", color: "#eab308", type: "EXPENSE" },
  { name: "Salud", color: "#ef4444", type: "EXPENSE" },
  { name: "Ocio", color: "#ec4899", type: "EXPENSE" },
  { name: "Otros gastos", color: "#6b7280", type: "EXPENSE" },
  { name: "Salario", color: "#10b981", type: "INCOME" },
  { name: "Ventas", color: "#14b8a6", type: "INCOME" },
  { name: "Otros ingresos", color: "#64748b", type: "INCOME" },
];

export async function seedDefaultCategories(groupId: string) {
  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    const c = DEFAULT_CATEGORIES[i];
    const existing = await prisma.category.findFirst({
      where: { groupId, name: c.name },
    });
    if (!existing) {
      await prisma.category.create({
        data: { ...c, groupId, sortOrder: i },
      });
    }
  }
}
