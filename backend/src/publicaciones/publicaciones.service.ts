import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Publicacion,
  PublicacionDocument,
} from './entities/publicacion.schema';
import { CreatePublicacioneDto } from './dto/create-publicacione.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class PublicacionesService {
  constructor(
    @InjectModel(Publicacion.name)
    private publicacionModel: Model<PublicacionDocument>,
    private cloudinaryService: CloudinaryService,
  ) {}

  // ALTA
  async crear(
    dto: CreatePublicacioneDto,
    usuarioId: string,
    foto?: { buffer: Buffer; originalname?: string },
  ) {
    let fotoUrl: string | undefined;

    if (foto && foto.buffer) {
      try {
        const resultado = await this.cloudinaryService.uploadImage({
          buffer: foto.buffer,
          originalname: foto.originalname,
        });
        fotoUrl = resultado.secure_url;
      } catch (error) {
        throw new BadRequestException(
          'No se pudo guardar la imagen de la publicación.',
        );
      }
    }

    const nuevaPublicacion = new this.publicacionModel({
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      fotoUrl: fotoUrl,
      usuarioId: new Types.ObjectId(usuarioId),
    });

    return nuevaPublicacion.save();
  }

  // (Paginación, Filtro, Ordenamiento)
  async buscarTodas(
    orden: 'fecha' | 'likes',
    usuarioIdFiltrar?: string,
    limit: number = 10,
    offset: number = 0,
  ) {
    // Objeto de condiciones base: Solo traemos las que pasaron por alta (habilitada: true)
    const query: any = { habilitada: true };

    // Si el front nos pide filtrar por un usuario específico (por ejemplo, en "Mi Perfil")
    if (usuarioIdFiltrar) {
      query.usuarioId = new Types.ObjectId(usuarioIdFiltrar);
    }

    // Definimos el criterio de ordenamiento dinámico
    let sortCriteria: any = { createdAt: -1 }; // Por defecto: fecha descendente
    if (orden === 'likes') {
      // Ordena de manera descendente según el tamaño (cantidad de elementos) del array de likes
      sortCriteria = { likes: -1 };
    }

    return this.publicacionModel
      .find(query)
      .populate('usuarioId', 'nombre apellido nombreUsuario fotoPerfilUrl') // Trae los datos del creador
      .sort(sortCriteria)
      .skip(offset) // Desplazamiento (Paginación)
      .limit(limit) // Cantidad de registros (Paginación)
      .exec();
  }

  // BAJA LÓGICA (Solo Dueño o Administrador)
  async bajaLogica(
    publicacionId: string,
    usuarioId: string,
    rolUsuario: string,
  ) {
    const publicacion = await this.publicacionModel.findById(publicacionId);

    if (!publicacion) {
      throw new NotFoundException('La publicación no existe.');
    }

    // olo el dueño o un admin pueden dar de baja
    if (
      publicacion.usuarioId.toString() !== usuarioId &&
      rolUsuario !== 'administrador'
    ) {
      throw new UnauthorizedException(
        'No tenés permisos para eliminar esta publicación.',
      );
    }

    // Ejecutamos la baja lógica cambiando el flag a false
    publicacion.habilitada = false;
    await publicacion.save();

    return { message: 'Publicación dada de baja correctamente.' };
  }

  // LOGICA: DAR ME GUSTA
  async darMeGusta(publicacionId: string, usuarioId: string) {
    // 1. Buscamos la publicación activa
    const publicacion = await this.publicacionModel.findOne({
      _id: publicacionId,
      habilitada: true,
    });
    if (!publicacion) {
      throw new NotFoundException(
        'La publicación no existe o fue dada de baja.',
      );
    }

    // 2. Verificamos si el usuario ya le dio like previamente
    const yaTieneLike = publicacion.likes.some(
      (id) => id.toString() === usuarioId,
    );
    if (yaTieneLike) {
      throw new BadRequestException('Ya le diste me gusta a esta publicación.');
    }

    // 3. Agregamos el ID del usuario al array de likes de forma segura
    publicacion.likes.push(new Types.ObjectId(usuarioId));
    await publicacion.save();

    return {
      message: 'Me gusta agregado correctamente.',
      totalLikes: publicacion.likes.length,
    };
  }

  // LOGICA: QUITAR ME GUSTA
  async quitarMeGusta(publicacionId: string, usuarioId: string) {
    const publicacion = await this.publicacionModel.findOne({
      _id: publicacionId,
      habilitada: true,
    });
    if (!publicacion) {
      throw new NotFoundException('La publicación no existe.');
    }

    // 1. Validamos que el usuario realmente haya dado un like antes para poder quitarlo
    const yaTieneLike = publicacion.likes.some(
      (id) => id.toString() === usuarioId,
    );
    if (!yaTieneLike) {
      throw new BadRequestException(
        'No podés quitar un me gusta que no realizaste previamente.',
      );
    }

    // 2. Filtramos el array para remover el ID del usuario actual
    publicacion.likes = publicacion.likes.filter(
      (id) => id.toString() !== usuarioId,
    );
    await publicacion.save();

    return {
      message: 'Me gusta eliminado correctamente.',
      totalLikes: publicacion.likes.length,
    };
  }
}
