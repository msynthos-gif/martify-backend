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
  async getProducts(categorySlug?: string, filter?: string): Promise<Product[]> {
    const params: Record<string, string> = {};
    if (categorySlug && categorySlug !== 'all') params.category = categorySlug;
    if (filter) params.filter = filter;
    const res = await apiClient.get<ApiResponse<Product[]>>('/products', { params });
    return res.data.data;
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
