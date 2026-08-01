import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class ItemVendaDto {
  @IsString()
  productId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CriarVendaDto {
  @IsArray()
  @ArrayMinSize(1, { message: "O carrinho está vazio." })
  @ValidateNested({ each: true })
  @Type(() => ItemVendaDto)
  items!: ItemVendaDto[];

  @IsInt()
  @Min(0)
  paidCents!: number;
}
