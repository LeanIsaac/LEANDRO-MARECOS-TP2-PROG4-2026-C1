import { Injectable, NotFoundException } from '@nestjs/common';
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

  async listarTodos(): Promise<UsuarioDocument[]> {
    // Traemos todos los usuarios ordenados alfabéticamente por apellido, ocultando el password por seguridad
    return this.usuarioModel
      .find()
      .select('-password')
      .sort({ apellido: 1, nombre: 1 })
      .exec();
  }

  async deshabilitar(id: string): Promise<{ message: string }> {
    const usuario = await this.usuarioModel.findById(id);

    if (!usuario) {
      throw new NotFoundException('El usuario especificado no existe.');
    }

    usuario.habilitado = false; // Flag en falso: bloquea el login
    await usuario.save();

    return {
      message: `El usuario @${usuario.nombreUsuario} fue deshabilitado correctamente.`,
    };
  }

  async rehabilitar(id: string): Promise<{ message: string }> {
    const usuario = await this.usuarioModel.findById(id);

    if (!usuario) {
      throw new NotFoundException('El usuario especificado no existe.');
    }

    usuario.habilitado = true; // Flag en verdadero: devuelve el acceso a la app
    await usuario.save();

    return {
      message: `El usuario @${usuario.nombreUsuario} fue rehabilitado con éxito.`,
    };
  }
}
