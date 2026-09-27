import { prisma } from '../config/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { StockRequestStatus, SellerStatus, Role } from '@prisma/client';

export class StockRequestService {
  // --- Admin Methods ---
  async getAdminStockRequests() {
    return prisma.stockRequest.findMany({
      select: {
        id: true,
        quantity: true,
        note: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            sellerStatus: true,
            availableStock: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStockRequestStatus(id: string, status: StockRequestStatus) {
    const stockRequest = await prisma.stockRequest.findUnique({
      where: { id },
      include: {
        seller: {
          select: { id: true, name: true, email: true, availableStock: true },
        },
      },
    });

    if (!stockRequest) {
      throw new NotFoundError('Stock request not found');
    }

    if (stockRequest.status !== StockRequestStatus.PENDING) {
      throw new BadRequestError(
        `Cannot update stock request: already ${stockRequest.status}`
      );
    }

    // Atomic transaction: status update + availableStock increment on approval
    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.stockRequest.update({
        where: { id },
        data: { status },
        select: {
          id: true,
          sellerId: true,
          quantity: true,
          note: true,
          status: true,
          updatedAt: true,
        },
      });

      let newAvailableStock = stockRequest.seller.availableStock;

      if (status === StockRequestStatus.APPROVED) {
        const updatedSeller = await tx.user.update({
          where: { id: stockRequest.sellerId },
          data: {
            availableStock: { increment: stockRequest.quantity },
          },
          select: { availableStock: true },
        });
        newAvailableStock = updatedSeller.availableStock;
      }

      return {
        stockRequest: updatedRequest,
        seller: {
          id: stockRequest.seller.id,
          name: stockRequest.seller.name,
          email: stockRequest.seller.email,
          availableStock: newAvailableStock,
        },
      };
    });

    return result;
  }

  // --- Seller Methods ---
  async createStockRequest(sellerId: string, quantity: number, note?: string) {
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
    });

    if (!seller || seller.role !== Role.SELLER) {
      throw new ForbiddenError('Only sellers can submit stock requests');
    }

    if (seller.sellerStatus !== SellerStatus.APPROVED) {
      throw new ForbiddenError('Only approved sellers can submit stock requests');
    }

    return prisma.stockRequest.create({
      data: {
        sellerId,
        quantity,
        note: note ? note.trim() : null,
        status: StockRequestStatus.PENDING,
      },
      select: {
        id: true,
        sellerId: true,
        quantity: true,
        note: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async getSellerStockRequests(sellerId: string) {
    return prisma.stockRequest.findMany({
      where: { sellerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        quantity: true,
        note: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}

export const stockRequestService = new StockRequestService();
