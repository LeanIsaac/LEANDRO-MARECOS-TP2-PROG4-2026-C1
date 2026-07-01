import { forwardRef, Module } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { UsuarioSchema } from './entities/usuario.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { AutenticacionModule } from 'src/autenticacion/autenticacion.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Usuario', schema: UsuarioSchema }]),
    forwardRef(() => AutenticacionModule), // forwardRef para evitar dependencia circular con AutenticacionModule
  ],
  controllers: [UsuariosController],
  providers: [UsuariosService],
  exports: [UsuariosService, MongooseModule], // Exporto el módulo para poder usarlo en otros módulos
})
export class UsuariosModule {}
