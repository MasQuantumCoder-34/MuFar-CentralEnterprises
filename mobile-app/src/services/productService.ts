import api from './api';
import { Product, ProductFilters, PaginatedResponse, Category } from '../types';

export const productService = {
  async getProducts(
    params: ProductFilters = {}
  ): Promise<PaginatedResponse<Product>> {
    const cleanParams: Record<string, string | number> = {};
    if (params.categoryId) cleanParams.categoryId = params.categoryId;
    if (params.search) cleanParams.search = params.search;
    if (params.minPrice !== undefined) cleanParams.minPrice = params.minPrice;
    if (params.maxPrice !== undefined) cleanParams.maxPrice = params.maxPrice;
    if (params.sort) cleanParams.sort = params.sort;
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;

    const response = await api.get<PaginatedResponse<Product>>('/products', {
      params: cleanParams,
    });
    return response.data;
  },

  async getProductById(id: string): Promise<Product> {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  async searchProducts(query: string): Promise<Product[]> {
    const response = await api.get<Product[]>('/products/search', {
      params: { q: query },
    });
    return response.data;
  },

  async getCategories(): Promise<Category[]> {
    const response = await api.get<Category[]>('/categories');
    return response.data;
  },

  async getCategoryById(id: number): Promise<Category> {
    const response = await api.get<Category>(`/categories/${id}`);
    return response.data;
  },

  async getFeaturedProducts(): Promise<Product[]> {
    const response = await api.get<Product[]>('/products/featured');
    return response.data;
  },

  async getRecentProducts(limit = 10): Promise<Product[]> {
    const response = await api.get<Product[]>('/products/recent', {
      params: { limit },
    });
    return response.data;
  },
};

export default productService;
