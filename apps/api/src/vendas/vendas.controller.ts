import { Body, Controller, Get, Post } from "@nestjs/common";
import { VendasService } from "./vendas.service";
import { CriarVendaDto } from "./dto/criar-venda.dto";

@Controller("vendas")
export class VendasController {
  constructor(private readonly vendas: VendasService) {}

  @Get()
  listar() {
    return this.vendas.listar();
  }

  @Post()
  finalizar(@Body() dto: CriarVendaDto) {
    return this.vendas.finalizar(dto);
  }
}
