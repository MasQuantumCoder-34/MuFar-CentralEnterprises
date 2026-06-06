import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem } from '../types';
import cartService from '../services/cartService';

const getProductId = (item: CartItem): string => {
  return typeof item.product === 'string' ? item.product : item.product._id;
};

interface CartState {
  items: CartItem[];
  isSyncing: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (product: string) => void;
  updateQuantity: (product: string, quantity: number) => void;
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
        const itemId = getProductId(item);
        const existing = get().items.find(
          (i) => getProductId(i) === itemId
        );
        if (existing) {
          set({
            items: get().items.map((i) =>
              getProductId(i) === itemId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, item] });
        }
        cartService.addToCart(itemId, item.quantity).catch(() => {});
      },

      removeItem: (product: string) => {
        set({ items: get().items.filter((i) => getProductId(i) !== product) });
        cartService.removeCartItem(product).catch(() => {});
      },

      updateQuantity: (product: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(product);
          return;
        }
        set({
          items: get().items.map((i) =>
            getProductId(i) === product ? { ...i, quantity } : i
          ),
        });
        cartService.updateCartItem(product, quantity).catch(() => {});
      },

      clearCart: () => {
        set({ items: [] });
        cartService.clearCart().catch(() => {});
      },

      getTotal: () => {
        return get().items.reduce((sum, item) => {
          const productData = typeof item.product === 'object' ? item.product : null;
          const price = productData ? (productData.offerPrice || productData.price) : 0;
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
            items.map((i) => ({ productId: getProductId(i), quantity: i.quantity }))
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
