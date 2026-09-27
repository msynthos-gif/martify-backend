import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { categoryController } from '../controllers/category.controller';
import { stockRequestController } from '../controllers/stock-request.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  updateSellerKycSchema,
  updateSellerStatusSchema,
  getSellerByIdSchema,
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  updateStockRequestStatusSchema,
} from '../validators/admin.schema';
import { Role } from '@prisma/client';

const router = Router();

// All admin routes require ADMIN role
router.use(authenticate, requireRole(Role.ADMIN));

// --- Seller Management ---
router.get('/sellers', (req, res, next) =>
  adminController.getSellers(req, res, next)
);

router.get('/sellers/:id', validate(getSellerByIdSchema), (req, res, next) =>
  adminController.getSellerById(req, res, next)
);

router.patch(
  '/sellers/:id/kyc',
  validate(updateSellerKycSchema),
  (req, res, next) => adminController.updateSellerKyc(req, res, next)
);

router.patch(
  '/sellers/:id',
  validate(updateSellerStatusSchema),
  (req, res, next) => adminController.updateSellerStatus(req, res, next)
);

// --- Category CRUD ---
router.get('/categories', (req, res, next) =>
  categoryController.getAll(req, res, next)
);

router.get('/categories/:id', validate(categoryIdSchema), (req, res, next) =>
  categoryController.getById(req, res, next)
);

router.post('/categories', validate(createCategorySchema), (req, res, next) =>
  categoryController.create(req, res, next)
);

router.put('/categories/:id', validate(updateCategorySchema), (req, res, next) =>
  categoryController.update(req, res, next)
);

router.patch('/categories/:id', validate(updateCategorySchema), (req, res, next) =>
  categoryController.update(req, res, next)
);

router.delete('/categories/:id', validate(categoryIdSchema), (req, res, next) =>
  categoryController.delete(req, res, next)
);

// --- Stock Requests ---
router.get('/stock-requests', (req, res, next) =>
  stockRequestController.getAdminStockRequests(req, res, next)
);

router.patch(
  '/stock-requests/:id',
  validate(updateStockRequestStatusSchema),
  (req, res, next) => stockRequestController.updateStockRequestStatus(req, res, next)
);

export default router;
