import { create } from 'zustand';
import { Product } from '../services/productService';
import { CartItem } from '../types/medicineTypes';

interface CartState {
  // State
  items: CartItem[];
  prescriptionUrl: string | null;
  uploadingPrescription: boolean;
  isExpanded: boolean; // For FAB state

  // Actions
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
  getCartItem: (productId: string) => CartItem | undefined;
  
  // Prescription actions
  setPrescriptionUrl: (url: string | null) => void;
  setUploadingPrescription: (uploading: boolean) => void;
  clearPrescription: () => void;
  
  // FAB actions
  toggleFAB: (expanded: boolean) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  // Initial state
  items: [],
  prescriptionUrl: null,
  uploadingPrescription: false,
  isExpanded: false,

  // Cart actions
  addToCart: (product: Product, quantity: number = 1) => {
    set(state => {
      const existingItem = state.items.find(item => item.product._id === product._id);
      
      if (existingItem) {
        // Update existing item quantity
        const updatedCart = state.items.map(item =>
          item.product._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        return { items: updatedCart };
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          product,
          quantity,
        };
        return { items: [...state.items, newItem] };
      }
    });
  },

  removeFromCart: (productId: string) => {
    set(state => ({
      items: state.items.filter(item => item.product._id !== productId)
    }));
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeFromCart(productId);
      return;
    }

    set(state => ({
      items: state.items.map(item =>
        item.product._id === productId
          ? { ...item, quantity }
          : item
      )
    }));
  },

  clearCart: () => {
    set({ items: [], prescriptionUrl: null });
  },

  getCartTotal: () => {
    const { items } = get();
    return items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  },

  getCartItemCount: () => {
    const { items } = get();
    return items.reduce((count, item) => count + item.quantity, 0);
  },

  getCartItem: (productId: string) => {
    const { items } = get();
    return items.find(item => item.product._id === productId);
  },

  // Prescription actions
  setPrescriptionUrl: (url: string | null) => {
    set({ prescriptionUrl: url });
  },

  setUploadingPrescription: (uploading: boolean) => {
    set({ uploadingPrescription: uploading });
  },

  clearPrescription: () => {
    set({ prescriptionUrl: null });
  },

  // FAB actions
  toggleFAB: (expanded: boolean) => {
    set({ isExpanded: expanded });
  },
})); 