import { prisma } from '../config/prisma';
import { AddToCartInput } from '../validators/cart.schema';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { Prisma } from '@prisma/client';

export class CartService {
  async addToCart(input: AddToCartInput) {
    const { sessionId, productId, quantity, selectedAttributes } = input;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      throw new NotFoundError('Product not found or currently unavailable');
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: {
        sessionId_productId: { sessionId, productId },
      },
    });

    const targetQuantity = existingItem ? existingItem.quantity + quantity : quantity;

    if (targetQuantity > product.stock) {
      throw new BadRequestError(
        `Cannot add ${quantity} item(s). Total in cart (${targetQuantity}) would exceed available stock (${product.stock})`
      );
    }

    const cartItem = await prisma.cartItem.upsert({
      where: {
        sessionId_productId: { sessionId, productId },
      },
      update: {
        quantity: targetQuantity,
        ...(selectedAttributes !== undefined ? { selectedAttributes: selectedAttributes ?? Prisma.DbNull } : {}),
      },
      create: {
        sessionId,
        productId,
        quantity: targetQuantity,
        selectedAttributes: selectedAttributes ?? Prisma.DbNull,
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            imageUrl: true,
            stock: true,
            sellerId: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
    });

    return cartItem;
  }

  async getCart(sessionId: string) {
    const items = await prisma.cartItem.findMany({
      where: { sessionId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            imageUrl: true,
            stock: true,
            isActive: true,
            sellerId: true,
            seller: { select: { name: true } },
            category: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    let subtotal = new Prisma.Decimal(0);

    const formattedItems = items.map((item) => {
      const price = item.product.price;
      const itemTotal = price.mul(item.quantity);
      subtotal = subtotal.add(itemTotal);

      return {
        id: item.id,
        productId: item.productId,
        title: item.product.title,
        price: item.product.price,
        imageUrl: item.product.imageUrl,
        quantity: item.quantity,
        stockAvailable: item.product.stock,
        isActive: item.product.isActive,
        sellerId: item.product.sellerId,
        sellerName: item.product.seller.name,
        category: item.product.category.name,
        selectedAttributes: item.selectedAttributes,
        itemTotal,
      };
    });

    return {
      sessionId,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal,
      items: formattedItems,
    };
  }

  async removeFromCart(sessionId: string, productId: string) {
    const existing = await prisma.cartItem.findUnique({
      where: {
        sessionId_productId: { sessionId, productId },
      },
    });

    if (!existing) {
      throw new NotFoundError('Item not found in your cart');
    }

    await prisma.cartItem.delete({
      where: {
        sessionId_productId: { sessionId, productId },
      },
    });

    return { message: 'Item removed from cart' };
  }
}

export const cartService = new CartService();
