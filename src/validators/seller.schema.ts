import { z } from 'zod';

export const kycSubmitSchema = z.object({
  body: z.object({
    kycDocumentUrl: z.union([
      z.string().min(1, 'Verification document URL is required'),
      z.array(z.string().min(1)).min(1, 'At least one verification document is required'),
    ]),
  }),
});

export const createStockRequestSchema = z.object({
  body: z.object({
    quantity: z.number().int().positive('Quantity must be a positive integer'),
    note: z.string().max(500, 'Note cannot exceed 500 characters').optional(),
  }),
});

export const updateStoreProfileSchema = z.object({
  body: z.object({
    storeName: z.string().trim().min(2, 'Store name must be at least 2 characters').max(100).optional(),
    storeDescription: z.string().trim().max(1000).optional().nullable(),
    storeImageUrl: z.string().trim().max(1000).optional().nullable(),
  }),
});

export type KycSubmitInput = z.infer<typeof kycSubmitSchema>['body'];
export type CreateStockRequestInput = z.infer<typeof createStockRequestSchema>['body'];
export type UpdateStoreProfileInput = z.infer<typeof updateStoreProfileSchema>['body'];
