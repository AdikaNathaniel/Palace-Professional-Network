import { z } from 'zod';

import type { BiodataOptions } from '@/lib/api/types';
import { needsTrade } from '@/lib/biodata';

export const phoneNumber = z.string().trim().min(1, 'Phone number is required');

export const pin = z.string().regex(/^\d{4}$/, 'PIN must be exactly 4 digits');

export const signInSchema = z.object({
  phoneNumber,
  pin: z.string().regex(/^\d{4}$/, 'Enter your 4-digit PIN'),
});

export const registerSchema = z
  .object({
    phoneNumber,
    fullName: z.string().trim().optional(),
    pin,
    confirmPin: z.string().min(1, 'Please confirm your PIN'),
  })
  .refine((v) => v.pin === v.confirmPin, {
    path: ['confirmPin'],
    message: 'PINs do not match',
  });

export const changePinSchema = z
  .object({
    currentPin: z.string().regex(/^\d{4}$/, 'Enter your current 4-digit PIN'),
    newPin: pin,
    confirmPin: z.string().regex(/^\d{4}$/, 'Please confirm your new PIN'),
  })
  .refine((v) => v.newPin !== v.currentPin, {
    path: ['newPin'],
    message: 'Choose a PIN that’s different from your current one',
  })
  .refine((v) => v.newPin === v.confirmPin, {
    path: ['confirmPin'],
    message: 'PINs do not match',
  });

export type SignInValues = z.infer<typeof signInSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
export type ChangePinValues = z.infer<typeof changePinSchema>;

/**
 * Mirrors the backend's CreateBiodataDto: the choices must be ones the server
 * offered, and a trade is only required for the business category.
 */
export function biodataSchema(options: BiodataOptions) {
  const oneOf = (list: string[], message: string) =>
    z.string().refine((v) => list.includes(v), message);
  const trades = Object.values(options.professionSubCategories).flat();

  return z
    .object({
      fullName: z.string().trim().min(1, 'Full name is required'),
      ageRange: oneOf(options.ageRanges, 'Choose your age range'),
      gender: oneOf(options.genders, 'Choose your gender'),
      maritalStatus: oneOf(options.maritalStatuses, 'Choose your marital status'),
      // Optional; trimmed the same way the API layer trims before sending.
      email: z
        .string()
        .trim()
        .refine((v) => !v || z.email().safeParse(v).success, 'Enter a valid email address'),
      professionCategory: oneOf(options.professionCategories, 'Choose your profession'),
      professionSubCategory: z.string(),
      placeOfWork: z.string().trim().min(1, 'Place of work is required'),
    })
    .superRefine((v, ctx) => {
      if (needsTrade(v.professionCategory) && !trades.includes(v.professionSubCategory)) {
        ctx.addIssue({
          code: 'custom',
          path: ['professionSubCategory'],
          message: 'Choose your trade or business type',
        });
      }
    });
}

export type BiodataValues = z.infer<ReturnType<typeof biodataSchema>>;
