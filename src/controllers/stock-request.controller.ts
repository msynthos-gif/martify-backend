import { Request, Response, NextFunction } from 'express';
import { stockRequestService } from '../services/stock-request.service';

export class StockRequestController {
  async getAdminStockRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requests = await stockRequestService.getAdminStockRequests();
      res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStockRequestStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const result = await stockRequestService.updateStockRequestStatus(id, status);

      res.status(200).json({
        success: true,
        message: `Stock request ${status.toLowerCase()} successfully`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async createSellerStockRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const { quantity, note } = req.body;
      const created = await stockRequestService.createStockRequest(sellerId, quantity, note);

      res.status(201).json({
        success: true,
        message: 'Stock request submitted successfully. Awaiting admin approval.',
        data: created,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSellerStockRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const requests = await stockRequestService.getSellerStockRequests(sellerId);

      res.status(200).json({
        success: true,
        data: requests,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const stockRequestController = new StockRequestController();
