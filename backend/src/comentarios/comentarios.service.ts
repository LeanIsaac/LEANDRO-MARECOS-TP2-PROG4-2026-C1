import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Comentario, ComentarioDocument } from './entities/comentario.schema';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateComentarioDto } from './dto/update-comentario.dto';

@Injectable()
export class ComentariosService {
  constructor(
    @InjectModel(Comentario.name)
    private comentarioModel: Model<ComentarioDocument>,
  ) {}

  // 1. CREAR COMENTARIO
  async crear(dto: CreateComentarioDto, usuarioId: string) {
    const nuevoComentario = new this.comentarioModel({
      contenido: dto.contenido,
      publicacionId: new Types.ObjectId(dto.publicacionId),
      usuarioId: new Types.ObjectId(usuarioId),
    });

    return (await nuevoComentario.save()).populate(
      'usuarioId',
      'nombre apellido nombreUsuario fotoPerfilUrl',
    );
  }

  // 2. LISTAR COMENTARIOS PAGINADOS DE UN POST
  async buscarPorPublicacion(
    publicacionId: string,
    limit: number = 10,
    offset: number = 0,
  ) {
    return this.comentarioModel
      .find({
        publicacionId: new Types.ObjectId(publicacionId),
        habilitado: true,
      })
      .populate('usuarioId', 'nombre apellido nombreUsuario fotoPerfilUrl')
      .sort({ createdAt: -1 }) // Los más recientes primero en la cascada
      .skip(offset)
      .limit(limit)
      .exec();
  }

  // 3. EDITAR COMENTARIO
  async modificar(id: string, dto: UpdateComentarioDto, usuarioId: string) {
    const comentario = await this.comentarioModel.findById(id);

    if (!comentario || !comentario.habilitado) {
      throw new NotFoundException('El comentario no existe.');
    }

    // Solo el dueño del comentario puede editar
    if (comentario.usuarioId.toString() !== usuarioId) {
      throw new UnauthorizedException(
        'No posees permisos para editar este comentario.',
      );
    }

    comentario.contenido = dto.contenido;
    comentario.modificado = true;

    return comentario.save();
  }

  // 4. ELIMINAR COMENTARIO
  async eliminar(id: string, usuarioId: string, rolUsuario: string) {
    const comentario = await this.comentarioModel.findById(id);

    if (!comentario || !comentario.habilitado) {
      throw new NotFoundException('El comentario no existe.');
    }

    // Solo el dueño o un administrador tienen permisos para dar de baja
    if (
      comentario.usuarioId.toString() !== usuarioId &&
      rolUsuario !== 'administrador'
    ) {
      throw new UnauthorizedException(
        'No tenés permisos para eliminar este comentario.',
      );
    }

    comentario.habilitado = false;
    await comentario.save();

    return { message: 'Comentario eliminado correctamente.' };
  }
}
