import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateBiodataDto } from '@app/shared';
import { Biodata, BiodataDocument } from '../schemas/biodata.schema';

@Injectable()
export class BiodataService {
  constructor(
    @InjectModel(Biodata.name) private biodataModel: Model<BiodataDocument>,
  ) {}

  async create(dto: CreateBiodataDto): Promise<Biodata> {
    const created = new this.biodataModel(dto);
    return created.save();
  }

  async findAll(): Promise<Biodata[]> {
    return this.biodataModel.find().sort({ createdAt: -1 }).exec();
  }
}
