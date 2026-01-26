import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessStore } from '@/stores/businessStore';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/integrations/supabase/types';

export type Product = Tables<'products'>;

export const useProducts = (searchTerm: string = '') => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { selectedBusiness } = useBusinessStore();
  const { isAdmin } = useAuthStore();

  const refetch = () => {
    setRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('products')
          .select('*')
          .eq('active', true)
          .order('name');

        if (selectedBusiness && !isAdmin) {
          query = query.eq('business', selectedBusiness);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching products:', error);
          return;
        }

        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [selectedBusiness, isAdmin, refreshKey]);

  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return products;
    
    const term = searchTerm.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.code.toLowerCase().includes(term) ||
      product.description?.toLowerCase().includes(term)
    );
  }, [products, searchTerm]);

  return {
    products: filteredProducts,
    allProducts: products,
    isLoading,
    refetch,
  };
};
