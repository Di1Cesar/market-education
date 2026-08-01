import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PRODUTOS = [
  { name: "MAÇÃ", emoji: "🍎", priceCents: 150, stock: 12 },
  { name: "BANANA", emoji: "🍌", priceCents: 100, stock: 15 },
  { name: "SUCO DE CAIXINHA", emoji: "🧃", priceCents: 300, stock: 10 },
  { name: "BOLACHA", emoji: "🍪", priceCents: 350, stock: 8 },
  { name: "PÃO", emoji: "🍞", priceCents: 100, stock: 20 },
  { name: "LEITE", emoji: "🥛", priceCents: 450, stock: 6 },
  { name: "PIPOCA", emoji: "🍿", priceCents: 250, stock: 10 },
  { name: "QUEIJO", emoji: "🧀", priceCents: 400, stock: 7 },
  { name: "ÁGUA", emoji: "💧", priceCents: 200, stock: 18 },
  { name: "LÁPIS", emoji: "✏️", priceCents: 175, stock: 25 },
  { name: "CADERNO", emoji: "📒", priceCents: 800, stock: 5 },
  { name: "URSINHO", emoji: "🧸", priceCents: 1200, stock: 4 },
];

async function main() {
  await prisma.saleItem.deleteMany();
  await prisma.sale.deleteMany();
  await prisma.product.deleteMany();
  await prisma.product.createMany({ data: PRODUTOS });
  console.log(`Prateleira abastecida com ${PRODUTOS.length} produtos.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
