import { prisma } from '../config/prisma';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { KycStatus, Role } from '@prisma/client';

export class SellerService {
  async submitKyc(sellerId: string, kycDocumentUrl: string | string[]) {
    const user = await prisma.user.findUnique({
      where: { id: sellerId },
    });

    if (!user) {
      throw new NotFoundError('Seller not found');
    }

    if (user.role !== Role.SELLER) {
      throw new ForbiddenError('Only sellers can submit verification documents');
    }

    const finalDocUrl = Array.isArray(kycDocumentUrl)
      ? (kycDocumentUrl.length === 1 ? kycDocumentUrl[0] : JSON.stringify(kycDocumentUrl))
      : kycDocumentUrl;

    const updated = await prisma.user.update({
      where: { id: sellerId },
      data: {
        kycDocumentUrl: finalDocUrl,
        kycStatus: KycStatus.PENDING,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        sellerStatus: true,
        kycStatus: true,
        kycDocumentUrl: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async getProfile(sellerId: string) {
    const user = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        sellerStatus: true,
        kycStatus: true,
        kycDocumentUrl: true,
        availableStock: true,
        balanceOnHold: true,
        balanceAvailable: true,
        isDemoAccount: true,
        storeName: true,
        storeDescription: true,
        storeImageUrl: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
            orders: true,
            stockRequests: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('Seller profile not found');
    }

    return user;
  }

  async updateStoreProfile(
    sellerId: string,
    data: { storeName?: string; storeDescription?: string | null; storeImageUrl?: string | null }
  ) {
    const user = await prisma.user.findUnique({
      where: { id: sellerId },
    });

    if (!user) {
      throw new NotFoundError('Seller not found');
    }

    if (user.role !== Role.SELLER) {
      throw new ForbiddenError('Only sellers can update store profiles');
    }

    const updateData: any = {};
    if (data.storeName !== undefined) {
      updateData.storeName = data.storeName;
    }
    if (data.storeDescription !== undefined) {
      updateData.storeDescription = data.storeDescription;
    }
    if (data.storeImageUrl !== undefined) {
      updateData.storeImageUrl = data.storeImageUrl;
    }

    const updated = await prisma.user.update({
      where: { id: sellerId },
      data: updateData,
      select: {
        id: true,
        name: true,
        storeName: true,
        storeDescription: true,
        storeImageUrl: true,
        email: true,
        sellerStatus: true,
        updatedAt: true,
      },
    });

    return updated;
  }
}

export const sellerService = new SellerService();
