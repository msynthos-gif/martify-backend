import { Request, Response, NextFunction } from 'express';
import { checkoutService } from '../services/checkout.service';

export class CheckoutController {
  async checkout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await checkoutService.checkout(req.body);
      res.status(201).json({
        success: true,
        message: 'Order created successfully and placed on hold',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const checkoutController = new CheckoutController();
