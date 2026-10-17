import { prisma } from '../config/prisma';
import {
  CreateProductInput,
  UpdateProductInput,
  CloneProductInput,
  BatchCloneProductInput,
} from '../validators/product.schema';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from '../utils/errors';
import { Prisma } from '@prisma/client';

export class ProductService {
  /**
   * Calculates the sum of all active stock for a given seller,
   * optionally excluding a specific productId (for updates).
   */
  private async getActiveStockSum(sellerId: string, excludeProductId?: string): Promise<number> {
    const activeProducts = await prisma.product.findMany({
      where: {
        sellerId,
        isActive: true,
        ...(excludeProductId ? { id: { not: excludeProductId } } : {}),
      },
      select: { stock: true },
    });

    return activeProducts.reduce((sum, p) => sum + p.stock, 0);
  }

  private attachTotalSold<T extends { manualSoldCount?: number | null; _count?: { orders: number } }>(product: T) {
    return {
      ...product,
      totalSold: (product.manualSoldCount || 0) + (product._count?.orders || 0),
    };
  }

  // --- Seller Operations ---

  async createProduct(sellerId: string, input: CreateProductInput) {
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { sellerStatus: true, isDemoAccount: true },
    });

    if (!seller) {
      throw new NotFoundError('Seller not found');
    }

    if (seller.sellerStatus !== 'APPROVED') {
      throw new ForbiddenError('Only approved sellers can list products');
    }

    const category = await prisma.category.findUnique({
      where: { id: input.categoryId },
    });

    if (!category) {
      throw new NotFoundError('Category not found');
    }

    const imageList: string[] = [];
    if (Array.isArray(input.images) && input.images.length > 0) {
      imageList.push(...input.images.filter(Boolean));
    } else if (input.imageUrl) {
      imageList.push(input.imageUrl);
    }
    const primaryImageUrl = imageList[0] || input.imageUrl || '';

    // Only persist manualSoldCount if seller is a demo account (Official Store)
    const manualSoldCount = (seller.isDemoAccount && input.manualSoldCount !== undefined && input.manualSoldCount !== null)
      ? Math.max(0, input.manualSoldCount)
      : 0;

    const created = await prisma.product.create({
      data: {
        title: input.title.trim(),
        description: input.description.trim(),
        price: new Prisma.Decimal(input.price),
        imageUrl: primaryImageUrl,
        stock: input.stock,
        isActive: input.isActive !== undefined ? input.isActive : true,
        sellerId,
        categoryId: input.categoryId,
        clonedFromProductId: input.clonedFromProductId ?? null,
        attributes: input.attributes ?? Prisma.DbNull,
        manualSoldCount,
        ...(imageList.length > 0
          ? {
              images: {
                create: imageList.map((url, index) => ({
                  url,
                  sortOrder: index,
                })),
              },
            }
          : {}),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, url: true, sortOrder: true },
        },
        _count: { select: { orders: true } },
      },
    });

    return this.attachTotalSold(created);
  }

  async getSellerProducts(sellerId: string) {
    const products = await prisma.product.findMany({
      where: { sellerId },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        clonedFromProduct: {
          select: { id: true, title: true, seller: { select: { name: true } } },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, url: true, sortOrder: true },
        },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((p) => this.attachTotalSold(p));
  }

  async getSellerProductById(sellerId: string, productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        clonedFromProduct: {
          select: { id: true, title: true, seller: { select: { name: true } } },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, url: true, sortOrder: true },
        },
        _count: { select: { orders: true } },
      },
    });

    if (!product || product.sellerId !== sellerId) {
      throw new NotFoundError('Product not found in your inventory');
    }

    return this.attachTotalSold(product);
  }

  async updateProduct(sellerId: string, productId: string, input: UpdateProductInput) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: { select: { isDemoAccount: true } },
      },
    });

    if (!product || product.sellerId !== sellerId) {
      throw new NotFoundError('Product not found in your inventory');
    }

    if (input.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
      });
      if (!category) {
        throw new NotFoundError('Category not found');
      }
    }

    // Determine target active status and stock
    const targetIsActive = input.isActive !== undefined ? input.isActive : product.isActive;
    const targetStock = input.stock !== undefined ? input.stock : product.stock;

    if (input.images !== undefined) {
      await prisma.productImage.deleteMany({
        where: { productId },
      });
      if (input.images.length > 0) {
        await prisma.productImage.createMany({
          data: input.images.map((url, index) => ({
            productId,
            url,
            sortOrder: index,
          })),
        });
      }
    }

    let newImageUrl = input.imageUrl;
    if (input.images && input.images.length > 0) {
      newImageUrl = input.images[0];
    }

    // Only persist manualSoldCount if seller is a demo account (Official Store)
    let manualSoldCountToUpdate: number | undefined = undefined;
    if (product.seller?.isDemoAccount && input.manualSoldCount !== undefined && input.manualSoldCount !== null) {
      manualSoldCountToUpdate = Math.max(0, input.manualSoldCount);
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(input.title ? { title: input.title.trim() } : {}),
        ...(input.description ? { description: input.description.trim() } : {}),
        ...(input.price !== undefined ? { price: new Prisma.Decimal(input.price) } : {}),
        ...(newImageUrl ? { imageUrl: newImageUrl } : {}),
        ...(input.stock !== undefined ? { stock: input.stock } : {}),
        ...(input.categoryId ? { categoryId: input.categoryId } : {}),
        ...(input.attributes !== undefined ? { attributes: input.attributes ?? Prisma.DbNull } : {}),
        ...(manualSoldCountToUpdate !== undefined ? { manualSoldCount: manualSoldCountToUpdate } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, url: true, sortOrder: true },
        },
        _count: { select: { orders: true } },
      },
    });

    return this.attachTotalSold(updated);
  }

  async deleteProduct(sellerId: string, productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        _count: { select: { orders: true } },
      },
    });

    if (!product || product.sellerId !== sellerId) {
      throw new NotFoundError('Product not found in your inventory');
    }

    // If product has been ordered, deactivate rather than hard deleting to preserve order history
    if (product._count.orders > 0) {
      await prisma.product.update({
        where: { id: productId },
        data: { isActive: false },
      });
      return { id: productId, message: 'Product has order history and was deactivated' };
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return { id: productId, message: 'Product deleted successfully' };
  }

  // --- Catalog Clone Flow (Rule 3) ---

  async cloneProduct(sellerId: string, input: CloneProductInput) {
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { sellerStatus: true },
    });

    if (!seller) {
      throw new NotFoundError('Seller not found');
    }

    if (seller.sellerStatus !== 'APPROVED') {
      throw new ForbiddenError('Only approved sellers can clone catalog products');
    }

    // Fetch catalog source product
    const sourceProduct = await prisma.product.findUnique({
      where: { id: input.catalogProductId },
      include: {
        seller: { select: { isDemoAccount: true } },
        category: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!sourceProduct) {
      throw new NotFoundError('Catalog product not found');
    }

    if (!sourceProduct.seller.isDemoAccount) {
      throw new BadRequestError('Only platform demo catalog products can be cloned');
    }

    const imageList = (input.images && input.images.length > 0)
      ? input.images
      : (sourceProduct.images && sourceProduct.images.length > 0)
        ? sourceProduct.images.map((img) => img.url)
        : [sourceProduct.imageUrl];

    const cloned = await prisma.product.create({
      data: {
        title: sourceProduct.title,
        description: sourceProduct.description,
        price: new Prisma.Decimal(input.price),
        imageUrl: imageList[0] || sourceProduct.imageUrl,
        stock: input.stock,
        isActive: true,
        sellerId,
        categoryId: sourceProduct.categoryId,
        attributes: (sourceProduct.attributes as any) ?? Prisma.DbNull,
        clonedFromProductId: sourceProduct.id,
        manualSoldCount: 0,
        images: {
          create: imageList.map((url, index) => ({
            url,
            sortOrder: index,
          })),
        },
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        clonedFromProduct: {
          select: { id: true, title: true, seller: { select: { name: true } } },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, url: true, sortOrder: true },
        },
        _count: { select: { orders: true } },
      },
    });

    return this.attachTotalSold(cloned);
  }

  async batchCloneProducts(sellerId: string, input: BatchCloneProductInput) {
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { sellerStatus: true },
    });

    if (!seller) {
      throw new NotFoundError('Seller not found');
    }

    if (seller.sellerStatus !== 'APPROVED') {
      throw new ForbiddenError('Only approved sellers can clone catalog products');
    }

    // Normalize items
    const rawItems: Array<{ catalogProductId: string; price?: number; stock?: number }> =
      input.items ||
      (input.catalogProductIds || []).map((id) => ({
        catalogProductId: id,
      }));

    if (!rawItems || rawItems.length === 0) {
      throw new BadRequestError('No catalog products selected for import');
    }

    const createdOrUpdatedProducts: any[] = [];

    for (const item of rawItems) {
      const sourceProduct = await prisma.product.findUnique({
        where: { id: item.catalogProductId },
        include: {
          seller: { select: { isDemoAccount: true } },
          category: true,
          images: { orderBy: { sortOrder: 'asc' } },
        },
      });

      if (!sourceProduct || !sourceProduct.seller.isDemoAccount) {
        continue;
      }

      // Check if already listed by this seller
      const existingListing = await prisma.product.findFirst({
        where: {
          sellerId,
          clonedFromProductId: sourceProduct.id,
        },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          category: true,
        },
      });

      if (existingListing) {
        const updated = await prisma.product.update({
          where: { id: existingListing.id },
          data: {
            isActive: true,
            ...(item.price ? { price: new Prisma.Decimal(item.price) } : {}),
            ...(item.stock !== undefined ? { stock: item.stock } : {}),
          },
          include: {
            category: { select: { id: true, name: true, slug: true } },
            images: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, url: true, sortOrder: true },
            },
            _count: { select: { orders: true } },
          },
        });
        createdOrUpdatedProducts.push(this.attachTotalSold(updated));
      } else {
        const imageList =
          sourceProduct.images && sourceProduct.images.length > 0
            ? sourceProduct.images.map((img) => img.url)
            : [sourceProduct.imageUrl];

        const created = await prisma.product.create({
          data: {
            title: sourceProduct.title,
            description: sourceProduct.description,
            price: item.price ? new Prisma.Decimal(item.price) : sourceProduct.price,
            imageUrl: imageList[0] || sourceProduct.imageUrl,
            stock: item.stock !== undefined ? item.stock : 20,
            isActive: true,
            sellerId,
            categoryId: sourceProduct.categoryId,
            attributes: (sourceProduct.attributes as any) ?? Prisma.DbNull,
            clonedFromProductId: sourceProduct.id,
            manualSoldCount: 0,
            images: {
              create: imageList.map((url, index) => ({
                url,
                sortOrder: index,
              })),
            },
          },
          include: {
            category: { select: { id: true, name: true, slug: true } },
            images: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, url: true, sortOrder: true },
            },
            _count: { select: { orders: true } },
          },
        });
        createdOrUpdatedProducts.push(this.attachTotalSold(created));
      }
    }

    return {
      count: createdOrUpdatedProducts.length,
      products: createdOrUpdatedProducts,
    };
  }

  // --- Public Operations ---

  async getCatalogProducts() {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        seller: { isDemoAccount: true },
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        seller: { select: { id: true, name: true } },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, url: true, sortOrder: true },
        },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((p) => this.attachTotalSold(p));
  }

  async getPublicProducts(
    optionsOrCategorySlug?: string | {
      categorySlug?: string;
      filter?: string;
      limit?: number;
      page?: number;
      sort?: string;
      maxPrice?: number;
      seed?: string;
    },
    filterParam?: string,
    limitParam?: number
  ) {
    let categorySlug: string | undefined;
    let filter: string | undefined;
    let limit: number | undefined;
    let page: number | undefined;
    let sort: string | undefined;
    let maxPrice: number | undefined;

    if (typeof optionsOrCategorySlug === 'object' && optionsOrCategorySlug !== null) {
      categorySlug = optionsOrCategorySlug.categorySlug;
      filter = optionsOrCategorySlug.filter;
      limit = optionsOrCategorySlug.limit;
      page = optionsOrCategorySlug.page;
      sort = optionsOrCategorySlug.sort;
      maxPrice = optionsOrCategorySlug.maxPrice;
    } else {
      categorySlug = optionsOrCategorySlug;
      filter = filterParam;
      limit = limitParam;
    }

    const currentPage = page && page > 0 ? page : 1;

    const whereClause: Prisma.ProductWhereInput = {
      isActive: true,
    };

    if (categorySlug && categorySlug !== 'all') {
      const slugs = categorySlug.split(',').map((s) => s.trim()).filter(Boolean);
      if (slugs.length === 1) {
        whereClause.category = { slug: slugs[0] };
      } else if (slugs.length > 1) {
        whereClause.category = { slug: { in: slugs } };
      }
    }

    if (maxPrice !== undefined && !isNaN(maxPrice) && maxPrice > 0) {
      whereClause.price = { lte: new Prisma.Decimal(maxPrice) };
    }

    if (filter === 'new-arrivals') {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const countLast24h = await prisma.product.count({
        where: {
          ...whereClause,
          createdAt: { gte: twentyFourHoursAgo },
        },
      });

      if (countLast24h > 0) {
        whereClause.createdAt = { gte: twentyFourHoursAgo };
      } else {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const countLast7d = await prisma.product.count({
          where: {
            ...whereClause,
            createdAt: { gte: sevenDaysAgo },
          },
        });
        if (countLast7d > 0) {
          whereClause.createdAt = { gte: sevenDaysAgo };
        }
      }
    }

    const includeQuery = {
      category: { select: { id: true, name: true, slug: true } },
      seller: {
        select: {
          id: true,
          name: true,
          storeName: true,
          storeImageUrl: true,
          isDemoAccount: true,
        },
      },
      images: {
        orderBy: { sortOrder: 'asc' as const },
        select: { id: true, url: true, sortOrder: true },
      },
      _count: { select: { orders: true } },
    };

    // If explicit sorting is specified and is NOT default/featured/newest, use direct SQL/Prisma order
    if (sort === 'price-low' || sort === 'price-high' || sort === 'title-asc' || filter === 'new-arrivals') {
      let orderByClause: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[] = { createdAt: 'desc' };
      if (sort === 'price-low') {
        orderByClause = [{ price: 'asc' }, { createdAt: 'desc' }];
      } else if (sort === 'price-high') {
        orderByClause = [{ price: 'desc' }, { createdAt: 'desc' }];
      } else if (sort === 'title-asc') {
        orderByClause = [{ title: 'asc' }, { createdAt: 'desc' }];
      }

      const total = await prisma.product.count({ where: whereClause });
      const pageSize = limit && limit > 0 ? limit : total > 0 ? total : 40;

      const rawProducts = await prisma.product.findMany({
        where: whereClause,
        include: includeQuery,
        orderBy: orderByClause,
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
      });

      const products = rawProducts.map((p) => this.attachTotalSold(p));
      const meta = {
        total,
        page: currentPage,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
        hasMore: (currentPage - 1) * pageSize + products.length < total,
      };

      return Object.assign([...products], {
        products,
        meta,
      });
    }

    // Default Catalog Browsing: Multi-Seller Balanced Interleaved Display
    const allProducts = await prisma.product.findMany({
      where: whereClause,
      include: includeQuery,
      orderBy: { createdAt: 'desc' },
    });

    const productsWithSold = allProducts.map((p) => this.attachTotalSold(p));

    // Group products by sellerId
    const sellerBuckets = new Map<string, typeof productsWithSold>();
    for (const prod of productsWithSold) {
      const sId = prod.sellerId;
      if (!sellerBuckets.has(sId)) {
        sellerBuckets.set(sId, []);
      }
      sellerBuckets.get(sId)!.push(prod);
    }

    // Order sellers by recency of their newest product
    const sortedSellerIds = Array.from(sellerBuckets.keys()).sort((a, b) => {
      const bucketA = sellerBuckets.get(a)!;
      const bucketB = sellerBuckets.get(b)!;
      const timeA = bucketA[0]?.createdAt ? new Date(bucketA[0].createdAt).getTime() : 0;
      const timeB = bucketB[0]?.createdAt ? new Date(bucketB[0].createdAt).getTime() : 0;
      return timeB - timeA;
    });

    // Round-robin interleave across sellers
    const interleaved: typeof productsWithSold = [];
    let maxBucketLen = 0;
    for (const bucket of sellerBuckets.values()) {
      if (bucket.length > maxBucketLen) maxBucketLen = bucket.length;
    }

    for (let round = 0; round < maxBucketLen; round++) {
      for (const sellerId of sortedSellerIds) {
        const bucket = sellerBuckets.get(sellerId)!;
        if (round < bucket.length) {
          interleaved.push(bucket[round]);
        }
      }
    }

    const total = interleaved.length;
    const pageSize = limit && limit > 0 ? limit : total > 0 ? total : 40;
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedProducts = interleaved.slice(startIndex, startIndex + pageSize);

    const meta = {
      total,
      page: currentPage,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
      hasMore: startIndex + paginatedProducts.length < total,
    };

    return Object.assign([...paginatedProducts], {
      products: paginatedProducts,
      meta,
    });
  }

  async getPublicProductById(id: string) {
    const product = await prisma.product.findFirst({
      where: { id, isActive: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        seller: {
          select: {
            id: true,
            name: true,
            storeName: true,
            storeImageUrl: true,
            isDemoAccount: true,
          },
        },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, url: true, sortOrder: true },
        },
        _count: { select: { orders: true } },
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSalesCount = await prisma.order.count({
      where: {
        productId: id,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    return this.attachTotalSold({
      ...product,
      recentSalesCount,
    });
  }

  async getProductsBySeller(sellerId: string) {
    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: {
        id: true,
        name: true,
        storeName: true,
        storeDescription: true,
        storeImageUrl: true,
        sellerStatus: true,
      },
    });

    if (!seller || seller.sellerStatus !== 'APPROVED') {
      throw new NotFoundError('Seller not found or inactive');
    }

    const products = await prisma.product.findMany({
      where: { sellerId, isActive: true },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, url: true, sortOrder: true },
        },
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      seller: {
        id: seller.id,
        name: seller.name,
        storeName: seller.storeName,
        storeDescription: seller.storeDescription,
        storeImageUrl: seller.storeImageUrl,
      },
      products: products.map((p) => this.attachTotalSold(p)),
    };
  }

  async search(query: string) {
    const q = (query || '').trim();
    if (!q) {
      return { query: '', products: [], stores: [] };
    }

    const normalized = q.replace(/\s+/g, ' ');
    const tokens = normalized.split(' ').filter((t) => t.length > 0);

    const productOrClauses: any[] = [
      { title: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { seller: { name: { contains: q, mode: 'insensitive' } } },
      { seller: { storeName: { contains: q, mode: 'insensitive' } } },
    ];

    const sellerOrClauses: any[] = [
      { name: { contains: q, mode: 'insensitive' } },
      { storeName: { contains: q, mode: 'insensitive' } },
    ];

    if (normalized !== q) {
      productOrClauses.push(
        { title: { contains: normalized, mode: 'insensitive' } },
        { seller: { name: { contains: normalized, mode: 'insensitive' } } },
        { seller: { storeName: { contains: normalized, mode: 'insensitive' } } }
      );
      sellerOrClauses.push(
        { name: { contains: normalized, mode: 'insensitive' } },
        { storeName: { contains: normalized, mode: 'insensitive' } }
      );
    }

    for (const token of tokens) {
      if (token.length >= 2) {
        productOrClauses.push(
          { title: { contains: token, mode: 'insensitive' } },
          { seller: { name: { contains: token, mode: 'insensitive' } } },
          { seller: { storeName: { contains: token, mode: 'insensitive' } } }
        );
        sellerOrClauses.push(
          { name: { contains: token, mode: 'insensitive' } },
          { storeName: { contains: token, mode: 'insensitive' } }
        );
      }
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: productOrClauses,
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, url: true, sortOrder: true },
        },
        _count: { select: { orders: true } },
        seller: {
          select: {
            id: true,
            name: true,
            storeName: true,
            storeImageUrl: true,
          },
        },
      },
      take: 30,
      orderBy: { createdAt: 'desc' },
    });

    const matchingSellers = await prisma.user.findMany({
      where: {
        role: 'SELLER',
        OR: sellerOrClauses,
      },
      select: {
        id: true,
        name: true,
        storeName: true,
        storeDescription: true,
        storeImageUrl: true,
        sellerStatus: true,
        products: {
          where: { isActive: true },
          take: 6,
          include: {
            category: { select: { id: true, name: true, slug: true } },
            images: {
              orderBy: { sortOrder: 'asc' },
              select: { id: true, url: true, sortOrder: true },
            },
            _count: { select: { orders: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      take: 10,
    });

    return {
      query: q,
      products: products.map((p) => this.attachTotalSold(p)),
      stores: matchingSellers.map((s) => ({
        ...s,
        products: s.products.map((p) => this.attachTotalSold(p)),
      })),
    };
  }
}

export const productService = new ProductService();
