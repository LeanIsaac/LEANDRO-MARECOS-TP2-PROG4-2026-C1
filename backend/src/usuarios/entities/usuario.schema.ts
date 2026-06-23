import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UsuarioDocument = Usuario & Document;

export enum PerfilUsuario {
  USUARIO = 'usuario',
  ADMINISTRADOR = 'administrador',
}

@Schema({ timestamps: true })
export class Usuario {
  @Prop({ required: true, trim: true })
  nombre!: string;

  @Prop({ required: true, trim: true })
  apellido!: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  correo!: string;

  @Prop({ required: true, unique: true, trim: true })
  nombreUsuario!: string;

  @Prop({ required: true })
  password!: string; // <-- se guarda la contraseña encriptada

  @Prop({ required: true })
  fechaNacimiento!: Date;

  @Prop()
  descripcion?: string;

  @Prop()
  fotoPerfilUrl?: string; // <-- URL de cloudinary

  @Prop({ type: String, enum: PerfilUsuario, default: PerfilUsuario.USUARIO })
  perfil!: PerfilUsuario;

  @Prop({ default: true })
  habilitado!: boolean; // para dar baja logica
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);
