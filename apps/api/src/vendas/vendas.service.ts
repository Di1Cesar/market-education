import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma, Product } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CriarVendaDto } from "./dto/criar-venda.dto";

const reais = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

@Injectable()
export class VendasService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { items: true },
    });
  }

  /**
   * Checkout. Três regras que não podem ser quebradas:
   *   1. O total é calculado AQUI, nunca recebido do front.
   *   2. Baixar estoque e gravar a venda acontecem na mesma transação.
   *   3. Se faltar estoque, nada é gravado.
   */
  async finalizar(dto: CriarVendaDto) {
    const itens = dto.items.filter((i) => i.quantity > 0);
    if (itens.length === 0) {
      throw new BadRequestException("O carrinho está vazio.");
    }

    try {
      return await this.prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const produtos: Product[] = await tx.product.findMany({
            where: { id: { in: itens.map((i) => i.productId) }, active: true },
          });

          const linhas = itens.map((item) => {
            const p = produtos.find((x: Product) => x.id === item.productId);
            if (!p) throw new Error("Um dos produtos não está mais na prateleira.");
            if (p.stock < item.quantity) {
              throw new Error(`Só restam ${p.stock} de ${p.name} na prateleira.`);
            }
            return {
              productId: p.id,
              nameSnapshot: p.name,
              emojiSnapshot: p.emoji,
              unitPriceCents: p.priceCents,
              quantity: item.quantity,
              lineTotalCents: p.priceCents * item.quantity,
            };
          });

          const totalCents = linhas.reduce((s, l) => s + l.lineTotalCents, 0);
          const paidCents = dto.paidCents;
          if (paidCents < totalCents) {
            throw new Error(`Faltam ${reais(totalCents - paidCents)} para fechar a compra.`);
          }

          for (const l of linhas) {
            await tx.product.update({
              where: { id: l.productId },
              data: { stock: { decrement: l.quantity } },
            });
          }

          return tx.sale.create({
            data: {
              totalCents,
              paidCents,
              changeCents: paidCents - totalCents,
              items: { create: linhas },
            },
            include: { items: true },
          });
        },
      );
    } catch (e) {
      // A mensagem chega na tela da criança, então precisa ser gentil.
      throw new BadRequestException((e as Error).message);
    }
  }
}
