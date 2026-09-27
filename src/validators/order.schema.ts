import { z } from 'zod';

export const checkoutSchema = z.object({
  body: z.object({
    sessionId: z.string().min(1, 'Session ID is required'),
    email: z.string().email('Please enter a valid email address').optional(),
    buyerEmail: z.string().email('Please enter a valid email address').optional(),
    firstName: z.string().trim().min(1, 'First name is required').optional(),
    lastName: z.string().trim().min(1, 'Last name is required').optional(),
    buyerName: z.string().trim().min(2, 'Buyer name must be at least 2 characters').optional(),
    country: z.string().trim().optional().default('United States'),
    company: z.string().trim().optional().nullable(),
    address: z.string().trim().optional(),
    apartment: z.string().trim().optional().nullable(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    zipCode: z.string().trim().optional(),
    phone: z.string().trim().optional().nullable(),
    buyerPhone: z.string().trim().optional().nullable(),
    buyerAddress: z.string().trim().optional(),
    emailNewsOffers: z.boolean().optional(),
  }).refine((data) => {
    return !!(data.email || data.buyerEmail);
  }, {
    message: 'Email is required',
    path: ['email'],
  }).refine((data) => {
    return !!(data.buyerName || (data.firstName && data.lastName));
  }, {
    message: 'First name and last name are required',
    path: ['firstName'],
  }).refine((data) => {
    return !!(data.buyerAddress || (data.address && data.city && data.state && data.zipCode));
  }, {
    message: 'Street address, city, state, and ZIP code are required',
    path: ['address'],
  }),
});

export const orderIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    status: z.enum(['PROCESSING', 'SHIPPING', 'DELIVERED'], {
      errorMap: () => ({ message: 'Status must be PROCESSING, SHIPPING, or DELIVERED' }),
    }),
  }),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>['body'];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>['body'];
