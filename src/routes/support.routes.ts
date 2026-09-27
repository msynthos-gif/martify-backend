import { Router } from 'express';
import { supportController } from '../controllers/support.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createTicketSchema,
  createMessageSchema,
  sendMessageSchema,
  ticketIdParamSchema,
  updateTicketStatusSchema,
} from '../validators/support.schema';
import { Role } from '@prisma/client';

const router = Router();

// All support routes require authentication
router.use(authenticate);

// 1. Single Continuous Chat: Seller endpoints
router.get(
  '/conversation',
  requireRole(Role.SELLER),
  (req, res, next) => supportController.getSellerConversation(req, res, next)
);

router.post(
  '/conversation/messages',
  requireRole(Role.SELLER),
  validate(sendMessageSchema),
  (req, res, next) => supportController.sendSellerMessage(req, res, next)
);

// 2. Support Console / Legacy endpoints
router.get('/tickets', (req, res, next) =>
  supportController.getTickets(req, res, next)
);

router.post(
  '/tickets',
  requireRole(Role.SELLER),
  validate(createTicketSchema),
  (req, res, next) => supportController.createTicket(req, res, next)
);

router.get(
  '/tickets/:id',
  validate(ticketIdParamSchema),
  (req, res, next) => supportController.getTicketById(req, res, next)
);

router.post(
  '/tickets/:id/messages',
  requireRole(Role.ADMIN, Role.SUPPORT, Role.SELLER),
  validate(createMessageSchema),
  (req, res, next) => supportController.addMessage(req, res, next)
);

router.patch(
  '/tickets/:id',
  requireRole(Role.ADMIN, Role.SUPPORT),
  validate(updateTicketStatusSchema),
  (req, res, next) => supportController.updateTicketStatus(req, res, next)
);

export default router;
