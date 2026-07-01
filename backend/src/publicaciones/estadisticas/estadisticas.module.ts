import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EstadisticasController } from './estadisticas.controller';
import { EstadisticasService } from './estadisticas.service';
import { AutenticacionModule } from '../../autenticacion/autenticacion.module';

import { Publicacion, PublicacionSchema } from '../entities/publicacion.schema';
import {
  Comentario,
  ComentarioSchema,
} from '../../comentarios/entities/comentario.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
      { name: Comentario.name, schema: ComentarioSchema },
    ]),
    forwardRef(() => AutenticacionModule),
  ],
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
})
export class EstadisticasModule {}
