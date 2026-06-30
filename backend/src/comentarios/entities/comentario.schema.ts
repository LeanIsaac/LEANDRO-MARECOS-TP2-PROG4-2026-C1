import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ComentarioDocument = Comentario & Document;

@Schema({ timestamps: true }) // autogenera createdAt y updatedAt en la BD
export class Comentario {
  @Prop({ required: true, trim: true })
  contenido!: string;

  // Relación con la publicación comentada
  @Prop({ type: Types.ObjectId, ref: 'Publicacion', required: true })
  publicacionId!: Types.ObjectId;

  // Relación con el autor del comentario
  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  usuarioId!: Types.ObjectId;

  // Flag para saber si fue editado
  @Prop({ default: false })
  modificado!: boolean;

  @Prop({ default: true })
  habilitado!: boolean; // Para borrado lógico
}

export const ComentarioSchema = SchemaFactory.createForClass(Comentario);
