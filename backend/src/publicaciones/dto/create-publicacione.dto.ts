import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreatePublicacioneDto {
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio.' })
  @MaxLength(100, { message: 'El título no puede superar los 100 caracteres.' })
  titulo!: string;

  @IsString()
  @IsNotEmpty({ message: 'La descripción de la publicación es obligatoria.' })
  descripcion!: string;

  //! fotoUrl' NO va acá porque el front manda el archivo binario,
  // y 'usuarioId' lo sacamos del JWT de forma segura en el controlador.
}
