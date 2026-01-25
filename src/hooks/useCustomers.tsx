import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useBusinessStore } from '@/stores/businessStore';
import { useAuthStore } from '@/stores/authStore';
import type { Tables } from '@/integrations/supabase/types';

export type Customer = Tables<'customers'>;

export const useCustomers = (searchTerm: string = '') => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedBusiness } = useBusinessStore();
  const { isAdmin } = useAuthStore();

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from('customers')
          .select('*')
          .eq('active', true)
          .order('name');

        if (selectedBusiness && !isAdmin) {
          query = query.eq('business', selectedBusiness);
        }

        const { data, error } = await query;

        if (error) {
          console.error('Error fetching customers:', error);
          return;
        }

        setCustomers(data || []);
      } catch (error) {
        console.error('Error fetching customers:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomers();
  }, [selectedBusiness, isAdmin]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    
    const term = searchTerm.toLowerCase();
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(term) ||
      customer.code.toLowerCase().includes(term) ||
      customer.email?.toLowerCase().includes(term) ||
      customer.phone?.includes(term)
    );
  }, [customers, searchTerm]);

  return {
    customers: filteredCustomers,
    allCustomers: customers,
    isLoading,
  };
};
