import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BusinessType = 'bendeck_tools' | 'lusqtoff' | null;

interface BusinessStore {
  selectedBusiness: BusinessType;
  setSelectedBusiness: (business: BusinessType) => void;
  clearBusiness: () => void;
}

export const useBusinessStore = create<BusinessStore>()(
  persist(
    (set) => ({
      selectedBusiness: null,
      setSelectedBusiness: (business) => set({ selectedBusiness: business }),
      clearBusiness: () => set({ selectedBusiness: null }),
    }),
    {
      name: 'bendeck-business-store',
    }
  )
);
