import { create } from 'zustand';
import type { Tables } from '@/integrations/supabase/types';

export type Product = Tables<'products'>;
export type Customer = Tables<'customers'>;

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  unitPrice: number;
  total: number;
}

interface CartStore {
  items: CartItem[];
  selectedCustomer: Customer | null;
  paymentMethod: 'cash' | 'card' | 'transfer' | 'account' | null;
  notes: string;
  
  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setPaymentMethod: (method: 'cash' | 'card' | 'transfer' | 'account' | null) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  
  // Computed
  getSubtotal: () => number;
  getTotalDiscount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  selectedCustomer: null,
  paymentMethod: null,
  notes: '',

  addItem: (product, quantity = 1) => {
    const { items } = get();
    const existingItem = items.find(item => item.product.id === product.id);

    if (existingItem) {
      set({
        items: items.map(item =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
                total: (item.quantity + quantity) * item.unitPrice * (1 - item.discount / 100),
              }
            : item
        ),
      });
    } else {
      const unitPrice = Number(product.sale_price);
      set({
        items: [
          ...items,
          {
            product,
            quantity,
            discount: 0,
            unitPrice,
            total: quantity * unitPrice,
          },
        ],
      });
    }
  },

  removeItem: (productId) => {
    set({ items: get().items.filter(item => item.product.id !== productId) });
  },

  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId);
      return;
    }

    set({
      items: get().items.map(item =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              total: quantity * item.unitPrice * (1 - item.discount / 100),
            }
          : item
      ),
    });
  },

  updateDiscount: (productId, discount) => {
    set({
      items: get().items.map(item =>
        item.product.id === productId
          ? {
              ...item,
              discount: Math.min(100, Math.max(0, discount)),
              total: item.quantity * item.unitPrice * (1 - Math.min(100, Math.max(0, discount)) / 100),
            }
          : item
      ),
    });
  },

  setCustomer: (customer) => set({ selectedCustomer: customer }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setNotes: (notes) => set({ notes }),

  clearCart: () => set({
    items: [],
    selectedCustomer: null,
    paymentMethod: null,
    notes: '',
  }),

  getSubtotal: () => {
    return get().items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  },

  getTotalDiscount: () => {
    return get().items.reduce((acc, item) => {
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemDiscount = itemSubtotal * (item.discount / 100);
      return acc + itemDiscount;
    }, 0);
  },

  getTotal: () => {
    return get().items.reduce((acc, item) => acc + item.total, 0);
  },

  getItemCount: () => {
    return get().items.reduce((acc, item) => acc + item.quantity, 0);
  },
}));
