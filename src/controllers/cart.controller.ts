import { Request, Response, NextFunction } from 'express';
import { cartService } from '../services/cart.service';

export class CartController {
  async addToCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const item = await cartService.addToCart(req.body);
      res.status(200).json({
        success: true,
        message: 'Item added to cart',
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cart = await cartService.getCart(req.params.sessionId);
      res.status(200).json({
        success: true,
        data: cart,
      });
    } catch (error) {
      next(error);
    }
  }

  async removeFromCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sessionId, productId } = req.params;
      const result = await cartService.removeFromCart(sessionId, productId);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const cartController = new CartController();
