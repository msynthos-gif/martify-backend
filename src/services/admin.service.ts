import { prisma } from '../config/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { SellerStatus, KycStatus, Role } from '@prisma/client';

export class AdminService {
  async getSellers() {
    return prisma.user.findMany({
      where: { role: Role.SELLER },
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
        createdAt: true,
        _count: {
          select: { products: true, orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSellerById(sellerId: string) {
    const seller = await prisma.user.findFirst({
      where: { id: sellerId, role: Role.SELLER },
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
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { products: true, orders: true, stockRequests: true },
        },
      },
    });

    if (!seller) {
      throw new NotFoundError('Seller not found');
    }

    return seller;
  }

  async updateSellerKyc(sellerId: string, kycStatus: KycStatus) {
    const seller = await prisma.user.findFirst({
      where: { id: sellerId, role: Role.SELLER },
    });

    if (!seller) {
      throw new NotFoundError('Seller not found');
    }

    const updated = await prisma.user.update({
      where: { id: sellerId },
      data: { kycStatus },
      select: {
        id: true,
        name: true,
        email: true,
        sellerStatus: true,
        kycStatus: true,
        kycDocumentUrl: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async updateSellerStatus(sellerId: string, sellerStatus: SellerStatus) {
    const seller = await prisma.user.findFirst({
      where: { id: sellerId, role: Role.SELLER },
    });

    if (!seller) {
      throw new NotFoundError('Seller not found');
    }

    // Business Logic Rule 1: Seller approval gate
    // sellerStatus can only move to APPROVED if kycStatus is already APPROVED
    if (sellerStatus === SellerStatus.APPROVED && seller.kycStatus !== KycStatus.APPROVED) {
      throw new BadRequestError(
        'Cannot approve seller status until KYC document has been approved'
      );
    }

    const updated = await prisma.user.update({
      where: { id: sellerId },
      data: { sellerStatus },
      select: {
        id: true,
        name: true,
        email: true,
        sellerStatus: true,
        kycStatus: true,
        updatedAt: true,
      },
    });

    return updated;
  }
}

export const adminService = new AdminService();
