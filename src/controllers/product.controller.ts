import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';

export class ProductController {
  // --- Seller Endpoints ---

  async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const product = await productService.createProduct(sellerId, req.body);

      res.status(201).json({
        success: true,
        message: 'Product listed successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSellerProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const products = await productService.getSellerProducts(sellerId);

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSellerProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const product = await productService.getSellerProductById(sellerId, req.params.id);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const product = await productService.updateProduct(sellerId, req.params.id, req.body);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const result = await productService.deleteProduct(sellerId, req.params.id);

      res.status(200).json({
        success: true,
        message: result.message,
        data: { id: result.id },
      });
    } catch (error) {
      next(error);
    }
  }

  async cloneProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const cloned = await productService.cloneProduct(sellerId, req.body);

      res.status(201).json({
        success: true,
        message: 'Product cloned from catalog successfully',
        data: cloned,
      });
    } catch (error) {
      next(error);
    }
  }

  async batchCloneProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const result = await productService.batchCloneProducts(sellerId, req.body);

      res.status(201).json({
        success: true,
        message: `Successfully listed ${result.count} products from Official Store`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // --- Public Endpoints ---

  async getCatalogProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const catalog = await productService.getCatalogProducts();

      res.status(200).json({
        success: true,
        data: catalog,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPublicProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const categorySlug = req.query.category as string | undefined;
      const filter = req.query.filter as string | undefined;
      const products = await productService.getPublicProducts(categorySlug, filter);

      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPublicProductById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const product = await productService.getPublicProductById(req.params.id);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductsBySeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await productService.getProductsBySeller(req.params.id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      const result = await productService.search(q);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();
