import { create } from 'zustand';

// Define the user store state type
interface UserState {
  user: any | null;
  setUser: (user: any | null) => void;
  clearUser: () => void;
}

// Create the user store
export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
})); 