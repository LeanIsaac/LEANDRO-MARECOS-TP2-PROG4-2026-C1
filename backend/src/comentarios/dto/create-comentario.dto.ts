import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateComentarioDto {
  @IsNotEmpty({ message: 'El contenido del comentario no puede estar vacío.' })
  @IsString({ message: 'El contenido debe ser una cadena de texto.' })
  @MaxLength(500, {
    message: 'El comentario no puede superar los 500 caracteres.',
  })
  contenido!: string;

  @IsNotEmpty({ message: 'El ID de la publicación es obligatorio.' })
  @IsString()
  publicacionId!: string;
}
