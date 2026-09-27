import { z } from 'zod';

export const createTicketSchema = z.object({
  body: z.object({
    subject: z.string().min(3, 'Subject must be at least 3 characters'),
    orderId: z.string().uuid('Invalid order ID').optional(),
    message: z.string().min(2, 'Message must be at least 2 characters'),
  }),
});

export const createMessageSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ticket ID'),
  }),
  body: z.object({
    message: z.string().min(1, 'Message cannot be empty'),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message cannot be empty'),
  }),
});

export const ticketIdParamSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ticket ID'),
  }),
});

export const updateTicketStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid ticket ID'),
  }),
  body: z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED'], {
      errorMap: () => ({ message: 'Status must be OPEN, IN_PROGRESS, or RESOLVED' }),
    }),
  }),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>['body'];
export type CreateMessageInput = z.infer<typeof createMessageSchema>['body'];
export type UpdateTicketStatusInput = z.infer<typeof updateTicketStatusSchema>['body'];
