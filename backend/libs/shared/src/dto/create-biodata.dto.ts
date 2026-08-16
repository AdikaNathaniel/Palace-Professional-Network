import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  AGE_RANGES,
  ALL_SUB_CATEGORIES,
  GENDERS,
  MARITAL_STATUSES,
  PROFESSION_CATEGORIES,
} from '../constants/profession-categories';

export class CreateBiodataDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsIn(AGE_RANGES)
  ageRange: string;

  @IsIn(GENDERS)
  gender: string;

  @IsIn(MARITAL_STATUSES)
  maritalStatus: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsIn(PROFESSION_CATEGORIES)
  professionCategory: string;

  @IsOptional()
  @IsIn(ALL_SUB_CATEGORIES)
  professionSubCategory?: string;

  @IsString()
  @IsNotEmpty()
  placeOfWork: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
