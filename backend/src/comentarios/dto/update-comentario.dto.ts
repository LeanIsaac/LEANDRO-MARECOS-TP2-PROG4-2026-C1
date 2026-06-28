import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateComentarioDto {
  @IsNotEmpty({ message: 'El contenido no puede estar vacío al modificar.' })
  @IsString()
  @MaxLength(200, {
    message: 'El comentario no puede superar los 200 caracteres.',
  })
  contenido!: string;
}
