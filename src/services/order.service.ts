import { prisma } from '../config/prisma';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { OrderStatus, Role } from '@prisma/client';

export class OrderService {
  private validTransitions: Record<OrderStatus, OrderStatus | null> = {
    [OrderStatus.BOOKED]: OrderStatus.PROCESSING,
    [OrderStatus.PROCESSING]: OrderStatus.SHIPPING,
    [OrderStatus.SHIPPING]: OrderStatus.DELIVERED,
    [OrderStatus.DELIVERED]: null,
  };

  async updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        seller: {
          select: { id: true, name: true, balanceOnHold: true, balanceAvailable: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Business Logic Rule 5: Sequential order transitions only
    const allowedNextStatus = this.validTransitions[order.status];

    if (!allowedNextStatus) {
      throw new BadRequestError(
        `Order is already ${order.status} and cannot be transitioned further`
      );
    }

    if (newStatus !== allowedNextStatus) {
      throw new BadRequestError(
        `Invalid status transition: Order is currently '${order.status}'. It can only move to '${allowedNextStatus}'. Skips and backward transitions are prohibited.`
      );
    }

    // Execute status transition
    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          statusUpdatedAt: new Date(),
        },
        include: {
          product: { select: { id: true, title: true, price: true } },
          seller: { select: { id: true, name: true } },
        },
      });

      let updatedSellerBalances = {
        balanceOnHold: order.seller.balanceOnHold,
        balanceAvailable: order.seller.balanceAvailable,
      };

      // Business Logic Rule 6: Balance release on DELIVERED
      if (newStatus === OrderStatus.DELIVERED) {
        const seller = await tx.user.update({
          where: { id: order.sellerId },
          data: {
            balanceOnHold: { decrement: order.totalPrice },
            balanceAvailable: { increment: order.totalPrice },
          },
          select: {
            id: true,
            name: true,
            balanceOnHold: true,
            balanceAvailable: true,
          },
        });

        updatedSellerBalances = {
          balanceOnHold: seller.balanceOnHold,
          balanceAvailable: seller.balanceAvailable,
        };
      }

      return {
        order: updatedOrder,
        sellerBalances: updatedSellerBalances,
      };
    });

    return result;
  }

  async getSellerOrders(sellerId: string) {
    return prisma.order.findMany({
      where: { sellerId },
      include: {
        product: { select: { id: true, title: true, price: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(orderId: string, userId: string, role: Role) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: { select: { id: true, title: true, price: true, imageUrl: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Sellers can only view their own orders; Admin & Support can view any order
    if (role === Role.SELLER && order.sellerId !== userId) {
      throw new ForbiddenError('You do not have permission to view this order');
    }

    return order;
  }

  async getAllOrders() {
    return prisma.order.findMany({
      include: {
        product: { select: { id: true, title: true, price: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const orderService = new OrderService();
