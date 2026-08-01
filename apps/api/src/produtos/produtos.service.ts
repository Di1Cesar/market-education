import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CriarProdutoDto } from "./dto/criar-produto.dto";
import { AtualizarProdutoDto } from "./dto/atualizar-produto.dto";

@Injectable()
export class ProdutosService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.product.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
    });
  }

  criar(dto: CriarProdutoDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name.trim(),
        emoji: dto.emoji ?? "📦",
        priceCents: dto.priceCents,
        stock: dto.stock,
      },
    });
  }

  async atualizar(id: string, dto: AtualizarProdutoDto) {
    await this.garantirExiste(id);
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.emoji !== undefined ? { emoji: dto.emoji } : {}),
        ...(dto.priceCents !== undefined ? { priceCents: dto.priceCents } : {}),
        ...(dto.stock !== undefined ? { stock: dto.stock } : {}),
        ...(dto.active !== undefined ? { active: dto.active } : {}),
      },
    });
  }

  // Não apaga de verdade: marca inativo, para os cupons antigos continuarem
  // apontando para um produto que existe.
  async remover(id: string) {
    await this.garantirExiste(id);
    await this.prisma.product.update({ where: { id }, data: { active: false } });
    return { ok: true };
  }

  private async garantirExiste(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException("Produto não encontrado.");
  }
}
