import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PublicacionDocument = Publicacion & Document;

@Schema({ timestamps: true })
export class Publicacion {
  @Prop({ required: true, trim: true })
  titulo!: string;

  @Prop({ required: true, trim: true })
  descripcion!: string;

  @Prop()
  fotoUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'Usuario', required: true })
  usuarioId!: Types.ObjectId;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Usuario' }], default: [] })
  likes!: Types.ObjectId[];

  @Prop({ default: true })
  habilitada!: boolean;
}

export const PublicacionSchema = SchemaFactory.createForClass(Publicacion);
