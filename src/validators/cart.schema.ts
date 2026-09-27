import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    productId: z.string().uuid('Invalid product ID'),
    quantity: z.number().int().positive('Quantity must be a positive integer'),
    selectedAttributes: z.record(z.any()).optional().nullable(),
  }),
});

export const getCartSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
  }),
});

export const removeFromCartSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    productId: z.string().uuid('Invalid product ID'),
  }),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>['body'];
