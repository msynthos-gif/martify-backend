import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';

export class AdminController {
  async getSellers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellers = await adminService.getSellers();
      res.status(200).json({
        success: true,
        data: sellers,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSellerById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const seller = await adminService.getSellerById(req.params.id);
      res.status(200).json({
        success: true,
        data: seller,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSellerKyc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { kycStatus } = req.body;
      const updated = await adminService.updateSellerKyc(id, kycStatus);

      res.status(200).json({
        success: true,
        message: `Seller KYC has been updated to ${kycStatus}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSellerStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { sellerStatus } = req.body;
      const updated = await adminService.updateSellerStatus(id, sellerStatus);

      res.status(200).json({
        success: true,
        message: `Seller status updated to ${sellerStatus}`,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
