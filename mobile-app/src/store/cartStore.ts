import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from '../types';
import cartService from '../services/cartService';

interface CartState {
  items: CartItem[];
  isSyncing: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  syncWithBackend: () => Promise<void>;
  loadFromBackend: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isSyncing: false,

      addItem: (item: CartItem) => {
        const existing = get().items.find(
          (i) => i.productId === item.productId
        );
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
        cartService.addToCart(item.productId, item.quantity).catch(() => {});
      },

      removeItem: (productId: number) => {
        set({ items: get().items.filter((i) => i.productId !== productId) });
        cartService.removeCartItem(productId).catch(() => {});
      },

      updateQuantity: (productId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        });
        cartService.updateCartItem(productId, quantity).catch(() => {});
      },

      clearCart: () => {
        set({ items: [] });
        cartService.clearCart().catch(() => {});
      },

      getTotal: () => {
        return get().items.reduce((sum, item) => {
          const price = item.product.offerPrice || item.product.price;
          return sum + price * item.quantity;
        }, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      syncWithBackend: async () => {
        const { items } = get();
        if (items.length === 0) return;
        set({ isSyncing: true });
        try {
          await cartService.syncCart(
            items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
          );
        } catch {
          // silent fail
        } finally {
          set({ isSyncing: false });
        }
      },

      loadFromBackend: async () => {
        set({ isSyncing: true });
        try {
          const serverItems = await cartService.getCart();
          if (serverItems.length > 0) {
            set({ items: serverItems });
          }
        } catch {
          // keep local items
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
