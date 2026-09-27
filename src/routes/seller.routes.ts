import { Router } from 'express';
import { sellerController } from '../controllers/seller.controller';
import { stockRequestController } from '../controllers/stock-request.controller';
import { productController } from '../controllers/product.controller';
import { orderController } from '../controllers/order.controller';
import { authenticate, requireApprovedSeller } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { kycSubmitSchema, createStockRequestSchema, updateStoreProfileSchema } from '../validators/seller.schema';
import {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  cloneProductSchema,
  batchCloneProductSchema,
} from '../validators/product.schema';
import { uploadKycDocument, uploadStoreImage } from '../middlewares/upload.middleware';

const router = Router();

// Any authenticated seller (including pending) can view profile and submit KYC
router.get('/me', authenticate, (req, res, next) =>
  sellerController.getProfile(req, res, next)
);

// Store Profile management (Approved or active sellers)
router.patch(
  '/profile',
  authenticate,
  validate(updateStoreProfileSchema),
  (req, res, next) => sellerController.updateProfile(req, res, next)
);

router.post(
  '/profile/image',
  authenticate,
  uploadStoreImage.single('image'),
  (req, res, next) => sellerController.uploadFile(req, res, next)
);

router.patch(
  '/kyc',
  authenticate,
  validate(kycSubmitSchema),
  (req, res, next) => sellerController.submitKyc(req, res, next)
);

// Helper endpoint to upload KYC doc directly (accepts single or multiple files)
router.post(
  '/kyc/upload',
  authenticate,
  uploadKycDocument.any(),
  (req, res, next) => sellerController.uploadFile(req, res, next)
);

// Stock Requests (Requires approved seller)
router.post(
  '/stock-requests',
  authenticate,
  requireApprovedSeller,
  validate(createStockRequestSchema),
  (req, res, next) => stockRequestController.createSellerStockRequest(req, res, next)
);

router.get(
  '/stock-requests',
  authenticate,
  requireApprovedSeller,
  (req, res, next) => stockRequestController.getSellerStockRequests(req, res, next)
);

// --- Product Management (Requires approved seller) ---

router.post(
  '/products',
  authenticate,
  requireApprovedSeller,
  validate(createProductSchema),
  (req, res, next) => productController.createProduct(req, res, next)
);

router.get(
  '/products',
  authenticate,
  requireApprovedSeller,
  (req, res, next) => productController.getSellerProducts(req, res, next)
);

router.get(
  '/products/:id',
  authenticate,
  requireApprovedSeller,
  validate(productIdSchema),
  (req, res, next) => productController.getSellerProductById(req, res, next)
);

router.patch(
  '/products/:id',
  authenticate,
  requireApprovedSeller,
  validate(updateProductSchema),
  (req, res, next) => productController.updateProduct(req, res, next)
);

router.delete(
  '/products/:id',
  authenticate,
  requireApprovedSeller,
  validate(productIdSchema),
  (req, res, next) => productController.deleteProduct(req, res, next)
);

// Catalog Clone Flow (Rule 3)
router.post(
  '/products/clone',
  authenticate,
  requireApprovedSeller,
  validate(cloneProductSchema),
  (req, res, next) => productController.cloneProduct(req, res, next)
);

// Batch Catalog Clone Flow
router.post(
  '/products/batch-clone',
  authenticate,
  requireApprovedSeller,
  validate(batchCloneProductSchema),
  (req, res, next) => productController.batchCloneProducts(req, res, next)
);

// --- Seller Orders (Read-only for seller) ---
router.get(
  '/orders',
  authenticate,
  requireApprovedSeller,
  (req, res, next) => orderController.getSellerOrders(req, res, next)
);

export default router;
