import { Router } from 'express';
import authRoutes from './auth.routes';
import sellerRoutes from './seller.routes';
import adminRoutes from './admin.routes';
import publicRoutes from './public.routes';
import categoryRoutes from './category.routes';
import orderRoutes from './order.routes';
import supportRoutes from './support.routes';
import { authenticate } from '../middlewares/auth.middleware';
import { uploadProductImage } from '../middlewares/upload.middleware';
import { sellerController } from '../controllers/seller.controller';

const router = Router();

router.get('/status', (req, res) => {
  res.json({ success: true, message: 'Multi-Vendor Marketplace API is running' });
});

// Categories Routes (Public GET, Admin POST/PUT/PATCH/DELETE)
router.use('/categories', categoryRoutes);

// Public Routes (no auth)
router.use('/', publicRoutes);

// Auth Routes
router.use('/auth', authRoutes);

// Seller Routes
router.use('/seller', sellerRoutes);

// Admin Routes
router.use('/admin', adminRoutes);

// Order Management Routes (Admin & Support lifecycle progression)
router.use('/orders', orderRoutes);

// Support Ticket Routes (Sellers & Support/Admin)
router.use('/support', supportRoutes);

// General Authenticated Upload Endpoint (Product images)
router.post(
  '/upload',
  authenticate,
  uploadProductImage.any(),
  (req, res, next) => sellerController.uploadFile(req, res, next)
);

export default router;
