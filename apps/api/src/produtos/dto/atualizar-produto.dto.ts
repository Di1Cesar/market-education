import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class AtualizarProdutoDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  priceCents?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
