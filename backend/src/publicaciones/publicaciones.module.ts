import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PublicacionesService } from './publicaciones.service';
import { PublicacionesController } from './publicaciones.controller';
import { Publicacion, PublicacionSchema } from './entities/publicacion.schema';
import { CloudinaryModule } from '../cloudinary/cloudinary.module'; // Lo importamos para poder subir fotos de posts
import { AutenticacionModule } from 'src/autenticacion/autenticacion.module';

@Module({
  imports: [
    // Registramos el modelo en Mongoose
    MongooseModule.forFeature([
      { name: Publicacion.name, schema: PublicacionSchema },
    ]),
    CloudinaryModule,
    AutenticacionModule,
  ],
  controllers: [PublicacionesController],
  providers: [PublicacionesService],
  exports: [PublicacionesService], // Por si otro módulo necesita leer publicaciones
})
export class PublicacionesModule {}
