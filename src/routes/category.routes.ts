import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
} from '../validators/admin.schema';
import { Role } from '@prisma/client';

const router = Router();

// Public read endpoints
router.get('/', (req, res, next) =>
  categoryController.getAll(req, res, next)
);

router.get('/:id', validate(categoryIdSchema), (req, res, next) =>
  categoryController.getById(req, res, next)
);

// Admin-protected mutation endpoints
router.post(
  '/',
  authenticate,
  requireRole(Role.ADMIN),
  validate(createCategorySchema),
  (req, res, next) => categoryController.create(req, res, next)
);

router.put(
  '/:id',
  authenticate,
  requireRole(Role.ADMIN),
  validate(updateCategorySchema),
  (req, res, next) => categoryController.update(req, res, next)
);

router.patch(
  '/:id',
  authenticate,
  requireRole(Role.ADMIN),
  validate(updateCategorySchema),
  (req, res, next) => categoryController.update(req, res, next)
);

router.delete(
  '/:id',
  authenticate,
  requireRole(Role.ADMIN),
  validate(categoryIdSchema),
  (req, res, next) => categoryController.delete(req, res, next)
);

export default router;
