import { prisma } from '../config/prisma';
import { CheckoutInput } from '../validators/order.schema';
import { BadRequestError } from '../utils/errors';
import { Prisma, OrderStatus } from '@prisma/client';

export class CheckoutService {
  async checkout(input: CheckoutInput) {
    const { sessionId } = input;
    const buyerEmail = (input.email || input.buyerEmail || '').trim();
    const firstName = (input.firstName || '').trim();
    const lastName = (input.lastName || '').trim();
    const buyerName = (input.buyerName || `${firstName} ${lastName}`).trim();

    const country = (input.country || 'United States').trim();
    const company = input.company ? input.company.trim() : null;
    const address = (input.address || '').trim();
    const apartment = input.apartment ? input.apartment.trim() : null;
    const city = (input.city || '').trim();
    const state = (input.state || '').trim();
    const zipCode = (input.zipCode || '').trim();
    const buyerPhone = (input.phone || input.buyerPhone || '').trim();

    let buyerAddress = (input.buyerAddress || '').trim();
    if (!buyerAddress && address) {
      const parts = [
        address,
        apartment ? `Apt/Suite ${apartment}` : null,
        city,
        state ? `${state} ${zipCode}` : zipCode,
        country,
      ].filter(Boolean);
      buyerAddress = parts.join(', ');
    }

    // Execute checkout inside an atomic Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch cart items for the guest session
      const cartItems = await tx.cartItem.findMany({
        where: { sessionId },
        include: {
          product: {
            include: {
              seller: { select: { id: true, name: true } },
            },
          },
        },
      });

      if (cartItems.length === 0) {
        throw new BadRequestError('Cannot checkout: your cart is empty');
      }

      const createdOrders = [];
      let grandTotal = new Prisma.Decimal(0);

      // 2. Process each item: stock check, stock decrement, order creation, seller balanceOnHold credit
      for (const item of cartItems) {
        const product = item.product;

        if (!product.isActive) {
          throw new BadRequestError(
            `Product "${product.title}" is currently inactive and cannot be ordered`
          );
        }

        if (product.stock < item.quantity) {
          throw new BadRequestError(
            `Insufficient stock for "${product.title}". Requested: ${item.quantity}, Available: ${product.stock}`
          );
        }

        // Decrement product inventory
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        // Exact Decimal calculation for total price
        const itemTotalPrice = product.price.mul(item.quantity);
        grandTotal = grandTotal.add(itemTotalPrice);

        // Create Order (Rule 4: status BOOKED)
        const order = await tx.order.create({
          data: {
            productId: product.id,
            sellerId: product.sellerId,
            buyerName,
            buyerPhone,
            buyerEmail,
            buyerAddress,
            country,
            company,
            address: address || buyerAddress,
            apartment,
            city,
            state,
            zipCode,
            quantity: item.quantity,
            totalPrice: itemTotalPrice,
            selectedAttributes: item.selectedAttributes ?? Prisma.DbNull,
            status: OrderStatus.BOOKED,
            statusUpdatedAt: new Date(),
          },
          include: {
            product: {
              select: { id: true, title: true, price: true, imageUrl: true },
            },
            seller: {
              select: { id: true, name: true },
            },
          },
        });

        createdOrders.push(order);

        // Rule 4: Atomically credit seller's balanceOnHold
        await tx.user.update({
          where: { id: product.sellerId },
          data: {
            balanceOnHold: { increment: itemTotalPrice },
          },
        });
      }

      // 3. Clear cart items for this guest session
      await tx.cartItem.deleteMany({
        where: { sessionId },
      });

      return {
        sessionId,
        buyerName,
        buyerEmail,
        buyerPhone,
        buyerAddress,
        ordersCount: createdOrders.length,
        grandTotal,
        orders: createdOrders,
      };
    });

    return result;
  }
}

export const checkoutService = new CheckoutService();
