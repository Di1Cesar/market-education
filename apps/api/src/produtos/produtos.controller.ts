import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";
import { ProdutosService } from "./produtos.service";
import { CriarProdutoDto } from "./dto/criar-produto.dto";
import { AtualizarProdutoDto } from "./dto/atualizar-produto.dto";

@Controller("produtos")
export class ProdutosController {
  constructor(private readonly produtos: ProdutosService) {}

  @Get()
  listar() {
    return this.produtos.listar();
  }

  @Post()
  criar(@Body() dto: CriarProdutoDto) {
    return this.produtos.criar(dto);
  }

  @Patch(":id")
  atualizar(@Param("id") id: string, @Body() dto: AtualizarProdutoDto) {
    return this.produtos.atualizar(id, dto);
  }

  @Delete(":id")
  remover(@Param("id") id: string) {
    return this.produtos.remover(id);
  }
}
