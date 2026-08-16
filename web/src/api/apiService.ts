import { API_BASE_URL } from './config';
import type { Biodata, BiodataFormValues, BiodataOptions } from '../types/biodata';

export class ApiError extends Error {}

export async function fetchOptions(): Promise<BiodataOptions> {
  const res = await fetch(`${API_BASE_URL}/biodata/options`);
  if (!res.ok) {
    throw new ApiError(`Failed to load form options (${res.status}).`);
  }
  return res.json();
}

export async function fetchAll(): Promise<Biodata[]> {
  const res = await fetch(`${API_BASE_URL}/biodata`);
  if (!res.ok) {
    throw new ApiError(`Failed to load directory (${res.status}).`);
  }
  return res.json();
}

export async function submitBiodata(
  values: BiodataFormValues,
  imageFile: File | null,
): Promise<void> {
  const formData = new FormData();
  formData.append('fullName', values.fullName.trim());
  formData.append('ageRange', values.ageRange);
  formData.append('gender', values.gender);
  formData.append('maritalStatus', values.maritalStatus);
  formData.append('phoneNumber', values.phoneNumber.trim());
  formData.append('professionCategory', values.professionCategory);
  formData.append('placeOfWork', values.placeOfWork.trim());

  if (values.email.trim()) {
    formData.append('email', values.email.trim());
  }
  if (values.professionSubCategory) {
    formData.append('professionSubCategory', values.professionSubCategory);
  }
  if (imageFile) {
    formData.append('image', imageFile);
  }

  const res = await fetch(`${API_BASE_URL}/biodata`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    let message = `Submission failed (${res.status}).`;
    try {
      const body = await res.json();
      if (body?.message) {
        message = Array.isArray(body.message)
          ? body.message.join(', ')
          : String(body.message);
      }
    } catch {
      // response body wasn't JSON; keep the generic message
    }
    throw new ApiError(message);
  }
}
