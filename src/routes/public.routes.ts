import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { productController } from '../controllers/product.controller';
import { cartController } from '../controllers/cart.controller';
import { checkoutController } from '../controllers/checkout.controller';
import { validate } from '../middlewares/validate.middleware';
import {
  productIdSchema,
  sellerIdParamSchema,
  getProductsQuerySchema,
} from '../validators/product.schema';
import {
  addToCartSchema,
  getCartSchema,
  removeFromCartSchema,
} from '../validators/cart.schema';
import { checkoutSchema } from '../validators/order.schema';

const router = Router();

// --- Public Categories ---
router.get('/categories', (req, res, next) =>
  categoryController.getAll(req, res, next)
);

// --- Public Catalog Products (isDemoAccount=true only) ---
router.get('/products/catalog', (req, res, next) =>
  productController.getCatalogProducts(req, res, next)
);

// --- New Arrivals Collection Direct Endpoint ---
router.get('/collections/new-arrivals', (req, res, next) => {
  req.query.filter = 'new-arrivals';
  return productController.getPublicProducts(req, res, next);
});

router.get('/products/collections/new-arrivals', (req, res, next) => {
  req.query.filter = 'new-arrivals';
  return productController.getPublicProducts(req, res, next);
});

// --- Public Product Catalog ---
router.get('/products', validate(getProductsQuerySchema), (req, res, next) =>
  productController.getPublicProducts(req, res, next)
);

router.get('/products/:id', validate(productIdSchema), (req, res, next) =>
  productController.getPublicProductById(req, res, next)
);

router.get('/sellers/:id/products', validate(sellerIdParamSchema), (req, res, next) =>
  productController.getProductsBySeller(req, res, next)
);

// --- Public Global Search (Products & Stores) ---
router.get('/search', (req, res, next) =>
  productController.search(req, res, next)
);

// --- Guest Cart Operations (no login required) ---
router.post('/cart', validate(addToCartSchema), (req, res, next) =>
  cartController.addToCart(req, res, next)
);

router.get('/cart/:sessionId', validate(getCartSchema), (req, res, next) =>
  cartController.getCart(req, res, next)
);

router.delete(
  '/cart/:sessionId/:productId',
  validate(removeFromCartSchema),
  (req, res, next) => cartController.removeFromCart(req, res, next)
);

// --- Guest Checkout (Rule 4: no login, no payment gateway, creates BOOKED order and balanceOnHold credit) ---
router.post('/checkout', validate(checkoutSchema), (req, res, next) =>
  checkoutController.checkout(req, res, next)
);

export default router;
