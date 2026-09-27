import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  updateOrderStatusSchema,
  orderIdParamSchema,
} from '../validators/order.schema';
import { Role } from '@prisma/client';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// View single order
router.get('/:id', validate(orderIdParamSchema), (req, res, next) =>
  orderController.getOrderById(req, res, next)
);

// View all orders (Admin or Support only)
router.get('/', requireRole(Role.ADMIN, Role.SUPPORT), (req, res, next) =>
  orderController.getAllOrders(req, res, next)
);

// Advance order lifecycle (Admin or Support only — Rule 5 & Rule 6)
router.patch(
  '/:id/status',
  requireRole(Role.ADMIN, Role.SUPPORT),
  validate(updateOrderStatusSchema),
  (req, res, next) => orderController.updateOrderStatus(req, res, next)
);

export default router;
