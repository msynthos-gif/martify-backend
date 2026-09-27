import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { sellerService } from '../services/seller.service';
import { BadRequestError } from '../utils/errors';

export class SellerController {
  async submitKyc(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const { kycDocumentUrl } = req.body;
      const updated = await sellerService.submitKyc(sellerId, kycDocumentUrl);

      res.status(200).json({
        success: true,
        message: 'KYC document submitted successfully. Awaiting admin review.',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const profile = await sellerService.getProfile(sellerId);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const normalizeFilePath = (filePath: string) => {
        const relativeToCwd = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
        const uploadsIndex = relativeToCwd.toLowerCase().indexOf('uploads/');
        const cleanPath = uploadsIndex !== -1 ? relativeToCwd.slice(uploadsIndex) : relativeToCwd;
        return cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;
      };

      const rawFiles: Express.Multer.File[] = [];
      if (req.files) {
        if (Array.isArray(req.files)) {
          rawFiles.push(...req.files);
        } else {
          Object.values(req.files).forEach((fArray) => rawFiles.push(...fArray));
        }
      } else if (req.file) {
        rawFiles.push(req.file);
      }

      if (rawFiles.length === 0) {
        throw new BadRequestError('No file was uploaded');
      }

      const filesData = rawFiles.map((file) => ({
        url: normalizeFilePath(file.path),
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
      }));

      res.status(200).json({
        success: true,
        message: filesData.length > 1 ? 'Files uploaded successfully' : 'File uploaded successfully',
        data: {
          url: filesData[0].url,
          urls: filesData.map((f) => f.url),
          files: filesData,
          count: filesData.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = req.user!.userId;
      const updated = await sellerService.updateStoreProfile(sellerId, req.body);

      res.status(200).json({
        success: true,
        message: 'Store profile updated successfully',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const sellerController = new SellerController();
