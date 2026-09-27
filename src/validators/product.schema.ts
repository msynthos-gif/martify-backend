import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().positive('Price must be greater than 0'),
    imageUrl: z.string().optional(),
    images: z.array(z.string().min(1)).optional(),
    stock: z.number().int().nonnegative('Stock cannot be negative'),
    categoryId: z.string().uuid('Invalid category ID'),
    clonedFromProductId: z.string().uuid('Invalid clone ID').optional().nullable(),
    attributes: z.record(z.any()).optional().nullable(),
    manualSoldCount: z.number().int().nonnegative('Recently sold count cannot be negative').optional().nullable(),
    isActive: z.boolean().optional().default(true),
  }).refine((data) => (data.imageUrl && data.imageUrl.length > 0) || (data.images && data.images.length > 0), {
    message: 'At least one image URL or images array is required',
    path: ['imageUrl'],
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').optional(),
    description: z.string().min(10, 'Description must be at least 10 characters').optional(),
    price: z.number().positive('Price must be greater than 0').optional(),
    imageUrl: z.string().optional(),
    images: z.array(z.string().min(1)).optional(),
    stock: z.number().int().nonnegative('Stock cannot be negative').optional(),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    attributes: z.record(z.any()).optional().nullable(),
    manualSoldCount: z.number().int().nonnegative('Recently sold count cannot be negative').optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const productIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
});

export const cloneProductSchema = z.object({
  body: z.object({
    catalogProductId: z.string().uuid('Invalid catalog product ID'),
    price: z.number().positive('Price must be greater than 0'),
    stock: z.number().int().nonnegative('Stock cannot be negative'),
    images: z.array(z.string().min(1)).optional(),
  }),
});

export const batchCloneProductSchema = z.object({
  body: z.object({
    catalogProductIds: z.array(z.string().uuid('Invalid catalog product ID')).optional(),
    items: z
      .array(
        z.object({
          catalogProductId: z.string().uuid('Invalid catalog product ID'),
          price: z.number().positive().optional(),
          stock: z.number().int().nonnegative().optional(),
        })
      )
      .optional(),
  }).refine(
    (data) =>
      (Array.isArray(data.catalogProductIds) && data.catalogProductIds.length > 0) ||
      (Array.isArray(data.items) && data.items.length > 0),
    {
      message: 'Please provide at least one catalog product to import',
      path: ['catalogProductIds'],
    }
  ),
});

export const getProductsQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    filter: z.string().optional(),
    sort: z.string().optional(),
  }),
});

export const sellerIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid seller ID'),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type CloneProductInput = z.infer<typeof cloneProductSchema>['body'];
export type BatchCloneProductInput = z.infer<typeof batchCloneProductSchema>['body'];
