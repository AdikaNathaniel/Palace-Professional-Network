import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AGE_RANGES,
  BIODATA_TCP_PATTERNS,
  CreateBiodataDto,
  GENDERS,
  MARITAL_STATUSES,
  PROFESSION_CATEGORIES,
  PROFESSION_SUB_CATEGORIES,
} from '@app/shared';
import { BiodataService } from './biodata.service';

@Controller()
export class BiodataController {
  constructor(private readonly biodataService: BiodataService) {}

  @MessagePattern(BIODATA_TCP_PATTERNS.OPTIONS)
  getOptions() {
    return {
      ageRanges: AGE_RANGES,
      genders: GENDERS,
      maritalStatuses: MARITAL_STATUSES,
      professionCategories: PROFESSION_CATEGORIES,
      professionSubCategories: PROFESSION_SUB_CATEGORIES,
    };
  }

  @MessagePattern(BIODATA_TCP_PATTERNS.CREATE)
  create(@Payload() dto: CreateBiodataDto) {
    return this.biodataService.create(dto);
  }

  @MessagePattern(BIODATA_TCP_PATTERNS.FIND_ALL)
  findAll() {
    return this.biodataService.findAll();
  }
}
