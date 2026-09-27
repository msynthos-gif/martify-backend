import { z } from 'zod';

export const updateSellerKycSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid seller ID'),
  }),
  body: z.object({
    kycStatus: z.enum(['APPROVED', 'REJECTED'], {
      errorMap: () => ({ message: 'kycStatus must be APPROVED or REJECTED' }),
    }),
  }),
});

export const updateSellerStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid seller ID'),
  }),
  body: z.object({
    sellerStatus: z.enum(['PENDING', 'APPROVED', 'BLOCKED'], {
      errorMap: () => ({ message: 'sellerStatus must be PENDING, APPROVED, or BLOCKED' }),
    }),
  }),
});

export const getSellerByIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid seller ID'),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    slug: z
      .string()
      .min(2, 'Slug must be at least 2 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug must consist of lowercase letters, numbers, and hyphens')
      .optional(),
    parentId: z.string().uuid('Invalid parent category ID').optional().nullable(),
    showInNavbar: z.boolean().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid category ID'),
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    slug: z
      .string()
      .min(2, 'Slug must be at least 2 characters')
      .regex(/^[a-z0-9-]+$/, 'Slug must consist of lowercase letters, numbers, and hyphens')
      .optional(),
    parentId: z.string().uuid('Invalid parent category ID').optional().nullable(),
    showInNavbar: z.boolean().optional(),
  }),
});

export const categoryIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid category ID'),
  }),
});

export const updateStockRequestStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid stock request ID'),
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED'], {
      errorMap: () => ({ message: 'status must be APPROVED or REJECTED' }),
    }),
  }),
});

export const stockRequestIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid stock request ID'),
  }),
});

export type UpdateSellerKycInput = z.infer<typeof updateSellerKycSchema>['body'];
export type UpdateSellerStatusInput = z.infer<typeof updateSellerStatusSchema>['body'];
export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
export type UpdateStockRequestStatusInput = z.infer<typeof updateStockRequestStatusSchema>['body'];
