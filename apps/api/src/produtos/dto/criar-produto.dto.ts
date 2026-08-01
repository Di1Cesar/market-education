import { IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CriarProdutoDto {
  @IsString()
  @MinLength(1, { message: "Escreva o nome do produto." })
  name!: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsInt({ message: "O preço deve ser um número inteiro em centavos." })
  @Min(1, { message: "Informe o preço de venda." })
  priceCents!: number;

  @IsInt()
  @Min(0, { message: "Informe o estoque." })
  stock!: number;
}
