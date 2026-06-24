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

    const matchStage: any = { habilitada: true };

    // Si viene el query param 'usuarioId', filtramos solo las publicaciones de ese autor
    if (usuarioIdFiltrar) {
      matchStage.usuarioId = new Types.ObjectId(usuarioIdFiltrar);
    }

    // Criterio de ordenamiento dinámico
    let sortStage: any = { createdAt: -1 }; // Por defecto: Más recientes primero
    if (orden === 'likes') {
      sortStage = { cantidadLikes: -1 }; // Por popularidad
    }

    return this.publicacionModel
      .aggregate([
        // Filtrado
        { $match: matchStage },

        {
          $addFields: {
            cantidadLikes: { $size: '$likes' },
          },
        },
        // 3. Ordenamiento
        { $sort: sortStage },

        { $skip: offset },
        { $limit: limit },
        // Cruzamos con la colección de usuarios para el creador del post
        {
          $lookup: {
            from: 'usuarios',
            localField: 'usuarioId',
            foreignField: '_id',
            as: 'usuarioId',
          },
        },
        { $unwind: '$usuarioId' },
        // Limpieza y protección de campos
        {
          $project: {
            _id: 1,
            titulo: 1,
            descripcion: 1,
            fotoUrl: 1,
            likes: 1,
            createdAt: 1,
            'usuarioId._id': 1,
            'usuarioId.nombre': 1,
            'usuarioId.apellido': 1,
            'usuarioId.nombreUsuario': 1,
            'usuarioId.fotoPerfilUrl': 1,
          },
        },
      ])
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

    // Validamos que el usuario realmente haya dado un like antes para poder quitarlo
    const yaTieneLike = publicacion.likes.some(
      (id) => id.toString() === usuarioId,
    );
    if (!yaTieneLike) {
      throw new BadRequestException(
        'No podés quitar un me gusta que no realizaste previamente.',
      );
    }

    // Filtramos el array para remover el ID del usuario actual
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
