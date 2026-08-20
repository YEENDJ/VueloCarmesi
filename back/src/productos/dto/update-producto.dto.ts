import {
  IsString, IsNumber, IsOptional, IsIn, IsArray, Min, MaxLength, ArrayMaxSize,
} from 'class-validator'
import { MAX_IMAGENES } from './create-producto.dto'

export class UpdateProductoDto {
  @IsOptional() @IsString() nombre?: string
  @IsOptional() @IsString() @MaxLength(200) descripcion?: string
  @IsOptional() @IsString() descripcionLarga?: string
  @IsOptional() @IsNumber() @Min(0) precio?: number
  @IsOptional() @IsNumber() @Min(0) stock?: number
  @IsOptional() @IsString() categoria?: string

  // `imagen` ya no se acepta: la deriva el service de imagenes[0]. Mandarla por
  // separado era la vía para que portada y galería terminaran desalineadas.
  @IsOptional() @IsArray() @IsString({ each: true }) @ArrayMaxSize(MAX_IMAGENES)
  imagenes?: string[]

  @IsOptional() @IsIn(['Nuevo', 'Destacado', null]) badge?: string | null
}
