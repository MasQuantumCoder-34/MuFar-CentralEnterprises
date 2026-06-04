import api from './api';
import { CartItem } from '../types';

export const cartService = {
  async getCart(): Promise<CartItem[]> {
    const response = await api.get<{ items: CartItem[] }>('/cart');
    return response.data.items;
  },

  async addToCart(productId: number, quantity: number): Promise<void> {
    await api.post('/cart/items', { productId, quantity });
  },

  async updateCartItem(productId: number, quantity: number): Promise<void> {
    await api.put(`/cart/items/${productId}`, { quantity });
  },

  async removeCartItem(productId: number): Promise<void> {
    await api.delete(`/cart/items/${productId}`);
  },

  async clearCart(): Promise<void> {
    await api.delete('/cart');
  },

  async syncCart(items: { productId: number; quantity: number }[]): Promise<void> {
    await api.post('/cart/sync', { items });
  },
};

export default cartService;
