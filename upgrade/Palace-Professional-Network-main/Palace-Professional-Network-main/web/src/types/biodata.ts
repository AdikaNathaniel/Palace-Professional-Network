export interface Biodata {
  _id?: string;
  fullName: string;
  ageRange: string;
  gender: string;
  maritalStatus: string;
  email?: string;
  phoneNumber: string;
  professionCategory: string;
  professionSubCategory?: string;
  placeOfWork: string;
  imageUrl?: string;
  createdAt?: string;
}

export interface BiodataOptions {
  ageRanges: string[];
  genders: string[];
  maritalStatuses: string[];
  professionCategories: string[];
  professionSubCategories: Record<string, string[]>;
}

export interface BiodataFormValues {
  fullName: string;
  ageRange: string;
  gender: string;
  maritalStatus: string;
  email: string;
  phoneNumber: string;
  professionCategory: string;
  professionSubCategory: string;
  placeOfWork: string;
}
