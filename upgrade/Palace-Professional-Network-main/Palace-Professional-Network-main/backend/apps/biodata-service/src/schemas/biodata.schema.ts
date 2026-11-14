import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BiodataDocument = Biodata & Document;

@Schema({ timestamps: true })
export class Biodata {
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true })
  ageRange: string;

  @Prop({ required: true })
  gender: string;

  @Prop({ required: true })
  maritalStatus: string;

  @Prop({ trim: true })
  email?: string;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  professionCategory: string;

  @Prop()
  professionSubCategory?: string;

  @Prop({ required: true })
  placeOfWork: string;

  @Prop()
  imageUrl?: string;
}

export const BiodataSchema = SchemaFactory.createForClass(Biodata);
