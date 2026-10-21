import { z } from 'zod';

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

export type SignInValues = z.infer<typeof signInSchema>;
export type RegisterValues = z.infer<typeof registerSchema>;
