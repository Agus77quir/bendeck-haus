import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  userBusiness: 'bendeck_tools' | 'lusqtoff' | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setUserBusiness: (business: 'bendeck_tools' | 'lusqtoff' | null) => void;
  setIsLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isAdmin: false,
  userBusiness: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setIsAdmin: (isAdmin) => set({ isAdmin }),
  setUserBusiness: (userBusiness) => set({ userBusiness }),
  setIsLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ 
    user: null, 
    session: null, 
    isAdmin: false, 
    userBusiness: null, 
    isLoading: false 
  }),
}));
