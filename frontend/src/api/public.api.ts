import { apiClient } from './client';
import type {
  ApiResponse,
  Category,
  Product,
  Cart,
  CartItem,
  CheckoutInput,
  CheckoutResult,
  SearchResponse,
} from '../types';

export const publicApi = {
  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await apiClient.get<ApiResponse<Category[]>>('/categories');
    return res.data.data;
  },

  // Search
  async search(query: string): Promise<SearchResponse> {
    const res = await apiClient.get<ApiResponse<SearchResponse>>('/search', {
      params: { q: query },
    });
    return res.data.data;
  },

  // Products
  async getProducts(
    categorySlug?: string,
    filter?: string,
    limit?: number,
    page?: number,
    sort?: string,
    maxPrice?: number
  ): Promise<Product[]> {
    const params: Record<string, string> = {};
    if (categorySlug && categorySlug !== 'all') params.category = categorySlug;
    if (filter) params.filter = filter;
    if (limit) params.limit = String(limit);
    if (page) params.page = String(page);
    if (sort) params.sort = sort;
    if (maxPrice !== undefined) params.maxPrice = String(maxPrice);
    const res = await apiClient.get<ApiResponse<Product[]>>('/products', { params });
    return res.data.data;
  },

  async getProductsWithPagination(options: {
    categorySlug?: string;
    filter?: string;
    limit?: number;
    page?: number;
    sort?: string;
    maxPrice?: number;
  }): Promise<{
    products: Product[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasMore: boolean;
    };
  }> {
    const params: Record<string, string> = {};
    if (options.categorySlug && options.categorySlug !== 'all') params.category = options.categorySlug;
    if (options.filter) params.filter = options.filter;
    if (options.limit) params.limit = String(options.limit);
    if (options.page) params.page = String(options.page);
    if (options.sort) params.sort = options.sort;
    if (options.maxPrice !== undefined) params.maxPrice = String(options.maxPrice);

    const res = await apiClient.get<ApiResponse<Product[]>>('/products', { params });
    const products = Array.isArray(res.data.data) ? res.data.data : [];
    const limit = options.limit || 40;
    const page = options.page || 1;
    const meta = res.data.meta || {
      total: products.length,
      page,
      limit,
      totalPages: Math.ceil(products.length / limit) || 1,
      hasMore: products.length === limit,
    };

    return {
      products,
      meta: {
        total: meta.total ?? products.length,
        page: meta.page ?? page,
        limit: meta.limit ?? limit,
        totalPages: meta.totalPages ?? (Math.ceil((meta.total ?? products.length) / limit) || 1),
        hasMore: meta.hasMore ?? (products.length === limit),
      },
    };
  },

  async getNewArrivals(): Promise<Product[]> {
    return this.getProducts(undefined, 'new-arrivals');
  },

  async getProductById(id: string): Promise<Product> {
    const res = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return res.data.data;
  },

  async getSellerStorefront(sellerId: string): Promise<{
    seller: {
      id: string;
      name: string;
      storeName?: string | null;
      storeDescription?: string | null;
      storeImageUrl?: string | null;
    };
    products: Product[];
  }> {
    const res = await apiClient.get<
      ApiResponse<{
        seller: {
          id: string;
          name: string;
          storeName?: string | null;
          storeDescription?: string | null;
          storeImageUrl?: string | null;
        };
        products: Product[];
      }>
    >(`/sellers/${sellerId}/products`);
    return res.data.data;
  },

  async getCatalogProducts(): Promise<Product[]> {
    const res = await apiClient.get<ApiResponse<Product[]>>('/products/catalog');
    return res.data.data;
  },

  // Cart operations (Guest)
  async getCart(sessionId: string): Promise<Cart> {
    const res = await apiClient.get<ApiResponse<Cart>>(`/cart/${sessionId}`);
    return res.data.data;
  },

  async addToCart(
    sessionId: string,
    productId: string,
    quantity: number = 1,
    selectedAttributes?: Record<string, any>
  ): Promise<CartItem> {
    const res = await apiClient.post<ApiResponse<CartItem>>('/cart', {
      sessionId,
      productId,
      quantity,
      selectedAttributes,
    });
    return res.data.data;
  },

  async removeFromCart(sessionId: string, productId: string): Promise<{ message: string }> {
    const res = await apiClient.delete<ApiResponse<{ message: string }>>(`/cart/${sessionId}/${productId}`);
    return res.data.data;
  },

  // Checkout (Guest)
  async checkout(input: CheckoutInput): Promise<CheckoutResult> {
    const res = await apiClient.post<ApiResponse<CheckoutResult>>('/checkout', input);
    return res.data.data;
  },
};
