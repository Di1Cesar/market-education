import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { ProdutosModule } from "./produtos/produtos.module";
import { VendasModule } from "./vendas/vendas.module";

@Module({
  imports: [PrismaModule, ProdutosModule, VendasModule],
})
export class AppModule {}
