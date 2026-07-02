import { IsString, IsNumber, IsOptional, IsIn, Min } from 'class-validator'

export class UpdateProductoDto {
  @IsOptional() @IsString() nombre?: string
  @IsOptional() @IsString() slug?: string
  @IsOptional() @IsString() descripcion?: string
  @IsOptional() @IsNumber() @Min(0) precio?: number
  @IsOptional() @IsNumber() @Min(0) stock?: number
  @IsOptional() @IsString() categoria?: string
  @IsOptional() @IsString() imagen?: string
  @IsOptional() @IsIn(['Nuevo', 'Destacado', null]) badge?: string | null
}
