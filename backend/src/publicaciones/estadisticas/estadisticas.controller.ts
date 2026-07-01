// import { Controller } from '@nestjs/common';
// import { EstadisticasService } from './estadisticas.service';

// @Controller('estadisticas')
// export class EstadisticasController {
//   constructor(private readonly estadisticasService: EstadisticasService) {}
// }
import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthGuard } from '../../autenticacion/guards/auth.guard';
import { Publicacion } from '../entities/publicacion.schema';
import { Comentario } from '../../comentarios/entities/comentario.schema';

@Controller('publicaciones/estadisticas')
@UseGuards(AuthGuard) // Bloqueo por token
export class EstadisticasController {
  constructor(
    @InjectModel(Publicacion.name)
    private readonly publicacionModel: Model<any>,
    @InjectModel(Comentario.name) private readonly comentarioModel: Model<any>,
  ) {}

  // ── 1. METRICA: Publicaciones por usuario en un lapso de tiempo ──
  @Get('publicaciones-por-usuario')
  @HttpCode(HttpStatus.OK)
  async publicacionesPorUsuario(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Req() req: any,
  ) {
    this.verificarAdmin(req.user);
    const { fechaInicio, fechaFin } = this.parsearFechas(inicio, fin);

    return this.publicacionModel.aggregate([
      {
        $match: {
          createdAt: { $gte: fechaInicio, $lte: fechaFin },
        },
      },
      {
        $group: {
          _id: '$usuarioId',
          cantidad: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'usuarios', // Nombre de la colección en MongoDB
          localField: '_id',
          foreignField: '_id',
          as: 'usuario',
        },
      },
      { $unwind: '$usuario' },
      {
        $project: {
          _id: 0,
          label: { $concat: ['$usuario.apellido', ', ', '$usuario.nombre'] },
          value: '$cantidad',
        },
      },
    ]);
  }

  // ── 2. METRICA: Comentarios totales en un lapso de tiempo ──
  @Get('comentarios-totales')
  @HttpCode(HttpStatus.OK)
  async comentariosTotales(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Req() req: any,
  ) {
    this.verificarAdmin(req.user);
    const { fechaInicio, fechaFin } = this.parsearFechas(inicio, fin);

    // Agrupamos por día de creación para poder armar un gráfico de líneas evolutivo
    return this.comentarioModel.aggregate([
      {
        $match: {
          createdAt: { $gte: fechaInicio, $lte: fechaFin },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          cantidad: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          label: '$_id',
          value: '$cantidad',
        },
      },
    ]);
  }

  // ── 3. METRICA: Cantidad de comentarios por cada publicación en un lapso de tiempo ──
  @Get('comentarios-por-publicacion')
  @HttpCode(HttpStatus.OK)
  async comentariosPorPublicacion(
    @Query('inicio') inicio: string,
    @Query('fin') fin: string,
    @Req() req: any,
  ) {
    this.verificarAdmin(req.user);
    const { fechaInicio, fechaFin } = this.parsearFechas(inicio, fin);

    return this.comentarioModel.aggregate([
      {
        $match: {
          createdAt: { $gte: fechaInicio, $lte: fechaFin },
        },
      },
      {
        $group: {
          _id: '$publicacionId',
          cantidad: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'publicacions', // Colección padre de posteos
          localField: '_id',
          foreignField: '_id',
          as: 'publicacion',
        },
      },
      { $unwind: '$publicacion' },
      {
        $project: {
          _id: 0,
          label: { $substr: ['$publicacion.titulo', 0, 20] }, // Recortamos el título largo para que entre en el gráfico
          value: '$cantidad',
        },
      },
    ]);
  }

  // ── MÉTODOS AUXILIARES ──
  private verificarAdmin(user: any): void {
    if (!user || user.perfil !== 'administrador') {
      throw new UnauthorizedException(
        'Acceso denegado. Se requieren permisos de administrador.',
      );
    }
  }

  private parsearFechas(inicio: string, fin: string) {
    if (!inicio || !fin) {
      throw new BadRequestException(
        'Los parámetros de rango de fecha (inicio y fin) son obligatorios.',
      );
    }
    return {
      fechaInicio: new Date(inicio),
      fechaFin: new Date(fin + 'T23:59:59.999Z'), // Cerramos el día completo para incluir los registros del último día
    };
  }
}
