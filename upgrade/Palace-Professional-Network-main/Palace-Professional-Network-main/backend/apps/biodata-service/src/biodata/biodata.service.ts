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

  /// Creates a record on first submission, or updates the existing one on
  /// later visits - phone number is the link between a login and a biodata
  /// record, so "submit" and "edit my existing details" are the same action.
  /// `sort` picks the most recently created record if a phone number somehow
  /// matches more than one (shouldn't happen, but is a safe tie-break).
  async upsertByPhone(phoneNumber: string, dto: CreateBiodataDto): Promise<Biodata> {
    const update: Record<string, unknown> = { ...dto, phoneNumber };
    for (const key of Object.keys(update)) {
      if (update[key] === undefined) delete update[key];
    }

    return this.biodataModel
      .findOneAndUpdate({ phoneNumber }, { $set: update }, {
        new: true,
        upsert: true,
        sort: { createdAt: -1 },
      })
      .exec();
  }

  async findByPhone(phoneNumber: string): Promise<Biodata | null> {
    return this.biodataModel
      .findOne({ phoneNumber })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAll(): Promise<Biodata[]> {
    return this.biodataModel.find().sort({ createdAt: -1 }).exec();
  }
}
