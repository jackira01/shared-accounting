import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PASSWORD = "casa2026";

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const [jack, primo] = await Promise.all([
    prisma.user.upsert({
      where: { email: "jack@casa.local" },
      update: {},
      create: {
        name: "Jack",
        email: "jack@casa.local",
        passwordHash,
        color: "#2563eb",
        isDemo: true,
      },
    }),
    prisma.user.upsert({
      where: { email: "primo@casa.local" },
      update: {},
      create: {
        name: "Primo",
        email: "primo@casa.local",
        passwordHash,
        color: "#f59e0b",
        isDemo: true,
      },
    }),
  ]);

  const group = await prisma.group.upsert({
    where: { id: "casa" },
    update: {},
    create: { id: "casa", name: "Casa", currency: "COP", configured: true },
  });

  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: jack.id } },
    update: {},
    create: { groupId: group.id, userId: jack.id, role: "admin", status: "ACTIVE" },
  });

  await prisma.groupMember.upsert({
    where: { groupId_userId: { groupId: group.id, userId: primo.id } },
    update: {},
    create: { groupId: group.id, userId: primo.id, role: "member", status: "ACTIVE" },
  });

  const categories: { name: string; color: string; type: string }[] = [
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

  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    const existing = await prisma.category.findFirst({
      where: { groupId: group.id, name: c.name },
    });
    if (!existing) {
      await prisma.category.create({
        data: { ...c, groupId: group.id, sortOrder: i },
      });
    }
  }

  const mercado = await prisma.category.findFirst({
    where: { groupId: group.id, name: "Mercado" },
  });
  const comida = await prisma.category.findFirst({
    where: { groupId: group.id, name: "Comida fuera" },
  });

  const hasDemo = await prisma.invoice.findFirst({
    where: { groupId: group.id, isDemo: true },
  });
  if (!hasDemo) {
    await prisma.invoice.create({
      data: {
        groupId: group.id,
        date: new Date("2026-08-10T12:00:00"),
        vendor: "Supermercado (ejemplo)",
        paidById: jack.id,
        createdById: jack.id,
        isDemo: true,
        lines: {
          create: [
            {
              description: "Leche",
              quantity: 2,
              unitPrice: 4500,
              categoryId: mercado?.id ?? null,
              sortOrder: 0,
              allocations: {
                create: [
                  { userId: jack.id, percentage: 50 },
                  { userId: primo.id, percentage: 50 },
                ],
              },
            },
            {
              description: "Arroz",
              quantity: 1,
              unitPrice: 5500,
              categoryId: mercado?.id ?? null,
              sortOrder: 1,
              allocations: {
                create: [
                  { userId: jack.id, percentage: 50 },
                  { userId: primo.id, percentage: 50 },
                ],
              },
            },
          ],
        },
      },
    });

    await prisma.invoice.create({
      data: {
        groupId: group.id,
        date: new Date("2026-08-15T12:00:00"),
        vendor: "Restaurante (ejemplo)",
        paidById: primo.id,
        createdById: primo.id,
        isDemo: true,
        lines: {
          create: [
            {
              description: "Almuerzo",
              quantity: 1,
              unitPrice: 18000,
              categoryId: comida?.id ?? null,
              sortOrder: 0,
              allocations: {
                create: [
                  { userId: primo.id, percentage: 100 },
                  { userId: jack.id, percentage: 0 },
                ],
              },
            },
          ],
        },
      },
    });

    await prisma.income.create({
      data: {
        groupId: group.id,
        date: new Date("2026-08-01T12:00:00"),
        description: "Salario (ejemplo)",
        amount: 2000000,
        receivedById: jack.id,
        createdById: jack.id,
        isDemo: true,
        allocations: {
          create: [
            { userId: jack.id, percentage: 50 },
            { userId: primo.id, percentage: 50 },
          ],
        },
      },
    });
  }

  console.log("Seed completado (datos de ejemplo).");
  console.log(`Usuarios: ${jack.email} / ${primo.email} (contraseña: ${PASSWORD})`);
  console.log(`Grupo: ${group.name} (id: ${group.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
