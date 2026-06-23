import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Usuario, UsuarioDocument } from './entities/usuario.schema';
import { Model } from 'mongoose';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectModel(Usuario.name) private usuarioModel: Model<UsuarioDocument>,
  ) {}

  async crear(datos: Partial<Usuario>): Promise<UsuarioDocument> {
    const nuevoUsuario = new this.usuarioModel(datos);
    return nuevoUsuario.save();
  }

  async buscarPorCorreoOUsuario(
    identificador: string,
  ): Promise<UsuarioDocument | null> {
    return this.usuarioModel.findOne({
      $or: [{ correo: identificador }, { nombreUsuario: identificador }],
    });
  }

  async existeCorreoOUsuario(
    correo: string,
    nombreUsuario: string,
  ): Promise<UsuarioDocument | null> {
    return this.usuarioModel.findOne({
      $or: [{ correo }, { nombreUsuario }],
    });
  }
}
