import { prisma } from '../config/prisma';
import { CreateCategoryInput, UpdateCategoryInput } from '../validators/admin.schema';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';

export class CategoryService {
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  private async getAllCategoryIdsRecursively(rootId: string): Promise<string[]> {
    const categoryIds: string[] = [rootId];
    const queue: string[] = [rootId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await prisma.category.findMany({
        where: { parentId: currentId },
        select: { id: true },
      });
      for (const child of children) {
        categoryIds.push(child.id);
        queue.push(child.id);
      }
    }

    return categoryIds;
  }

  async getAllCategories() {
    return prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subCategories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
          orderBy: { name: 'asc' },
        },
        showInNavbar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: true,
            subCategories: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getCategoryById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        subCategories: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
          orderBy: { name: 'asc' },
        },
        showInNavbar: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            products: true,
            subCategories: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    return category;
  }

  async createCategory(input: CreateCategoryInput) {
    const slug = input.slug ? input.slug : this.generateSlug(input.name);

    const existing = await prisma.category.findUnique({
      where: { slug },
    });

    if (existing) {
      throw new ConflictError(`A category with slug '${slug}' already exists`);
    }

    if (input.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: input.parentId },
      });
      if (!parent) {
        throw new NotFoundError('Parent category not found');
      }
    }

    return prisma.category.create({
      data: {
        name: input.name.trim(),
        slug,
        parentId: input.parentId || null,
        showInNavbar: input.showInNavbar !== undefined ? input.showInNavbar : true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        showInNavbar: true,
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { products: true, subCategories: true },
        },
      },
    });
  }

  async updateCategory(id: string, input: UpdateCategoryInput) {
    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    if (input.parentId !== undefined) {
      if (input.parentId === id) {
        throw new BadRequestError('A category cannot be its own parent');
      }
      if (input.parentId) {
        const parent = await prisma.category.findUnique({
          where: { id: input.parentId },
        });
        if (!parent) {
          throw new NotFoundError('Parent category not found');
        }
      }
    }

    let slug = input.slug;
    if (!slug && input.name) {
      slug = this.generateSlug(input.name);
    }

    if (slug && slug !== category.slug) {
      const existing = await prisma.category.findUnique({
        where: { slug },
      });
      if (existing) {
        throw new ConflictError(`A category with slug '${slug}' already exists`);
      }
    }

    return prisma.category.update({
      where: { id },
      data: {
        ...(input.name ? { name: input.name.trim() } : {}),
        ...(slug ? { slug } : {}),
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
        ...(input.showInNavbar !== undefined ? { showInNavbar: input.showInNavbar } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        parentId: true,
        showInNavbar: true,
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { products: true, subCategories: true },
        },
      },
    });
  }

  async deleteCategory(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { products: true, subCategories: true } },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    await prisma.$transaction(async (tx) => {
      // 1. Gather all category IDs (this category + all subcategories recursively)
      const allCategoryIds = await this.getAllCategoryIdsRecursively(id);

      // 2. Find all products belonging to these categories
      const products = await tx.product.findMany({
        where: { categoryId: { in: allCategoryIds } },
        select: { id: true },
      });
      const productIds = products.map((p) => p.id);

      if (productIds.length > 0) {
        // Clear clonedFromProductId references
        await tx.product.updateMany({
          where: { clonedFromProductId: { in: productIds } },
          data: { clonedFromProductId: null },
        });

        // Delete cart items
        await tx.cartItem.deleteMany({
          where: { productId: { in: productIds } },
        });

        // Delete product images
        await tx.productImage.deleteMany({
          where: { productId: { in: productIds } },
        });

        // Delete any support tickets and orders associated with these products
        const orders = await tx.order.findMany({
          where: { productId: { in: productIds } },
          select: { id: true },
        });
        const orderIds = orders.map((o) => o.id);

        if (orderIds.length > 0) {
          const tickets = await tx.supportTicket.findMany({
            where: { orderId: { in: orderIds } },
            select: { id: true },
          });
          const ticketIds = tickets.map((t) => t.id);

          if (ticketIds.length > 0) {
            await tx.supportMessage.deleteMany({
              where: { ticketId: { in: ticketIds } },
            });
            await tx.supportTicket.deleteMany({
              where: { id: { in: ticketIds } },
            });
          }

          await tx.order.deleteMany({
            where: { id: { in: orderIds } },
          });
        }

        // Delete the products
        await tx.product.deleteMany({
          where: { id: { in: productIds } },
        });
      }

      // Delete the category (subcategories cascade delete automatically via schema)
      await tx.category.delete({
        where: { id },
      });
    });

    return { id, message: `Category '${category.name}' and all associated items deleted successfully` };
  }
}

export const categoryService = new CategoryService();
